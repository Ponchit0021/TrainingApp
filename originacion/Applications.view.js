sap.ui.jsview("originacion.Applications", {

    /** Specifies the Controller belonging to this View. 
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.Applications
     */
    getControllerName: function() {
        return "originacion.Applications";
    },
    
    createContent: function(oController) {

        var oContainerBase, oActionBase,oPopupBase ,oInputBase , oBarMasterFooterApplication, oPageMasterApplication, oMasterButtonsForm, radioButtonSolic, bdLoader, oDisplayBase;
      
        bdLoader = new sap.m.BusyDialog("bdLoaderSolicitudes", {
            text: 'Espere por favor...',
            title: 'Cargando'
        });

        jQuery.sap.require("js.base.ContainerBase", "js.base.ActionBase", "js.base.LayoutBase", "js.base.InputBase", "js.base.PopupBase", "js.base.DisplayBase", "js.base.ListBase");
        jQuery.sap.require("js.kapsel.Rest");

        oContainerBase = new sap.ui.mw.ContainerBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oListBase = new sap.ui.mw.ListBase();
        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();

        var LoRuta = sap.ui.core.UIComponent.getRouterFor(this);
        

        oPopupBase.createDialog("nsDialogSearch", "Filtros", "Message", "sap-icon://filter");
        oPopupBase.createDialog("nsDialogProduct", "Seleccionar Tipo de Crédito", "Message", "sap-icon://multi-select");
        oPopupBase.createDialog("nsDialogApplicants", "Seleccionar Solicitante", "Message", "sap-icon://multi-select");

        oMasterButtonsForm = [oActionBase.createButton("", "", "Transparent", "sap-icon://search", oController.openFilters, oController), oActionBase.createButton("btnAddApplications", "", "Emphasized", "sap-icon://add", oController.addApplications, oController)];
        oBarMasterFooterApplication = oContainerBase.createBar("", null, oMasterButtonsForm, null);

        oPageMasterApplication = oContainerBase.createPage("oPageMasterApplication", "Solicitudes", true, true, true, true, oController.backToTiles, oController, oBarMasterFooterApplication);

        oPageMasterApplication.addContent(oInputBase.createSearchField("apicationSearchList", oController.searchAplicationTxt, oController, "100%"));

        radioButtonSolic = [
            oInputBase.createRadioButtonForGroupName("rbNTodas", "Todas"),
            oInputBase.createRadioButtonForGroupName("rbNSolic", "Solicitudes"),
            oInputBase.createRadioButtonForGroupName("rbNRenov", "Renovaciones")
            
        ];

        oPageMasterApplication.addContent(oInputBase.createRadioButtonGroup("rbGroupOptionSolicitudes", radioButtonSolic, 4).attachSelect(oController.onItemRadio));


        var oTableFields = ["", "","", ""];
        var oTableFieldsWidth = ["25%","15%", "30%", "30%"];
        var oTableFieldVisibility = [true, true, true, true];
        var oTableFieldDemandPopid = [false, false, false, false];

        //Validamos que la opcion sea Seguros
        var leyendaSeguros = oDisplayBase.createLabel("lblLeyendaIns", "");
        oPageMasterApplication.addContent(leyendaSeguros);

        oTableSolicitudes = oListBase.createTable("tblListSolicitudes", "", sap.m.ListMode.SingleSelectMaster, oTableFields, oTableFieldVisibility, oTableFieldDemandPopid, oTableFieldsWidth, oController.onSelectApplications, oController);
        oPageMasterApplication.addContent(oTableSolicitudes);

        var applicationsList = new sap.m.List("ngListApplications", {
            itemPress: [oController.onSelectApplications, oController]
        });

        return oPageMasterApplication;
    }
});
