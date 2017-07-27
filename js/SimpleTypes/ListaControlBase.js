(function() {
    "use strict";

    jQuery.sap.require("sap.ui.model.SimpleType");


    sap.ui.model.SimpleType.extend('sap.ui.model.SimpleType.ListaControl', {
        formatValue: function(oValue) { // Vista
            if (sap.ui.getCore().AppContext.bIsCreating) {
                return "";
            } 

           if (sap.ui.getCore().AppContext.oCurrentLoanRequest) {

                if (sap.ui.getCore().AppContext.oCurrentLoanRequest == null) {
                    return "";
              } else if (sap.ui.getCore().AppContext.oCurrentLoanRequest.loanRequestIdCRM == "") {
               return "";
              }

            }
           

            if (oValue == 0) {
                return "";
            } else if (oValue === undefined) {
                return "";
            } else if (oValue === "") {
                return "";
            } else if (oValue === 1) {
                return "Aprobado";
            } else if (oValue === 2) {
                return "Rechazado";
            } else if (oValue === 3) {
                return "";
            } else if (oValue === 4) {
                return "";
            } else {
                return "";
            }
        },
        parseValue: function(oValue) {
            if (oValue == "") {
                return 0;
            } else if (oValue === undefined) {
                return 0;
            } else if (oValue === "Aprobado") {
                return 1;
            } else if (oValue === "Rechazado") {
                return 2;
            } else if (oValue === "") {
                return 3;
            } else if (oValue === "") {
                return 4;
            } else {
                return 0;
            }
        },
        validateValue: function(oValue) {
            return true;
        }
    });


})();
