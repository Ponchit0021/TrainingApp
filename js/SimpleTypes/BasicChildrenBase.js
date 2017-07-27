(function() {
    "use strict";

    jQuery.sap.require("sap.ui.model.SimpleType");


    sap.ui.model.SimpleType.extend('sap.ui.model.SimpleType.BasicChildren', {
        formatValue: function(oValue) { // Vista
            return oValue;
        },
        parseValue: function(oValue) {
            if (oValue == "") {
                return "";
            }
            return oValue.toString();
        },
        validateValue: function(oValue) {
            return oValue;
        }
    });

})();
