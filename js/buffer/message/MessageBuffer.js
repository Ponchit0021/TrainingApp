(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.Message");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");

    sap.ui.base.Object.extend('sap.ui.buffer.Message', {
        constructor: function(_messageDB, sEntity) {

            var oSchemaDB;
            this.messageDB = new sap.ui.db.Pouch(_messageDB);


            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            /////////:::: oSchema deberia venir del diccionario
            this.messageDB.setSchema(oSchemaDB.getMessageDBSchema());

        },
    });

    sap.ui.buffer.Message.prototype.postRequest = function(_oRequest) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.messageDB.getById(oDictionary.oQueues.Message, _oRequest.id)
                .then(function(_oRequest, result) {
                    if (result.MessageSet) {
                        if (result.MessageSet.length > 0) { // Ya existia previamente
                            _oRequest.rev = result.MessageSet[0].rev;
                        }
                    }
                    oController.messageDB.post(oDictionary.oQueues.Message, _oRequest)
                        .then(function(oResult) {
                            resolve(oResult);
                        }).catch(function(e) {
                            reject(e);
                        });
                }.bind(oController, _oRequest));
        });
    };

    sap.ui.buffer.Message.prototype.searchInMessageDB = function(_id) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.messageDB.getById(oDictionary.oQueues.Message, _id)
                .then(function(oResult) {
                    if (oResult.MessageSet.length > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

    sap.ui.buffer.Message.prototype.searchAllInMessageDB = function(){
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.messageDB.get(oDictionary.oQueues.Message)
                .then(function(oResult){
                    resolve(oResult);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

})();