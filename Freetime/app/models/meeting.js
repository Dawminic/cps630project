var mongoose = require('mongoose');
var MeetingSchema = mongoose.Schema({
		name: String,
		startDay: String,
		endDay:String,
		startTime:String,
		endTime:String,
		timeMin:String,
		timeMax:String,
		duration: Number,
		meetingMembers:[String],
		membersAccepted: [{email: String, busy: Array}],
		group: String
});
module.exports = mongoose.model('Meeting', MeetingSchema);
