var url = require('url'),
    http = require('http');

module.exports = {
    start: function() {
        this.server = http.createServer(function(req, res) {
            var parsed = url.parse(req.url, true);
            var path = parsed.pathname;
            var output;

            switch(path) {
                case '/search':
                    var terms = parsed.query.terms;
                    if(terms === '') {
                        output = {error: true, code: ''};
                    } else {
                        output = {posts: new Array(Number(terms))};
                    }
                    break;
                case '/getNewestEventId':
                    output = {eventId: 1000};
                    break;
                case '/waitForEvent':
                    var lastEventId = Number(parsed.query.lastEventId);
                    if(lastEventId < 10000) {
                        output = {error: true, code: 'ERR_TOO_MANY_EVENTS'};
                    } else {
                        output = {
                            lastEventId: lastEventId + 2,
                            events: [{},{}]
                        };
                    }
                    break;
                default:
                    output = '';
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(output));
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