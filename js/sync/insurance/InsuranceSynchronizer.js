(function() {

    "use strict";
    jQuery.sap.declare("sap.ui.sync.Insurance");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.helper.Schema");
    jQuery.sap.require("js.helper.SyncResults");
    jQuery.sap.require("js.base.ObjectBase");
    jQuery.sap.require("js.serialize.insurance.InsuranceSerialize");




    sap.ui.base.Object.extend('sap.ui.sync.Insurance', {
        constructor: function(_dataDB, _syncDB, _notiDB) {
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
            this.loggerSMPComponent = "INSURANCE_SYNC";
            this.ERROR = "ERROR";
            this.OK = "OK";
            this.BUSINESSERROR = "BUSINESSERROR";
            this.COMPLETED = "COMPLETED";
            this.oSyncResultHelper = new sap.ui.helper.SyncResults();
        }
    });

    /*       
    Syncronization step catalog (New numbers between steps will be added with characters )
        
        SINS1 sendQueue
        SINS2 retrieveInsuranceRequests
        SINS3 generateSendIndividualPromises
        SINS4 generateSinglePromise
        SINS5 sendRequest
        SINS6 processODataResponse
        SINS7 updateSyncQueue
        SINS8 clearBusinessError
        SINS9 processODataResponseError
        SINS10 upsertBusinessError
     */

    /**
     * [sendQueue - Entry point for the sending of the Insurance sync queue]
     * @return {[Promise]} [Main promise]
     */
    sap.ui.sync.Insurance.prototype.sendQueue = function() {
        this.handleTrace("Inicio sincronización Insurance", "****************");


        return new Promise(function(resolveMasterPromise) {

            ///////// Retrieve all insurance requests

            var oNow;

            this.handleTrace("SINS1", "Inicio de sincronización || " + new Date());

            oNow = moment().format('DD/MM/YYYY HH:mm:ss');

            this.retrieveInsuranceRequests().then(

                    function(result) {
                        //israel - extrae los registros de tipo seguros ubicados en syncdb

                        var aPromises;

                        aPromises = this.generateSendIndividualPromises(result, resolveMasterPromise);

                        Promise.all(aPromises).then(this.handleNumericResults.bind(this, resolveMasterPromise, oNow))
                            .catch(function(error) {
                                this.handleError("SINS1", "Error al resolver Promise All ", error);
                                resolveMasterPromise(this.oSyncResultHelper.initializeSynchronizingResults());
                            }.bind(this));

                    }.bind(this))

                .catch(function(error) {
                    this.handleError("SINS1", "Error general de sincronización ", error).then(resolveMasterPromise(this.oSyncResultHelper.initializeSynchronizingResults()))
                }.bind(this));

        }.bind(this));
    };

    /**
     * [retrieveInsuranceRequests Retrieves all LoanRequestIdCRMs from PouchDB]
     * @return {[type]} [description]
     */
    sap.ui.sync.Insurance.prototype.retrieveInsuranceRequests = function() {
        this.handleTrace("SINS2", "");
        return this.syncDB.get(this.oDictionary.oQueues.Insurance);
    };

    /**
     * [generateSendIndividualPromises Generate individual promises ]
     * @param  {[Array]} _aResults            [Records from SyncQueue]
     * @param  {[Promise]} resolveMasterPromise [Master promise to terminate the process in case no results were found]
     * @return {[Array]}                      [Array with individual promises]
     */
    sap.ui.sync.Insurance.prototype.generateSendIndividualPromises = function(_aResults, resolveMasterPromise) {
        this.handleTrace("SINS3", "");

        var i;
        var aPromises;
        var results;

        aPromises = [];
        results = [];

        results = this.validatePouchResults(_aResults, "RequestQueueInsuranceSet");

        results.forEach(function(result) {

            if (result.requestStatus != this.oDictionary.oRequestStatus.Sent) {
                aPromises.push(this.generateSinglePromise(result));
            }


        }.bind(this));

        if (results.length === 0 || aPromises.length === 0) {
            ////// No results to process
            resolveMasterPromise(this.oSyncResultHelper.initializeSynchronizingResults());
            this.handleTrace("SINS3", "No records in SyncQueue to process");
        }

        return aPromises;
    };

    /**
     * [generateSinglePromise Generates the individual promise for synchronization]
     * @param  {[Object]} _oQueueItem [Item from the sync queue]
     * @return {[Promise]}             [Promise]
     */
    sap.ui.sync.Insurance.prototype.generateSinglePromise = function(_oQueueItem) {

        return new Promise(function(resolveSendPromise) {

            this.handleTrace("SINS4", _oQueueItem.id);

            ///// Deserialize
            var oInsuranceSerializer;
            oInsuranceSerializer = new sap.ui.serialize.Insurance("dataDB");
            oInsuranceSerializer.deSerialize(_oQueueItem.id, true)
                .then(this.sendRequest.bind(this, _oQueueItem, resolveSendPromise))
                .catch(function(sError) {
                    this.handleError("SINS4", "Error al deserializar la solicitud. ", sError);
                    this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "Error interno de sincronización (SINS4)", "INS"))
                    resolveSendPromise(this.ERROR);
                }.bind(this))

        }.bind(this));
    };

    /**
     * [sendRequest Makes the creation at OData level]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} result              [Item retrieved from PouchDB]
     */
    sap.ui.sync.Insurance.prototype.sendRequest = function(_oQueueItem, _resolveSendPromise, result) {
        this.handleTrace("SINS5", _oQueueItem.id + " Payload: " + JSON.stringify(result));
        //TRAINING - Se simula el POST
        var oBeneficiarios = result.InsuranceBeneficiarySet;
        var isInsNew = false;
        var isBenNew = false;
        //Seguro Nuevo
        if (result.InsuranceIdCRM === "") {
            isInsNew = true;
        } 
        /*else {
            oBeneficiarios.forEach(function(item) {
                if (item.InsuranceBeneficiaryIdCRM === "") {
                    isBenNew = true;
                }
            });
        }*/


        if (isInsNew) {
            sap.ui.getCore().AppContext.myRest.create(_oQueueItem.requestUrl, result, true)
                .then(this.processODataResponse.bind(this, _oQueueItem, _resolveSendPromise))
                .catch(this.processODataResponseError.bind(this, _oQueueItem, _resolveSendPromise));
        } else {
            this.simulatePost(_oQueueItem.requestUrl, result)
                .then(this.processODataResponse.bind(this, _oQueueItem, _resolveSendPromise))
                .catch(this.processODataResponseError.bind(this, _oQueueItem, _resolveSendPromise));
        }
    };
    //TRAINING - Simulación de POST
    sap.ui.sync.Insurance.prototype.simulatePost = function(_oQueueItem, _result) {
        return new Promise(function(resolveSimulatePromise, rejectSimulatePromise) {
            var oResult = {
                data: _result,
                statusCode: 201,
                statusText: "Created"
            };
            resolveSimulatePromise(oResult)
        });
    };

    /**
     * [processODataResponse Process OK result from OData call]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} result              [Result from OData call]
     */
    sap.ui.sync.Insurance.prototype.processODataResponse = function(_oQueueItem, _resolveSendPromise, result) {

        this.handleTrace("SINS6", _oQueueItem.id);

        if (result.hasOwnProperty("statusCode")) {
            if (result.statusCode) {
                this.handleTrace("SINS6", _oQueueItem.id + " HTTP Status Code: " + result.statusCode);
            }
        }

        _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.Sent;

        this.updateSyncQueue(_oQueueItem).then(


            this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.OK, _oQueueItem.id, _oQueueItem.requestDescription, "OK", "INS"))
            //.then(this.clearBusinessError(_oQueueItem, _resolveSendPromise))
            .then(this.sendNotification(_oQueueItem, result, _resolveSendPromise))

        ).catch(function(sError) {
            this.handleError.bind("SINS6", "Error al actualizar SynC Queue a status 'Sent' del seguro  " + _oQueueItem.id, sError);
            _resolveSendPromise(this.ERROR);
        }.bind(this));
    };

    /*TRAINING - Se emula base de datos de notificaciones
     * id - InsuranceIdMD
     * objectDMID - LoanRequestIdMD, se requiere para eliminar de PouchDB
     */
    sap.ui.sync.Insurance.prototype.sendNotification = function(_oQueueItem, _result, _resolveSendPromise) {
        return new Promise(function(resolveSendNotification, rejectSendNotification) {
            jQuery.sap.require("js.buffer.notification.NotificationBuffer");
            var oNotificationBuffer = new sap.ui.buffer.Notification("notiDB");
            var oRequest = {
                id: _oQueueItem.id,
                notificationID: "12345",
                dateTime: "2017-07-19T21:05:27.280Z",
                status: 1,
                messageID: 122,
                message: "Proceso asignación seguro finalizado",
                objectTypeID: "4",
                objectDMID: _result.data.LoanRequestIdMD,
                objectCRMID: _result.data.LoanRequestIdCRM,
                attended: "0",
                insuranceDMID: _oQueueItem.id
            };

            oNotificationBuffer.postRequest(oRequest)
                .then(function() {
                    _resolveSendPromise("ok");
                });
        });
    };
    /**
     * [updateSyncQueue: Updates the sync Queue once the process has completed -
     * Actualiza el estatus de la petición Initial - Sent - Se debe visualizar en la lista de peticiiones al terminar la sincronización con estatus OK]   
     * @param  {[Object]} _oQueueItem [Item from the sync queue]
     * @return {[Promise]}             [Promise to update the Sync Queue]
     */
    sap.ui.sync.Insurance.prototype.updateSyncQueue = function(_oQueueItem) {

        return new Promise(function(resolveUpdatePromise, rejectUpdatePromise) {

            this.handleTrace("SINS7", _oQueueItem.id);

            this.syncDB.getById(this.oDictionary.oQueues.Insurance, _oQueueItem.id)
                .then(function(result) { /// Confirmar si ya existe el registro del error, hacer upsert

                    var aResults;
                    aResults = this.validatePouchResults(result, "RequestQueueInsuranceSet");


                    if (aResults.length > 0) { // Ya existia previamente
                        _oQueueItem.rev = aResults[0].rev;
                    }

                    this.syncDB.post(this.oDictionary.oQueues.Insurance, _oQueueItem)
                        .then(resolveUpdatePromise(this.OK))
                        .catch(rejectUpdatePromise(this.ERROR));

                }.bind(this))

        }.bind(this));

    };

    /**
     * [clearBusinessError Removes business error record from PouchDB (if any) - 
     * Verifica si existe algun registro de tipo INSURANCE con estatus ERROR en la tabla SYNCDB, si existe lo actualiza y pone el estatus COMPLETED a la sincronización]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     */
    sap.ui.sync.Insurance.prototype.clearBusinessError = function(_oQueueItem, _resolveSendPromise) {
        this.syncDB.getById(this.oDictionary.oErrors.Insurance, _oQueueItem.id)
            .then(function(result) { /// Confirmar si ya existe el registro del error, hacer upsert

                this.handleTrace("SINS8", _oQueueItem.id);

                var aResults;
                aResults = this.validatePouchResults(result, "BusinessErrorInsuranceSet");

                if (aResults > 0) {
                    this.syncDB.delete(this.oDictionary.oErrors.Insurance, aResults[0].id, aResults[0].rev)
                        .then(this.handleTrace("COMPLETED: ", _oQueueItem.id))
                        .then(_resolveSendPromise(this.COMPLETED));
                } else {
                    this.handleTrace("COMPLETED: ", _oQueueItem.id);
                    _resolveSendPromise(this.COMPLETED);
                }

            }.bind(this))
            .catch(function(sError) {

                this.handleError("SINS8", "Error al eliminar el Business Error de Insurance (Seguros)  " + _oQueueItem.id, sError);
                _resolveSendPromise(this.ERROR);

            }.bind(this));
    };

    /**
     * [processODataResponseError Handler to process OData response in case of an error]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} results             [Results from OData Call (Error)]
     */
    sap.ui.sync.Insurance.prototype.processODataResponseError = function(_oQueueItem, _resolveSendPromise, results) {

        this.handleTrace("SINS9", "Error al enviar la petición OData para la seguro: " + _oQueueItem.id + " Detalle: " + results);

        var sErrorMessage;
        var oErrorData;

        sErrorMessage = this.retrieveBusinessError(results);

        if (sErrorMessage !== "") {

            this.handleTrace("SINS9", "Business error encontrado: " + sErrorMessage);

            //Se modifica para seguros ya que no contiene productID
            oErrorData = {
                id: _oQueueItem.id,
                errorDetail: "Error al enviar el seguro '" + _oQueueItem.requestDescription + "' : " + sErrorMessage,
                type: _oQueueItem.productID
            };

            this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.BUSINESSERROR, _oQueueItem.id, _oQueueItem.requestDescription, sErrorMessage, _oQueueItem.productID));
            this.upsertBusinessError(oErrorData, _oQueueItem, _resolveSendPromise);


        } else {

            //// Normal processing
            _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.Error;

            this.syncDB.update(this.oDictionary.oQueues.Insurance, _oQueueItem.id, _oQueueItem)
                .then(

                    this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "Error técnico, reintentar más tarde", _oQueueItem.productID))
                    .then(this.deleteBusinessError(_oQueueItem, _resolveSendPromise))
                )
                .catch(this.handleError.bind(this, "SINS9", "¡Ups! No se logró cargar toda la información. Por favor, intenta de nuevo.  " + _oQueueItem.id))
                .then(_resolveSendPromise(this.ERROR));
        }
    };

    /**
     * Actuliza el BusinessError ex algun nuevo error (negocio)
     * [upsertBusinessError Insert or update business error from synchronization]
     * @param  {[Object]} _oBusinessError     [Business error to update]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     */
    sap.ui.sync.Insurance.prototype.upsertBusinessError = function(_oBusinessError, _oQueueItem, _resolveSendPromise) {

        this.syncDB.getById(this.oDictionary.oErrors.Insurance, _oBusinessError.id)
            .then(function(_oQueueItem, _oBusinessError, result) { /// Confirmar si ya existe el registro del error, hacer upsert

                this.handleTrace("SINS10", _oQueueItem.id);

                var aResults;
                aResults = this.validatePouchResults(result, "BusinessErrorInsuranceSet");

                if (aResults.length > 0) { // Ya existia previamente
                    _oBusinessError.rev = aResults[0].rev;
                }

                _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.BusinessError;

                this.syncDB.post(this.oDictionary.oErrors.Insurance, _oBusinessError).then(
                        this.syncDB.update(this.oDictionary.oQueues.Insurance, _oQueueItem.id, _oQueueItem))
                    .then(_resolveSendPromise(this.BUSINESSERROR));


            }.bind(this, _oQueueItem, _oBusinessError))
            .catch(this.handleError.bind(this, "SINS10", "Error al actualizar Business Error  " + _oQueueItem.id + "Detalle:" + _oBusinessError))
            .then(_resolveSendPromise(this.ERROR));
    };

    /**
     * [handleTrace Handle sync trace]
     * @param  {[String]} _sSyncStep  [Sync step key]
     * @param  {[Object]} _oTraceData [Trace  description]
     * @param  {[Boolean]} _bIsError   [Boolean to determine if the trace is an error]
     * @param  {[String]} sError      [Error (in case of an error)]
     * @return {[Promise]}             [Promise]
     */
    sap.ui.sync.Insurance.prototype.handleTrace = function(_sSyncStep, _oTraceData, _bIsError, sError) {

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
    sap.ui.sync.Insurance.prototype.handleError = function(_sSyncStep, _oTraceData, sError) {

        return this.oSyncResultHelper.handleError(_sSyncStep, _oTraceData, sError);
    };

    /**
     * [validatePouchResults Validates if a PouchDB result contains a specific collection]
     * @param  {[Array]} _aArray      [Results from PouchDB query]
     * @param  {[String]} _sCollection [EntitySet to evaluate]
     * @return {[Arrays]}              [Array with the results]
     */
    sap.ui.sync.Insurance.prototype.validatePouchResults = function(_aArray, _sCollection) {

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
    sap.ui.sync.Insurance.prototype.retrieveBusinessError = function(error) {

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
    sap.ui.sync.Insurance.prototype.deleteBusinessError = function(_oQueueItem, _resolveSendPromise) {


        return this.syncDB.getById(this.oDictionary.oErrors.LoanRequestIdCRM, _oQueueItem.id)
            .then(function(result) { /// Confirmar si ya existe el registro del error, hacer upsert

                if (!_resolveSendPromise) {
                    _resolveSendPromise = function() {};
                }

                var aResults;
                aResults = this.validatePouchResults(result, "BusinessErrorLoanRequestIdCRMSet");

                if (aResults.length > 0) {

                    this.syncDB.delete(this.oDictionary.oErrors.LoanRequestIdCRM, result.BusinessErrorLoanRequestIdCRMSet[0].id, result.BusinessErrorLoanRequestIdCRMSet[0].rev)
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
    sap.ui.sync.Insurance.prototype.addResults = function(_aResults) {

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
     * [handleNumericResults Handle numeric results from synchronization]
     * @param  {[Promise]} _resolveMasterPromise [Master promise]
     * @param  {[Object]} oNow                  [Synchronization start time]
     * @param  {[Array]} results               [Results]
     */
    sap.ui.sync.Insurance.prototype.handleNumericResults = function(_resolveMasterPromise, oNow, results) {

        var oThen;

        oThen = moment().format('DD/MM/YYYY HH:mm:ss');

        this.handleTrace("SINS1", "Fin de sincronización, Tiempo transcurrido: " + moment.utc(moment(oThen, "DD/MM/YYYY HH:mm:ss").diff(moment(oNow, "DD/MM/YYYY HH:mm:ss"))).format("mm:ss"));

        _resolveMasterPromise("OK");
    };





    //****************************** Start - ConfirmQueue ******************************

    /*
           
       Confirmation (New numbers between steps will be added with characters )
           
           CINS01 confirmQueue
           CINS02 createIndividualPromises
           CINS03 generateNotificationPromise
           CINS04 reviewFormerNotificationError
           CINS05 retryNotificationUpdate
           CINS06 confirmNotification
           CINS07 verifyNotificationContent
           CINS08 deleteInsuranceFromDataDB
           
           /// Particular for Insurance
           CINS09 deleteCustomerRelationships
           CINS10 deleteEntityCustomer
           CINS11 deleteGuarantorRelationships
           CINS12 deleteEntityGuarantor
           /// Particular for Insurance

           CINS13 deleteInsuranceFromSyncDB
           CINS14 updateAttended
           CINS15 saveUpdateError
           CINS16 processErrorNotification
           CINS17 upsertErrorNotificationData
           

        */



    //******************************** Proceso de confirmación de notificaciones ********************************

    /**
     * [confirmQueue Entry method for confirmations]
     * @return {[Promise]} [Master promise for confirmation]
     */
    sap.ui.sync.Insurance.prototype.confirmQueue = function() {



        return new Promise(function(resolve, reject) {

                var oNow;

                oNow = moment().format('DD/MM/YYYY HH:mm:ss');

                this.handleTrace("CINS01", "Inicio de confirmación || " + new Date());

                this.handleTrace("CINS01", "Obtener notificaciones de tipo Insurance Request");

                //sap.ui.getCore().AppContext.oRest.read("/SystemNotifications", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "' and attended eq '0' and objectTypeID eq '4'", true)

                //TRAINING - Consulta de notifiaciones de sistema en PouchDB
                jQuery.sap.require("js.buffer.notification.NotificationBuffer");
                var oNotificationBuffer = new sap.ui.buffer.Notification("notiDB");

                oNotificationBuffer.searchInNotiDB(this.oDictionary.oQueues.InsuranceSystemNotification)
                    .then(function(result) {
                        var oMainPromise;
                        oMainPromise = this.createIndividualPromises(resolve, result); //.bind(this);
                        oMainPromise.then(
                            function(result) {
                                Promise.all(result)
                                    .then(this.processResults.bind(this, resolve, oNow))
                                    .catch(function(error) {
                                        this.handleError.bind(this, "CINS01", "Error general en la confirmación " + error);
                                        resolve(this.ERROR);
                                    }.bind(this));
                            }.bind(this));

                    }.bind(this))
                    .catch(function(error) {
                        this.handleError("CINS01", "Error general en la confirmación de SEGURO. Error al obtener las notificaciones de seguros", error);
                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.ERROR, "", "", "Error al obtener las notificaciones de seguros", "NOTIFICATION"));
                        resolve(this.ERROR);
                    }.bind(this));


            }.bind(this))
            .catch(function(error) {
                this.handleError("CINS01a", "Error general en la confirmación de SEGURO. Error al obtener las notificaciones de seguros", error);
                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.ERROR, "", "", "Error al obtener las notificaciones de seguros", "NOTIFICATION"));
                resolve(this.ERROR);
            }.bind(this));

    };

    /**
     * [processResults Final processing for confirmation]
     * @param  {[type]} resolve [Master promise to resolve]
     * @param  {[type]} oNow    [Date time of process start]
     * @param  {[type]} results [Results from confirmation]
     
     */
    sap.ui.sync.Insurance.prototype.processResults = function(resolve, oNow, results) {

        var bBusinessError;
        var oThen;
        bBusinessError = false;

        results.forEach(function(result) {
            result === this.BUSINESSERROR ? bBusinessError = true : bBusinessError = false;
        }.bind(this));

        oThen = moment().format('DD/MM/YYYY HH:mm:ss');

        this.handleTrace("CINS01", "Fin de confirmación, Tiempo transcurrido: " + moment.utc(moment(oThen, "DD/MM/YYYY HH:mm:ss").diff(moment(oNow, "DD/MM/YYYY HH:mm:ss"))).format("mm:ss"));

        bBusinessError == true ? resolve(this.BUSINESSERROR) : resolve(this.OK);


    };


    /**
     * [createIndividualPromises Take results and generate individual promises for confirmation]
     * @param  {[Function]} resolve [Master promise resolve]
     * @param  {[Object]} oResult [Result of pending confirmations]
     * @return {[Promise]}         [Promise]
     */
    sap.ui.sync.Insurance.prototype.createIndividualPromises = function(resolve, oResult) {

        this.handleTrace("CINS02", "Creación de promesas individuales");

        return new Promise(function(resolveIndividual) {

                if (oResult.results.length > 0) {

                    this.getNotificationErrors().then(function(result) {

                        var aPromises;
                        var oMainInsurance;
                        oMainInsurance = {};
                        aPromises = [];

                        //Por cada registro de notificación descargada de SystemNotifications se le da tratamiento dependiendo del status
                        oResult.results.forEach(function(oMainInsurance, result) {
                            if (!oMainInsurance.hasOwnProperty(result.objectDMID)) {
                                oMainInsurance[result.objectDMID] = { "excluded": [], "excludedIDs": [] };
                            }
                            //status = '0' o status ='false' - Error asignación seguro
                            if (result.status === "false") {
                                oMainInsurance[result.objectDMID].excluded.push({ "insuranceDMID": result.insuranceDMID, "notification": result });
                                oMainInsurance[result.objectDMID].excludedIDs.push(result.insuranceDMID);
                            } else {
                                //status = '1' o status='true' - Proceso asignación seguro finalizado
                                oMainInsurance[result.objectDMID].mainNotification = result;
                            }
                        }.bind(this, oMainInsurance));

                        //Busca el seguro en la lista de registros descargados de SystemNotifications para eliminar los registros de PDB
                        for (var oInsuranceOpportunity in oMainInsurance) {
                            if (oMainInsurance.hasOwnProperty(oInsuranceOpportunity)) {
                                if (oMainInsurance[oInsuranceOpportunity].hasOwnProperty("mainNotification")) {
                                    aPromises.push(this.generateNotificationPromise((oMainInsurance[oInsuranceOpportunity])));
                                }

                            }
                        }
                        resolveIndividual(aPromises);


                    }.bind(this));



                } else {
                    this.handleTrace("CINS02", "La lista de notificaciones viene vacia");
                    resolveIndividual([]);
                }



            }.bind(this))
            .catch(function(error) {
                this.handleError("CINS02", "Error al generar las notificaciones individuales de seguros", error);
            }.bind(this));
    };

    /**
     * [generateNotificationPromise Generation of individual confirmation promise]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Notification Promise]
     */
    sap.ui.sync.Insurance.prototype.generateNotificationPromise = function(oNotification) {

        this.handleTrace("CINS03", "Generación de promesa individual : " + oNotification.mainNotification.notificationID + " Notification: " + JSON.stringify(oNotification.mainNotification));

        return new Promise(function(resolve, reject) {

            /// Validar si existe error 
            this.reviewFormerNotificationError(oNotification.mainNotification)
                .then(function(result) {

                    if (result === "NormalProcessing") {
                        /////// Continuar procesamiento normal
                        this.confirmNotification(oNotification).then(function(msg) {
                            resolve(msg);
                        });

                    } else {
                        this.handleTrace("CINS03", "Termina OK:" + oNotification.mainNotification.notificationID);
                        resolve(this.OK);
                    }

                }.bind(this))
                .catch(function(error) {
                    this.handleError("CINS03", "Error al validar notificación previa ", error);
                    resolve(this.ERROR);

                }.bind(this));

        }.bind(this));
    };

    /**
     * [reviewFormerNotificationError Review if there was an Error associated to this notification in a previous sync]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.Insurance.prototype.reviewFormerNotificationError = function(oNotification) {

        return new Promise(function(resolve) {


            this.handleTrace("CINS04", "Revision de error previo para Notificacion : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

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
    sap.ui.sync.Insurance.prototype.retryNotificationUpdate = function(oNotification, oResult) {
        return new Promise(function(resolve, reject) {

            this.handleTrace("CINS05", "Reintentar actualización del status de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " (a Attended) ");

            var oBody;
            oBody = {
                attended: "1"
            };

            sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
                .then(function(oResult, oNotification, result) {

                    /// Eliminar el registro de error de notificación de PouchDB
                    this.syncDB.delete(this.oDictionary.oErrors.Notification, oResult.SystemErrorNotificationSet[0].id, oResult.SystemErrorNotificationSet[0].rev);
                    this.handleTrace("CINS05", "SEGURO actualizada correctamente en IGW" + oNotification.notificationID)
                        .then(resolve(this.OK))

                }.bind(this, oResult, oNotification))
                .catch(function(error) {
                    this.handleError("CINS05", "Error en la actualización del status de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " (a Attended) ", error).then(resolve(this.ERROR))
                }.bind(this))
        }.bind(this));
    };

    /**
     * [confirmNotification Review if there is a record to process for the current notification]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.Insurance.prototype.confirmNotification = function(oNotification) {


        this.handleTrace("CINS06", "Revisa si Insurance existe en DataDB para Notificacion : " + oNotification.mainNotification.notificationID + " ObjectIDDM: " + oNotification.mainNotification.objectDMID);

        return new Promise(function(oNotification, confirmNotificationResolve, confirmNotificationReject) {




            //this.dataDB.getById(this.oDictionary.oTypes.LinkInsurance, oNotification.mainNotification.objectDMID)
            //TRAINING 
            this.dataDB.getById(this.oDictionary.oTypes.LinkInsurance, oNotification.mainNotification.objectDMID)
                //.then(function(result){ console.log("result " +  JSON.stringify(result) )})
                .then(this.verifyNotificationContent.bind(this, oNotification, confirmNotificationResolve))
                .catch(function(error) {
                    this.handleError("CINS06", "Error al verificar el contenido de la notificación  " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error);
                    confirmNotificationResolve(this.ERROR);
                }.bind(this));
        }.bind(this, oNotification));
    };

    /**
     * [verifyNotificationContent Verifiy the result inside the notification for further processing]
     * @param  {[Object]} oNotification [Notification to process]
     * @param  {[Function]} resolve       [Resolve for main individual promise]
     * @param  {[Object]} oResult       [Object from PouchDB]
     */
    sap.ui.sync.Insurance.prototype.verifyNotificationContent = function(oNotification, resolve, oResult) {

        var aInsurancePromises;
        var iExcluded; /// How many insurances where actually excluded

        aInsurancePromises = [];
        this.iExcluded = 0;

        this.handleTrace("CINS07", "Verificar información contenida en la notificación : " + oNotification.mainNotification.notificationID + " ObjectIDDM: " + oNotification.mainNotification.objectDMID);

        if (oResult.LinkInsuranceSet.length > 0) {

            if (oResult.InsuranceSet.length > 0) {

                oResult.InsuranceSet.forEach(function(Insurance) {

                    var iErrorIndex;
                    var iIndexNotificationError;

                    iErrorIndex = oNotification.excludedIDs.indexOf(Insurance.InsuranceIdMD);
                    if (iErrorIndex >= 0) {
                        /// Este registro tiene error, debe ser excluido del borrado

                        iIndexNotificationError = this.aNotificationErrorIDs.indexOf(oNotification.excluded[iErrorIndex].notification.notificationID);


                        if (iIndexNotificationError >= 0) {
                            // Ya fue procesado, no mostrar el error en la notificación
                            // reintentar actualización
                            aInsurancePromises.push(this.retryNotificationUpdate(oNotification.excluded[iErrorIndex].notification, { SystemErrorNotificationSet: [this.aNotificationError[iIndexNotificationError]] }));
                            aInsurancePromises.push(this.deleteInsuranceRecords(Insurance));

                        } else {

                            this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.BUSINESSERROR, Insurance.id, "Description", oNotification.excluded[iErrorIndex].notification.message, "INSURANCE", oNotification.excluded[iErrorIndex].notification.notificationID));
                            this.iExcluded++;

                        }


                    } else {

                        aInsurancePromises.push(this.deleteInsuranceRecords(Insurance));

                    }

                }.bind(this))
            }

            /// Si la cuenta total de registros excluidos es 0, borrar LinkInsurance, Actualizar la notificación y reportar resultado OK
            if (this.iExcluded === 0) {

                /// Borrar LinkInsurance
                this.dataDB.delete("LinkInsurance", oResult.LinkInsuranceSet[0].id, oResult.LinkInsuranceSet[0].rev)
                /// Confirmar la solicitud
                this.updateAttended(oNotification.mainNotification);
                /// Reportar resultado
                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.OK, oNotification.mainNotification.objectDMID, oNotification.mainNotification.message, "OK", "INSURANCE", "", oNotification.mainNotification.insuranceDMID)); //alles klar

            }

            Promise.all(aInsurancePromises)
                .then(resolve(this.OK))
                .catch(resolve(this.ERROR));

        } else {
            this.handleTrace("CINS07", "No existe en DataDB, LinkInsurance para notificación: " + oNotification.mainNotification.notificationID + " ObjectIDDM: " + oNotification.mainNotification.objectDMID);
            resolve(this.OK)
        }


    };




    sap.ui.sync.Insurance.prototype.hasNotificationError = function(sNotificationID) {

        if (this.aNotificationErrorIDs.indexOf(sNotificationID) >= 0) {
            return true;
        } else {
            return false;
        }
    };


    sap.ui.sync.Insurance.prototype.getNotificationErrors = function() {

        return new Promise(function(resolveNotificationError) {

            this.aNotificationErrorIDs = [];
            this.aNotificationError = [];

            this.syncDB.get(this.oDictionary.oErrors.Notification)
                .then(function(oResult) {

                    if (oResult.hasOwnProperty("SystemErrorNotificationSet")) {
                        if (oResult.SystemErrorNotificationSet.length > 0) {

                            oResult.SystemErrorNotificationSet.forEach(function(oErrorNotification) {

                                this.aNotificationErrorIDs.push(oErrorNotification.id);
                                this.aNotificationError.push(oErrorNotification);
                                resolveNotificationError();

                            }.bind(this));

                        } else {
                            resolveNotificationError();
                        }
                    } else {
                        resolveNotificationError();
                    }

                }.bind(this));


        }.bind(this));

    };


    /**
     * [getInsuranceDescription Get description for the current Insurance]
     * @param  {[Object]} oResult [Result from Pouch where InsuranceSet is content]
     * @return {[String]}         [Insurance Request description]
     */
    sap.ui.sync.Insurance.prototype.deleteInsuranceRecords = function(Insurance) {

        return new Promise(function(Insurance, resolveInsurancePromise) {

            this.dataDB.delete("Insurance", Insurance.id, Insurance.rev)
                .then(function(result) {
                    //TRAINING
                    //this.deleteInsuranceFromSyncDB(Insurance.id)
                    this.deleteInsuranceFromSyncDB(Insurance)
                        .then(function(result) {
                            this.handleTrace("CINS08", "COMPLETED: " + Insurance.id);
                            resolveInsurancePromise(this.OK);
                        }.bind(this, Insurance))
                }.bind(this))
                .catch(function(error) {
                    this.handleError("CINS08", "Error al eliminar el SEGURO de DataDB/SyncDB " + Insurance.id)
                        .then(resolveInsurancePromise(this.ERROR));
                }.bind(this, Insurance));

        }.bind(this, Insurance));


    };



    /**
     * [getInsuranceDescription Get description for the current Insurance]
     * @param  {[Object]} oResult [Result from Pouch where InsuranceSet is content]
     * @return {[String]}         [Insurance Request description]
     */
    sap.ui.sync.Insurance.prototype.getInsuranceDescription = function(oResult) {

        try {

            if (oResult.hasOwnProperty("InsuranceSet")) {

                switch ("INSURANCE") {

                    case "C_GRUPAL_CCR":
                        return oResult.InsuranceSet[0].GroupRequestData.GroupName;
                        break;
                    case "C_GRUPAL_CM":
                        return oResult.InsuranceSet[0].GroupRequestData.GroupName;
                        break;
                    case "C_IND_CI": /// Get Name from Link
                        if (oResult.hasOwnProperty("LinkSet")) {
                            if (oResult.LinkSet.hasOwnProperty("Customer")) {
                                return oResult.LinkSet[0].Customer.FirstName + " " + oResult.LinkSet[0].Customer.MiddleName + " " + oResult.LinkSet[0].Customer.LastName + " " + oResult.LinkSet[0].Customer.SecondName;
                            }
                        }
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
     * [deleteInsuranceFromSyncDB Delete the processed Insurance from SyncDB]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.Insurance.prototype.deleteInsuranceFromSyncDB = function(Insurance) {

        this.handleTrace("CINS13", "Eliminar SEGURO de SYNCDB : " + Insurance.id);

        return new Promise(function(resolve, reject) {

            this.syncDB.getById(this.oDictionary.oQueues.Insurance, Insurance.id)
                .then(function(oResult) {

                    if (oResult.RequestQueueInsuranceSet.length > 0) {

                        this.handleTrace("CINS13", "Existe en SyncDB, borrando : " + Insurance.id);
                        this.syncDB.delete(this.oDictionary.oQueues.Insurance, oResult.RequestQueueInsuranceSet[0].id, oResult.RequestQueueInsuranceSet[0].rev)
                            .then(resolve("OK"))
                            .catch(this.handleError.bind(this, "CINS13", "Error al eliminar registro de LonaRequest en SYNCDB: " + Insurance.id))
                            .then(resolve("OK"));

                    } else {

                        this.handleTrace("CINS13", "No existe en SyncDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
                        resolve("OK");
                    }
                }.bind(this));
        }.bind(this));
    };

    /** 
     * [updateAttended Mark the notification as attended in IGW]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    /*sap.ui.sync.Insurance.prototype.updateAttended = function(oNotification) {

        this.handleTrace("CINS14", "Actualizar status de attended para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve, reject) {

            var oBody;
            oBody = { attended: "1" };

            sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
                .then(

                    this.handleTrace("CINS14", "Actualización de status OK: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                    .then(resolve(this.OK))

                ).catch(function(error) {

                    this.handleError("CINS14", "Error Actualizar status de attended para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
                        .then(this.saveUpdateError(oNotification))
                        .then(resolve(this.OK))

                }.bind(this));

        }.bind(this));
    };
*/

    sap.ui.sync.Insurance.prototype.updateAttended = function(oNotification) {

        this.handleTrace("CINS14", "TRAINING - Eliminar notificacion de sistema (PouchDB): " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve, reject) {


            //sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
            this.notiDB.delete(this.oDictionary.oQueues.InsuranceSystemNotification, oNotification.id, oNotification.rev)
                .then(this.handleTrace("CINS14", "TRAINING - Notificacion de Sistema elimnada de PouchDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                    .then(resolve(this.OK))
                ).catch(function(error) {

                    this.handleError("CINS14", "TRAINING - Error eliminar notificacion de sistema (PouchDB) para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
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
    sap.ui.sync.Insurance.prototype.saveUpdateError = function(oNotification) {

        this.handleTrace("CINS15", "Se requerira reintento de actualización de status (a Attended) de la notificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        var ErrorUpdate = {
            id: oNotification.notificationID
        };
        return new Promise(function(resolve, reject) {

            this.syncDB.post(this.oDictionary.oErrors.Notification, ErrorUpdate)
                .then(this.handleTrace("CINS15", "Reintento de actualización de status (a Attended) *Registrado* para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " guardado OK").then(resolve(this.ERROR)))
                .catch(this.handleError.bind(this, "CINS15", "##Error en el Reintento de actualización de status (a Attended) para la notificación " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID).then(resolve(this.ERROR)));

        }.bind(this));
    };




    /**
     * [processErrorNotification Process the error message inside a notification]
     * @param  {[Object]} oNotification   [Notification to process]
     * @param  {[Object]} oInsuranceSet [Object from DataDB]
     * @return {[Promise]}                 [Promise]
     */
    sap.ui.sync.Insurance.prototype.processErrorNotification = function(oNotification, oInsuranceSet) {


        return new Promise(function(resolve, reject) {

            this.handleTrace("CINS16", "Procesar error contenido en la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            var oErrorData;
            oErrorData = {

                id: oNotification.objectDMID,
                errorDetail: oNotification.message,
                type: oInsuranceSet.productID,
                NotificationID: oNotification.notificationID

            };

            this.upsertErrorNotificationData(oErrorData)
                .then(resolve(this.OK))
                .catch(
                    this.handleError.bind(this, "CINS16", "Error al actualizar error contenido en la notificación:  " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                .then(resolve(this.ERROR));

        }.bind(this));

    };

    /**
     * [upsertErrorNotificationData Update error content inside the notification]
     * @param  {[Object]} oErrorDataSync [Error to process]
     * @return {[Promise]}                [Promise]
     */
    sap.ui.sync.Insurance.prototype.upsertErrorNotificationData = function(oErrorDataSync) {


        return new Promise(function(resolve, reject) {

            this.handleTrace("CINS17", "Upsert información de error de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            this.syncDB.getById(this.oDictionary.oErrors.Insurance, oErrorDataSync.id)
                .then(function(_oErrorDataSync, result) { /// Confirmar si ya existe el registro del error, hacer upsert
                    if (result.BusinessErrorInsuranceSet) {
                        if (result.BusinessErrorInsuranceSet.length > 0) { // Ya existia previamente
                            _oErrorDataSync.rev = result.BusinessErrorInsuranceSet[0].rev;
                        }
                    }
                    this.syncDB.post(this.oDictionary.oErrors.Insurance, _oErrorDataSync).then(
                        this.handleTrace("CINS17", "Upsert información de error de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID).then(resolve(this.OK))
                    );

                }.bind(this, this.oDictionary, oErrorDataSync));

        }.bind(this));

    };



    sap.ui.sync.Insurance.prototype.deleteFromQueue = function(_sInsuranceId, _oDictionary) {

        return new Promise(function(resolveDeletePromise) {

            this.syncDB.getById(_oDictionary.oQueues.Insurance, _sInsuranceId)
                .then(function(_oDictionary, result) { /// Confirmar si ya existe el registro del error, hacer upsert

                    if (result.RequestQueueInsuranceSet) {
                        if (result.RequestQueueInsuranceSet.length > 0) { // Ya existia previamente

                            this.syncDB.delete(_oDictionary.oQueues.Insurance, result.RequestQueueInsuranceSet[0].id, result.RequestQueueInsuranceSet[0].rev)
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

                resolveDeletePromise("Error al eliminar el SEGURO del queue: " + error);

            });

        }.bind(this));

    };

})();