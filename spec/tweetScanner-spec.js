var tweetScanner = require('../lib/tweetScanner');

describe('The tweetScanner module', function() {
    var tweets = [
        'https://twitter.com/Interior/status/507185938620219395',
        'https://twitter.com/NASA/status/559796020406538240',
        'HTTPS://TWITTER.COM/BarackObama/STATUS/266031293945503744',
        'https://mobile.twitter.com/BarackObama/status/266031293945503744',
    ];

    it('should handle empty input', function() {
        var emptyInput = '';
        expect(tweetScanner(emptyInput).length).toEqual(0);
    });

    it('should handle a single url', function() {
        var result = tweetScanner(tweets[0]);
        expect(result.length).toEqual(1);
        expect(result[0]).toEqual(tweets[0]);
    });

    it('should handle multiple urls', function() {
        var result = tweetScanner(tweets[0] + '<br />' + tweets[1]);
        expect(result.length).toEqual(2);
        expect(result[0]).toEqual(tweets[0]);
        expect(result[1]).toEqual(tweets[1]);
    });

    it('should ignore duplicate urls', function() {
        var result = tweetScanner(tweets[0] + '<br />' + tweets[0]);
        expect(result.length).toEqual(1);
        expect(result[0]).toEqual(tweets[0]);
    });

    it('should reformat urls to correct case', function() {
        var result = tweetScanner(tweets[2]);
        expect(result.length).toEqual(1);
        expect(result[0]).not.toEqual(tweets[2]);
        expect(result[0]).toEqual('https://twitter.com/BarackObama/status/266031293945503744');
    });

    it('should reformat urls to desktop site', function() {
        var result = tweetScanner(tweets[3]);
        expect(result.length).toEqual(1);
        expect(result[0]).not.toEqual(tweets[3]);
        expect(result[0]).toEqual('https://twitter.com/BarackObama/status/266031293945503744');
    });
});