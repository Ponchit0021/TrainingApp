(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.BusyBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.BusyBase', {});


    sap.ui.mw.BusyBase.prototype.show = function(oMessage) {
        swal({
            title: oMessage,
            showConfirmButton: false,
            animation:false  
        });
    };
    sap.ui.mw.BusyBase.prototype.close = function() {
        swal.close()
    };

})();
