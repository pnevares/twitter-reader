var url = require('url'),
    http = require('http'),
    redis = require('redis'),
    moment = require('moment'),
    twitter = require('twitter'),
    winchatty = require('./winchatty'),
    tweetScanner = require('./tweetScanner');

var redisClient, twitterClient;

function TweetServer(config) {
    if (!(this instanceof TweetServer)) return new TweetServer(config);

    this.config = config;
    redisClient = redis.createClient();
    twitterClient = new twitter(this.config.api_keys);

    redisClient.on('error', function(error) {
        console.log('(TweetServer) redis error: ' + JSON.stringify(error));
    });

    this.server = http.createServer(function(req, res) {
        var tweetUrl, tweetId, tweetKey,
            parsed = url.parse(req.url, true),
            dateStamp = moment().utc().format('YYYY-MM-DD');

        switch(parsed.pathname) {
            case '/tweet':
                redisClient.zincrby('daily-requests', 1, dateStamp);

                // confirm tweetUrl is a single, valid twitter url
                tweetUrl = tweetScanner(parsed.query.tweetUrl || '');
                tweetUrl = tweetUrl.length === 1 ? tweetUrl[0] : '';

                tweetId = tweetUrl.match(/twitter\.com\/\w+\/status\/(\d+)/i);
                if(tweetId === null || tweetId.length !== 2) {
                    outputResponse(res, 400, '400 Bad Request<br>Could not find tweetId in required argument tweetUrl');
                } else {
                    tweetId = tweetId[1];
                    tweetKey = 'tweet:' + tweetId;
                    redisClient.hget(tweetKey, 'body', loadedFromCache);
                }
                break;
            case '/ping':
                outputResponse(res, 200, 'pong!');
                break;
            case '/list':
                redisClient.get('mostRecentTweet', readLatestTweet);
                break;
            default:
                outputResponse(res, 404, '404 Not Found<br>Unknown path: ' + parsed.pathname);
        }

        function loadedFromCache(error, response) {
            if(error) {
                outputResponse(res, 500, '500 Internal Server Error');
            } else if(response !== null) {
                console.log('(TweetServer) cache hit for ' + tweetKey);
                outputResponse(res, 200, response);
                redisClient.zincrby('daily-served', 1, dateStamp);
                redisClient.zincrby('tweet-requests', 1, tweetKey);
            } else {
                console.log('(TweetServer) cache miss for ' + tweetKey);
                console.log('(TweetServer) validating ' + tweetUrl);
                winchatty.search(tweetId, validatedUsingSearch);
            }
        }

        function validatedUsingSearch(error, response) {
            if(error || response.posts.length === 0) {
                if(error) {
                    console.log('(TweetServer) winchatty module error: ' + JSON.stringify(error));
                }
                outputResponse(res, 400, '400 Bad Request<br>No chatty post found with this Twitter url');
            } else {
                console.log('(TweetServer) retrieving ' + tweetUrl);
                twitterClient.get('statuses/oembed.json', {url: tweetUrl}, loadedFromTwitter);
            }
        }

        function loadedFromTwitter(error, response) {
            redisClient.zincrby('daily-twitter-api', 1, dateStamp);

            if(error || !('html' in response)) {
                console.log('(TweetServer) twitter module error:' + JSON.stringify(error));
                outputResponse(res, 500, '500 Internal Server Error');
            } else {
                var tweetBody = response.html;
                outputResponse(res, 200, tweetBody);

                console.log('(TweetServer) caching ' + tweetKey);
                redisClient.hmset(tweetKey, 'body', tweetBody, 'url', tweetUrl, 'saved', moment().utc().format());
                redisClient.zincrby('daily-served', 1, dateStamp);
                redisClient.zincrby('tweet-requests', 1, tweetKey);
                redisClient.set('mostRecentTweet', tweetKey);
            }
        }

        function readLatestTweet(error, response) {
            if(error) {
                outputResponse(res, 500, '500 Internal Server Error');
            } else if(response === null) {
                outputResponse(res, 200, "Most recent tweet not found.");
            } else {
                tweetKey = response;
                redisClient.hget(tweetKey, 'body', loadedFromCache);
            }
        }

        function outputResponse(res, httpCode, body) {
            res.writeHead(httpCode, {'Content-Type': 'text/html'});
            res.end(body);
        }
    });
}

TweetServer.prototype.start = function() {
    var port = this.config.port;
    this.server.listen(port, function() {
        console.log(moment().utc().format() + ' TweetServer is listening on port ' + port);
    });
};

module.exports = TweetServer;