sap.ui.controller('originacion.InsuranceMaster', {
    getInsuranceSerialize: function(_oDB) {
        jQuery.sap.require("js.serialize.insurance.InsuranceSerialize");
        return new sap.ui.serialize.Insurance(_oDB);
    },
    getLoanRequestSerialize: function(_oDB) {
        jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
        return new sap.ui.serialize.LoanRequest(_oDB);
    },
    onMessageWarningDialogPress: function() {
        window.history.go(-1);
    },
    onBeforeShow: function() {
        console.log("########## INICIA SEGUROS ##########");
    },
    onInit: function() {
        jQuery.sap.require("js.kapsel.Rest");
        jQuery.sap.require("js.base.NavigatorBase");
        var oRouter, oController, oNavigatorBase;
        oController = this;
        oNavigatorBase = new sap.ui.mw.NavigatorBase();


        oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
        oRouter.getRoute("insuranceMaster").attachMatched(oController.onRouteMatched, oController);
    },
    onRouteMatched: function(oEvt) {
        var oArgs, oView, oController, queryParams, oSerializedModel;
        oController = this;
        oArgs = oEvt.getParameter("arguments");
        oView = oController.getView();
        queryParams = oArgs["?query"] || {};

        oSerializedModel = oController.getLoanRequestSerialize("dataDB");
        oSerializedModel.getLoan("LoanRequestSet", queryParams.LoanRequestIdCRM)
            .then(function(oModel) {
                console.log(oModel);
                oView.setModel(oModel);
                sap.ui.getCore().AppContext.loader.close();
            }).catch(function() {
                sap.ui.getCore().AppContext.loader.close();
            });
    },
    onSelectMember: function(oEvt) {
        var oModel, oRouter, oController, oCurrentPath, oMember;
        oController = this;
        oModel = oController.getView().getModel();
        oCurrentPath = oEvt.getParameters().listItem.getBindingContext().sPath;
        oMember = oModel.getProperty(oCurrentPath);
        oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
        oRouter.navTo("insuranceDetails", {
            LoanRequestIdCRM: oMember.LoanRequestIdCRM !== "" ? oMember.LoanRequestIdCRM : oMember.LoanRequestIdMD,
            CustomerIdCRM: oMember.CustomerIdCRM !== "" ? oMember.CustomerIdCRM : oMember.CustomerIdMD
        }, false);
    },
    onSearchApplicants: function(evt) {
        var txtSeachFilter, list, binding, allFilter = [];
        txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            var filter = new sap.ui.model.Filter("Customer/BpName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter2 = new sap.ui.model.Filter("Customer/BpName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter3 = new sap.ui.model.Filter("Customer/BpName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter4 = new sap.ui.model.Filter("Customer/BpName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var allFilter = new sap.ui.model.Filter([filter, filter2, filter3, filter4], false);
        }
        list = sap.ui.getCore().byId("lstApplicantsList");
        binding = list.getBinding("items");
        binding.filter(allFilter);
    },
});
