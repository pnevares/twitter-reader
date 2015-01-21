module.exports = function(settings) {
    config = {};

    config.port = Number(settings.PORT || 8000);

    config.api_keys = {
        consumer_key: settings.C_KEY,
        consumer_secret: settings.C_SECRET,
        access_token_key: settings.AT_KEY,
        access_token_secret: settings.AT_SECRET,
    };

    for(var k in config.api_keys) {
        if(config.api_keys.hasOwnProperty(k) && config.api_keys[k] === undefined) {
            throw new Error('twitter api ' + k + ' is undefined');
        }
    }

    return config;
};