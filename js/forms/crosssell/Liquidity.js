(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.crosssell.Liquidity");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase", "js.SimpleTypes.BasicChildrenBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.crosssell.Liquidity', {});
    sap.ui.mw.forms.crosssell.Liquidity.prototype.createForm = function(_oController) {
        var oContainerBase = new sap.ui.mw.ContainerBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase(),
            oInputBase = new sap.ui.mw.InputBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oForm, oModel, oFloatType, oIntType, floatTypeExtend;

        //Tipo de datos
        oFloatType = new sap.ui.model.type.Float({ "groupingEnabled": false, "decimalSeparator": "." });
        oIntType = new sap.ui.model.type.Integer();

        var oTypeBasicChildren = new sap.ui.model.SimpleType.BasicChildren();



        sap.ui.model.SimpleType.extend("sap.ui.model.SimpleType.FloatType", {
            formatValue: function(oValue) {
                return oValue;
            },
            parseValue: function(oValue) {
                return oValue;
            },
            validateValue: function(oValue) {
            }
        });

        floatTypeExtend=new sap.ui.model.SimpleType.FloatType({},{required:true});


        oModel = _oController.getView().getModel("oViewModel");
        oForm = oLayoutBase.createForm("fCrossSellLiquidity", true, 1, "Cálculo de Liquidez");
        oForm.setModel(oModel, "CrossSellApplicationModel");
        oForm.addContent(oDisplayBase.createLabel("", "Ingresos del Negocio*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellBusinessIncome", "Number", "", "", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$")
           .setMaxLength(15)
            .bindProperty("value", {
              path : "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/BusinessIncome",
              type : floatTypeExtend
            }));

        oForm.addContent(oDisplayBase.createLabel("", "Aporte del Conyuge*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellSpouseContribution", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/SpouseContribution}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$",true)
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/SpouseContribution",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Aporte Hijo(s) / Familiar(es)*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellFamilyContribution", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/FamilyContribution}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$",true)
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/FamilyContribution",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Envío de dinero*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellMoneyTransfer", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/MoneyTransfer}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$")
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/MoneyTransfer",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Otros*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellOtherIncome", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/OtherIncome}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$")
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/OtherIncome",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Total de ingresos*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellTotalIncome", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/TotalIncome}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Gastos del negocio*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellBusinessExpenses", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/BusinessExpenses}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$")
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/BusinessExpenses",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Hogar / Alimentos*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellHouseholdExpenses", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/HouseholdExpenses}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$")
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/HouseholdExpenses",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Servicios / Renta*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellServiceAndRentExpenses", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/ServiceAndRentExpenses}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$")
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/ServiceAndRentExpenses",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Cuotas Compartamos*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellCompartamosFee", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/CompartamosFee}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$")
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/CompartamosFee",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Otras deudas*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellOtherDebts", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/OtherDebts}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$")
            .setMaxLength(15)
            .bindProperty("value", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/OtherDebts",
                type: floatTypeExtend
            }));
        oForm.addContent(oDisplayBase.createLabel("", "Total de gastos"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellTotalExpenses", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/TotalExpenses}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Liquidez disponible total (mensual)"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellTotalMonthlyLiquidity", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/TotalMonthlyLiquidity}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Liquidez máxima permitida"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellMaxAllowedLiquidity", "Number", "", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/MaxAllowedLiquidity}", true, false));

        return oForm;
    }
})();
