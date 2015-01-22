var redis = require('redis'),
    twitter = require('twitter');

var config = require('./lib/config')(process.env),
    winchatty = require('./lib/winchatty');

var redisClient = redis.createClient(),
    twitterClient = new twitter(config.api_keys);

function getNewestEventId() {
    winchatty.getNewestEventId(function(error, response) {
        if(error) {
            console.log('FATAL getNewestEventId error: ' + error);
            stop();
        } else {
            waitForEvent(null, {lastEventId: response.eventId, events: []});
        }
    });
}

function waitForEvent(error, response) {
    if(error) {
        if(error === 'ERR_TOO_MANY_EVENTS') {
            getNewestEventId();
        } else {
            console.log('FATAL waitForEvent error: ' + error);
            stop();
        }
    } else {
        winchatty.waitForEvent(response.lastEventId, waitForEvent);

        response.events.forEach(function(event) {
            if(event.eventType == 'newPost' && event.eventData.post.body.match(/twitter\.com/i)) {
                console.log(event.eventData.post.body + '\n');
            }
        });
    }
}

function stop() {
    // exit on fatal error
    redisClient.quit();
}

getNewestEventId();