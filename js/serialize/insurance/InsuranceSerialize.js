(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.Insurance");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");


    sap.ui.base.Object.extend('sap.ui.serialize.Insurance', {
        constructor: function(_dataDB) {
            var oSchemaDB;

            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            jQuery.sap.require("js.base.DisplayBase");
            jQuery.sap.require("js.base.ObjectBase");

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());

        }
    });
    /**
     * [serialize Función que serializa un insurance (modelo oData) a formato pouchdb]
     * @param  {[JSON]} _oInsurance [Solicitante en formato json]
     * @return {[NA]}            [NA]
     * author: israel
     */
    sap.ui.serialize.Insurance.prototype.serialize = function(_oInsurance) {
        console.log("\n");
        console.log("###################");
        console.log("#### SERIALIZE ####")
        console.log("###################");
        var oController, oDictionary, oInsuranceIdMD, oId;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            oController.dataDB.getById(oDictionary.oTypes.Insurance, _oInsurance.oData.results[0].InsuranceIdMD)
                .then(function(oResult) {
                    if (oResult.InsuranceSet.length > 0) {
                        console.log("\n");
                        console.log("#################");
                        console.log("### ACTUALIZACIÓN");
                        console.log("#################");
                        oId = _oInsurance.oData.results[0].InsuranceIdMD
                        _oInsurance.setProperty("/results/0/id", oId);
                        oController.upsertInsurance(_oInsurance.oData.results[0], true)
                            .then(function(oResult) {
                                resolve(oResult);
                            }).catch(function(e) {
                                resolve(e);
                            });
                    } else {
                        console.log("\n");
                        console.log("#########");
                        console.log("### NUEVO");
                        console.log("#########");
                        var oIdentifierBase;
                        jQuery.sap.require("js.base.IdentifierBase");
                        oIdentifierBase = new sap.ui.mw.IdentifierBase();

                        if (!_oInsurance.oData.results[0].InsuranceIdMD) {
                            oId = oIdentifierBase.createId();
                            _oInsurance.setProperty("/results/0/InsuranceIdMD", oId);
                            _oInsurance.setProperty("/results/0/ElectronicSignatureSet/InsuranceIdMD", oId);
                            _oInsurance.setProperty("/results/0/id", oId);
                        } else {
                            oId = _oInsurance.oData.results[0].InsuranceIdMD
                            _oInsurance.setProperty("/results/0/ElectronicSignatureSet/InsuranceIdMD", oId);
                            _oInsurance.setProperty("/results/0/id", oId);
                            _oInsurance.refresh();
                        }

                        oController.upsertInsurance(_oInsurance.oData.results[0], false)
                            .then(function(oResult) {
                                resolve(oResult);
                            }).catch(function(e) {
                                resolve(e);
                            });
                    }
                }).catch(function(e) {
                    reject(e);
                });
        });
    };

    /**
     * [upsertInsurance description]
     * @param  {[type]} _oInsurance [description]
     * @param  {[type]} _update     [description]
     * @return {[type]}             [description]
     * author: israel
     */
    sap.ui.serialize.Insurance.prototype.upsertInsurance = function(_oInsurance, _update) {

        console.log(_oInsurance);
        var oController, oDictionary;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        return new Promise(function(resolve, reject) {
            try {
                if (_update) {
                    oController.dataDB.update(oDictionary.oTypes.Insurance, _oInsurance.id, _oInsurance)
                        .then(function(oResult) {
                            resolve(oResult);
                        }).catch(function(e) {
                            reject(e);
                        });
                } else {
                    oController.dataDB.post(oDictionary.oTypes.Insurance, _oInsurance)
                        .then(function(oResult) {
                            oController.LoanRequestInsuranceRelationship(oResult)
                                .then(function(oResultLinkInsurance) {
                                    resolve(oResult);
                                });
                        }).catch(function(e) {
                            reject(e);
                        });
                }
            } catch (e) {
                reject(e);
            }
        });
    };
    sap.ui.serialize.Insurance.prototype.LoanRequestInsuranceRelationship = function(_oResult) {
        var oController, oDictionary, oLoanRequestIdMD, oInsuranceIdMD, InsuranceSet, InsuranceList, oLinkInsurance;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        oLoanRequestIdMD = _oResult.InsuranceSet[0].LoanRequestIdMD === "" ? _oResult.InsuranceSet[0].LoanRequestIdCRM : _oResult.InsuranceSet[0].LoanRequestIdMD;
        oInsuranceIdMD = _oResult.InsuranceSet[0].InsuranceIdMD;
        InsuranceSet = [];
        InsuranceList = [];
        oLinkInsurance = {
            "id": oLoanRequestIdMD,
            "InsuranceSet": "",
        };

        return this.dataDB.getById(oDictionary.oTypes.LinkInsurance, oLoanRequestIdMD)
            .then(function(result) {
                if (result.LinkInsuranceSet) {
                    if (result.LinkInsuranceSet.length > 0) {
                        result.LinkInsuranceSet[0].InsuranceSet.push(oInsuranceIdMD);
                        oLinkInsurance = {
                            "id": oLoanRequestIdMD,
                            "InsuranceSet": result.LinkInsuranceSet[0].InsuranceSet
                        }
                        console.log(result.LinkInsuranceSet[0].InsuranceSet);
                        var oId = result.LinkInsuranceSet[0].id;

                        oController.dataDB.update(oDictionary.oTypes.LinkInsurance, oId, oLinkInsurance)
                            .then(function(oResult) {
                                return (oResult);
                            });
                    } else {
                        InsuranceList.push(oInsuranceIdMD);
                        oLinkInsurance = {
                            id: oLoanRequestIdMD,
                            InsuranceSet: InsuranceList,
                        }
                        oController.dataDB.post(oDictionary.oTypes.LinkInsurance, oLinkInsurance)
                            .then(function(oResult) {
                                return (oResult);
                            });
                    }
                }
            });
    };


    sap.ui.serialize.Insurance.prototype.searchInPouchDBToUpdate = function(_oInsuranceIdMD) {
        var oController, oIndexes, oFilters, oDataModel, oArrResult;
        oController = this;
        oDataModel = new sap.ui.model.json.JSONModel();
        oIndexes = ['data.InsuranceIdMD'];
        oFilters = {
            $and: [{
                '_id': { $eq: 'Insurance\uffff' }
            }, {
                'data.InsuranceIdMD': { $eq: _oInsuranceIdMD }
            }]
        };
        oArrResult = [];
        return new Promise(function(resolve, reject) {
            try {
                oController.dataDB.getByProperty(oIndexes, oFilters)
                    .then(function(oResult) {
                        if (oResult.docs.length > 0) {
                            console.log("#####################################");
                            console.log("## SI Existe en PDB:\n");
                            console.log("#####################################");
                            console.log(oResult.docs[0]);
                            oArrResult.push(oResult.docs[0]);
                            oArrResult.push(true);
                            resolve(oArrResult);
                        } else {
                            console.log("#####################################");
                            console.log("## NO Existe en PDB:\n");
                            console.log("#####################################");
                            console.log(oResult.docs[0]);
                            oArrResult.push(oResult.docs[0]);
                            oArrResult.push(false);
                            resolve(oArrResult);
                        }
                    }).catch(function(e) {
                        resolve(e);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * [deSerialize description]
     * @param  {[type]} _sIdMD           [description]
     * @param  {[type]} _bIncludeResults [description]
     * @return {[type]}                  [description]
     */
    sap.ui.serialize.Insurance.prototype.deSerialize = function(_sIdMD, _bIncludeResults) {
        console.log("#### Deserialize ####")
        var sId;
        var oDisplayBase, ObjectBase;
        var oDictionary = new sap.ui.helper.Dictionary();

        return this.dataDB.getById(oDictionary.oTypes.Insurance, _sIdMD)
            .then(function(result) {
                oDisplayBase = new sap.ui.mw.DisplayBase();
                ObjectBase = new sap.ui.mw.ObjectBase();
                var InsuranceModelData;
                var i;
                if (result.InsuranceSet) {
                    if (result.InsuranceSet.length > 0) {
                        for (i = 0; i < result.InsuranceSet.length; i++) {
                            ObjectBase.deletePropertyFromObject(result.InsuranceSet[i], "__metadata");
                            ObjectBase.deletePropertyFromObject(result.InsuranceSet[i], "id");
                            ObjectBase.deletePropertyFromObject(result.InsuranceSet[i], "rev");
                            ObjectBase.deletePropertyFromObject(result.InsuranceSet[i], "isEntityInQueue");
                            ObjectBase.deletePropertyFromObject(result.InsuranceSet[i], "ElectronicSignatureSet");

                            if (_bIncludeResults) {
                                result.InsuranceSet[i].InsuranceBeneficiarySet = result.InsuranceSet[i].InsuranceBeneficiarySet.results;
                                var numBeneficiaries = result.InsuranceSet[i].InsuranceBeneficiarySet.length;
                                for (var n = 0; n < numBeneficiaries; n++) {
                                    ObjectBase.deletePropertyFromObject(result.InsuranceSet[i].InsuranceBeneficiarySet[n], "__metadata");
                                    ObjectBase.deletePropertyFromObject(result.InsuranceSet[i].InsuranceBeneficiarySet[n].BeneficiaryName, "__metadata");

                                    //validaciones documentos
                                    if (result.InsuranceSet[i].InsuranceBeneficiarySet[n].ImageSet.results) {
                                        result.InsuranceSet[i].InsuranceBeneficiarySet[n].ImageSet = result.InsuranceSet[i].InsuranceBeneficiarySet[n].ImageSet.results;
                                        ObjectBase.deletePropertyFromObject(result.InsuranceSet[i].InsuranceBeneficiarySet[n].ImageSet, "__metadata");
                                    }

                                    //validacion fecha - BeneficiaryBirthday
                                    var date = result.InsuranceSet[i].InsuranceBeneficiarySet[n].BeneficiaryBirthday;
                                    if (date.indexOf("Z") > 0) {
                                        result.InsuranceSet[i].InsuranceBeneficiarySet[n].BeneficiaryBirthday = date.substring(0, 19);
                                    }

                                    result.InsuranceSet[i].InsuranceBeneficiarySet[n].InsuranceIdMD = result.InsuranceSet[i].InsuranceIdMD;
                                }
                            }

                        }
                        console.log("\n");
                        console.log("####################");
                        console.log(result.InsuranceSet[0]);
                        console.log("####################");
                        return result.InsuranceSet[0];
                    }
                }
            });
    };

    //Modelo CustomerSet con expand InsuranceSet
    sap.ui.serialize.Insurance.prototype.mergeModel = function(_oLoanRequestIdCRM, _oModel) {

        //InsuranceSet
        var oIndexes = ['data.loanRequestIdCRM'];
        var oFilters = {
            $and: [{
                '_id': { $eq: 'Insurance\uffff' }
            }, {
                'data.loanRequestIdCRM': { $eq: _oLoanRequestIdCRM }
            }]
        };

        return this.dataDB.getByProperty(oIndexes, oFilters)
            .then(function(response) {
                return (response);
            }).catch(function(e) {
                console.log(e);
            });
    };

    /**
     * [getInsuranceDetail - Busca el seguro en las fuentes de datos]
     * @param  {[type]} _oType [tipo de entidad - InsuranceSet]
     * @param  {[type]} _oArg  [parametros de busqueda - CustomerIdCRM / LoandRequestIdCRM]
     * @return {[type]}        [modelo de seguros con expands]
     */
    sap.ui.serialize.Insurance.prototype.getInsuranceDetail = function(_oType, _oArg) {
        var oController = this;
        return new Promise(function(resolve, reject) {
            try {
                oController.searchInPouchDB(_oArg)
                    .then(function(oResult) {
                        resolve(oResult);
                    }).catch(function(e) {
                        resolve(e);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };


    /**
     * [searchInPouchDB - Busca el seguro en PouchDB]
     * @param  {[type]} _oLoanRequestIdCRM [identificador CRM de la oportunidad]
     * @return {[type]}                    [description]
     */
    sap.ui.serialize.Insurance.prototype.searchInPouchDB = function(_oArg) {
        console.log("\n");
        console.log("## Buscando en PouchDB... ##");
        var oController, oIndexes, oFilters, oDataModel;
        oController = this;
        oDataModel = new sap.ui.model.json.JSONModel();
        oIndexes = ['data.CustomerIdCRM'];
        oFilters = {
            $and: [{
                '_id': { $eq: 'Insurance\uffff' }
            }, {
                'data.CustomerIdCRM': { $eq: _oArg.CustomerIdCRM }
            }]
        };
        return new Promise(function(resolve, reject) {
            try {
                oController.dataDB.getByProperty(oIndexes, oFilters)
                    .then(function(oResult) {
                        if (oResult.docs.length > 0) {
                            console.log("\n");
                            console.log("##################################");
                            console.log("### Seguros - SI Existe en PDB ###");
                            console.log("##################################");
                            var oModelPDB = {};
                            oModelPDB.results = [];
                            oModelPDB.results.push(oResult.docs[0].data);
                            oDataModel.setData(oModelPDB);
                            resolve(oDataModel);
                        } else {
                            console.log("\n");
                            console.log("##################################");
                            console.log("### Seguros - NO Existe en PDB ###");
                            console.log("##################################");
                            oController.searchInLocalStore(_oArg)
                                .then(function(oResult) {
                                    resolve(oResult);
                                });
                        }
                    }).catch(function(e) {
                        resolve("2 - Error: " + e);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };
    /**
     * [searchInLocalStore - Busca en LocalStore]
     * @param  {[type]} _oLoanRequestIdCRM [description]
     * @return {[type]}                    [description]
     */
    sap.ui.serialize.Insurance.prototype.searchInLocalStore = function(_oArg) {
        console.log("\n");
        console.log("###############################");
        console.log("## Buscando en LocalStore... ##");
        console.log("###############################");
        var oPromise, oFilter, oController, oDataModel, oDictionary;
        oController = this;
        oDataModel = new sap.ui.model.json.JSONModel();
        oDictionary = new sap.ui.helper.Dictionary();
        jQuery.sap.require("js.kapsel.Rest");

        return new Promise(function(resolve, reject) {
            try {
                //oPromise = sap.ui.getCore().AppContext.myRest.read("/InsuranceSet?$filter=CustomerIdCRM eq '" + _oArg.CustomerIdCRM + "'&$expand=InsuranceBeneficiarySet,ElectronicSignatureSet" + "", null, null, false);
                oFilter = "$filter=CustomerIdCRM eq '" + _oArg.CustomerIdCRM + "' and LoanRequestIdCRM eq '" + _oArg.LoanRequestIdCRM + "'";
                oPromise = sap.ui.getCore().AppContext.myRest.read("InsuranceSet?$expand=InsuranceBeneficiarySet,ElectronicSignatureSet", oFilter, true);
                oPromise
                    .then(function(oResult) {
                        if (oResult.results.length > 0) {
                            console.log("\n");
                            console.log("#########################################");
                            console.log("### Seguros - SI Existe en LocalStore ###");
                            console.log("#########################################");
                            console.log(oResult);
                            oController.searchBeneficiaries(oResult)
                                .then(function(_oResult) {
                                    oDataModel.setData(_oResult);
                                    resolve(oDataModel);
                                });
                            //oDataModel.setData(oResult);
                            //resolve(oDataModel);
                        } else {
                            console.log("\n");
                            console.log("#########################################");
                            console.log("### Seguros - NO Existe en LocalStore ###");
                            console.log("#########################################");
                            oController.insuranceNotFound()
                                .then(function(oResult) {
                                    resolve(oResult);
                                });
                        }
                    }).catch(function(e) {
                        resolve(e);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    sap.ui.serialize.Insurance.prototype.searchBeneficiaries = function(_oModel) {
        var oPromise, oFilter, oController, oDataModel, oDictionary;
        oController = this;
        oDataModel = new sap.ui.model.json.JSONModel();
        oDictionary = new sap.ui.helper.Dictionary();
        jQuery.sap.require("js.kapsel.Rest");
        return new Promise(function(resolve, reject) {
            oFilter = "$filter=LoanRequestIdCRM eq '" + _oModel.results[0].LoanRequestIdCRM + "' and CustomerIdCRM eq '" + _oModel.results[0].CustomerIdCRM + "'";
            //oPromise = sap.ui.getCore().AppContext.myRest.read("InsuranceBeneficiarySet", oFilter, true);
            oPromise = sap.ui.getCore().AppContext.myRest.read("InsuranceBeneficiarySet?$expand=ImageSet", oFilter, true);
            oPromise
                .then(function(oResult) {
                    _oModel.results[0].InsuranceBeneficiarySet = oResult;
                    resolve(_oModel);
                });
        });
    };


    /**
     * [insuranceNotFound - Se genera estructura en blanco del modelo de seguros cuando se carga por primera vez]
     * @return {[type]} [description]
     */
    sap.ui.serialize.Insurance.prototype.insuranceNotFound = function() {
        var oController, oInsuranceSet, oDataModel;
        oController = this;
        oInsuranceSet = {};
        oDataModel = new sap.ui.model.json.JSONModel();

        return new Promise(function(resolve, reject) {
            try {
                oInsuranceSet = {
                    "results": [{
                        "InsuranceIdCRM": "",
                        "CustomerIdCRM": "",
                        "LoanRequestIdCRM": "",
                        "CustomerIdMD": "",
                        "InsuranceOptional": false,
                        "StartDateTerm": "",
                        "InsuranceTerm": "",
                        "LoanRequestIdMD": "",
                        "InsuranceIdMD": "",
                        "CollaboratorID": "",
                        "InsurancePaymentID": "001", //Pago Diferido
                        "InsuranceModalityID": "001", //Modalidad Individual
                        "InsuranceBeneficiarySet": {},
                        "ElectronicSignatureSet": {
                            "ImageIdSharepoint": "",
                            "TypeOfSignature": "",
                            "ImageBase64": "",
                            "NameRAndE": "",
                            "LoanRequestIdCRM": "",
                            "CustomerIdCRM": "",
                            "CollaboratorID": "",
                            "CustomerIdMD": "",
                            "LoanRequestIdMD": "",
                            "InsuranceIdMD": "",
                            "InsuranceIdCRM": ""
                        }
                    }]
                };
                oDataModel.setData(oInsuranceSet);
                resolve(oDataModel);
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * [getCustomerDetail - Realiza consulta al LocalStore para traer la información de la Oportunidad y del Cliente]
     * @param  {[type]} _oType [tipo de entidad a consultar]
     * @param  {[type]} _oArg  [arreglo con los parámetros de busqueda - CustomerIdCRM y LoandRequestIdCRM]
     * @return {[type]}        [description]
     */
    sap.ui.serialize.Insurance.prototype.getCustomerDetail = function(_oType, _oArg) {
        var oPromise, oFilter, oController, oDataModel, oDictionary;
        oController = this;
        oDataModel = new sap.ui.model.json.JSONModel();
        oDictionary = new sap.ui.helper.Dictionary();
        jQuery.sap.require("js.kapsel.Rest");

        return new Promise(function(resolve, reject) {
            try {
                oFilter = "$filter=LoanRequestIdCRM eq '" + _oArg.LoanRequestIdCRM + "' and CustomerIdCRM eq '" + _oArg.CustomerIdCRM + "'";
                oPromise = sap.ui.getCore().AppContext.myRest.read("LinkSet?$expand=LoanRequest,Customer", oFilter, true);
                oPromise
                    .then(function(oResult) {
                        oDataModel.setData(oResult);
                        resolve(oDataModel);
                    }).catch(function(e) {
                        resolve(e);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * [getInsuranceSyncResult - Obtiene el detañe del seguro a partir del resultado de la sincronización]
     * @param  {[type]} _oId [Identificador del seguro para obtener LoanRequestIdCRM y CustomerIdCRM]
     * @return {[type]}      [description]
     */
    sap.ui.serialize.Insurance.prototype.getInsuranceSyncResult = function(_oId) {
        var oController, oDictionary
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();

        return this.dataDB.getById("InsuranceSet", _oId)
            .then(function(results) {
                return results;
            });
    };

})();
