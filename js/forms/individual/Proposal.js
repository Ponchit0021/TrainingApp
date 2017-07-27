(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.individual.Proposal");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase");
    jQuery.sap.require("js.SimpleTypes.FrequencyBase");
    jQuery.sap.require("js.SimpleTypes.ProposedAmountBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.individual.Proposal', {});
    sap.ui.mw.forms.individual.Proposal.prototype.createProposalForm = function(_idForm, oController) {
        //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase;
        var oTxtNciMontoPropuesto, oTxtNciFrecuenciaPropuesta, oTxtNciCuotaPropuesta, oTxtNciPlazoPropuesto;
        var oSimpleTypeFrequency, oSourceId, oClientType;
        var oFloatType = new sap.ui.model.type.Float({
            "groupingEnabled": false,
            "decimalSeparator":"."
        });

        //Variables para formulario
        var oForm;
        //Dialogo de propuesta
        var oDialogProposal;
        var oFormProposal, oType;

        oClientType = "Nuevo";

        //Se declaran objetos de Middleware de componentes SAPUI5
        oInputBase = new sap.ui.mw.InputBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oListBase = new sap.ui.mw.ListBase();
        //Se crea formulario

        oForm = oLayoutBase.createForm(_idForm, true, 1, "Propuesta de Condiciones del Crédito");
        /// Set model to bind data
       

        oForm.addContent(oDisplayBase.createLabel("", "Tipo de Cliente"));
        oSourceId = oController.getView().getModel("oLoanRequestModel").getProperty("/LinkSet/results/0/Customer/BpMainData/SourceId");

        /**
         * Validación del tipo de cliente por fuente
         * Si es de fuente Z07 se muestra una leyenda de Subsecuente, cualquier otro caso se muestra la leyenda de Nuevo
         */
        if (oSourceId === "Z07") {
            oClientType = "Subsecuente";
        } 

        if (sap.ui.getCore().AppContext.MaxAmount != 0){
            oClientType = "Subsecuente Express";
        }

        oForm.addContent(oInputBase.createInputText("txtNciTipoDeCliente", "Text", oClientType, oClientType, true, false));


        oForm.addContent(oDisplayBase.createLabel("", "Liquidez Máxima"));
        var oLiqMax = oInputBase.createInputText("txtNciLiquidezMaxima", "Number", "$ 0.00", "", true, true,"^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(13);
        oLiqMax.bindProperty("value", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/MaxLiquidity",
            type: oFloatType
        });
        oForm.addContent(oLiqMax);
        oForm.addContent(oDisplayBase.createLabel("", ""));

        oForm.addContent(oActionBase.createButton("btnNciEntrevista", "Evaluación", "Emphasized", "sap-icon://survey", oController.onPressbtnNciEntrevista, oController));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("btnNciPropuesta", "Propuesta", "Emphasized", "sap-icon://simulate", oController.onProposal, oController));

        oForm.addContent(oDisplayBase.createLabel("", "Monto Propuesto*"));
        oSimpleTypeFrequency = new sap.ui.model.SimpleType.Frequency();
       
        oTxtNciMontoPropuesto = oInputBase.createInputText("txtNciMontoPropuesto", "Number", "$", "", true, false);
        oTxtNciMontoPropuesto.bindProperty("value", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/ProposedAmount",
            type: oFloatType
        });
        oForm.addContent(oTxtNciMontoPropuesto);

        oForm.addContent(oDisplayBase.createLabel("", "Frecuencia Propuesta *"));
        oTxtNciFrecuenciaPropuesta = oInputBase.createInputText("txtNciFrecuenciaPropuesta", "Text", "", "", true, false);
        oTxtNciFrecuenciaPropuesta.bindProperty("value", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/ProposedFrequency",
            type: oSimpleTypeFrequency
        });
        oForm.addContent(oTxtNciFrecuenciaPropuesta);

        oForm.addContent(oDisplayBase.createLabel("", "Cuota Propuesta *"));
        oTxtNciCuotaPropuesta = oInputBase.createInputText("txtNciCuotaPropuesta", "Number", "$", "", true, false);
        oTxtNciCuotaPropuesta.bindProperty("value", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/ProposedFee",
            type: oFloatType
        });
        oForm.addContent(oTxtNciCuotaPropuesta);


        oForm.addContent(oDisplayBase.createLabel("", "Plazo Propuesto*"));
        oTxtNciPlazoPropuesto = oInputBase.createInputText("txtNciPlazoPropuesto", "Number", "", "", true, false);
        oTxtNciPlazoPropuesto.bindProperty("value", {
            path: "oLoanRequestModel>/LinkSet/results/0/IndividualLoanData/ProposedPeriod",
            type: oFloatType
        });
        oForm.addContent(oTxtNciPlazoPropuesto);

        //////// Create popup - Propuesta
        oFormProposal = oLayoutBase.createForm("formPropuestaDialog", true, 2, "");
        oDialogProposal = oPopupBase.createDialog("popupNciPropuesta", "Propuesta", sap.m.DialogType.Standard);
        oFormProposal.addContent(oDisplayBase.createLabel("", "Cuota / Plazo"));
        //var nciCuotaPlazo = new sap.ui.model.json.JSONModel("data-map/deadlines.json");
        //Cargamos el catálogo de Tipos de Pagos de Seguros



        var nciCuotaPlazo, oItemnciCuotaPlazo;

        nciCuotaPlazo = new sap.ui.model.json.JSONModel("data-map/catalogos/years.json");
        //Cargamos el catálogo de años
        oItemnciCuotaPlazo = new sap.ui.core.Item({
            key: "{year}",
            text: "{year}"
        });

        oFormProposal.addContent(oInputBase.createSelect("selectNciCuotaPlazo", "/years", oItemnciCuotaPlazo, nciCuotaPlazo, null, null));

        //////////////////

        oFormProposal.addContent(oDisplayBase.createLabel("", "Monto"));
        oFormProposal.addContent(oInputBase.createInputText("txtNciMontoPropuesta", "Text", "", "", true, false));
        oFormProposal.addContent(oDisplayBase.createLabel("", "Frecuencia"));
        oFormProposal.addContent(oInputBase.createInputText("txtNciFrecuencia", "Text", "", "", true, false));
        oDialogProposal.addContent(oFormProposal);
        oDialogProposal.addButton(oActionBase.createButton("btnNciAceptarPropuesta", "Aceptar", "Emphasized", "", oController.onShowProposalAccept, oController));
        oDialogProposal.addButton(oActionBase.createButton("btnNciCancelarPropuesta", "Cancelar", "Emphasized", "", oController.onShowProposalClose, oController));
        oForm.addContent(oDialogProposal);
        return oForm;
    }

})();
