//Test comment
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
		var userEmail = user.google.email; 
		//Create a new group
		var newGroup = new Group(); 
		newGroup.name = groupName;
		newGroup.members.push(userEmail);
        for(i=0; i<groupEmails.length; i++){
		  newGroup.members.push(groupEmails[i]);
        }
		
		//save the Group
		newGroup.save(function(err){
        if(err){
            console.log(err);
        } else {
        	//once group is saved add the group to the users list of groups. 
            user.google.groups.push(groupName);
            user.save();
            //go to the groupProfile page. (use group's id in url)
            res.redirect('/groupProfile/'+newGroup.id);
        }
    	});
	});

	// GROUP PROFILE PAGE 
		app.get('/groupProfile/:groupID',isLoggedIn,function(req,res){ 
		// get the group ID from the url parameter
		var groupID = req.params.groupID; 
		// using the groupID find the corresponding group in our database
			// so that we can use that information on the page ect.
		Group.findById(groupID, function(err,group){
			// load our groupProfile template using the group found in query. 
			res.render('groupProfile.ejs',{group: group});
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
			var fbTimeMin = startyear +"-"+startmonth+"-" +startday+"T"+req.body.timeMin+".0z"; 
			var fbTimeMax = endyear +"-"+endmonth+"-" +endday+"T"+req.body.timeMax+".0z"; 		        	
			newMeeting.timeMax = fbTimeMax; 
			newMeeting.timeMin = fbTimeMin; 
			newMeeting.name = req.body.meetingName;
			newMeeting.startDay = req.body.dateMin;
			newMeeting.endDay = req.body.dateMax; 
			newMeeting.startTime = req.body.timeMin; 
			newMeeting.endTime = req.body.timeMax;
			newMeeting.group = groupID;
			newMeeting.meetingMembers = group.members;
			
			newMeeting.save(function(err){
		        if(err){
		            console.log(err);
		        } else {
		        	group.meetings.push(newMeeting.id);
		        	group.save();
		            res.redirect('/meetingPage/' + groupID +"/" + newMeeting.id);
		        }




			});
		});
	});

		app.post('/getauth', function (req, res) {
			//console.log(req.body.busy);
		});

	//MEETING PAGE
	app.get('/meetingPage/:groupID/:meetingID',isLoggedIn,function(req,res){ 
		//console.log(req);
		var groupID = req.params.groupID;
		var meetingID = req.params.meetingID;
		Meeting.findById(meetingID, function(err,meeting){
			// load our groupProfile template using the group found in query. 
			res.render('meetingPage.ejs',{meeting: meeting});
		});

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
	res.redirect('/login');
}









