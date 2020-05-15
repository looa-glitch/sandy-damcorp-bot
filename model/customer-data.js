var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customer = new Schema({
    wa_id: String,
    message: String,
    timestamp: Date
});

const model = mongoose.model("customer-data", customer);
module.exports = model