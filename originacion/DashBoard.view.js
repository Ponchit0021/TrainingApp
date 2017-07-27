sap.ui.jsview("originacion.DashBoard", {

    /** Specifies the Controller belonging to this View.
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.DashBoard
     */
    getControllerName: function() {
        return "originacion.DashBoard";
    },

    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
     * Since the Controller is given to this method, its event handlers can be attached right away.
     * @memberOf originacion.DashBoard
     */
    createContent: function(oController) {
        //Middleware de componentes SAPUI5
        var oTileBase;
        var oDashBoardPage, structureDashBoardTile, oModelDashBoard, oTileContainer, oTitleBar, imgBrand, currentUser, oFooterBar, currentUser;
        jQuery.sap.require("js.base.TileBase", "js.base.ContainerBase", "js.base.DisplayBase", "js.base.ActionBase");

        bdLoader = new sap.m.BusyDialog("bdLoaderDashboard", {
            text: 'Sincronizando...',
            title: 'Proceso de Sincronización'
        });

        oTileBase = new sap.ui.mw.TileBase();
        oContainerBase = new sap.ui.mw.ContainerBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) !== true) {
            currentUser = "TEST";
        } else {
            currentUser = sap.ui.getCore().AppContext.applicationContext.registrationContext.user;
        }
        var arrayButtons = [];
        var buttonLog = oActionBase.createButton("btnLog", "Registros", null, "sap-icon://activity-items", oController.viewLogList, oController);
        arrayButtons.push(buttonLog);
        var btnSyncAction = oActionBase.createButton("btnSyncAction", "Sincronizar", null, "sap-icon://synchronize", oController.syncWithCore, oController);
        arrayButtons.push(btnSyncAction);
        var actionSheet = oActionBase.createActionSheet("asSync", "Top", arrayButtons);

        imgBrand = oDisplayBase.createImage("", "img/logo.png", "");
        oFooterButton = [oActionBase.createButton("btnSync", "Sincronización", "Emphasized", "sap-icon://synchronize", oController.loadButtonsSync, oController)];
        oTitleBar = oContainerBase.createBar("", imgBrand, null, oDisplayBase.createText("", currentUser).addStyleClass("userBar"));
        oFooterBar = oContainerBase.createBar("", null, oFooterButton, null);
        oDashBoardPage = oContainerBase.createPage("dashBoardAO", "Solicitudes", false, true, false, true, null, null, oFooterBar);
        oDashBoardPage.setCustomHeader(oTitleBar);
       oScrollTileContainer = new sap.m.ScrollContainer("oScrollTileContainer",{
            width: "100%",
            height: '100%',
            vertical: true
        }).addStyleClass('scrollTileContainer');
        oDashBoardPage.addContent(oScrollTileContainer);
        return oDashBoardPage;

    }
});
