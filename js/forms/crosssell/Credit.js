(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.crosssell.Credit");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase", "js.SimpleTypes.TermBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.crosssell.Credit', {});
    sap.ui.mw.forms.crosssell.Credit.prototype.createForm = function(_oController) {
        var oContainerBase = new sap.ui.mw.ContainerBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase(),
            oInputBase = new sap.ui.mw.InputBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oPopupBase = new sap.ui.mw.PopupBase(),
            oListBase = new sap.ui.mw.ListBase(),
            oForm, floatTypeExtend;

        var oModel, oDateTomorrow, oPatternFuture, oItemMonth, oItem, oDestinyModel, oItemYear;
        var yearsModel, monthsModel, oFrequencyModel, oFloatType, oIntType, oPatern, oDatePickerFirstPayment, oDatePickerExpenditureDate,oDateValueFirstPayment, oDateValueExpenditureDate, crossSellLRid;
        var oSimpleTypeTerms;
        var txtCrossSellPlazoSolicitado, crossSellTermComplete, crossSellTerm;

        oModel = _oController.getView().getModel("oViewModel");
        sap.ui.model.SimpleType.extend("sap.ui.model.SimpleType.FloatType", {
            formatValue: function(oValue) {
                return oValue;
            },
            parseValue: function(oValue) {
                return oValue;
            },
            validateValue: function(oValue) {}
        });

        floatTypeExtend = new sap.ui.model.SimpleType.FloatType({}, { required: true });

        oDateTomorrow = new Date();
        oPatternFuture = new sap.ui.model.type.Date({
            pattern: "dd.MM.yyyy",
            UTC: true
        }, {
            minimum: oDateTomorrow /// is not less or equal, but less
        });

        yearsModel = new sap.ui.model.json.JSONModel("data-map/catalogos/years.json");
        //Cargamos el catálogo de años
        oItemYear = new sap.ui.core.Item({
            key: "{year}",
            text: "{year}"
        });

        monthsModel = new sap.ui.model.json.JSONModel("data-map/catalogos/months.json");
        //Cargamos el catálogo de meses
        oItemMonth = new sap.ui.core.Item({
            key: "{month}",
            text: "{month}"
        });

        //cargar catálogos de frecuencia y plazos.
        /* oItem = new sap.ui.core.Item({
             text: "Seleccionar"
         });*/

        oItem = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });

        //Creamos formulario
        oForm = oLayoutBase.createForm("frmCrossSellCredit", true, 1, "Datos del Crédito");
        oForm.setModel(oModel, "CrossSellApplicationModel");



        //Tipo de datos
        oFloatType = new sap.ui.model.type.Float({ "groupingEnabled": false, "decimalSeparator": "." });
        oIntType = new sap.ui.model.type.Integer();

        //ELEMENTOS DE LA FORMA
        oForm.addContent(oDisplayBase.createLabel("", "Monto Solicitado *"));
        var oCsaAmountRequired = oInputBase.createInputText("txtCrossSellMontoSolicitado", "Number", "$ 0.00", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/RequiredAmount}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(15);
        oCsaAmountRequired.bindProperty("value", {
            path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/RequiredAmount",
            type: floatTypeExtend
        });
        oForm.addContent(oCsaAmountRequired);

        //Dependera del tipo de credito hijo se cargara el catálogo de frecuencia correspondiente
        //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        var crossSellProduct = oModel.getProperty("/LRGeneralCrossSell/CrossSellProductId");
        var frecuency = oModel.getProperty("/GeneralLoanRequestData/Frequency");
        _oController.getFrecuencyModel(crossSellProduct).then(function(dataFrecuency){
            var frecuencySelect = sap.ui.getCore().byId("selectCrossSellFrecuenciaSolicitada");
            frecuencySelect.setModel(dataFrecuency);
            frecuencySelect.setSelectedKey(frecuency);                         
        }.bind(this));
        //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        oForm.addContent(oDisplayBase.createLabel("", "Frecuencia de Pago *"));
        oForm.addContent(oInputBase.createSelect("selectCrossSellFrecuenciaSolicitada", "/frecuencias", oItem, null, null, null).
            bindProperty("selectedKey",{ path: "CrossSellApplicationModel>/GeneralLoanRequestData/Frequency"}));


        crossSellTermComplete = oModel.getProperty("/GeneralLoanRequestData/Term");
        crossSellTerm = crossSellTermComplete.substring(8,10);
        oForm.addContent(oDisplayBase.createLabel("", "Plazo Solicitado *"));
        txtCrossSellPlazoSolicitado = oInputBase.createInputText("txtCrossSellPlazoSolicitado", "Text", "0", crossSellTerm + " PAGOS", true, false);
        oForm.addContent(txtCrossSellPlazoSolicitado);

        oForm.addContent(oDisplayBase.createLabel("", "Fecha de Primer Pago *"));
        oPatern = new sap.ui.model.type.Date({
            pattern: "dd.MM.yyyy",
            UTC: true
        });
        oDateValueFirstPayment = {
            path: "CrossSellApplicationModel>/GeneralLoanRequestData/FirstPaymentDate",
            type: oPatternFuture
        };

        oDatePickerFirstPayment = oInputBase.createDatePicker("dtpCrossSellFechaDePrimerPago", "{CrossSellApplicationModel>/GeneralLoanRequestData/FirstPaymentDate}", "dd.MM.yyyy", "dd.MM.yyyy");
        oDatePickerFirstPayment.attachValidationError(function(evt) {
            sap.m.MessageToast.show("Por favor indique una fecha posterior al día de hoy. ");
        });
        oForm.addContent(oDatePickerFirstPayment);

        oForm.addContent(oDisplayBase.createLabel("", "Cuota que puede pagar *"));
        var oCsaAmountCanPay = oInputBase.createInputText("txtCrossSellMontoPuedePagar", "Number", "$ 0.00", "{CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/FeeEnabledToPay}", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(15);
        oCsaAmountCanPay.bindProperty("value", {
            path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/FeeEnabledToPay",
            type: floatTypeExtend
        });
        oForm.addContent(oCsaAmountCanPay);

        if(crossSellProduct ==="C_IND_CCM_CCR" || crossSellProduct==="C_IND_CCM"){  
            //Se obtiene catálogo de destino de prestamo y se selecciona en el modelo.
            var destiny   = oModel.getProperty("/LinkSet/results/0/GrpCrossSellData/LoanDestiny");
            _oController.getDestinyModel().then(function(dataDestiny){
                var loanDestinySelect = sap.ui.getCore().byId("selectCrossSellDestinoPrestamo");
                loanDestinySelect.setModel(dataDestiny);
                loanDestinySelect.setSelectedKey(destiny);                         
            }.bind(this));
        
            oForm.addContent(oDisplayBase.createLabel("txtLoanDestiny", "Destino del prestamo *"));
            oForm.addContent(oInputBase.createSelect("selectCrossSellDestinoPrestamo", "/destinos", oItem, null, null, null).
            bindProperty("selectedKey",{ path: "CrossSellApplicationModel>/LinkSet/results/0/GrpCrossSellData/LoanDestiny"}));
        }
        
        oForm.addContent(oDisplayBase.createLabel("", "Fecha de Desembolso *"));
        oPatern = new sap.ui.model.type.Date({
            pattern: "dd.MM.yyyy",
            UTC: true
        });
        oDateValueExpenditureDate = {
            path: "CrossSellApplicationModel>/GeneralLoanRequestData/ExpenditureDate",
            type: oPatternFuture
        };

        oDatePickerExpenditureDate = oInputBase.createDatePicker("dtpCrossSellFechaDesembolso", "{CrossSellApplicationModel>/GeneralLoanRequestData/ExpenditureDate}", "dd.MM.yyyy", "dd.MM.yyyy");
        oDatePickerExpenditureDate.attachValidationError(function(evt) {
            sap.m.MessageToast.show("Por favor indique una fecha posterior al día de hoy. ");
        });

        oForm.addContent(oDatePickerExpenditureDate);
        oForm.addContent(oDisplayBase.createLabel("", ""));

        crossSellLRid = oModel.getProperty("/LoanRequestIdCRM");
        console.log(crossSellLRid);

        if (crossSellLRid != "") {
            oForm.addContent(oActionBase.createButton("btnCrossSellPorAprobar", "Por aprobar", "Emphasized", "sap-icon://accept", _oController.toStateApprove(), _oController).setEnabled(true));
        } else {
            oForm.addContent(oActionBase.createButton("btnCrossSellPorAprobar", "Por aprobar", "Emphasized", "sap-icon://accept").setEnabled(false));
        }

        return oForm;
    }
})();
