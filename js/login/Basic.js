(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.login.Basic");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.login.Basic', {
        constructor: function() {
            

        }
    });

   
    
    /**
     * [start Se inicializa el plugin logon de kapsel]
     * @return {[Promise]} [Returna un promise con success y reject]
     */
    sap.ui.login.Basic.prototype.initializeRest = function() {
        var sBtoa = sap.ui.getCore().AppContext.Config.getProperty("promoterId") + ":" + sap.ui.getCore().AppContext.Config.getProperty("passPromoterId");
        sap.ui.getCore().AppContext.Promotor = sap.ui.getCore().AppContext.Config.getProperty("promoterId");
        sap.ui.getCore().AppContext.myRest = new sap.ui.mw.Rest("/mock/", true, "Basic " + btoa(sBtoa), "sAppCID", true, false, false, false);
        sap.ui.getCore().AppContext.oRest = sap.ui.getCore().AppContext.myRest;

    };
})();
