(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.Insurance");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");


    sap.ui.base.Object.extend('sap.ui.buffer.Insurance', {
        constructor: function(_syncDB) {

            var oSchemaDB;
            this.syncDB = new sap.ui.db.Pouch(_syncDB);


            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            /////////:::: oSchema deberia venir del diccionario
            this.syncDB.setSchema(oSchemaDB.getSyncDBSchema());


        }
    });

    sap.ui.buffer.Insurance.prototype.postRequest = function(_oRequest) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.syncDB.getById(oDictionary.oQueues.Insurance, _oRequest.id)
                .then(function(_oRequest, result) {
                    if (result.RequestQueueInsuranceSet) {
                        if (result.RequestQueueInsuranceSet.length > 0) { // Ya existia previamente
                            _oRequest.rev = result.RequestQueueInsuranceSet[0].rev;
                        }
                    }
                    oController.syncDB.post(oDictionary.oQueues.Insurance, _oRequest)
                        .then(function(oResult) {
                            resolve(oResult);
                        }).catch(function(e) {
                            reject(e);
                        });
                }.bind(oController, _oRequest));
        });
    };

    sap.ui.buffer.Insurance.prototype.searchInSyncDB = function(_id) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.syncDB.getById(oDictionary.oQueues.Insurance, _id)
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
    };




})();
