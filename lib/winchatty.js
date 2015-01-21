var http = require('http');

module.exports = {
    baseUrl: 'http://winchatty.com/v2/',

    search: function(term, callback) {
        http.get(this.baseUrl + 'search?terms=' + term, function(res) {
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function() {
                try {
                    data = JSON.parse(data);
                    if(data.error) {
                        callback(data.message, null);
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
    }
};