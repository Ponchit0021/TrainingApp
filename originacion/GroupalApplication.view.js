sap.ui.jsview("originacion.GroupalApplication", {

    /** Specifies the Controller belonging to this View. 
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.GroupalApplication
     */
    getControllerName: function() {
        return "originacion.GroupalApplication";
    },
    onBeforeShow: function(evt) {

    },
    createContent: function(oController) {

    //Middleware de componentes SAPUI5
    var  oActionBase, oLayoutBase, oPopupBase, oListBase, oContainerBase;
    //Page
    var currentView, oIndicatorGroupApp, oBarGroupApp, oPageMasterGroupApp;
    //Elementos de pagina
    var buttons, iconTabFilters, IconTabBar;

    //Indicador de carga
    oIndicatorGroupApp = new sap.m.MessagePage({
        text: "Cargando componentes...",
        icon: "sap-icon://overflow",
        description: "Espere un momento por favor"
    });
    this.addContent(oIndicatorGroupApp);

    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase",
        "js.base.ActionBase",
        "js.base.DisplayBase",
        "js.base.LayoutBase",
        "js.base.PopupBase",
        "js.base.ListBase",
        "js.base.ContainerBase");

    //Se declaran objetos de Middleware de componentes SAPUI5
   
    oActionBase = new sap.ui.mw.ActionBase();
    oLayoutBase = new sap.ui.mw.LayoutBase();
    oPopupBase = new sap.ui.mw.PopupBase();
    oListBase = new sap.ui.mw.ListBase();
    oContainerBase = new sap.ui.mw.ContainerBase();

    currentView = this;
   
        //Se crea botones de pagina
        buttons = [
            oActionBase.createButton("btnGropuGuardar", "Guardar", "Emphasized", "sap-icon://save", oController.sendToCore("SAVE"), oController),
            oActionBase.createButton("btnGropuEnviarCore", "", "Emphasized", "sap-icon://synchronize", oController.sendToCore(), oController)
          ];

        //Crear pagina
        oBarGroupApp = oContainerBase.createBar("", null, buttons, null);
        oPageMasterGroupApp = oContainerBase.createPage("oPageMasterGroupApp", "Solicitud Grupal", true, true, true, true, oController.onMessageWarningDialogPress.bind(oController), oController, oBarGroupApp);

        //Creacion de IconTabBar y  Tabs
        iconTabFilters = [
            oContainerBase.createIconTabFilter("itfGroupApp1", "itfGroupApp1", "sap-icon://activity-assigned-to-goal", ""),
            oContainerBase.createIconTabFilter("itfGroupApp2", "itfGroupApp2", "sap-icon://group", ""),
            oContainerBase.createIconTabFilter("itfGroupApp3", "itfGroupApp3", "sap-icon://folder", "")
        ];
        iconTabBar = oContainerBase.createIconTabBar("itbGroupApp", iconTabFilters, oController.selectIconTabBarFilter, oController);

        //Se agrega elementos a pagina
        oPageMasterGroupApp.addContent(iconTabBar);

        //Pre-Seleccion de TAB Nombre
        iconTabBar.fireSelect({
            key: 'itfGroupApp1'
        });

        //Crea dialogos
        oPopupBase.createDialog("appDialogMember", "Nuevo Integrante", "Message", "sap-icon://add");
        oPopupBase.createDialog("appDialogDetailMember", "Detalle Integrante", "Message", "");
        oPopupBase.createDialog("appDialogMeeting", "Lugar de Reunión", "Message", "sap-icon://add");
        oPopupBase.createDialog("appDialogSendCore", "Confirmación", "Message", "");
        oPopupBase.createDialog("appDialogRejectReason", "Seleccionar el Motivo de Rechazo", "Message", "");        oPopupBase.createDialog("privacyNotice", "Prevención de Lavado de Dinero", "Message", "sap-icon://message-information");
        oPopupBase.createDialog("privacyNoticePDF", "Aviso de Privacidad", "Message", "sap-icon://message-information");
        oPopupBase.createDialog("appDialogApprove", "Mensajes", "Message", "");

        //Se destruye indicador y se agrega pagina
        currentView.destroyContent();
        currentView.addContent(oPageMasterGroupApp);
  //  }, 0);
}
});
