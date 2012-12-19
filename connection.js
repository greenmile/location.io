var forEach = require('async-foreach').forEach;
require('smarter-buffer');

var getId = function(self) {
	return self.protocolModules[0].name + self.id;
}
module.exports.getId = getId;

module.exports.attachSocket = function(socket, protocolModules, callback) {
	var self = socket;
	self.protocolModules = protocolModules.slice(); // make a copy of the array, not its contents
	
	socket.setKeepAlive(true, 600000);	

	var setAndEmittIdIfrequired = function(message) {
		
		if (self.id == null) {
			self.id = message.trackerId;
			callback('tracker-connected', getId(self), self.protocolModules[0]);
		}
	}; 
	
	var handleMessage = function(message) {
		setAndEmittIdIfrequired(message);
		callback("message", getId(self), message);
	}; 

	socket.on('data', function(data) {
		bufferAndHandleData(self, data, handleData, parse, function(message) {
			setAndEmittIdIfrequired(message);
			callback('message', getId(self), message);
		});
	});
	
	socket.on('close', function(data) {
		callback('tracker-disconnected', getId(self));
	});

	socket.on('error', function() {
		console.log('socket error occured');
	});
};


var bufferAndHandleData = function(self, data, handleDataFunction, parseFunction, handleMessageFunction) {
	self.dataBuffer = Buffer.smarterConcat([self.dataBuffer, data]);
	if (!self.handlingData) {
		handleDataFunction(self, parseFunction, handleMessageFunction);
	}
};

module.exports._bufferAndHandleData = bufferAndHandleData;

var handleData = function(self, parseFunction, handleMessageFunction, callback) {
	
	if (self.handlingData) {
		throw "already handling data";
	}
	
	var doCallCallback = function() {
		if ( typeof (callback) == "function") {
			callback(null);
		}
	};

	var handleParseComplete = function(err, message, data, protocolModules) {
	
		if (message) {
			handleMessageFunction(message);
		}
		
		self.dataBuffer = Buffer.smarterConcat([data, self.dataBuffer]);
		self.protocolModules = protocolModules;
	
		if (message && self.dataBuffer.length > 0) {
			kickOffParse();
		} else {
			self.handlingData = false;
			doCallCallback();
		}
	}; 

	
	var kickOffParse = function() {
		self.handlingData = true;
		parseFunction(self.dataBuffer, self.protocolModules, handleParseComplete);
		self.dataBuffer = undefined;
	};
	
	
	if (!self.handlingData) {
		kickOffParse();
	} 
};

module.exports._handleData = handleData;

var parse = function(data, protocolModules, callback) {
    var message = null;
 
	forEach(protocolModules, function(module, index, arr) {
		var done = this.async();

		try {
			module.parse(data, function(error, m, buffer) {

				var coninueLoop = true;
				if (error) {
					// remove this module so we don't attempt to use it again
					protocolModules.splice(index, 1);
				} else {
					if (m) {
						protocolModules = [module];
						// this module can parse the message - it will be used from now on
						data = buffer;
						coninueLoop = false;
						message = m;
					}
				}
				done(coninueLoop);
			});
		} catch (e) {
			done(true);
		}

	}, function() {
		callback(null, message, data, protocolModules);
	});
		
};
module.exports._parse = parse;

module.exports.sendCommand = function(self, socket, commandName, commandParameters, callback) {
	console.log('sending commmand ' + commandName);
	commandParameters.trackerId = self.id;
	console.log(commandParameters);
	try {
		var message = self.protocolModules[0].buildCommand(commandName, commandParameters);
		console.log('sending to tracker: ' + message)
		socket.write(message, function(err) {
			callback(err);
		});
	} catch(e) {
		console.log("build command failed " + e);
		process.nextTick(function() {
			callback(e + "");
		})
	}
};

