# Geronimo

Geronimo is a NodeJS Facebook Messenger app that translates audio to text using Google Speech & CloudConvert, and then searches a SQL Server database using the transcribed audio. It also serves as a framework for building more general Messenger apps that interact with attachments & 3rd party services.

## Installation

Simply clone the repo, run `yarn` and setup the `helpers/constants` file. You'll need to create the appropriate GCP/CC apps for being able to access any audio transcription services. [Click here](https://cloud.google.com/speech/) and [here](https://cloudconvert.com/) learn how to do that.

## Running

Simply run `node index.js` or use `forever` to start the service.

## Caveats

The project was adapted from a MongoDB backbone to a SQL Server one. It also assumes some familiarity of the Facebook Messenger architecture for the setup of the webhooks, apps, etc.
