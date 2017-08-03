(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.Rest");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.base.NavigatorBase");
    jQuery.sap.require("js.base.DisplayBase");

    sap.ui.base.Object.extend('sap.ui.mw.Rest', {
        constructor: function(_sServiceUrl, _bJson, _sAuth, _sAppCID, _bUseMockServer, _bEnableValidator, _bEnableGWSimulation, _bEnableIGWSImulation) {

            var oMyOdataModel;
            this.oNavigator = new sap.ui.mw.NavigatorBase();


            this.sServiceUrl = _sServiceUrl;
            this.bJson = _bJson;
            this.sAuth = _sAuth;
            this.sAppCID = _sAppCID;

                /*
                * IMPORTANTE RECORDAR
                * - Se quitó el signo diferente a, para que los escenarios que se hacen web, apliquen por igual al mobil
                */
            if (this.oNavigator.testUserAgent()) {
                /// Solo para Web

                if (_bUseMockServer) {
                    if (!_bEnableGWSimulation) {
                        this.bEnableGWSimulation = false;
                    } else {
                        this.bEnableGWSimulation = true;
                    }
                    this.createMockServer();

                    this.bMockServerEnabled = true;
                    console.log("******** MockServer enabled *******");
                    if (_bEnableGWSimulation) {
                        this.refreshGWSimulatedStore();
                    } else {
                        this.enableMainModel();
                    }
                }

                if (_bEnableIGWSImulation) {
                    this.enableMainModel();
                }

            } else {
                this.enableMainModel();
            }

            if (_bEnableValidator) {
                this.enableValidator();
            }

        }


    });


    sap.ui.mw.Rest.prototype.enableMainModel = function() {

        var oHeaders = {};
        var oMyOdataModel;

        oHeaders['Authorization'] = this.sAuth;
        if (this.oNavigator.testUserAgent()) {
            this.user = "Genesis";//sap.ui.getCore().AppContext.applicationContext.registrationContext.user;
            this.pass = "Inicio17";//sap.ui.getCore().AppContext.applicationContext.registrationContext.password;
            oHeaders['X-SMP-APPCID'] ="SDFHsDFHsFDSDFHSDFSD";// sap.ui.getCore().AppContext.applicationContext.applicationConnectionId;

        }

        oMyOdataModel = new sap.ui.model.odata.ODataModel(this.sServiceUrl, this.bJson, this.user, this.pass, oHeaders);

        console.log(oMyOdataModel);

        oMyOdataModel.forceNoCache(true);
        this.oDataModel = oMyOdataModel;

    };


    sap.ui.mw.Rest.prototype.refreshGWSimulatedStore = function() {

        var aProvmises = [];
        /// Query Initial entities
        this.oDataModelLocal = null;

        var aPromises = [];
        var sPromoterId = sap.ui.getCore().AppContext.Config.getProperty("promoterId")


        this.sServiceUrl = sap.ui.getCore().AppContext.Config.getProperty("gwUrl");
        this.bJson = true;

        /// Gateway Model (Used to retrieve data from GW and to POST)
        var oMyOdataModel = new sap.ui.model.odata.ODataModel(this.sServiceUrl, {
            json: true,
            headers: {

                "Access-Control-Allow-Credentials": "false",
                "Authorization": this.sAuth
            }
        });

        oMyOdataModel.forceNoCache(true);
        this.oDataModel = oMyOdataModel;

        aPromises.push(this.read("/CustomerSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/GuarantorSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/LoanRequestSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/LinkSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/LinkGuarantorSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/AddressSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/EmployerSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/ImageSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/PersonalReferenceSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/PhoneSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/ChannelMediumDispersionSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/InsuranceBeneficiarySet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/InsuranceSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/PostalCodeSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/CrossSellingCandidateSet", "$filter=CollaboratorID eq '" + sPromoterId + "' and IsMarkedToDownload eq true", true));
        aPromises.push(this.read("/CrossSellOfferSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/GroupCrossSellGuarantorCandidateSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));
        aPromises.push(this.read("/GroupCrossSellAssignedGuarantorSet", "$filter=CollaboratorID eq '" + sPromoterId + "'", true));


        Promise.all(aPromises).then(function(result) {

            this.oMockServer._oMockdata.CustomerSet = result[0].results;
            this.oMockServer._oMockdata.GuarantorSet = result[1].results;
            this.oMockServer._oMockdata.LoanRequestSet = result[2].results;
            this.oMockServer._oMockdata.LinkSet = result[3].results;
            this.oMockServer._oMockdata.LinkGuarantorSet = result[4].results;
            this.oMockServer._oMockdata.AddressSet = result[5].results;
            this.oMockServer._oMockdata.EmployerSet = result[6].results;
            this.oMockServer._oMockdata.ImageSet = result[7].results;
            this.oMockServer._oMockdata.PersonalReferenceSet = result[8].results;
            this.oMockServer._oMockdata.PhoneSet = result[9].results;
            this.oMockServer._oMockdata.ChannelMediumDispersionSet = result[10].results;
            this.oMockServer._oMockdata.InsuranceBeneficiarySet = result[11].results;
            this.oMockServer._oMockdata.InsuranceSet = result[12].results;
            this.oMockServer._oMockdata.PostalCodeSet = result[13].results;
            this.oMockServer._oMockdata.CrossSellingCandidateSet = result[14].results;
            this.oMockServer._oMockdata.CrossSellOfferSet = result[15].results;
            this.oMockServer._oMockdata.GroupCrossSellGuarantorCandidateSet = result[16].results;
            this.oMockServer._oMockdata.GroupCrossSellAssignedGuarantorSet = result[17].results;

            var sServiceUrl = "/mock/";
            var oMyOdataModelLocal = new sap.ui.model.odata.ODataModel(sServiceUrl, this.bJson, this.user, this.pass, {});
            this.oDataModelLocal = oMyOdataModelLocal;
            console.log("|||||||||||| Simulated Stored Refreshed |||||||||||");

        }.bind(this));

    };


    /// Request Validator
    sap.ui.mw.Rest.prototype.enableValidator = function(sServiceUrl) {
        jQuery.sap.require("js.helper.PostValidator");

        if (this.oNavigator.testUserAgent()) {
            /// on the phone load metadata from ODataModel
            sap.ui.getCore().AppContext.oPostValidator = new sap.ui.helper.PostValidator(this.oDataModel.getMetaModel().oMetadata.sMetadataBody);
        } else {
            sap.ui.getCore().AppContext.oPostValidator = new sap.ui.helper.PostValidator(this._loadMetadata("model/metadata.xml"));
        }

    };


    sap.ui.mw.Rest.prototype._loadMetadata = function(sMetadataUrl) {

        // load the metadata
        var oMetadata = jQuery.sap.sjax({
            url: sMetadataUrl,
            dataType: "xml"
        }).data;
        jQuery.sap.assert(oMetadata !== undefined, "The metadata for url \"" + sMetadataUrl + "\" could not be found!");

        return oMetadata;

    };
    /// Request Validator

    sap.ui.mw.Rest.prototype.setsServiceUrl = function(sServiceUrl) {
        this.sServiceUrl = sServiceUrl;
    };

    sap.ui.mw.Rest.prototype.getsServiceUrl = function() {
        return this.sServiceUrl;
    };
    sap.ui.mw.Rest.prototype.setbJson = function(bJson) {
        this.bJson = bJson;
    };
    sap.ui.mw.Rest.prototype.getbJson = function() {
        return this.bJson;
    };
    sap.ui.mw.Rest.prototype.setsAuth = function(sAuth) {
        this.sAuth = sAuth;
    };
    sap.ui.mw.Rest.prototype.getsAuth = function() {
        return this.sAuth;
    };
    sap.ui.mw.Rest.prototype.setsAppCID = function(sAppCID) {
        this.sAppCID = sAppCID;
    };
    sap.ui.mw.Rest.prototype.getsAppCID = function() {
        return this.sAppCID;
    };
    sap.ui.mw.Rest.prototype.setoDataModel = function(oDataModel) {
        this.oDataModel = oDataModel;
    };
    sap.ui.mw.Rest.prototype.getoDataModel = function(oDataModel) {
        return this.oDataModel;
    };
    sap.ui.mw.Rest.prototype.setoBase64 = function(oBase64) {
        this.oBase64 = oBase64;
    };
    sap.ui.mw.Rest.prototype.getoBase64 = function(oBase64) {
        return this.oBase64;
    };

    sap.ui.mw.Rest.prototype.createMockServer = function() {



        var oMockServer;

        jQuery.sap.require("sap.ui.core.util.MockServer");
        oMockServer = new sap.ui.core.util.MockServer({
            rootUri: "/mock/"
        });

        sap.ui.core.util.MockServer.config({
            autoRespondAfter: 0,
            autoRespond: true
        });
        oMockServer.simulate("model/metadata.xml", "model/");
        oMockServer.start();
        this.oMockServer = oMockServer;
        ///._oMockdata;
    };

    sap.ui.mw.Rest.prototype.MockParseJsonDateString = function(_value) {

        var jsonDateRE = /^\/Date\((-?\d+)(\+|-)?(\d+)?\)\/$/;
        var arr = _value && jsonDateRE.exec(_value);
        if (arr) {
            return new Date(parseInt(arr[1], 10));
        }
    };

    /**
     * [refreshCredentials Actualiza petición al oData]
     * @return {[type]} [NA]
     */
    sap.ui.mw.Rest.prototype.refreshCredentials = function() {
        this.model.refreshSecurityToken(function() {
            alert("success");
        }, function() {
            alert("error");
        }, true);
    };
    /**
     * [create crea una nueva petición al oData de tipo POST]
     * @param  {[string]} _sPath                 [colleción oData]
     * @param  {[JSON Array]} _oData             [datos JSON de lo que se insertará]
     * @param  {[boolean]} _bIsAsynchronous      [define si es asincrono o no el odata]
     * @param  {[string]} _sId                   [id del modelo]
     * @return {[sap.ui.model.json.JSONModel]}  [retorno del modelo con los datos recolectados del oData]
     */
    sap.ui.mw.Rest.prototype.create = function(_sPath, _oData, _bIsAsynchronous) {
        var currentClass;
        currentClass = this;

        return new Promise(function(resolve, reject) {
            try {
                currentClass.oDataModel.refresh(true, false);
                currentClass.oDataModel.create(
                    _sPath,
                    _oData,
                    null,
                    function(oData, oResponse) {
                        console.log("oData");
                        console.log(oData);
                        console.log("oResponse");
                        console.log(oResponse);
                        resolve(oResponse);
                    },
                    function(error) {
                        console.log(error);
                        if (error.response && error.response.statusCode == 403) { //Forbidden = Expiró el CSRF Token
                            console.log("create - Renovando el CSRF Token");
                            //return new Promise(function(resolve, reject) {
                            var promiseRefresh = currentClass.refreshSession();

                            promiseRefresh.then(function(response) {
                                try {

                                    currentClass.oDataModel.create(
                                        _sPath,
                                        _oData,
                                        null,
                                        function(oData, oResponse) {
                                            console.log("oData");
                                            console.log(oData);
                                            console.log("oResponse");
                                            console.log(oResponse);
                                            resolve(oResponse);
                                        },
                                        function(err) {
                                            console.log(err);
                                            if (err.response) {
                                                reject(err.response.body);
                                            } else {
                                                reject(err);
                                            }
                                        },
                                        _bIsAsynchronous);

                                } catch (secondSendingError) {
                                    console.log("Error al intentar el envio por 2nda ocasión: " + secondSendingError);
                                    reject(secondSendingError);
                                }


                            }).catch(function(error) {
                                console.log("No fue posible completar el refresh de CSRF token: " + error);
                                reject(error);
                            });
                            //});
                        } else {
                            if (error.response) {
                                reject(error.response.body);
                            } else {
                                reject(error);
                            }
                        }
                    },
                    _bIsAsynchronous
                );
            } catch (ex) {
                console.log(ex);
                reject(ex);
            }
        });
    };
    /**
     * [read Lectura de servicio oData]
     * @param  {[string]} _sPath                 [Identity o IdentitySet oData. Ej: /WarehouseCollection]
     * @param  {[string]} _filters              [filtros aplicados al servicio de oData. Ej: "$filter=warehouseId eq '300'" ]
     * @param  {[boolean]} _bIsAsynchronous      [true para asincrono, false para sincrono]
     * @param  {[string]} _sId                   [Asignaciónd el Id al modelo retornado]
     * @return {[sap.ui.model.json.JSONModel]}  [Retorno del modelo Creado]
     */
    sap.ui.mw.Rest.prototype.read = function(_sPath, _filters, _bIsAsynchronous) {
        var oModel,
            currentClass;
        var oFilters;
        currentClass = this;
        if (_filters == "") {
            oFilters = "";
        } else {
            oFilters = [_filters];
        }



        return new Promise(function(resolve, reject) {
            try {

                currentClass.sModel = "oDataModel";

                if (!currentClass.oNavigator.testUserAgent() && currentClass.bEnableGWSimulation) {

                    if (currentClass.oDataModelLocal) {

                        if (_sPath.indexOf("OpportunityApproval") === -1 && _sPath.indexOf("CreditSimulator") === -1 && _sPath.indexOf("AssignGuarantorRole") === -1 && _sPath.indexOf("ServiceTime") === -1 && _sPath.indexOf("InitializeCache") === -1 && _sPath.indexOf("UpdateGuarantorValidityPeriod") === -1 && _sPath !== "/GuarantorCandidate") {

                            currentClass.sModel = "oDataModelLocal";
                        }

                    }
                } else {

                    currentClass[currentClass.sModel].refresh(true, false);
                }

                //currentClass.oDataModel.refreshMetadata();


                currentClass[currentClass.sModel].read(
                    _sPath,
                    null, oFilters,
                    _bIsAsynchronous,
                    function(oData, response) {
                        console.log(_sPath + ":oData: ");
                        console.log(oData);
                        console.log(_sPath + ":response: ");
                        console.log(response);
                        ///////////// EAMARCE - 02.08.2016 Validar fecha en Complex Data type cuando funciona en MockServer
                        if (currentClass.bMockServerEnabled && !currentClass.bEnableGWSimulation) {

                            if (oData.results) {
                                if (oData.results.length > 0) {
                                    for (var i = 0; i < oData.results.length; i++) {

                                        if (oData.results[i].GeneralLoanRequestData) {
                                            if (oData.results[i].GeneralLoanRequestData.ExpenditureDate != undefined) {
                                                oData.results[i].GeneralLoanRequestData.ExpenditureDate = currentClass.MockParseJsonDateString(oData.results[i].GeneralLoanRequestData.ExpenditureDate);
                                            }
                                            if (oData.results[i].GeneralLoanRequestData.StartDate != undefined) {
                                                oData.results[i].GeneralLoanRequestData.StartDate = currentClass.MockParseJsonDateString(oData.results[i].GeneralLoanRequestData.StartDate);
                                            }
                                            if (oData.results[i].GeneralLoanRequestData.FirstPaymentDate != undefined) {
                                                oData.results[i].GeneralLoanRequestData.FirstPaymentDate = currentClass.MockParseJsonDateString(oData.results[i].GeneralLoanRequestData.FirstPaymentDate);
                                            }
                                        }


                                        if (oData.results[i].BpMainData) {
                                            if (oData.results[i].BpMainData.RegistrationDate != undefined) {
                                                oData.results[i].BpMainData.RegistrationDate = currentClass.MockParseJsonDateString(oData.results[i].BpMainData.RegistrationDate);
                                            }
                                            if (oData.results[i].BpMainData.ContactLaterDate != undefined) {
                                                oData.results[i].BpMainData.ContactLaterDate = currentClass.MockParseJsonDateString(oData.results[i].BpMainData.ContactLaterDate);
                                            }
                                        }

                                        if (oData.results[i].BpBasicData) {
                                            if (oData.results[i].BpBasicData.BirthdDate != undefined) {
                                                oData.results[i].BpBasicData.BirthdDate = currentClass.MockParseJsonDateString(oData.results[i].BpBasicData.BirthdDate);
                                            }
                                        }


                                    }

                                }
                            }

                        }


                        if (currentClass.bMockServerEnabled && currentClass.bEnableGWSimulation && currentClass.sModel == "oDataModel") {

                            var oDisplayBase = new sap.ui.mw.DisplayBase();


                            if (oData.results) {
                                if (oData.results.length > 0) {
                                    for (var i = 0; i < oData.results.length; i++) {

                                        if (oData.results[i].GeneralLoanRequestData) {
                                            if (oData.results[i].GeneralLoanRequestData.ExpenditureDate != undefined) {
                                                oData.results[i].GeneralLoanRequestData.ExpenditureDate = oDisplayBase.formatJSONDate(oData.results[i].GeneralLoanRequestData.ExpenditureDate);
                                            }
                                            if (oData.results[i].GeneralLoanRequestData.StartDate != undefined) {
                                                oData.results[i].GeneralLoanRequestData.StartDate = oDisplayBase.formatJSONDate(oData.results[i].GeneralLoanRequestData.StartDate);
                                            }
                                            if (oData.results[i].GeneralLoanRequestData.FirstPaymentDate != undefined) {
                                                oData.results[i].GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.formatJSONDate(oData.results[i].GeneralLoanRequestData.FirstPaymentDate);
                                            }
                                        }


                                        if (oData.results[i].BpMainData) {
                                            if (oData.results[i].BpMainData.RegistrationDate != undefined) {
                                                oData.results[i].BpMainData.RegistrationDate = oDisplayBase.formatJSONDate(oData.results[i].BpMainData.RegistrationDate);
                                            }
                                            if (oData.results[i].BpMainData.ContactLaterDate != undefined) {
                                                oData.results[i].BpMainData.ContactLaterDate = oDisplayBase.formatJSONDate(oData.results[i].BpMainData.ContactLaterDate);
                                            }
                                            if (oData.results[i].BpMainData.ContactLaterTime != undefined) {
                                                oData.results[i].BpMainData.ContactLaterTime = "PT00H00M00S";
                                            }
                                        }

                                        if (oData.results[i].BpBasicData) {
                                            if (oData.results[i].BpBasicData.BirthdDate != undefined) {
                                                oData.results[i].BpBasicData.BirthdDate = oDisplayBase.formatJSONDate(oData.results[i].BpBasicData.BirthdDate);
                                            }
                                        }

                                        if (oData.results[i].BeneficiaryBirthday) {
                                            if (oData.results[i].BeneficiaryBirthday != undefined) {
                                                oData.results[i].BeneficiaryBirthday = oDisplayBase.formatJSONDate(oData.results[i].BeneficiaryBirthday);
                                            }
                                        }

                                        if (oData.results[i].DueDate) {
                                            if (oData.results[i].DueDate != undefined) {
                                                oData.results[i].DueDate = oDisplayBase.formatJSONDate(oData.results[i].DueDate);
                                            }
                                        }

                                        if (oData.results[i].StartDateTerm) {
                                            if (oData.results[i].StartDateTerm != undefined) {
                                                oData.results[i].StartDateTerm = oDisplayBase.formatJSONDate(oData.results[i].StartDateTerm);
                                            }
                                        }

                                        if (oData.results[i].InsuranceTerm) {
                                            if (oData.results[i].InsuranceTerm != undefined) {
                                                oData.results[i].InsuranceTerm = oDisplayBase.formatJSONDate(oData.results[i].InsuranceTerm);
                                            }
                                        }

                                        if (oData.results[i].CreationDate) {
                                            if (oData.results[i].CreationDate != undefined) {
                                                oData.results[i].CreationDate = oDisplayBase.formatJSONDate(oData.results[i].CreationDate);
                                            }
                                        }


                                        if (oData.results[i].ChangeDate) {
                                            if (oData.results[i].ChangeDate != undefined) {
                                                oData.results[i].ChangeDate = oDisplayBase.formatJSONDate(oData.results[i].ChangeDate);
                                            }
                                        }


                                        if (oData.results[i].LoanEndDate) {
                                            if (oData.results[i].LoanEndDate != undefined) {
                                                oData.results[i].LoanEndDate = oDisplayBase.formatJSONDate(oData.results[i].LoanEndDate);
                                            }
                                        }
                                        //CrossSellOffer
                                        if (oData.results[i].OfferDate) {
                                            if (oData.results[i].OfferDate != undefined) {
                                                oData.results[i].OfferDate = oDisplayBase.formatJSONDate(oData.results[i].OfferDate);
                                            }
                                        }
                                    }

                                }
                            }

                        }



                        ///////////// Validar fecha en Complex Data type cuando funciona en MockServer
                        resolve(oData);
                    },
                    function(error) {
                        console.log(error);
                        if (error.response && error.response.statusCode == 403) {
                            currentClass.oDataModel.refreshMetadata();
                        } else if (error.response && error.response.statusCode == 401) { //Unauthorized = Cambió la contraseña en GW
                            var promiseNewPassword = currentClass.captureNewPassword();
                            promiseNewPassword.then(function(response) {
                                currentClass.oDataModel.read(
                                    _sPath,
                                    null, oFilters,
                                    _bIsAsynchronous,
                                    function(oData, response) {
                                        console.log(oData);
                                        console.log(response);
                                        resolve(oData);
                                    },
                                    function(err) {
                                        console.log(err);
                                        if (err.response) {
                                            reject(err.response.body);
                                        } else {
                                            reject(err);
                                        }
                                    });
                            });
                        } else {
                            if (error.response) {
                                if (error.response.statusCode === 0 || error.response.statusCode === 503 || error.response.statusCode === 404) {
                                    reject(error.response.statusCode);
                                } else {
                                    reject(error.response.body);
                                }

                            } else {
                                reject(error);
                            }
                        }
                    });

            } catch (ex) {
                console.log(ex);
                reject(ex);
            }
        }.bind(this));
    };

    sap.ui.mw.Rest.prototype.update = function(_sPath, _oData, _bIsAsynchronous) {
        var currentClass;
        currentClass = this;

        return new Promise(function(resolve, reject) {
            try {
                currentClass.oDataModel.refresh(true, false);
                currentClass.oDataModel.update(
                    _sPath,
                    _oData,
                    null,
                    function(oData, oResponse) {
                        console.log("oData");
                        console.log(oData);
                        console.log("oResponse");
                        console.log(oResponse);
                        resolve(oResponse);
                    },
                    function(error) {
                        console.log(error);
                        if (error.response && error.response.statusCode == 403) { //Forbidden = Expiró el CSRF Token
                            console.log("update - Renovando el CSRF Token");
                            //return new Promise(function(resolve, reject) {
                            var promiseRefresh = currentClass.refreshSession();
                            promiseRefresh.then(function(response) {
                                currentClass.oDataModel.update(
                                    _sPath,
                                    _oData,
                                    null,
                                    function(oData, oResponse) {
                                        console.log("oData");
                                        console.log(oData);
                                        console.log("oResponse");
                                        console.log(oResponse);
                                        resolve(oResponse);
                                    },
                                    function(err) {
                                        console.log(err);
                                        if (err.response) {
                                            reject(err.response.body);
                                        } else {
                                            reject(err);
                                        }
                                    },
                                    _bIsAsynchronous);
                            });
                            //});
                        } else {
                            if (error.response) {
                                reject(error.response.body);
                            } else {
                                reject(error);
                            }
                        }
                    },
                    _bIsAsynchronous
                );
            } catch (ex) {
                console.log(ex);
                reject(ex);
            }
        });
    };

    /**
     * [remove No se ha implementado en el proyecto]
     * @return {[type]} [NA]
     */
    sap.ui.mw.Rest.prototype.remove = function() {};

    /*
    Retrieves pouch db structure from current model
     */
    sap.ui.mw.Rest.prototype.retrievePouchStructure = function() {

        //////// Get current model metadata
        var oMetadata,
            oEntitySets,
            oEntidadesPouch;

        oMetadata = this.oDataModel.getMetaModel().oMetadata.sMetadataBody;
        oEntitySets = this.findEntitySets(oMetadata);
        oEntidadesPouch = this.processSchemaPouchDB(oEntitySets);

        return oEntidadesPouch;

    };

    sap.ui.mw.Rest.prototype.processSchemaPouchDB = function(_oEntitySets) {

            var oEntitySets,
                oEntidadesPouch,
                oEntidadesPouchTemporal,
                oRelations;

            oEntitySets = _oEntitySets;
            oEntidadesPouch = new Array();
            oEntidadesPouchTemporal = {};
            oRelations = {};

            jQuery.each(oEntitySets, function(sEntitySetName, entitySetValue) {

                var oEntidadPouch,
                    oRelations,
                    bHasRelations;

                oEntidadPouch = {};
                oRelations = {};
                bHasRelations = false;

                oEntidadPouch.singular = entitySetValue.type;
                oEntidadPouch.plural = sEntitySetName;

                jQuery.each(entitySetValue.navprops, function(oNavName, oNavValue) {

                    bHasRelations = true;

                    if (oNavValue.from.entitySet === sEntitySetName) { /// Relationship comes from current

                        ///////// Add to primary oRelationships
                        var ObjectNameTO,
                            ObjectNameFROM;
                        ObjectNameTO = oNavValue.to.entitySet;

                        this[ObjectNameTO] = {};

                        if (oNavValue.to.multiplicity == "1") { /// to One
                            this[ObjectNameTO].belongsTo = oNavValue.to.entitySet.replace("Set", "");
                        } else { //// to Many
                            this[ObjectNameTO].hasMany = oNavValue.to.entitySet.replace("Set", "");;
                        }

                        ///////// Add to particular entitySet
                        ObjectNameFROM = oNavValue.from.entitySet;

                        this[ObjectNameFROM] = {};

                        if (oNavValue.from.multiplicity == "1") { /// to One
                            this[ObjectNameFROM].belongsTo = oNavValue.from.entitySet.replace("Set", "");
                        } else { //// to Many
                            this[ObjectNameFROM].hasMany = oNavValue.from.entitySet.replace("Set", "");
                        }

                        if (oEntidadesPouchTemporal[ObjectNameTO]) { //// Si ya existe la entidad

                            if (oEntidadesPouchTemporal[ObjectNameTO].oRelations) {

                                oEntidadesPouchTemporal[ObjectNameTO].oRelations[ObjectNameFROM] = this[ObjectNameFROM];

                            } else {

                                oEntidadesPouchTemporal[ObjectNameTO].oRelations = {};
                                oEntidadesPouchTemporal[ObjectNameTO].oRelations[ObjectNameFROM] = this[ObjectNameFROM];
                            }

                        } else {

                            oEntidadesPouchTemporal[ObjectNameTO] = {
                                singular: ObjectNameTO.replace("Set", ""),
                                plural: ObjectNameTO,
                                oRelations: {}
                            };
                            oEntidadesPouchTemporal[ObjectNameTO].oRelations[ObjectNameFROM] = this[ObjectNameFROM];

                        }

                        if (oEntidadesPouchTemporal[ObjectNameFROM]) { //// Si ya existe la entidad

                            if (oEntidadesPouchTemporal[ObjectNameFROM].oRelations) {

                                oEntidadesPouchTemporal[ObjectNameFROM].oRelations[ObjectNameTO] = this[ObjectNameTO];

                            } else {

                                oEntidadesPouchTemporal[ObjectNameFROM].oRelations = {};
                                oEntidadesPouchTemporal[ObjectNameFROM].oRelations[ObjectNameTO] = this[ObjectNameTO];
                            }

                        } else {

                            oEntidadesPouchTemporal[ObjectNameFROM] = {
                                singular: ObjectNameFROM.replace("Set", ""),
                                plural: ObjectNameFROM,
                                oRelations: {}
                            };
                            oEntidadesPouchTemporal[ObjectNameFROM].oRelations[ObjectNameTO] = this[ObjectNameTO];

                        }

                    }

                });

            });

            jQuery.each(oEntidadesPouchTemporal, function(sEntitySetName, entitySetValue) {

                oEntidadesPouch.push(entitySetValue);

            });

            return oEntidadesPouch;

        },

        sap.ui.mw.Rest.prototype.findEntitySets = function(oMetadata) {

            // here we need to analyse the EDMX and identify the entity sets

            var mEntitySets,
                oPrincipals,
                oDependents;

            mEntitySets = {};
            oPrincipals = jQuery(oMetadata).find("Principal");
            oDependents = jQuery(oMetadata).find("Dependent");

            jQuery(oMetadata).find("EntitySet").each(function(iIndex, oEntitySet) {
                var aEntityTypeParts;
                var $EntitySet = jQuery(oEntitySet);
                // split the namespace and the name of the entity type (namespace could have dots inside)
                aEntityTypeParts = /((.*)\.)?(.*)/.exec($EntitySet.attr("EntityType"));
                mEntitySets[$EntitySet.attr("Name")] = {
                    "name": $EntitySet.attr("Name"),
                    "schema": aEntityTypeParts[2],
                    "type": aEntityTypeParts[3],
                    "keys": [],
                    "keysType": {},
                    "navprops": {}
                };
            });

            // helper function to find the entity set and property reference
            // for the given role name
            var fnResolveNavProp = function(sRole, bFrom) {

                var aRoleEnd,
                    sEntitySet,
                    sMultiplicity,
                    aPropRef,
                    oPrinDeps;

                aRoleEnd = jQuery(oMetadata).find("End[Role=" + sRole + "]");

                jQuery.each(aRoleEnd, function(i, oValue) {
                    if (!!jQuery(oValue).attr("EntitySet")) {
                        sEntitySet = jQuery(oValue).attr("EntitySet");
                    } else {
                        sMultiplicity = jQuery(oValue).attr("Multiplicity");
                    }
                });
                aPropRef = [];
                oPrinDeps = (bFrom) ? oPrincipals : oDependents;
                jQuery(oPrinDeps).each(function(iIndex, oPrinDep) {
                    if (sRole === (jQuery(oPrinDep).attr("Role"))) {
                        jQuery(oPrinDep).children("PropertyRef").each(function(iIndex, oPropRef) {
                            aPropRef.push(jQuery(oPropRef).attr("Name"));
                        });
                        return false;
                    }
                });
                return {
                    "role": sRole,
                    "entitySet": sEntitySet,
                    "propRef": aPropRef,
                    "multiplicity": sMultiplicity
                };
            };

            // find the keys and the navigation properties of the entity types
            jQuery.each(mEntitySets, function(sEntitySetName, oEntitySet) {
                // find the keys
                var aKeys,
                    aNavProps;
                var $EntityType = jQuery(oMetadata).find("EntityType[Name=" + oEntitySet.type + "]");
                aKeys = jQuery($EntityType).find("PropertyRef");
                jQuery.each(aKeys, function(iIndex, oPropRef) {
                    var sKeyName;
                    sKeyName = jQuery(oPropRef).attr("Name");
                    oEntitySet.keys.push(sKeyName);
                    oEntitySet.keysType[sKeyName] = jQuery($EntityType).find("Property[Name='" + sKeyName + "']").attr("Type");
                });
                // resolve the navigation properties
                aNavProps = jQuery(oMetadata).find("EntityType[Name='" + oEntitySet.type + "'] NavigationProperty");
                jQuery.each(aNavProps, function(iIndex, oNavProp) {
                    var $NavProp = jQuery(oNavProp);
                    oEntitySet.navprops[$NavProp.attr("Name")] = {
                        "name": $NavProp.attr("Name"),
                        "from": fnResolveNavProp($NavProp.attr("FromRole"), true),
                        "to": fnResolveNavProp($NavProp.attr("ToRole"), false)
                    };
                });
            });

            // return the entity sets
            return mEntitySets;

        },
        /*
        Retrieves pouch db structure from current model
         */
        sap.ui.mw.Rest.prototype.refreshSession = function() {
            var currentClass;
            currentClass = this;
            try {
                return new Promise(function(resolve, reject) {
                    try {

                        currentClass.oDataModel.refreshSecurityToken(function() {
                            resolve("OK");
                        }, function(err) {
                            reject(err);
                        }, false);

                    } catch (err) {
                        reject(err);
                        console.log(err);
                    }
                });
            } catch (err) {
                reject(err);
                console.log(err);
            }

        };

    /**
     * Invoca el plugin Logon de Kapsel con la pantalla de actualización de contraseña,
     * para el caso en que esta fue cambiada en el IDP.
     * Actualiza la contraseña y el ODataModel contenidos dentro de la instancia de clase Rest actual.
     * Actualiza sap.ui.getCore().AppContext.applicationContext.registrationContext.password,
     * sap.ui.getCore().AppContext.myRest y sap.ui.getCore().AppContext.oRest.
     * Retorna un objeto Promise con resultado exitoso o de error,
     * de acuerdo a si el usuario proporcionó o no la nueva contraseña correctamente.
     */
    sap.ui.mw.Rest.prototype.captureNewPassword = function() {
        var currentClass;
        currentClass = this;
        try {
            return new Promise(function(resolve, reject) {
                try {

                    sap.Logon.changePassword(
                        function(contextNewPwd) {
                            var oHeaders = {};
                            sap.ui.getCore().AppContext.applicationContext.registrationContext.password = contextNewPwd.registrationContext.password;
                            currentClass.pass = sap.ui.getCore().AppContext.applicationContext.registrationContext.password;
                            currentClass.sAuth = "Basic " + btoa(currentClass.user + ":" + currentClass.pass);
                            oHeaders['Authorization'] = currentClass.sAuth;
                            oHeaders['X-SMP-APPCID'] = currentClass.sAppCID;

                            //ODataModel Actual
                            currentClass.oDataModel = new sap.ui.model.odata.ODataModel(currentClass.sServiceUrl, currentClass.bJson, currentClass.user, currentClass.pass, oHeaders);
                            currentClass.oDataModel.forceNoCache(true);
                            //gateway services
                            sap.ui.getCore().AppContext.myRest = new sap.ui.mw.Rest(sap.ui.getCore().AppContext.applicationContext.applicationEndpointURL, true, currentClass.sAuth, currentClass.sAppCID, false);
                            //integration gateway services
                            sap.ui.getCore().AppContext.oRest = new sap.ui.mw.Rest(sap.ui.getCore().AppContext.applicationContext.igwEndpointURL, true, currentClass.sAuth, currentClass.sAppCID, false);

                            sap.m.MessageToast.show("La contraseña proporcionada es correcta.");
                            console.log("La contraseña proporcionada es correcta.");
                            resolve("OK");
                        },
                        function(error) {
                            sap.m.MessageToast.show("Contraseña inválida o usuario bloqueado.");
                            console.log("Contraseña inválida o usuario bloqueado.");
                            reject(error);
                        }
                    );
                } catch (err) {
                    reject(err);
                    console.log(err);
                }
            });
        } catch (err) {
            reject(err);
            console.log(err);
        }
    };

    /**
     * [Realiza una petición de tipo batch con operación tipo POST, para todos los items contenidos 
            en el arreglo recibido, colocandolos todos dentro de un mismo changeset]
     * @param  {[string]} _sPath                [colleción oData]
     * @param  {[JSON Array]} _aOData           [Arreglo con objetos JSON de lo que se insertará]
     * @param  {[boolean]} _bIsAsynchronous     [define si es asincrono o no el odata]
     * @return {[object]}                       [Objeto que coniene la función abort para la petición actual. 
                                                    Retorna false si no se ejecutó ninguna petición debido 
                                                    a que el batch estaba vacío.]
     */
    sap.ui.mw.Rest.prototype.executePostBatchRequest = function(_sPath, _aOData, _bIsAsynchronous) {
        var currentClass = this;
        var abatchOperations = [];

        return new Promise(function(resolve, reject) {
            try {
                _aOData.forEach(
                    function(oODataItem) {
                        abatchOperations.push(currentClass.oDataModel.createBatchOperation(_sPath, "POST", oODataItem, null));
                    }
                );
                currentClass.oDataModel.addBatchChangeOperations(abatchOperations);
                currentClass.oDataModel.refresh(true, false);
                currentClass.oDataModel.submitBatch(
                    function(oResponse) {
                        console.log("oResponse:");
                        console.log(oResponse);
                        resolve(oResponse);
                    },
                    function(error) {
                        console.log(error);
                        if (error.response && error.response.statusCode == 403) { //Forbidden = Expiró el CSRF Token
                            console.log("executePostBatchRequest - Renovando el CSRF Token");
                            var promiseRefresh = currentClass.refreshSession();

                            promiseRefresh.then(function(response) {
                                try {

                                    currentClass.oDataModel.submitBatch(
                                        function(oResponse) {
                                            console.log("oResponse:");
                                            console.log(oResponse);
                                            resolve(oResponse);
                                        },
                                        function(err) {
                                            console.log(err);
                                            if (err.response) {
                                                reject(err.response.body);
                                            } else {
                                                reject(err);
                                            }
                                        },
                                        _bIsAsynchronous,
                                        true);
                                } catch (secondSendingError) {
                                    console.log("Error al intentar el envio por 2nda ocasión: " + secondSendingError);
                                    reject(secondSendingError);
                                }
                            }).catch(function(error) {
                                console.log("No fue posible completar el refresh de CSRF token: " + error);
                                reject(error);
                            });
                        } else {
                            if (error.response) {
                                reject(error.response.body);
                            } else {
                                reject(error);
                            }
                        }
                    },
                    _bIsAsynchronous,
                    true
                );
            } catch (ex) {
                console.log(ex);
                reject(ex);
            }
        });
    };

    /**
     * [Realiza una petición de tipo batch con operación tipo MERGE, para todos los items contenidos 
            en el arreglo de llaves recibido, colocandolos todos dentro de un mismo changeset.]
     * @param  {[string]} _sPath                [colleción oData]
     * @param  {[JSON Array]} _aOData           [Arreglo con objetos JSON de lo que se insertará]
     * @param  {[boolean]} _bIsAsynchronous     [define si es asincrono o no el odata]
     * @param  {[string Array]} _aODataKeys     [Arreglo con el identificador único de cada uno de los items 
                                                    del arreglo _aOData. Para llaves de un solo campo, 
                                                    basta con colocar el valor entre comillas simples. 
                                                    Para llaves compuestas,
                                                    colocarlas en el formato requerido por OData.
                                                    Ej.: "CustomerIdCRM='1234',LoanRequestIdCRM='1234'"]
     * @return {[object]}                       [Objeto que coniene la función abort para la petición actual. 
                                                    Retorna false si no se ejecutó ninguna petición debido 
                                                    a que el batch estaba vacío.]
     */
    sap.ui.mw.Rest.prototype.executeMergeBatchRequest = function(_sPath, _aOData, _bIsAsynchronous, _aODataKeys) {
        var currentClass = this;
        var abatchOperations = [];
        var sPathKey = "";
        var oODataItem;

        return new Promise(function(resolve, reject) {
            if (_aODataKeys && _aODataKeys.length > 0 && _aODataKeys.length == _aOData.length) {
                try {

                    for (var i = 0; i < _aOData.length; i++) {
                        sPathKey = _sPath + "(" + _aODataKeys[i] + ")";
                        oODataItem = _aOData[i];
                        abatchOperations.push(currentClass.oDataModel.createBatchOperation(sPathKey, "MERGE", oODataItem, null));
                    }

                    currentClass.oDataModel.addBatchChangeOperations(abatchOperations);
                    currentClass.oDataModel.refresh(true, false);
                    currentClass.oDataModel.submitBatch(
                        function(oResponse) {
                            console.log("oResponse:");
                            console.log(oResponse);
                            resolve(oResponse);
                        },
                        function(error) {
                            console.log(error);
                            if (error.response && error.response.statusCode == 403) { //Forbidden = Expiró el CSRF Token
                                console.log("executePostBatchRequest - Renovando el CSRF Token");
                                var promiseRefresh = currentClass.refreshSession();

                                promiseRefresh.then(function(response) {
                                    try {

                                        currentClass.oDataModel.submitBatch(
                                            function(oResponse) {
                                                console.log("oResponse:");
                                                console.log(oResponse);
                                                resolve(oResponse);
                                            },
                                            function(err) {
                                                console.log(err);
                                                if (err.response) {
                                                    reject(err.response.body);
                                                } else {
                                                    reject(err);
                                                }
                                            },
                                            _bIsAsynchronous,
                                            true);
                                    } catch (secondSendingError) {
                                        console.log("Error al intentar el envio por 2nda ocasión: " + secondSendingError);
                                        reject(secondSendingError);
                                    }
                                }).catch(function(error) {
                                    console.log("No fue posible completar el refresh de CSRF token: " + error);
                                    reject(error);
                                });
                            } else {
                                if (error.response) {
                                    reject(error.response.body);
                                } else {
                                    reject(error);
                                }
                            }
                        },
                        _bIsAsynchronous,
                        true
                    );
                } catch (ex) {
                    console.log(ex);
                    reject(ex);
                }
            } else {
                var sError = "El arreglo de llaves debe corresponder exáctamente " +
                    "con el arreglo de elementos OData a actualizar.";
                reject(sError);
            }
        });
    };

})();
