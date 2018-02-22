'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json());
const fs = require('fs');
const path = require('path');
const request = require('request');
const constants = require('./helpers/constants');
const messenger = require('./helpers/messenger');
const responses = require('./helpers/responses');
const actions = require('./helpers/actions');
const async = require('async');

// Serve the public directory static file
app.use(express.static(path.join(__dirname, 'public')));

// Sets server port and logs message on success
app.listen(constants.PORT, () =>  {
    console.log('Webhook is listening on port '+constants.PORT+'.');

    /*
    *
    * Here we set the thread up.
    * Including persistent menus and the welcome screen
    *
    */
    messenger.setThread(responses.thread, function(res) {

        // Check if stuff is fine
        if (res.body.result=='success') {
            console.log('Done! Ready to chat.')
        } else {
            console.log('Hold it, there was an error:')
            console.log(res);
        }
    });
});



// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            const webhookEvent = entry.messaging[0];

            // This is the unique PSID key we can use to message them directly
            const psid = webhookEvent.sender.id;

            // If there is an attachment, we translate it here
            // and then tell the user what they recorded
            if (webhookEvent.message) {
                if (webhookEvent.message.attachments) {
                    if (webhookEvent.message.attachments.length!=0) {
                        if (webhookEvent.message.attachments[0].payload) {
                            if (webhookEvent.message.attachments[0].payload.url) {
                                actions.translate(psid, webhookEvent.message.attachments[0].payload.url);
                            }
                        }
                    }
                }
            }

            // Here we handle any postbacks that may happen through Messenger
            if (webhookEvent.postback) {
                const { postback } = webhookEvent;

                // Decision tree for postbacks (including welcome message)
                // Add as many as your want here
                switch (postback.payload) {

                    case 'WELCOME':
                        actions.default(psid, 'Hi there, please leave us a voice note and we\'ll do our best to translate it');
                        break;
                }
            }

            // Normal messages are handled here
            if (webhookEvent.message) {
                const { message } = webhookEvent;

                // Quick replies
                if (message.quick_reply) {
                    const { quick_reply } = message;

                    // Decision tree for quick replies
                    switch (quick_reply.payload) {

                        case 'NONE':
                            actions.default(psid, 'Hi there, you have selected the NONE quick reply.');
                            break;
                    }
                }

                // Typed text messages
                if (message.text) {
                    const { text } = message;

                    // Decision tree plain text messages
                    switch (quick_reply.payload) {

                        case 'NONE':
                            actions.default(psid, 'Hi there, you typed NONE');
                            break;
                    }
                }
            }
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {

        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});

// Adds support for GET requests to our webhook (fro FB)
app.get('/webhook', (req, res) => {

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === constants.VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }

});
