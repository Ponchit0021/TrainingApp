(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.LoanRequestSystemNotification");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");


    sap.ui.base.Object.extend('sap.ui.buffer.LoanRequestSystemNotification', {
        constructor: function(_notiDB) {
            var oSchemaDB;
            this.notiDB = new sap.ui.db.Pouch(_notiDB);

            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            oSchemaDB = new sap.ui.helper.Schema();

            this.notiDB.setSchema(oSchemaDB.getNotiDBSchema());
        }
    });

    sap.ui.buffer.LoanRequestSystemNotification.prototype.postRequest = function(_oRequest) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.notiDB.post(oDictionary.oQueues.LoanRequestSystemNotification, _oRequest)
                .then(function(oResult) {
                    resolve(oResult);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

    sap.ui.buffer.LoanRequestSystemNotification.prototype.searchInNotiDB = function(_type) {
        var oController, oDictionary, results;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.notiDB.get(_type)
                .then(function(oResult) {
                    results = { "results": oResult.LoanRequestSystemNotificationSet };
                    resolve(results);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

})();