BIN = ./node_modules/.bin

all: install start

install start:
	npm $@

vagrant:
	vagrant up && vagrant ssh

test:
	$(BIN)/jasmine-node spec --autotest --watch . --growl --color