const config = require('../constant').config
const helper = require('../helper/helper')
const moment = require('moment')
const uniqid = require('uniqid')
const _ = require('lodash')
/* Model */
const bs = require('../model/botstorage')

class botStorageController {

    static async deleteSession(id){
        return new Promise((resolve, reject) => {
            bs.deleteOne( {'_id': `${id}`})
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    }
    static async getSessionById(id){
        return new Promise((resolve, reject) => {
            bs.findOne({
                _id: id
            }).lean()
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    }

}

module.exports = botStorageController