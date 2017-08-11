(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.sync.Synchronizer");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.base.NavigatorBase");


    sap.ui.base.Object.extend('sap.ui.sync.Synchronizer', {
        constructor: function(_dataDB, _syncDB, _notiDB) {
            var oSchemaDB;

            this.dataDBName = _dataDB;
            this.syncDBName = _syncDB;
            //TRAINING
            this.notiDBName = _notiDB;

            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            jQuery.sap.require("js.helper.SyncResults");
            jQuery.sap.require("js.sync.loanRequest.LoanRequestSynchronizer");
            jQuery.sap.require("js.sync.customer.CustomerSynchronizer");
            jQuery.sap.require("js.sync.insurance.InsuranceSynchronizer");
            jQuery.sap.require("js.sync.bp.BPSynchronizer");
            jQuery.sap.require("js.sync.crosssell.CrossSellOfferSynchronizer");


            oSchemaDB = new sap.ui.helper.Schema();

            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
            this.syncDB = new sap.ui.db.Pouch(_syncDB);
            this.syncDB.setSchema(oSchemaDB.getSyncDBSchema());
            //TRAINING
            this.notiDB = new sap.ui.db.Pouch(_notiDB);
            this.notiDB.setSchema(oSchemaDB.getNotiDBSchema());
            this.syncResults = new sap.ui.helper.SyncResults();
            this.oNavigator = new sap.ui.mw.NavigatorBase();

        }
    });



    /**
     * [isNetworkError Determine if an error is a Network error]
     * @param  {[int]}  _result [Status code]
     * @return {Boolean}         [Response determining if the resulting error is a network error]
     */
    sap.ui.sync.Synchronizer.prototype.isNetworkError = function(_result) {
        if (_result === 0 || _result === 503 || _result === 404) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * [updatePercentage Update percentage on the SyncResults screen]
     * @param  {[Integer]} _iPercentage [Percentaje to update]
     */
    sap.ui.sync.Synchronizer.prototype.updatePercentage = function(_iPercentage) {
        return new Promise(function(resolve) {

            var oProgressIndicator;
            oProgressIndicator = sap.ui.getCore().byId("oProgressIndicator");
            oProgressIndicator.setDisplayValue(_iPercentage + "%");
            oProgressIndicator.setPercentValue(_iPercentage);

        });
    };
    sap.ui.sync.Synchronizer.prototype.reviewGWCache = function() {
        return new Promise(function(resolve, reject) {
            sap.ui.getCore().AppContext.myRest.read("/InitializeCache", "CollaboratorID='" + sap.ui.getCore().AppContext.Promotor + "'", true)
                .then(resolve);
        });

    }


    /**
     * [refreshStores Refresh kapsel stores]
     */
    sap.ui.sync.Synchronizer.prototype.refreshStores = function() {
        var oOfflineGWPromise;
        return new Promise(function(resolve, reject) {
            this.reviewGWCache().then(function() {
                if (sap.OData) {
                    console.log("#Haciendo refresh de los stores#");




                    if (sap.ui.getCore().AppContext.iSyncs != 15) {
                        oOfflineGWPromise = sap.ui.getCore().AppContext.offlineStoreGw.refreshStore(["Customers", "Guarantors", "LoanRequests", "Links", "LinkGuarantors", "Addresses", "Employers", "Images", "PersonalReferences", "Phones", "InsuranceBeneficiaries", "Insurances"]);
                    } else {
                        oOfflineGWPromise = sap.ui.getCore().AppContext.offlineStoreGw.refreshStore();
                        sap.ui.getCore().AppContext.iSyncs = 1;
                    }


                    oOfflineGWPromise.then(function(resp) {
                        if (resp === "OK") {
                            sap.ui.getCore().AppContext.offlineStoreIGw.flushStore().then(function(resp) {
                                if (resp === "OK") {
                                    sap.ui.getCore().AppContext.offlineStoreIGw.refreshStore().then(function(resp) {
                                        if (resp === "OK") {
                                            resolve("OK");
                                        } else {
                                            oSyncResultHelper.reportResult(oSyncResultHelper.getResultObject("SYNC", "ERROR", "", "ERROR GENERAL", "¡Ups!, Ocurrio un error IGW-002 al sincronizar, por favor comunicate con mesa de servicio."));
                                            resolve("OK");
                                        }
                                    });
                                } else {

                                    //sap.m.MessageToast.show("¡Ups!, Ocurrio un error IGW-001 al sincronizar ");
                                    oSyncResultHelper.reportResult(oSyncResultHelper.getResultObject("SYNC", "ERROR", "", "ERROR GENERAL", "¡Ups!, Ocurrio un error IGW-001 al sincronizar, por favor comunicate con mesa de servicio."));
                                    resolve("OK");
                                }
                            });
                        } else {


                            oSyncResultHelper.reportResult(oSyncResultHelper.getResultObject("SYNC", "ERROR", "", "ERROR GENERAL", "¡Ups!, Ocurrio un error GW-001 al sincronizar, por favor comunicate con mesa de servicio."));

                            resolve("OK");
                        }

                    });
                } else {
                    this.updatePercentage(100);
                    resolve("ODATA not defined");

                    //// Refresh store local (En móvil)
                    var oNavigatorBase = new sap.ui.mw.NavigatorBase();
                    if (!oNavigatorBase.testUserAgent()) {
                        sap.ui.getCore().AppContext.myRest.refreshGWSimulatedStore();
                    }


                }

            }.bind(this));


        }.bind(this));
    };


    /**
     * [applyHttpClient Apply HTTP client, so the OData requests point to the Kapsel local store]
     */
    sap.ui.sync.Synchronizer.prototype.applyHttpClient = function() {
        return new Promise(function(resolve) {
            if (sap.hasOwnProperty("OData")) {
                sap.OData.applyHttpClient();
                resolve("OK");
            }
        });
    };


    /**
     * [cascade Generate cascading style execution for the generated promises]
     * @param  {[Promise]} _aPromises            [Promises to execute]
     * @param  {[float]} _fCurrentPorcentage   [Current porcentage of the process]
     * @param  {[float]} _fPorcentageIncrement [Incremental porcentage needed]
     * @param  {[function]} resolve               [Resolve funcion for the cascade shell]
     * @param  {[function]} reject                [Reject funcion for the cascade shell]
     */
    sap.ui.sync.Synchronizer.prototype.cascade = function(_aPromises, _fCurrentPorcentage, _fPorcentageIncrement, resolve, reject) {

        this.updatePercentage(_fCurrentPorcentage);
        _fCurrentPorcentage = _fCurrentPorcentage + _fPorcentageIncrement;
        if (_aPromises.length > 0) {
            /// Call function that returns the actual promise
            _aPromises[0]().then(
                function(result) {
                    // After the promise executes, execute the next Promise
                    this.cascade(_aPromises.slice(1), _fCurrentPorcentage, _fPorcentageIncrement, resolve, reject);
                }.bind(this)
            ).catch(function(error) {
                reject(error);
            });
        } else {
            resolve("OK");
        }

    };

    /**
     * [cascadeShell Generate a promise shell for the cascading promises]
     * @param  {[Promise]} _aPromises            [Promises to execute]
     * @param  {[float]} _fCurrentPorcentage   [Current porcentage of the process]
     * @param  {[float]} _fPorcentageIncrement [Incremental porcentage needed]
     * @return {[Promise]}                       [Promise to resolve after the cascading promises have been executed]
     */
    sap.ui.sync.Synchronizer.prototype.cascadeShell = function(_aPromises, _fCurrentPorcentage, _fPorcentageIncrement) {
        return new Promise(function(resolve, reject) {
                this.cascade(_aPromises, _fCurrentPorcentage, _fPorcentageIncrement, resolve, reject);
            }.bind(this))
            .catch(function(error) {
                this.updatePercentage(100);
                this.syncResults.reportResult(this.syncResults.getResultObject("SYNC", "ERROR", "", "ERROR GENERAL", "No fue posible sincronizar, intente nuevamente más tarde"));
                console.log("Master Error: " + error)
                this.applyHttpClient();
                // document.dispatchEvent(new Event("LoadCounters"));
                console.log("Error al realizar el envio de peticiones:" + error);
                resolveMasterSync();
            }.bind(this));

    }




    /**
     * [validateTimeService Validates if sync is allowed at the current date/time]
     * @return {[Promise]} 
     */
    sap.ui.sync.Synchronizer.prototype.validateTimeService = function() {
        return new Promise(function(resolve, reject) {
            /*var sUser; 

                if (!this.oNavigator.testUserAgent()) {
                    /// web
                    sUser = sap.ui.getCore().AppContext.Promotor;

                } else {
                    //device
                    sUser = sap.ui.getCore().AppContext.applicationContext.registrationContext.user;
                }

                sap.ui.getCore().AppContext.myRest.read("/ServiceTime", "CollaboratorID='" + sUser + "'", true)
                    .then(function(response) {

                        var oTimeModel, oServiceTime;
                        oTimeModel = new sap.ui.model.json.JSONModel();
                        oTimeModel.setData(response);
                        oServiceTime = oTimeModel.getProperty("/ServiceTime");
                        if (oServiceTime.Flag === 'T') {
                            resolve(true);
                        } else {
                            console.log(oServiceTime.Log);
                            sap.m.MessageToast.show(oServiceTime.Log);
                            resolve(false);
                        }

                    })
                    .catch(function(error) {
                        this.updatePercentage(100);
                        this.syncResults.reportResult(this.syncResults.getResultObject("SYNC", "ERROR", "", "ERROR GENERAL", "No fue posible sincronizar, intente nuevamente más tarde"));
                        console.log("Master Error: " + error + " Consulta tiempo de servicio " + error);
                        this.applyHttpClient();
                        document.dispatchEvent(new Event("LoadCounters"));
                        console.log("Error al realizar el envio de peticiones:" + error);
                        resolve(false);
                    }.bind(this));


            }.bind(this))
            .catch(function(error) {
                this.updatePercentage(100);
                this.syncResults.reportResult(this.syncResults.getResultObject("SYNC", "ERROR", "", "ERROR GENERAL", "No fue posible sincronizar, intente nuevamente más tarde"));
                console.log("Master Error: " + error)
                this.applyHttpClient();
                document.dispatchEvent(new Event("LoadCounters"));
                console.log("Error al realizar el envio de peticiones:" + error);
                resolve(false);

        }.bind(this));
        */

            //Se resuelve promesa para aplicación de TRAINING - No se requiere el servicio de HORARIO DE SERVICIO
            resolve(true);
        });
    };


    /**
     * [sync Main sync process]
     * @param  {[type]} _oRouter [Router to change view]
     */
    sap.ui.sync.Synchronizer.prototype.sync = function(_oRouter) {

        return new Promise(function(resolveMasterSync) {

            // (1) Quita proxy kapsel
            if (sap.hasOwnProperty("OData")) {
                sap.OData.removeHttpClient();
            }
            this.updatePercentage(5);

            this.validateTimeService().then(function(bResult) {

                var aConfirmingQueues, bdLoader;
                var aSyncPromises = [];
                var aSendPromises = [];
                var aConfirmingQueues = [];


                this.oBPSyncGuarantor = new sap.ui.sync.BP(this.dataDBName, this.syncDBName, "Guarantor");
                this.oBPSyncCustomer = new sap.ui.sync.BP(this.dataDBName, this.syncDBName, "Customer");
                this.oLoanRequestSync = new sap.ui.sync.LoanRequest(this.dataDBName, this.syncDBName);
                this.oInsuranceSync = new sap.ui.sync.Insurance(this.dataDBName, this.syncDBName, this.notiDBName);
                this.oCrossSellOfferSync = new sap.ui.sync.CrossSellOffer(this.dataDBName, this.syncDBName, "CrossSellOffer");

                if (bResult) {

                    // (2) Crear promesas en cascada
                    aSyncPromises.push(this.oBPSyncCustomer.confirmQueue.bind(this.oBPSyncCustomer));
                    aSyncPromises.push(this.oBPSyncGuarantor.confirmQueue.bind(this.oBPSyncGuarantor));
                    aSyncPromises.push(this.oLoanRequestSync.confirmQueue.bind(this.oLoanRequestSync));
                    aSyncPromises.push(this.oInsuranceSync.confirmQueue.bind(this.oInsuranceSync));
                    aSyncPromises.push(this.oCrossSellOfferSync.confirmQueue.bind(this.oCrossSellOfferSync));

                    aSyncPromises.push(this.oBPSyncCustomer.sendQueue.bind(this.oBPSyncCustomer));
                    aSyncPromises.push(this.oBPSyncGuarantor.sendQueue.bind(this.oBPSyncGuarantor));
                    aSyncPromises.push(this.oLoanRequestSync.sendQueue.bind(this.oLoanRequestSync));
                    aSyncPromises.push(this.oInsuranceSync.sendQueue.bind(this.oInsuranceSync));
                    aSyncPromises.push(this.oCrossSellOfferSync.sendQueue.bind(this.oCrossSellOfferSync));
                    //Se elimina refresh de los stores para aplicación de TRAINING
                    //aSyncPromises.push(this.refreshStores.bind(this));

                    // (3) Terminar el proceso
                    this.cascadeShell(aSyncPromises, 0, Math.round(100 / (aSyncPromises.length + 1)))
                        .then(function(result) {
                            this.applyHttpClient();
                            // document.dispatchEvent(new Event("LoadCounters"));
                            //sap.ui.getCore().AppContext.bAlreadyInSync = false;
                            this.updatePercentage(100);
                            resolveMasterSync();
                        }.bind(this))
                        .catch(function(_bdLoader, _oRouter, error) {

                            this.updatePercentage(100);
                            this.syncResults.reportResult(this.syncResults.getResultObject("SYNC", "ERROR", "", "ERROR GENERAL", "¡Ups! No se logró cargar toda la información. Por favor, intenta de nuevo."));
                            console.log("Master Error: " + error)
                            this.applyHttpClient();
                            //sap.ui.getCore().AppContext.bAlreadyInSync = false;
                            // document.dispatchEvent(new Event("LoadCounters"));
                            console.log("Error al realizar el envio de peticiones:" + error);
                            resolveMasterSync();

                        }.bind(this, bdLoader, _oRouter));

                }


            }.bind(this));


        }.bind(this));


    };

})();