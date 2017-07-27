sap.ui.controller("originacion.CrossSellDashBoard", {
    backToTiles: function() {
        jQuery.sap.require("js.base.EventBase");
        var oEventBase = new sap.ui.mw.EventBase();
        oEventBase.backEvent(this,"");
        /*if (this.isError === "1") {
            oEventBase.backEvent(this, "#");
        } else {
            oEventBase.backEvent(this, "");
        }*/

    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf originacion.CrossSellDashBoard
     */
    onInit: function() {
        this.getRouter().getRoute("crossSellDashboard").attachMatched(this._onRouteMatched, this);
    },
    getRouter: function() {
        return sap.ui.core.UIComponent.getRouterFor(this);
    },
    _onRouteMatched: function(oEvent) {
        jQuery.sap.require("js.base.FileBase");
        var fileBase = new sap.ui.mw.FileBase();

        if (!sap.ui.getCore().byId("tileCrSellCandidates")) {
            fileBase.loadFile("data-map/catalogos/tilesCrossSell.json")
                .then(this.renderCrSellDashBoard.bind(this));
        }
    },
    renderCrSellDashBoard: function(oTileModel) {
        jQuery.sap.require("js.base.TileBase");

        return new Promise(function(resolve) {
            var oTileContainer, oScrollTileContainer, oRouter, oTileBase;
            oTileBase = new sap.ui.mw.TileBase();
            oScrollTileContainer = sap.ui.getCore().byId("oScrollTileContainerCrSell");
            structureDashBoardTile = {
                title: "{option/title}",
                info: "{option/description}",
                icon: "{option/icon}",
                number: "{option/number}"
            };
            oRouter = this.getRouter();
            oTileContainer = oTileBase.createTileContainer("/options", structureDashBoardTile, oTileModel, oRouter);
            oScrollTileContainer.addContent(oTileContainer);

            resolve("ok");
        }.bind(this));

    },

    /**
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
     * (NOT before the first rendering! onInit() is used for that one!).
     * @memberOf originacion.DashBoard
     */
    onBeforeRendering: function() {},

    /**
     * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
     * This hook is the same one that SAPUI5 controls get after being rendered.
     * @memberOf originacion.DashBoard
     */
    onAfterRendering: function() {}
});
