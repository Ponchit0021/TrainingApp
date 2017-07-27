(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.Customer");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");

    sap.ui.base.Object.extend('sap.ui.buffer.Customer', {
        constructor: function(_syncDB) {
            this.syncDB =new sap.ui.db.Pouch(_syncDB);
            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            var oSchemaDB = new sap.ui.helper.Schema();
            this.syncDB.setSchema(oSchemaDB.getSyncDBSchema());
            

        },
    });
    sap.ui.buffer.Customer.prototype.postRequest = function(_oRequest) {

        ///::: "RequestQueueLoanRequest"  deberia salir del diccionario
        var oDictionary;
        oDictionary = new sap.ui.helper.Dictionary();

        this.syncDB.getById(oDictionary.oQueues.Customer, _oRequest.id ).then(function (_oRequest, result){
        
            if ( result.RequestQueueCustomerSet ){

                if ( result.RequestQueueCustomerSet.length > 0 ){ // Ya existia previamente
                    _oRequest.rev = result.RequestQueueCustomerSet[0].rev;
                }

            }
            this.syncDB.post(oDictionary.oQueues.Customer, _oRequest);

        }.bind(this, _oRequest));

    };

})();