(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.Notification");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");


    sap.ui.base.Object.extend('sap.ui.buffer.Notification', {
        constructor: function(_notiDB) {
            var oSchemaDB;
            this.notiDB = new sap.ui.db.Pouch(_notiDB);

            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            oSchemaDB = new sap.ui.helper.Schema();

            this.notiDB.setSchema(oSchemaDB.getNotiDBSchema());
        }
    });

    sap.ui.buffer.Notification.prototype.postRequest = function(_oRequest) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.notiDB.post(oDictionary.oQueues.InsuranceSystemNotification, _oRequest)
                .then(function(oResult) {
                    resolve(oResult);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

    sap.ui.buffer.Notification.prototype.searchInNotiDB = function(_type) {
        var oController, oDictionary, results;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.notiDB.get(_type)
                .then(function(oResult) {
                    results = { "results": oResult.InsuranceSystemNotificationSet };
                    resolve(results);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

    /*sap.ui.buffer.Notification.prototype.searchInNotiDB = function(_id) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.syncDB.getById(oDictionary.oQueues.Notification, _id)
                .then(function(oResult) {
                    if (oResult.RequestQueueInsuranceSet.length > 0) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                }).catch(function(e) {
                    reject(e);
                });
        });
    };*/




})();