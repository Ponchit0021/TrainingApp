(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.kapsel.Store");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.kapsel.Store', {
        constructor: function(name, objectRequest, serviceRoot) {
            this.name = name;
            this.host = sap.ui.getCore().AppContext.applicationContext.registrationContext.serverHost;
            this.port = sap.ui.getCore().AppContext.applicationContext.registrationContext.serverPort;
            this.https = sap.ui.getCore().AppContext.applicationContext.registrationContext.https;
            this.serviceRoot = serviceRoot + "/";
            this.objectRequest = objectRequest;
            this.storeLocal = null;
        }
    });

    /**
     * [start Se inicializa local store de kapsel configurado en el constructor.]
     * @return {[Promise]} [Retorna un promise con success y reject]
     */
    sap.ui.kapsel.Store.prototype.start = function() {
        console.log("====================== Store.start() called ======================");
        var context, currentClass, authStr;
        currentClass = this;
        var oHeaders = {};
        authStr = "Basic " + btoa(sap.ui.getCore().AppContext.applicationContext.registrationContext.user + ":" + sap.ui.getCore().AppContext.applicationContext.registrationContext.password);
        //oHeaders['Authorization'] = authStr;
        oHeaders['X-SMP-APPCID'] = sap.ui.getCore().AppContext.applicationContext.applicationConnectionId;
        var properties = {
            "customHeaders": oHeaders,
            "name": this.name,
            "host": this.host,
            "port": this.port, //Mientras se soluciona offline+https
            "https": this.https,
            "serviceRoot": this.serviceRoot,
            "definingRequests": this.objectRequest
        };
        console.log("====================== Propiedades = " + JSON.stringify(properties));

        /*currentClass.storeLocal = sap.OData.createOfflineStore(properties);
        currentClass.storeLocal.open(currentClass.openStoreSuccessCallback, currentClass.openStoreErrorCallback);*/

        return new Promise(function(resolve, reject) {
            currentClass.storeLocal = sap.OData.createOfflineStore(properties);
            currentClass.storeLocal.open(
                function() {
                    resolve()
                },
                function(error) {
                    reject(error)
                }
            );
        });
    };

    sap.ui.kapsel.Store.prototype.closeStore = function() {
        if (!this.storeLocal) {
            console.log("The store must be opened before it can be closed");
            return;
        }
        this.storeLocal.close(function() {
            console.log("Store is closed");
        }, function(e) {
            console.log("Failed to close store!:" + e);
        });
    };
    sap.ui.kapsel.Store.prototype.flushStore = function() {

        return new Promise(function(resolvePromise) {

            if (!this.storeLocal) {
                console.log("The store must be open before it can be flushed");
                return;
            }
            this.storeLocal.flush(function() {
                console.log("Store flush Called");
                resolvePromise("OK");
            }, function(e) {
                console.log("Failed to flush store!:" + e);
                resolvePromise("Error " + e);
            });

        }.bind(this))


    };
    sap.ui.kapsel.Store.prototype.refreshStore = function(aEntitites) {

        return new Promise(function(resolvePromise) {

            if (!this.storeLocal) {
                console.log("The store must be open before it can be refreshed");
                return;
            }

            if (typeof aEntities !== "undefined") {

                this.storeLocal.refresh(function() {
                    console.log("Store refresh Called");
                    resolvePromise("OK");
                }, function(e) {
                    console.log("Failed to refresh store!:" + e);
                    resolvePromise("error");
                }, aEntitites);

                
            }else{

                this.storeLocal.refresh(function() {
                    console.log("Store refresh Called");
                    resolvePromise("OK");
                }, function(e) {
                    console.log("Failed to refresh store!:" + e);
                    resolvePromise("error");
                });

                
            }

        }.bind(this));
    };



    sap.ui.kapsel.Store.prototype.clearStore = function() {
        if (!this.storeLocal) {
            console.log("The store must be closed before it can be cleared");
            return;
        }
        this.storeLocal.clear(function() {
            console.log("Store clear Called");
        }, function(e) {
            console.log("Failed to clear store!:" + e);
        });
    };
    sap.ui.kapsel.Store.prototype.openStoreSuccessCallback = function() {
        sap.OData.applyHttpClient(); //Offline OData calls can now be made against datajs
        console.log("====================== Store is OPEN. ======================");
    };
    sap.ui.kapsel.Store.prototype.openStoreErrorCallback = function(e) {
        alert("An error occurred " + JSON.stringify(e));
        console.log("An error occurred " + JSON.stringify(e));
    };
    sap.ui.kapsel.Store.prototype.setName = function(name) {
        this.name = name;
    };
    sap.ui.kapsel.Store.prototype.getName = function() {
        return this.name;
    };
    sap.ui.kapsel.Store.prototype.setHost = function(host) {
        this.host = host;
    };
    sap.ui.kapsel.Store.prototype.getHost = function() {
        return this.host;
    };
    sap.ui.kapsel.Store.prototype.setPort = function(port) {
        this.port = port;
    };
    sap.ui.kapsel.Store.prototype.getPort = function() {
        return this.port;
    };
    sap.ui.kapsel.Store.prototype.setHttps = function(https) {
        this.https = https;
    };
    sap.ui.kapsel.Store.prototype.getHttps = function() {
        return this.https;
    };
    sap.ui.kapsel.Store.prototype.setServiceRoot = function(serviceRoot) {
        this.serviceRoot = serviceRoot;
    };
    sap.ui.kapsel.Store.prototype.getServiceRoot = function() {
        return this.serviceRoot;
    };
    sap.ui.kapsel.Store.prototype.setObjectRequest = function(objectRequest) {
        this.objectRequest = objectRequest;
    };
    sap.ui.kapsel.Store.prototype.getObjectRequest = function() {
        return this.objectRequest;
    };
    sap.ui.kapsel.Store.prototype.setStoreLocal = function(storeObject) {
        this.storeLocal = storeObject;
    };
    sap.ui.kapsel.Store.prototype.getStoreLocal = function() {
        return this.storeLocal;
    };
})();
