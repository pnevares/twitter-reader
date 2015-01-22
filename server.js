var config = require('./lib/config')(process.env);

var tweetServer = new require('./lib/tweetServer')(config);
tweetServer.start();