sap.ui.jsfragment("js.fragments.signature.Signature", {

    createContent: function(oController) {
        "use strict";
        jQuery.sap.require("js.base.InputBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.ActionBase", "js.base.PopupBase");
        var oDialog, oForm;
        var oInputBase = new sap.ui.mw.InputBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase();

        oDialog = new sap.ui.mw.PopupBase().createDialog("idDialogSignatureFragment", "Avisos de privacidad", "Message", "");

        //formulario
        oForm = oLayoutBase.createForm("idSignatureFormFragment", true, 1, "");
        /*oForm.addContent(oInputBase.createCheckBox("chkBoxSignatureFragmemt", "Ruego y encargo", {path:"InsuranceDetailsModel>/results/0/ElectronicSignatureSet/NameRAndE",formatter:oController.onFormatNameRAndE}, true, oController.setSignatureRAndE, oController));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oInputBase.createInputText("txtSignatureRuegoEncargoFragment", "Text", "", "{InsuranceDetailsModel>/results/0/ElectronicSignatureSet/NameRAndE}", false, true, "^[A-Za-zÑÁÉÍÓÚñáéíóú+][\\s[A-Za-zÑÁÉÍÓÚñáéíóú]+]*$"));
        oForm.addContent(oDisplayBase.createTitle("", "Solicitante"));
        oForm.addContent(oActionBase.createButton("", "Firma de Solicitante", "Default", "sap-icon://signature", oController.setSignatureCustomer, oController));*/
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "Aviso de privacidad corto", "Emphasized", "", oController.showPreventionNotice, oController));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "Aviso de privacidad integral", "Emphasized", "", oController.showPrivacyNotice, oController));
        oDialog.addContent(oForm);

        //botones
        /*oDialog.addButton(oActionBase.createButton("btnAceptarSignatureFragment", "Aceptar", "Emphasized", "sap-icon://accept", oController.closeSignatureDialog, oController));*/
        oDialog.addButton(oActionBase.createButton("btnCerrarSignatureFragment", "Cerrar", "Emphasized", "sap-icon://sys-cancel", oController.closeSignatureDialog, oController));

        return oDialog;
    }

});
