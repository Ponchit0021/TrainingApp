(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.CrossSellGuarantorSerialize");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.base.DisplayBase");
    jQuery.sap.require("js.helper.Entity");
    jQuery.sap.require("js.base.IdentifierBase");
    jQuery.sap.require("js.serialize.GeneralSerialize");

    sap.ui.base.Object.extend('sap.ui.serialize.CrossSellGuarantorSerialize', {
        constructor: function(_dataDB, sEntity) {
            var oSchemaDB;

            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
            this.sEntity = sEntity;
            this.sEntitySet = sEntity + "Set";
        }
    });

    sap.ui.serialize.CrossSellGuarantorSerialize.prototype.reviewCrossSellGuarantorCandidates = function(_oType, _sLoanRequestParentID, _sCustomerID,_sPromoterID) {
        var promiseOdata, promisePouch, oDictionary, oCrossSellGuarantorCandidates, oParams, oFinalCandidate, totalCand;
        oDictionary = new sap.ui.helper.Dictionary();
        oParams = {
            promoterID: _sPromoterID,
            loanRequestID: _sLoanRequestParentID

        };

        return new Promise(function(resolve, reject) {
            oCrossSellGuarantorCandidates = oDictionary.oDataRequest(oParams).getRequest(_oType);
            promisePouch = this.dataDB.get("GroupCrossSellGuarantorCandidateSet");
            promiseOdata = sap.ui.getCore().AppContext.myRest.read("/" + oCrossSellGuarantorCandidates.odata.name, oCrossSellGuarantorCandidates.odata.get.filter, true);
            Promise.all([promisePouch, promiseOdata]).then(function(values) {
               
                oFinalCandidate = { results: [] };
                totalCand = _.union(values[0].GroupCrossSellGuarantorCandidateSet, values[1].results);
                totalCand = _.reject(totalCand, function(itm) {
                    return itm.CustomerIdCRM === _sCustomerID;
                });
                oFinalCandidate.results = totalCand;
                resolve(oFinalCandidate);
            });
        }.bind(this));

    };

    sap.ui.serialize.CrossSellGuarantorSerialize.prototype.reviewCrossSellAssignedGuarantor = function(_oType, _sLoanRequestID, _sCustomerID, _promoterID, _aDataCandidate) {
        var promisePouch, promiseOdata, oDictionary, oCrossSellAssignedGuarantor, oParams, oFinalAssigned, totalAssigned, aAlreadyAssigned, oFinalCandidate;
        oDictionary = new sap.ui.helper.Dictionary();
        oParams = {
            promoterID: _promoterID
        };
        return new Promise(function(resolve, reject) {
            oCrossSellAssignedGuarantor = oDictionary.oDataRequest(oParams).getRequest(_oType);
            promisePouch = this.dataDB.getById(oDictionary.oTypes.LoanRequest, _sLoanRequestID);
            promiseOdata = sap.ui.getCore().AppContext.myRest.read("/" + oCrossSellAssignedGuarantor.odata.name, oCrossSellAssignedGuarantor.odata.get.filter, true);
            var oPouch;
            Promise.all([promisePouch, promiseOdata]).then(function(values) {
                if (values[0].LoanRequestSet.length > 0) {
                    var oPouch = { results: [] };
                    if(values[0].LoanRequestSet[0].GroupCrossSellAssignedGuarantorSet){
                        oPouch.results.push(values[0].LoanRequestSet[0].GroupCrossSellAssignedGuarantorSet);
                        totalAssigned = _.union(oPouch.results, values[1].results);
                    }
                   
                } else {
                    totalAssigned = values[1].results;
                }
                oFinalAssigned = { results: [] };
                oFinalCandidate = { results: [] };
                oFinalAssigned.results = totalAssigned;
                aAlreadyAssigned  = [];
                _.each(_aDataCandidate.results, function(itm) {
                    _.each(oFinalAssigned.results, function(elem) {
                        if(itm.CustomerIdCRM === elem.CustomerIdCRM){
                            aAlreadyAssigned.push(itm);
                        }
                    });
                });
                oFinalCandidate.results = _.difference(_aDataCandidate.results,aAlreadyAssigned);
                console.log("oFinalCandidate",oFinalCandidate);
                resolve(oFinalCandidate);
            });
        }.bind(this));

    };

})();
