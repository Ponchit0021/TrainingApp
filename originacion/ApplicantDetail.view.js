sap.ui.jsview("originacion.ApplicantDetail", {

    /** Specifies the Controller belonging to this View.
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.ApplicantDetail
     */
    getControllerName: function() {
        return "originacion.ApplicantDetail";
    },


    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
     * Since the Controller is given to this method, its event handlers can be attached right away.
     * @memberOf originacion.ApplicantDetail
     */
    createContent: function(oController) {
        this.createDisplayView(oController);
    },

    createDisplayView: function(oController) {
        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.ActionBase",
            "js.base.PopupBase",
            "js.base.ContainerBase");

        var oActionBase, oContainerBase, oPopupBase, oCurrentView, oIconTabFiltersApplicants, oIconTabBar,  oBarApplicants, oPageDetailApplicants; 

        //Se declaran objetos de Middleware de componentes SAPUI5
        oActionBase = new sap.ui.mw.ActionBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oContainerBase = new sap.ui.mw.ContainerBase();
        oCurrentView = this;
        // setTimeout(function() {

        oFooterButtons = [
            oActionBase.createButton("btnSaveApplicant", "Guardar", "Emphasized", "sap-icon://save", oController.sendToCore("SAVE"), oController),
            // oActionBase.createButton("btnSaveApplicant", "Guardar", "Emphasized", "sap-icon://save", oController.save, oController),
            oActionBase.createButton("btnPrivacyApplicant", "", "Default", "sap-icon://message-information", oController.goToPrivacyNotice, oController),
            oActionBase.createButton("btnCameraApplicant", "", "Default", "sap-icon://camera", oController.goToDocs, oController),
            // oActionBase.createButton("btnSendToCoreApplicant", "", "Emphasized", "sap-icon://synchronize", oController.sendToBuffer, oController)
            oActionBase.createButton("btnSendToCoreApplicant", "", "Emphasized", "sap-icon://synchronize", oController.sendToCore(), oController)
        ];

        oBarApplicants = oContainerBase.createBar("", null, oFooterButtons, null);
        oPageDetailApplicants = oContainerBase.createPage("oPageDetailApplicants", "Solicitante", true, true, true, true, oController.onMessageWarningDialogPress, oController, oBarApplicants);

        oIconTabFiltersApplicants = [
            oContainerBase.createIconTabFilter("itfApplicantsName", "itfApplicantsName", "sap-icon://person-placeholder", "Nombre"),
            oContainerBase.createIconTabFilter("itfApplicantsPhone", "itfApplicantsPhone", "sap-icon://iphone", "Teléfonos"),
            oContainerBase.createIconTabFilter("itfApplicantsAddress", "itfApplicantsAddress", "sap-icon://home", "Direcciones"),
            oContainerBase.createIconTabFilter("itfApplicantsBasic", "itfApplicantsBasic", "sap-icon://inspection", "Básicos"),
            oContainerBase.createIconTabFilter("itfApplicantsComplementary", "itfApplicantsComplementary", "sap-icon://kpi-managing-my-area", "Complementarios"),
            oContainerBase.createIconTabFilter("itfApplicantsReference", "itfApplicantsReference", "sap-icon://add-activity", "Adicionales")
        ];
        oIconTabBar = oContainerBase.createIconTabBar("itbApplicants", oIconTabFiltersApplicants, oController.onTabSelect, oController);

        oPageDetailApplicants.addContent(oIconTabBar);

        oPopupBase.createDialog("appDialogSendCoreApplicant", "Confirmación", "Message", "");
        oCurrentView.destroyContent();
        oCurrentView.addContent(oPageDetailApplicants);
    }
});
