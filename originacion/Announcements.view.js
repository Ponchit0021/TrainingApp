sap.ui.jsview("originacion.Announcements", {

    /** Specifies the Controller belonging to this View.
     * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * @memberOf originacion.Announcements
     */
    getControllerName: function() {
        return "originacion.Announcements";
    },

    /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
     * Since the Controller is given to this method, its event handlers can be attached right away.
     * @memberOf originacion.Announcements
     */
    createContent: function(oController) {
        //Elementos de pagina;
        var oContainerBase,currentView, oPageAnnouncements;

        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.ContainerBase","js.base.InputBase");

        oContainerBase = new sap.ui.mw.ContainerBase();
        currentView = this;
        setTimeout(function() {

            //Se crean los dialogos que se usan en los tabs
            //
            oPageAnnouncements = oContainerBase.createPage("oPageMasterAnnouncements", "Avisos (0)", true, true, true, false, oController.toBack, oController, null);

            var listGroup = new sap.m.List({
                id: 'ngAnnouncement',
                title: 'Notificaciones'
            });
            oPageAnnouncements.addContent(new sap.ui.mw.InputBase().createSearchField("", oController.searchAnnouncementsTxt, oController, "100%"));
            oPageAnnouncements.addContent(listGroup);
            currentView.destroyContent();
            currentView.addContent(oPageAnnouncements);
        }, 0);

    }
});
