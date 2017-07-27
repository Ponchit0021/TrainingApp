sap.ui.jsview("originacion.PrivacyNotice", {

    /** Specifies the Controller belonging to this View. 
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.PrivacyNotice
     */
    getControllerName: function() {
        return "originacion.PrivacyNotice";
    },

    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
     * Since the Controller is given to this method, its event handlers can be attached right away. 
     * @memberOf originacion.PrivacyNotice
     */
    createContent: function(oController) {

        //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase, oContainerBase;
        //Page
        var oPrivacyNoticePageAO, oForm;

        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.ActionBase",
            "js.base.DisplayBase",
            "js.base.LayoutBase",
            "js.base.PopupBase",
            "js.base.ContainerBase");

        //Se declaran objetos de Middleware de componentes SAPUI5
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oContainerBase = new sap.ui.mw.ContainerBase();

        //Se crea formulario
        oForm = oLayoutBase.createForm("idPrivacyForm", true, 1, "");
        oForm.addContent(oDisplayBase.createLabel());
        oForm.addContent(oActionBase.createButton("", "Aviso de Privacidad Corto","Default", "sap-icon://document-text", oController.showPrivacyNotice, oController));
        oForm.addContent(oDisplayBase.createLabel("",""));
        oForm.addContent(oActionBase.createButton("", "Aviso de Privacidad Integral", "Default", "sap-icon://pdf-attachment", oController.readPDF, oController));

        oPrivacyNoticePageAO = oContainerBase.createPage("PrivacyNoticePageAO", "Políticas de Privacidad", true, true, true, true, oController.backToPage, oController);

        oPrivacyNoticePageAO.addContent(oForm);
        //Se crea dialogo
        oPopupBase.createDialog("privacyShortNotice", "Aviso de Privacidad Corto", "Message", "sap-icon://message-information");

        return oPrivacyNoticePageAO;

    }
});
