(function () {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.NavigatorBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.NavigatorBase', {});


    sap.ui.mw.NavigatorBase.prototype.testUserAgent = function () {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return true;
        }
        else {
            return false;
        }
    };

})();
