(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.LoanRequest");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");



    sap.ui.base.Object.extend('sap.ui.serialize.LoanRequest', {
        constructor: function(_dataDB) {


            var oSchemaDB;

            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            jQuery.sap.require("js.base.DisplayBase");
            jQuery.sap.require("js.base.ObjectBase");

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);

            /////////// ::: Estos datos deberian venir del diccionario

            this.dataDB.setSchema(oSchemaDB.getDataDBSchema()); /// ::: Set schema de Pouch deberia aceptar parametro


        }
    });


    sap.ui.serialize.LoanRequest.prototype.trimResults = function(_oObject, _sProperty) {

        if (_oObject.hasOwnProperty(_sProperty)) {
            if (_oObject[_sProperty].hasOwnProperty("results")) {

                _oObject[_sProperty] = _oObject[_sProperty].results;

            }
        }

    };

    sap.ui.serialize.LoanRequest.prototype.unTrimResults = function(_oObject, _sProperty) {

        if (_oObject.hasOwnProperty(_sProperty) && _oObject[_sProperty] instanceof Array) {
            var oTmp = {};
            oTmp.results = [];
            oTmp.results = _oObject[_sProperty];
            _oObject[_sProperty] = oTmp;
        }

    };

    sap.ui.serialize.LoanRequest.prototype.relateLoanToLinksAndCustomers = function(_oLoanRequest, _oPouchArray, _oDataCustomerArray) {
        var bCustomersExpanded = false;
        var oDisplayBase = new sap.ui.mw.DisplayBase();

        _oLoanRequest.GeneralLoanRequestData.StartDate = oDisplayBase.retrieveJSONDate(_oLoanRequest.GeneralLoanRequestData.StartDate);
        _oLoanRequest.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.retrieveJSONDate(_oLoanRequest.GeneralLoanRequestData.FirstPaymentDate);
        _oLoanRequest.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.retrieveJSONDate(_oLoanRequest.GeneralLoanRequestData.ExpenditureDate);
        if (_oLoanRequest.hasOwnProperty("LinkSet")) {
            var currArray = [];
            _oLoanRequest.LinkSet.forEach(function(_oLoanRequestoCust) {
                if (_oPouchArray.hasOwnProperty("LinkSet")) {
                    var currentArrayLength = currArray.length;

                    _oPouchArray.LinkSet.some(function(oLink) {
                        if (_oLoanRequestoCust === oLink.id) {
                            /// Customers como array de strings en Link:
                            if (_oPouchArray.hasOwnProperty("CustomerSet")) {
                                _oPouchArray.CustomerSet.some(function(oCustomer) {
                                    bCustomersExpanded = true;
                                    if (oLink.CustomerSet[0] == oCustomer.id) {
                                        oCustomer.BpMainData.RegistrationDate = oDisplayBase.retrieveJSONDate(oCustomer.BpMainData.RegistrationDate);
                                        oCustomer.BpBasicData.BirthdDate = oDisplayBase.retrieveJSONDate(oCustomer.BpBasicData.BirthdDate);
                                        oLink.Customer = oCustomer;
                                        currArray.push(oLink);
                                        return true;
                                    } else {
                                        return false;
                                    }
                                });
                            }

                            if (!bCustomersExpanded) {
                                if (oLink.hasOwnProperty("Customer")) {
                                    currArray.push(oLink);
                                }
                            }
                            return true;
                        } else {
                            return false;
                        }
                    });

                    ///TODO: !!!!!!!!!! Revisar>>>> No se encontro en Pouch, buscar el Customer en Kapsel 
                    if (currentArrayLength === currArray.length) {
                        _oDataCustomerArray.results.some(function(oLocalStoreCustomer) {

                            if (_oLoanRequestoCust === oLocalStoreCustomer.id) {
                                oLocalStoreCustomer.birthdate = oDisplayBase.retrieveJSONDate(oLocalStoreCustomer.birthdate);
                                oLocalStoreCustomer.registrationDate = oDisplayBase.retrieveJSONDate(oLocalStoreCustomer.registrationDate);
                                currArray.push(oLocalStoreCustomer);
                                return true;
                            } else {
                                return false;
                            }
                        });
                    }
                }
            });

            _oLoanRequest.LinkSet = {};
            _oLoanRequest.LinkSet.results = currArray;
        }
    };

    sap.ui.serialize.LoanRequest.prototype.relateLoanToLinkGuarantorsAndGuarantors = function(_oLoanRequest, _oPouchArray) {
        if (_oLoanRequest.hasOwnProperty("LinkGuarantorSet")) {
            if (_oPouchArray.LinkGuarantorSet && _oPouchArray.LinkGuarantorSet.length > 0) {
                var currentClass = this;
                _oLoanRequest.LinkGuarantorSet = {};
                _oLoanRequest.LinkGuarantorSet.results = [];
                _oPouchArray.LinkGuarantorSet.some(
                    function(_oPouchArray, _oLoanRequestoLinkGuar) {
                        if (_oLoanRequestoLinkGuar.LoanRequestIdMD === _oLoanRequest.LoanRequestIdMD) {


                            /// Relate Guarantor to its LoanRequest

                            if (_oPouchArray.hasOwnProperty("GuarantorSet")) {
                                if (_oPouchArray.GuarantorSet.length > 0) {
                                    _oPouchArray.GuarantorSet.some(function(oGuarantor) {

                                        if (oGuarantor.CustomerIdMD === _oLoanRequestoLinkGuar.Guarantor) {
                                            _oLoanRequestoLinkGuar.Guarantor = oGuarantor;
                                            return true;
                                        } else {
                                            return false;
                                        }

                                    });
                                }

                            }


                            _oLoanRequest.LinkGuarantorSet.results.push(_oLoanRequestoLinkGuar);
                            currentClass.unTrimResults(_oLoanRequest.LinkGuarantorSet.results[0].Guarantor, "AddressSet");
                            currentClass.unTrimResults(_oLoanRequest.LinkGuarantorSet.results[0].Guarantor, "PersonalReferenceSet");
                            currentClass.unTrimResults(_oLoanRequest.LinkGuarantorSet.results[0].Guarantor, "PhoneSet");
                            currentClass.unTrimResults(_oLoanRequest.LinkGuarantorSet.results[0].Guarantor, "ImageSet");
                            currentClass.unTrimResults(_oLoanRequest.LinkGuarantorSet.results[0].Guarantor, "EmployerSet");
                            return true;
                        } else {
                            return false;
                        }
                    }.bind(this, _oPouchArray)
                );
            }
        }
    };

    sap.ui.serialize.LoanRequest.prototype.upsertGuarantor = function(oGuarantor) {

        var oDictionary;
        var oObjectBase;
        oDictionary = new sap.ui.helper.Dictionary();

        oObjectBase = new sap.ui.mw.ObjectBase();
        //// Verificar si existe Guarantor
        return new Promise(function(resolve) {


            this.dataDB.getById(oDictionary.oTypes.Guarantor, oGuarantor.CustomerIdMD).then(

                function(oGuarantor, result) {

                    if (result.hasOwnProperty("GuarantorSet")) {
                        if (result.GuarantorSet.length > 0) { // Ya existe Guarantor, por ahora, no hacer update
                            resolve("Customer existente");
                            return;
                            /// Para hacer update quitar el siguiente comentario y comentar la linea de Resolve:
                            /// oGuarantor.rev = result.GuarantorSet[0].rev;
                        }


                        /// No existe Guarantor, insertar en PouchDB



                        oObjectBase.deletePropertyFromObject(oGuarantor, "LinkGuarantorSet");

                        oGuarantor.bRegisterComesFromLoanRequest = true;

                        oGuarantor.id = oGuarantor.CustomerIdMD;

                        this.dataDB.post(oDictionary.oTypes.Guarantor, oGuarantor).then(function(data) {
                            resolve("Guarantor insertado");
                        });



                    }

                }.bind(this, oGuarantor));

        }.bind(this));


    };


    sap.ui.serialize.LoanRequest.prototype.upsertCustomer = function(_oCustomer) {

        var oDictionary;
        var oObjectBase;
        oDictionary = new sap.ui.helper.Dictionary();

        oObjectBase = new sap.ui.mw.ObjectBase();
        //// Verificar si existe Customer
        return new Promise(function(resolve) {


            this.dataDB.getById(oDictionary.oTypes.Customer, _oCustomer.CustomerIdMD).then(

                function(_oCustomer, result) {

                    if (result.hasOwnProperty("CustomerSet")) {
                        if (result.CustomerSet.length > 0) { // Ya existe Customer, por ahora, no hacer update
                            resolve("Customer existente");
                            return;
                            /// Para hacer update quitar el siguiente comentario y comentar la linea de Resolve:
                            /// _oCustomer.rev = result.CustomerSet[0].rev;
                        }


                        /// No existe Customer, insertar en PouchDB


                        oObjectBase.deletePropertyFromObject(_oCustomer, "LinkSet");

                        _oCustomer.bRegisterComesFromLoanRequest = true;
                        _oCustomer.id = _oCustomer.CustomerIdMD;

                        this.dataDB.post(oDictionary.oTypes.Customer, _oCustomer).then(function(data) {
                            resolve("Customer insertado");
                        });



                    }

                }.bind(this, _oCustomer));

        }.bind(this));


    };


    sap.ui.serialize.LoanRequest.prototype.upsertLoan = function(_oLoan) {

        var oDictionary;
        oDictionary = new sap.ui.helper.Dictionary();

        //// Verificar si existe Customer
        return new Promise(function(resolve) {

            this.dataDB.getById(oDictionary.oTypes.LoanRequest, _oLoan.id).then(

                function(_oLoan, oDictionary, result) {

                    if (result.hasOwnProperty(oDictionary.oCollections.LoanRequestSet)) {

                        if (result.LoanRequestSet.length > 0) { // Ya existe Customer, por ahora, no hacer update
                            _oLoan.rev = result.LoanRequestSet[0].rev;
                        }

                        /// Insertar en PouchDB
                        this.dataDB.post(oDictionary.oTypes.LoanRequest, _oLoan).then(function(data) {
                            resolve(oDictionary.oResults.OK);
                        });

                    }

                }.bind(this, _oLoan, oDictionary));

        }.bind(this));


    };



    sap.ui.serialize.LoanRequest.prototype.upsertLinkGuarantor = function(_oLinkGuarantor) {

        var oDictionary;
        oDictionary = new sap.ui.helper.Dictionary();

        return new Promise(function(resolve) {

            this.dataDB.getById(oDictionary.oTypes.LinkGuarantor, this.getLinkPouchDBId(_oLinkGuarantor))
                .then(function(result) {


                    var promiseOdata;
                    var oParams;
                    var oLinkDictionary;
                    var bUpdateSent;

                    if (result.LinkGuarantorSet.length > 0) { /// link existe en PouchDB
                        /// Guardar Link
                        _oLinkGuarantor.rev = result.LinkGuarantorSet[0].rev;
                    }

                    _oLinkGuarantor.id = this.getLinkPouchDBIdGuarantor(_oLinkGuarantor);
                    _oLinkGuarantor.Guarantor = _oLinkGuarantor.CustomerIdMD;
                    _oLinkGuarantor.GuarantorSet = [_oLinkGuarantor.CustomerIdMD];

                    //// Guardar Link (Actualización o inserción)
                    this.dataDB.post(oDictionary.oTypes.LinkGuarantor, _oLinkGuarantor).then(function(data) {
                        // Alles Klar
                        resolve(oDictionary.oResults.OK)
                    }.bind(this))

                }.bind(this));

        }.bind(this));


    };


    sap.ui.serialize.LoanRequest.prototype.deleteLinkSet = function(_oLink) {

        var oDictionary;
        oDictionary = new sap.ui.helper.Dictionary();

        return new Promise(function(resolve) {

            this.dataDB.getById(oDictionary.oTypes.Link, this.getLinkPouchDBId(_oLink))
                .then(function(result) {


                    var promiseOdata;
                    var oParams;
                    var oLinkDictionary;
                    var bUpdateSent;



                    //// Guardar Link (Actualización o inserción)
                    this.dataDB.delete(oDictionary.oTypes.Link, result.LinkSet[0].id, result.LinkSet[0].rev).then(function(data) {
                        // Alles Klar
                        resolve(oDictionary.oResults.OK)
                    }.bind(this))

                }.bind(this));

        }.bind(this));


    };



    sap.ui.serialize.LoanRequest.prototype.upsertLink = function(_oLink) {

        var oDictionary;
        oDictionary = new sap.ui.helper.Dictionary();

        return new Promise(function(resolve) {

            this.dataDB.getById(oDictionary.oTypes.Link, this.getLinkPouchDBId(_oLink))
                .then(function(result) {


                    var promiseOdata;
                    var oParams;
                    var oLinkDictionary;
                    var bUpdateSent;

                    if (result.LinkSet.length > 0) { /// link existe en PouchDB
                        /// Guardar Link
                        _oLink.rev = result.LinkSet[0].rev;
                    }

                    _oLink.id = this.getLinkPouchDBId(_oLink);

                    if (_oLink.hasOwnProperty("Customer")) {
                        if (_oLink.Customer.hasOwnProperty("CustomerIdMD")) {
                            _oLink.CustomerSet = [_oLink.Customer.CustomerIdMD];
                            _oLink.Customer = _oLink.Customer.CustomerIdMD;
                        }
                    }

                    //// Guardar Link (Actualización o inserción)
                    this.dataDB.post(oDictionary.oTypes.Link, _oLink).then(function(data) {
                        // Alles Klar
                        resolve(oDictionary.oResults.OK)
                    }.bind(this))

                }.bind(this));

        }.bind(this));


    };

    /**
     * [updateFlagEntitityInQueue :: Update value for IsEntityInQueue which will block ]
     *
     * @param  {[type]} _sLanRequestIdMD [description]
     * @param  {[type]} _bValue          [description]
     * @return {[type]}                  [description]
     */
    sap.ui.serialize.LoanRequest.prototype.updateFlagEntitityInQueue = function(_sLanRequestIdMD, _bValue) {

        return new Promise(function(resolve, reject) {

            var oDictionary = new sap.ui.helper.Dictionary();

            this.dataDB.getById(oDictionary.oTypes.LoanRequest, _sLanRequestIdMD)
                .then(
                    function(_bValue, results) {

                        ////////// Si encuentra el registro, actualizar, de lo contrario insertar
                        if (results.LoanRequestSet) {
                            if (results.LoanRequestSet.length > 0) { /// registro encontrado, actualizar


                                results.LoanRequestSet[0].IsEntityInQueue = _bValue;

                                this.dataDB.post(oDictionary.oTypes.LoanRequest, results.LoanRequestSet[0]).then(function(result) {

                                    resolve("OK");

                                }).catch(function(error) {
                                    console.log("Error al insertar la solicitud:" + error)
                                    resolve("Error " + error);
                                });



                            }
                        }

                    }.bind(this, _bValue)
                )
                .catch(
                    function(error) {
                        console.log("Error al consultar la solicitud para hacer update de IsEntityInQueue:" + error)
                        resolve("Error" + error);

                    }
                );

        }.bind(this));


    };

    sap.ui.serialize.LoanRequest.prototype.getLinkPouchDBId = function(oLink) {

        return oLink.CustomerIdMD + "_" + oLink.LoanRequestIdMD;
    };

    sap.ui.serialize.LoanRequest.prototype.getLinkPouchDBIdGuarantor = function(oLink) {

        return oLink.CustomerIdMD + "_" + oLink.LoanRequestIdMD;
    };


    sap.ui.serialize.LoanRequest.prototype.serialize = function(_oData) {

        jQuery.sap.require("js.helper.Dictionary");

        return new Promise(function(resolve, reject) {

            var sId;
            var aPropertyEntitySets, i, aLinkIDs, aLinkGuarantorIDs;
            var oDictionary;

            aPropertyEntitySets = [];
            aLinkIDs = [];
            aLinkGuarantorIDs = [];
            oDictionary = new sap.ui.helper.Dictionary();

            var _oDataWork = jQuery.extend(true, {}, _oData);

            if (_oDataWork.hasOwnProperty("LinkSet")) {
                //::: Código para LinkSet
                if (_oDataWork.LinkSet.forEach) {
                    _oDataWork.LinkSet.forEach(function(oLinkItem) {
                        /// Insertar customer si no existe en Pouch (Viene de Kapsel)
                        this.upsertCustomer(oLinkItem.Customer).then(
                            //// Insertar Links
                            this.upsertLink(oLinkItem)
                        ).catch(function(error) {
                            console.log("Error al insertar la Links y Customers en PouchDB: " + error);
                            reject(error);
                        });
                        aLinkIDs.push(this.getLinkPouchDBId(oLinkItem));
                    }.bind(this));

                }


                /// Cambiar expand de Customers por arreglo de Id's
                _oDataWork.LinkSet = aLinkIDs;

            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            //::: Código para LinkGuarantorSet


            if (_oDataWork.hasOwnProperty("LinkGuarantorSet")) {
                if (_oDataWork.LinkGuarantorSet.forEach) {
                    _oDataWork.LinkGuarantorSet.forEach(function(oLinkGuarantorItem) {
                        /// Insertar customer si no existe en Pouch (Viene de Kapsel)
                        this.upsertGuarantor(oLinkGuarantorItem.Guarantor).then(
                            //// Insertar Links
                            this.upsertLinkGuarantor(oLinkGuarantorItem)
                        ).catch(function(error) {
                            console.log("Error al insertar la Links y Customers en PouchDB: " + error);
                            reject(error);
                        });
                        aLinkGuarantorIDs.push(this.getLinkPouchDBIdGuarantor(oLinkGuarantorItem));
                    }.bind(this));

                }
                /// Cambiar expand de Customers por arreglo de Id's
                _oDataWork.LinkGuarantorSet = aLinkGuarantorIDs;

            }

            _oDataWork.id = _oDataWork.LoanRequestIdMD;

            /// Guardar Solicitud
            this.upsertLoan(_oDataWork).then(resolve(oDictionary.oResults.OK))
                .catch(function(error) {
                    console.log("Error al insertar la solicitud en PouchDB: " + error);
                    reject(error);
                });


        }.bind(this));

    };



    sap.ui.serialize.LoanRequest.prototype.deSerialize = function(_sIdMD, _bIncludeResults, _bPrepareServiceCall) {

        var sId, oDictionary, oDisplayBase, oObjectBase;
        var LoanRequestModelData;
        var i;

        oDictionary = new sap.ui.helper.Dictionary();
        oObjectBase = new sap.ui.mw.ObjectBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();

        return this.dataDB.getById(oDictionary.oTypes.LoanRequest, _sIdMD)
            .then(function(result) {

                if (result.hasOwnProperty(oDictionary.oCollections.LoanRequestSet) && result.hasOwnProperty(oDictionary.oCollections.LinkSet)) {

                    if (_bPrepareServiceCall) {
                        result.LoanRequestSet.forEach(function(oLoan) {
                            oObjectBase.deletePropertyFromObject(oLoan, "ElectronicSignatureSet");
                            oObjectBase.deletePropertyFromObject(oLoan.ImageSet, "__metadata");
                            oObjectBase.deletePropertyFromObject(oLoan, "InsuranceSet");
                            oObjectBase.deletePropertyFromObject(oLoan, "LoanRequestSet");
                            oObjectBase.deletePropertyFromObject(oLoan, "LoanRequestIdCRMParent");
                            oObjectBase.deletePropertyFromObject(oLoan, "ProcessType");
                            oObjectBase.deletePropertyFromObject(oLoan, "SubsequenceType");
                            oObjectBase.deletePropertyFromObject(oLoan.GeneralLoanRequestData, "IsRenewal");
                            oObjectBase.deletePropertyFromObject(oLoan.GeneralLoanRequestData, "Cycle");
                            oObjectBase.deletePropertyFromObject(oLoan.GeneralLoanRequestData, "StatusText");
                            oObjectBase.deletePropertyFromObject(oLoan.GeneralLoanRequestData, "IsReadyToApprove");
                            oObjectBase.deletePropertyFromObject(oLoan.GeneralLoanRequestData, "IsReadyToApproveDescription");
                            oObjectBase.deletePropertyFromObject(oLoan.GeneralLoanRequestData, "Term");
                            oObjectBase.deletePropertyFromObject(oLoan.GeneralLoanRequestData, "InsuranceProductId");
                            oObjectBase.deletePropertyFromObject(oLoan.GeneralLoanRequestData, "InsuranceMinimumCycle");
                            oObjectBase.deletePropertyFromObject(oLoan.LRGeneralCrossSell, "__metadata");
                            oObjectBase.deletePropertyFromObject(oLoan.LRGroupCrossSell, "__metadata");

                            if (oLoan.hasOwnProperty("GroupCrossSellAssignedGuarantorSet" !== null)) {
                                delete oLoan.GroupCrossSellAssignedGuarantorSet['__metadata'];
                                delete oLoan.GroupCrossSellAssignedGuarantorSet.GuarantorName['__metadata'];
                                delete oLoan.GroupCrossSellAssignedGuarantorSet.FilterResults['__metadata'];
                                delete oLoan.GroupCrossSellAssignedGuarantorSet.FilterResults['InsuranceAmount'];
                                delete oLoan.GroupCrossSellAssignedGuarantorSet.FilterResults['SavingsAmount'];
                            } else {
                                oObjectBase.deletePropertyFromObject(oLoan, "GroupCrossSellAssignedGuarantorSet");
                            }
                            
                            this.trimResults(oLoan, "ImageSet");

                        }.bind(this));
                    }

                    result.LinkSet.forEach(function(oLink) {


                        oObjectBase.deletePropertyFromObject(oLink, "bIsOriginalGW");
                        oObjectBase.deletePropertyFromObject(oLink, "id");
                        oObjectBase.deletePropertyFromObject(oLink, "rev");
                        oObjectBase.deletePropertyFromObject(oLink, "IsEntityInQueue");
                        oObjectBase.deletePropertyFromObject(oLink, "bRegisterComesFromLoanRequest");
                        oObjectBase.deletePropertyFromObject(oLink, "__metadata");
                        oObjectBase.deletePropertyFromObject(oLink, "CustomerSet");
                        oObjectBase.deletePropertyFromObject(oLink, "LoanRequestSet");
                        oObjectBase.deletePropertyFromObject(oLink.GeneralLoanData, "__metadata");
                        oObjectBase.deletePropertyFromObject(oLink.IndividualLoanData, "__metadata");
                        oObjectBase.deletePropertyFromObject(oLink.GroupLoanData, "__metadata");
                        oObjectBase.deletePropertyFromObject(oLink.GrpCrossSellData, "__metadata");


                        if (_bPrepareServiceCall) {
                            oObjectBase.deletePropertyFromObject(oLink, "isApplicantPouch");
                            oObjectBase.deletePropertyFromObject(oLink, "Customer");
                            oObjectBase.deletePropertyFromObject(oLink, "LoanRequest");
                            oObjectBase.deletePropertyFromObject(oLink.GeneralLoanData, "ControlListsResult");
                            oObjectBase.deletePropertyFromObject(oLink.GeneralLoanData, "RiskLevel");
                            oObjectBase.deletePropertyFromObject(oLink.GeneralLoanData, "SemaphoreResultFilters");
                        }

                    });


                    if (_bIncludeResults) {

                        result.LoanRequestSet[0].LinkSet.results = {};
                        result.LoanRequestSet[0].LinkSet.results = result.LinkSet;

                    } else {

                        result.LoanRequestSet[0].LinkSet = result.LinkSet;
                    }

                }


                if (result.hasOwnProperty(oDictionary.oCollections.LoanRequestSet) && result.hasOwnProperty(oDictionary.oCollections.LinkGuarantorSet)) {

                    result.LinkGuarantorSet.forEach(function(oLinkGuarantor) {

                        oObjectBase.deletePropertyFromObject(oLinkGuarantor, "id");
                        oObjectBase.deletePropertyFromObject(oLinkGuarantor, "rev");
                        oObjectBase.deletePropertyFromObject(oLinkGuarantor, "IsEntityInQueue");
                        oObjectBase.deletePropertyFromObject(oLinkGuarantor, "bRegisterComesFromLoanRequest");
                        oObjectBase.deletePropertyFromObject(oLinkGuarantor, "__metadata");
                        oObjectBase.deletePropertyFromObject(oLinkGuarantor, "LoanRequest");

                        if (_bPrepareServiceCall) {
                            oObjectBase.deletePropertyFromObject(oLinkGuarantor, "isApplicantPouch");
                            oObjectBase.deletePropertyFromObject(oLinkGuarantor, "Guarantor");
                            oObjectBase.deletePropertyFromObject(oLinkGuarantor, "GuarantorSet");
                            oObjectBase.deletePropertyFromObject(oLinkGuarantor, "LoanRequestSet");
                            oObjectBase.deletePropertyFromObject(oLinkGuarantor, "GeneralLoanData");
                        }

                    });

                    if (_bIncludeResults) {

                        result.LoanRequestSet[0].LinkGuarantorSet.results = {};
                        result.LoanRequestSet[0].LinkGuarantorSet.results = result.LinkGuarantorSet;

                    } else {

                        result.LoanRequestSet[0].LinkGuarantorSet = result.LinkGuarantorSet;
                    }

                }

                LoanRequestModelData = result.LoanRequestSet[0];

                oObjectBase.deletePropertyFromObject(LoanRequestModelData, "id");
                oObjectBase.deletePropertyFromObject(LoanRequestModelData, "rev");
                oObjectBase.deletePropertyFromObject(LoanRequestModelData, "IsEntityInQueue");
                oObjectBase.deletePropertyFromObject(LoanRequestModelData, "__metadata");


                oObjectBase.deletePropertyFromObject(LoanRequestModelData.GeneralLoanRequestData, "__metadata");

                if (LoanRequestModelData.hasOwnProperty("GroupRequestData")) {
                    oObjectBase.deletePropertyFromObject(LoanRequestModelData.GroupRequestData, "__metadata");
                    oObjectBase.deletePropertyFromObject(LoanRequestModelData.GroupRequestData.GroupMeetingPlace, "__metadata");
                    oObjectBase.deletePropertyFromObject(LoanRequestModelData.GroupRequestData.GroupMeetingPhone, "__metadata");
                }

                if (_bPrepareServiceCall) {
                    LoanRequestModelData.GeneralLoanRequestData.StartDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.StartDate));
                    LoanRequestModelData.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.FirstPaymentDate));
                    LoanRequestModelData.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.ExpenditureDate));
                } else {
                    LoanRequestModelData.GeneralLoanRequestData.StartDate = oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.StartDate);
                    LoanRequestModelData.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.FirstPaymentDate);
                    LoanRequestModelData.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.ExpenditureDate);



                }


                return LoanRequestModelData;

            }.bind(this));


    };
    sap.ui.serialize.LoanRequest.prototype.getMainModel = function(_oType, _oPromoterID, _module) {
        var oDictionary, oLoanRequestDictionary, oParams, promisePouch, promiseOdata, oPouchArray;
        var oDataPouchArray, oDataKapselArray, oMergedArray, oDataModel, oDisplayBase, oDataCustomerArray;
        var promiseCustomers;
        var bCustomersExpanded;
        var oCurrentClass = this;

        bCustomersExpanded = false;

        jQuery.sap.require("js.helper.Dictionary");
        jQuery.sap.require("js.base.DisplayBase");
        oParams = {
            promoterID: _oPromoterID
        };
        oDataPouchArray = {};
        oMergedArray = {};
        oDataCustomerArray = {};

        oDictionary = new sap.ui.helper.Dictionary();
        oDataModel = new sap.ui.model.json.JSONModel();

        return new Promise(function(resolve, reject) {
            //TODO: try {

            /// Recuperar oportunidades de Pouch
            oLoanRequestDictionary = oDictionary.oDataRequest(oParams).getRequest(_oType);
            promisePouch = this.dataDB.get(oLoanRequestDictionary.pouch.name);

            /// Recuperar oportunidades de Kapsel
            promiseOdata = sap.ui.getCore().AppContext.myRest.read(oLoanRequestDictionary.odata.name + oLoanRequestDictionary.odata.get.expand, oLoanRequestDictionary.odata.get.filter, true);

            /////// Agregar para la lectura de Customers, si ya se borro el customer actual de PDB por notificaciÃ³n
            oLoanRequestDictionary = oDictionary.oDataRequest(oParams).getRequest("CustomerSet");
            promiseCustomers = sap.ui.getCore().AppContext.myRest.read("LinkSet?$expand=Customer", "$filter=CollaboratorID eq '" + _oPromoterID + "'", true);
            /////// Agregar para la lectura de Customers, si ya se borro el customer actual de PDB por notificaciÃ³n

            Promise.all([promisePouch, promiseOdata, promiseCustomers]).then(
                function(values) {

                    var newPouchArray = {};
                    var oFinalKapsel = {};
                    var oPouchProcessedItems = [];

                    oFinalKapsel.results = [];

                    oDisplayBase = new sap.ui.mw.DisplayBase();



                    oPouchArray = values[0];
                    oDataKapselArray = values[1];
                    oDataCustomerArray = values[2];


                    oDataKapselArray.results.forEach(function(oDataKapselLoanRequest) {

                        var iLengthKapsel;

                        ////////// Validar que solicitudes se tomaran de Pouch y Cuales de Kapsel
                        iLengthKapsel = oFinalKapsel.results.length;
                        var indexPouch = -1;
                        oPouchArray.LoanRequestSet.some(
                            function(oLoanRequest) {
                                indexPouch++;
                                /// Verificar si vive en Pouch
                                if (oDataKapselLoanRequest.LoanRequestIdMD === oLoanRequest.id) {
                                    /// Vive en Pouch, tomar la de Pouch
                                    oPouchProcessedItems.push(indexPouch);
                                    /// Agregar LinkSet y LinkGuarantorSet
                                    /// LinkSet
                                    oCurrentClass.relateLoanToLinksAndCustomers(oLoanRequest, oPouchArray, oDataCustomerArray);
                                    //LinkGuarantorSet
                                    oCurrentClass.relateLoanToLinkGuarantorsAndGuarantors(oLoanRequest, oPouchArray);
                                    //ElectronicSignature
                                    oCurrentClass.unTrimResults(oLoanRequest, "ElectronicSignatureSet");

                                    oFinalKapsel.results.push(oLoanRequest);
                                    return true;
                                }

                                return false;
                            }
                        );

                        if (iLengthKapsel === oFinalKapsel.results.length) {
                            /// Si no se agrego de Pouch, tomar la de Kapsel
                            oFinalKapsel.results.push(oDataKapselLoanRequest);
                        }
                    });
                    //Agregar los registros de Pouch que no existan en Kapsel
                    //El caso solo aplica para nuevas solicitudes
                    //Se eliminan del arreglo PDB los items ya procesados, 
                    oPouchProcessedItems.forEach(
                        function(index) {
                            delete oPouchArray.LoanRequestSet[index];
                            console.log("Tamaño de arreglo PDB: " + oPouchArray.LoanRequestSet.length);
                        }
                    );
                    oPouchArray.LoanRequestSet = oPouchArray.LoanRequestSet.filter(
                        function(val) {
                            return val !== null;
                        }
                    );
                    //A los items no procesados de PDB se les agrega LinkSet y LinkGuarantorSet
                    oPouchArray.LoanRequestSet.forEach(
                        function(oLoanRequest) {
                            //LinkSet
                            oCurrentClass.relateLoanToLinksAndCustomers(oLoanRequest, oPouchArray, oDataCustomerArray);
                            //LinkGuarantorSet
                            oCurrentClass.relateLoanToLinkGuarantorsAndGuarantors(oLoanRequest, oPouchArray);
                            //ElectronicSignature
                            oCurrentClass.unTrimResults(oLoanRequest, "ElectronicSignatureSet");

                            oFinalKapsel.results.push(oLoanRequest);
                        }
                    );
                    if (_module !== "applications") {
                        oFinalKapsel.results = _.filter(oFinalKapsel.results, function(d) {
                            return d.ProductID === "C_IND_CI" || d.ProductID === "C_GRUPAL_CCR" || d.ProductID === "C_GRUPAL_CM"
                        });
                    }


                    oDataModel.setData(oFinalKapsel);

                    resolve(oDataModel);
                }.bind(this));
        }.bind(this));
    };

    sap.ui.serialize.LoanRequest.prototype.reviewCustomerLoanRelationship = function(resp) {
        var _self, counter;
        _self = this;

        return new Promise(function(resolve, reject) {
            try {
                if (resp.docs.length !== 0) {
                    counter = 0;
                    resp.docs.forEach(function(oCustomerLoanRelationship) {

                        var parseDoc = _self.dataDB.oDB.rel.parseDocID(oCustomerLoanRelationship._id);

                        _self.dataDB.delete("CustomerLoanRelationship", parseDoc.id, oCustomerLoanRelationship._rev).then(function(msg) {
                            counter++;

                            if (resp.docs.length === counter) {
                                resolve(resp);

                            }


                        }).catch(function(error) {
                            console.log(error);
                        });



                    });

                } else {
                    resolve(resp);
                }

            } catch (ex) {
                reject(ex);
            }


        });



    };
    sap.ui.serialize.LoanRequest.prototype.relateCustomersToLoan = function(_loanRequestIdMD, _CustomerSetArray) {


        var oDictionary, oIndexes, oFilters, _self;
        oDictionary = new sap.ui.helper.Dictionary();
        _self = this;

        oIndexes = ['data.loanRequestIdMD'];
        oFilters = {
            $and: [{
                    '_id': { $lte: 'CustomerLoanRelationship\uffff' }
                }, {
                    'data.loanRequestIdMD': { $eq: _loanRequestIdMD }
                }

            ]
        };
        this.dataDB.getByProperty(oIndexes, oFilters).then(function(resp) {

            _self.reviewCustomerLoanRelationship(resp).then(function(resp) {
                _CustomerSetArray.forEach(function(oCustomer) {
                    var request = { loanRequestIdMD: _loanRequestIdMD, customerIdMD: oCustomer };

                    _self.dataDB.post(oDictionary.oTypes.CustomerLoanRelationship, request).then(function(data) {
                        console.log(data);
                    }).catch(function(error) {
                        console.log(error);
                    });

                });

            });


        }).catch(function(error) {
            console.log(error)

        });





    };

    sap.ui.serialize.LoanRequest.prototype.reviewGuaranteeLoanRelationship = function(resp) {
        var _self, counter;
        _self = this;

        return new Promise(function(resolve, reject) {
            try {
                if (resp.docs.length !== 0) {
                    counter = 0;
                    resp.docs.forEach(function(oGuaranteeLoanRelationship) {

                        var parseDoc = _self.dataDB.oDB.rel.parseDocID(oGuaranteeLoanRelationship._id);

                        _self.dataDB.delete("GuaranteeLoanRelationship", parseDoc.id, oGuaranteeLoanRelationship._rev).then(function(msg) {
                            counter++;

                            if (resp.docs.length === counter) {
                                resolve(resp);

                            }


                        }).catch(function(error) {
                            console.log(error);
                        });





                    });

                } else {
                    resolve(resp);
                }

            } catch (ex) {
                reject(ex);
            }


        });



    };




    sap.ui.serialize.LoanRequest.prototype.relateGuaranteesToLoan = function(_loanRequestIdMD, _sIndividualLoanGuaranteeID) {


        var oDictionary, oIndexes, oFilters, _self;
        oDictionary = new sap.ui.helper.Dictionary();
        _self = this;

        oIndexes = ['data.loanRequestIdMD'];
        oFilters = {
            $and: [{
                    '_id': { $lte: 'GuaranteeLoanRelationship\uffff' }
                }, {
                    'data.loanRequestIdMD': { $eq: _loanRequestIdMD }
                }

            ]
        };
        this.dataDB.getByProperty(oIndexes, oFilters).then(function(resp) {


            _self.reviewGuaranteeLoanRelationship(resp).then(function(resp) {


                var request = {

                    loanRequestIdMD: _loanRequestIdMD,
                    indLoanGuaranteeIdMD: _sIndividualLoanGuaranteeID

                };

                _self.dataDB.post(oDictionary.oTypes.GuaranteeLoanRelationship, request)
                    .then(function(data) {
                        console.log(data);
                    }).catch(function(error) {
                        console.log(error);
                    })

            });


        }).catch(function(error) {
            console.log(error);

        });

    };

    sap.ui.serialize.LoanRequest.prototype.getLoan = function(_oType, _oId) {

        var oPromise, oController, oDataModel, oDictionary;
        oController = this;
        oDataModel = new sap.ui.model.json.JSONModel();
        oDictionary = new sap.ui.helper.Dictionary();
        jQuery.sap.require("js.kapsel.Rest");
        return new Promise(function(resolve, reject) {
            try {
                oPromise = sap.ui.getCore().AppContext.myRest.read("LinkSet?$expand=Customer", "$filter=LoanRequestIdCRM eq '" + _oId + "'", true);
                oPromise
                    .then(function(oResult) {
                        oDataModel.setData(oResult);
                        resolve(oDataModel);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };
    sap.ui.serialize.LoanRequest.prototype.getLoanRequest = function(_oType, _oId) {
        var oPromise, oController, oDataModel, oDictionary;
        oController = this;
        oDataModel = new sap.ui.model.json.JSONModel();
        oDictionary = new sap.ui.helper.Dictionary();
        jQuery.sap.require("js.kapsel.Rest");
        return new Promise(function(resolve, reject) {
            try {
                oPromise = sap.ui.getCore().AppContext.myRest.read("/LinkSet?$filter=LoanRequestIdCRM eq '" + _oId + "'&$expand=Customer", null, null, false);
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

    sap.ui.serialize.LoanRequest.prototype.reviewAnnouncement = function(_isAnnouncement, _oModel, _router) {
        if (_isAnnouncement) {
            if (!_oModel.getProperty("/LinkSet/results") || _oModel.getProperty("/LinkSet/results").length === 0)
                _router.navTo("announcementList", {
                    query: {
                        msg: "La solicitud de crédito seleccionada no existe en el dispositivo."
                    }
                }, false);

        }
    }

    sap.ui.serialize.LoanRequest.prototype.getModelReviewed = function(_entityType, _id, _isAnnouncement, _router, _detailObject) {
        var oDictionary, oDisplayBase, oLinkSet, oLinkGuarantorSet;
        var LoanRequestModelData;
        var _self, oModel, oGeneralSerialize;

        _self = this;
        oGeneralSerialize = new sap.ui.serialize.General("dataDB");
        oDictionary = new sap.ui.helper.Dictionary();
        oDisplayBase = new sap.ui.mw.DisplayBase();

        return new Promise(function(resolve, reject) {
            try {

                if (_id !== "0") { //Si es edicion

                    if (_detailObject.hasOwnProperty(oDictionary.oCollections.LoanRequestSet) && _detailObject.hasOwnProperty(oDictionary.oCollections.LinkSet)) {
                        //Lógica de pouch
                        LoanRequestModelData = _detailObject.LoanRequestSet[0];

                        LoanRequestModelData.LinkSet = {};
                        oLinkSet = {};
                        oLinkSet.results = [];
                        _detailObject.LinkSet.forEach(function(element, index) {
                            /// EAMARCE: 13/09/2016 Agregado para traer detalle de Customer                          
                            _detailObject.CustomerSet.some(function(oCustomer) {

                                if (oCustomer.CustomerIdMD === element.Customer) {
                                    element.Customer = oCustomer;
                                    return true;
                                } else {
                                    return false;
                                }

                            });
                            /// EAMARCE: 13/09/2016 Agregado para traer detalle de Customer
                            oLinkSet.results[index] = element;

                        });
                        LoanRequestModelData.LinkSet = oLinkSet;

                        LoanRequestModelData.LinkGuarantorSet = {};
                        oLinkGuarantorSet = {};
                        oLinkGuarantorSet.results = [];
                        if (_detailObject.LinkGuarantorSet) {
                            _detailObject.LinkGuarantorSet.forEach(function(element, index) {
                                /// Agregado para traer detalle de Guarantor                          
                                _detailObject.GuarantorSet.some(function(oGuarantor) {

                                    if (oGuarantor.CustomerIdMD === element.CustomerIdMD) {
                                        element.Guarantor = oGuarantor;
                                        return true;
                                    } else {
                                        return false;
                                    }

                                });
                                /// Agregado para traer detalle de Guarantor
                                oLinkGuarantorSet.results[index] = element;

                            });
                        }
                        LoanRequestModelData.LinkGuarantorSet = oLinkGuarantorSet;


                        LoanRequestModelData.GeneralLoanRequestData.StartDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.StartDate));
                        LoanRequestModelData.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.FirstPaymentDate));
                        LoanRequestModelData.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.ExpenditureDate));

                        oModel = new sap.ui.model.json.JSONModel(LoanRequestModelData);

                    } else {

                        LoanRequestModelData = _detailObject.results[0];

                        LoanRequestModelData.GeneralLoanRequestData.StartDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.StartDate));
                        LoanRequestModelData.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.FirstPaymentDate));
                        LoanRequestModelData.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(LoanRequestModelData.GeneralLoanRequestData.ExpenditureDate));

                        oModel = new sap.ui.model.json.JSONModel(_detailObject.results[0]);

                    }
                    _self.reviewAnnouncement(_isAnnouncement, oModel, _router);
                    resolve(oModel);

                } else { //Si es creacion
                    oGeneralSerialize.getEmptyModel(_entityType).then(function(emptyModel) {
                        resolve(emptyModel)
                    });
                }

            } catch (ex) {
                reject(ex)
            }
        });
    };


})();
