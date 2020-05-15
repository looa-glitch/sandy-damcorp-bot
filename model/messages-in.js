var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var msgin = new Schema({
    wa_id: String,
    message: String,
    thread_name: String,
    message_type: String,
    timestamp: Date
},{ collection: "messages_in" });

const model = mongoose.model("messages_in", msgin);
module.exports = model