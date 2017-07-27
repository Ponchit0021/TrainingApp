sap.ui.jsview("originacion.MyPendings", {

    getControllerName: function() {
        return "originacion.MyPendings";
    },
    createContent: function(oController) {

        //Elementos de pagina;
        var oPagePendings, currentView;
        currentView = this;

        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.InputBase",
            "js.base.ContainerBase");

        oPagePendings = new sap.ui.mw.ContainerBase().createPage("oPagePendings", "Mis Pendientes (0) ", true, true, true, false, oController.toBack, oController)
        setTimeout(function() {
             var listGroup = new sap.m.List({
                id: 'ngPendings',
                title: 'Notificaciones'
            });

            //barra de busqueda
            oPagePendings.addContent(new sap.ui.mw.InputBase().createSearchField("", oController.searchPendingsTxt, oController, "100%"));
            oPagePendings.addContent(listGroup);
            currentView.destroyContent();
            currentView.addContent(oPagePendings);
        }, 0);
    }
});
