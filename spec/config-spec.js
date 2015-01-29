var config = require('../lib/config');

describe('The config module', function() {
    var settings;

    beforeEach(function() {
        settings = {
            TRDR_PORT: 1,
            TRDR_CKEY: 'a',
            TRDR_CSECRET: 'b',
            TRDR_ATKEY: 'c',
            TRDR_ATSECRET: 'd'
        };
    });

    it('should require parameters', function() {
        expect(config).toThrow();
    });

    it('should give a config when called with required settings', function() {
        var c = config(settings);

        expect(c.port).toBe(settings.TRDR_PORT);
        expect(c.api_keys.consumer_key).toBe(settings.TRDR_CKEY);
        expect(c.api_keys.consumer_secret).toBe(settings.TRDR_CSECRET);
        expect(c.api_keys.access_token_key).toBe(settings.TRDR_ATKEY);
        expect(c.api_keys.access_token_secret).toBe(settings.TRDR_ATSECRET);
    });

    it('should set a default port', function() {
        delete(settings.TRDR_PORT);
        var configuration = config(settings);

        expect(configuration.port).toBe(8000);
    });
});