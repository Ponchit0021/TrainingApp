sap.ui.controller("originacion.PrivacyNotice", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf originacion.PrivacyNotice
     */
    //  onInit: function() {
    //
    //  },

    /**
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
     * (NOT before the first rendering! onInit() is used for that one!).
     * @memberOf originacion.PrivacyNotice
     */
    //  onBeforeRendering: function() {
    //
    //  },

    /**
     * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
     * This hook is the same one that SAPUI5 controls get after being rendered.
     * @memberOf originacion.PrivacyNotice
     */
    //  onAfterRendering: function() {
    //
    //  },

    /**
     * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
     * @memberOf originacion.PrivacyNotice
     */
    //  onExit: function() {
    //
    //  }
    backToPage: function() {
        var router = sap.ui.core.UIComponent.getRouterFor(this);
        router.navTo("Applicants", {
            typeId: "4"
        }, false);

    },
    showPrivacyNotice: function(){

        var dialogPrivacy, message;
        //Se declaran objetos de Middleware de componentes SAPUI5
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oContainerBase = new sap.ui.mw.ContainerBase();

        dialogPrivacy = sap.ui.getCore().byId("privacyShortNotice");

        message = oDisplayBase.createText("", "Banco Compartamos Institución de Banca Múltiple, con domicilio en Insurgentes Sur, Núm. 1458 piso 11, Colonia Actipan, Delegación Benito Juárez, C.P. 03230, México, Ciudad de México., utilizará sus datos personales y financieros recabados para: Identificarlo como prospecto y prestarle los servicios que hayan sido solicitados. Para mayor información acerca del tratamiento y de los derechos que puede hacer valer, usted puede acceder al Aviso de Privacidad Integral para Prospecto a Cliente a través de la siguiente página:\n\n http://www.compartamos.com.mx");

        message.addStyleClass("sapPrivacyFormat");
        dialogPrivacy.addContent(message);
        dialogPrivacy.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", this.closePrivacy, this));

        dialogPrivacy.open();
    },
    closePrivacy: function(){
        var dialogPrivacy;

        dialogPrivacy = sap.ui.getCore().byId("privacyShortNotice");

        dialogPrivacy.destroyContent();
        dialogPrivacy.destroyButtons();
        dialogPrivacy.close();
    },
    readPDF: function(){
        var router;

        router = sap.ui.core.UIComponent.getRouterFor(this);
        router.navTo("PdfReader",{
            promoterId: 0
        }, false);
    }
});
