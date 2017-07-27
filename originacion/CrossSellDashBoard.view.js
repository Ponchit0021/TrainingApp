sap.ui.jsview("originacion.CrossSellDashBoard", {

    /** Specifies the Controller belonging to this View.
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.CrossSellDashBoard
     */
    getControllerName: function() {
        return "originacion.CrossSellDashBoard";
    },

    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
     * Since the Controller is given to this method, its event handlers can be attached right away.
     * @memberOf originacion.CrossSellingDashBoard
     */
    createContent: function(oController) {
        //Middleware de componentes SAPUI5
        var oDashBoardPageCrSell, oTitleBar, currentUser, oFooterBar, oContainerBase, oActionBase, oDisplayBase;
        jQuery.sap.require("js.base.ContainerBase", "js.base.DisplayBase", "js.base.ActionBase");

        oContainerBase = new sap.ui.mw.ContainerBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) !== true) {
            currentUser = "TEST";
        } else {
            currentUser = sap.ui.getCore().AppContext.applicationContext.registrationContext.user;
        }

        oTitleBar = oContainerBase.createBar("oTitleBarCrSellDashBoard", oActionBase.createButton("oNavButtonCrSellDB", "", null, "sap-icon://navigation-left-arrow", oController.backToTiles, oController), null, oDisplayBase.createText("", currentUser).addStyleClass("userBar"));
        oFooterBar = oContainerBase.createBar("", null, null, null);
        oDashBoardPageCrSell = oContainerBase.createPage("oPageDashBoardCrossSell", "Venta Cruzada", true, true, true, true, oController.backToTiles, oController, oFooterBar);
        oDashBoardPageCrSell.setCustomHeader(oTitleBar);
        oScrollTileContainer = new sap.m.ScrollContainer("oScrollTileContainerCrSell", {
            width: "100%",
            height: '100%',
            vertical: true
        }).addStyleClass('scrollTileContainer');
        oDashBoardPageCrSell.addContent(oScrollTileContainer);
        return oDashBoardPageCrSell;

    }
});
