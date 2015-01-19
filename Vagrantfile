# -*- mode: ruby -*-
# vi: set ft=ruby :

$script = <<SCRIPT
sudo apt-get install -y nodejs
sudo apt-get install -y redis-server
sudo redis-server
SCRIPT

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"

  config.vm.provision "shell", inline: $script

  config.vm.network :forwarded_port, host: 8000, guest: 8000
end
