var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var session = new Schema({
	waid:  String,
    time: String,
},{ collection: "session" });

const model = mongoose.model("session", session);
module.exports = model