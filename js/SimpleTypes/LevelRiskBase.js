(function() {
    "use strict";

    jQuery.sap.require("sap.ui.model.SimpleType");


    sap.ui.model.SimpleType.extend('sap.ui.model.SimpleType.LevelRisk', {
        formatValue: function(oValue) { // Vista
            if (oValue == 0) {
                return "";
            }
            if (oValue == 1) {
                return "Muy Bajo";
            }
            if (oValue == 2) {
                return "Bajo";
            }
            if (oValue == 3) {
                return "Medio";
            }
            if (oValue == 4) {
                return "Alto";
            }
            if (oValue == 5) {
                return "Muy Alto";
            }
            if (oValue == -1) {
                return "Error";
            }
            if (oValue == 99) {
                return "Pendiente de filtros";
            }
            if (oValue == 100) {
                return "";
            }
            return "";
        },
        parseValue: function(oValue) {
            if (oValue == "") {
                return 0;
            }
            if (oValue == "Muy Bajo") {
                return 1;
            }
            if (oValue == "Bajo") {
                return 2;
            }
            if (oValue == "Medio") {
                return 3;
            }
            if (oValue == "Alto") {
                return 4;
            }
            if (oValue == "Muy Alto") {
                return 5;
            }
            if (oValue == "Error") {
                return -1;
            }
            if (oValue == "Pendiente de filtros") {
                return 99;
            }
            if (oValue == "") {
                return 100;
            }
            return 0;
        },
        validateValue: function(oValue) {
            return true;
        }
    });

})();
