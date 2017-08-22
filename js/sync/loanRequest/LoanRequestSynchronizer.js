(function() {

    "use strict";
    jQuery.sap.declare("sap.ui.sync.LoanRequest");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.helper.Schema");
    jQuery.sap.require("js.helper.SyncResults");
    jQuery.sap.require("js.base.ObjectBase");
    jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");




    sap.ui.base.Object.extend('sap.ui.sync.LoanRequest', {
        constructor: function(_dataDB, _syncDB) {

            var oSchemaDB;

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
            this.syncDB = new sap.ui.db.Pouch(_syncDB);
            this.syncDB.setSchema(oSchemaDB.getSyncDBSchema());

            //TRAINING
            this.notiDB = new sap.ui.db.Pouch("notiDB");
            this.notiDB.setSchema(oSchemaDB.getNotiDBSchema());


            this.oDictionary = new sap.ui.helper.Dictionary();
            this.loggerSMPComponent = "LOANREQUEST_SYNC";
            this.ERROR = "ERROR";
            this.OK = "OK";
            this.BUSINESSERROR = "BUSINESSERROR";
            this.COMPLETED = "COMPLETED";
            this.oSyncResultHelper = new sap.ui.helper.SyncResults();

        }
    });




   


    /**
     * [sendQueue - Entry point for the sending of the Loan Request sync queue]
     * @return {[Promise]} [Main promise]
     */
    sap.ui.sync.LoanRequest.prototype.sendQueue = function() {

        this.handleTrace("Inicio sincronización LoanRequest", "****************");


        return new Promise(function(resolveMasterPromise) {

            ///////// Retrieve all loan requests

            var oNow;

            this.handleTrace("SLR1", "Inicio de sincronización || " + new Date());

            oNow = moment().format('DD/MM/YYYY HH:mm:ss');

            this.retrieveLoanRequests().then(

                function(result) {

                    var aPromises;

                    aPromises = this.generateSendIndividualPromises(result, resolveMasterPromise);

                    Promise.all(aPromises).then(this.handleOKResult.bind(this, resolveMasterPromise, oNow))
                        .catch(function(error) {

                            this.handleError("SLR1", "Error al resolver Promise All ", error);
                            resolveMasterPromise(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, "", "", "¡Ups!, Ocurrio un error SLR1-PA al sincronizar Oportunidades, por favor comunicate con mesa de servicio. ", "")));

                        }.bind(this));

                }.bind(this))

            .catch(function(error) {
                this.handleError("SLR1", "Error general de sincronización ", error).then(resolveMasterPromise(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, "", "", "¡Ups!, Ocurrio un error SLR1 al sincronizar Oportunidades, por favor comunicate con mesa de servicio. ", ""))))
            }.bind(this));

        }.bind(this));

    };

    /**
     * [retrieveLoanRequests Retrieves all LoanRequests from PouchDB]
     * @return {[Promise]} [Return promise from the Query]
     */
    sap.ui.sync.LoanRequest.prototype.retrieveLoanRequests = function() {

        this.handleTrace("SLR2", "");
        return this.syncDB.get(this.oDictionary.oQueues.LoanRequest);

    };

    /**
     * [generateSendIndividualPromises Generate individual promises ]
     * @param  {[Array]} _aResults            [Records from SyncQueue]
     * @param  {[Promise]} resolveMasterPromise [Master promise to terminate the process in case no results were found]
     * @return {[Array]}                      [Array with individual promises]
     */
    sap.ui.sync.LoanRequest.prototype.generateSendIndividualPromises = function(_aResults, resolveMasterPromise) {

        this.handleTrace("SLR3", "");

        var i;
        var aPromises;
        var results;

        aPromises = [];
        results = [];

        results = this.validatePouchResults(_aResults, "RequestQueueLoanRequestSet");



        results.forEach(function(result) {

            if (result.requestStatus !== this.oDictionary.oRequestStatus.Sent) {
                aPromises.push(this.generateSinglePromise(result));
            }


        }.bind(this));

        if (results.length === 0 || aPromises.length === 0) {
            ////// No results to process
            //resolveMasterPromise(this.oSyncResultHelper.initializeSynchronizingResults());
            this.handleTrace("SLR3", "No records in SyncQueue to process");
        }

        return aPromises;

    };

    /**
     * [generateSinglePromise Generates the individual promise for synchronization]
     * @param  {[Object]} _oQueueItem [Item from the sync queue]
     * @return {[Promise]}             [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.generateSinglePromise = function(_oQueueItem) {



        return new Promise(function(resolveSendPromise) {

                this.handleTrace("SLR4", _oQueueItem.id);

                ///// Deserialize
                var oLoanRequestSerializer;

                oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
                oLoanRequestSerializer.deSerialize(_oQueueItem.id, false, true)
                    .then(this.sendRequest.bind(this, _oQueueItem, resolveSendPromise))
                    .catch(function(sError) {

                        this.handleError("SLR4", "Error al enviar la petición de la solicitud. ", sError);
                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "¡Ups!, Ocurrio un error SLR4A al sincronizar Oportunidades, por favor comunicate con mesa de servicio.", _oQueueItem.productID))
                        resolveSendPromise(this.Error);

                    }.bind(this));

            }.bind(this))
            .catch(function(sError) {

                this.handleError("SLR4", "Error al deserializar la solicitud. ", sError);
                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "¡Ups!, Ocurrio un error SLR4B al sincronizar Oportunidades, por favor comunicate con mesa de servicio.", _oQueueItem.productID))

            }.bind(this));

    };

    /**
     * [sendRequest Makes the creation at OData level]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} result              [Item retrieved from PouchDB]
     */
    sap.ui.sync.LoanRequest.prototype.sendRequest = function(_oQueueItem, _resolveSendPromise, result) {

        var ObjectBase;
        ObjectBase = new sap.ui.mw.ObjectBase();
        ObjectBase.deletePropertyFromObject(result, "IsEntityInQueue");

        this.handleTrace("SLR5", _oQueueItem.id + " Payload: " + JSON.stringify(result));

       

        this.resultLoanRequest(_oQueueItem,result)
            .then(this.processODataResponse.bind(this, _oQueueItem, _resolveSendPromise))
            .catch(this.processODataResponseError.bind(this, _oQueueItem, _resolveSendPromise));


    };

    /**
     * [processODataResponse Process OK result from OData call]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} result              [Result from OData call]
     
     */
    sap.ui.sync.LoanRequest.prototype.processODataResponse = function(_oQueueItem, _resolveSendPromise, result) {

        this.handleTrace("SLR6", _oQueueItem.id);
        if (result.hasOwnProperty("statusCode")) {
            if (result.statusCode) {
                this.handleTrace("SLR6", _oQueueItem.id + " HTTP Status Code: " + result.statusCode);
            }
        }


        

        _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.Sent;

       
        this.updateSyncQueue(_oQueueItem).then(

            // Aqui

            this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.OK, _oQueueItem.id, _oQueueItem.requestDescription, "OK", _oQueueItem.productID))
            .then(this.sendNotification(_oQueueItem, result, _resolveSendPromise))
            // .then(_resolveSendPromise(this.OK))

        ).catch(function(sError) {
            this.handleError.bind("SLR6", "Error al actualizar SynC Queue a status 'Sent' de la solicitud  " + _oQueueItem.id, sError);
            _resolveSendPromise(this.ERROR);
        }.bind(this));



    };


    /*TRAINING - Se emula base de datos de notificaciones
     * id - LoanRequestIdMD
     * objectDMID - LoanRequestIdMD, se requiere para eliminar de PouchDB
     */
    sap.ui.sync.LoanRequest.prototype.sendNotification = function(_oQueueItem, _result, _resolveSendPromise) {
        return new Promise(function(resolveSendNotification, rejectSendNotification) {
            jQuery.sap.require("js.buffer.notification.LoanRequestSystemNotificationBuffer");
            var oNotificationBuffer = new sap.ui.buffer.LoanRequestSystemNotification("notiDB");
            var message;      
            if (_result.statusText === "Created") {
                message="SOLICITUD CREADA Y/O MODIFICADA CORRECTAMENTE";
              
            }else{
                message="la oportunidad no ha sido actualizada";
            }
            var oRequest = {
                id: _oQueueItem.id,
                notificationID: "12345",
                dateTime: "2017-07-19T21:05:27.280Z",
                status: 1,
                messageID: 126,
                message: message,
                objectTypeID: "4",
                objectDMID: _result.LoanRequestIdMD,
                objectCRMID: _result.LoanRequestIdCRM,
                attended: "1",
                insuranceDMID: _oQueueItem.id
            };

            oNotificationBuffer.postRequest(oRequest)
                .then(function() {
                    _resolveSendPromise("ok");
                });
        });
    };

    /*TRAINING - Se emula respuesta create
     */
    sap.ui.sync.LoanRequest.prototype.resultLoanRequest = function(_oQueueItem,_result) {
        return new Promise(function(resolveUpdatePromise) {

        if(_result.LoanRequestIdCRM===""){
                var arrayLinkSet = _result.LinkSet;
                 delete _result.LinkSet;
                _result.GeneralLoanRequestData.Cycle = 0;
                 //sap.ui.getCore().AppContext.myRest.create(_oQueueItem.requestUrl, _result, true).then(function(resp){resolveUpdatePromise(resp)})
                sap.ui.getCore().AppContext.myRest.create(_oQueueItem.requestUrl, _result, true).then(
                    function(result) {
                        arrayLinkSet;
                        for(var i=0; i<arrayLinkSet.length; i++){

                        var linkSet = {
                            "CustomerIdCRM": "",
                            "LoanRequestIdCRM": "",
                            "CustomerIdMD": "",
                            "LoanRequestIdMD": "",
                            "CollaboratorID": "Genesis",
                            "GroupLoanData": {
                                "RoleInTheGroupId": "",
                                "CreditAmount": 0,
                                "AuthorizedAmount": 0,
                                "RejectionCauseId": ""
                            },
                            "IndividualLoanData": {
                                "YearsOnHouse": 10,
                                "MonthsOnHouse": 5,
                                "YearsOnLocal": 4,
                                "MonthsOnLocal": 3,
                                "TotalIncomeAmount": 60000,
                                "TotalOutcomeAmount": 15000,
                                "FeeEnabledToPay": 10000,
                                "LoanDestiny": "1",
                                "IsCreditGuaranteeWarrant": true,
                                "RequiredAmount": 30000,
                                "ProposedAmount": 30000,
                                "ProposedFrequency": "Z1422",
                                "ProposedFee": 3000,
                                "ProposedPeriod": 10,
                                "MaxLiquidity": 2500,
                                "PaymentFrequency": "PaymentFrequency 1",
                                "MaxRecurrentAmount": ""
                            },
                            "GeneralLoanData": {
                                "InsuranceAmount": 3000,
                                "ControlListsResult": 1,
                                "RiskLevel": "1",
                                "SavingsAmount": 9000,
                                "DispersionMediumId": "1",
                                "DispersionChannelId": "3",
                                "SemaphoreResultFilters": 2
                            },
                            "AvailableToFilter": "",
                            "GrpCrossSellData": {
                                "BusinessIncome": 0,
                                "SpouseContribution": 0,
                                "FamilyContribution": 0,
                                "MoneyTransfer": 0,
                                "OtherIncome": 0,
                                "TotalIncome": 0,
                                "BusinessExpenses": 0,
                                "HouseholdExpenses": 0,
                                "ServiceAndRentExpenses":0,
                                "CompartamosFee": 0,
                                "OtherDebts": 0,
                                "TotalExpenses": 0,
                                "TotalMonthlyLiquidity": 0,
                                "MaxAllowedLiquidity": 0,
                                "RequiredAmount": 0,
                                "FeeEnabledToPay": 0,
                                "LoanDestiny": "LoanDestiny 1"
                            }
                        };

                        linkSet.LoanRequestIdCRM = result.data.LoanRequestIdCRM;
                        linkSet.LoanRequestIdMD = result.data.LoanRequestIdMD;
                        linkSet.CustomerIdCRM = arrayLinkSet[i].CustomerIdCRM;
                        linkSet.LoanRequestIdMD = arrayLinkSet[i].CustomerIdMD;
                        sap.ui.getCore().AppContext.myRest.create("/LinkSet", linkSet, true).then(function(resp){resolveUpdatePromise(resp)});

                        }
                        

                       
                    }
                )
        }else{

           var oResults = {
                statusCode: 201,
                statusText: "Modificado",
                LoanRequestIdMD: _result.LoanRequestIdMD,
                LoanRequestIdCRM: _result.LoanRequestIdCRM
            };
            resolveUpdatePromise(oResults);
        }
        }.bind(this));

    };



    /**
     * [updateSyncQueue: Updates the sync Queue once the process has completed]   
     * @param  {[Object]} _oQueueItem [Item from the sync queue]
     * @return {[Promise]}             [Promise to update the Sync Queue]
     */
    sap.ui.sync.LoanRequest.prototype.updateSyncQueue = function(_oQueueItem) {


        return new Promise(function(resolveUpdatePromise, rejectUpdatePromise) {

            this.handleTrace("SLR7", _oQueueItem.id);

            this.syncDB.post(this.oDictionary.oQueues.LoanRequest, _oQueueItem)
                .then(resolveUpdatePromise(this.OK))
                .catch(rejectUpdatePromise(this.ERROR));

           

        }.bind(this));

    };

    /**
     * [clearBusinessError Removes business error record from PouchDB (if any)]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     */
    sap.ui.sync.LoanRequest.prototype.clearBusinessError = function(_oQueueItem, _resolveSendPromise) {



        this.syncDB.getById(this.oDictionary.oErrors.LoanRequest, _oQueueItem.id)
            .then(function(result) { /// Confirmar si ya existe el registro del error, hacer upsert

                this.handleTrace("SLR8", _oQueueItem.id);

                var aResults;
                aResults = this.validatePouchResults(result, "BusinessErrorLoanRequestSet");

                if (aResults > 0) {
                    this.syncDB.delete(this.oDictionary.oErrors.LoanRequest, aResults[0].id, aResults[0].rev)
                        .then(this.handleTrace("COMPLETED: ", _oQueueItem.id))
                        .then(_resolveSendPromise(this.COMPLETED));
                } else {
                    this.handleTrace("COMPLETED: ", _oQueueItem.id);
                    _resolveSendPromise(this.COMPLETED);
                }

            }.bind(this))
            .catch(function(sError) {

                this.handleError("SLR8", "Error al eliminar el Business Error de LoanRequest de la solicitud  " + _oQueueItem.id, sError);
                _resolveSendPromise(this.ERROR);

            }.bind(this));



    };


    /**
     * [processODataResponseError Handler to process OData response in case of an error]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} results             [Results from OData Call (Error)]
     */
    sap.ui.sync.LoanRequest.prototype.processODataResponseError = function(_oQueueItem, _resolveSendPromise, results) {



        try {


            this.handleTrace("SLR9", "Error al enviar la petición OData para la solicitud: " + _oQueueItem.id + " Detalle: " + results);

           

            var sErrorMessage;
            var oErrorData;



            sErrorMessage = this.retrieveBusinessError(results);

            if (sErrorMessage !== "") {

                this.handleTrace("SLR9", "Business error encontrado: " + sErrorMessage);

                oErrorData = {
                    id: _oQueueItem.id,
                    errorDetail: "Error al enviar la solicitud '" + _oQueueItem.requestDescription + "' : " + sErrorMessage,
                    type: _oQueueItem.productID
                };

                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.BUSINESSERROR, _oQueueItem.id, _oQueueItem.requestDescription, sErrorMessage, _oQueueItem.productID));
                this.updateBusinessErrorStatus(oErrorData, _oQueueItem, _resolveSendPromise);


            } else {

                ////  Procesamiento de errores técnicos
                _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.Error;

                this.syncDB.update(this.oDictionary.oQueues.LoanRequest, _oQueueItem.id, _oQueueItem)
                    .then(

                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "¡Ups! No se logró cargar toda la información. Por favor, intenta de nuevo.", _oQueueItem.productID))
                        .then(_resolveSendPromise(this.ERROR))
                    )
                    .catch(this.handleError.bind(this, "SLR9", "Error al actualizar el status del Queue a 'Error' para la solicitud  " + _oQueueItem.id))
                    .then(_resolveSendPromise(this.ERROR));
            }


        } catch (error) {
            this.handleError("SLR9", "Error al procesar el error de la solicitud " + _oQueueItem.id, error);
            _resolveSendPromise(this.ERROR)
        }

    };

    /**
     * [updateBusinessErrorStatus Insert or update business error from synchronization]
     * @param  {[Object]} _oBusinessError     [Business error to update]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     */
    sap.ui.sync.LoanRequest.prototype.updateBusinessErrorStatus = function(_oBusinessError, _oQueueItem, _resolveSendPromise) {

        _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.BusinessError;
        this.syncDB.update(this.oDictionary.oQueues.LoanRequest, _oQueueItem.id, _oQueueItem)
            .then(_resolveSendPromise(this.BUSINESSERROR))
            .catch(this.handleError.bind(this, "SLR10", "Error al actualizar Business Error  " + _oQueueItem.id + "Detalle:" + _oBusinessError));



    };


    /**
     * [handleTrace Handle sync trace]
     * @param  {[String]} _sSyncStep  [Sync step key]
     * @param  {[Object]} _oTraceData [Trace  description]
     * @param  {[Boolean]} _bIsError   [Boolean to determine if the trace is an error]
     * @param  {[String]} sError      [Error (in case of an error)]
     * @return {[Promise]}             [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.handleTrace = function(_sSyncStep, _oTraceData, _bIsError, sError) {
       
        return this.oSyncResultHelper.handleTrace(_sSyncStep, _oTraceData, sError);


    };

    /** 
     * [handleError Handle synchronization error]

     * @param  {[String]} _sSyncStep  [Sync step key]
     * @param  {[Object]} _oTraceData [Trace  description]
     * @param  {[Boolean]} _bIsError   [Boolean to determine if the trace is an error]
     * @param  {[String]} sError      [Error (in case of an error)]
     * @return {[Promise]}             [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.handleError = function(_sSyncStep, _oTraceData, sError) {

        return this.oSyncResultHelper.handleError(_sSyncStep, _oTraceData, sError);
    };

    /**
     * [validatePouchResults Validates if a PouchDB result contains a specific collection]
     * @param  {[Array]} _aArray      [Results from PouchDB query]
     * @param  {[String]} _sCollection [EntitySet to evaluate]
     * @return {[Arrays]}              [Array with the results]
     */
    sap.ui.sync.LoanRequest.prototype.validatePouchResults = function(_aArray, _sCollection) {

        if (_aArray.hasOwnProperty(_sCollection)) {
            if (Array.isArray(_aArray[_sCollection])) {
                return _aArray[_sCollection];
            }
        }
        return [];

    };


    /**
     * [retrieveBusinessError Retrieves a business error, if exists, from an error condition]
     * @param  {[object]} error [Error from the sync process]
     * @return {[string]}       [Business Error / Empty]
     */
    sap.ui.sync.LoanRequest.prototype.retrieveBusinessError = function(error) {

        var sErrorMessage, oErrorService;
       


        sErrorMessage = "";

        try {

            oErrorService = JSON.parse(error);

            if (oErrorService.error.innererror.errordetails !== "undefined") {
                sErrorMessage = oErrorService.error.innererror.errordetails[0].message;
                if (sErrorMessage) {
                    if (sErrorMessage !== "") {
                        sap.m.MessageToast.show("Se ha producido un error: " + sErrorMessage);
                        return sErrorMessage;
                    }
                }

            }

        } catch (catchError) {

            //// Nada debe pasar aqui, este error es solo si el mensaje de error que viene del servicio
            /// es de negocio
            return "";

        }



    };


    /**
     * [deleteBusinessError Deletes business error from PouchDB]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @return {[Promise]}                     [Promise with the results from Business Error]
     */
    sap.ui.sync.LoanRequest.prototype.deleteBusinessError = function(_oQueueItem, _resolveSendPromise) {


        return this.syncDB.getById(this.oDictionary.oErrors.LoanRequest, _oQueueItem.id)
            .then(function(result) { /// Confirmar si ya existe el registro del error, hacer upsert

                if (!_resolveSendPromise) {
                    _resolveSendPromise = function() {};
                }

                var aResults;
                aResults = this.validatePouchResults(result, "BusinessErrorLoanRequestSet");

                if (aResults.length > 0) {

                    this.syncDB.delete(this.oDictionary.oErrors.LoanRequest, result.BusinessErrorLoanRequestSet[0].id, result.BusinessErrorLoanRequestSet[0].rev)
                        .then(_resolveSendPromise(this.ERROR));

                } else {
                    _resolveSendPromise(this.ERROR);
                }

            }.bind(this));


    };


    /**
     * [addResults Sumarize synchronization results]
     * @param {[Array]} _aResults [Results from synchronization]
     */
    sap.ui.sync.LoanRequest.prototype.addResults = function(_aResults) {

        var oResults;
        oResults = this.oSyncResultHelper.initializeSynchronizingResults();
        oResults.resultsTotal = _aResults.length;

        _aResults.forEach(function(sResult) {

            switch (sResult) {
                case this.COMPLETED:
                    oResults.resultsOK = oResults.resultsOK + 1;
                    break;

                case this.BUSINESSERROR:
                    oResults.businessError = oResults.businessError + 1;
                    break;

                default:
                    oResults.resultsError = oResults.resultsError + 1;
                    break;


            }

        }.bind(this));

        return _aResults;

    };

    /**
     * [handleOKResult Handle numeric results from synchronization]
     * @param  {[Promise]} _resolveMasterPromise [Master promise]
     * @param  {[Object]} oNow                  [Synchronization start time]
     * @param  {[Array]} results               [Results]
     */
    sap.ui.sync.LoanRequest.prototype.handleOKResult = function(_resolveMasterPromise, oNow, results) {

        var oThen;

        oThen = moment().format('DD/MM/YYYY HH:mm:ss');

        this.handleTrace("SLR01", "Fin de sincronización, Tiempo transcurrido: " + moment.utc(moment(oThen, "DD/MM/YYYY HH:mm:ss").diff(moment(oNow, "DD/MM/YYYY HH:mm:ss"))).format("mm:ss"));

       

        _resolveMasterPromise("OK");

    };




    /*
        
    Confirmation (New numbers between steps will be added with characters )
        
        CLR01 confirmQueue
        CLR02 createIndividualPromises
        CLR03 generateNotificationPromise
        CLR04 reviewFormerNotificationError
        CLR05 retryNotificationUpdate
        CLR06 confirmNotification
        CLR07 verifyNotificationContent
        CLR08 deleteLoanFromDataDB
        
        /// Particular for LoanRequest
        CLR09 deleteCustomerRelationships
        CLR10 deleteEntityCustomer
        CLR11 deleteGuarantorRelationships
        CLR12 deleteEntityGuarantor
        /// Particular for LoanRequest

        CLR13 deleteLoanFromSyncDB
        CLR14 updateAttended
        CLR15 saveUpdateError
        CLR16 processErrorNotification
        CLR17 upsertErrorNotificationData
        

     */



    //******************************** Proceso de confirmación de notificaciones ********************************

    /**
     * [confirmQueue Entry method for confirmations]
     * @return {[Promise]} [Master promise for confirmation]
     */
    sap.ui.sync.LoanRequest.prototype.confirmQueue = function() {



        return new Promise(function(resolve, reject) {

                var oNow;

                oNow = moment().format('DD/MM/YYYY HH:mm:ss');

                this.handleTrace("CLR01", "Inicio de confirmación || " + new Date());

                this.handleTrace("CLR01", "Obtener notificaciones de tipo Loan Request");

                //// 00000000000000 Regresar filtros  000000000000000000//
                // sap.ui.getCore().AppContext.oRest.read("/SystemNotifications", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "' and attended eq '0' and objectTypeID eq '2'", true)
                    //sap.ui.getCore().AppContext.oRest.read("/SystemNotifications", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "'", true)
                    //// 00000000000000 Regresar filtros 000000000000000000//

                //TRAINING - Consulta de notifiaciones de sistema en PouchDB
                jQuery.sap.require("js.buffer.notification.LoanRequestSystemNotificationBuffer");
                var oNotificationBuffer = new sap.ui.buffer.LoanRequestSystemNotification("notiDB");

                oNotificationBuffer.searchInNotiDB(this.oDictionary.oQueues.LoanRequestSystemNotification)
                .then(function(result) {
                        var oMainPromise;
                        oMainPromise = this.createIndividualPromises(resolve, result); //.bind(this);
                        oMainPromise.then(
                            function(result) {
                                Promise.all(result)
                                    .then(this.processResults.bind(this, resolve, oNow))
                                    .catch(function(error) {
                                        this.handleError.bind(this, "CLR01", "¡Ups!, Ocurrio un error CLR01 al sincronizar Oportunidades, por favor comunicate con mesa de servicio." + error);
                                        resolve(this.ERROR);
                                    }.bind(this));
                            }.bind(this));

                    }.bind(this))
                    .catch(function(error) {
                        this.handleError("CLR01", "Error general en la confirmación de solicitudes. Error al obtener las notificaciones de oportunidades", error);
                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.ERROR, "", "", "¡Ups! No se logró descargar toda la información de Oportunidades. Por favor, intenta de nuevo. ", "NOTIFICATION"));
                        resolve(this.ERROR);
                    }.bind(this));


            }.bind(this))
            .catch(function(error) {
                this.handleError("CLR01a", "Error general en la confirmación de solicitudes. Error al obtener las notificaciones de oportunidades", error);
                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.ERROR, "", "", "¡Ups! No se logró descargar toda la información de Oportunidades. Por favor, intenta de nuevo.", "NOTIFICATION"));
                resolve(this.ERROR);
            }.bind(this));

    };

    /**
     * [processResults Final processing for confirmation]
     * @param  {[type]} resolve [Master promise to resolve]
     * @param  {[type]} oNow    [Date time of process start]
     * @param  {[type]} results [Results from confirmation]
     
     */
    sap.ui.sync.LoanRequest.prototype.processResults = function(resolve, oNow, results) {

        var bBusinessError;
        var oThen;
        bBusinessError = false;

        results.forEach(function(result) {
            result == this.BUSINESSERROR ? bBusinessError = true : bBusinessError = false;
        }.bind(this));

        oThen = moment().format('DD/MM/YYYY HH:mm:ss');

        this.handleTrace("CLR01", "Fin de confirmación, Tiempo transcurrido: " + moment.utc(moment(oThen, "DD/MM/YYYY HH:mm:ss").diff(moment(oNow, "DD/MM/YYYY HH:mm:ss"))).format("mm:ss"));

        bBusinessError == true ? resolve(this.BUSINESSERROR) : resolve(this.OK);


    };


    /**
     * [createIndividualPromises Take results and generate individual promises for confirmation]
     * @param  {[Function]} resolve [Master promise resolve]
     * @param  {[Object]} oResult [Result of pending confirmations]
     * @return {[Promise]}         [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.createIndividualPromises = function(resolve, oResult) {

        this.handleTrace("CLR02", "Creación de promesas individuales");

        return new Promise(function(resolveIndividual) {

                var aPromises = [];

                if (oResult.results.length > 0) {

                    oResult.results.forEach(function(entry) {

                        aPromises.push(this.generateNotificationPromise(entry));

                    }.bind(this));

                    resolveIndividual(aPromises);

                } else {
                    this.handleTrace("CLR02", "La lista de notificaciones viene vacia");
                    resolveIndividual(aPromises);
                }



            }.bind(this))
            .catch(function(error) {
                this.handleError("CLR02", "Error al generar las notificaciones individuales de oportunidades", error);
            }.bind(this));
    };

    /**
     * [generateNotificationPromise Generation of individual confirmation promise]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Notification Promise]
     */
    sap.ui.sync.LoanRequest.prototype.generateNotificationPromise = function(oNotification) {

        this.handleTrace("CLR03", "Generación de promesa individual : " + oNotification.notificationID + " Notification: " + JSON.stringify(oNotification));

        return new Promise(function(resolve, reject) {

            /// Validar si existe error 
            this.reviewFormerNotificationError(oNotification)
                .then(function(result) {

                    if (result === "NormalProcessing") {
                        /////// Continuar procesamiento normal
                        this.confirmNotification(oNotification).then(function(msg) {
                            resolve(msg);
                        });

                    } else {
                        this.handleTrace("CLR03", "Termina OK:" + oNotification.notificationID);
                        resolve(this.OK);
                    }

                }.bind(this))
                .catch(function(error) {
                    this.handleError("CLR03", "Error al validar notificación previa ", error);
                    resolve(this.ERROR);

                }.bind(this));

        }.bind(this));
    };

    /**
     * [reviewFormerNotificationError Review if there was an Error associated to this notification in a previous sync]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.reviewFormerNotificationError = function(oNotification) {

        return new Promise(function(resolve) {


            this.handleTrace("CLR04", "Revision de error previo para Notificacion : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            this.syncDB.getById(this.oDictionary.oErrors.Notification, oNotification.notificationID)
                .then(function(oResult) {

                    if (oResult.SystemErrorNotificationSet.length === 0) {
                        /// Realizar procesamiento normal de la notificación 
                        resolve("NormalProcessing");

                    } else {

                        /// Existe un error previo para la actualización del status de la notificación
                        /// hacia el status "Attended", como la notificación ya fue procesada, no procesar
                        /// nuevamente
                        this.retryNotificationUpdate(oNotification, oResult).then(resolve(this.ERROR));
                    }


                }.bind(this));

        }.bind(this));



    }

    /**
     * [retryNotificationUpdate Make Update to notification in IGW in case the original update had failed]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.retryNotificationUpdate = function(oNotification, oResult) {
        return new Promise(function(resolve, reject) {

            this.handleTrace("CLR05", "Reintentar actualización del status de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " (a Attended) ");

            var oBody;
            oBody = {
                attended: "1"
            };

            sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
                .then(function(oResult, oNotification, result) {

                    /// Eliminar el registro de error de notificación de PouchDB
                    this.syncDB.delete(this.oDictionary.oErrors.Notification, oResult.SystemErrorNotificationSet[0].id, oResult.SystemErrorNotificationSet[0].rev);
                    this.handleTrace("CLR05", "Solicitud actualizada correctamente en IGW" + oNotification.id)
                        .then(resolve(this.OK))

                }.bind(this, oResult, oNotification))
                .catch(function(error) {
                    this.handleError("CLR05", "Error en la actualización del status de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " (a Attended) ", error).then(resolve(this.ERROR))
                }.bind(this))
        }.bind(this));
    };

    /**
     * [confirmNotification Review if there is a record to process for the current notification]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.confirmNotification = function(oNotification) {


        this.handleTrace("CLR06", "Revisa si LoanRequest existe en DataDB para Notificacion : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(confirmNotificationResolve, confirmNotificationReject) {

            this.dataDB.getById(this.oDictionary.oTypes.LoanRequest, oNotification.objectDMID)
                .then(this.verifyNotificationContent.bind(this, oNotification, confirmNotificationResolve))
                .catch(function(error) {
                    this.handleError.bind(this, "CLR06", "Error al verificar el contenido de la notificación  " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                    confirmNotificationResolve(this.ERROR);
                }.bind(this));
        }.bind(this));
    };

    /**
     * [verifyNotificationContent Verifiy the result inside the notification for further processing]
     * @param  {[Object]} oNotification [Notification to process]
     * @param  {[Function]} resolve       [Resolve for main individual promise]
     * @param  {[Object]} oResult       [Object from PouchDB]
     */
    sap.ui.sync.LoanRequest.prototype.verifyNotificationContent = function(oNotification, resolve, oResult) {

        this.handleTrace("CLR07", "Verificar información contenida en la notificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        if (oResult.LoanRequestSet.length > 0) {

            ////// Verificar como se procesara la notificación
            if (oNotification.message.toUpperCase() === "SOLICITUD CREADA Y/O MODIFICADA CORRECTAMENTE" || oNotification.message.toUpperCase() === "SOLICITUD MODIFICADA EXITOSAMENTE") {
                /// Camino normal

                ////Introducir Customers en Link     
                this.retrieveBPsToLink(oResult, "Customer", "Link");
                this.retrieveBPsToLink(oResult, "Guarantor", "LinkGuarantorSet");

                this.handleTrace("CLR07", "La notificación reporta exito en la Creación/Modificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

                this.deleteLoanFromDataDB(oNotification, oResult)
                    .then(function(result) {
                        this.deleteLoanFromSyncDB(oNotification)
                            .then(function(result) {
                                this.updateAttended(oNotification)
                                    .then(
                                        this.handleTrace("CLR07", "COMPLETED: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                                        .then(resolve(this.OK)));
                            }.bind(this));
                    }.bind(this))
                    .catch(function(error) {
                        this.handleError("CLR07", "Error al eliminar la solicitud de DataDB/SyncDB " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
                            .then(resolve(this.ERROR));
                    }.bind(this, oNotification));

            } else {
                /// Else, notification not OK, guardar Business Error  :::::::::

                this.handleTrace("CLR07", "La notificación reporta un error: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.BUSINESSERROR, oNotification.objectDMID, this.getLoanRequestDescription(oResult), oNotification.message.toUpperCase(), oResult.LoanRequestSet[0].ProductID))
                    .then(resolve(this.BUSINESSERROR))

               
                /// Resuelve BUSINESSERROR para marcarla y mostrarla en la colección de errores

            }



        } else {
            this.handleTrace("CLR07", "No existe en DataDB, LoanRequest para notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
            resolve(this.OK);
        }


    };


    sap.ui.sync.LoanRequest.prototype.retrieveBPsToLink = function(oResult, sEntity, sLinkEntity) {

            var aCustomerIDs;
            aCustomerIDs = [];

            var sEntitySet = sEntity + "Set";
            var sLinkEntitySet = sLinkEntity + "Set";

            if (oResult.hasOwnProperty(sEntitySet)) {
                if (oResult[sEntitySet].hasOwnProperty("length")) {

                    oResult[sEntitySet].forEach(function(aCustomerIDs, oCustomer) {

                        aCustomerIDs.push(oCustomer.CustomerIdMD);

                    }.bind(this, aCustomerIDs));

                }
            }

            if (oResult.hasOwnProperty(sLinkEntitySet)) {
                if (oResult[sLinkEntitySet].hasOwnProperty("length")) {
                    oResult[sLinkEntitySet].forEach(function(aCustomerIDs, oResult, oLink) {

                        if (aCustomerIDs.indexOf(oLink.CustomerIdMD) >= 0) {
                            oLink[sEntity] = oResult[sEntitySet][aCustomerIDs.indexOf(oLink.CustomerIdMD)];
                        }

                    }.bind(this, aCustomerIDs, oResult));
                }
            }


        },

        /**
         * [getLoanRequestDescription Get description for the current LoanRequest]
         * @param  {[Object]} oResult [Result from Pouch where LoanRequestSet is content]
         * @return {[String]}         [Loan Request description]
         */
        sap.ui.sync.LoanRequest.prototype.getLoanRequestDescription = function(oResult) {

            try {

                if (oResult.hasOwnProperty("LoanRequestSet")) {

                    switch (oResult.LoanRequestSet[0].ProductID) {

                        case "C_GRUPAL_CCR":
                            return oResult.LoanRequestSet[0].GroupRequestData.GroupName;
                            break;
                        case "C_GRUPAL_CM":
                            return oResult.LoanRequestSet[0].GroupRequestData.GroupName;
                            break;
                        case "C_IND_CI": /// Get Name from Link
                            return "SOLICITUD INDIVIDUAL";
                            break;

                        default:
                            return "";
                    }

                }

                return "";

            } catch (error) {
                return "";
            }

        };

    /**
     * [deleteLoanFromDataDB Delete Loan Record when the process has gone correctly]
     * @param  {[Object]} oNotification [Notification object to process]
     * @param  {[Object]} oResult       [Data coming from PouchDB
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.deleteLoanFromDataDB = function(oNotification, oResult) {

        this.handleTrace("CLR08", "Eliminar Solicitud de DATADB : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);



        return new Promise(function(resolve, reject) {
            ///// Si los customers asociados fueron insertados unicamente por la solicitud, eliminar de Pouch


            var aDeleteRelationshipsPromises;
            aDeleteRelationshipsPromises = [];
            aDeleteRelationshipsPromises.push(this.deleteCustomerRelationships(oResult, oNotification));
            aDeleteRelationshipsPromises.push(this.deleteGuarantorRelationships(oResult, oNotification));

            Promise.all(aDeleteRelationshipsPromises).then(
                function(result) {

                    this.dataDB.delete(this.oDictionary.oTypes.LoanRequest, oResult.LoanRequestSet[0].id, oResult.LoanRequestSet[0].rev)
                        .then(this.handleTrace("CLR08", "Registro de LoanRequest eliminado en DataDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)

                            .then(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.OK, oNotification.objectDMID, this.getLoanRequestDescription(oResult), "OK", oResult.LoanRequestSet[0].ProductID))) //// Reportar resultado OK en la pantalla
                            .then(resolve(this.OK)))
                        .catch(this.handleError.bind(this, "CLR08", "Error al eliminar registro de LoanRequest en DataDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)).then(resolve(this.ERROR))


                }.bind(this)
            );

        }.bind(this));
    };

    /**
     * [deleteCustomerRelationships Clear customer relationships from the deleted Loan]
     * @param  {[Object]} oResult       [Result from PouchDB]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.deleteCustomerRelationships = function(oResult, oNotification) {


        return new Promise(function(resolve) {

            this.handleTrace("CLR09", "Eliminar relaciones de Customer con solicitud en DATADB : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            var bHasRejectionCause = false;
            var aDeleteCustomerPromises = [];


            /// Eliminar Links
            if (oResult.hasOwnProperty("LinkSet")) {

                this.handleTrace("CLR09", "Se eliminaran los siguientes Links. Notification: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " Customers:" + JSON.stringify(oResult.LinkSet));

                oResult.LinkSet.forEach(function(oLink) {

                    /// Delete Link
                    this.dataDB.delete(this.oDictionary.oTypes.Link, oLink.id, oLink.rev)
                        .then(aDeleteCustomerPromises.push(this.deleteEntityCustomer(oLink, oNotification)))
                        .catch(function(result) {
                            this.handleError("CLR09", "Error al eliminar el Link: " + oLink.id + " para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, result);
                            resolve(this.ERROR);
                        }.bind(this));

                }.bind(this));

                Promise.all(aDeleteCustomerPromises).then(resolve(this.OK));

            } else {
                resolve(this.OK);
            }




        }.bind(this));



    };


    /**
     * [deleteEntityCustomer Delete a Customer entry if the Customer was inserted by the Loan only]
     * @param  {[Object]} oLink         [Link pointing to the corresponding Customer]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.deleteEntityCustomer = function(oLink, oNotification) {

        this.handleTrace("CLR10", "Eliminar Customer de DataDB cuando se inserto solo por el LoanRequest : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve) {

            if (oLink.Customer.hasOwnProperty("bRegisterComesFromLoanRequest")) {

                if (oLink.Customer.bRegisterComesFromLoanRequest) {

                    this.dataDB.getById(this.oDictionary.oTypes.Customer, oLink.Customer.id)
                        .then(function(result) {

                            if (result.hasOwnProperty("CustomerSet")) {
                                if (result.CustomerSet.length > 0) {
                                    this.dataDB.delete(this.oDictionary.oTypes.Customer, result.CustomerSet[0].id, result.CustomerSet[0].rev)
                                        .then(resolve(this.OK))
                                        .catch(this.handleError.bind(this, "CLR10", "Error al eliminar el Customer (Solo existe en Pouch por la asociación o tiene rejection Cause, para la oportunidad: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                                        .then(resolve(this.ERROR));
                                }
                            } else {
                                resolve(this.OK)
                            }

                        }.bind(this));
                }
            }


        }.bind(this))



    };



    /**
     * [deleteCustomerRelationships Clear customer relationships from the deleted Loan]
     * @param  {[Object]} oResult       [Result from PouchDB]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.deleteGuarantorRelationships = function(oResult, oNotification) {


        return new Promise(function(resolve) {

            this.handleTrace("CLR11", "Eliminar relaciones de Guarantor con solicitud en DATADB : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            var bHasRejectionCause = false;
            var aDeleteGuarantorPromises = [];


            /// Eliminar Links
            if (oResult.hasOwnProperty("LinkGuarantorSet")) {

                this.handleTrace("CLR11", "Se eliminaran los siguientes LinkGuarantors. Notification: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " Guarantors:" + JSON.stringify(oResult.LinkGuarantorSet));

                oResult.LinkGuarantorSet.forEach(function(oLinkGuarantor) {

                    /// Delete Link
                    this.dataDB.delete(this.oDictionary.oTypes.LinkGuarantor, oLinkGuarantor.id, oLinkGuarantor.rev)
                        .then(aDeleteGuarantorPromises.push(this.deleteEntityGuarantor(oLinkGuarantor, oNotification)))
                        .catch(function(result) {
                            this.handleError("CLR11", "Error al eliminar el Link: " + oLinkGuarantor.id + " para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, result);
                            resolve(this.ERROR);
                        }.bind(this));

                }.bind(this));

                Promise.all(aDeleteGuarantorPromises).then(resolve(this.OK));

            } else {
                resolve(this.OK);
            }




        }.bind(this));



    };


    /**
     * [deleteEntityGuarantor Delete a Guarantor entry if the Guarantor was inserted by the Loan only]
     * @param  {[Object]} oLink         [Link pointing to the corresponding Guarantor]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.deleteEntityGuarantor = function(oLinkGuarantor, oNotification) {

        this.handleTrace("CLR12", "Eliminar Guarantor de DataDB cuando se inserto solo por el LoanRequest : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve) {

            if (oLinkGuarantor.hasOwnProperty("Guarantor")) {

                if (oLinkGuarantor.Guarantor.hasOwnProperty("bRegisterComesFromLoanRequest")) {

                    if (oLinkGuarantor.Guarantor.bRegisterComesFromLoanRequest) {

                        this.dataDB.getById(this.oDictionary.oTypes.Guarantor, oLinkGuarantor.Guarantor.id)
                            .then(function(result) {

                                if (result.hasOwnProperty("GuarantorSet")) {
                                    if (result.GuarantorSet.length > 0) {
                                        this.dataDB.delete(this.oDictionary.oTypes.Guarantor, result.GuarantorSet[0].id, result.GuarantorSet[0].rev)
                                            .then(resolve(this.OK))
                                            .catch(this.handleError.bind(this, "CLR12", "Error al eliminar el Customer (Solo existe en Pouch por la asociación o tiene rejection Cause, para la oportunidad: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                                            .then(resolve(this.ERROR));
                                    }
                                } else {
                                    resolve(this.OK);
                                }

                            }.bind(this));
                    }
                }

            } else {
                resolve(this.OK);
            }


        }.bind(this))



    };



    /**
     * [deleteLoanFromSyncDB Delete the processed Loan from SyncDB]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.deleteLoanFromSyncDB = function(oNotification) {

        this.handleTrace("CLR13", "Eliminar Solicitud de SYNCDB : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve, reject) {



            this.syncDB.getById(this.oDictionary.oQueues.LoanRequest, oNotification.objectDMID)
                .then(function(oResult) {

                    if (oResult.RequestQueueLoanRequestSet.length > 0) {

                        this.handleTrace("CLR13", "Existe en SyncDB, borrando : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
                        this.syncDB.delete(this.oDictionary.oQueues.LoanRequest, oResult.RequestQueueLoanRequestSet[0].id, oResult.RequestQueueLoanRequestSet[0].rev)
                            .then(resolve(oNotification))
                            .catch(this.handleError.bind(this, "CLR13", "Error al eliminar registro de LonaRequest en SYNCDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)).then(resolve(oNotification));

                    } else {

                        this.handleTrace("CLR13", "No existe en SyncDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
                        resolve(oNotification);
                    }
                }.bind(this));
        }.bind(this));
    };

    /** 
     * [updateAttended Mark the notification as attended in IGW]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.updateAttended = function(oNotification) {

        this.handleTrace("CLR14", "TRAINING - Eliminar notificacion de sistema (PouchDB): " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve, reject) {

            var oBody;
            oBody = { attended: "1" };

            //sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
             this.notiDB.delete(this.oDictionary.oQueues.LoanRequestSystemNotification, oNotification.id, oNotification.rev)
                .then(

                    this.handleTrace("CLR14",  "TRAINING - Notificacion de Sistema elimnada de PouchDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                    .then(resolve(this.OK))

                ).catch(function(error) {

                    this.handleError("CLR14", "TRAINING - Error eliminar notificacion de sistema (PouchDB) para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
                        .then(this.saveUpdateError(oNotification))
                        .then(resolve(this.OK))

                }.bind(this));

        }.bind(this));
    };

    /**
     * [saveUpdateError Save the error (if present) when trying to update the status of a Notification in IGW]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.saveUpdateError = function(oNotification) {

        this.handleTrace("CLR15", "Se requerira reintento de actualización de status (a Attended) de la notificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        var ErrorUpdate = {
            id: oNotification.notificationID
        };
        return new Promise(function(resolve, reject) {

            this.syncDB.post(this.oDictionary.oErrors.Notification, ErrorUpdate)
                .then(this.handleTrace("CLR15", "Reintento de actualización de status (a Attended) *Registrado* para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " guardado OK").then(resolve(this.ERROR)))
                .catch(this.handleError.bind(this, "CLR15", "##Error en el Reintento de actualización de status (a Attended) para la notificación " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID).then(resolve(this.ERROR)));

        }.bind(this));
    };




    /**
     * [processErrorNotification Process the error message inside a notification]
     * @param  {[Object]} oNotification   [Notification to process]
     * @param  {[Object]} oLoanRequestSet [Object from DataDB]
     * @return {[Promise]}                 [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.processErrorNotification = function(oNotification, oLoanRequestSet) {


        return new Promise(function(resolve, reject) {

            this.handleTrace("CLR16", "Procesar error contenido en la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            var oErrorData;
            oErrorData = {

                id: oNotification.objectDMID,
                errorDetail: oNotification.message,
                type: oLoanRequestSet.productID,
                NotificationID: oNotification.notificationID

            };

            this.upsertErrorNotificationData(oErrorData)
                .then(resolve(this.OK))
                .catch(
                    this.handleError.bind(this, "CLR16", "Error al actualizar error contenido en la notificación:  " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                .then(resolve(this.ERROR));

        }.bind(this));

    };

    /**
     * [upsertErrorNotificationData Update error content inside the notification]
     * @param  {[Object]} oErrorDataSync [Error to process]
     * @return {[Promise]}                [Promise]
     */
    sap.ui.sync.LoanRequest.prototype.upsertErrorNotificationData = function(oErrorDataSync) {


        return new Promise(function(resolve, reject) {

            this.handleTrace("CLR17", "Upsert información de error de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            this.syncDB.getById(this.oDictionary.oErrors.LoanRequest, oErrorDataSync.id)
                .then(function(_oErrorDataSync, result) { /// Confirmar si ya existe el registro del error, hacer upsert
                    if (result.BusinessErrorLoanRequestSet) {
                        if (result.BusinessErrorLoanRequestSet.length > 0) { // Ya existia previamente
                            _oErrorDataSync.rev = result.BusinessErrorLoanRequestSet[0].rev;
                        }
                    }
                    this.syncDB.post(this.oDictionary.oErrors.LoanRequest, _oErrorDataSync).then(
                        this.handleTrace("CLR17", "Upsert información de error de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID).then(resolve(this.OK))
                    );

                }.bind(this, this.oDictionary, oErrorDataSync));

        }.bind(this));

    };



    sap.ui.sync.LoanRequest.prototype.deleteFromQueue = function(_sLoanRequestId, _oDictionary) {

        return new Promise(function(resolveDeletePromise) {

            this.syncDB.getById(_oDictionary.oQueues.LoanRequest, _sLoanRequestId)
                .then(function(_oDictionary, result) { /// Confirmar si ya existe el registro del error, hacer upsert

                    if (result.RequestQueueLoanRequestSet) {
                        if (result.RequestQueueLoanRequestSet.length > 0) { // Ya existia previamente

                            this.syncDB.delete(_oDictionary.oQueues.LoanRequest, result.RequestQueueLoanRequestSet[0].id, result.RequestQueueLoanRequestSet[0].rev)
                                .then(function(success) {
                                    resolveDeletePromise("OK");
                                });
                        } else {
                            resolveDeletePromise("OK");
                        }
                    } else {
                        resolveDeletePromise("OK");
                    }

                }.bind(this, _oDictionary)).
            catch(function(error) {

                resolveDeletePromise("Error al eliminar la solicitud del queue: " + error);

            });

        }.bind(this));

    };







})();
