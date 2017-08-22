(function() {

    "use strict";
    jQuery.sap.declare("sap.ui.sync.BP");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.helper.Schema");
    jQuery.sap.require("js.helper.SyncResults");
    jQuery.sap.require("js.base.ObjectBase");
    jQuery.sap.require("js.serialize.bp.BPSerialize");




    sap.ui.base.Object.extend('sap.ui.sync.BP', {
        constructor: function(_dataDB, _syncDB, _sEntity) {

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
            this.loggerSMPComponent = "Guarantor_SYNC";
            this.ERROR = "ERROR";
            this.OK = "OK";
            this.BUSINESSERROR = "BUSINESSERROR";
            this.COMPLETED = "COMPLETED";
            this.oSyncResultHelper = new sap.ui.helper.SyncResults();

            this.sEntity = _sEntity;
            this.sEntitySet = _sEntity + "Set";

            if (_sEntity === "Guarantor") {

                this.sEntityFormatted = "Avales";

            } else {

                this.sEntityFormatted = "Solicitantes";
            }
 


        }
    });




    /*       
    Syncronization step catalog (New numbers between steps will be added with characters )
        
        SGT1 sendQueue
        SGT2 retrieveBPs
        SGT3 generateSendIndividualPromises
        SGT4 generateSinglePromise
        SGT5 sendRequest
        SGT6 processODataResponse
        SGT7 updateSyncQueue
        SGT8 clearBusinessError
        SGT9 processODataResponseError
        SGT10 upsertBusinessError
     */


    /**
     * [sendQueue - Entry point for the sending of the Guarantor Request sync queue]
     * @return {[Promise]} [Main promise]
     */
    sap.ui.sync.BP.prototype.sendQueue = function() {

        this.handleTrace("Inicio sincronización Guarantor", "****************");


        return new Promise(function(resolveMasterPromise) {

            ///////// Retrieve all customers requests

            var oNow;

            this.handleTrace("SGT1", "Inicio de sincronización || " + new Date() + " Type: " + this.sEntity);

            oNow = moment().format('DD/MM/YYYY HH:mm:ss');

            this.retrieveBPs().then(

                function(result) {

                    var aPromises;

                    aPromises = this.generateSendIndividualPromises(result, resolveMasterPromise);

                    Promise.all(aPromises).then(this.handleOKResult.bind(this, resolveMasterPromise, oNow))
                        .catch(function(error) {
                            this.handleError("SGT1", "Error al resolver Promise All ", error);
                            resolveMasterPromise(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, "", "", "¡Ups!, Ocurrio un error SGT1-PA al sincronizar " + this.sEntityFormatted + ", por favor comunicate con mesa de servicio.", "")));
                        }.bind(this));

                }.bind(this))

            .catch(function(error) {
                this.handleError("SGT1", "Error general de sincronización ", error)
                    .then(resolveMasterPromise(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, "", "", "¡Ups!, Ocurrio un error SGT1 al sincronizar " + this.sEntityFormatted + ", por favor comunicate con mesa de servicio.", ""))))
            }.bind(this));


        }.bind(this));

    };

    /**
     * [retrieveBPs Retrieves all BPs from PouchDB]
     * @return {[Promise]} [Return promise from the Query]
     */
    sap.ui.sync.BP.prototype.retrieveBPs = function() {

        this.handleTrace("SGT2", "");
        return this.syncDB.get("RequestQueue" + this.sEntity);

    };

    /**
     * [generateSendIndividualPromises Generate individual promises ]
     * @param  {[Array]} _aResults            [Records from SyncQueue]
     * @param  {[Promise]} resolveMasterPromise [Master promise to terminate the process in case no results were found]
     * @return {[Array]}                      [Array with individual promises]
     */
    sap.ui.sync.BP.prototype.generateSendIndividualPromises = function(_aResults, resolveMasterPromise) {

        this.handleTrace("SGT3", "");

        var i;
        var aPromises, oPromise;
        var results;

        aPromises = [];
        results = [];

        results = this.validatePouchResults(_aResults, "RequestQueue" + this.sEntitySet);



        results.forEach(function(result) {

            if (result.requestStatus != this.oDictionary.oRequestStatus.Sent) {
                aPromises.push(this.generateSinglePromise(result));
            }


        }.bind(this));

        if (results.length == 0 || aPromises.length == 0) {
            ////// No results to process
            //resolveMasterPromise(this.oSyncResultHelper.initializeSynchronizingResults());
            this.handleTrace("SGT3", "No records in SyncQueue to process");
        }

        return aPromises;

    };

    /**
     * [generateSinglePromise Generates the individual promise for synchronization]
     * @param  {[Object]} _oQueueItem [Item from the sync queue]
     * @return {[Promise]}             [Promise]
     */
    sap.ui.sync.BP.prototype.generateSinglePromise = function(_oQueueItem) {



        return new Promise(function(resolveSendPromise) {

                this.handleTrace("SGT4", _oQueueItem.id);

                ///// Deserialize
                var oBPserializer;

                oBPserializer = new sap.ui.serialize.BP("dataDB", this.sEntity);
                oBPserializer.deSerialize(_oQueueItem.id, false, true)
                    .then(this.sendRequest.bind(this, _oQueueItem, resolveSendPromise))
                    .catch(function(sError) {
                        this.handleError("SGT4", "Error al deserializar " + this.sEntity, sError);
                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "¡Ups!, Ocurrio un error SGT4 al sincronizar " + this.sEntityFormatted + ", por favor comunicate con mesa de servicio.", this.sEntity.toUpperCase()))
                        resolveSendPromise(this.ERROR);
                    }.bind(this))
            }.bind(this))
            .catch(function(sError) {

                this.handleError("SGT4", "Error al deserializar " + this.sEntity, sError);
                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "¡Ups!, Ocurrio un error SGT4B al sincronizar " + this.sEntityFormatted + ", por favor comunicate con mesa de servicio.", _oQueueItem.productID))

            }.bind(this));

    };

    /**
     * [sendRequest Makes the creation at OData level]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} result              [Item retrieved from PouchDB]
     */
    sap.ui.sync.BP.prototype.sendRequest = function(_oQueueItem, _resolveSendPromise, result) {

        var ObjectBase;
        ObjectBase = new sap.ui.mw.ObjectBase();
        ObjectBase.deletePropertyFromObject(result, "IsEntityInQueue");

        this.handleTrace("SGT5", _oQueueItem.id + " Payload: " + JSON.stringify(result));

        /*  -- Código para probar casos de error y éxito en el envio de un Guarantor
        
         if (!sap.ui.getCore().AppContext.fake) {
            _oQueueItem.requestUrl = _oQueueItem.requestUrl + "asd";
            sap.ui.getCore().AppContext.fake = true;
        } else {
            _oQueueItem.requestUrl = "/BPset";
        }*/

        //sap.ui.getCore().AppContext.oPostValidator.ValidateRequest(result, this.sEntity);

        //sap.ui.getCore().AppContext.myRest.create(_oQueueItem.requestUrl, result, true)
        this.simulatePost(_oQueueItem.requestUrl, result)
            .then(this.processODataResponse.bind(this, _oQueueItem, _resolveSendPromise))
            .catch(this.processODataResponseError.bind(this, _oQueueItem, _resolveSendPromise));


    };
    sap.ui.sync.BP.prototype.simulatePost = function(requestUrl, _result) {
        return new Promise(function(resolveSimulatePromise, rejectSimulatePromise) {
            if(_result.CustomerIdCRM===""){
                var aPhone=_result.PhoneSet;
                var aAddress=_result.AddressSet;
                var aImage=_result.ImageSet;
                var aEmployer=_result.EmployerSet;
                var aPersonalReference=_result.PersonalReferenceSet;
                delete _result.PhoneSet;
                delete _result.AddressSet;
                delete _result.ImageSet;
                delete _result.EmployerSet;
                delete _result.PersonalReferenceSet;

                
                _result.isNew=true;
                sap.ui.getCore().AppContext.myRest.create(requestUrl, _result, true)
                .then(function(respCustomer){
                    aPhone.forEach(function(entry) {
                        entry.CustomerIdCRM=respCustomer.data.CustomerIdCRM;
                        sap.ui.getCore().AppContext.myRest.create("/PhoneSet", entry, true)
                        .then(function(resp){console.log(resp)});
                    });
                    aAddress.forEach(function(entry) {
                        entry.CustomerIdCRM=respCustomer.data.CustomerIdCRM;
                        sap.ui.getCore().AppContext.myRest.create("/AddressSet", entry, true)
                        .then(function(resp){console.log(resp)});
                    });
                    aImage.forEach(function(entry) {
                        entry.CustomerIdCRM=respCustomer.data.CustomerIdCRM;
                        sap.ui.getCore().AppContext.myRest.create("/ImageSet", entry, true)
                        .then(function(resp){console.log(resp)});
                    });
                    aEmployer.forEach(function(entry) {
                        entry.CustomerIdCRM=respCustomer.data.CustomerIdCRM;
                        sap.ui.getCore().AppContext.myRest.create("/EmployerSet", entry, true)
                        .then(function(resp){console.log(resp)});
                    });
                    aPersonalReference.forEach(function(entry) {
                        entry.CustomerIdCRM=respCustomer.data.CustomerIdCRM;
                        sap.ui.getCore().AppContext.myRest.create("/PersonalReferenceSet", entry, true)
                        .then(function(resp){console.log(resp)});
                    });
                    resolveSimulatePromise(respCustomer)
                    
                   
                    
                })
            }
            else{
                _result.isNew=false;
                var oResult = {
                data: _result,
                statusCode: 201,
                statusText: "Created"
            };
            resolveSimulatePromise(oResult)

            }
            
        });
    };
        

    /**
     * [processODataResponse Process OK result from OData call]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} result              [Result from OData call]
     
     */
    sap.ui.sync.BP.prototype.processODataResponse = function(_oQueueItem, _resolveSendPromise, result) {

        this.handleTrace("SGT6", _oQueueItem.id);
        if (result.hasOwnProperty("statusCode")) {
            if (result.statusCode) {
                this.handleTrace("SGT6", _oQueueItem.id + " HTTP Status Code: " + result.statusCode);
            }
        }


        var oNotification;

        _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.Sent;

        /*if (_oQueueItem.hasOwnProperty("NotificationID")) {
            if (_oQueueItem.NotificationID != "") {
                oNotification = { notificationID: _oQueueItem.NotificationID };
            }
        }*/

        this.updateSyncQueue(_oQueueItem).then(

            // Aqui

            this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.OK, _oQueueItem.id, _oQueueItem.requestDescription, "OK", this.sEntity.toUpperCase()))
            .then(this.sendNotification(_oQueueItem, result, _resolveSendPromise))


        ).catch(function(sError) {
            this.handleError.bind("SGT6", "Error al actualizar Sync Queue a status 'Sent' de " + this.sEntity + " " + _oQueueItem.id, sError);
            _resolveSendPromise(this.ERROR);
        }.bind(this));



    };

    sap.ui.sync.BP.prototype.sendNotification = function(_oQueueItem, _result, _resolveSendPromise) {
        return new Promise(function(resolveSendNotification, rejectSendNotification) {
            jQuery.sap.require("js.buffer.notification.CustomerSystemNotificationBuffer");
            var oNotificationBuffer = new sap.ui.buffer.CustomerSystemNotification("notiDB");
            var message;

            

            if (_result.data.isNew) {
                message="BP CREADO EXITOSAMENTE";
              
            }else{
                message="BP no ha sido actualizado";
            }
            var oRequest = {
                id: _oQueueItem.id,
                notificationID: "123456",
                dateTime: "2017-07-19T21:05:27.280Z",
                status: 1,
                messageID: 109,
                message: message,
                objectTypeID: "1",
                objectDMID: _result.data.CustomerIdMD,
                objectCRMID: _result.data.CustomerIdCRM,
                attended: "0",
                customerDMID: _oQueueItem.id
            };

            oNotificationBuffer.postRequest(oRequest)
                .then(function() {
                    _resolveSendPromise("ok");
                });
        });
    };

    /**
     * [updateSyncQueue: Updates the sync Queue once the process has completed]   
     * @param  {[Object]} _oQueueItem [Item from the sync queue]
     * @return {[Promise]}             [Promise to update the Sync Queue]
     */
    sap.ui.sync.BP.prototype.updateSyncQueue = function(_oQueueItem) {


        return new Promise(function(resolveUpdatePromise, rejectUpdatePromise) {

            this.handleTrace("SGT7", _oQueueItem.id);

            this.syncDB.post("RequestQueue" + this.sEntity, _oQueueItem)
                .then(resolveUpdatePromise(this.OK))
                .catch(rejectUpdatePromise(this.ERROR));


            /*this.syncDB.getById("RequestQueue" + this.sEntity, _oQueueItem.id)
                .then(function(result) { /// Confirmar si ya existe el registro del error, hacer upsert

                    var aResults;
                    aResults = this.validatePouchResults(result, this.sEntitySet);


                    if (aResults.length > 0) { // Ya existia previamente
                        _oQueueItem.rev = aResults[0].rev;
                    }

                    this.syncDB.post("RequestQueue" + this.sEntity, _oQueueItem)
                        .then(resolveUpdatePromise(this.OK))
                        .catch(rejectUpdatePromise(this.ERROR));

                }.bind(this)) */

        }.bind(this));

    };

    /**
     * [clearBusinessError Removes business error record from PouchDB (if any)]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     */
    sap.ui.sync.BP.prototype.clearBusinessError = function(_oQueueItem, _resolveSendPromise) {



        this.syncDB.getById("BusinessError" + this.sEntity, _oQueueItem.id)
            .then(function(result) { /// Confirmar si ya existe el registro del error, hacer upsert

                this.handleTrace("SGT8", _oQueueItem.id);

                var aResults;
                aResults = this.validatePouchResults(result, this.sEntitySet);

                if (aResults > 0) {
                    this.syncDB.delete("BusinessError" + this.sEntity, aResults[0].id, aResults[0].rev)
                        .then(this.handleTrace("COMPLETED: ", _oQueueItem.id))
                        .then(_resolveSendPromise(this.COMPLETED));
                } else {
                    this.handleTrace("COMPLETED: ", _oQueueItem.id);
                    _resolveSendPromise(this.COMPLETED);
                }

            }.bind(this))
            .catch(function(sError) {

                this.handleError("SGT8", "Error al eliminar el Business Error de " + this.sEntity + " " + _oQueueItem.id, sError);
                _resolveSendPromise(this.ERROR);

            }.bind(this));



    };


    /**
     * [processODataResponseError Handler to process OData response in case of an error]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     * @param  {[Object]} results             [Results from OData Call (Error)]
     */
    sap.ui.sync.BP.prototype.processODataResponseError = function(_oQueueItem, _resolveSendPromise, results) {


        try {

            this.handleTrace("SGT9", "Error al enviar la petición OData para Guarantor: " + _oQueueItem.id + " Detalle: " + results);

            //sErrorMessage = "Uncomment to test business error";

            var sErrorMessage;
            var oErrorData;

            sErrorMessage = this.retrieveBusinessError(results);

            if (sErrorMessage != "") {

                this.handleTrace("SGT9", "Business error encontrado: " + sErrorMessage);

                oErrorData = {
                    id: _oQueueItem.id,
                    errorDetail: "Error al enviar Guarantor '" + _oQueueItem.requestDescription + "' : " + sErrorMessage,
                    type: this.sEntity.toUpperCase()
                };

                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.BUSINESSERROR, _oQueueItem.id, _oQueueItem.requestDescription, sErrorMessage, this.sEntity.toUpperCase()));
                this.upsertBusinessError(oErrorData, _oQueueItem, _resolveSendPromise);


            } else {

                //// Normal processing
                _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.Error;

                this.syncDB.update(this.oDictionary.oQueues.Guarantor, _oQueueItem.id, _oQueueItem)
                    .then(

                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "¡Ups! No se logró cargar toda la información. " + this.sEntityFormatted + ", Por favor, intenta de nuevo.", this.sEntity.toUpperCase()))
                        .then(this.deleteBusinessError(_oQueueItem, _resolveSendPromise))
                    )
                    .catch(this.handleError.bind(this, "SGT9", "Error al actualizar el status del Queue a 'Error' para " + this.sEntity + " " + _oQueueItem.id))
                    .then(_resolveSendPromise(this.ERROR));

            }

        } catch (error) {
            this.handleError("SLR9", "Error al procesar el error de la solicitud " + _oQueueItem.id, error);
            _resolveSendPromise(this.ERROR)
        }

    };

    /**
     * [upsertBusinessError Insert or update business error from synchronization]
     * @param  {[Object]} _oBusinessError     [Business error to update]
     * @param  {[Object]} _oQueueItem         [Item from the sync queue]
     * @param  {[Function]} _resolveSendPromise [Resolve for individual promise]
     */
    sap.ui.sync.BP.prototype.upsertBusinessError = function(_oBusinessError, _oQueueItem, _resolveSendPromise) {

        _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.BusinessError;
        this.syncDB.update("BusinessError" + this.sEntity, _oQueueItem.id, _oQueueItem)
            .then(_resolveSendPromise(this.BUSINESSERROR))
            .catch(this.handleError.bind(this, "SLR10", "Error al actualizar Business Error  " + _oQueueItem.id + "Detalle:" + _oBusinessError));
        /*
        this.syncDB.getById("BusinessError" + this.sEntity, _oBusinessError.id)
            .then(function(_oQueueItem,  _oBusinessError, result) { /// Confirmar si ya existe el registro del error, hacer upsert

                this.handleTrace("SGT10", _oQueueItem.id);

                var aResults;
                aResults = this.validatePouchResults(result, this.sEntitySet);

                if (aResults.length > 0) { // Ya existia previamente
                    _oBusinessError.rev = aResults[0].rev;
                }

                _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.BusinessError;

                this.syncDB.post("BusinessError" + this.sEntity, _oBusinessError).then(
                        this.syncDB.update("RequestQueue" + this.sEntity, _oQueueItem.id, _oQueueItem))
                    .then(_resolveSendPromise(this.BUSINESSERROR));


            }.bind(this, _oQueueItem,  _oBusinessError))
            .catch(this.handleError.bind(this, "SGT10", "Error al actualizar Business Error  " + _oQueueItem.id + "Detalle:" + _oBusinessError))
            .then(_resolveSendPromise(this.ERROR));   */


    };


    /**
     * [handleTrace Handle sync trace]
     * @param  {[String]} _sSyncStep  [Sync step key]
     * @param  {[Object]} _oTraceData [Trace  description]
     * @param  {[Boolean]} _bIsError   [Boolean to determine if the trace is an error]
     * @param  {[String]} sError      [Error (in case of an error)]
     * @return {[Promise]}             [Promise]
     */
    sap.ui.sync.BP.prototype.handleTrace = function(_sSyncStep, _oTraceData, _bIsError, sError) {

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
    sap.ui.sync.BP.prototype.handleError = function(_sSyncStep, _oTraceData, sError) {
        return this.oSyncResultHelper.handleError(_sSyncStep, _oTraceData, sError);
    };

    /**
     * [validatePouchResults Validates if a PouchDB result contains a specific collection]
     * @param  {[Array]} _aArray      [Results from PouchDB query]
     * @param  {[String]} _sCollection [EntitySet to evaluate]
     * @return {[Arrays]}              [Array with the results]
     */
    sap.ui.sync.BP.prototype.validatePouchResults = function(_aArray, _sCollection) {

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
    sap.ui.sync.BP.prototype.retrieveBusinessError = function(error) {

        var sErrorMessage, oErrorService;
        var oErrorData;
        var sMessage;

        sErrorMessage = "";

        try {

            oErrorService = JSON.parse(error);

            if (oErrorService.error.innererror.errordetails !== "undefined") {
                sErrorMessage = oErrorService.error.innererror.errordetails[0].message;
                if (sErrorMessage) {
                    if (sErrorMessage != "") {
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
    sap.ui.sync.BP.prototype.deleteBusinessError = function(_oQueueItem, _resolveSendPromise) {


        return this.syncDB.getById(this.oDictionary.oErrors.Guarantor, _oQueueItem.id)
            .then(function(result) { /// Confirmar si ya existe el registro del error, hacer upsert

                if (!_resolveSendPromise) {
                    _resolveSendPromise = function() {};
                }

                var aResults;
                aResults = this.validatePouchResults(result, "BusinessError " + this.sEntitySet);

                if (aResults.length > 0) {

                    this.syncDB.delete(this.oDictionary.oErrors.Guarantor, result.BusinessError[this.sEntitySet][0].id, result.BusinessError[this.sEntitySet][0].rev)
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
    sap.ui.sync.BP.prototype.addResults = function(_aResults) {

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
    sap.ui.sync.BP.prototype.handleOKResult = function(_resolveMasterPromise, oNow, results) {

        var oThen;

        oThen = moment().format('DD/MM/YYYY HH:mm:ss');

        this.handleTrace("SGT01", "Fin de sincronización, Tiempo transcurrido: " + moment.utc(moment(oThen, "DD/MM/YYYY HH:mm:ss").diff(moment(oNow, "DD/MM/YYYY HH:mm:ss"))).format("mm:ss"));

        //_resolveMasterPromise(this.addResults(results));

        _resolveMasterPromise("OK");

    };




    /*
        
    Confirmation (New numbers between steps will be added with characters )
        
        CGT01 confirmQueue
        CGT02 createIndividualPromises
        CGT03 generateNotificationPromise
        CGT04 reviewFormerNotificationError
        CGT05 retryNotificationUpdate
        CGT06 confirmNotification
        CGT07 verifyNotificationContent
        CGT08 deleteBPFromDataDB
        CGT09 deleteBPFromSyncDB
        CGT10 updateAttended
        CGT11 saveUpdateError
        CGT12 processErrorNotification
        CGT13 upsertErrorNotificationData
        

     */



    //******************************** Proceso de confirmación de notificaciones ********************************

    /**
     * [confirmQueue Entry method for confirmations]
     * @return {[Promise]} [Master promise for confirmation]
     */
    sap.ui.sync.BP.prototype.confirmQueue = function() {



        return new Promise(function(resolve, reject) {

            var oNow;
            var objectTypeID;
            oNow = moment().format('DD/MM/YYYY HH:mm:ss');
            if (this.sEntity === 'Customer') {
                objectTypeID = "1";
            } else {
                objectTypeID = "3";
            }

            this.handleTrace("CGT01", "Inicio de confirmación || " + new Date());

            this.handleTrace("CGT01", "Obtener notificaciones de tipo " + this.sEntity);

            //// 00000000000000 Regresar filtros  000000000000000000//
            sap.ui.getCore().AppContext.oRest.read("/SystemNotifications", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "' and attended eq '0' and objectTypeID eq '" + objectTypeID + "'", true)
                //sap.ui.getCore().AppContext.oRest.read("/SystemNotifications", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "'", true)
                //// 00000000000000 Regresar filtros 000000000000000000//

            .then(function(result) {
                //TRAINING - Consulta de notifiaciones de sistema en PouchDB
                jQuery.sap.require("js.buffer.notification.CustomerSystemNotificationBuffer");
                var oNotificationBuffer = new sap.ui.buffer.CustomerSystemNotification("notiDB");

                oNotificationBuffer.searchInNotiDB(this.oDictionary.oQueues.CustomerSystemNotification)
                    .then(function(result) {
                        var oMainPromise;
                        oMainPromise = this.createIndividualPromises(resolve, result); //.bind(this);
                        oMainPromise.then(
                            function(result) {
                                Promise.all(result)
                                    .then(this.processResults.bind(this, resolve, oNow))
                                    .catch(function(error) {
                                        this.handleError.bind(this, "CGT01", "¡Ups!, Ocurrio un error CGT01 al sincronizar " + this.sEntityFormatted + ", por favor comunicate con mesa de servicio.");
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
                    this.handleError("CGT01A", "Error general en la confirmación de " + this.sEntity, error);
                    this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.ERROR, "", "", "¡Ups! No se logró descargar toda la información de " + this.sEntityFormatted + ". Por favor, intenta de nuevo. ", "NOTIFICATION"));
                    resolve(this.ERROR);
                }.bind(this));;

        }.bind(this)).catch(function(error) {
            this.handleError("CGT01B", "Error general en la confirmación de " + this.sEntity + ". Error al obtener las notificaciones de oportunidades", error);
            this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.ERROR, "", "", "¡Ups! No se logró descargar toda la información de " + this.sEntityFormatted + ". Por favor, intenta de nuevo. ", "NOTIFICATION"));
            resolve(this.ERROR);
        }.bind(this));


    };

    /**
     * [processResults Final processing for confirmation]
     * @param  {[type]} resolve [Master promise to resolve]
     * @param  {[type]} oNow    [Date time of process start]
     * @param  {[type]} results [Results from confirmation]
     
     */
    sap.ui.sync.BP.prototype.processResults = function(resolve, oNow, results) {

        var bBusinessError;
        var oThen;
        bBusinessError = false;

        results.forEach(function(result) {
            result == this.BUSINESSERROR ? bBusinessError = true : bBusinessError = false;
        }.bind(this));

        oThen = moment().format('DD/MM/YYYY HH:mm:ss');

        this.handleTrace("CGT01", "Fin de confirmación, Tiempo transcurrido: " + moment.utc(moment(oThen, "DD/MM/YYYY HH:mm:ss").diff(moment(oNow, "DD/MM/YYYY HH:mm:ss"))).format("mm:ss"));

        bBusinessError == true ? resolve(this.BUSINESSERROR) : resolve(this.OK);


    };


    /**
     * [createIndividualPromises Take results and generate individual promises for confirmation]
     * @param  {[Function]} resolve [Master promise resolve]
     * @param  {[Object]} oResult [Result of pending confirmations]
     * @return {[Promise]}         [Promise]
     */
    sap.ui.sync.BP.prototype.createIndividualPromises = function(resolve, oResult) {

        this.handleTrace("CGT02", "Creación de promesas individuales");

        return new Promise(function(resolveIndividual) {

                var aPromises = [];

                if (oResult.results.length > 0) {

                    oResult.results.forEach(function(entry) {

                        aPromises.push(this.generateNotificationPromise(entry));

                    }.bind(this));

                    resolveIndividual(aPromises);

                } else {
                    this.handleTrace("CGT02", "La lista de notificaciones viene vacia");
                    resolveIndividual(aPromises);
                }



            }.bind(this))
            .catch(function(error) {
                this.handleError("CGT02", "Error al generar las notificaciones individuales de " + this.sEntity, error);
            }.bind(this));

    };

    /**
     * [generateNotificationPromise Generation of individual confirmation promise]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Notification Promise]
     */
    sap.ui.sync.BP.prototype.generateNotificationPromise = function(oNotification) {

        this.handleTrace("CGT03", "Generación de promesa individual : " + oNotification.notificationID + " Notification: " + JSON.stringify(oNotification));

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
                        this.handleTrace("CGT03", "Termina OK:" + oNotification.notificationID);
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
    sap.ui.sync.BP.prototype.reviewFormerNotificationError = function(oNotification) {

        return new Promise(function(resolve) {


            this.handleTrace("CGT04", "Revision de error previo para Notificacion : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            this.syncDB.getById(this.oDictionary.oErrors.Notification, oNotification.notificationID)
                .then(function(oNotification, oResult) {

                    if (oResult.SystemErrorNotificationSet.length === 0) {
                        /// Realizar procesamiento normal de la notificación 
                        resolve("NormalProcessing");

                    } else {

                        /// Existe un error previo para la actualización del status de la notificación
                        /// hacia el status "Attended", como la notificación ya fue procesada, no procesar
                        /// nuevamente
                        this.retryNotificationUpdate(oNotification, oResult).then(resolve(this.ERROR));
                    }


                }.bind(this, oNotification));

        }.bind(this));



    }

    /**
     * [retryNotificationUpdate Make Update to notification in IGW in case the original update had failed]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.BP.prototype.retryNotificationUpdate = function(oNotification, oResult) {
        return new Promise(function(resolve, reject) {

            this.handleTrace("CGT05", "Reintentar actualización del status de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " (a Attended) ");

            var oBody;
            oBody = {
                attended: "1"
            };

            sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
                .then(function(oResult, oNotification, result) {

                    /// Eliminar el registro de error de notificación de PouchDB
                    this.syncDB.delete(this.oDictionary.oErrors.Notification, oResult.SystemErrorNotificationSet[0].id, oResult.SystemErrorNotificationSet[0].rev)
                        .then(this.handleTrace("CGT05", "Actualización de status de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " (a Attended) OK ").then(resolve(this.OK)))
                        .then(resolve(this.OK))

                }.bind(this, oResult, oNotification))
                .catch(function(error) {
                    this.handleError("CGT05", "Error en la actualización del status de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " (a Attended) ", error).then(resolve(this.ERROR))
                }.bind(this))

        }.bind(this));
    };

    /**
     * [confirmNotification Review if there is a record to process for the current notification]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.BP.prototype.confirmNotification = function(oNotification) {


        this.handleTrace("CGT06", "Revisa si Guarantor existe en DataDB para Notificacion : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(confirmNotificationResolve, confirmNotificationReject) {

            this.dataDB.getById(this.sEntity, oNotification.objectDMID)
                .then(this.verifyNotificationContent.bind(this, oNotification, confirmNotificationResolve))
                .catch(function(error) {
                    this.handleError.bind(this, "CGT06", "Error al verificar el contenido de la notificación  " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
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
    sap.ui.sync.BP.prototype.verifyNotificationContent = function(oNotification, resolve, oResult) {

        this.handleTrace("CGT07", "Verificar información contenida en la notificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        if (oResult[this.sEntitySet].length > 0) {

            ////// Verificar como se procesara la notificación
            if (oNotification.message.toUpperCase() == "BP CREADO EXITOSAMENTE" || oNotification.message.toUpperCase() == "BP MODIFICADO EXITOSAMENTE" || oNotification.message.toUpperCase() == "AVAL CREADO EXITOSAMENTE" || oNotification.message.toUpperCase() == "AVAL MODIFICADO EXITOSAMENTE") {
                /// Camino normal

                this.handleTrace("CGT07", "La notificación reporta exito en la Creación/Modificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

                this.deleteBPFromDataDB(oNotification, oResult)
                    .then(function(result) {
                        this.deleteBPFromSyncDB(oNotification)
                            .then(function(result) {
                                this.updateAttended(oNotification)
                                    .then(
                                        this.handleTrace("CGT07", "COMPLETED: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                                        .then(resolve(this.OK)));
                            }.bind(this));
                    }.bind(this))
                    .catch(function(error) {
                        this.handleError("CGT07", "Error al eliminar " + this.sEntity + " de DataDB/SyncDB " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
                            .then(resolve(this.ERROR));
                    }.bind(this, oNotification));

            } else {
                /// Else, notification not OK, guardar Business Error  :::::::::

                this.handleTrace("CGT07", "La notificación reporta un error: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.BUSINESSERROR, oNotification.objectDMID, this.getBPDescription(oResult), oNotification.message.toUpperCase(), this.sEntity.toUpperCase()))
                    .then(resolve(this.BUSINESSERROR))

                /*this.processErrorNotification(oNotification)
                    .then(

                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.BUSINESSERROR, oNotification.objectDMID, this.getBPDescription(oResult), oNotification.message.toUpperCase(), this.sEntity.toUpperCase()))
                        .then(resolve(this.BUSINESSERROR))
                    ); */
                /// Resuelve BUSINESSERROR para marcarla y mostrarla en la colección de errores

            }



        } else {
            this.handleTrace("CGT07", "No existe en DataDB, Guarantor para notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
            resolve(this.OK);
        }


    };

    /**
     * [getBPDescription Get description for the current Guarantor]
     * @param  {[Object]} oResult [Result from Pouch where BPset is content]
     * @return {[String]}         [Guarantor Request description]
     */
    sap.ui.sync.BP.prototype.getBPDescription = function(oResult) {

        try {

            if (oResult.hasOwnProperty(this.sEntitySet)) {

                return oResult[this.sEntitySet][0].BpName.FirstName + " " + oResult[this.sEntitySet][0].BpName.MiddleName + " " + oResult[this.sEntitySet][0].BpName.LastName + " " + oResult[this.sEntitySet][0].BpName.SecondName;

            }

            return "";

        } catch (error) {
            return "";
        }

    };

    /**
     * [deleteBPFromDataDB Delete Guarantor Record when the process has gone correctly]
     * @param  {[Object]} oNotification [Notification object to process]
     * @param  {[Object]} oResult       [Data coming from PouchDB
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.BP.prototype.deleteBPFromDataDB = function(oNotification, oResult) {

        this.handleTrace("CGT08", "Eliminar Guarantor de DATADB : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve, reject) {
            ///// Si los customers asociados fueron insertados unicamente por Guarantor, eliminar de Pouch

            this.dataDB.delete(this.sEntity, oResult[this.sEntitySet][0].id, oResult[this.sEntitySet][0].rev)
                .then(this.handleTrace("CGT08", "Registro de Guarantor eliminado en DataDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)

                    .then(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.OK, oNotification.objectDMID, this.getBPDescription(oResult), "OK", this.sEntity.toUpperCase()))) //// Reportar resultado OK en la pantalla
                    .then(resolve(this.OK)))
                .catch(this.handleError.bind(this, "CGT08", "Error al eliminar registro de LonaRequest en DataDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)).then(resolve(this.ERROR))


        }.bind(this));
    };




    /**
     * [deleteBPFromSyncDB Delete the processed Guarantor from SyncDB]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.BP.prototype.deleteBPFromSyncDB = function(oNotification) {

        this.handleTrace("CGT09", "Eliminar Guarantor de SYNCDB : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve, reject) {

            this.syncDB.getById("RequestQueue" + this.sEntity, oNotification.objectDMID)
                .then(function(oResult) {
                    if (oResult.hasOwnProperty("RequestQueue" + this.sEntity + "Set")) {
                        if (oResult["RequestQueue" + this.sEntity + "Set"].length > 0) {

                            this.handleTrace("CGT09", "Existe en SyncDB, borrando : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
                            this.syncDB.delete("RequestQueue" + this.sEntity, oResult["RequestQueue" + this.sEntity + "Set"][0].id, oResult["RequestQueue" + this.sEntity + "Set"][0].rev)
                                .then(resolve(oNotification))
                                .catch(this.handleError.bind(this, "CGT09", "Error al eliminar registro de Guarantor en SYNCDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)).then(resolve(oNotification));

                        } else {

                            this.handleTrace("CGT09", "No existe en SyncDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
                            resolve(oNotification);
                        }

                    }
                }.bind(this));
        }.bind(this));
    };

    /** 
     * [updateAttended Mark the notification as attended in IGW]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    /* sap.ui.sync.BP.prototype.updateAttended = function(oNotification) {

        this.handleTrace("CGT10", "Actualizar status de attended para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve, reject) {

            var oBody;
            oBody = { attended: "1" };

            sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
                .then(

                    this.handleTrace("CGT10", "Actualización de status OK: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                    .then(resolve(this.OK))

                ).catch(function(error) {

                    this.handleError("CGT10", "Error Actualizar status de attended para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
                        .then(this.saveUpdateError(oNotification))
                        .then(resolve(this.OK))

                }.bind(this));

        }.bind(this));
    }; */

    sap.ui.sync.BP.prototype.updateAttended = function(oNotification) {

        this.handleTrace("CINS14", "TRAINING - Eliminar notificacion de sistema (PouchDB): " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

        return new Promise(function(resolve, reject) {


            //sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
            this.notiDB.delete(this.oDictionary.oQueues.CustomerSystemNotification, oNotification.id, oNotification.rev)
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
    sap.ui.sync.BP.prototype.saveUpdateError = function(oNotification) {

        this.handleTrace("CGT11", "Se requerira reintento de actualización de status (a Attended) de la notificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        var ErrorUpdate = {
            id: oNotification.notificationID
        };
        return new Promise(function(resolve, reject) {

            this.syncDB.post(this.oDictionary.oErrors.Notification, ErrorUpdate)
                .then(this.handleTrace("CGT11", "Reintento de actualización de status (a Attended) *Registrado* para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " guardado OK").then(resolve(this.ERROR)))
                .catch(this.handleError.bind(this, "CGT11", "##Error en el Reintento de actualización de status (a Attended) para la notificación " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID).then(resolve(this.ERROR)));

        }.bind(this));
    };




    /**
     * [processErrorNotification Process the error message inside a notification]
     * @param  {[Object]} oNotification   [Notification to process]
     * @param  {[Object]} oBPset [Object from DataDB]
     * @return {[Promise]}                 [Promise]
     */
    sap.ui.sync.BP.prototype.processErrorNotification = function(oNotification) {


        return new Promise(function(resolve, reject) {

            this.handleTrace("CGT12", "Procesar error contenido en la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            var oErrorData;
            oErrorData = {

                id: oNotification.objectDMID,
                errorDetail: oNotification.message,
                type: this.sEntity.toUpperCase(),
                NotificationID: oNotification.notificationID

            };

            this.upsertErrorNotificationData(oErrorData)
                .then(resolve(this.OK))
                .catch(
                    this.handleError.bind(this, "CGT12", "Error al actualizar error contenido en la notificación:  " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                .then(resolve(this.ERROR));

        }.bind(this));

    };

    /**
     * [upsertErrorNotificationData Update error content inside the notification]
     * @param  {[Object]} oErrorDataSync [Error to process]
     * @return {[Promise]}                [Promise]
     */
    sap.ui.sync.BP.prototype.upsertErrorNotificationData = function(oErrorDataSync) {


        return new Promise(function(resolve, reject) {

            this.handleTrace("CGT13", "Upsert información de error de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);

            this.syncDB.getById("BusinessError" + this.sEntity, oErrorDataSync.id)
                .then(function(_oErrorDataSync, result) { /// Confirmar si ya existe el registro del error, hacer upsert
                    if (result.BusinessError[this.sEntitySet]) {
                        if (result.BusinessError[this.sEntitySet].length > 0) { // Ya existia previamente
                            _oErrorDataSync.rev = result.BusinessError[this.sEntitySet][0].rev;
                        }
                    }
                    this.syncDB.post("BusinessError" + this.sEntity, _oErrorDataSync).then(
                        this.handleTrace("CGT13", "Upsert información de error de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID).then(resolve(this.OK))
                    );

                }.bind(this, this.oDictionary, oErrorDataSync));

        }.bind(this));

    };



    sap.ui.sync.BP.prototype.deleteFromQueue = function(_sBPId, _oDictionary) {

        return new Promise(function(resolveDeletePromise) {

            this.syncDB.getById("RequestQueue" + this.sEntity, _sBPId)
                .then(function(_oDictionary, result) { /// Confirmar si ya existe el registro del error, hacer upsert

                    if (result["RequestQueue" + this.sEntitySet]) {
                        if (result["RequestQueue" + this.sEntitySet].length > 0) { // Ya existia previamente

                            this.syncDB.delete(_oDictionary.oQueues.Guarantor, result["RequestQueue" + this.sEntitySet][0].id, result["RequestQueue" + this.sEntitySet][0].rev)
                                .then(function(success) {
                                    resolveDeletePromise("OK");
                                });
                        } else {
                            resolveDeletePromise("OK");
                        }
                    } else {
                        resolveDeletePromise("OK");
                    }

                }.bind(this, _oDictionary)).catch(function(error) {

                    resolveDeletePromise("Error al eliminar Guarantor del queue: " + error);

                });

        }.bind(this));

    };







})();
