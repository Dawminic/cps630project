/*
	ROUTE.JS
		Responsible for the routing of our app.
		(The sequence of how we get from page to page)
*/

//load our user and group models
var User = require('./models/user');
var Group = require('./models/group');
var Meeting = require('./models/meeting');
var configAuth = require('./../config/auth');
//-- UNSURE HOW TO USE GOOGLE CALENDER MODULE AT THE MOMENT
var google = require('googleapis');
var GoogleStrategy  = require('passport-google-oauth').OAuth2Strategy;
var gcal = require('google-calendar');
require('datejs');


module.exports = function(app, passport){
//HOME PAGE

	app.get('/', function(req,res){
		res.render("index.ejs");
	});

//PROFILE PAGE

	app.get('/profile',isLoggedIn,function(req,res){
		res.render('profile.ejs',{user: req.user});
	});

	//When the user clicks button to create form
	app.post('/profile',function(req,res){
		//Get form data
		var user = req.user;
		var groupName = req.body.groupName;
        var groupEmails = req.body.groupEmails.split(",");
		userEmail = user.google.email;
		//Create a new group
		var newGroup = new Group();
		newGroup.name = groupName;
		newGroup.members.push(userEmail);

        for(i=0; i<groupEmails.length; i++){
			newGroup.members.push(groupEmails[i]);

			//Send group notification to users in group
			User.findOne({"google.email": groupEmails[i]}, function (err, groupMember){
				if (err)
					return done(err);
				else
					groupMember.google.notifications.groupNotif += 1;
					groupMember.save();
			});
        }

		//save the Group
		newGroup.save(function(err){
			if(err){
				console.log(err);
			} else {
				//once group is saved add the group to the users list of groups.
				user.google.groups.push({groupname: groupName,groupID: newGroup.id});
				user.save();

				for(i=0; i<groupEmails.length; i++) {
					User.findOne({"google.email": groupEmails[i]}, function (err, groupMember){
						if (err)
							return done(err);
						else
						{
							groupMember.google.groups.push({groupname: groupName,groupID: newGroup.id});
							groupMember.save();
						}
					});
				}
				//go to the groupProfile page. (use group's id in url)
				res.redirect('/groupProfile/'+newGroup.id);
			}
    	});
	});

	// GROUP PROFILE PAGE
		app.get('/groupProfile/:groupID',isLoggedIn,function(req,res){
		// get the group ID from the url parameter
		var groupID = req.params.groupID;
		var user = req.user;
		// using the groupID find the corresponding group in our database
			// so that we can use that information on the page ect.
		Group.findById(groupID, function(err,group){
				// load our groupProfile template using the group found in query.
				res.render('groupProfile.ejs',{group: group, user: user});
			});
		});
		
		// get and use information when user creates a new meeting request
		app.post('/groupProfile/:groupID',isLoggedIn,function(req,res){
			var groupID = req.params.groupID;
			Group.findById(groupID, function(err,group){
				var  newMeeting = new Meeting();
				
				//Parse Date
				var start = req.body.dateMin.split("/");
				var end = req.body.dateMax.split("/");
				//Start dates
				var startmonth = parseInt(start[0]);
				var startday = parseInt(start[1]);
				var startyear = parseInt(start[2]);
				//End dates
				var endmonth = parseInt(end[0]);
				var endday = parseInt(end[1]);
				var endyear = parseInt(end[2]);

				var beginTime = req.body.timeMin;
				var endTime =  req.body.timeMax;
				var beginSplit = beginTime.split(":");
				var endSplit = endTime.split(":");
				var beginHour = parseInt(beginSplit[0]);
				var beginMinute;
					//If minutes is '0', make it '00', else leave it as is
					if(parseInt(beginSplit[1].substring(0,2)) == 0) {
						beginMinute = "00";
					}
					else
						beginMinute = parseInt(beginSplit[1].substring(0,2));
				var beginSecond = "00";
				var beginFinal;

				var endHour = parseInt(endSplit[0]);
				var endMinute;
					//If minutes is '0', make it '00', else leave it as is
					if(parseInt(endSplit[1].substring(0,2)) == 0) {
						endMinute = "00";
					}
					else
						endMinute = parseInt(endSplit[1].substring(0,2));
				var endSecond = "00";
				var endFinal;

				var beginTimeOfDay = beginSplit[1].length - 2;
				var endTimeOfDay = endSplit[1].length - 2;


				//Freebusy query should be in the form: '2016-02-29T10:30:00.0z

				if (parseInt(startmonth) < 10){
					startmonth = "0" + startmonth;
				}

				if (parseInt(startday) < 10){
					startday = "0" + startday;
				}

				if (parseInt(endmonth) < 10){
					endmonth = "0" + endmonth;
				}

				if (parseInt(endday) < 10){
					endday = "0" + endday;
				}

				if (beginTimeOfDay == 'p' && beginHour != 12){
					beginHour = beginHour + 12;
					startTime = beginHour + ":" + beginMinute;
					beginFinal = startTime + ":" + beginSecond;
				}

				else{
					startTime = "0" + beginHour + ":" + beginMinute;
					beginFinal = startTime + ":" + beginSecond;
				}

				if (beginTimeOfDay== "a" && beginHour == 12) {
					beginHour = 0;
					startTime = "0" + beginHour + ":" + beginMinute;
					beginFinal = startTime + ":" + beginSecond;
				}
				
				/////-----
				if (endTimeOfDay == 'p' && endHour != 12){
					endHour = endHour + 12;
					endTime = endHour + ":" + endMinute;
					endFinal = endTime + ":" + endSecond;
				}

				else{
					endTime = "0" + endHour + ":" + endMinute;
					endFinal = endTime + ":" + endSecond;
				}

				if (endTimeOfDay== "a" && endHour == 12) {
					endHour = 0;
					endTime = "0" + endHour + ":" + endMinute;
					endFinal = endTime + ":" + endSecond;
				}

				

				var fbTimeMin = startyear +"-"+startmonth+"-" +startday+"T"+beginFinal+".0z";
				var fbTimeMax = endyear +"-"+endmonth+"-" +endday+"T"+endFinal+".0z";
				newMeeting.timeMax = fbTimeMax;
				newMeeting.timeMin = fbTimeMin;
				newMeeting.name = req.body.meetingName;
				newMeeting.startDay = req.body.dateMin;
				newMeeting.endDay = req.body.dateMax;
				newMeeting.startTime = startTime;
				newMeeting.endTime = endTime;
				newMeeting.group = groupID;
				newMeeting.meetingMembers = group.members;
				newMeeting.duration = req.body.meetingDuration;
				newMeeting.save(function(err){
					if(err){
						console.log(err);
					} else {
						group.meetings.push({meetingName:newMeeting.name, meetingID:newMeeting.id});
						group.save();
						res.redirect('/meetingPage/' + groupID +"/" + newMeeting.id);
					}
				});
			});
		});


		// WHEN USER GENERATES THIER FREEBUSY QUERY ADD IT TO THE DATABASE
		app.post('/getauth/:meetingID', function (req, res) {
			var meetingID = req.params.meetingID;
			var userBusy = req.body.busy;
            var userEmail = req.user.google.email;
			Meeting.findById(meetingID, function(err,meeting){
				meeting.membersAccepted.push({email:userEmail, busy: userBusy});
				meeting.save();
				console.log("Meeting Saved!");
				console.log(userBusy);
			});
		});

	//MEETING PAGE
	app.get('/meetingPage/:groupID/:meetingID',isLoggedIn,function(req,res){
		var groupID = req.params.groupID;
		var meetingID = req.params.meetingID;
		var user = req.user;
		Meeting.findById(meetingID, function(err,meeting){
			// load our meetingPage template using the meeting found in query.

			var startDate = meeting.startDay + " "+meeting.startTime;
			var endDate = meeting.endDay + " " + meeting.endTime;

			res.render('meetingPage.ejs',{meeting: meeting, user: user});
		});

	});


//getFreetime page - displays possible meeting times
app.get('/getFreetime/:meetingID',isLoggedIn,function(req,res){
    //Find the days between start and end intervals
    var meetingID = req.params.meetingID;
    Meeting.findById(meetingID, function(err, meeting){
        // n = the difference in days (including the end day)
        var oneDay = 24*60*60*1000;
        var firstDate = new Date(meeting.startDay);
        var secondDate = new Date(meeting.endDay);
        var diffDays = Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)) + 1;

       /*  Create array representing every hour of each day within start and end intervals.
            true = no group member is busy during that hour
            false = at least one group member is busy during that hour
       */
        var n = diffDays * 24;
        var totalHours = [];
        for(var i = 0; i < n; i++){
            totalHours[i] = true;
        }

        // set all the hours prior to the starting hour to false
        var startTime = meeting.startTime;
        var startHour = startTime.substring(0,2);
        console.log(startHour);
        for(var i = 0; i < startHour; i++){
            totalHours[i]= false;
        }

        // set all the hours after the ending hour to false
        var endTime = meeting.endTime;
        var endHour = endTime.substring(0,2);
        var endHour = endHour + ((diffDays - 1) * 24);
        console.log(endHour);
        for(var i = n; i > endHour; i--){
            totalHours[i]= false;
        }

        //go through each user's busy time and set value to false when necessary




    });





	res.render('getFreetime.ejs');
});



//LOGOUT
	// when the user clicks the logout button:
		// logout session and send them back to hoome page.
	app.get('/logout',function(req, res){
		req.logout();
		res.redirect('/');

	});



	// =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    // also ask permission to use google calendar API.
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar'] }));
    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
            passport.authenticate('google', {
                    successRedirect : '/profile',
                    failureRedirect : '/'
            }));
}


//Check to make sure the user is logged in before moving on to next step.
function isLoggedIn(req,res,next){
	if(req.isAuthenticated())
		return next();
	res.redirect('/');
}
