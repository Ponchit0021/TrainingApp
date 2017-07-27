sap.ui.jsview("originacion.Renovations", {

    /** Specifies the Controller belonging to this View.
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.Renovations
     */
    getControllerName: function() {
        return "originacion.Renovations";
    },

    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
     * Since the Controller is given to this method, its event handlers can be attached right away.
     * @memberOf originacion.Renovations
     */
    createContent: function(oController) {
        //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase, oContainerBase;
        //Page
        var currentView, oIndicatosApplicantsApp, oBarApplicants, oPage, oPageDetailApplicants, oListRenovations, myModelRenovations, myListRenovations, bdLoader;
        //Elementos de pagina;
        var Buttons, myTableRenovations, itemsTemplate;
        oIndicatorApplicantsApp = new sap.m.MessagePage({
            text: "Cargando componentes...",
            icon: "sap-icon://overflow",
            description: "Espere un momento por favor"
        });
        bdLoader = new sap.m.BusyDialog("bdLoaderRenovations", {
            text: 'Espere por favor...',
            title: 'Cargando'
        });
        this.addContent(oIndicatorApplicantsApp);

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


        // Declaramos Array's para la tabla
        var myTableFields = ['Nombre', '', ''];
        var myTableFieldsVisibility = [true, true, true];
        var myTableFieldsDemandPopid = [false, false, false];
        var myFieldsWidth = ['80%', '15%', '15%'];
        setTimeout(function() {
            oPopupBase.createDialog("nsDialogSearchRenovations", "Filtros", "Message", "sap-icon://filter");
            oPopupBase.createDialog("nsApplicantsList", "Lista de Integrantes", "Message", null);
            /*Buttons = [
                oActionBase.createButton("", "", "Default", "sap-icon://search", oController.goToSearch, oController)
            ];*/
            // oBarApplicants = oContainerBase.createBar("", null, Buttons, null);
            // oPage = oContainerBase.createPage("oPageRennovations", "Próximas Renovaciones", true, true, true, true, oController.toBack, oController, oBarApplicants);
            oPage = oContainerBase.createPage("oPageRennovations", "Próximas Renovaciones", true, true, true, true, oController.toBack, oController);
            oPage.addContent(oInputBase.createSearchField("appSearchListRenovations", oController.searchRenovationTxt, oController, "100%"));

            var tablaSubsecuencias = oListBase.createTable("tblAppRenovations", "Lista de Renovaciones", sap.m.ListMode.SingleSelectMaster, myTableFields,
                myTableFieldsVisibility, myTableFieldsDemandPopid, myFieldsWidth, oController.onListItemPress, oController);
            oPage.addContent(tablaSubsecuencias);

            // Ini OUB 08.08.2016
            //Crea dialogos
            oPopupBase.createDialog("appDialogRejection", "Seleccionar Motivos de Rechazo", "Message", "sap-icon://decline");
            // Fin OUB 08.08.2016
            
            currentView.destroyContent();
            currentView.addContent(oPage);
        }, 0);

    },
    onBeforeShow:function(evt){
        this.getController().onBeforeShow(evt);
    }
});
