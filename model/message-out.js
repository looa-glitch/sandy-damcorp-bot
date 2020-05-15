var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var msgout = new Schema({
    to: String,
    message: String,
    message_type: String,
    message_id: String,
    timestamp: Date
},{ collection: "messages_out" });

const model = mongoose.model("messages_out", msgout);
module.exports = model