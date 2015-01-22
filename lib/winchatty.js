var http = require('http');

module.exports = {
    baseUrl: 'http://winchatty.com/v2/',

    get: function(path, callback) {
        http.get(this.baseUrl + path, function(res) {
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function() {
                try {
                    data = JSON.parse(data);
                    if(data.error) {
                        callback(data.code, null);
                    } else {
                        callback(null, data);
                    }
                } catch(e) {
                    callback(e.message, null);
                }
            });
        }).on('error', function(e) {
            callback(e.message, null);
        });
    },

    search: function(term, callback) {
        this.get('search?terms=' + term, callback);
    },

    getNewestEventId: function(callback) {
        this.get('getNewestEventId', callback);
    },

    waitForEvent: function(lastEventId, callback) {
        this.get('waitForEvent?lastEventId=' + lastEventId, callback);
    }
};