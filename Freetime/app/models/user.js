var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
	google: {
		id:String,
		token:String,
	
		email:String,
		name:String,
		groups:[String]
	}
});
module.exports = mongoose.model('User', userSchema);