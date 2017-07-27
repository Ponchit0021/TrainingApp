(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.LoanRequest");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");


    sap.ui.base.Object.extend('sap.ui.buffer.LoanRequest', {
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


    sap.ui.buffer.LoanRequest.prototype.postRequest = function(_oRequest) {

        ///::: "RequestQueueLoanRequest"  deberia salir del diccionario
        var oDictionary;
        oDictionary = new sap.ui.helper.Dictionary();

        this.syncDB.getById(oDictionary.oQueues.LoanRequest, _oRequest.id ).then(function (_oRequest, result){
        
            if ( result.RequestQueueLoanRequestSet ){

                if ( result.RequestQueueLoanRequestSet.length > 0 ){ // Ya existia previamente
                    _oRequest.rev = result.RequestQueueLoanRequestSet[0].rev;
                }

            }
            this.syncDB.post(oDictionary.oQueues.LoanRequest, _oRequest);

        }.bind(this, _oRequest));

    };




})();
