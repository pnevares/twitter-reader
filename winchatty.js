var http = require('http');

module.exports = {
    search: function(term, callback) {
        http.get('http://winchatty.com/v2/search?terms=' + term, function(res) {
            var data = "";
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function() {
                data = JSON.parse(data);
                if(data.error) {
                    callback(data.message, null);
                } else {
                    callback(null, data);
                }
            });
        }).on('error', function(e) {
          console.log('Got error: ' + e.message);
          callback(e.message, null);
        });
    }
};