sap.ui.jsview("originacion.ApplicantList", {

    /** Specifies the Controller belonging to this View.
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.ApplicantList
     */
    getControllerName: function() {
        return "originacion.ApplicantList";
    },


    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
     * Since the Controller is given to this method, its event handlers can be attached right away.
     * @memberOf originacion.ApplicantList
     */
    createContent: function(oController) {

        jQuery.sap.require("js.base.InputBase",
            "js.base.DisplayBase",
            "js.base.LayoutBase",
            "js.base.PopupBase",
            "js.base.ListBase",
            "js.base.ContainerBase",
            "js.base.ActionBase"
        );
        var oContainerBase = new sap.ui.mw.ContainerBase();
        var oActionBase = new sap.ui.mw.ActionBase();
        var oListBase = new sap.ui.mw.ListBase();
        var oPopupBase = new sap.ui.mw.PopupBase();
        var myTableFields = ['', 'Nombre Solicitante', 'Fecha de Ingreso', "Id Cliente", 'Días Restantes', 'Colonia'];
        var myTableFieldsVisibility = [true, true, true, true, true, true];
        var myTableFieldsDemandPopid = [false, false, false, true, true, true];
        var myFieldsWidth = ['12%', '35%', '23%', '15%', '15%', '15%'];
        var oTableApplicants = oListBase.createTable("tblCustomers", "", sap.m.ListMode.SingleSelectMaster, myTableFields, myTableFieldsVisibility, myTableFieldsDemandPopid, myFieldsWidth, oController.onListPress, oController);
        oMasterButtonsForm = [oActionBase.createButton("", "", "Default", "sap-icon://search", oController.goToSearchApplicants, oController), oActionBase.createButton("btnAddApplicant", "", "Emphasized", "sap-icon://add", oController.addApplicant, oController)];
        oBarMasterFooterApplication = oContainerBase.createBar("", null, oMasterButtonsForm, null);
        var oPageApplicantList = new sap.ui.mw.ContainerBase().createPage("oPageApplicantList", "Solicitantes", true, true, true, true, oController.backToTiles, oController, oBarMasterFooterApplication);
        oPageApplicantList.addContent(new sap.ui.mw.InputBase().createSearchField("inSearchApplicantList", oController.onSearchApplicants, oController, "100%"));
        oPageApplicantList.addContent(new sap.ui.mw.DisplayBase().createLabel("tltNumApplicantsIns", ""));
        oPageApplicantList.addContent(oTableApplicants);

        //se crea tab de filtro de tipo de solicitante
        var iconTabFilters = [
            oContainerBase.createIconTabFilter("appList1", "appList1", "sap-icon://person-placeholder", "Nuevos"),
            oContainerBase.createIconTabFilter("appList2", "appList2", "sap-icon://company-view", "Renovados"),
        ];
        var iconTabBar = oContainerBase.createIconTabBar("appBar1", iconTabFilters, oController.setFilterApplicants, oController);
        //lista de solicitantes con filtro
        oPageApplicantList.addContent(iconTabBar);
        oPageApplicantList.addContent(oTableApplicants);

        var dialogFilters = oPopupBase.createDialog("appDialogFilterSearch", "Filtros", "Message", "sap-icon://search");
        return oPageApplicantList;

    }
});
