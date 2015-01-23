module.exports = function(text) {
    var tweets = [],
        matches = text.match(/twitter\.com\/\w+\/status\/\d+/ig);

    if(matches !== null) {
        matches.forEach(function(c) {
            var parts = c.match(/twitter\.com\/(\w+)\/status\/(\d+)/i);
            if(parts.length === 3) {
                var key = 'https://twitter.com/' + parts[1] + '/status/' + parts[2];
                if(tweets.indexOf(key) === -1) {
                    tweets.push(key);
                }
            }
        });
    }

    return tweets;
};