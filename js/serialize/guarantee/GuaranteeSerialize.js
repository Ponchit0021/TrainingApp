(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.Guarantee");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");

    sap.ui.base.Object.extend('sap.ui.serialize.Guarantee', {
        constructor: function(_dataDB) {
            var oSchemaDB;


            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
            this.promoterID = "";
        }
    });
    sap.ui.serialize.Guarantee.prototype.verifyGuaranteeLoanRelationShip = function(_GuaranteeIdMD) {
        var oIndexes, oFilters;
        oIndexes = ['data.indLoanGuaranteeIdMD'];
        oFilters = {
            $and: [{
                '_id': { $lte: 'GuaranteeLoanRelationship\uffff' }
            }, {
                'data.indLoanGuaranteeIdMD': { $eq: _GuaranteeIdMD }
            }]
        };
        return new Promise(function(resolve, reject) {


            this.dataDB.getByProperty(oIndexes, oFilters).then(function(msg) {
                resolve(msg);
            }).catch(function(error) {
                reject(error);

            });

        }.bind(this));
    };

    sap.ui.serialize.Guarantee.prototype.getGuaranteesArray = function(_oDataKapselArray, aPromisesGuarantes) {
        var counter, oGuaranteeLoanArray, _self;
        counter = 0;
        oGuaranteeLoanArray = [];
        _self = this;
        return new Promise(function(resolve, reject) {
            try {

                if (_oDataKapselArray.results.length > 0) {

                    _oDataKapselArray.results.forEach(function(entry) {

                        if (aPromisesGuarantes.indexOf(entry.GuarantorIdMD) < 0) {
                            oGuaranteeLoanArray.push(entry);
                        }

                    });

                    resolve(oGuaranteeLoanArray);

                } else {

                    resolve(oGuaranteeLoanArray);

                }
            } catch (ex) {
                
                reject(ex);
            }
        });
    };
   
    /**
     * [getMainModelWithOutLoan Lista de avales disponibles para CI]
     * @param  {[String]} _oType       [Colección deseada de tipo GET: CustomerSet, LoanRequest, etc.]
     * @param  {[String]} _sPromoterID [Username del promotor]
     * @return {[Promise]}             [Promesa con el modelo combinado de las dos fuentes]
     */
    sap.ui.serialize.Guarantee.prototype.getMainModelWithOutLoan = function(_oType, _sPromoterID) {
        var promisePouch, oGuaranteeDictionary, oDataKapselArray, oMergedArray, oDataModel, oDictionary, _self;
        _self = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            try {

                var oPromiseGuarantees;
                var oKapselPromise;
                var oPartialResults;
                var aPromisesGuarantes;
                var aPromisesGuaranteesPouch;
                var j;

                oMergedArray = {};

                oGuaranteeDictionary = oDictionary.oDataRequest({}).getRequest(_oType);

                oKapselPromise = sap.ui.getCore().AppContext.myRest.read("/" + oGuaranteeDictionary.odata.name + oGuaranteeDictionary.odata.get.filterAvFReqExpand, "", true);
                oPromiseGuarantees = this.dataDB.get("GuaranteeLoanRelationship");

                Promise.all([oKapselPromise, oPromiseGuarantees]).then(function(results) {

                    oDataKapselArray = results[0];

                    aPromisesGuarantes = new Array();
                    aPromisesGuaranteesPouch = new Array();

                    aPromisesGuarantes = results[1].GuaranteeLoanRelationshipSet;

                    for (j = 0; j < aPromisesGuarantes.length; j++) {

                        aPromisesGuaranteesPouch.push(aPromisesGuarantes[j].indLoanGuaranteeIdMD);

                    }


                    oPartialResults = _self.getGuaranteesArray(oDataKapselArray, aPromisesGuaranteesPouch);

                    oPartialResults.then(function(oGuaranteeLoanArray) {


                        var oResults;
                        oResults = {};
                       


                        oResults.results = _.sortBy(oGuaranteeLoanArray,
                            function(oBP) {

                                return oBP.BpName.LastName;
                            });

                        resolve(oResults);

                    }).catch(function(err) {
                        reject(err);

                    });


                }).catch(function(err) {
                    reject(err);

                   

                });
            } catch (e) {
                reject(e);
            }

        }.bind(this));
    }

})();
