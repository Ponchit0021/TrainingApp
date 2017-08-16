(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.CrossSellSystemNotification");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");

    sap.ui.base.Object.extend('sap.ui.buffer.CrossSellSystemNotification', {
        constructor: function(_notiDB) {
            var oSchemaDB;
            this.notiDB = new sap.ui.db.Pouch(_notiDB);

            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            oSchemaDB = new sap.ui.helper.Schema();

            this.notiDB.setSchema(oSchemaDB.getNotiDBSchema());
        }
    });
    /**
     * TRAINING - Inserta notificación de sistema de Venta Cruzada 
     * @param  {_oRequest}
     * @return {oResult}
     */
    sap.ui.buffer.CrossSellSystemNotification.prototype.postRequest = function(_oRequest) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.notiDB.post(oDictionary.oQueues.CrossSellSystemNotification, _oRequest)
                .then(function(oResult) {
                    resolve(oResult);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };
    /**
     * TRAINING - Revisa si existen notifaciones de sistema de Venta Cruzada 
     * @param  {_type - tipo de colección a buscar}
     * @return {results - regresa la colección de notificaciones de tipo Venta Cruzada}
     */
    sap.ui.buffer.CrossSellSystemNotification.prototype.searchInNotiDB = function(_type) {
        var oController, oDictionary, results;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.notiDB.get(_type)
                .then(function(oResult) {
                    results = { "results": oResult.CrossSellSystemNotificationSet };
                    resolve(results);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

})();