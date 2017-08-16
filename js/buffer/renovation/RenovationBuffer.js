(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.Renovation");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");

    sap.ui.base.Object.extend('sap.ui.buffer.Renovation', {
        constructor: function(_renoDB, sEntity) {

            var oSchemaDB;
            this.renoDB = new sap.ui.db.Pouch(_renoDB);


            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            /////////:::: oSchema deberia venir del diccionario
            this.renoDB.setSchema(oSchemaDB.getRenoDBSchema());

        },
    });

    sap.ui.buffer.Renovation.prototype.postRequest = function(_oRequest) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.renoDB.getById(oDictionary.oQueues.Renovation, _oRequest.id)
                .then(function(_oRequest, result) {
                    if (result.RenovationSet) {
                        if (result.RenovationSet.length > 0) { // Ya existia previamente
                            _oRequest.rev = result.RenovationSet[0].rev;
                        }
                    }
                    oController.renoDB.post(oDictionary.oQueues.Renovation, _oRequest)
                        .then(function(oResult) {
                            resolve(oResult);
                        }).catch(function(e) {
                            reject(e);
                        });
                }.bind(oController, _oRequest));
        });
    };

    sap.ui.buffer.Renovation.prototype.searchInRenoDB = function(_id) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.renoDB.getById(oDictionary.oQueues.Renovation, _id)
                .then(function(oResult) {
                    if (oResult.RenovationSet.length > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

    sap.ui.buffer.Renovation.prototype.searchAllInRenoDB = function(){
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.renoDB.get(oDictionary.oQueues.Renovation)
                .then(function(oResult){
                    resolve(oResult);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

})();