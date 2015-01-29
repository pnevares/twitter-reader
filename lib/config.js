module.exports = function(settings) {
    config = {};

    config.port = Number(settings.TRDR_PORT || 8000);

    config.api_keys = {
        consumer_key: settings.TRDR_CKEY,
        consumer_secret: settings.TRDR_CSECRET,
        access_token_key: settings.TRDR_ATKEY,
        access_token_secret: settings.TRDR_ATSECRET,
    };

    for(var k in config.api_keys) {
        if(config.api_keys.hasOwnProperty(k) && config.api_keys[k] === undefined) {
            throw new Error('twitter api ' + k + ' is undefined');
        }
    }

    return config;
};