(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.CrossSell");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.base.DisplayBase");
    jQuery.sap.require("js.helper.Entity");
    jQuery.sap.require("js.base.IdentifierBase");

    sap.ui.base.Object.extend('sap.ui.serialize.CrossSell', {
        constructor: function(_dataDB, sEntity) {
            var oSchemaDB;

            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
            //TRAINING
            this.crossDB = new sap.ui.db.Pouch("crossDB");
            this.crossDB.setSchema(oSchemaDB.getCrossDBSchema());

            this.promoterID = "";
            this.sEntity = sEntity;
            this.sEntitySet = sEntity + "Set";
        }
    });

    /**
     * [setPromoterID SETTER para promoterID]
     * @param {[String]} _promoterID [setear el id del promotor actual]
     */
    sap.ui.serialize.CrossSell.prototype.setPromoterID = function(_promoterID) {
        this.promoterID = _promoterID;
    };
    /**
     * [getPromoterID GETTER par promoterID]
     * @return {[String]} [ID del promotor actual]
     */
    sap.ui.serialize.CrossSell.prototype.getPromoterID = function() {
        return this.promoterID;
    };
    /**
     * [reviewCrossSellCandidates description]
     * @param  {[type]} _oType       [description]
     * @param  {[type]} _sPromoterID [description]
     * @return {[type]}              [description]
     */
    sap.ui.serialize.CrossSell.prototype.reviewCrossSellCandidates = function(_oType, _sPromoterID) {
        var promiseOdata, promisePouch, oParams, oCrossSellCandidateDictionary, oDictionary, validatedcandidates, productsLength;
        oDictionary = new sap.ui.helper.Dictionary();
        oParams = {
            promoterID: _sPromoterID
        };
        return new Promise(function(resolve, reject) {
            oCrossSellCandidateDictionary = oDictionary.oDataRequest(oParams).getRequest(_oType);
            promisePouch = this.dataDB.get("CrossSellOfferSet");
            promiseOdata = sap.ui.getCore().AppContext.myRest.read("/" + oCrossSellCandidateDictionary.odata.name, oCrossSellCandidateDictionary.odata.get.filterCandidates, true);

            Promise.all([promisePouch, promiseOdata]).then(function(values) {
                validatedcandidates = { results: [] };

                _.each(values[1].results, function(item) {
                    productsLength = _.filter(values[0].CrossSellOfferSet, function(d) { return d.CandidateIdCRM === item.CandidateIdCRM }).length;
                    if (item.CrossSellOfferSet.results.length !== productsLength) {
                        validatedcandidates.results.push(item);
                    }
                });
                //TRAINING - Candidatos previamente seleccionados ONLINE (Simulación)
                this.simulateSelectedCandidates(validatedcandidates)
                    .then(function(selectedCandidates) {
                        resolve(selectedCandidates);
                    });
                //resolve(validatedcandidates);
            }.bind(this))
        }.bind(this));
    };
    //TRAINING - Visualización de candidatos descargados (Simulación)  
    sap.ui.serialize.CrossSell.prototype.simulateSelectedCandidates = function(_validatedcandidates) {
        var oDictionary = new sap.ui.helper.Dictionary();
        var finalCandidates = { results: null };
        var oArray = _validatedcandidates.results;
        var oCandidates = [];
        return new Promise(function(resolve, reject) {
            this.crossDB.get(oDictionary.oQueues.CrossSellBatch)
                .then(function(result) {
                    if (result.CrossSellBatchSet.length > 0) {
                        _.each(result.CrossSellBatchSet[0].selectedCandidates, function(item) {
                            _.each(oArray, function(candidate, i) {
                                if (item === candidate.CandidateIdCRM) {
                                    oCandidates.push(candidate);
                                }
                            });
                        });
                    }
                    finalCandidates = { results: oCandidates };
                    resolve(finalCandidates);
                }.bind(this));
        }.bind(this));
    };

    sap.ui.serialize.CrossSell.prototype.reviewCrossSellProducts = function(_aProducts) {
        var currentProducts, currentCandidateIdCRM, pouchCrossSellOfferFiltered;
        currentProducts = _aProducts.results[0].CrossSellOfferSet.results;
        currentCandidateIdCRM = _aProducts.results[0].CandidateIdCRM;
        return new Promise(function(resolve, reject) {
            this.dataDB.get("CrossSellOfferSet").then(function(aPouch) {

                pouchCrossSellOfferFiltered = _.filter(aPouch.CrossSellOfferSet, function(d) { return d.CandidateIdCRM === currentCandidateIdCRM });
                _.each(pouchCrossSellOfferFiltered, function(item) {
                    currentProducts = _.without(currentProducts, _.findWhere(currentProducts, {
                        CrossSellProductId: item.CrossSellProductId
                    }));
                })
                resolve(currentProducts);
            })

        }.bind(this));


    };



})();