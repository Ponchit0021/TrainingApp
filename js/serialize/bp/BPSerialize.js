(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.BP");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.base.DisplayBase");
    jQuery.sap.require("js.helper.Entity");
    jQuery.sap.require("js.serialize.GeneralSerialize");
    jQuery.sap.require("js.base.IdentifierBase");

    sap.ui.base.Object.extend('sap.ui.serialize.BP', {
        constructor: function(_dataDB, sEntity) {
            var oSchemaDB;

            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
            this.promoterID = "";
            this.sEntity = sEntity;
            this.sEntitySet = sEntity + "Set";
        }
    });
    sap.ui.serialize.BP.prototype.reviewNotifications = function(_aNotifications, _oModel, _router,_entityType) {

        if (_oModel.getProperty("/results").length === 0)
            if (_aNotifications[0]) {
                _router.navTo("announcementList", {
                    query: {
                        msg: "Datos bloqueados, acude a tu OS"
                    }
                }, false);
            }
            else{
                if(_aNotifications[1][0]){
                    _router.navTo("pendingList", {
                        query: {
                            msg: "Datos bloqueados, acude a tu OS"
                        }
                    }, false);


                }else{
                var nameRouter= _entityType==="CustomerSet" ? "applicantList" : "guarantorList";
               
                _router.navTo(nameRouter, {
                    query: {
                        msg: "Datos no encontrados.",
                        isError:1
                    }
                }, false);
                    
                }
            }


    }


    sap.ui.serialize.BP.prototype.getModelReviewed = function(_entityType, _id, _aNotifications, _router, _detailObject) {
        var oModel, oGeneralSerialize, _self;
        _self = this;
        oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(_detailObject);
        oGeneralSerialize = new sap.ui.serialize.General("dataDB");
        return new Promise(function(resolve, reject) {
            try {
                var oDisplayBase;
                oDisplayBase = new sap.ui.mw.DisplayBase();
                if (_id !== "0") {
                    _self.reviewNotifications(_aNotifications, oModel, _router,_entityType);
                    //UBG-Se agrega codigo para homologar catalogos de reason entre smp y crm
                    var reasonId=oModel.getProperty("/results/0/BpMainData/StatusReasonId");
                    if(reasonId!=null && reasonId.length>4){
                        oModel.setProperty("/results/0/BpMainData/StatusReasonId",reasonId.substring(reasonId.length - 4, reasonId.length));
                    }
                    ///************
                    oModel.setProperty("/results/0/BpBasicData/BirthdDate", oDisplayBase.retrieveJSONDate(oModel.getProperty("/results/0/BpBasicData/BirthdDate")));
                    oModel.setProperty("/results/0/BpMainData/RegistrationDate", oDisplayBase.retrieveJSONDate(oModel.getProperty("/results/0/BpMainData/RegistrationDate")));
                    oModel.setProperty("/results/0/BpMainData/ContactLaterDate", oDisplayBase.retrieveJSONDate(oModel.getProperty("/results/0/BpMainData/ContactLaterDate")));

                    resolve([oModel,false]);

                } else {
                    //var newId = Date.now();

                    oGeneralSerialize.getEmptyModel(_entityType).then(function(emptyModel) {
                        //En pruebas en el movil agregar el uuid
                        var oIdentifierBase = new sap.ui.mw.IdentifierBase();
                        emptyModel.setProperty("/results/0/CustomerIdMD", oIdentifierBase.createId())
                        resolve([emptyModel,true])
                    });

                }

            } catch (ex) {
                reject(ex)
            }
        });



    };
    /**
     * [setPromoterID SETTER para promoterID]
     * @param {[String]} _promoterID [setear el id del promotor actual]
     */
    sap.ui.serialize.BP.prototype.setPromoterID = function(_promoterID) {
        this.promoterID = _promoterID;
    };
    /**
     * [getPromoterID GETTER par promoterID]
     * @return {[String]} [ID del promotor actual]
     */
    sap.ui.serialize.BP.prototype.getPromoterID = function() {
        return this.promoterID;
    };
    /**
     * [getMainModel genera un modelo único de dos fuentes: pouchdb & odata]
     * @param  {[String]} _oType        [Colección deseada de tipo GET: CustomerSet, LoanRequest, etc.]
     * @return {[Promise]}  [Promise que contiene un Model obtenido del merge de dos fuentes]
     */
    sap.ui.serialize.BP.prototype.getMainModel = function(_oType, _sPromoterID) {
        var promiseOdata, promisePouch, oParams, oCustomerDictionary, oDictionary;
        var oFinalKapsel;
        var oFinalModel;



        return new Promise(function(resolve, reject) {
            try {

                /// Inicialización de arreglos de trabajo
                oFinalKapsel = {
                    results: []
                };
                /// Inicialización de arreglos de trabajo
                promisePouch = this.dataDB.get(this.sEntity);
                promiseOdata = sap.ui.getCore().AppContext.myRest.read("/" + this.sEntitySet, "$filter=CollaboratorID eq '" + _sPromoterID + "'&$expand=AddressSet,PersonalReferenceSet,PhoneSet,ImageSet,EmployerSet&$orderby=BpName/LastName", true);
                Promise.all([promisePouch, promiseOdata]).then(function(values) {


                    var aPouchIDs;
                    aPouchIDs = []; /// To compare if kapsel customer exists in Pouch


                    /// add results to Pouch data
                    if (values[0].hasOwnProperty(this.sEntitySet)) {
                        values[0][this.sEntitySet].forEach(

                            function(oPouchResult) {

                                aPouchIDs.push(oPouchResult.CustomerIdMD);

                                /*var oPhoneSetResults, oAddressSetResults, oPersonalReferenceSetResults, oEmployerSetResults;

                                oPhoneSetResults = { results: oPouchResult.PhoneSet };
                                oPouchResult.PhoneSet = oPhoneSetResults;

                                oAddressSetResults = { results: oPouchResult.AddressSet };
                                oPouchResult.AddressSet = oAddressSetResults;

                                oPersonalReferenceSetResults = { results: oPouchResult.PersonalReferenceSet };
                                oPouchResult.PersonalReferenceSet = oPersonalReferenceSetResults;

                                oEmployerSetResults = { results: oPouchResult.EmployerSet };
                                oPouchResult.EmployerSet = oEmployerSetResults; */

                            }
                        )

                    }


                    oFinalKapsel.results = values[1].results.filter(function(oKapselResult) {

                        if (aPouchIDs.indexOf(oKapselResult.CustomerIdMD) >= 0) { // Kapsel result is in Pouch too
                            return false;
                        }

                        return true;

                    });

                    oFinalModel = new sap.ui.model.json.JSONModel();
                    oFinalModel.setData({ results: _.sortBy(oFinalKapsel.results.concat(values[0][this.sEntitySet]), 'lastName') })

                    resolve(oFinalModel);

                }.bind(this));

            } catch (e) {
                reject(e);
            }

        }.bind(this));
    };



    sap.ui.serialize.BP.prototype.reviewMergedArray = function(_oMergedArray) {
        var counter, oCustomerLoanArray, _self;
        counter = 0;
        oCustomerLoanArray = [];
        _self = this;


        return new Promise(function(resolve, reject) {
            try {

                if (_oMergedArray.results.length > 0) {

                    _oMergedArray.results.forEach(function(entry) {


                        _self.verifyCustomerLoanRelationShip(entry.customerIdMD).then(function(msg) {
                            counter++;
                            console.log(msg);
                            if (msg.docs.length > 0) {
                                oCustomerLoanArray.push(entry);
                                console.log(oCustomerLoanArray);
                            }

                            if (_oMergedArray.results.length === counter) {
                                resolve(oCustomerLoanArray);

                            }


                        });





                    });

                } else {
                    resolve(oCustomerLoanArray);

                }

            } catch (ex) {
                console.log(ex);
                reject(ex);
            }






        });


    };
    /**
     * [getMainModelWithOutLoan Lista de solicitantes sin oportunidad asignada]
     * @param  {[String]} _oType       [description]
     * @param  {[String]} _oPromoterID [description]
     * @param  {[String]} _oProductID  [description]
     * @return {[Promise]}             [Promesa con el modelo combinado de las dos fuentes]
     */

    sap.ui.serialize.BP.prototype.getMainModelWithOutLoan = function(_oType, _sPromoterID, _sProductID) {
        var promiseOdata, promisePouch, oParams, oCustomerDictionary, oDictionary;
        var oFinalKapsel;
        var oFinalModel;
        var oFinalPouch;
        var sLinkEntity;
        var promisePouchLink;


        return new Promise(function(resolve, reject) {
            try {

                /// Inicialización de arreglos de trabajo
                oFinalKapsel = {
                    results: []
                };

                oFinalPouch = {
                    results: []
                };

                /// Inicialización de arreglos de trabajo
                promisePouch = this.dataDB.get(this.sEntity);

                if (this.sEntitySet == "CustomerSet") {
                    sLinkEntity = "LinkSet";
                } else {
                    sLinkEntity = "LinkGuarantorSet";
                }

                promiseOdata = sap.ui.getCore().AppContext.myRest.read("/" + this.sEntitySet, "$filter=CollaboratorID eq '" + _sPromoterID + "'&$expand=AddressSet,PersonalReferenceSet,PhoneSet,ImageSet,EmployerSet," + sLinkEntity, true);

                /// Recuperar tambien los links que viven en Pouch
                promisePouchLink = this.dataDB.get(sLinkEntity);

                Promise.all([promisePouch, promiseOdata, promisePouchLink]).then(function(sLinkEntity, values) {

                    var aPouchIDs, aPouchLinkIDs;
                    aPouchIDs = []; /// To compare if kapsel customer exists in Pouch
                    aPouchLinkIDs = [];

                    if (values[2].hasOwnProperty(sLinkEntity)) {
                        if (values[2][sLinkEntity].length > 0) {
                            values[2][sLinkEntity].forEach(function(aPouchLinkIDs, LinkEntity) {
                                /// Arreglo de ID's con Link
                                aPouchLinkIDs.push(LinkEntity.CustomerIdMD);

                            }.bind(this, aPouchLinkIDs));

                        }
                    }

                    /// add results to Pouch data
                    if (values[0].hasOwnProperty(this.sEntitySet)) {
                        oFinalPouch.results = values[0][this.sEntitySet].filter(

                            function(_sProductID, oPouchResult) {

                                if (!this.testIsBPAssociatedToLoan(oPouchResult, sLinkEntity, aPouchLinkIDs)) {

                                    if (oPouchResult.BpMainData.ProductId == _sProductID && oPouchResult.BpMainData.StatusId == "E0006") {
                                        aPouchIDs.push(oPouchResult.CustomerIdMD);


                                       // if (oPouchResult.hasOwnProperty("IsEntityInQueue")) {
                                         //   if (oPouchResult.IsEntityInQueue === true) {
                                                return true;
                                          //  }
                                        //}

                                    }
                                }



                                return false;

                            }.bind(this, _sProductID)
                        )

                    }
                    oFinalKapsel.results = values[1].results.filter(function(_sProductID, oKapselResult) {

                        if (aPouchIDs.indexOf(oKapselResult.CustomerIdMD) >= 0) { // Kapsel result is in Pouch too
                            return false;
                        }

                        if (this.testIsBPAssociatedToLoan(oKapselResult, sLinkEntity, aPouchLinkIDs)) {
                            return false;
                        }

                        if (!(oKapselResult.BpMainData.ProductId == _sProductID && oKapselResult.BpMainData.StatusId == "E0006")) {
                            return false;
                        }

                        return true;

                    }.bind(this, _sProductID));

                    oFinalModel = new sap.ui.model.json.JSONModel();
                    oFinalModel.setData({ results: _.sortBy(oFinalKapsel.results.concat(oFinalPouch.results), 

                        function(oBP){

                            return oBP.BpName.LastName;
                        }

                    ) });

                    resolve(oFinalModel);

                }.bind(this, sLinkEntity));

            } catch (e) {
                reject(e);
            }

        }.bind(this));
    };


    sap.ui.serialize.BP.prototype.testIsBPAssociatedToLoan = function(_oBPResult, sLinkEntity, aPouchLinkIDs) {

        /// *** Test contra link de LocalStore
        if (_oBPResult.hasOwnProperty(sLinkEntity)) {
            if (_oBPResult.LinkSet.hasOwnProperty("results")) {
                if (_oBPResult.LinkSet.results.length > 0) {
                    /// Esta asociado a una oportunidad
                    return true;

                }
            }

        }

        /// *** Test contra link de Pouch

        if (aPouchLinkIDs.indexOf(_oBPResult.CustomerIdMD) >= 0) {
            return true;
        }

        /*if (_oBPResult.hasOwnProperty("LinkGuarantorSet")) {
            if (_oBPResult.LinkGuarantorSet.hasOwnProperty("results")) {
                if (_oBPResult.LinkGuarantorSet.results.length > 0) {
                    /// Esta asociado a una oportunidad
                    return true;

                }
            }

        }*/





        return false;

    };

    /**
     * [serialize Función que serializa un customer en json a formato pouchdb]
     * @param  {[JSON]} _oCustomer [Solicitante en formato json]
     * @return {[NA]}            [NA]
     */
    sap.ui.serialize.BP.prototype.serialize = function(_oBP) {

        return new Promise(function(resolve, reject) {
            var oDictionary, oDisplayBase, oCurrentBP;

            oCurrentBP = jQuery.extend(true, {}, _oBP);
            oDictionary = new sap.ui.helper.Dictionary();
            oDisplayBase = new sap.ui.mw.DisplayBase();
            oCurrentBP.id = oCurrentBP.CustomerIdMD;
            //oCurrentBP.birthdate = oDisplayBase.formatJSONDate(oCurrentBP.birthdate);

            oCurrentBP.BpBasicData.BirthdDate = oDisplayBase.formatJSONDate(oCurrentBP.BpBasicData.BirthdDate);
            oCurrentBP.BpMainData.RegistrationDate = oDisplayBase.formatJSONDate(oCurrentBP.BpMainData.RegistrationDate);
            oCurrentBP.BpMainData.ContactLaterDate = oDisplayBase.formatJSONDate(oCurrentBP.BpMainData.ContactLaterDate);
            oCurrentBP.CollaboratorID = sap.ui.getCore().AppContext.Promotor;
            delete oCurrentBP.BpBasicData.DescEconomicActivity;
            delete oCurrentBP.BpBasicData.DescGiro;
            delete oCurrentBP.BpBasicData.DescIndustry;

            //Siempre se envia un role de tipo prospecto
            //oCurrentBP.BpMainData.RoleId="ZFS003";

            this.dataDB.getById(this.sEntity, oCurrentBP.id)
                .then(this.upsertBP(oCurrentBP)).then(function(msg) {
                    resolve("OK")
                })
                .catch(function(error) {
                    reject(error);
                });

        }.bind(this));


    };
    /**
     * [upsertBP Validación del solicitante en serialize, si existe lo actualiza, si no lo inserta]
     * @param  {[JSON]} _oCustomer  [Solicitante en formato json]
     * @return {[NA]}               [NA]
     */
    sap.ui.serialize.BP.prototype.upsertBP = function(_BP) {
        console.log(_BP);
        var oDictionary = new sap.ui.helper.Dictionary();
        return function(_BPResult) {
            delete _BP["LinkGuarantorSet"];
            delete _BP["LinkSet"];
            //Valida si ya existe el customer
            if (_BPResult[this.sEntitySet].length === 0) {
                //No existe el customer

                this.dataDB.post(this.sEntity, _BP)
                    .then(function(msg) {
                        console.log(msg);
                    }).catch(function(error) {
                        console.log(error);

                    });

            } else {

                ////// Si ya existia el registro asegurarse de eliminar el atributo bRegisterComesFromLoanRequest
                ///bRegisterComesFromLoanRequest

                delete _BP["bRegisterComesFromLoanRequest"];

                this.dataDB.update(this.sEntity, _BPResult[this.sEntitySet][0].id, _BP).then(function(msg) {
                        console.log(msg);
                    })
                    .catch(function(error) {
                        console.log(error);
                    });

            }


        }.bind(this);

    };
    /**
     * [updateFlagEntitityInQueue Actualización del campo IsEntityInQueue a true en algún Customer]
     * @param  {[JSON]} _sBPId    [Solicitante en formato json]
     * @return {[NA]}                   [NA]
     */
    sap.ui.serialize.BP.prototype.updateFlagEntitityInQueue = function(_sBPId, _bValue) {
        return new Promise(function(resolve, reject) {
            var oDictionary = new sap.ui.helper.Dictionary();

            this.dataDB.getById(this.sEntity, _sBPId)
                .then(
                    function(result) {
                        if (result[this.sEntitySet]) {
                            if (result[this.sEntitySet].length > 0) {
                                result[this.sEntitySet][0].IsEntityInQueue = _bValue;

                                this.dataDB.update(this.sEntity, result[this.sEntitySet][0].id, result[this.sEntitySet][0]).then(function(msg) {
                                        console.log(msg);
                                        resolve("OK");
                                    })
                                    .catch(function(error) {
                                        console.log(error);
                                        resolve("Error en updateFlagEntitityInQueue: " + error);
                                    });
                            }
                        }

                    }.bind(this)
                ).catch(
                    function(error) {
                        console.log("Error al consultar la solicitud para hacer update de IsEntityInQueue:" + error);

                    }
                );


        }.bind(this));
    };


    sap.ui.serialize.BP.prototype.trimResults = function(_oObject, _sProperty) {

        if (_oObject.hasOwnProperty(_sProperty)) {
            if (_oObject[_sProperty].hasOwnProperty("results")) {

                _oObject[_sProperty] = _oObject[_sProperty].results;

            }
        }

    };

    sap.ui.serialize.BP.prototype.unTrimResults = function(_oObject, _sProperty) {

        if (_oObject.hasOwnProperty(_sProperty) && _oObject[_sProperty] instanceof Array) {
            var oTmp = {};
            oTmp.results = [];
            oTmp.results = _oObject[_sProperty];
            _oObject[_sProperty] = oTmp;
        }

    };

    sap.ui.serialize.BP.prototype.deSerialize = function(_sIdMD, _bIncludeResults, _bPrepareServiceCall) {
        var sId;
        var oDisplayBase;

        /////::: El tipo de datos Customer deberia venir del diccionario
        var oDictionary = new sap.ui.helper.Dictionary();


        return this.dataDB.getById(this.sEntity, _sIdMD)
            .then(function(result) {

                var oDisplayBase = new sap.ui.mw.DisplayBase();
                var CustomerModelData = {};
                var i;

                if (result[this.sEntitySet]) {

                    if (result[this.sEntitySet].length > 0) {
                        //elimina identificador y revisión
                        result[this.sEntitySet].forEach(function(oResult) {

                            delete oResult['id'];
                            delete oResult['rev'];
                            delete oResult['rev'];
                            delete oResult["__metadata"];

                            if (oResult.hasOwnProperty("BpName")) {
                                delete oResult.BpName["__metadata"];
                            }

                            if (oResult.hasOwnProperty("BpMainData")) {
                                delete oResult.BpMainData["__metadata"];
                            }

                            if (oResult.hasOwnProperty("BpComplementaryData")) {
                                delete oResult.BpComplementaryData["__metadata"];
                            }

                            if (oResult.hasOwnProperty("BpBasicData")) {
                                delete oResult.BpBasicData["__metadata"];
                            }

                            if (oResult.hasOwnProperty("BpAdditionalData")) {
                                delete oResult.BpAdditionalData["__metadata"];

                                if (oResult.BpAdditionalData.hasOwnProperty("Spouse")) {
                                    delete oResult.BpAdditionalData.Spouse["__metadata"];

                                    if (oResult.BpAdditionalData.Spouse.hasOwnProperty("BpNameData")) {
                                        delete oResult.BpAdditionalData.Spouse.BpNameData["__metadata"];
                                    }
                                }

                            }

                            if (oResult.hasOwnProperty("BpFlag")) {
                                delete oResult.BpFlag["__metadata"];
                            }

                            oResult.BpBasicData.BirthdDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(oResult.BpBasicData.BirthdDate));
                            oResult.BpMainData.RegistrationDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(oResult.BpMainData.RegistrationDate));
                            oResult.BpMainData.ContactLaterDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(oResult.BpMainData.ContactLaterDate));

                            if (!_bIncludeResults) {

                                if (oResult.hasOwnProperty("EmployerSet")) {
                                    if (oResult.EmployerSet.hasOwnProperty("__deferred")) {
                                        delete oResult["EmployerSet"];
                                    } else {
                                        this.trimResults(oResult, "EmployerSet");
                                        oResult.EmployerSet.forEach(function(oEmployer) {
                                            
                                            if( oEmployer.hasOwnProperty("Name") ){
                                                delete oEmployer.Name["__metadata"];
                                            }

                                            if( oEmployer.hasOwnProperty("Place") ){
                                                delete oEmployer.Place["__metadata"];
                                            }
                                            delete oEmployer["__metadata"];
                                        });
                                    }
                                }


                                if (oResult.hasOwnProperty("ImageSet")) {
                                    if (oResult.ImageSet.hasOwnProperty("__deferred")) {
                                        delete oResult["ImageSet"];
                                    } else {
                                        this.trimResults(oResult, "ImageSet");
                                        oResult.ImageSet.forEach(function(oImage) {
                                            delete oImage["DueDate"];
                                            delete oImage["__metadata"];
                                        });
                                    }
                                }

                                /*if (oResult.hasOwnProperty("EmployerSet")) {
                                    if (oResult.EmployerSet.hasOwnProperty("__deferred")) {
                                        delete oResult["EmployerSet"];
                                    } else {
                                        this.trimResults(oResult, "EmployerSet");
                                        oResult.EmployerSet.forEach(function(oEmployer) {
                                            delete oEmployer["__metadata"];
                                        });
                                    }
                                }*/

                                if (oResult.hasOwnProperty("PersonalReferenceSet")) {
                                    if (oResult.PersonalReferenceSet.hasOwnProperty("__deferred")) {
                                        delete oResult["PersonalReferenceSet"];
                                    } else {
                                        this.trimResults(oResult, "PersonalReferenceSet");
                                        oResult.PersonalReferenceSet.forEach(function(oPersonalReference) {
                                            delete oPersonalReference["__metadata"];

                                            if (oPersonalReference.hasOwnProperty("Name")) {
                                                delete oPersonalReference.Name["__metadata"];
                                            }
                                        });
                                    }
                                }

                                if (oResult.hasOwnProperty("PhoneSet")) {
                                    if (oResult.PhoneSet.hasOwnProperty("__deferred")) {
                                        delete oResult["PhoneSet"];
                                    } else {
                                        this.trimResults(oResult, "PhoneSet");
                                        oResult.PhoneSet.forEach(function(oPhone) {
                                            delete oPhone["__metadata"];
                                        });
                                    }
                                }

                                if (oResult.hasOwnProperty("AddressSet")) {
                                    if (oResult.AddressSet.hasOwnProperty("__deferred")) {
                                        delete oResult["AddressSet"];
                                    } else {
                                        this.trimResults(oResult, "AddressSet");
                                        oResult.AddressSet.forEach(function(oAddress) {
                                            delete oAddress["__metadata"];
                                            delete oAddress["Path"];
                                            if (oAddress.hasOwnProperty("Place")) {
                                                delete oAddress.Place["__metadata"];
                                            }
                                        });
                                    }
                                }

                                if (oResult.hasOwnProperty("LinkPreloanRequest")) {
                                    delete oResult["LinkPreloanRequest"];
                                    /*if (oResult.LinkPreloanRequest.hasOwnProperty("__deferred")) {
                                        delete oResult["LinkPreloanRequest"];
                                    } else {
                                        this.trimResults(oResult, "LinkPreloanRequest");
                                        oResult.LinkPreloanRequest.forEach(function(oLinkPreloanRequest) {
                                            delete oLinkPreloanRequest["__metadata"];
                                        });
                                    }*/
                                }

                            }

                            if (oResult.hasOwnProperty("isApplicantPouch")) {
                                delete oResult["isApplicantPouch"];
                            }

                            /// Borrar expands que no son utiles para la sincronización
                            if (_bPrepareServiceCall) {

                                delete oResult["LinkPreloanRequestSet"];
                                delete oResult["LinkSet"];
                                delete oResult["InsuranceSet"];
                                delete oResult["LinkGuarantorSet"];


                            }

                            //// Delete expands not useful



                        }.bind(this));



                        console.log(result[this.sEntitySet][0]);
                        return result[this.sEntitySet][0];
                    }

                }

            }.bind(this));


    };


 sap.ui.serialize.BP.prototype.deleteBPOpportunityOnly = function(sBPIdDM) {


        return new Promise(function(resolve) {

            this.dataDB.getById(this.sEntity, sBPIdDM)
                .then(function(resolve, result) {

                    if (result.hasOwnProperty(this.sEntitySet)) {

                        if (result[this.sEntitySet].length > 0) {

                            if(result[this.sEntitySet][0].bRegisterComesFromLoanRequest){

                                this.dataDB.delete(this.sEntity, result[this.sEntitySet][0].id, result[this.sEntitySet][0].rev)
                                .then(resolve("OK"));
                                
                            }else{
                                resolve("OK");
                            }


                            
                            
                        }else{
                            resolve("OK");
                        }

                    }else{
                        resolve("OK");
                    }

                }.bind(this, resolve));

        }.bind(this));

    };

    /**
     * [getSupplierBp obtiene verdadero si el bp viene del servicio, falso si solo a sido guardado en pouch]
     * @param  {[type]} _entity [description]
     * @param  {[type]} _id     [description]
     * @return {[type]}         [description]
     */
    sap.ui.serialize.BP.prototype.getSupplierBp = function(_entity, _id) {

        return new Promise(function(resolve, reject) {
            try {
                this.dataDB.getById(_entity.pouch.entityName, _id).then(function(_entity, _id, resp) {
                    if (resp.hasOwnProperty(_entity.pouch.entitySet)) {
                        if (resp[_entity.pouch.entitySet].length > 0) {
                                resolve(false);
                        }
                    }

                    sap.ui.getCore().AppContext.myRest.read(_entity.odata.name, _entity.odata.get.filterDetail, true).then(function(oModel) {
                        if (oModel.results.length > 0) {
                            resolve(true);
                        }else{
                            resolve(false);
                        }
                    });

                }.bind(this, _entity, _id));
            } catch (e) {
                reject(e);
            }
        }.bind(this));
    };
    
})();
