(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.kapsel.Logger");
    jQuery.sap.require("sap.ui.base.Object");
	
	sap.ui.base.Object.extend('sap.ui.kapsel.Logger', {
        constructor: function() {
            this.level=sap.Logger.ERROR;
			// Set up level logger
			sap.Logger.setLogLevel(this.level);
        }
    });
	
	//Funcion para poner mensaje de error en el Log @Message: Texto u objeto a enviar al log, @ErrorTag: archivo en el que se encuentra la traza 
	sap.ui.kapsel.Logger.prototype.errorTrace = function(message,errorTag) {
		sap.Logger.error(message, errorTag);
	};
	//Funcion para subir el archivo Log en server SMP
	sap.ui.kapsel.Logger.prototype.uploadLog = function() {
		return new Promise(function(resolve, reject) {
			try{
				sap.Logger.upload(function() {
                    console.log("***Upload Successful");
					resolve("OK");
                }, function(e) {
                    console.log("***Upload Failed. Status: " + e.statusCode + ", Message: " + e.statusMessage);
					reject("Error");
                });
			} catch (error) {
                console.log(error);
                reject(error);
            }
			
		 });
	};
	//Funcion para limpiar el archivo de Log
	sap.ui.kapsel.Logger.prototype.clearLog = function() {
		return new Promise(function(resolve, reject) {
			try{
				sap.Logger.clearLog(function() {
                    console.log("***Clear Log Successful");
					resolve("OK");
                }, function(e) {
                    console.log("Failure in clearing log. " + JSON.stingify(error));
					reject("Error");
                });
			} catch (error) {
                console.log(error);
                reject(error);
            }
			
		 });
	};
	//Funcion para visualizar el archivo de Log
	sap.ui.kapsel.Logger.prototype.showLog = function() {
		sap.Logger.getLogEntries(
			function(logEntries) {
                var stringToShow = "";
                if (device.platform == "iOS") {
                    stringToShow = logEntries;
                }
                else {
                    var logArray = logEntries.split('#');
                    if (logArray.length > 0) {
                        var numOfMessages = parseInt(logArray.length / 15);
                        for (var i = 0; i < numOfMessages; i++) {
                            stringToShow += logArray[i * 15 + 1] + ": " + logArray[i * 15 + 3] + ": " + logArray[i * 15 + 14];
                        }
                    }
                }
                console.log(stringToShow);
            },  function (error) {
                console.log("Failure in getting log entries. " + JSON.stingify(error));
            });
	};
})();