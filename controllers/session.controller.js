const config = require('../constant').config
const helper = require('../helper/helper')
const moment = require('moment')
const uniqid = require('uniqid')
const _ = require('lodash')
/* Model */
const session = require('../model/session')
class sessionController {

    static async createSession(waid){
        return new Promise((resolve, reject) => {
            session.create({
                waid: waid,
                time: moment().add(10, 'minute').format('X')
            }).then(result => resolve(result))
            .catch(err => reject(err))
        })
    }

    static async updateSession(waid){
        return new Promise((resolve, reject) => {
            session.findOneAndUpdate({
                waid: waid
            }, {
                $set: {
                    time: moment().add(10, 'minute').format('X')
                }
            })
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    }

    static async deleteSession(waid){
        return new Promise((resolve, reject) => {
            session.deleteOne( {'waid': `${waid}`})
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    }

    static async getSession(){
        return new Promise((resolve, reject) => {
            session
            .find({ time: { $lte: moment().format('X') } })
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    }

}

module.exports = sessionController