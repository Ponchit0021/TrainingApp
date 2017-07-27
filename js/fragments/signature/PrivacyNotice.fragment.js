sap.ui.jsfragment("js.fragments.signature.PrivacyNotice", {

    createContent: function(oController) {
        "use strict";
        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase", "js.base.PopupBase", "js.base.ContainerBase");

        var oDialog;
        var oDisplayBase = new sap.ui.mw.DisplayBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oPopupBase = new sap.ui.mw.PopupBase();

        oDialog = oPopupBase.createDialog("idDialogPrivacyNotice", "Aviso de Privacidad", "Message", "sap-icon://message-information", "100%");
        oDialog.addContent(oDisplayBase.createReaderPDF("../www/js/vendor/pdfjs/web/viewer.html", "sapReaderPDF"));
        oDialog.addButton(oActionBase.createButton("btnAceptarPrivacyNotice", "Aceptar", "Emphasized", "", oController.closePrivacyNoticeDialog, oController));

        return oDialog;
    }

});
