var url = require('url'),
    http = require('http'),
    redis = require('redis'),
    moment = require('moment'),
    twitter = require('twitter');

var config = require('./lib/config')(),
    winchatty = require('./lib/winchatty');

var redisClient = redis.createClient(),
    twitterClient = new twitter(config.api_keys);

var server = http.createServer(function(req, res) {
    var output;

    var parsed = url.parse(req.url, true);
    var path = parsed.pathname;

    switch(path) {
        case '/tweet':
            var tweetUrl = parsed.query.tweetUrl || '';

            if(tweetUrl === '') {
                res.writeHead(400, {'Content-Type': 'text/html'});
                res.end('400 Bad Request<br>Required argument: tweetUrl');
                break;
            }

            var tweetId = tweetUrl.match(/twitter\.com\/\w+\/status\/(\d+).*/);

            if(tweetId === null || tweetId.length !== 2) {
                res.writeHead(400, {'Content-Type': 'text/html'});
                res.end('400 Bad Request<br>Could not find tweetId');
                break;
            }

            tweetId = tweetId[1];

            redisClient.hget('tweet:' + tweetId, 'body', function(error, response) {
                if(error) {
                    res.writeHead(500, {'Content-Type': 'text/html'});
                    res.end('500 Internal Server Error');
                    return;
                } else if(response !== null) {
                    // cache hit, use it
                    console.log('cache hit for tweet:' + tweetId);
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(response);

                    redisClient.hincrby('tweet:' + tweetId, 'requests', 1);
                } else {
                    // cache miss, get it
                    console.log('cache miss for tweet:' + tweetId);
                    console.log('validating ' + tweetUrl);
                    winchatty.search(tweetId, function(error, response) {
                        if(error) {
                            console.log('winchatty module error: ' + error);
                            res.writeHead(500, {'Content-Type': 'text/html'});
                            res.end('500 Winchatty Error');
                            return;
                        }

                        if(response.posts.length === 0) {
                            console.log('no posts found containing ' + tweetUrl);
                            res.writeHead(400, {'Content-Type': 'text/html'});
                            res.end('400 Bad Request<br>No chatty post found with this Twitter url');
                            return;
                        }

                        console.log('retrieving ' + tweetUrl);
                        twitterClient.get('statuses/oembed.json', {url: tweetUrl}, function(error, params, response) {
                            if(error) {
                                console.log('twitter module error:' + error);
                                res.writeHead(500, {'Content-Type': 'text/html'});
                                res.end('500 Internal Server Error');
                            } else {
                                output = params.html || 'error';
                            }

                            res.writeHead(200, {'Content-Type': 'text/html'});
                            res.end(output);

                            // save in cache
                            console.log('saving in redis: tweet:' + tweetId);
                            redisClient.hmset('tweet:' + tweetId, 'body', output, 'url', tweetUrl, 'requests', 1);
                        });
                        redisClient.zincrby('daily-twitter-api-requests', 1, moment().utc().format('YYYY-MM-DD'));
                    });
                }
                redisClient.zincrby('daily-requests-served', 1, moment().utc().format('YYYY-MM-DD'));
            });
            break;
        default:
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end('404 Not Found<br>Unknown path: ' + path);
    }
});

server.listen(config.port, function() {
    console.log(new Date().toISOString());
    console.log('twitter-reader began listening on port ' + config.port);
});

redisClient.on('error', function(error) {
    console.log('redis error: ' + error);
});