sap.ui.jsview("originacion.CrossSellOffer", {
    getControllerName: function() {
        return "originacion.CrossSellOffer";
    },
    createContent: function(oController) {
        jQuery.sap.require("js.base.InputBase",
            "js.base.ActionBase",
            "js.base.DisplayBase",
            "js.base.LayoutBase",
            "js.base.ContainerBase",
            "js.base.ListBase",
            "js.base.PopupBase");
        var oContainerBase = new sap.ui.mw.ContainerBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oPopupBase = new sap.ui.mw.PopupBase(),
            oListBase = new sap.ui.mw.ListBase();
        var oPage;
        //botónes
        var oButtons = [
            oActionBase.createButton("btnAcceptOffer", "", "Accept", "sap-icon://accept", oController.onAcceptOffer, oController),
            oActionBase.createButton("btnRejectOffer", "", "Reject", "sap-icon://sys-cancel", oController.onRejectOffer, oController),
            oActionBase.createButton("btnCancelOffer", "Cancelar", null, null, oController.onCancelOffer, oController)
        ];
        //barra
        var oBarOffer = oContainerBase.createBar("barOffer", null, oButtons, null);

        //dialog
        var oDialogOfferReject = oPopupBase.createDialog("dlgRejectOffer", "Seleccionar Motivos de Rechazo", "Message", "sap-icon://decline");

        //page
        oPage = oContainerBase.createPage("pCrossSellOffer", "Propuesta", true, true, true, true, oController.onGoBack, oController, oBarOffer);
        return oPage;
    }
});
