var config = require('./lib/config')(process.env);

var TweetServerModule = require('./lib/tweetServer');
var tweetServer = new TweetServerModule(config);
tweetServer.start();

var ChattyListenerModule = require('./lib/chattyListener');
var chattyListener = new ChattyListenerModule(config);
chattyListener.start();