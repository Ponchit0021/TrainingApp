sap.ui.jsview("originacion.About", {
	/** Specifies the Controller belonging to this View. 
	* In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
	* @memberOf originacion.About
	*/ 
	getControllerName: function() {
	    return "originacion.About";
	},
	/** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
	* Since the Controller is given to this method, its event handlers can be attached right away. 
	* @memberOf originacion.About
	*/ 
	createContent : function(oController) {
		jQuery.sap.require("js.base.DisplayBase",
            "js.base.LayoutBase",
            "js.base.ListBase",
            "js.base.ContainerBase",
            "js.base.ActionBase"
        );
      
        var oContainerBase,currentView,oPageAbout;
        oContainerBase = new sap.ui.mw.ContainerBase();
		var oListBase = new sap.ui.mw.ListBase();
		var oActionBase = new sap.ui.mw.ActionBase();
		var oPopupBase = new sap.ui.mw.PopupBase();
		var noveltiesList, oListNovelties;
		
		oFooterButtons = [
            oActionBase.createButton("btnClearCache", "Limpiar Caché", "Emphasized", "sap-icon://delete", oController.clearCacheButton, oController)
        ];
		oBarAbout = oContainerBase.createBar("", null, oFooterButtons, null);



      
        oPageAbout = oContainerBase.createPage("oPageMasterAbout", "Novedades", true, true, true, true, oController.toBack, oController, oBarAbout);
        noveltiesList = new sap.ui.model.json.JSONModel("data-map/catalogos/novelties.json");
		
		oController.getVersionNumber().then(function(version){
			oListNovelties = oListBase.createListCol("oListNovelties", "Versión " + version, noveltiesList, "/Novelties", "{Novelty}");
	        oPageAbout.addContent(oListNovelties);
        }).catch(function(error) {
			oListNovelties = oListBase.createListCol("oListNovelties", "Versión 0.0.0", noveltiesList, "/Novelties", "{Novelty}");
	        oPageAbout.addContent(oListNovelties);
		});
		
		oPopupBase.createDialog("appDialogClearCache", "Confirmación", "Message", "");
		
		return oPageAbout;
	}

});