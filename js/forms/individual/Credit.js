(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.individual.Credit");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.SimpleTypes.TermBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.individual.Credit', {});
    sap.ui.mw.forms.individual.Credit.prototype.createCreditForm = function(_idForm, oController) {
        //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase;
        var oFloatType = new sap.ui.model.type.Float({
            "groupingEnabled": false,
            "decimalSeparator": "."
        });
        //Variables para formulario
        var oForm, radioButtonsLoanDestiny, oMaxAmountExpress;
        var yearsModel, oItemYear, monthsModel, oItemMonth, oItem, oItemFrequency, oFrequencyModel;
        var oDatePickerExpenditureDate, oDatePickerFirstPayment, oPatern;
        var oType, oRbGroupOptionDestinoPrestamo;
        var oPatternFuture, oDateTomorrow, oIdOportunidad, oDateValueFirstPayment, oDateValueExpenditure;
        var oSimpleTypeTerms;
        var oTxtNciPlazoSolicitado;

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

        oItem = new sap.ui.core.Item({
            text: "Seleccionar"
        });

        oItemFrequency = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });

        oFrequencyModel = new sap.ui.model.json.JSONModel("data-map/catalogos/frecuencia_C_IND_CI.json");



        //Se declaran objetos de Middleware de componentes SAPUI5      
        oInputBase = new sap.ui.mw.InputBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oListBase = new sap.ui.mw.ListBase();
        //Se crea formulario
        oForm = oLayoutBase.createForm(_idForm, true, 1, "Datos del Crédito");
        //se agrega contenido a formulario
        /// Set model to bind data
       
        oIdOportunidad = oController.getView().getModel("oLoanRequestModel").getProperty('/LoanRequestIdCRM'); /// Set model to bind data
        oMaxAmountExpress = sap.ui.getCore().AppContext.MaxAmount;
        if (!oMaxAmountExpress) {
            oMaxAmountExpress = 0;
        }

        oType = new sap.ui.model.type.Integer();

        oForm.addContent(oDisplayBase.labelTitle("", "Tiempo en la vivienda *"));
        oForm.addContent(oDisplayBase.createLabel("", "Años*"));
        oForm.addContent(oInputBase.createSelect("selectNciTiempoEnLaViviendaAnios", "/years", oItemYear, yearsModel, oController.onChanging(), oController).insertItem(oItem, 0).bindProperty("selectedKey", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/YearsOnHouse",
            type: oType
        }));

        oForm.addContent(oDisplayBase.createLabel("", "Meses*"));
        oForm.addContent(oInputBase.createSelect("selectNciTiempoEnLaViviendaMeses", "/months", oItemMonth, monthsModel, oController.onChanging(), oController).bindProperty("selectedKey", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/MonthsOnHouse",
            type: oType
        }).insertItem(oItem, 0));

        oForm.addContent(oDisplayBase.labelTitle("", "Tiempo en el local *"));
        oForm.addContent(oDisplayBase.createLabel("", "Años*"));
        oForm.addContent(oInputBase.createSelect("selectNciTiempoEnElLocalAnios", "/years", oItemYear, yearsModel, oController.onChanging(), oController).bindProperty("selectedKey", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/YearsOnLocal",
            type: oType
        }).insertItem(oItem, 0));

        oForm.addContent(oDisplayBase.createLabel("", "Meses*"));
        oForm.addContent(oInputBase.createSelect("selectNciTiempoEnElLocalMeses", "/months", oItemMonth, monthsModel, oController.onChanging(), oController).bindProperty("selectedKey", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/MonthsOnLocal",
            type: oType
        }).insertItem(oItem, 0));

        oForm.addContent(oDisplayBase.createLabel("", "Fecha de Primer Pago *"));
        oPatern = new sap.ui.model.type.Date({
            pattern: "dd.MM.yyyy",
            UTC: true
        });
        oDateValueFirstPayment = {
            path: "oLoanRequestModel>/GeneralLoanRequestData/FirstPaymentDate",
            type: oPatternFuture
        };

        oDatePickerFirstPayment = oInputBase.createDatePicker("dtpNciDateFechaDePrimerPago", "{oLoanRequestModel>/GeneralLoanRequestData/FirstPaymentDate}", "dd.MM.yyyy", "dd.MM.yyyy");

        
        oDatePickerFirstPayment.attachValidationError(function(evt) {
            sap.m.MessageToast.show("Por favor indique una fecha posterior al día de hoy. ");
        });
        oForm.addContent(oDatePickerFirstPayment);


        if (oMaxAmountExpress == 0) {
            oForm.addContent(oDisplayBase.createLabel("titleMonto", "Monto Solicitado"));
            var oMontSolicitado = oInputBase.createInputText("txtNciMontoSolicitado", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(13);
            oMontSolicitado.bindProperty("value", {
                path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/RequiredAmount",
                type: oFloatType
            });
            oForm.addContent(oMontSolicitado);
        } else {
            oForm.addContent(oDisplayBase.createLabel("titleMonto", "Monto Propuesto Express"));
            var oMontSolicitado = oInputBase.createInputText("txtNciMontoSolicitado", "Number", "$ 0.00", "", true, true).attachChange(oController.onChangingExpress("^(([0-9]){1,15})(\.[0-9]{1,2})?$"));
            oMontSolicitado.bindProperty("value", {
                path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/RequiredAmount",
                type: oFloatType
            });
            oForm.addContent(oMontSolicitado);
        }


        oForm.addContent(oDisplayBase.createLabel("", "Frecuencia Solicitada"));
        oForm.addContent(oInputBase.createSelect("selectNciFrecuenciaSolicitada", "/frecuencias", oItemFrequency, oFrequencyModel, null, null).bindProperty("selectedKey", {
            path: "oLoanRequestModel>/GeneralLoanRequestData/Frequency"
        }));

        oForm.addContent(oDisplayBase.createLabel("", "Plazo Solicitado"));
        oSimpleTypeTerms = new sap.ui.model.SimpleType.Term();
        oTxtNciPlazoSolicitado;
        oTxtNciPlazoSolicitado = oInputBase.createInputText("txtNciPlazoSolicitado", "Text", "$", "", true, false);
        oTxtNciPlazoSolicitado.bindProperty("value", {
            path: "oLoanRequestModel>/GeneralLoanRequestData/Term",
            type: oSimpleTypeTerms
        });
        oForm.addContent(oTxtNciPlazoSolicitado);

        oForm.addContent(oDisplayBase.createLabel("", "Ingresos Mensuales"));
        var oInMensuales = oInputBase.createInputText("txtIngresosMensuales", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(13);
        oInMensuales.bindProperty("value", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/TotalIncomeAmount",
            type: oFloatType
        });
        oForm.addContent(oInMensuales);

        oForm.addContent(oDisplayBase.createLabel("", "Gastos Mensuales"));
        var oGaMensuales = oInputBase.createInputText("txtGastosMensuales", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(13);
        oGaMensuales.bindProperty("value", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/TotalOutcomeAmount",
            type: oFloatType
        });
        oForm.addContent(oGaMensuales);

        oForm.addContent(oDisplayBase.createLabel("", "Cuota que puede pagar"));
        var oCuotaP = oInputBase.createInputText("txtCuotaQuePuedePagar", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(13);
        oCuotaP.bindProperty("value", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/FeeEnabledToPay",
            type: oFloatType
        });
        oForm.addContent(oCuotaP);

        radioButtonsLoanDestiny = [
            oInputBase.createRadioButtonForGroupName("rbNciActivityDestinoPrestamo0", "").setVisible(false),
            oInputBase.createRadioButtonForGroupName("rbNciActivityDestinoPrestamo1", "Capital de Trabajo"),
            oInputBase.createRadioButtonForGroupName("rbNciActivityDestinoPrestamo2", "Inversión / Activo Fijo")
        ];
        oForm.addContent(oDisplayBase.createLabel("", "Destino del Préstamo*"));
        oRbGroupOptionDestinoPrestamo = oInputBase.createRadioButtonGroup("rbGroupOptionDestinoPrestamo", radioButtonsLoanDestiny, 1);
        var oPaternInt = new sap.ui.model.type.String();
        oRbGroupOptionDestinoPrestamo.bindProperty("selectedIndex", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/LoanDestiny",
            type: oPaternInt
        });
        oForm.addContent(oRbGroupOptionDestinoPrestamo);
        oForm.addContent(oDisplayBase.createLabel("", "Fecha de Desembolso*"));

        oDateValueExpenditure = {
            path: "oLoanRequestModel>/GeneralLoanRequestData/ExpenditureDate",
            type: oPatternFuture
        };

        oDatePickerExpenditureDate = oInputBase.createDatePicker("txtNciDateFechaDeDesembolso", "{oLoanRequestModel>/GeneralLoanRequestData/ExpenditureDate}", "dd.MM.yyyy", "dd.MM.yyyy");

       
        oDatePickerExpenditureDate.attachValidationError(function(evt) {
            sap.m.MessageToast.show("Por favor indique una fecha posterior al día de hoy. ");
        });
        oForm.addContent(oDatePickerExpenditureDate);


        oForm.addContent(oDisplayBase.createLabel("", ""));

        if (oIdOportunidad !== "") {
            oForm.addContent(oActionBase.createButton("btnNciPorAprobar", "Por aprobar", "Emphasized", "sap-icon://accept", oController.toStateApprove(), oController).setEnabled(true));
        } else {
            oForm.addContent(oActionBase.createButton("btnNciPorAprobar", "Por aprobar", "Emphasized", "sap-icon://accept").setEnabled(false));
        }


        return oForm;
    }

})();
