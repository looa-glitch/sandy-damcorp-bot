const { Activity, ActivityTypes, BotAdapter, ConversationReference, TurnContext, ResourceResponse } = require('botbuilder');
var helper = require('../helper/helper')
const trackMgr = require('../helper/trackingManager')
var config = require('../constant').config
const entities = require('entities')
const axios = require('axios')
const moment = require('moment')
const fs = require('fs')
const session = require('express-session')
const uuid = require('uuid/v4')
const httpContext = require('express-http-context')
module.exports = class WhatsappAdapter extends BotAdapter {
    constructor(){
        super();
    }

    init(botkit){
        super.init(botkit)
    }

    async reply(message){
        message.text = entities.decodeXML(message.text)
        helper.logInfo(JSON.stringify(message))
        if(["development", "production", "glitch"].indexOf(process.env.NODE_ENV) !== -1){
            if(message.text != ""){
                let options = {
                    method: "post",
                    url: config.whatsappApi + "whatsapp/sendText",
                    data: {
                        to: ["+", message.recipient.id].join(""),
                        message: message.text,
                        token: config.token
                    }
                }
                trackMgr.log("message-out", options)
                await helper.api(options).then(resp => {

                })
                .catch(err => {
                    trackMgr.logInfo(err)
                })
            }
        }
    }

    processMedia(message){
        return new Promise((resolve, reject) => {
            let waMessage = message.messages[0]
            let type = waMessage.type
            helper.logInfo(`Process media type ${type} with mediaID ${waMessage[type].id}`)
            
            helper.api({
                method: 'get',
                url: config.whatsappApi + 'whatsapp/downloadMedia',
                params: {
                    id: waMessage[type].id,
                    token: config.token
                }
            })
            .then(resp => {
                if(type == "image"){
                    helper.uploadImage(resp.data.data).then(result => resolve(result)).catch(err => reject(err))
                } else {
                    let filename = `vn-${message.contacts[0].wa_id}-${moment().unix()}.ogg`
                    fs.writeFile(__dirname + '/../resources/' + filename, resp.data.data, 'base64', (err) => {
                        if(err){
                            reject(err)
                        } else{
                            helper.transcriptVoice(filename).then(transcript => {
                                // util.deleteFile('./resources/' + filename)
                                resolve(transcript)
                            }).catch(err => {
                                reject(err)
                            })
                        }
                    })
                }
            })
            .catch(err => {
                reject(err.message)
            })
        })
    }

    async processActivity(req, res, next) {
        session.reqId = uuid()
		httpContext.set("reqId", uuid())
        helper.logRequestIn(req)
        let body = req.body
        if(body.messages){
            trackMgr.log('message-in', body)
            if (body.messages[0].from.substring(0, 3) != "000") {
                res.status(200).send("OK")
                var activity = {
                    timestamp: new Date(),
                    channelId: 'webhook',
                    conversation: {
                        id: body.contacts[0].wa_id
                    },
                    from: {
                        id: body.messages[0].from,
                        name: body.contacts[0].profile.name
                    },
                    recipient: {
                        id: 'bot'
                    },
                    messageId: body.messages[0].id,
                    channelData: body,
                    text: null,
                    type: 'message'
                }

                var messageType = body.messages[0].type
                activity.messageType = messageType
                if(messageType == "text"){
                    activity.text = body.messages[0][messageType].body
                } else if(messageType == "location"){
                    activity.text = body.messages[0][messageType].latitude + "," + body.messages[0][messageType].longitude
                    activity.location = body.messages[0][messageType]
                } else {
                    return
                }

                activity.channelData.botkitEventType = 'message'
                var context = new TurnContext(this, activity)
        
                context.turnState.set('httpStatus', 200)
        
                await super.runMiddleware(context, next)
            }else {
                res.status(200).send("OK")        
            }
        } else if(body.statuses){
            trackMgr.log('update-message-status', body)
            ltmMetrix.updateMessageStatus(body.statuses)
            .then(() => {
                res.status(200).send("OK")
            }).catch(err => {
                trackMgr.logInfo("failed update message status", err)
                res.status(200).send("OK")
            })
        } else{
            res.status(200).send("OK")
        }

    }

    async sendActivities(context, activities){
        var responses = []
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];

            let message = this.activityToMessage(activity);
            await this.delay(1000)
            const channel = context.activity.channelId;

            if (channel === 'websocket') {
                // If this turn originated with a websocket message, respond via websocket
                var ws = clients[activity.recipient.id];
                if (ws && ws.readyState === 1) {
                    try {
                        ws.send(JSON.stringify(message));
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    console.error('Could not send message, no open websocket found');
                }
            } else if (channel === 'webhook') {
                this.reply(activity)
                // if this turn originated with a webhook event, enqueue the response to be sent via the http response
                let outbound = context.turnState.get('httpBody');
                if (!outbound) {
                    outbound = [];
                }
                outbound.push(message);
                context.turnState.set('httpBody', outbound);
            }
        }
        return responses
    }

    async activityToMessage(activity){
        let message = {
            type: activity.type,
            text: activity.text
        };

        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function(key) {
                message[key] = activity.channelData[key];
            });
        }

        // console.log('OUTGOING > ', message);
        return message;
    }

    async delay(time){
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, time)
        })
    }

    // static async updateActivity(context, activit) {
    //     console.log('Web adapter does not support updateActivity.');
    // }
};
