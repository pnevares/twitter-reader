# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"

  config.vm.provision "shell" do |s|
    s.inline = "sudo apt-get install -y nodejs"
  end

  config.vm.network :forwarded_port, host: 8000, guest: 8000
end
