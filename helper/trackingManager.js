const pjson = require('../package')
const moment = require('moment')
const axios = require('axios')
const uuid = require('uuid/v4')
const session = require('express-session')
const config = require('../constant').config
const httpContext = require('express-http-context')

const { Client } = require('@elastic/elasticsearch')
if(config.elastic){
    const _elastic = new Client(config.elastic)
}

var winston  = require('winston');
var { Loggly } = require('winston-loggly-bulk');
if(config.loggly){
    winston.add(new Loggly({
        token: config.loggly.token,
        subdomain: config.loggly.domain,
        tags: [pjson.name, "info"],
        json: true
    }));
}

class trackingManager {
    static async info(...any){
        this.logInfo(...any)
    }

    static async logInfo(str, ...any){
        let reqId = session.reqId || "[no session]"
        console.log('[INFO]', this.timenow().toString(), "-", `app=${pjson.name}[${pjson.version}]`, "-", `session=${reqId}`, "-", str, ...any)
    }

    static timenow(timestamp = "", format = ""){
        let time = timestamp !== "" ? moment(timestamp).utcOffset(7) : moment().utcOffset(7)
        if(format != ""){
            time = time.format(format)
        }
        return time
    }

    static logglyInfo(type, data){
        let reqId = session.reqId || "[no session]", now = this.timenow()
        winston.info({ session: reqId, timestamp: now.format('X'), timestampStr: now.toString(), body: data }, { tags: type })
    }

    static elasticIndex(key, data) {
        let now = moment().utcOffset(7)
        data.logType = key
        data.session = session.reqId
        data.timestamp = now.format()
        _elastic.index({
            index: `${pjson.name}-${key}-${moment(now).format("YYYY-MM")}`,
            body: data
        }).catch(err => {
            // if(process.env.NODE_ENV != "local") this.logInfo(`[ERROR] failed save elastic index ${key} with message`, err.message, 'data:', data)
        })
    }

    static log(type, data, source = ['loggly', 'elastic']){
        if(typeof source == "string"){
            source = [source]
        }
        // if(source.indexOf('loggly') !== -1) this.logglyInfo(type, data)
        // if(source.indexOf('elastic') !== -1) this.elasticIndex(type, data)
    }
}

module.exports = trackingManager