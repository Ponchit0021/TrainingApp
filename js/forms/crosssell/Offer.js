(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.crosssell.Offer");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.crosssell.Offer', {});
    sap.ui.mw.forms.crosssell.Offer.prototype.createForm = function(oModelCandidate, oModelOffer) {
        var oContainerBase = new sap.ui.mw.ContainerBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase(),
            oInputBase = new sap.ui.mw.InputBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oForm, oFloatTypeExtend, minAmount, maxAmount, oLine, oLayout;

        sap.ui.model.SimpleType.extend("sap.ui.model.SimpleType.FloatType", {
            formatValue: function(oValue) {
                var currentValue = "$" + parseFloat(oValue);
                return currentValue;
            },
            parseValue: function(oValue) {
                var currentValue = "$" + parseFloat(oValue);
                return currentValue;
            },
            validateValue: function(oValue) {}
        });
        oFloatTypeExtend = new sap.ui.model.SimpleType.FloatType({
            "maxFractionDigits": "2",
            "groupingEnabled": false,
            "decimalSeparator": "."
        }, { required: true });

        /*oFloatTypeExtend = new sap.ui.model.type.Float({
            "maxFractionDigits": "2",
            "groupingEnabled": false,
            "decimalSeparator": "."
        });
        */
        oForm = oLayoutBase.createForm("fCrossSellOffer", true, 1);
        oForm.setModel(oModelCandidate, "CrossSellCandidateModel");
        oForm.setModel(oModelOffer, "CrossSellOfferModel");

        //Solicitud Padre
        oForm.addContent(oDisplayBase.createTitle("tltSolicitud", "Solicitud Padre"));
        oForm.addContent(oDisplayBase.createLabel("", "Id Oportunidad"));
        oForm.addContent(oInputBase.createInputText("txtLoanRequestId", "Text", "", "{CrossSellCandidateModel>/results/0/ParentLoanRequestIdCRM}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Nombre del Grupo"));
        oForm.addContent(oInputBase.createInputText("txtLoanRequestName", "Text", "", "{CrossSellCandidateModel>/results/0/ParentGroupName}", true, false));

        //Candidato
        oForm.addContent(oDisplayBase.createTitle("tltCandidato", "Candidato"));
        oForm.addContent(oDisplayBase.createLabel("", "Id Cliente"));
        oForm.addContent(oInputBase.createInputText("txtCustomerId", "Text", "", "{CrossSellCandidateModel>/results/0/CandidateIdCRM}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Nombre Completo"));
        oForm.addContent(oInputBase.createInputText("txtCustomerName", "Text", "",
            "{CrossSellCandidateModel>/results/0/CandidateName/LastName}" + " " +
            "{CrossSellCandidateModel>/results/0/CandidateName/SecondName}" + " " +
            "{CrossSellCandidateModel>/results/0/CandidateName/FirstName}" + " " +
            "{CrossSellCandidateModel>/results/0/CandidateName/MiddleName}",
            true, false));

        //Condiciones del Crédito
        oForm.addContent(oDisplayBase.createTitle("tltCondiciones", "Condiciones de Crédito"));
        oForm.addContent(oDisplayBase.createLabel("", "Fecha de Oferta"));
        oForm.addContent(oInputBase.createDatePicker("", "{CrossSellOfferModel>/results/0/OfferDate}", "", "dd.MM.yyyy").setEditable(false));
        oForm.addContent(oDisplayBase.createLabel("", "Monto Ofrecido(min-máx)"));


        var minAmount = parseFloat(oModelOffer.getProperty("/results/0/MinAmountOffered")).toFixed(2);
        var maxAmount = parseFloat(oModelOffer.getProperty("/results/0/MaxAmountOffered")).toFixed(2);

        oLayout = oInputBase.createInputText("offerValue", "Text", "min-max", "$" + minAmount + " - $" + maxAmount, true, false);
        oForm.addContent(oLayout);
        return oForm;
    }
})();
