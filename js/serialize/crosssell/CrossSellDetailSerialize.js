(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.CrossSellDetailSerialize");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");

    sap.ui.base.Object.extend('sap.ui.serialize.CrossSellDetailSerialize', {
        constructor: function(_dataDB) {

            var oSchemaDB;
            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            jQuery.sap.require("js.base.DisplayBase");
            jQuery.sap.require("js.base.ObjectBase");

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema()); /// ::: Set schema de Pouch deberia aceptar parametro

        }
    });

    sap.ui.serialize.LoanRequest.prototype.serialize = function(_oData) {};

})();
