(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.BP");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");

    sap.ui.base.Object.extend('sap.ui.buffer.BP', {
        constructor: function(_syncDB, sEntity) {
            this.syncDB =new sap.ui.db.Pouch(_syncDB);
            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            var oSchemaDB = new sap.ui.helper.Schema();
            this.syncDB.setSchema(oSchemaDB.getSyncDBSchema());
            this.sEntity = sEntity;
            this.sEntitySet = sEntity + "Set";
            this.sRequestQueue = "RequestQueue";

        },
    });
    sap.ui.buffer.BP.prototype.postRequest = function(_oRequest) {

        ///::: "RequestQueueLoanRequest"  deberia salir del diccionario
        var oDictionary;
        oDictionary = new sap.ui.helper.Dictionary();

        this.syncDB.getById(this.sRequestQueue + this.sEntity, _oRequest.id ).then(function (_oRequest, result){
        
            if ( result[this.sRequestQueue + this.sEntitySet] ){

                if ( result[this.sRequestQueue + this.sEntitySet].length > 0 ){ // Ya existia previamente
                    _oRequest.rev = result[this.sRequestQueue + this.sEntitySet][0].rev;
                }

            }
            this.syncDB.post(this.sRequestQueue + this.sEntity, _oRequest);

        }.bind(this, _oRequest));

    };

})();