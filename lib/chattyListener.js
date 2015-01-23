var redis = require('redis'),
    moment = require('moment'),
    twitter = require('twitter'),
    winchatty = require('./winchatty'),
    tweetScanner = require('./tweetScanner');

var self, redisClient, twitterClient;

function ChattyListener(config) {
    if (!(this instanceof ChattyListener)) return new ChattyListener(config);

    this.config = config;
    redisClient = redis.createClient();
    twitterClient = new twitter(this.config.api_keys);

    redisClient.on('error', function(error) {
        console.log('(ChattyListener) redis error: ' + error);
    });
}

ChattyListener.prototype.start = function() {
    self = this;
    console.log(moment().utc().format() + ' ChattyListener is waiting for events');
    self.getNewestEventId();
};

ChattyListener.prototype.stop = function() {
    // exit on fatal error
    redisClient.quit();

    console.log('ChattyListener has stopped!');
    setInterval(function() {
        console.log('ChattyListener has stopped!');
    }, 60000);
};

ChattyListener.prototype.getNewestEventId = function() {
    winchatty.getNewestEventId(function(error, response) {
        if(error) {
            console.log('(ChattyListener) FATAL getNewestEventId error: ' + error);
            self.stop();
        } else {
            console.log('(ChattyListener) newestEventId: ' + response.eventId);
            self.waitForEvent(null, {lastEventId: response.eventId, events: []});
        }
    });
};

ChattyListener.prototype.waitForEvent = function(error, response) {
    if(error) {
        if(error === 'ERR_TOO_MANY_EVENTS') {
            self.getNewestEventId();
        } else {
            console.log('(ChattyListener) FATAL waitForEvent error: ' + error);
            self.stop();
        }
    } else {
        // start waiting for the next event
        winchatty.waitForEvent(response.lastEventId, self.waitForEvent);

        // process the previous event(s)
        response.events.forEach(function(event) {
            if(event.eventType == 'newPost') {
                var tweets = tweetScanner(event.eventData.post.body);
                if(tweets.length) {
                    tweets.forEach(function(c) {
                        var tweetUrl = c,
                            dateStamp = moment().utc().format('YYYY-MM-DD'),
                            tweetId = tweetUrl.match(/twitter\.com\/\w+\/status\/(\d+).*/);

                        if(tweetId !== null && tweetId.length === 2) {
                            tweetId = tweetId[1];
                            redisClient.exists('tweet:' + tweetId, function(error, response) {
                                if(error) {
                                    console.log('error');
                                } else if(response === 0) {
                                    twitterClient.get('statuses/oembed.json', {url: tweetUrl}, function(error, response) {
                                        redisClient.zincrby('daily-twitter-api', 1, dateStamp);

                                        if(error || !('html' in response)) {
                                            console.log('(ChattyListener) twitter module error:' + error);
                                        } else {
                                            var tweetBody = response.html;
                                            console.log('(ChattyListener) caching tweet:' + tweetId);
                                            redisClient.hmset('tweet:' + tweetId, 'body', tweetBody, 'url', tweetUrl, 'saved', moment().utc().format());
                                            redisClient.zincrby('daily-served', 1, dateStamp);
                                            redisClient.zincrby('tweet-requests', 1, 'tweet:' + tweetId);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    }
};

module.exports = ChattyListener;