(function() {
    "use strict";
    jQuery.sap.declare("sap.rules.CrossSell");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.rules.CrossSell', {});

    sap.rules.CrossSell.prototype.getStructure = function() {
        return {
            "bussinessRules": [{
                "name": "validateMinMax",
                "desc": "Validar el valor maximo y minino contra el monto solicitado.",
                "fx": "validateMinMax",
                "rules": [{
                    "pathMin": "/LRGeneralCrossSell/MinAmountOffered",
                    "pathMax": "/LRGeneralCrossSell/MaxAmountOffered",
                    "pathRequiredAmount": "/LinkSet/results/0/GrpCrossSellData/RequiredAmount"
                }],
                "message": "Revisa el monto solicitado: ",
                "isTab": true,
                "tabError": "CreditData"
            },{
                "name": "validateGuarantor",
                "desc": "Validar Aval para credito hijo.",
                "fx": "validateGuarantor",
                "rules": [{
                    "pathGuarantorId": "/GroupCrossSellAssignedGuarantorSet/CustomerIdCRM",
                    "isGuarantorIdRequired": true,
                }],
                "message": "Captura Aval",
                "isTab": true,
                "tabError": "GuarantorData"
            }]
        }
    }
    sap.rules.CrossSell.prototype.getValidations = function() {
        return {
            "validations": [
                { "field": "BusinessIncome", "path": "/LinkSet/results/0/GrpCrossSellData/BusinessIncome", "required": true, "tabError": "LiquidityData", "isTab": true },
                { "field": "SpouseContribution", "path": "/LinkSet/results/0/GrpCrossSellData/SpouseContribution", "required": false, "tabError": "LiquidityData", "isTab": true },
                { "field": "FamilyContribution", "path": "/LinkSet/results/0/GrpCrossSellData/FamilyContribution", "required": true, "tabError": "LiquidityData", "isTab": true },
                { "field": "MoneyTransfer", "path": "/LinkSet/results/0/GrpCrossSellData/MoneyTransfer", "required": false, "tabError": "LiquidityData", "isTab": true },
                { "field": "OtherIncome", "path": "/LinkSet/results/0/GrpCrossSellData/OtherIncome", "required": true, "tabError": "LiquidityData", "isTab": true },
                { "field": "BusinessExpenses", "path": "/LinkSet/results/0/GrpCrossSellData/BusinessExpenses", "required": true, "tabError": "LiquidityData", "isTab": true },
                { "field": "HouseholdExpenses", "path": "/LinkSet/results/0/GrpCrossSellData/HouseholdExpenses", "required": true, "tabError": "LiquidityData", "isTab": true },
                { "field": "ServiceAndRentExpenses", "path": "/LinkSet/results/0/GrpCrossSellData/ServiceAndRentExpenses", "required": true, "tabError": "LiquidityData", "isTab": true },
                { "field": "CompartamosFee", "path": "/LinkSet/results/0/GrpCrossSellData/CompartamosFee", "required": true, "tabError": "LiquidityData", "isTab": true },
                { "field": "OtherDebts", "path": "/LinkSet/results/0/GrpCrossSellData/OtherDebts", "required": true, "tabError": "LiquidityData", "isTab": true },
                { "field": "RequiredAmount", "path": "/LinkSet/results/0/GrpCrossSellData/RequiredAmount", "required": true, "tabError": "CreditData", "isTab": true },
                { "field": "FeeEnabledToPay", "path": "/LinkSet/results/0/GrpCrossSellData/FeeEnabledToPay", "required": true, "tabError": "CreditData", "isTab": true },
                { "field": "ExpenditureDate", "path": "/GeneralLoanRequestData/ExpenditureDate", "required": true, "tabError": "CreditData", "isTab": true }
            ],
            "message": "Faltan campos obligatorios"
        }
    }

})();
