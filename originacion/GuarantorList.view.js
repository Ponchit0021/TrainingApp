sap.ui.jsview("originacion.GuarantorList", {

    /** Specifies the Controller belonging to this View.
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.GuarantorList
     */
    getControllerName: function() {
        return "originacion.GuarantorList";
    },


    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
     * Since the Controller is given to this method, its event handlers can be attached right away.
     * @memberOf originacion.GuarantorList
     */
    createContent: function(oController) {

        jQuery.sap.require("js.base.InputBase",
            "js.base.DisplayBase",
            "js.base.LayoutBase",
            "js.base.ListBase",
            "js.base.ContainerBase",
            "js.base.PopupBase",
            "js.base.ActionBase"
        );
        var oContainerBase = new sap.ui.mw.ContainerBase();
        var oActionBase = new sap.ui.mw.ActionBase();
        var oListBase = new sap.ui.mw.ListBase();
        var oPopupBase = new sap.ui.mw.PopupBase();
        var myTableFields = ['Nombre del aval', 'Fecha de Ingreso', "Id Aval", 'Colonia'];
        var myTableFieldsVisibility = [true, true, true, true];
        var myTableFieldsDemandPopid = [false, false, true, true];
        var myFieldsWidth = ['40%', '30%', '15%', '15%'];
        var oTableGuarantors = oListBase.createTable("tblGuarantors", "", sap.m.ListMode.SingleSelectMaster, myTableFields, myTableFieldsVisibility, myTableFieldsDemandPopid, myFieldsWidth, oController.onListPress, oController);
        var oMasterButtonsForm = [oActionBase.createButton("", "", "Transparent", "sap-icon://citizen-connect", oController.openFilters, oController), oActionBase.createButton("btnAddGuarantor", "", "Emphasized", "sap-icon://add", oController.addGuarantor, oController)];
        var oBarMasterFooterApplication = oContainerBase.createBar("", null, oMasterButtonsForm, null);
        var oPageGuarantorList = new sap.ui.mw.ContainerBase().createPage("oPageGuarantorList", "Avales", true, true, true, true, oController.onMessageWarningDialogPress, oController, oBarMasterFooterApplication);
        oPageGuarantorList.addContent(new sap.ui.mw.InputBase().createSearchField("", oController.onSearchGuarantors, oController, "100%"));
        oPageGuarantorList.addContent(new sap.ui.mw.DisplayBase().createLabel("tltNumGuarantorsIns", ""));
        oPageGuarantorList.addContent(oTableGuarantors);
        oPopupBase.createDialog("appDialogConfirmation", "Confirmación", "Message", "");
        return oPageGuarantorList;
    }
});
