var winchatty = require('../lib/winchatty'),
    winchatty_mock = require ('./helpers/winchatty-mock');

// ugly, but it works. fix.
winchatty.baseUrl = 'http://localhost:9000/';

describe('The winchatty module', function() {
    var callback, flag;

    beforeEach(function() {
        winchatty_mock.start();

        flag = false;
        callback = {
            method: function() {
                flag = true;
            }
        };
        spyOn(callback, 'method').andCallThrough();
    });

    afterEach(function() {
        winchatty_mock.stop();
    });

    it('should give an error on an empty search', function() {
        runs(function() {
            winchatty.search('', callback.method);
        });

        waitsFor(function() {
            return flag;
        }, 'The callback should be called', 200);

        runs(function() {
            expect(callback.method).toHaveBeenCalled();
            expect(callback.method.mostRecentCall.args[0]).not.toEqual(null);
            expect(callback.method.mostRecentCall.args[1]).toEqual(null);
        });
    });

    it('should give results for a valid search', function() {
        var posts = 10;
        runs(function() {
            winchatty.search(String(posts), callback.method);
        });

        waitsFor(function() {
            return flag;
        }, 'The callback should be called', 200);

        runs(function() {
            var result = callback.method.mostRecentCall.args[1];

            expect(callback.method).toHaveBeenCalled();
            expect(callback.method.mostRecentCall.args[0]).toEqual(null);
            expect(result.posts.length).toEqual(posts);
        });
    });

    it('should handle empty search results', function() {
        var posts = 0;
        runs(function() {
            winchatty.search(String(posts), callback.method);
        });

        waitsFor(function() {
            return flag;
        }, 'The callback should be called', 200);

        runs(function() {
            var result = callback.method.mostRecentCall.args[1];

            expect(callback.method).toHaveBeenCalled();
            expect(callback.method.mostRecentCall.args[0]).toEqual(null);
            expect(result.posts.length).toEqual(posts);
        });
    });

    it('should error on a winchatty error response', function() {
        var posts = '';
        runs(function() {
            winchatty.search(posts, callback.method);
        });

        waitsFor(function() {
            return flag;
        }, 'The callback should be called', 200);

        runs(function() {
            expect(callback.method).toHaveBeenCalled();
            expect(callback.method.mostRecentCall.args[0]).not.toEqual(null);
            expect(callback.method.mostRecentCall.args[1]).toEqual(null);
        });
    });

    it('should respond to getNewestEventId', function() {
        runs(function() {
            winchatty.getNewestEventId(callback.method);
        });

        waitsFor(function() {
            return flag;
        }, 'The callback should be called', 200);

        runs(function() {
            var result = callback.method.mostRecentCall.args[1];

            expect(callback.method).toHaveBeenCalled();
            expect(callback.method.mostRecentCall.args[0]).toEqual(null);
            expect(result.eventId).toEqual(jasmine.any(Number));
        });
    });

    it('should respond to a valid waitForEvent', function() {
        var lastEventId = 10000;
        runs(function() {
            winchatty.waitForEvent(lastEventId, callback.method);
        });

        waitsFor(function() {
            return flag;
        }, 'The callback should be called', 200);

        runs(function() {
            var result = callback.method.mostRecentCall.args[1];

            expect(callback.method).toHaveBeenCalled();
            expect(callback.method.mostRecentCall.args[0]).toEqual(null);
            expect(result.lastEventId).toEqual(lastEventId + 2);
            expect(result.events.length).toEqual(2);
        });
    });

    it('should error on a waitForEvent error response', function() {
        var lastEventId = 1;
        runs(function() {
            winchatty.waitForEvent(lastEventId, callback.method);
        });

        waitsFor(function() {
            return flag;
        }, 'The callback should be called', 200);

        runs(function() {
            expect(callback.method).toHaveBeenCalled();
            expect(callback.method.mostRecentCall.args[0]).not.toEqual(null);
            expect(callback.method.mostRecentCall.args[1]).toEqual(null);
        });
    });
});