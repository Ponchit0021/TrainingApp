(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.FileBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.FileBase', {});

    sap.ui.mw.FileBase.prototype.loadFile = function(_sPath) {
        var oFileModel;
        return new Promise(function(resolve) {
            oFileModel = new sap.ui.model.json.JSONModel(_sPath, false);
            oFileModel.attachRequestCompleted(function(result) {
                resolve(oFileModel);
            });
        });
    };
})();
