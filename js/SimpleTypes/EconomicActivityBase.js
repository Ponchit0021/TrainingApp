(function() {
    "use strict";

    jQuery.sap.require("sap.ui.model.SimpleType");


    sap.ui.model.SimpleType.extend('sap.ui.model.SimpleType.EconomicActivityID', {
        formatValue: function(oValue) { // Vista
            return oValue;
        },
        parseValue: function(oValue) {
            return oValue;
        },
        validateValue: function(oValue) {
            return oValue;
        }
    });

})();
