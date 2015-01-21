module.exports = function() {
    config = {};

    config.port = Number(process.env.PORT || 8000);

    config.api_keys = {
        consumer_key: process.env.C_KEY,
        consumer_secret: process.env.C_SECRET,
        access_token_key: process.env.AT_KEY,
        access_token_secret: process.env.AT_SECRET,
    };

    for(var k in config.api_keys) {
        if(config.api_keys.hasOwnProperty(k) && config.api_keys[k] === undefined) {
            throw 'twitter api ' + k + ' is undefined';
        }
    }

    return config;
};