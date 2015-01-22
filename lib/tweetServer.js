var url = require('url'),
    http = require('http'),
    redis = require('redis'),
    moment = require('moment'),
    twitter = require('twitter'),
    winchatty = require('./winchatty');

var redisClient, twitterClient;

function TweetServer(config) {
    if (!(this instanceof TweetServer)) return new TweetServer(config);

    this.config = config;
    redisClient = redis.createClient();
    twitterClient = new twitter(this.config.api_keys);

    redisClient.on('error', function(error) {
        console.log('redis error: ' + error);
    });

    this.server = http.createServer(function(req, res) {
        var dateStamp, tweetUrl, tweetId,
            parsed = url.parse(req.url, true);

        switch(parsed.pathname) {
            case '/tweet':
                dateStamp = moment().utc().format('YYYY-MM-DD');
                tweetUrl = parsed.query.tweetUrl || '';

                redisClient.zincrby('daily-requests', 1, dateStamp);

                tweetId = tweetUrl.match(/twitter\.com\/\w+\/status\/(\d+).*/);
                if(tweetId === null || tweetId.length !== 2) {
                    outputResponse(res, 400, '400 Bad Request<br>Could not find tweetId in required argument tweetUrl');
                } else {
                    tweetId = tweetId[1];
                    redisClient.hget('tweet:' + tweetId, 'body', loadedFromCache);
                }
                break;
            default:
                console.log('bad endpoint');
                outputResponse(res, 404, '404 Not Found<br>Unknown path: ' + parsed.pathname);
        }

        function loadedFromCache(error, response) {
            if(error) {
                outputResponse(res, 500, '500 Internal Server Error');
            } else if(response !== null) {
                console.log('cache hit for tweet:' + tweetId);
                outputResponse(res, 200, response);
                redisClient.zincrby('daily-served', 1, dateStamp);
                redisClient.zincrby('tweet-requests', 1, 'tweet:' + tweetId);
            } else {
                console.log('cache miss for tweet:' + tweetId);
                console.log('validating ' + tweetUrl);
                winchatty.search(tweetId, validatedUsingSearch);
            }
        }

        function validatedUsingSearch(error, response) {
            if(error || response.posts.length === 0) {
                if(error) {
                    console.log('winchatty module error: ' + error);
                }
                outputResponse(res, 400, '400 Bad Request<br>No chatty post found with this Twitter url');
            } else {
                console.log('retrieving ' + tweetUrl);
                twitterClient.get('statuses/oembed.json', {url: tweetUrl}, loadedFromTwitter);
            }
        }

        function loadedFromTwitter(error, response) {
            redisClient.zincrby('daily-twitter-api', 1, dateStamp);

            if(error || !('html' in response)) {
                console.log('twitter module error:' + error);
                outputResponse(res, 500, '500 Internal Server Error');
            } else {
                var tweetBody = response.html;
                outputResponse(res, 200, tweetBody);

                console.log('caching tweet:' + tweetId);
                redisClient.hmset('tweet:' + tweetId, 'body', tweetBody, 'url', tweetUrl, 'saved', moment().utc().format());
                redisClient.zincrby('daily-served', 1, dateStamp);
                redisClient.zincrby('tweet-requests', 1, 'tweet:' + tweetId);
            }
        }

        function outputResponse(res, httpCode, body) {
            res.writeHead(httpCode, {'Content-Type': 'text/html'});
            res.end(body);
        }
    });

    return this;
}

TweetServer.prototype.start = function() {
    var port = this.config.port;
    this.server.listen(port, function() {
        console.log(moment().utc().format());
        console.log('twitter-reader began listening on port ' + port);
    });
};

module.exports = TweetServer;