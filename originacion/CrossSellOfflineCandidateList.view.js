sap.ui.jsview("originacion.CrossSellOfflineCandidateList", {
	/** Specifies the Controller belonging to this View. 
	* In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
	* @memberOf originacion.ChildCreditCandidateList
	*/ 
	getControllerName: function() {
	    return "originacion.CrossSellOfflineCandidateList";
	},
	/** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
	* Since the Controller is given to this method, its event handlers can be attached right away. 
	* @memberOf originacion.ChildCreditCandidateList
	*/ 
	createContent : function(oController) {
		jQuery.sap.require("js.base.ListBase", "js.base.ContainerBase","js.base.InputBase");

        
        
        var oContainerBase, oListBase, oPageChildCredit,oTableApplicants, oBarFooter, currentView;
        currentView = this;

        oContainerBase = new sap.ui.mw.ContainerBase();
        oListBase = new sap.ui.mw.ListBase();
        var myTableFields = ['', 'Nombre Solicitante', '','Id Cliente', 'Grupo', 'Id Oportunidad'];
        var myTableFieldsVisibility = [true, true, true, true, true, true];
        var myTableFieldsDemandPopid = [false, false, false, true, true, true];
        var myFieldsWidth = ['12%', '35%', '23%', '15%', '15%', '15%'];
       	oBarFooter = oContainerBase.createBar("", null, null, null);		
        oPageChildCredit =  oContainerBase.createPage("oPageChildCredit", "Candidatos a Crédito Hijo", true, true, true, true, oController.toBack, oController, oBarFooter);
        
		oPageChildCredit.addContent(new sap.ui.mw.InputBase().createSearchField("searchChildCreditCandidateTxt", oController.onSearchChildCreditCandidateTxt, oController, "100%"));
        oTableApplicants = oListBase.createTable("tblChildCreditCandidates", "", sap.m.ListMode.SingleSelectMaster, myTableFields, myTableFieldsVisibility, myTableFieldsDemandPopid, myFieldsWidth, oController.goToDetail, oController);
		oPageChildCredit.addContent(oTableApplicants); 			
		currentView.destroyContent();
		return oPageChildCredit;
	}

});