sap.ui.jsview("originacion.IndividualApplications", {

    /** Specifies the Controller belonging to this View. 
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.Applications
     */
    getControllerName: function() {
        return "originacion.IndividualApplications";
    },

    //_handleRouteMatched: function(evt) {
        //var applicantID;


        //aplicationId: currentItem.loanRequestIdCRM,
        //aplicantId:
        /*
        applicantId = evt.getParameter("arguments").aplicantId;
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData({
            applicantID: applicantId
        });
        //this.setModel(oModel);
        sap.ui.getCore().setModel(oModel, "oModelIndividual");*/

    //},

    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
     * Since the Controller is given to this method, its event handlers can be attached right away. 
     * @memberOf originacion.Applications
     */
    createContent: function(oController) {

        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase, oContainerBase;

        var oPageIndividualApplication, oButtonsBar, iconTabFilters, iconTabBar;

        var oDialogEnviarAlCore, oBdLoader;


      //  this.router = sap.ui.core.UIComponent.getRouterFor(this);
      //  this.router.attachRoutePatternMatched(this._handleRouteMatched, this);

        jQuery.sap.require(
            "js.base.ContainerBase",
            "js.base.ActionBase",
            "js.base.LayoutBase",
            "js.base.InputBase",
            "js.base.PopupBase",
            "js.base.DisplayBase", "js.base.ListBase");

        oContainerBase = new sap.ui.mw.ContainerBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oPopupBase = new sap.ui.mw.PopupBase();

        //var currentView, oContainerBase, oActionBase, oIndicatorIndividualApp, oForm, oLayoutBase, oInputBase;

        oIndicatorIndividualApp = new sap.m.MessagePage({
            text: "Cargando componentes...",
            icon: "sap-icon://overflow",
            description: "Espere un momento por favor"
        });
        this.addContent(oIndicatorIndividualApp);
        currentView = this;

        setTimeout(function(oController) {
            oButtonsBar = [
                oActionBase.createButton("btnNciGuardar", "Guardar", "Emphasized", "sap-icon://save", oController.onSaveApplication, oController),
                //oActionBase.createButton("btnNciFirma", "Firma", "Default", "sap-icon://signature", oController.signatures, oController), //// MODIFICADO
                //oActionBase.createButton("", "", "Emphasized", "sap-icon://synchronize", oController.onShowSynchronizeConfirmation, oController)

                oActionBase.createButton("btnCameraCI", "", "Default", "sap-icon://camera", oController.goToDocs, oController),
                oActionBase.createButton("btnNciEnviarALCore", "", "Emphasized", "sap-icon://synchronize", oController.onSendToCore, oController).setEnabled(false)
            ];
            oFooterBarIndividualApplication = oContainerBase.createBar("", null, oButtonsBar, null);

            oPageIndividualApplication = oContainerBase.createPage("oPageIndividualApplication", "Solicitud Individual", true, true, true, true, oController.onMessageWarningDialogPress, oController, oFooterBarIndividualApplication);

            iconTabFilters = [
                oContainerBase.createIconTabFilter("itIndividual1", "itIndividual1", "sap-icon://activity-assigned-to-goal", ""),
                oContainerBase.createIconTabFilter("itIndividual2", "itIndividual2", "sap-icon://folder", ""),
                oContainerBase.createIconTabFilter("itIndividual3", "itIndividual3", "sap-icon://customer-and-contacts", ""),


                oContainerBase.createIconTabFilter("itIndividual4", "itIndividual4", "sap-icon://commission-check", "")
            ];

            iconTabBar = oContainerBase.createIconTabBar("itbIndividualApplication", iconTabFilters, oController.selectIconTabBarFilter, oController);
            iconTabBar.fireSelect({
                key: 'itIndividual1'
            });
            oPageIndividualApplication.addContent(iconTabBar);
            //////// Create popup - Seleccionar causa de excepción
            oDialogEnviarAlCore = oPopupBase.createDialog("popupNciDialogEnviarAlCore", "Enviar información", sap.m.DialogType.Standard);


            oDialogEnviarAlCore.addContent(oDisplayBase.createLabel("appIndDialogSendToCore", "¿Desea mandar la información al core?"));
            oDialogEnviarAlCore.addButton(oActionBase.createButton("btnNciAceptarEnviarAlCore", "Aceptar", "Emphasized", "", oController.sendToCore, oController));
            oDialogEnviarAlCore.addButton(oActionBase.createButton("btnNciCancelarEnviarAlCore", "Cancelar", "Emphasized", "", oController.onShowSynchronizeConfirmationClose, oController));

            oPopupBase.createDialog("appDialogSignatureIndividual", "Firmas", "Message", "");
            oPopupBase.createDialog("appDialogSignatureCaptureIndividual", "Firma", "Message", "");
            oPopupBase.createDialog("appDialogSave", "Confirmación", "Message", "");
            oPopupBase.createDialog("appDialogIndSendToCore", "Confirmación", "Message", "");
            oPopupBase.createDialog("privacyNoticeIndividual", "Prevención de Lavado de Dinero", "Message", "sap-icon://message-information");
            oPopupBase.createDialog("privacyNoticePDFIndividual", "Aviso de Privacidad", "Message", "sap-icon://message-information");
            oPopupBase.createDialog("appDialogApproveInd", "Mensajes", "Message", "");

            currentView.destroyContent();
            currentView.addContent(oPageIndividualApplication);

            oBdLoader = new sap.m.BusyDialog("bdLoaderSolicitudIndividual", {
                text: 'Espere por favor...',
                title: 'Cargando'
            });

        }(oController), 200);

    },

   /*  onBeforeShow: function(evt) {
       this.getController().onBeforeShow(evt);
    },*/

    onAfterShow: function (evt){
       //this.getController().onAfterShow(evt);
    }
});
