const async = require('async')
const helper = require('../helper/helper')
const config = require("../constant").config;
const _ = require("lodash");
const moment = require('moment');
const consumers = require("../controllers/consumers.controller");
const sessionChat = require("../controllers/session.controller");
const msgin = require('../model/messages-in')
const customerData = require('../model/customer-data') 
module.exports = function (controller) {

	controller.plugins.cms.before("damcorp", "default", async(convo, bot) => {
		helper.log('CONVERSATION START')
			msg_in(bot,bot._config.activity.text,'start_conv')
			let ce = await check_expired(bot)

			if(ce == 'found') {
				convo.setVar('name',bot._config.activity.from.name)
				await convo.gotoThread('menu_utama')
			}
			else {
				await convo.gotoThread('default')
			}
    })
    
    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_default",
        async (response, convo, bot) => {
            msg_in(bot,response,'default')

            let ce = await check_expired(bot)
            if(ce == 'not_found') {
                let resp = response.toLowerCase()
                if(resp == '1' || resp == 'lanjut'){
                    consumers.createUser(bot._config.activity.from.name, bot._config.activity.from.id);
                    await convo.gotoThread('menu_utama')
                }
                else {
                    convo.gotoThread('consent_tidak_setuju')
                }
            }
            else {
                await convo.gotoThread('menu_utama')
            }
        }
    )

    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_consent_tidak_setuju",
        async (response, convo, bot) => {
            msg_in(bot,response,'reject_consent')

            let ce = await check_expired(bot)
                if(ce == 'not_found') {
                    switch(response.toLowerCase()) {
                        case 'lanjut': 
                            consumers.createUser(bot._config.activity.from.name, bot._config.activity.from.id);
                            await convo.gotoThread('menu_utama');
                        break
                        default:
                            convo.repeat()
                    }
                }
                else {
                    await convo.gotoThread('menu_utama')
                }
        }
    )
    
    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_menu_utama",
        async (response, convo, bot) => {
            msg_in(bot,response,'menu_utama')
            let ce = await check_expired(bot)

                if(ce == 'found') {
                    convo.setVar('name',response)
                    await convo.gotoThread('daftar_perusahaan')
                }
                else {
                    await convo.gotoThread('default')
                }
        }
    )

    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_daftar_perusahaan",
        async (response, convo, bot) => {
            msg_in(bot,response,'daftar_perusahaan')
            let ce = await check_expired(bot)

            if(ce == 'found') {
                convo.setVar('company',response)
                await convo.gotoThread('daftar_email')
            }
            else {
                await convo.gotoThread('default')
            }
        }
    )

    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_daftar_email",
        async (response, convo, bot) => {
            msg_in(bot,response,'daftar_email')
            let ce = await check_expired(bot)

            if(ce == 'found') {
                let email = await check_email(response)
                if(email == 'valid'){
                    convo.setVar('email',response)
                    await convo.gotoThread('location')
                }
                else{
                    await convo.gotoThread('email_tidak_valid')
                }
            }
            else {
                await convo.gotoThread('default')
            }
        }
    )

    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_email_tidak_valid",
        async (response, convo, bot) => {
            msg_in(bot,response,'email_tidak_valid')
            let ce = await check_expired(bot)

            if(ce == 'found') {
                let email = await check_email(response)
                if(email == 'valid'){
                    convo.setVar('email',response)
                    await convo.gotoThread('location')
                }
                else{
                    await convo.gotoThread('email_tidak_valid')
                }
            }
            else {
                await convo.repeat()
            }
        }
    )

    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_location",
        async (response, convo, bot) => {
            msg_in(bot,response,'location')
            let ce = await check_expired(bot)

            if(ce == 'found') {
                let messageType = bot._config.activity.messageType
                if(messageType == 'location'){
                    convo.setVar('location',response)
                    await convo.gotoThread('menu_cs')
                }else{
                    await convo.gotoThread('location_invalid')
                }
            }
            else {
                await convo.gotoThread('default')
            }
        }
    )

    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_invalid_location",
        async (response, convo, bot) => {
            msg_in(bot,response,'location_invalid')
            let ce = await check_expired(bot)

            if(ce == 'found') {
                let messageType = bot._config.activity.messageType
                if(messageType == 'location'){
                    convo.setVar('location',response)
                    await convo.gotoThread('menu_cs')
                }else{
                    await convo.repeat()
                }
            }
            else {
                await convo.gotoThread('default')
            }
        }
    )

    // controller.plugins.cms.onChange(
    //     "damcorp",
    //     "_answ_photo",
    //     async (response, convo, bot) => {
    //         msg_in(bot,response,'photo')
    //         let ce = await check_expired(bot)

    //         if(ce == 'found') {
    //             let messageType = bot._config.activity.messageType
    //             if(messageType == 'image'){
    //                 convo.setVar('image',response)
    //                 await convo.gotoThread('menu_cs')
    //             }else{
    //                 await convo.gotoThread('photo_invalid')
    //             }
    //         }
    //         else {
    //             await convo.gotoThread('default')
    //         }
    //     }
    // )

    // controller.plugins.cms.onChange(
    //     "damcorp",
    //     "_answ_invalid_photo",
    //     async (response, convo, bot) => {
    //         msg_in(bot,response,'location_invalid')
    //         let ce = await check_expired(bot)

    //         if(ce == 'found') {
    //             let messageType = bot._config.activity.messageType
    //             if(messageType == 'image'){
    //                 convo.setVar('image',response)
    //                 await convo.gotoThread('menu_cs')
    //             }else{
    //                 await convo.repeat()
    //             }
    //         }
    //         else {
    //             await convo.gotoThread('default')
    //         }
    //     }
    // )

    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_menu_cs",
        async (response, convo, bot) => {
            msg_in(bot,response,'menu_cs')
            let ce = await check_expired(bot)

            if(ce == 'found') {
                let dataCustomer = convo.vars
                let msg = `Nama: ${dataCustomer.name}, Perusahaan: ${dataCustomer.company}, Email: ${dataCustomer.email}, Location: ${dataCustomer.location}`
                save_data(bot,msg)
                await convo.gotoThread('end_menu_cs')
            }
            else {
                await convo.gotoThread('default')
            }
        }
    )

    controller.plugins.cms.onChange(
        "damcorp",
        "_answ_end_menu_cs",
        async (response, convo, bot) => {
            msg_in(bot,response,'location_invalid')
            let ce = await check_expired(bot)

            if(ce == 'found') {
                switch(response.toLowerCase()) {
                    case '0':
                        await convo.gotoThread('menu_utama');
                    break
                    default:
                        convo.repeat()
                }
            }
            else {
                await convo.gotoThread('default')
            }
        }
    )

	function check_expired(bot) {
        return new Promise(async (resolve, reject) => {
            sessionChat
            .updateSession(bot._config.activity.from.id)
            .then(async result => {
                console.log(result)
                if(result == null) {
                    sessionChat
                    .createSession(bot._config.activity.from.id)
                    .then(async result => {
                        console.log(result)
                        consumers
                        .getUserByPhone(bot._config.activity.from.id)
                        .then(async consumen => {
                            if(consumen) {
                                resolve('found')
                            }
                            else {
                                resolve('not_found')
                            }
                        })
                    })
                }
                else {
                    consumers
                    .getUserByPhone(bot._config.activity.from.id)
                    .then(async consumen => {
                        if(consumen) {
                            resolve('found')
                        }
                        else {
                            resolve('not_found')
                        }
                    })
                }
            })
        })
    }

    function check_email(res) {
        return new Promise(async (resolve, reject) => {
            const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if(res.match(mailformat)){
                resolve('valid')
            }else{
                resolve('not_valid')
            }
        })
    }

	function msg_in(bot,msg,tn){
        let now = moment().format()
        let activity = bot._config.activity
        console.log(activity)
        msgin.create({
            wa_id: activity.from.id,
            message: msg,
            thread_name: tn,
            message_type: activity.messageType,
            timestamp: now
        }).catch(err => {

        })
    }

    function save_data(bot,msg){
        let now = moment().format()
        let activity = bot._config.activity
        console.log(msg);
        customerData.create({
            wa_id: activity.from.id,
            message: msg,
            timestamp: now
        }).catch(err =>{

        })
    }
}