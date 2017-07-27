(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.validations.base");
    jQuery.sap.require("sap.ui.base.Object");
    sap.ui.base.Object.extend('sap.ui.validations.base', {});
    sap.ui.validations.base.prototype.evaluate = function(_context, _rules) {

        try {
            _rules.bussinessRules.some(function(bussinessRule){
                eval("_context." + bussinessRule.fx + "(bussinessRule)");
                 if (!this.validated) {
                    return true;
                }
            }.bind(_context));
        } catch (ex) {
            console.log(ex);

        }

    }
})();

