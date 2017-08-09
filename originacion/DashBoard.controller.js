sap.ui.controller("originacion.DashBoard", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf originacion.DashBoard
     */
    onInit: function() {
        // jQuery.sap.require("js.base.BusyBase");
        // var busyLoader = new sap.ui.mw.BusyBase();
        // busyLoader.showBusyLoader("Cargando...");

        this.getRouter().getRoute("DashBoard").attachMatched(this._onRouteMatched, this)
        this.getRouter().attachRouteMatched(this.loadList, this);
    },
    getRouter: function() {
        return sap.ui.core.UIComponent.getRouterFor(this);
    },
    _onRouteMatched: function(oEvent) {
        jQuery.sap.require("js.db.Pouch", "js.base.FileBase");
        var fileBase = new sap.ui.mw.FileBase();
        //TRAINING - se genera instancia de base de notificaciones y renovaciones en PouchDB
        new sap.ui.db.Pouch(sap.ui.getCore().AppContext.Config.getProperty("notiDB"));
        new sap.ui.db.Pouch(sap.ui.getCore().AppContext.Config.getProperty("renoDB"));
        if (!sap.ui.getCore().byId("tileSolicitantes")) {
            new sap.ui.db.Pouch(sap.ui.getCore().AppContext.Config.getProperty("dataDB"));
            fileBase.loadFile("data-map/catalogos/tiles.json")
                .then(this.renderDashBoard.bind(this))
                .then(this.refreshCounters.bind(this));
        } else {
            this.refreshCounters();
        }
    },
    renderDashBoard: function(oTileModel) {
        jQuery.sap.require("js.base.TileBase");

        return new Promise(function(resolve) {
            var oTileContainer, oScrollTileContainer, oRouter;
            oTileBase = new sap.ui.mw.TileBase();
            oScrollTileContainer = sap.ui.getCore().byId("oScrollTileContainer");
            structureDashBoardTile = {
                title: "{option/title}",
                info: "{option/description}",
                icon: "{option/icon}",
                number: "{option/number}"
            };
            oRouter = this.getRouter();
            oTileContainer = oTileBase.createTileContainer("/options", structureDashBoardTile, oTileModel, oRouter);
            oScrollTileContainer.addContent(oTileContainer);


            /*  this.getVersionNumber().then(function(version){
                     var oVersion = sap.ui.getCore().byId("tileAcercaDe");
                     oVersion.setNumber(version);
                 
                 }).catch(function(error) {
                     console.log(error);
                     var oVersion = sap.ui.getCore().byId("tileAcercaDe");
                     oVersion.setNumber(0);
                 }); */

            var oVersion = sap.ui.getCore().byId("tileAcercaDe");
            oVersion.setNumber(0);

            resolve("ok");

        }.bind(this));

    },
    getVersionNumber: function() {
        return new Promise(function(resolve) {
            var promiseVersionNum = "WEB";
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                cordova.getAppVersion.getVersionNumber().then(function(version) {
                    resolve(version);
                });
            } else {
                resolve(promiseVersionNum);
            }
        }.bind(this));

    },

    loadList: function(oEvent) {
        jQuery.sap.require("js.base.NavigatorBase");
        var oNavigatorBase = new sap.ui.mw.NavigatorBase();
        if (oNavigatorBase.testUserAgent()) {
            if (sap.ui.getCore().AppContext.isConected) {
                sap.ui.getCore().AppContext.oConnection.onlineNetwork();
                console.log("NETWORK STATUS: ONLINE");
            } else {
                //sap.ui.getCore().AppContext.oConnection.offlineNetwork();
                console.log("NETWORK STATUS: OFFLINE");
            }
        }
    },

    refreshCounters: function() {


        var promiseAnnouncementsCounter, promisePendingsCounter, oMyPendingsDB, oAnnouncementsDB;
        promiseAnnouncementsCounter = sap.ui.getCore().AppContext.oRest.read("/AnnouncementsPromoterSet", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Config.getProperty("promoterId") + "'", true);
        promisePendingsCounter = sap.ui.getCore().AppContext.oRest.read("/PendingsPromoterSet", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Config.getProperty("promoterId") + "'", true);
        /* if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {

            promiseAnnouncementsCounter = sap.ui.getCore().AppContext.oRest.read("/AnnouncementsPromoterSet", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.applicationContext.registrationContext.user + "' and attended eq '0'", true);
            promisePendingsCounter = sap.ui.getCore().AppContext.oRest.read("/PendingsPromoterSet", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.applicationContext.registrationContext.user + "' and attended eq '0'", true);

        } else {
            promiseAnnouncementsCounter = sap.ui.getCore().AppContext.oRest.read("/AnnouncementsPromoterSet", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Config.getProperty("promoterId") + "'", true);
            promisePendingsCounter = sap.ui.getCore().AppContext.oRest.read("/PendingsPromoterSet", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Config.getProperty("promoterId") + "'", true);
        } */
        oMyPendingsDB = sap.ui.getCore().byId("tilePendientes");
        oAnnouncementsDB = sap.ui.getCore().byId("tileAvisos");
        Promise.all([promiseAnnouncementsCounter, promisePendingsCounter]).then(function(values) {
            oMyPendingsDB.setNumber(values[1].results.length);
            oAnnouncementsDB.setNumber(values[0].results.length);
        }).catch(function(error) {
            console.log(error);
            oMyPendingsDB.setNumber(0);
            oAnnouncementsDB.setNumber(0);
        });

    },

    /**
     * [syncWithCore - Inicia proceso de sincronización cuando el DM esta online]
     * @return {[type]} [description]
     */
    syncWithCore: function() {
        jQuery.sap.require("js.sync.Synchronizer");
        jQuery.sap.require("js.helper.Schema");

        var oSync,
            oHelper;
        var oRouter;

        if (!sap.ui.getCore().AppContext.bAlreadyInSync) {

            if (sap.ui.getCore().byId("oSyncOkResult")) {
                sap.ui.getCore().byId("oSyncOkResult").setNumber("0");
                sap.ui.getCore().AppContext.SyncOK = 0;
            }

            if (sap.ui.getCore().byId("appBarResults1")) {
                sap.ui.getCore().byId("appBarResults1").setSelectedKey("appListResults1");
            }



            if (sap.ui.getCore().byId("oSyncErrorResult")) {
                sap.ui.getCore().byId("oSyncErrorResult").setNumber("0");
                sap.ui.getCore().AppContext.SyncError = 0;
            }

            if (sap.ui.getCore().getModel("ModelResult")) {
                sap.ui.getCore().getModel("ModelResult").setProperty("/", []);
                sap.ui.getCore().getModel("ModelResult").refresh(true);
            }

            if (sap.ui.getCore().byId("oProgressIndicator")) {
                sap.ui.getCore().byId("oProgressIndicator").setDisplayValue("0 %");
                sap.ui.getCore().byId("oProgressIndicator").setPercentValue(0);
            }

            sap.ui.getCore().AppContext.bDoSync = true;

            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("syncResultsList", {}, false);

            // document.addEventListener("LoadCounters", this.refreshCounters);

        }
    },

    /**
     * [viewLogList - Carga las peticiones que no fueron ejecutadas correctamente]
     * @return {[type]} [description]
     */
    viewLogList: function() {
        console.log("view");
        ///// Error al realizar los envios
        sap.ui.getCore().AppContext.bDoSync = false;

        oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("syncResultsList", {}, false);
    },
    /**
     * [loadButtonsSync - Implementa los botones del Action Sheet]
     * @return {[type]} [description]
     */
    loadButtonsSync: function() {
        var asSync = sap.ui.getCore().byId("asSync");
        var refBtnSync = sap.ui.getCore().byId("btnSync");
        asSync.openBy(refBtnSync);
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
    onAfterRendering: function() {

        /// If the current element of the results is corrected (saved), delete it from the SyncResult queue
        sap.ui.getCore().AppContext.oRefreshSyncElements = function() {


            if (sap.ui.getCore().getModel("ModelResult")) {
                if ($.isArray(sap.ui.getCore().getModel("ModelResult").getProperty("/"))) {
                    if (typeof(sap.ui.getCore().AppContext.iCurrentSyncElement) != "undefined") {
                        sap.ui.getCore().getModel("ModelResult").getProperty("/").splice(sap.ui.getCore().AppContext.iCurrentSyncElement, 1);
                        sap.ui.getCore().getModel("ModelResult").refresh(true);
                    }
                }
            }



        };
        /* console.log("**** DASHBOARD - CREACION DE BD ****");
        jQuery.sap.require("js.db.Pouch");
        oDB = new sap.ui.db.Pouch("ex14");*/ //creación de la base de datos


        /*  console.log("**** DASHBOARD - CREACION DE BD TEST ****");
        jQuery.sap.require("js.db.PouchTest");
        oDBT = new sap.ui.db.PouchTest("GenTest"); //creación de la base de datos*/
    },
});