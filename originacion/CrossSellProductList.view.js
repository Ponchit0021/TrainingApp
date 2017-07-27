sap.ui.jsview("originacion.CrossSellProductList", {
    /** Specifies the Controller belonging to this View. 
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.ChildCreditCandidateList
     */
    getControllerName: function() {
        return "originacion.CrossSellProductList";
    },
    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
     * Since the Controller is given to this method, its event handlers can be attached right away. 
     * @memberOf originacion.ChildCreditCandidateList
     */
    createContent: function(oController) {
        jQuery.sap.require("js.base.ListBase", "js.base.ContainerBase", "js.base.InputBase");
        var oContainerBase, oListBase, oPageCrossSellProduct, oTableApplicants, oBarFooter, currentView;
        currentView = this;

        oContainerBase = new sap.ui.mw.ContainerBase();
        oListBase = new sap.ui.mw.ListBase();
        var myTableFields = ['Lista de Productos'];
        var myTableFieldsVisibility = [true, true, true, true, true, true];
        var myTableFieldsDemandPopid = [false, false, false, true, true, true];
        var myFieldsWidth = ['12%', '35%', '23%', '15%', '15%', '15%'];
        oBarFooter = oContainerBase.createBar("barCrossSellProductsList", null, null, null);

        oPageCrossSellProduct = oContainerBase.createPage("oPageCrossSellProduct", "Productos Hijo", true, true, true, true, oController.toBack, oController, oBarFooter);
        oPageCrossSellProduct.addContent(new sap.ui.mw.InputBase().createSearchField("searchChildProductTxt", oController.onSearchChildProductTxt, oController, "100%"));
        oTableProducts = oListBase.createTable("tblCrossSellProduct", "", sap.m.ListMode.SingleSelectMaster, myTableFields, null, null, null, oController.goToOffer, oController);
        oPageCrossSellProduct.addContent(oTableProducts);
        currentView.destroyContent();
        return oPageCrossSellProduct;
    }

});
