(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.IdentifierBase");
    jQuery.sap.require("sap.ui.base.Object");
    sap.ui.base.Object.extend('sap.ui.mw.IdentifierBase', {});
    sap.ui.mw.IdentifierBase.prototype.createId = function() {
        var sDeviceID, oDateId;
        if (typeof device !== "undefined") {
            sDeviceID = device.uuid;
        } else {
            sDeviceID = "2810201605270122";
        }
        oDateId = Date.now();
        return (sDeviceID + oDateId).toUpperCase();
    };
})();
