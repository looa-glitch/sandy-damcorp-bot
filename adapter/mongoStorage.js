const { MongoDbStorage } = require('botbuilder-storage-mongodb')

module.exports = class MongoStorageConversation extends MongoDbStorage {
    constructor(config){
        super(config);
    }
}