(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.CrossSellOfferSerialize");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.base.ObjectBase");
    jQuery.sap.require("js.base.DisplayBase");
    jQuery.sap.require("js.helper.Entity");
    jQuery.sap.require("js.serialize.GeneralSerialize");
    jQuery.sap.require("js.base.IdentifierBase");

    sap.ui.base.Object.extend('sap.ui.serialize.CrossSellOfferSerialize', {
        constructor: function(_dataDB) {
            var oSchemaDB;
            jQuery.sap.require("js.helper.Schema");
            jQuery.sap.require("js.buffer.crosssell.CrossSellOfferBuffer");
            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
        }
    });

    sap.ui.serialize.CrossSellOfferSerialize.prototype.serialize = function(_oModel, _oFlag, _oIdRejectReason) {
        var oController, oIdBase, oId, oDisplayBase, oCurrentOffer;
        oController = this;
        oIdBase = new sap.ui.mw.IdentifierBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oCurrentOffer = _oModel.oData.results[0];

        return new Promise(function(resolve, reject) {
            oCurrentOffer.id = oCurrentOffer.CandidateIdCRM + oCurrentOffer.CrossSellProductId;
            oCurrentOffer.OfferDate = oDisplayBase.formatJSONDate(oCurrentOffer.OfferDate);

            if (_oFlag === "Accept") {
                oCurrentOffer.IsAccepted = true;
                oCurrentOffer.IsRejected = false;
                oCurrentOffer.RejectionReasonId = "";
            } else {
                oCurrentOffer.IsAccepted = false;
                oCurrentOffer.IsRejected = true;
                oCurrentOffer.RejectionReasonId = _oIdRejectReason;
            }

            oController.upsert(oCurrentOffer)
                .then(function(oResult) {
                    resolve(oResult);
                }).catch(function(e) {
                    resolve(e);
                });
        });
    };
    sap.ui.serialize.CrossSellOfferSerialize.prototype.upsert = function(_oCurrentOffer) {
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            console.log(_oCurrentOffer);
            oController.dataDB.post(oDictionary.oTypes.CrossSellOffer, _oCurrentOffer)
                .then(function(oResult) {
                    resolve(oResult);
                }).catch(function(e) {
                    reject(e);
                });
        });
    };
    sap.ui.serialize.CrossSellOfferSerialize.prototype.deSerialize = function(_oQueueItem) {
        var oController, oDictionary, oBase, oCrossSellOffer;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        oBase = new sap.ui.mw.ObjectBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        return new Promise(function(resolve, reject) {
            oController.dataDB.getById(oDictionary.oTypes.CrossSellOffer, _oQueueItem.requestBodyId)
                .then(function(oResult) {
                    if (oResult.CrossSellOfferSet[0]) {
                        oCrossSellOffer = oResult.CrossSellOfferSet[0];
                        console.log("#1");
                        console.log(oCrossSellOffer);
                        if (oCrossSellOffer.hasOwnProperty("__metadata")) {
                            oBase.deletePropertyFromObject(oCrossSellOffer, "__metadata");
                        }
                        if (oCrossSellOffer.hasOwnProperty("id")) {
                            oBase.deletePropertyFromObject(oCrossSellOffer, "id");
                        }
                        if (oCrossSellOffer.hasOwnProperty("rev")) {
                            oBase.deletePropertyFromObject(oCrossSellOffer, "rev");
                        }
                        if (oCrossSellOffer.hasOwnProperty("OfferDate")) {
                            /*oCrossSellOffer.OfferDate = oDisplayBase.formatJSONDate(oCrossSellOffer.OfferDate);
                            console.log(oCrossSellOffer.OfferDate);
                            oCrossSellOffer.OfferDate = "/Date(1487727762518)/";*/
                            console.log(oCrossSellOffer.OfferDate);
                        }

                        console.log("#2");
                        console.log(oCrossSellOffer);
                        resolve(oCrossSellOffer);
                    }
                });
        });
    };
    sap.ui.serialize.CrossSellOfferSerialize.prototype.sendToCore = function(_oModel, _oCandidate) {
        var oDictionary, oRequest, oId, oBuffer, oCandidate;
        oDictionary = new sap.ui.helper.Dictionary();
        oBuffer = new sap.ui.buffer.CrossSellOffer("syncDB");
        oId = _oModel.getProperty("/results/0/id");
        oCandidate = _oCandidate.getProperty("/results/0/CandidateName/FirstName") + " " + _oCandidate.getProperty("/results/0/CandidateName/MiddleName") + " " + _oCandidate.getProperty("/results/0/CandidateName/LastName");

        return new Promise(function(resolve, reject) {
            oRequest = {
                id: oId,
                requestMethod: oDictionary.oMethods.POST,
                requestUrl: oDictionary.oDataTypes.CrossSellOffer,
                requestBodyId: oId,
                requestStatus: oDictionary.oRequestStatus.Initial,
                requestConfirmed: false,
                requestDescription: oCandidate,
            };
            oBuffer.postRequest(oRequest)
                .then(function(oResult) {
                    resolve(oResult);
                });
        });
    };

    sap.ui.serialize.CrossSellOfferSerialize.prototype.searchInDataDB = function(_oArgs) {
        var oController, oIndexes, oFilters;
        oController = this;
        oIndexes = ['data.CandidateIdCRM', 'data.CrossSellProductId'];
        oFilters = {
            $and: [
                /*{
                                '_id': { $eq: 'CrossSellOffer\uffff' }
                            },*/
                {
                    'data.CandidateIdCRM': { $eq: _oArgs.candidateId }
                }, {
                    'data.CrossSellProductId': { $eq: _oArgs.productId }
                }
            ]
        };
        return new Promise(function(resolve, reject) {
            oController.dataDB.getByProperty(oIndexes, oFilters)
                .then(function(oResult) {
                    if (oResult.docs.length === 0)
                        resolve(false);
                    else {
                        resolve(true);
                    }
                }).catch(function(e) {
                    reject(e);
                });
        });
    };
})();
