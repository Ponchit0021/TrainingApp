sap.ui.jsview('originacion.InsuranceMaster', {
    getControllerName: function() {
        return 'originacion.InsuranceMaster';
    },
    createContent: function(oController) {

        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.InputBase",
            // "js.base.ActionBase",
            "js.base.DisplayBase",
            "js.base.LayoutBase",
            // "js.base.PopupBase",
            "js.base.ListBase",
            "js.base.ContainerBase"
        );

        var oObjectListItem = new sap.m.ObjectListItem({
            title: "{Customer/BpName/FirstName}" + " " + "{Customer/BpName/MiddleName}" + " " + "{Customer/BpName/LastName}" + " " + "{Customer/BpName/SecondName}",
            type: sap.m.ListType.Navigation
        });

        var oFormList = new sap.ui.mw.LayoutBase().createForm("fInsuranceList", true, 1, "");
        oFormList.addContent(new sap.ui.mw.InputBase().createSearchField("insSearchList", oController.onSearchApplicants, oController, "100%"));
        oFormList.addContent(new sap.ui.mw.DisplayBase().createLabel("tltNumIntegrantesIns", "Número de Integrantes"));
        oFormList.addContent(new sap.ui.mw.ListBase().createList("lstApplicantsList", "", sap.m.ListMode.SingleSelectMaster, "", "/results", oObjectListItem, oController.onSelectMember, oController));

        var oPageMasterInsurance = new sap.ui.mw.ContainerBase().createPage("oPageMasterInsurance", "Integrantes", true, true, true, true, oController.onMessageWarningDialogPress, oController, null);
        oPageMasterInsurance.addContent(oFormList);
        return oPageMasterInsurance;
    }

});
