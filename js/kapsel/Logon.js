(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.kapsel.Logon");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.kapsel.Logon', {
        constructor: function() {
            this.serverHost = sap.ui.getCore().AppContext.Config.getProperty("serverHost");
            this.https = sap.ui.getCore().AppContext.Config.getProperty("https");
            this.serverPort = sap.ui.getCore().AppContext.Config.getProperty("serverPort");
            this.user = sap.ui.getCore().AppContext.Config.getProperty("user");
            this.password = sap.ui.getCore().AppContext.Config.getProperty("password");
            this.communicatorId = sap.ui.getCore().AppContext.Config.getProperty("communicatorId");

        }
    });

    sap.ui.getCore().AppContext.applicationContext = null;
    sap.ui.getCore().AppContext.appId = sap.ui.getCore().AppContext.Config.getProperty("appId");
    sap.ui.kapsel.Logon.prototype.methodLogon = null;
    /**
     * [start Se inicializa el plugin logon de kapsel]
     * @return {[Promise]} [Returna un promise con success y reject]
     */
    sap.ui.kapsel.Logon.prototype.start = function() {
        var context, currentClass;
        currentClass = this;

        return new Promise(function(resolve, reject) {
            if (sap.ui.getCore().AppContext.applicationContext) {
                alert("Ya te encuentras registrado");
                return;
            }
            var context = {
                "serverHost": currentClass.serverHost,
                "https": currentClass.https,
                "serverPort": currentClass.serverPort,
                "user": currentClass.user,
                "password": currentClass.password,
                "communicatorId": currentClass.communicatorId,
                "custom":{
	                 "hiddenFields": ["farmId","https","securityConfig","resourcePath","serverHost","serverPort"] //"serverHost","serverPort"
	              }
            };
            sap.Logon.init(function (result) { resolve(result) }, function(error){  reject(error) }, sap.ui.getCore().AppContext.appId, context);
        });



    };
    sap.ui.kapsel.Logon.prototype.setServerHost = function(serverHost) {
        this.serverHost = serverHost;
    };
    sap.ui.kapsel.Logon.prototype.getServerHost = function() {
        return this.serverHost;
    };
    sap.ui.kapsel.Logon.prototype.setHttps = function(https) {
        this.https = https;
    };
    sap.ui.kapsel.Logon.prototype.getHttps = function() {
        return this.https;
    };
    sap.ui.kapsel.Logon.prototype.setServerPort = function(serverPort) {
        this.serverPort = serverPort;
    };
    sap.ui.kapsel.Logon.prototype.getServerPort = function() {
        return this.serverPort;
    };
    sap.ui.kapsel.Logon.prototype.setUser = function(user) {
        this.user = user;
    };
    sap.ui.kapsel.Logon.prototype.getUser = function() {
        return this.user;
    };
    sap.ui.kapsel.Logon.prototype.setPassword = function(password) {
        this.password = password;
    };
    sap.ui.kapsel.Logon.prototype.getPassword = function() {
        return this.password;
    };
    sap.ui.kapsel.Logon.prototype.setCommunicatorId = function(communicatorId) {
        this.communicatorId = communicatorId;
    };
    sap.ui.kapsel.Logon.prototype.getCommunicatorId = function() {
        return this.communicatorId;
    };
})();
