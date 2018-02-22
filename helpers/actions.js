const request = require('request');
const constants = require('./constants');
const responses = require('./responses');
const messenger = require('./messenger');
const moment = require('moment');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const https = require('https');

module.exports = {
    default: (psid, text) => {
        messenger.sendMessage(responses.sender_action(psid), function(res) {

            // Then we get their first name
            messenger.getUserProfile(psid, function(res) {
                const { first_name } = JSON.parse(res.body);

                // Then we send them a HELLO message using their name
                messenger.sendMessage(responses.default(psid, text), function(res) {

                    // Sent the response
                    console.log('Sent the response');
                });
            });
        });
    },

    translate: (psid, url) => {
        messenger.sendMessage(responses.sender_action(psid), function(res) {
            messenger.sendMessage(responses.default(psid, 'Just a moment, we\'re processing your voice now.'), function(res) {

                // Create the temp file
                var fbfile = fs.createWriteStream("./file.aac");

                // Get the file from FB Messenger
                var fbrequest = https.get(url, function(response) {

                    // Prepping to write to disk
                    const initialFileStream = response.pipe(fbfile);

                    // It's done!
                    initialFileStream.on('finish', function () {

                        // Your Google Cloud Platform project ID
                        const projectId = constants.GOOGLE_APP_ID;
                        const cloudconvert = new (require('cloudconvert'))(constants.CLOUD_CONVERT_APP_ID);

                        // Creates a client using your service account JSON file
                        const client = new speech.SpeechClient({
                            projectId: constants.GOOGLE_PROJECT_ID,
                            keyFilename: constants.GOOGLE_SERVICE_ACCOUNT_FILE
                        });

                        // Cloud convert stuff - take note of the formatting,
                        // this is important for Google Speach
                        const conversationStream = fs.createReadStream('./file.aac').pipe(cloudconvert.convert({
                            "inputformat": "aac",
                            "outputformat": "wav",
                            "input": "upload"
                        })).pipe(fs.createWriteStream('./file.wav'));

                        // Once the translation is done
                        conversationStream.on('finish', function () {

                            // Reads a local audio file and converts it to base64
                            const file = fs.readFileSync('./file.wav');
                            const audioBytes = file.toString('base64');

                            // The audio file's encoding, sample rate in hertz, and BCP-47 language code
                            const audio = {
                                content: audioBytes,
                            };

                            const config = {
                                encoding: 'LINEAR16',
                                sampleRateHertz: 8000,
                                languageCode: 'en-US',
                            };
                            const request = {
                                audio: audio,
                                config: config,
                            };

                            // Detects speech in the audio file
                            client.recognize(request).then(data => {

                                // Get the reponse and the transcription from Google
                                const response = data[0];
                                const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
                                const valid = transcription=="" ? false : true;
                                const message = transcription=="" ? 'Sorry, we could not translate this for you' : `Gotcha, you said: ${transcription}, searching now...`;

                                // Then we send them a HELLO message using their name
                                messenger.sendMessage(responses.default(psid, message), function(res) {

                                    // Only if it's a valid transcript
                                    if (valid) {

                                        // Now we search the SQL server for results
                                        const Connection = require('tedious').Connection;
                                        const Request = require('tedious').Request;
                                        const config = {
                                            userName: constants.SQLSERVER_USERNAME,
                                            password: constants.SQLSERVER_PASSWORD,
                                            server: constants.SQLSERVER,
                                            options: {
                                                rowCollectionOnDone: true,
                                                rowCollectionOnRequestCompletion: true,
                                                database: constants.SQLSERVER_DB
                                            }
                                        };
                                        const connection = new Connection(config);
                                        const text = transcription;

                                        // Valid connection
                                        connection.on('connect', function(err) {
                                            if (err) {
                                                console.log(err);
                                            } else {

                                                // Here we run the actual SQL Serber request
                                                // Super simple SQL query to jsut pull the products
                                                var request = new Request("SELECT top 5 PRODUCT, IMAGE, DESCRIPTION FROM products WHERE DESCRIPTION LIKE '%"+text+"%' ORDER BY ID DESC", function(err) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                });

                                                // Once it's done we message the user with the results
                                                request.on('doneInProc',function(rowCount, more, rows) {
                                                    if (rowCount==0) {
                                                        messenger.sendMessage(responses.default(psid, 'Sorry, we did not find any results.'), function(res) {
                                                            console.log('Sent them nothing');
                                                        });
                                                    } else {
                                                        messenger.sendMessage(responses.items(psid, rows), function(res) {
                                                            console.log('Sent them the carousel');
                                                        });
                                                    }
                                                });

                                                // Execute SQL statement
                                                connection.execSql(request);
                                            }
                                        });
                                    }
                                });
                            })
                            .catch(err => {
                                console.error('ERROR:', err);

                                // Then we send them a HELLO message using their name
                                messenger.sendMessage(responses.default(psid, 'Sorry, we didn\'t recognize you there.'), function(res) {
                                    // Do nothing!
                                });
                            });
                        });
                    });
                });
            });
        });
    }
}
