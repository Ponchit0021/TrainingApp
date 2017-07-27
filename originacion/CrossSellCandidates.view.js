sap.ui.jsview("originacion.CrossSellCandidates", {

    /** Specifies the Controller belonging to this View. 
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.CrossSellCandidates
     */
    getControllerName: function() {
        return "originacion.CrossSellCandidates";
    },

    createContent: function(oController) {

        var oContainerBase, oActionBase, oBarMasterFooterApplication, oPageMasterCrSellCandidates;
        var oMasterButtonsForm, bdLoader, oDisplayBase, oBarTableHeader;

        bdLoader = new sap.m.BusyDialog("bdLoaderCrSellCandidates", {
            text: 'Espere por favor...',
            title: 'Cargando'
        });

        jQuery.sap.require("js.base.ContainerBase", "js.base.ActionBase", "js.base.PopupBase", "js.base.ListBase", "js.base.InputBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.kapsel.Rest");

        oContainerBase = new sap.ui.mw.ContainerBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oListBase = new sap.ui.mw.ListBase();
        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();

        oPopupBase.createDialog("oDlSearchCrSellCandidates", "Busqueda Precandidato", "Message", "sap-icon://filter");
        oPopupBase.createDialog("oDlSearchResultCrSellCandidates", "Resultado", "Message");

        oMasterButtonsForm = [oActionBase.createButton("btnMarkRecToDownload", "Preparar Descarga", "Emphasized", "", oController.markRecordsToDownload, oController), oActionBase.createButton("", "", "Transparent", "sap-icon://search", oController.openFilters, oController)];
        oBarMasterFooterApplication = oContainerBase.createBar("", null, oMasterButtonsForm, null);
        oPageMasterCrSellCandidates = oContainerBase.createPage("oPageMasterCrSellCandidates", "Candidatos Online", true, true, true, true, oController.backToTiles, oController, oBarMasterFooterApplication);
        oPageMasterCrSellCandidates.addContent(oInputBase.createSearchField("crSellCandidateSearchList", oController.simpleSearchCrSellCandidate, oController, "100%"));
        oBarTableHeader = oContainerBase.createBar("", oDisplayBase.createText("txtSelectedCounter", "Seleccionados (0)"), null, oActionBase.createButton("", "", "Transparent", "sap-icon://sort", oController.sortTable, oController).setEnabled(false).setVisible(false));
        oPageMasterCrSellCandidates.addContent(oBarTableHeader);

        oTableFields = ["", "Candidato", "¿Descargar?", "Id Cliente", "Grupo", "Id Oportunidad"];
        oTableFieldsWidth = ["12%", "35%", "23%", "15%", "15%", "15%"];
        oTableFieldVisibility = [true, true, true, true, true, true];
        oTableFieldDemandPopid = [false, false, false, true, true, true];
        oTableCrSellCandidates = oListBase.createTable("tblListCrSellCandidates", "", sap.m.ListMode.None, oTableFields, oTableFieldVisibility, oTableFieldDemandPopid, oTableFieldsWidth, null, null);
        oPageMasterCrSellCandidates.addContent(oTableCrSellCandidates);

        return oPageMasterCrSellCandidates;
    }
});
