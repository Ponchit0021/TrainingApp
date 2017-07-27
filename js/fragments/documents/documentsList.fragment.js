sap.ui.jsfragment("js.fragments.documents.documentsList", {

    createContent: function(oParameter) {
        "use strict";
        // console.log(oParameter);
        console.log("-->INICIANDO FRAGMENT DOCUMENT");
        jQuery.sap.require("js.base.InputBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.ActionBase", "js.base.PopupBase", "js.base.ContainerBase","js.base.DocumentsBase");
        var oDialog, oContainerBase, oButtons, oBarDocuments,
            oInputBase = new sap.ui.mw.InputBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase(),
            oPopupBase = new sap.ui.mw.PopupBase(),
            oDocumentsBase = oParameter[1],
            oController = oParameter[0],
            oFnController = oParameter[2],
            oListBase = new sap.ui.mw.ListBase();
        var oTblDocumentsFields, oTblDocumentsFieldsVisibility, oTblDocumentsFieldsDemandPopin, oTblDocumentsFieldsWidth, oTblDocuments;
        oTblDocumentsFields = ["", ""];
        oTblDocumentsFieldsVisibility = [true, true];
        oTblDocumentsFieldsDemandPopin = [false, false];
        oTblDocumentsFieldsWidth = ["75%", "25%"];
        oTblDocuments = oListBase.createTable(oDocumentsBase.getIdTblDocuments(), "", sap.m.ListMode.SingleSelectMaster, oTblDocumentsFields, oTblDocumentsFieldsVisibility, oTblDocumentsFieldsDemandPopin, oTblDocumentsFieldsWidth, null, null).addStyleClass("fixTblDoccuments");
        oButtons = [oActionBase.createButton("oButtonCloseDocuments", "Cerrar", "Emphasized", "sap-icon://sys-cancel", oFnController, oController)];
        oTblDocuments.setNoDataText("Cargando datos..."); 
        oDialog = oPopupBase.createDialog("oDialogDocuments", "Documentos", "Message", "sap-icon://camera", "100%", "100%", oButtons, oTblDocuments).addStyleClass("fixPaddingFragment");
        return oDialog;
    }


});
