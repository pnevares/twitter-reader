apt-get -y install nodejs-legacy
apt-get -y install npm
apt-get -y install redis-server

cd /opt/twitter-reader
npm install
npm install -g forever