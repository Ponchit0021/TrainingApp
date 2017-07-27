sap.ui.jsview("originacion.Testing", {

    /** Specifies the Controller belonging to this View. 
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.Testing
     */
    getControllerName: function() {
        return "originacion.Testing";
    },


    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
     * Since the Controller is given to this method, its event handlers can be attached right away. 
     * @memberOf originacion.Testing
     */
    createContent: function(oController) {

        var currentView, oBarTesting, oPageMasterTesting, oForm, oLayoutBase;

        var oContainerBase, oActionBase, oInputBase, oDocumentsPageAO, myTableFields, tblDocumentsFieldsVisibility, tblDocumentsFieldsDemandPopid, oTblDocuments, oModelDocuments, currentView, oTestingBar, oTestingButton;

        jQuery.sap.require("js.base.ContainerBase", "js.base.ActionBase", "js.base.LayoutBase", "js.base.InputBase", "js.base.PopupBase", "js.base.DisplayBase", "js.base.ListBase","js.base.LayoutBase");

        oContainerBase = new sap.ui.mw.ContainerBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oListBase = new sap.ui.mw.ListBase();
        oInputBase = new sap.ui.mw.InputBase();
        oLayoutBase    = new sap.ui.mw.LayoutBase();

        currentView = this;
        setTimeout(function() {
          /* 
           buttons = [
                oActionBase.createButton("", "Guardar", "Emphasized", "sap-icon://save", oController.saveImageTest, oController),
                oActionBase.createButton("", "Capturar","Emphasized","sap-icon://camera", oController.capturarImageTest, oController),
                oActionBase.createButton("", "Leer", "Emphasized", "sap-icon://search", oController.readImageTest, oController)
                
            ];

            //createImage = oDisplayBase.createImageTest("imagenOrigen", "img/logo.png", "imagenOrigen"); 
            createImage = oDisplayBase.createImageTest("imagenOrigen", "", "imagenOrigen"); 
            createImageRead = oDisplayBase.createImageTest("imagenDestino", "", "imagenDestino"); 

            oBarTesting = oContainerBase.createBar("", null, buttons, null);

            oPageMasterTesting = oContainerBase.createPage("oPageMasterTesting", "Testing", true, true, true, true, oController.backToTiles, oController, oBarTesting);

            oForm = oLayoutBase.createForm("idForms", true, 1, "Forms");
            oForm.addContent(oDisplayBase.createLabel("", "Imagen Origen"));
            oForm.addContent(createImage);
            oForm.addContent(oDisplayBase.createLabel("", "Imagen Destino"));
            oForm.addContent(createImageRead);
      
            oPageMasterTesting.addContent(oForm);

            currentView.destroyContent();
            currentView.addContent(oPageMasterTesting);*/



        }, 200);


    }
});
