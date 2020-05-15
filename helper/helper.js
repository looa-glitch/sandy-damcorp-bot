const config = require('../constant').config
const moment = require('moment')
const axios = require('axios')
const uuid = require('uuid/v4')
const fs = require('fs');
const session = require('express-session')
const pjson = require('../package')
const trackMgr = require('./trackingManager')
const httpContext = require('express-http-context')

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
/* CDN Cloudinary */
const cloudinary = require('cloudinary')
cloudinary.config(config.cloudinary);
class helper {
    static timenow(timestamp = "", format = ""){
        let time = timestamp !== "" ? moment(timestamp).utcOffset(7) : moment().utcOffset(7)
        if(format != ""){
            time = time.format(format)
        }
        return time
    }

    static async logInfo(str, ...any){
        let reqId = session.reqId || "[no session]"
        console.log('[INFO]', this.timenow().toString(), "-", `app=${pjson.name}[${pjson.version}]`, "-", `session=${reqId}`, "-", str, ...any)
    }

    static async logRequestIn(req){
        let reqId = session.reqId || "[no session]"
        console.log('[INFO]', this.timenow().toString(), "-", `app=${pjson.name}[${pjson.version}]`, "-", `session=${reqId}`, "-", `Incoming request to ${req.path} [${req.method}] with headers={ ${this.jsonstr(req.headers)} }, params={ ${this.jsonstr(req.params)} }, query={ ${this.jsonstr(req.query)} }, body={ ${this.jsonstr(req.body)} }`)
    }

    static jsonstr(json){
        if(typeof json == "object"){
            return JSON.stringify(json).length > 2000 ? '(Content too long)' : JSON.stringify(json)
        } else {
            return json
        }
    }

    static async log(...any){
        this.logInfo(...any)
    }

    static async api(payload){
        let uid = uuid()
        return new Promise((resolve, reject) => {
            this.logInfo(`Request out [${uid}] to: ${payload.url} with data headers: ${this.jsonstr(payload.headers) || "{}"} body: ${this.jsonstr(payload.data) || "{}"}, params: ${JSON.stringify(payload.params) || "{}"}`)
            axios(payload).then(response => {
                let strResponse = this.jsonstr(response.data)
                trackMgr.log('request-out', { status: "success", requestSession: uid, payload: payload, response: response.data })
                this.logInfo(`Response In [${uid}]:`, strResponse.length > 10000 ? "(Response too long for log)" : strResponse)
                resolve(response)
            }).catch(err => {
                var { response, message, config } = err, data = response
                if(response && response.data){
                    if(response.headers['content-type'].indexOf('application/json') == -1){
                        data = this.jsonstr(response.data)
                    } else{
                        data = response.data
                    }
                }
                trackMgr.log('request-out', { status: "error", requestSession: uid, payload: payload, response: data, message: message })
                this.logInfo(`Response In [${uid}] Error`, err.message, data)
                reject(err)
            })
        })
    }

    static async transcriptVoice(name){
        return new Promise(async (resolve, reject) => {
            try {
                // Creates a client
                const client = new speech.SpeechClient();
    
                // The name of the audio file to transcribe
                const fileName = __dirname + '/../resources/' + name;
    
                // Reads a local audio file and converts it to base64
                const file = fs.readFileSync(fileName);
                const audioBytes = file.toString('base64');
    
                // The audio file's encoding, sample rate in hertz, and BCP-47 language code
                const audio = {
                    content: audioBytes,
                };
                const config = {
                    encoding: 'OGG_OPUS',
                    sampleRateHertz: 16000,
                    languageCode: 'id-ID',
                };
                const request = {
                    audio: audio,
                    config: config,
                };
    
                // Detects speech in the audio file
                // const [response] = await client.recognize(request)
                client.recognize(request).then(response => {
                    const transcription = response[0].results
                        .map(result => result.alternatives[0].transcript)
                        .join('\n');
                    console.log(`Transcription: ${transcription}`);
                    resolve(transcription)
                }).catch(err => {
                    reject(err)
                })
            } catch(err){
                reject(err)
            }
        })
    }
    
    static async uploadImage(data){
        return new Promise((resolve, reject) => {
            cloudinary.v2.uploader.upload(resp.data.data,  { folder: 'botkit-danone/' }, (error, result) => {
                if(error) reject(error)
                else resolve(result)
            })
        })
    }

    static buildAddress(geocodeResult){
        var level = geocodeResult.MatchLevel, finalAddress = "", address = geocodeResult.Location.Address
        switch(level){
            case "street":
                finalAddress = [address.Subdistrict, address.District, address.City, address.County + " " + address.PostalCode].join(", ")
                break
            case "houseNumber":
                finalAddress = [address.Street, address.HouseNumber, address.Subdistrict, address.District, address.City, address.County + " " + address.PostalCode].join(", ")
                break
            default:
                break
        }
        return finalAddress
    }

    static saveFallback(convo, message, result){
        return new Promise((resolve, reject) => {
            fallback.create({
                user: convo.vars.user,
                message: message,
                transcript: null,
                intent: result.intent,
                intents: result.classifications,
                entities: result.entities,
                sourceEntities: result.sourceEntities
            }).then(created => resolve(created))
            .catch(err => {
                helper.logInfo("failed create fallback for", message, `(${convo.vars.user}, ${convo.vars.uer_name})`)
                resolve(err)
            })
        })
    }
}

module.exports = helper