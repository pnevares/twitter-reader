# -*- mode: ruby -*-
# vi: set ft=ruby :

$script = <<SCRIPT
apt-get install -y nodejs-legacy
apt-get install -y redis-server
SCRIPT

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"

  config.vm.provision "shell", inline: $script

  config.vm.network :forwarded_port, host: 8000, guest: 8000
end
