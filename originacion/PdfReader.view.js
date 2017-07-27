sap.ui.jsview("originacion.PdfReader", {

    /** Specifies the Controller belonging to this View. 
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.PdfReader
     */
    getControllerName: function() {
        return "originacion.PdfReader";
    },

    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
     * Since the Controller is given to this method, its event handlers can be attached right away. 
     * @memberOf originacion.PdfReader
     */
    createContent: function(oController) {
        //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase, oContainerBase;
        //Page
        var oPdfReaderPageAO;

        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.DisplayBase",
            "js.base.ContainerBase");

        //Se declaran objetos de Middleware de componentes SAPUI5
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oContainerBase = new sap.ui.mw.ContainerBase();

        oPdfReaderPageAO = oContainerBase.createPage("PdfReaderPageAO", "Aviso de privacidad (PDF)", true, true, true, true, oController.backToPage, oController);

        oPdfReaderPageAO.addContent(oDisplayBase.createReaderPDF("../www/js/vendor/pdfjs/web/viewer.html","sapReaderPDF"));

        return oPdfReaderPageAO;

    }
});
