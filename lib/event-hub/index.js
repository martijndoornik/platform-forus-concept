
const AzureEventHubs = require('azure-event-hubs');
const EventHubClient = AzureEventHubs.EventHubClient

const bodyKey = 'body';
const eventNameKey = 'eventName';
const eventDataKey = 'eventData';

const configSelector = 'eventHub';
const configEventHubNameSelector = 'eventHubName';
const configConnectionStringSelector = 'connectionString';

const fileSystem = require('fs');

var client = null;
var lastEvent = -1;
var lastEventFile = './.last';
var receiver = null;

module.exports = 
{
    'configure':
    function configure(config) {
        if (configSelector in config) {
            const eventHubConfig = config[configSelector];
            if (!configConnectionStringSelector in eventHubConfig) throw 'No connectionString in EventHub config';
            if (!configEventHubNameSelector in eventHubConfig) throw 'No eventHubName in EventHub config';
            const eventHubName = eventHubConfig[configEventHubNameSelector]
            const connectionString = eventHubConfig[configConnectionStringSelector];
            client = EventHubClient.createFromConnectionString(connectionString, eventHubName);
        } else {
            // No EventHub configuration found in config
            throw 'No configuration for EventHub was found!'
        }
        try {
            if (fileSystem.readFile(lastEventFile, 'utf8', (err, data) => {
                const file = parseInt(data);
                if (!!file) {
                    lastEvent = file;
                }
            }));
        } catch (e) { console.log(e); }
    },
    'send': 
    async function send(name, data) {
        requireConfigure()
        var body = {}
        body[eventNameKey] = name;
        if (!!data) body[eventDataKey] = data;
        const message = {};
        message[bodyKey] = body;
        return client.send(message)
    },
    'start': 
    async function start(onEvent) {
        requireConfigure()
        const partitions = await client.getPartitionIds();
        const onError = function(error) {
            console.log('Error: ' + error)
        }
        const onMessage = function(message) {
            try {
                const time = parseInt(message['annotations']['x-opt-enqueued-time']);
                if (time > lastEvent) {
                    lastEvent = time;
                    saveLastEvent(time);
                    const body = message[bodyKey];
                    if (eventNameKey in body) {
                        onEvent(body[eventNameKey], body[eventDataKey]);
                    }
                }   
            } catch (e) { 
                console.log('Error in onMessage');
                console.log(e);
             }
        }
        receiver = client.receive(partitions[0], onMessage, onError);
    },
    
    'stop':
    async function stop() {
        requireConfigure()
        if (receiver) {
            await receiver.stop()
        }
    }
}

function requireConfigure() {
    if (!client) throw Error('Call configure before start');
}

function saveLastEvent(timeUnix) {
    fileSystem.writeFile(lastEventFile, timeUnix, 'utf8', (err) => {
        if (err) throw err;
    });
}