source ~/.profile
cd /opt/twitter-reader
forever start -a -o twitter-reader.log server.js