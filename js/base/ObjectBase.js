(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.ObjectBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.ObjectBase', {});
    sap.ui.mw.ObjectBase.prototype.deletePropertyFromObject = function(_oObject, _sProperty) {
        if (_oObject) {
            if (_oObject.hasOwnProperty(_sProperty)) {
                _oObject[_sProperty] = null;
                delete _oObject[_sProperty];
            }
        }
    };


})();
