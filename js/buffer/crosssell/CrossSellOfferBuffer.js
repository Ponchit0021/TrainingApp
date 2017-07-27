(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.CrossSellOffer");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");


    sap.ui.base.Object.extend('sap.ui.buffer.CrossSellOffer', {
        constructor: function(_syncDB) {
            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            var oSchemaDB;
            this.syncDB = new sap.ui.db.Pouch(_syncDB);
            oSchemaDB = new sap.ui.helper.Schema();
            this.syncDB.setSchema(oSchemaDB.getSyncDBSchema());
        }
    });
    sap.ui.buffer.CrossSellOffer.prototype.postRequest = function(_oRequest) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.syncDB.post(oDictionary.oQueues.CrossSellOffer, _oRequest)
                .then(function(oResult) {
                    resolve(oResult);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };
})();
