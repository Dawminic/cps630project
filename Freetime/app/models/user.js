var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
	google: {
		id:String,
		token:String,
		email:String,
		name:String,
		groups:[{groupname: String, groupID: String}],
		notifications: {
			groupNotif: Number,
			meetingNotif: Number
		}
	}
});
module.exports = mongoose.model('User', userSchema);
