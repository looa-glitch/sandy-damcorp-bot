const mongoose = require('mongoose')
var Schema = mongoose.Schema;
var botstorage = new Schema({
    _id: String,
    dt: Date,
    state: Object
}, { collection: "botstorage" })
const model = mongoose.model("botstorage", botstorage)
module.exports = model