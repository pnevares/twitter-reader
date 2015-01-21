var config = require('../lib/config');

describe('The config module', function() {
    var settings;

    beforeEach(function() {
        settings = {
            PORT: 1,
            C_KEY: 'a',
            C_SECRET: 'b',
            AT_KEY: 'c',
            AT_SECRET: 'd'
        };
    });

    it('should require parameters', function() {
        expect(config).toThrow();
    });

    it('should give a config when called with required settings', function() {
        var c = config(settings);

        expect(c.port).toBe(settings.PORT);
        expect(c.api_keys.consumer_key).toBe(settings.C_KEY);
        expect(c.api_keys.consumer_secret).toBe(settings.C_SECRET);
        expect(c.api_keys.access_token_key).toBe(settings.AT_KEY);
        expect(c.api_keys.access_token_secret).toBe(settings.AT_SECRET);
    });

    it('should set a default port', function() {
        delete(settings.PORT);
        var configuration = config(settings);

        expect(configuration.port).toBe(8000);
    });
});