var port = Number(process.argv[2] || 0);
if(port === 0) {
    console.log('stopping: port required as first parameter');
    return;
}

var url = require('url');
var http = require('http');
var twitter = require('twitter');

var client = new twitter({
    consumer_key: process.env.C_KEY,
    consumer_secret: process.env.C_SECRET,
    access_token_key: process.env.AT_KEY,
    access_token_secret: process.env.AT_SECRET,
});

var server = http.createServer(function(req, res) {
    var output;

    var parsed = url.parse(req.url, true);
    var path = parsed.pathname;

    switch(path) {
        case '/tweet':
            var tweetUrl = parsed.query.tweetUrl || '';
            if(tweetUrl !== '') {
                client.get('statuses/oembed.json', {url: tweetUrl}, function(error, params, response){
                    if(error) {
                        console.log(this);
                        output = error;
                    } else {
                        output = params.html || 'error';
                    }

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(output);
                });
            } else {
                res.writeHead(400, {'Content-Type': 'text/plain'});
                res.end('400 Bad Request');
            }
            break;
        default:
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('404 Not Found');
    }
});

server.listen(port);