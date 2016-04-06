var mongoose = require('mongoose'); 
var groupSchema = mongoose.Schema({ 
		name: String, 
		members: [String],
		meetings:[String]
}); 
module.exports = mongoose.model('Group', groupSchema);