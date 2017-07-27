sap.ui.jsview("originacion.SyncResults", {

    /** Specifies the Controller belonging to this View.
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.SyncResults
     */
    getControllerName: function() {
        return "originacion.SyncResults";
    },

    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
     * Since the Controller is given to this method, its event handlers can be attached right away.
     * @memberOf originacion.SyncResults
     */




    createContent: function(oController) {


        var bdLoader = new sap.m.BusyDialog("bdLoaderSyncResults", {
            text: 'Espere por favor...',
            title: 'Cargando'
        });

        //Elementos de pagina;
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase, oContainerBase;
        var currentView, oIndicatosdSyncResultsApp, oBardSyncResults, oPagedSyncResults, oPageDetaildSyncResults, oListRenovations, myModeldSyncResults, myTabledSyncResults;

        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.InputBase",
            "js.base.ActionBase",
            "js.base.DisplayBase",
            "js.base.LayoutBase",
            "js.base.PopupBase",
            "js.base.ListBase",
            "js.base.ContainerBase");

        //Se declaran objetos de Middleware de componentes SAPUI5
        oInputBase = new sap.ui.mw.InputBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oListBase = new sap.ui.mw.ListBase();
        oContainerBase = new sap.ui.mw.ContainerBase();
        currentView = this;


        var oTableResults;
        var myTableFieldsResults = ['', ''];
        var myTableFieldsResultsVisibility = [true, true];
        var myTableFieldsResultsDemandPopid = [false, false];
        var myTableFieldsResultsWidth = ['50%', '50%'];





        var myTableFields = ['Tipo', 'Nombre', '', 'Mensaje'];
        var myTableFieldsVisibility = [true, true, true, true];
        var myTableFieldsDemandPopid = [false, false, false, true];

        //var myTableFields = ['Tipo', 'id', "Mensaje", 'Icono'];
        //var myTableFieldsVisibility = [true, true, true, true];
        //var myTableFieldsDemandPopid = [false, false, true];

        var myFieldsWidth = ['20%', '30%', '10%', '40%']; //, '60%'];
        //setTimeout(function() {
        // detailButtons = [
        //     oActionBase.createButton("", "Guardar", "Accept", "sap-icon://save"),
        //     oActionBase.createButton("", "", "Default", "sap-icon://message-information"),
        //     oActionBase.createButton("", "", "Default", "sap-icon://camera"),
        //     oActionBase.createButton("", "", "Accept", "sap-icon://synchronize")
        // ];
        // botones
        oBardSyncResults = oContainerBase.createBar("", null, null, null);
        // oBarDetaildSyncResults = oContainerBase.createBar("", null, detailButtons, null);
        oPageMasterdSyncResults = oContainerBase.createPage("oPageMasterdSyncResults", "Sincronización", true, true, true, true, oController.toBack, oController);
        // oPageMasterdSyncResults = oContainerBase.createPage("oPageMasterdSyncResults", "Sincronización", true, true, true, true, oController.toBack, oController, oBardSyncResults);
        // oPageDetaildSyncResults = oContainerBase.createPage("oPageDetaildSyncResults", "Detalle", true, true, true, true, oController.goBackApp, oController, oBarDetaildSyncResults);
        oPageDetaildSyncResults = oContainerBase.createPage("oPageDetaildSyncResults", "Detalle", true, true, true, true, oController.goBackApp, oController);


       


        var oProgress = new sap.m.ProgressIndicator("oProgressIndicator", {

            enabled: true,
            state: sap.ui.core.ValueState.None,
            displayValue: "0",
            percentValue: 0,
            showValue: true,
            height: "18px",
            width: "100%"

        });



        oTableResults = oListBase.createTable("oTableResults", "", sap.m.ListMode.SingleSelectMaster, myTableFieldsResults, myTableFieldsResultsVisibility, myTableFieldsResultsDemandPopid, myTableFieldsResultsWidth, null, oController);

        var itemsTemplate = new sap.m.ColumnListItem({});
        itemsTemplate.setType(sap.m.ListType.Active);


        var oSyncOkResult = new sap.m.ObjectNumber("oSyncOkResult", {
            number: "0",
            numberUnit: "OK",
            state: sap.ui.core.ValueState.Success
        });

        var oSyncErrorResult = new sap.m.ObjectNumber("oSyncErrorResult", {
            number: "0",
            numberUnit: "Error",
            state: sap.ui.core.ValueState.Error
        });


        itemsTemplate.addCell(oSyncOkResult);
        itemsTemplate.addCell(oSyncErrorResult);

        oTableResults.addItem(itemsTemplate);










        oPageMasterdSyncResults.addContent(oProgress);


        var iconTabFilters = [
            oContainerBase.createIconTabFilter("appListResults1", "appListResults1", "sap-icon://activity-items", "Todos").setIconColor(sap.ui.core.IconColor.Normal),
            oContainerBase.createIconTabFilter("appListResults2", "appListResults2", "sap-icon://synchronize", "OK").setIconColor(sap.ui.core.IconColor.Positive),
            oContainerBase.createIconTabFilter("appListResults3", "appListResults3", "sap-icon://message-error", "Error").setIconColor(sap.ui.core.IconColor.Negative)
        ];
        var iconTabBar = oContainerBase.createIconTabBar("appBarResults1", iconTabFilters, oController.setFilterResults, oController);

        oPageMasterdSyncResults.addContent(iconTabBar);
        //oPageMasterdSyncResults.addContent(oTableResults);


        oPageMasterdSyncResults.addContent(oListBase.createTable("tbldSyncResults", "", sap.m.ListMode.SingleSelectMaster, myTableFields, myTableFieldsVisibility, myTableFieldsDemandPopid, myFieldsWidth, oController.onListItemPress, oController));


        //Se crean los dialogos que se usan en los tabs
        oPagedSyncResults = oContainerBase.createApp("oPagedSyncResults", "oPageMasterdSyncResults", oPageMasterdSyncResults, oPageDetaildSyncResults, "slide");
        currentView.destroyContent();
        currentView.addContent(oPagedSyncResults);
        //}, 1500);

    }
});
