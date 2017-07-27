(function() {
	 "use strict";
    jQuery.sap.declare("sap.ui.kapsel.Push");
    jQuery.sap.require("sap.ui.base.Object");
	
	sap.ui.base.Object.extend('sap.ui.kapsel.Push', {
        constructor: function() {
            this.senderID = 373810911867; // GCM Sender ID
            this.nTypes = sap.Push.notificationType.SOUNDS | sap.Push.notificationType.ALERT; // Types of notifications the application wants to receive
        }
    });
	sap.ui.kapsel.Push.prototype.registerForPush = function() {	

		sap.Push.registerForNotificationTypes(this.nTypes, function(result){
					//resolve(JSON.stringify(result));
					console.log("GCM_PUSH-Successfully registered: " + JSON.stringify(result));

				}, function(errorInfo){
					console.log("GCM_PUSH-Error while registering.  " + JSON.stringify(errorInfo));
					//reject(JSON.stringify(errorInfo))
				}, function(notification){
					console.log("Received a notifcation: " + JSON.stringify(notification));
					//resolve(JSON.stringify(result));
				}, this.senderID);
			
		/*return new Promise(function(resolve,reject) {
			try{
				sap.Push.registerForNotificationTypes(this.nTypes, function(result){
					//resolve(JSON.stringify(result));
					console.log("GCM_PUSH-Successfully registered: " + JSON.stringify(result));

				}, function(errorInfo){
					console.log("GCM_PUSH-Error while registering.  " + JSON.stringify(errorInfo));
					//reject(JSON.stringify(errorInfo))
				}, function(notification){
					console.log("Received a notifcation: " + JSON.stringify(notification));
					//resolve(JSON.stringify(result));
				}, this.senderID);
			}
			catch(ex){
				reject(ex)
			}
			

		}.bind(this));*/
		
	};
	sap.ui.kapsel.Push.prototype.unregisterForPush = function() {
		sap.Push.unregisterForNotificationTypes( function(result) {
				console.log("GCM_PUSH-Successfully unRegistered " + JSON.stringify(result));
            });
	};
	sap.ui.kapsel.Push.prototype.setSenderID = function(senderID) {
        this.senderID = senderID;
    };
    sap.ui.kapsel.Push.prototype.getSenderID = function() {
        return this.senderID;
    };
	sap.ui.kapsel.Push.prototype.setNTypes = function(nTypes) {
        this.nTypes = nTypes;
    };
    sap.ui.kapsel.Push.prototype.getNTypes = function() {
        return this.nTypes;
    };
})();