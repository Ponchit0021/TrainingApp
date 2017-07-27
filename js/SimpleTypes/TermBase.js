(function() {
    "use strict";

    jQuery.sap.require("sap.ui.model.SimpleType");


    sap.ui.model.SimpleType.extend('sap.ui.model.SimpleType.Term', {
        formatValue: function(oValue) { // Vista

            if ( oValue != "" ){

              oValue = oValue.replace(/^[0]+/g,"");

            }
            return oValue;
        },
        parseValue: function(oValue) {
            return oValue;
        },
        validateValue: function(oValue) {
            return true;
        }
    });

})();
