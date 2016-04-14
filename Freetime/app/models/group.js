var mongoose = require('mongoose');
var groupSchema = mongoose.Schema({
		name: String,
		members:[String]s,
		meetings:[{meetingName:String, meetingID:String}]
});
module.exports = mongoose.model('Group', groupSchema);
