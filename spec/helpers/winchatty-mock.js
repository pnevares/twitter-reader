var url = require('url'),
    http = require('http');

module.exports = {
    start: function() {
        this.server = http.createServer(function(req, res) {
            var parsed = url.parse(req.url, true);
            var path = parsed.pathname;

            switch(path) {
                case '/search':
                    var output,
                        terms = parsed.query.terms;
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    if(terms === 'error' || terms === '') {
                        output = {error: true, message: ''};
                    } else {
                        output = {posts: new Array(Number(terms))};
                    }
                    res.end(JSON.stringify(output));
                    break;
                default:
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end('');
            }
        });

        this.server.listen(9000);
    },
    stop: function() {
        if('server' in this) {
            this.server.close();
            delete(this.server);
        }
    }
};