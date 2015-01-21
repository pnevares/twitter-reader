var url = require('url'),
    http = require('http'),
    redis = require('redis'),
    moment = require('moment'),
    twitter = require('twitter');

var config = require('./lib/config')(process.env),
    winchatty = require('./lib/winchatty');

var redisClient = redis.createClient(),
    twitterClient = new twitter(config.api_keys);

var server = http.createServer(function(req, res) {
    var parsed = url.parse(req.url, true);

    switch(parsed.pathname) {
        case '/tweet':
            var dateStamp = moment().utc().format('YYYY-MM-DD');
            var tweetUrl = parsed.query.tweetUrl || '';

            redisClient.zincrby('daily-requests', 1, dateStamp);

            if(tweetUrl === '') {
                outputResponse(res, 400, '400 Bad Request<br>Required argument: tweetUrl');
                return;
            }

            var tweetId = tweetUrl.match(/twitter\.com\/\w+\/status\/(\d+).*/);

            if(tweetId === null || tweetId.length !== 2) {
                outputResponse(res, 400, '400 Bad Request<br>Could not find tweetId');
                return;
            }

            tweetId = tweetId[1];

            redisClient.hget('tweet:' + tweetId, 'body', function(error, response) {
                if(error) {
                    outputResponse(res, 500, '500 Internal Server Error');
                    return;
                } else if(response !== null) {
                    console.log('cache hit for tweet:' + tweetId);
                    outputResponse(res, 200, response);
                    redisClient.zincrby('daily-served', 1, dateStamp);
                    redisClient.zincrby('tweet-requests', 1, 'tweet:' + tweetId);
                } else {
                    console.log('cache miss for tweet:' + tweetId);
                    console.log('validating ' + tweetUrl);
                    winchatty.search(tweetId, function(error, response) {
                        if(error || response.posts.length === 0) {
                            if(error) {
                                console.log('winchatty module error: ' + error);
                            }
                            outputResponse(res, 400, '400 Bad Request<br>No chatty post found with this Twitter url');
                            return;
                        }

                        console.log('retrieving ' + tweetUrl);
                        twitterClient.get('statuses/oembed.json', {url: tweetUrl}, function(error, response) {
                            redisClient.zincrby('daily-twitter-api', 1, dateStamp);

                            if(error || !('html' in response)) {
                                console.log('twitter module error:' + error);
                                outputResponse(res, 500, '500 Internal Server Error');
                                return;
                            }

                            var tweetBody = response.html;
                            outputResponse(res, 200, tweetBody);

                            console.log('caching tweet:' + tweetId);
                            redisClient.hmset('tweet:' + tweetId, 'body', tweetBody, 'url', tweetUrl, 'saved', moment().utc().format());
                            redisClient.zincrby('daily-served', 1, dateStamp);
                            redisClient.zincrby('tweet-requests', 1, 'tweet:' + tweetId);
                        });
                    });
                }
            });
            break;
        default:
            console.log('bad endpoint');
            outputResponse(res, 404, '404 Not Found<br>Unknown path: ' + parsed.pathname);
    }
});

redisClient.on('error', function(error) {
    console.log('redis error: ' + error);
});

function outputResponse(res, httpCode, body) {
    res.writeHead(httpCode, {'Content-Type': 'text/html'});
    res.end(body);
}

server.listen(config.port, function() {
    console.log(moment().utc().format());
    console.log('twitter-reader began listening on port ' + config.port);
});