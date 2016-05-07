var mongoose = require('mongoose');
var groupSchema = mongoose.Schema({
		name: String,
		members: [String],
		meetings:[{meetingName:String, startDay: String, endDay: String, startTime: String, endTime: String, meetingID:String}],
		created: Boolean
});
module.exports = mongoose.model('Group', groupSchema);