(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.buffer.LoanFilter");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");


    sap.ui.base.Object.extend('sap.ui.buffer.LoanFilter', {
        constructor: function(_loanfilterDB) {

            var oSchemaDB;
            this.loanfilterDB = new sap.ui.db.Pouch(_loanfilterDB);

            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            this.loanfilterDB.setSchema(oSchemaDB.getLoanFilterDBSchema());

        }
    });


    sap.ui.buffer.LoanFilter.prototype.postRequest = function(_oData) {
        var oController, oDictionary, oFilterData;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        oFilterData = {
            id: _oData.LoanRequestIdCRM,
            LoanRequestIdCRM: _oData.LoanRequestIdCRM
        };

        return new Promise(function(resolve, reject) {
            oController.loanfilterDB.getById(oDictionary.oQueues.LoanFilter, oFilterData.id)
                .then(function(oFilterData, result) {
                    if (result.LoanFilterSet) {
                        if (result.LoanFilterSet.length > 0) { // update
                            oController.loanfilterDB.update(oDictionary.oQueues.LoanFilter, oFilterData.id, oFilterData)
                                .then(function(oResult) {
                                    resolve(oResult);
                                }).catch(function(e) {
                                    reject(e);
                                });
                        } else { // new element
                            oController.loanfilterDB.post(oDictionary.oQueues.LoanFilter, oFilterData)
                                .then(function(oResult) {
                                    resolve(oResult);
                                }).catch(function(e) {
                                    reject(e);
                                });
                        }
                    }
                }.bind(oController, oFilterData));
        });
    };

})();