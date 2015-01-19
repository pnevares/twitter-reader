var config = require('./config')(),
    url = require('url'),
    http = require('http'),
    twitter = require('twitter'),
    winchatty = require('./winchatty');

var client = new twitter(config.api_keys);

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

            console.log('validating ' + tweetUrl);
            winchatty.search(tweetId[1], function(error, response) {
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
                client.get('statuses/oembed.json', {url: tweetUrl}, function(error, params, response) {
                    if(error) {
                        console.log('twitter module error:' + error);
                        res.writeHead(500, {'Content-Type': 'text/html'});
                        res.end('500 Internal Server Error');
                    } else {
                        output = params.html || 'error';
                    }

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(output);
                });
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