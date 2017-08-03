/**
 * [PreLoader Clase de tipo object notation que controla la carga inicial de la
 * app]
 * @type {Object}
 */
var PreLoader = function(_preloader, _content, _legend) {
    this.preloader = _preloader;
    this.content = _content;
    this.legend = _legend;

};
PreLoader.prototype.initDeviceReady = function() {
    jQuery.sap.require("js.base.NavigatorBase");
    var oNavigatorBase = new sap.ui.mw.NavigatorBase();
    jQuery.sap.require("js.base.EventBase");
    var oEventBase = new sap.ui.mw.EventBase();
    sap.ui.getCore().AppContext.EventBase = oEventBase;

    if (oNavigatorBase.testUserAgent()) {
        document.addEventListener("deviceready", this.onDeviceReady, false);
    }
};
PreLoader.prototype.onDeviceReady = function() {

    document.addEventListener("backbutton", sap.ui.getCore().AppContext.EventBase.backEvent, false);

};
/**
 * [setPreloader Setter del id del DIV que funciona como preloader]
 * @param {[string]} _preloader [id del DIV preloader]
 */
PreLoader.prototype.setPreloader = function(_preloader) {
    this.preloader = _preloader;
};
/**
 * [getPreloader Getter del id del div #preloader]
 * @return {[string]} [description]
 */
PreLoader.prototype.getPreloader = function() {
    return this.preloader;
};
/**
 * [setContent Setter del id del DIV que funciona como contenedor de SAPUI5]
 * @param {[string]} _content [description]
 */
PreLoader.prototype.setContent = function(_content) {
    this.content = _content;
};
/**
 * [getContent Getter del id del div #content]
 * @return {[string]} [description]
 */
PreLoader.prototype.getContent = function() {
    return this.content;
};
PreLoader.prototype.setLegend = function(_legend) { this.legend = _legend; };
PreLoader.prototype.getLegend = function() {
    return this.legend;
};

PreLoader.prototype.startLogon = function() {

    var logonSMP, promiseLogin, currentClass, config, oNavigatorBase, localEnv, sBtoa;

    currentClass = this;
    sap.ui.getCore().AppContext = {};
    sap.ui.getCore().AppContext.Navigation = {};
    sap.ui.getCore().AppContext.Navigation.detail = false;
    jQuery.sap.require("js.base.BusyBase");
    sap.ui.getCore().AppContext.loader = new sap.ui.mw.BusyBase();

    // Carga de archivo de configuracion
    config = new sap.ui.model.resource.ResourceModel({
        bundleUrl: "config/config.properties",
        bundleLocale: "es_MX"
    });

    sap.ui.getCore().AppContext.Config = config;
    // Carga de Logon
    jQuery.sap.require("js.kapsel.Logon");
    jQuery.sap.require("js.base.NavigatorBase");
    jQuery.sap.require("js.kapsel.Rest");
    jQuery.sap.require("js.login.LogonForm");
    var logonSMP=new sap.ui.mw.forms.initial.logon();
    console.log(logonSMP);
    currentClass.hideLoader();
    logonSMP.createForm(this).placeAt("content");

    
    //Se utliza unicamente para pruebas de AOTraining - ELIMINAR al tener listo REST
    sap.ui.getCore().AppContext.Promotor = sap.ui.getCore().AppContext.Config.getProperty("promoterId");
    sap.ui.getCore().AppContext.myRest = new sap.ui.mw.Rest("/mock/", true, "Basic " + btoa(sBtoa), "sAppCID", true, false, false, false);
    sap.ui.getCore().AppContext.oRest = sap.ui.getCore().AppContext.myRest;

    /* logonSMP = new sap.ui.kapsel.Logon();

    oNavigatorBase = new sap.ui.mw.NavigatorBase();
    currentClass.initDeviceReady();
    sBtoa = sap.ui.getCore().AppContext.Config.getProperty("promoterId") + ":" + sap.ui.getCore().AppContext.Config.getProperty("passPromoterId");
    if (oNavigatorBase.testUserAgent()) {

        currentClass.hideLoader();
        logonSMP.start()
            .then(currentClass.successLogon.bind(this))
            .catch(currentClass.errorLogon);
    } else {
        currentClass.hideLoader();
        sap.ui.getCore().AppContext.Promotor = sap.ui.getCore().AppContext.Config.getProperty("promoterId");
        localEnv = sap.ui.getCore().AppContext.Config.getProperty("env");
        if (localEnv === "1") {
            sap.ui.getCore().AppContext.myRest = new sap.ui.mw.Rest("/mock/", true, "Basic " + btoa(sBtoa), "sAppCID", true, false, false, false);
            sap.ui.getCore().AppContext.oRest = sap.ui.getCore().AppContext.myRest;
        } else {
            sap.ui.getCore().AppContext.myRest = new sap.ui.mw.Rest("http://localservice", true, "Basic " + btoa(sBtoa), "sAppCID", true, true, true, false);
            sap.ui.getCore().AppContext.oRest = new sap.ui.mw.Rest(sap.ui.getCore().AppContext.Config.getProperty("igwUrl"), true, "Basic " + sap.ui.getCore().AppContext.Config.getProperty("sBtoa"), "", false, false, false, true);

        }

        currentClass.createShell("AO", "com.gentera");

    } */

};
PreLoader.prototype.start = function() {

    this.addLibrary("resources/sap-ui-core.js", true)
        .then(this.addLibrary("https://maps.googleapis.com/maps/api/js", false))
        .then(this.startLogon.bind(this))
        .catch(function(error) { console.log(error); });
};
PreLoader.prototype.successLogon = function(context, isRetry) {
    $('#actionStore').hide();
    jQuery.sap.require("js.kapsel.Logger");
    var loggerSMP = new sap.ui.kapsel.Logger();
    sap.ui.getCore().AppContext.LoggerSMP = loggerSMP;
    var currentClass = this;


    //*************************************
    currentClass.monitorNetwork();
    //*************************************
    var pushNotifications, userToUpperCase;
    // this.createShell("AO", "com.gentera");
    sap.ui.getCore().AppContext.applicationContext = context;
    jQuery.sap.require("js.kapsel.Push");
    pushNotifications = new sap.ui.kapsel.Push();
    pushNotifications.registerForPush();
    ///** Test Rest*//
    var sAuthStr, sAppCID, sAppEndpoint, smpServerProtocol;
    var oMetadata;
    // se pasa el nombre de usuario a mayusculas para consumo de servicios
    userToUpperCase =
        sap.ui.getCore()
        .AppContext.applicationContext.registrationContext.user.toUpperCase();
    sap.ui.getCore().AppContext.applicationContext.registrationContext.user =
        userToUpperCase;
    sap.ui.getCore().AppContext.Promotor =
        sap.ui.getCore().AppContext.applicationContext.registrationContext.user;
    smpServerProtocol =
        sap.ui.getCore().AppContext.applicationContext.registrationContext.https ? "https" : "http";
    sap.ui.getCore().AppContext.applicationContext.igwEndpointURL =
        smpServerProtocol + "://" +
        sap.ui.getCore()
        .AppContext.applicationContext.registrationContext.serverHost +
        ":" +
        sap.ui.getCore()
        .AppContext.applicationContext.registrationContext.serverPort +
        "/" + sap.ui.getCore().AppContext.Config.getProperty("appIdIGW");
    ////////////////////////////////////////////////////////////////////////
    sAuthStr =
        "Basic " +
        btoa(sap.ui.getCore()
            .AppContext.applicationContext.registrationContext.user +
            ":" +
            sap.ui.getCore()
            .AppContext.applicationContext.registrationContext.password);
    sAppCID =
        sap.ui.getCore().AppContext.applicationContext.applicationConnectionId;
    jQuery.sap.require("js.kapsel.Rest");
    sAppEndpoint =
        sap.ui.getCore().AppContext.applicationContext.applicationEndpointURL;

    // gateway services
    sap.ui.getCore().AppContext.myRest =
        new sap.ui.mw.Rest(sAppEndpoint, true, sAuthStr, sAppCID, false, true);

    // integration gateway services
    var oPath =
        smpServerProtocol + "://" +
        sap.ui.getCore()
        .AppContext.applicationContext.registrationContext.serverHost +
        ":" +
        sap.ui.getCore()
        .AppContext.applicationContext.registrationContext.serverPort +
        "/" + sap.ui.getCore().AppContext.Config.getProperty("appIdIGW");
    sap.ui.getCore().AppContext.oRest =
        new sap.ui.mw.Rest(oPath, true, sAuthStr, sAppCID, false);
    // Meter con promise openStore's, en el then se manda a createShell
    //--------------------------------------
    // Abrir Local Store de Kapsel
    //

    var bStoreExists = false;

    if (sap.OData.stores) {

        if (sap.OData.stores.length > 0) {
            bStoreExists = true;
        }
    }

    if (isRetry) {
        bStoreExists = false;
        $('.sk-cube-grid').show("fast");
    }

    if (!bStoreExists) {

        var offlineStoreGw, offlineStoreIGw, promiseOfflineKapsel, promiseArray;
        currentClass = this;

        var objectRequGw = {
            "Customers": "/CustomerSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "Guarantors": "/GuarantorSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "LoanRequests": "/LoanRequestSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "Links": "/LinkSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "LinkGuarantors": "/LinkGuarantorSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "Addresses": "/AddressSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "Employers": "/EmployerSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "Images": "/ImageSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "PersonalReferences": "/PersonalReferenceSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "Phones": "/PhoneSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "ChannelMediumDispersions": "/ChannelMediumDispersionSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "InsuranceBeneficiaries": "/InsuranceBeneficiarySet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "Insurances": "/InsuranceSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "PostalCodes": "/PostalCodeSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "CrossSellingCandidate": "/CrossSellingCandidateSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "' and IsMarkedToDownload eq true",
            "CrossSellOffer": "/CrossSellOfferSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "GroupCrossSellGuarantorCandidate": "/GroupCrossSellGuarantorCandidateSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "GroupCrossSellAssignedGuarantor": "/GroupCrossSellAssignedGuarantorSet?$filter=CollaboratorID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'"
        };

        var objectRequIGw = {
            "Pendings": "/PendingsPromoterSet?$filter=promoterID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'",
            "Announcements": "/AnnouncementsPromoterSet?$filter=promoterID eq '" +
                sap.ui.getCore()
                .AppContext.applicationContext.registrationContext.user +
                "'"
        };

        jQuery.sap.require("js.kapsel.Store");
        offlineStoreGw = new sap.ui.kapsel.Store(
            "GWLocalStore", objectRequGw,
            sap.ui.getCore().AppContext.applicationContext.applicationEndpointURL);
        console.log(offlineStoreGw);
        offlineStoreIGw = new sap.ui.kapsel.Store(
            "IGWLocalStore", objectRequIGw,
            sap.ui.getCore().AppContext.applicationContext.igwEndpointURL);
        console.log(offlineStoreIGw);
        /*Se invoca inicializar cache Z de GW para que esta pueda funcionar correctamente.
            Debido a que el servicio de GW funciona ONLINE y tiene distintos escenarios de posible fallo,
            no se bloquea el flujo de la aplicación en caso de error. 
            Ya que su principal requerimiento es trabajar OFFLINE*/
        this.reviewGWCache().then(function() {
                Promise.all([offlineStoreGw.start(), offlineStoreIGw.start()])
                    .then(
                        function() {
                            sap.ui.getCore().AppContext.offlineStoreGw = offlineStoreGw;
                            sap.ui.getCore().AppContext.offlineStoreIGw = offlineStoreIGw;
                            currentClass.successOfflineKapsel(context);
                        },
                        function(error) {
                            currentClass.errorOfflineKapsel(error, context);
                        });
            },
            function(error) {
                console.log("El servicio /InitializeCache retornó un ERROR: " + error);
                Promise.all([offlineStoreGw.start(), offlineStoreIGw.start()])
                    .then(
                        function() {
                            sap.ui.getCore().AppContext.offlineStoreGw = offlineStoreGw;
                            sap.ui.getCore().AppContext.offlineStoreIGw = offlineStoreIGw;
                            currentClass.successOfflineKapsel(context);
                        },
                        function(error) {
                            currentClass.errorOfflineKapsel(error, context);
                        });
            });

    } else {
        currentClass.successOfflineKapsel(context);
    }

    /* }).catch(function(res){
         console.log(res);

     });*/




};
PreLoader.prototype.successOfflineKapsel = function(_context) {
    this.createShell("AO", "com.gentera");
    setTimeout(function() { $('#stores').hide("fast"); }, 5000);

    sap.OData.applyHttpClient(); // Offline OData calls can now are made

    console.log("====================== Store is OPEN. ======================");

};
PreLoader.prototype.errorOfflineKapsel = function(error, _context) {
    console.log("--------------------- errorOfflineKapsel: " +
        JSON.stringify(error));
    $('#storesDesc')
        .html(
            "Ha ocurrido un error de comunicación. Intenta de nuevo por favor.");
    $('.sk-cube-grid').hide();
    // $('#actionStore').html("");
    //

    $('#actionStore').show("fast");
    if (sap.ui.getCore().byId('btnErrorOffline') === undefined) {

        new sap.m.Button('btnErrorOffline', { text: "Reintentar", icon: "sap-icon://refresh" })
            .attachPress(function(_context) {
                this.successLogon(_context, true);
                $('#storesDesc').html("Reintentando...");

            }.bind(this, _context))
            .placeAt("actionStore");
    }

};
PreLoader.prototype.errorLogon = function(error) {
    console.log("error: " + JSON.stringify(error));
};
/**
 * [monitorNetwork - monitoreo del estatus de red online/offline]
 * @return {[type]} [description]
 */
PreLoader.prototype.monitorNetwork = function() {
    sap.ui.getCore().AppContext.isConected = false;
    jQuery.sap.require("js.device.Connection");
    var oConnection = new sap.ui.device.Connection();
    sap.ui.getCore().AppContext.oConnection = oConnection;
    console.log("#### NETWORK MONITORING STARTED ####");
    if (sap.ui.getCore().AppContext.isConected) {
        console.log("NETWORK STATUS: ONLINE");
    } else {
        console.log("NETWORK STATUS: OFFLINE");
    }
};
PreLoader.prototype.hideLoader = function() {
    setTimeout(function() {
        document.getElementById(this.preloader).innerHTML = "";
        document.getElementById(this.preloader).style.visibility = 'hidden';
        var el = document.querySelector('#' + this.preloader + '');
        el.parentNode.removeChild(el);
    }.bind(this), 2000);

};
PreLoader.prototype.changeLegend = function(message) {
    var legendID = this.getLegend();
    console.log(message);
    console.log(legendID);
    // var test=document.getElementById("preloaderLegend");
    // console.log(test);
    document.getElementById("preloaderLegend").innerHTML = message;

};
PreLoader.prototype.createLoaderShell = function(_title) {
    return new Promise(function(resolve, reject) {

        try {

            var testForm = new sap.ui.layout.form.SimpleForm({
                minWidth: 1024,
                maxContainerCols: 1,
                content: [
                    new sap.ui.core.Title({
                        // this starts a new group
                        text: "Cargando información"
                    }),
                    new sap.m.Label("labelError", { text: 'Cargando Datos del  promotor' }),
                    new sap.m.Button({ text: "Reitentar" })

                ]
            });
            setTimeout(function() { resolve("OK"); }, 1000);

        } catch (e) {
            reject(e);
        }
    });
};
PreLoader.prototype.createShell = function(_title, _name) {
    console.log("Entró al método de createShell");
    new sap.m.Shell("Shell", {
            title: _title,
            app: new sap.ui.core.ComponentContainer({ name: _name })
        })
        .placeAt(this.content);

    console.log("Terminó de ejecutar el método de CreateShell");
};
PreLoader.prototype.addLibrary = function(_src, _isSAPUI5) {
    var currentScript, readyFlag, firstScript, currentClass;
    currentClass = this;
    return new Promise(function(resolve, reject) {
        try {

            setTimeout(function() {
                readyFlag = false;
                currentScript = document.createElement('script');
                currentScript.type = 'text/javascript';
                currentScript.src = _src;
                if (_isSAPUI5) {
                    currentScript.id = "sap-ui-bootstrap";
                    currentScript.setAttribute("data-sap-ui-libs",
                        "sap.m, sap.ui.commons");
                    currentScript.setAttribute("data-sap-ui-theme", "sap_bluecrystal");
                    currentScript.setAttribute("data-sap-ui-xx-bindingSyntax", "complex");
                    currentScript.setAttribute("data-sap-ui-preload", "none");
                    currentScript.setAttribute(
                        "data-sap-ui-resourceroots",
                        '{"com.gentera":"./","originacion":"originacion","js":"js"}');
                }
                currentScript.onload = currentScript.onreadystatechange = function() {
                    if (!readyFlag &&
                        (!this.readyState || this.readyState == 'complete')) {
                        readyFlag = true;
                        resolve("Script cargado:" + _src);
                    }
                };
                firstScript = document.getElementsByTagName('script')[0];
                firstScript.parentElement.appendChild(currentScript);

            }, 4000);

        } catch (e) {
            reject(e);
        }

    });

};

PreLoader.prototype.reviewGWCache = function() {
    return new Promise(function(resolve, reject) {
        sap.ui.getCore().AppContext.myRest.read("/InitializeCache", "CollaboratorID='" + sap.ui.getCore().AppContext.Promotor + "'", true)
            .then(resolve).catch(reject);
    });
};

(function() {
    var preloader = new PreLoader("preloader", "content", "preloaderLegend");
    preloader.start();

})();
