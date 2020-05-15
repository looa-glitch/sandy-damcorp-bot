var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var fallback = new Schema({
	name:  String,
	phone: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const model = mongoose.model("users", fallback);
module.exports = model