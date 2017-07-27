sap.ui.controller("originacion.CrossSellOfflineCandidateList", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf originacion.ChildCreditCandidateList
     */
    onInit: function() {

        this.getRouter().getRoute("crossSellOfflineCandidateList").attachMatched(this._onRouteMatched, this);
        sap.ui.getCore().byId("searchChildCreditCandidateTxt").setValue("");
    },
    getRouter: function() {
        return sap.ui.core.UIComponent.getRouterFor(this);
    },
    _onRouteMatched: function(oEvent) {
        jQuery.sap.require("js.base.ListBase", "js.serialize.crosssell.CrossSellSerialize", "js.base.FileBase");
        sap.ui.getCore().AppContext.loader.show("Cargando candidatos...")
        this.getCrossSellCandidates("CrossSellingCandidate")
            .then(this.renderCrossSellCandidates.bind(this))
            .then(this.finishProcess);
    },
    finishProcess: function() {
        sap.ui.getCore().AppContext.loader.close();
    },
    getCrossSellCandidates: function(_entity) {
        return new Promise(function(resolve) {
            var fileBase = new sap.ui.mw.FileBase();

            fileBase.loadFile("data-map/catalogos/crossSellProducts.json")
                .then(function(resp) {
                    new sap.ui.serialize.CrossSell("dataDB", _entity).reviewCrossSellCandidates(_entity + "Set", sap.ui.getCore().AppContext.Promotor).then(resolve);

                });

            /*var productsModel = new sap.ui.model.json.JSONModel("data-map/catalogos/crossSellProducts.json");*/

        });
    },
    renderCrossSellCandidates: function(_aDataCandidates) {
        var currentController = this;
        return new Promise(function(resolve) {
            var oModelCandidates = new sap.ui.model.json.JSONModel();
            oModelCandidates.setData(_aDataCandidates);

            var oCreditCandidateListTable = sap.ui.getCore().byId("tblChildCreditCandidates", "items");
            oCreditCandidateListTable.setModel(oModelCandidates);
            oCreditCandidateListTable.bindAggregation("items", {
                path: "/results",
                factory: function(_id, _context) {
                    return currentController.bindChildCreditCandidateListTable(_context);
                }
            });
            resolve("ok");
        });



    },

    bindChildCreditCandidateListTable: function(_context) {

        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
        var oDisplayBase, oActionBase, itemsTemplate, currentController, semaphoreIcon, lastName = '',
            secondName = '',
            firstName = '',
            middleName = '';
        currentController = this;
        var currentContext = _context.getObject();

        try {
            oDisplayBase = new sap.ui.mw.DisplayBase();
            oActionBase = new sap.ui.mw.ActionBase();
            itemsTemplate = new sap.m.ColumnListItem({});
            itemsTemplate.setType(sap.m.ListType.Navigation);
            itemsTemplate.setSelected(true);

            if (currentContext.CandidateName.LastName) {
                lastName = currentContext.CandidateName.LastName.toUpperCase();
            }
            if (currentContext.CandidateName.SecondName) {
                secondName = currentContext.CandidateName.SecondName.toUpperCase();
            }
            if (currentContext.CandidateName.FirstName) {
                firstName = currentContext.CandidateName.FirstName.toUpperCase();
            }
            if (currentContext.CandidateName.MiddleName) {
                middleName = currentContext.CandidateName.MiddleName.toUpperCase();
            }
            itemsTemplate.addCell(oDisplayBase.createIcon("", "sap-icon://customer", "2.0rem"));
            itemsTemplate.addCell(oDisplayBase.createText("", lastName + " " + secondName + " " + firstName + " " + middleName));
            itemsTemplate.addCell(oDisplayBase.createText("", null));
            itemsTemplate.addCell(oDisplayBase.createText("", currentContext.CandidateIdCRM));
            itemsTemplate.addCell(oDisplayBase.createText("", currentContext.ParentGroupName));
            itemsTemplate.addCell(oDisplayBase.createText("", currentContext.ParentLoanRequestIdCRM));
            return itemsTemplate;

        } catch (err) {
            sap.m.MessageToast.show(err);
            console.log(err);
        }

    },

    toBack: function() {
        window.history.go(-1);
    },

    goToDetail: function(oEvent) {
        /* var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
         oCurrentApp.to("oDetailPageChildCredit");*/
        /*var router;
        router = sap.ui.core.UIComponent.getRouterFor(this);*/
        sap.ui.core.UIComponent.getRouterFor(this).navTo("crossSellProductList", {
            candidateId: oEvent.getParameters().listItem.getBindingContext().getModel().getProperty(oEvent.getParameters().listItem.getBindingContext().getPath()).CandidateIdCRM
        }, false);
    },

    goBackApp: function() {
        var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
        oCurrentApp.back();
    },
    onSearchChildCreditCandidateTxt: function(evt) {
        var txtSeachFilter, table, binding, allFilter;
        txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            var filter = new sap.ui.model.Filter("CandidateName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter2 = new sap.ui.model.Filter("CandidateName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter3 = new sap.ui.model.Filter("CandidateName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter4 = new sap.ui.model.Filter("CandidateName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter5 = new sap.ui.model.Filter("CandidateIdCRM", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            allFilter = new sap.ui.model.Filter([filter, filter2, filter3, filter4, filter5], false);
        }
        table = sap.ui.getCore().byId("tblChildCreditCandidates");
        binding = table.getBinding("items");
        binding.filter(allFilter, "Application");
    },
});
