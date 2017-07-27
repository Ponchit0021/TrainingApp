sap.ui.controller("originacion.CrossSellProductList", {
    aCrossSellProducts: {},
    onInit: function() {
        jQuery.sap.require("js.kapsel.Rest", "js.base.NavigatorBase", "js.base.LayoutBase", "js.base.DisplayBase", "js.base.ActionBase", "js.serialize.GeneralSerialize", "js.base.FileBase", "js.serialize.crosssell.CrossSellSerialize");
        this.getRouter().getRoute("crossSellProductList").attachMatched(this.onRouteMatched, this);
    },
    getRouter: function() {
        return sap.ui.core.UIComponent.getRouterFor(this);
    },
    onRouteMatched: function(oEvent) {
        sap.ui.getCore().AppContext.loader.show("Cargando productos...")
        this.getCrossSellProducts(oEvent)
            .then(this.reviewLocalProducts.bind(this))
            .then(this.renderCrossSellProducts.bind(this))
            .then(this.finishProcess.bind(this));
    },
    finishProcess: function() {
        sap.ui.getCore().AppContext.loader.close();
    },
    reviewLocalProducts: function(_aDataProducts) {
        return new Promise(function(resolve) {
            new sap.ui.serialize.CrossSell("dataDB", "CrossSellOffer").reviewCrossSellProducts(_aDataProducts).then(resolve);
        })
    },
    getCrossSellProducts: function(oEvent) {
        var oParams, oArgs, fileBase;
        _self = this;
        oArgs = oEvent.getParameter("arguments");
        oParams = {
            CandidateIdCRM: oArgs.candidateId
        };
        return new Promise(function(resolve) {
            new sap.ui.mw.FileBase().loadFile("data-map/catalogos/crossSellProducts.json")
                .then(function(aProducts) {
                    _self.aCrossSellProducts = aProducts.getProperty("/crossSellProducts");
                    new sap.ui.serialize.General("dataDB").getEntityDetail(new sap.ui.helper.Dictionary().oDataRequest(oParams).getRequest("CrossSellingCandidateSet"), oParams.CandidateIdCRM).then(resolve);
                });
        });
    },
    onPushProductDescription: function(_aDataProducts) {
        return new Promise(function(resolve) {
            resolve("OK");
        });
    },
    renderCrossSellProducts: function(_aDataProducts) {
        var oModel, oProductListTable, _self;
        _self = this;
        return new Promise(function(resolve) {
            oModel = new sap.ui.model.json.JSONModel();
            //se injecta la descripcion del nombre del producto al modelo
            jQuery.each(_aDataProducts, function(num) {
                _aDataProducts[num].ProductName = _self.getProductDescription(_aDataProducts[num].CrossSellProductId);
            }, _aDataProducts);
            oModel.setData(_aDataProducts);
            oProductListTable = sap.ui.getCore().byId("tblCrossSellProduct", "items");
            oProductListTable.setModel(oModel);
            oProductListTable.bindAggregation("items", {
                path: "/",
                factory: function(_id, _context) {
                    return _self.bindProductsListTable(_context);
                }
            });
            resolve("ok");
        })
    },
    getProductDescription: function(idProduct) {
        var product = _.where(this.aCrossSellProducts, { idCRM: idProduct })
        return product[0].productName;
    },
    bindProductsListTable: function(_context) {
        var oDisplayBase, oActionBase, oItemsTemplate, oController, oContext;
        oController = this;
        oContext = _context.getObject();
        try {
            oDisplayBase = new sap.ui.mw.DisplayBase();
            oActionBase = new sap.ui.mw.ActionBase();
            oItemsTemplate = new sap.m.ColumnListItem({});
            oItemsTemplate.setType(sap.m.ListType.Navigation);
            oItemsTemplate.setSelected(true);
            oItemsTemplate.addCell(oDisplayBase.createText("", oController.getProductDescription(oContext.CrossSellProductId)));
            return oItemsTemplate;
        } catch (err) {
            sap.m.MessageToast.show(err);
            console.log(err);
        }
    },
    toBack: function() {
        window.history.go(-1);
    },
    goToOffer: function(oEvent) {
        var oPath, oItem, oProductListTable;
        oPath = oEvent.getParameters().listItem.getBindingContext().sPath;
        oProductListTable = sap.ui.getCore().byId("tblCrossSellProduct", "items");

        oItem = oProductListTable.getModel().getProperty(oPath);
        sap.ui.core.UIComponent.getRouterFor(this).navTo("crossSellOffer", {
            productId: oItem.CrossSellProductId,
            candidateId: oItem.CandidateIdCRM
        }, false);
    },
    onSearchChildProductTxt: function(evt) {
        var txtSeachFilter, table, binding, allFilter;
        txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            var filter = new sap.ui.model.Filter("ProductName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            allFilter = new sap.ui.model.Filter([filter], false);
        }
        table = sap.ui.getCore().byId("tblCrossSellProduct");
        binding = table.getBinding("items");
        binding.filter(allFilter, "Application");
    }
});
