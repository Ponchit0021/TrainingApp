sap.ui.jsview("originacion.CrossSellApplication", {

    getControllerName: function() {
        return "originacion.CrossSellApplication";
    },
    createContent: function(oController) {
        jQuery.sap.require("js.base.InputBase",
            "js.base.ActionBase",
            "js.base.DisplayBase",
            "js.base.LayoutBase",
            "js.base.ContainerBase",
            "js.base.PopupBase");

        var oContainerBase = new sap.ui.mw.ContainerBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oPage, oTabCrossSell, oIconTabBar, oBdLoader;
        var oPopupBase = new sap.ui.mw.PopupBase();

        //tabs
        oIconTabFiltersCrossSell = [
            oContainerBase.createIconTabFilter("itfCrossSellMainData", "itfCrossSellMainData", "sap-icon://activity-assigned-to-goal"),
            oContainerBase.createIconTabFilter("itfCrossSellLiquidityData", "itfCrossSellLiquidityData", "sap-icon://compare"),
            oContainerBase.createIconTabFilter("itfCrossSellCreditData", "itfCrossSellCreditData", "sap-icon://folder"),
            oContainerBase.createIconTabFilter("itfCrossSellGuarantorData", "itfCrossSellGuarantorData", "sap-icon://account"),
        ];
        oIconTabBar = oContainerBase.createIconTabBar("itbCrossSell", oIconTabFiltersCrossSell, oController.onTabSelect, oController);

        //botónes
        var oButtons = [
            oActionBase.createButton("btnSaveCrossSell", "Guardar", "Emphasized", "sap-icon://save", oController.openConfirmDialog, oController),

            oActionBase.createButton("btnSendToCoreCrossSell", "", "Emphasized", "sap-icon://synchronize", oController.openConfirmDialog, oController).setEnabled(false),
        ];
        //barra
        var oBarOffer = oContainerBase.createBar("barCrossSell", null, oButtons, null);
        //dialogs
        oPopupBase.createDialog("crSellAppDialogSave", "Confirmación", "Message", "");
        //page
        oPage = oContainerBase.createPage("pCrossSell", "", true, true, true, true, oController.onMessageWarningDialogPress, oController, oBarOffer);
        oPage.addContent(oIconTabBar);
        oBdLoader = new sap.m.BusyDialog("bdLoaderCrossSellApplication", {
            text: 'Espere por favor...',
            title: 'Cargando'
        });
        oPopupBase.createDialog("appDialogCrossSellConfirm", "Confirmación", "Message", "");
        return oPage;
    }
});
