const request = require('request');
const constants = require('./constants');

module.exports = {

	// General messaging abstraction
	sendMessage: (content, callback) => {
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages?access_token='+constants.APP_KEY,
			method: 'POST',
			json: content
		}, function (err, res, body) {
			if (err) throw new Error(err);

			callback(res);
		});
	},

	// Thread level interaction, sets up the chat thread
	setThread: (content, callback) => {
		request({
			url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+constants.APP_KEY,
			method: 'POST',
			json: content
		}, function (err, res, body) {
			if (err) throw new Error(err);

			callback(res);
		});
	},

	// Graph API for the user
	getUserProfile: (psid, callback) => {
		request({
			url: 'https://graph.facebook.com/v2.6/'+psid+'?fields=first_name,last_name,profile_pic,gender&access_token='+constants.APP_KEY,
			method: 'GET',
		}, function (err, res, body) {
			if (err) throw new Error(err);

			callback(res);
		});
	},
}
