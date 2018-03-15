# Geronimo

Geronimo is a NodeJS Facebook Messenger app that translates audio to text using Google Speech & CloudConvert, and then searches a SQL Server database using the transcribed audio. It also serves as a framework for building more general Messenger apps that interact with attachments & 3rd party services.

## Installation

Simply clone the repo, run `yarn` and setup the `helpers/constants` file. You'll need to create the appropriate GCP/CC apps for being able to access any audio transcription services. [Click here](https://cloud.google.com/speech/) and [here](https://cloudconvert.com/) learn how to do that.

## Running

Simply run `node index.js` or use `forever` to start the service.


## Overview

Some familiarity with Facebook's Messenger Platform is assumed. For more information about setting up web hooks, please [see here](https://developers.facebook.com/docs/messenger-platform/webhook).

With every message a user sends, Facebook will send this app an event containing the `PSID` (page scoped ID) for the user. The event will also contain any other action the user performed, including  text message replies, post-back actions (buttons inside messages & menus) & quick link presses (buttons at the bottom). We process these on the `index.js` to decide how to proceed for the next message. We can use this `PSID` to message the user the response after processing.

## Architecture

All images are kept in the `/public` folder. These are available publicly for the user to view inside messages.

All other code are separated into files inside `/helpers`. This will review the use of each file that is important to the logic of the app.

### Actions

Once we receive an event from the user we decide where in the conversation it is. Facebook generally delivers data using their `payload` property when making calls to our the service. We process this in `index.js` with some logic statements. Once it is established where their response fits in, we call an `action` from `/helpers/actions.js`. The `actions` file contains the first step in retrieving data from the database, signalling to the user that the bot is typing and sending a reply back to the user using other helper functions. The `actions` perform the core "action" of responding to the user. Think of it as a `controller` in an MVC application.

### Messenger

The `messenger.js` file contains functions for interacting with Facebook's Messenger API. It is used for sending messages back to the user (using their `PSID`) & setting up bot thread details like the persistent menu.

### Responses

Ever message back to Facebook needs to be well formatted. When sending a carousel, the message object needs to be structured in a certain manner. All response objects are stored in the `responses.js` file.

### High level overview

At a very high level the flow goes `action & processing -> right response object -> use messenger to send to user`

## Caveats

The project was adapted from a MongoDB backbone to a SQL Server one. It also assumes some familiarity of the Facebook Messenger architecture for the setup of the webhooks, apps, etc.
