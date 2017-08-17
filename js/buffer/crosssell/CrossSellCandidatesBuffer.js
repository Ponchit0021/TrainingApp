(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.CrossSellCandidates");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");


    sap.ui.base.Object.extend('sap.ui.buffer.CrossSellCandidates', {
        constructor: function(_crossDB) {
            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            var oSchemaDB;
            this.crossDB = new sap.ui.db.Pouch(_crossDB);
            oSchemaDB = new sap.ui.helper.Schema();
            this.crossDB.setSchema(oSchemaDB.getCrossDBSchema());
        }
    });
    sap.ui.buffer.CrossSellCandidates.prototype.postRequest = function(_oData) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();

        return new Promise(function(resolve, reject) {
            oController.crossDB.getById(oDictionary.oQueues.CrossSellBatch, _oData.id)
                .then(function(_oData, result) {
                    if (result.CrossSellBatchSet) {
                        if (result.CrossSellBatchSet.length > 0) { // update
                            oController.crossDB.update(oDictionary.oQueues.CrossSellBatch, _oData.id, _oData)
                                .then(function(oResult) {
                                    resolve(oResult);
                                }).catch(function(e) {
                                    reject(e);
                                });
                        } else { // new element
                            oController.crossDB.post(oDictionary.oQueues.CrossSellBatch, _oData)
                                .then(function(oResult) {
                                    resolve(oResult);
                                }).catch(function(e) {
                                    reject(e);
                                });
                        }
                    }
                }.bind(oController, _oData));
        });
    };
})();