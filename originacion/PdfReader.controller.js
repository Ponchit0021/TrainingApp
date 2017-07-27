sap.ui.controller("originacion.PdfReader", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf originacion.PdfReader
     */
    //  onInit: function() {
    //
    //  },

    /**
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
     * (NOT before the first rendering! onInit() is used for that one!).
     * @memberOf originacion.PdfReader
     */
    //  onBeforeRendering: function() {
    //
    //  },

    /**
     * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
     * This hook is the same one that SAPUI5 controls get after being rendered.
     * @memberOf originacion.PdfReader
     */
    onAfterRendering: function() {
        //var pdfUrl = "pdf/AvisoPrivacidadCliente.pdf";
        //document.getElementById("pdfFrame").setAttribute("src", pdfUrl);
    },
    /**
     * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
     * @memberOf originacion.PdfReader
     */
    //  onExit: function() {
    //
    //  }
    backToPage: function() {
        window.history.go(-1);

    },
    goToDetail: function() {
        var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
        oCurrentApp.to("oPageDetailApplication");

    },
    goBackApp: function() {
        var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
        oCurrentApp.back();
    },
    selectIconTabBarFilter: function(evt) {
        // console.log(evt);
        var oActionBase = new sap.ui.mw.ActionBase();
        //console.log(evt.getParameter("key"));
        var currentTabFilter = sap.ui.getCore().byId(evt.getParameter("key"));

        currentTabFilter.addContent(oActionBase.createButton());
        //alert("");
    }
});
