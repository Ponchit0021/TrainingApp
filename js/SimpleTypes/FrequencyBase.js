(function() {
    "use strict";

    jQuery.sap.require("sap.ui.model.SimpleType");


    sap.ui.model.SimpleType.extend('sap.ui.model.SimpleType.Frequency', {
        formatValue: function(oValue) { // Vista

            oValue = "" + oValue;

            if (oValue != "") {
               if ( oValue.substring(1,3) == 14){
                   return "Bi-Semanal";
               }else{
                   return "Mensual";
               }   
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
