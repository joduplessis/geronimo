const request = require('request');
const constants = require('./constants');
const messenger = require('./messenger');
const utils = require('./utils');
const moment = require('moment');
const async = require('async');

module.exports = {
	default: (psid, text) => {
		return {
			recipient: {
				id: psid
			},
			message: {
				text,
			}
		}
	},

    // Sender actions indate that we are typing
    sender_action: (psid) => {
		return {
			recipient: {
				id: psid
			},
			sender_action: 'typing_on'
		}
	},

    // Creates a list of products to present in a carousel
    // This is the list that is returned from our SQL,
    // We're jsut formatting it here
	items: (psid, el) => {
		elements = [];

		// Go through and prep the carousel
		for (let p=0; p < el.length; p++) {
            const productName = el[p][0].value.charAt(0).toUpperCase() + el[p][0].value.slice(1);
            const productImage = el[p][1].value;
            const productDescription = el[p][2].value.charAt(0).toUpperCase() + el[p][2].value.slice(1);

            // Add each element to the carousel
            // The buy now button doesn't do anything right now
			elements.push({
				title: productName,
				subtitle: productDescription,
				image_url: productImage,
				buttons: [
					{
		                type: 'postback',
		                title: 'Buy Now',
		                payload: 'NONE'
					},
					{
		                type: 'postback',
		                title: 'Home',
		                payload: 'NONE'
					}
				]
			});
		}

		return {
			recipient: {
				id: psid
			},
			message: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'generic',
						elements: elements
					}
				},
			}
		}
	},

    // Any servers that we interact with need to be whitelisted for FB
	thread: {
        greeting: [
			{
				locale: "default",
				text: "GERONIMO"
			}
		],
		get_started: {
			payload: 'WELCOME'
		},
        whitelisted_domains: [
			constants.IMAGE_SERVER,
		],
		persistent_menu: [
			{
				locale: 'default',
				composer_input_disabled: false,
				call_to_actions: [
					{
		                type: 'postback',
		                title: 'Test the WELCOME postback',
		                payload: 'WELCOME'
					},
				]
			}
		]
	},
}
