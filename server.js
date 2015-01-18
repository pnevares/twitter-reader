var config = require('./config')();
var url = require('url');
var http = require('http');
var twitter = require('twitter');

var client = new twitter(config.api_keys);

var server = http.createServer(function(req, res) {
    var output;

    var parsed = url.parse(req.url, true);
    var path = parsed.pathname;

    switch(path) {
        case '/tweet':
            var tweetUrl = parsed.query.tweetUrl || '';
            if(tweetUrl !== '') {
                console.log('retrieving ' + tweetUrl);
                client.get('statuses/oembed.json', {url: tweetUrl}, function(error, params, response) {
                    if(error) {
                        console.log(error);
                        res.writeHead(500, {'Content-Type': 'text/html'});
                        res.end("500 Internal Server Error");
                    } else {
                        output = params.html || 'error';
                    }

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(output);
                });
            } else {
                res.writeHead(400, {'Content-Type': 'text/html'});
                res.end("400 Bad Request<br>Required argument: tweetUrl");
            }
            break;
        default:
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end("404 Not Found<br>Unknown path: " + path);
    }
});

server.listen(config.port);