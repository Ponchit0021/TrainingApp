(function() {

    "use strict";
    jQuery.sap.declare("sap.ui.sync.CrossSellOffer");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.helper.Schema");
    jQuery.sap.require("js.helper.SyncResults");
    jQuery.sap.require("js.base.ObjectBase");
    jQuery.sap.require("js.serialize.crosssell.CrossSellOfferSerialize");

    sap.ui.base.Object.extend('sap.ui.sync.CrossSellOffer', {
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
            this.loggerSMPComponent = "CROSSSELLOFFER_SYNC";
            this.ERROR = "ERROR";
            this.OK = "OK";
            this.BUSINESSERROR = "BUSINESSERROR";
            this.COMPLETED = "COMPLETED";
            this.oSyncResultHelper = new sap.ui.helper.SyncResults();

            this.sEntity = _sEntity;
            this.sEntitySet = _sEntity + "Set";
        }
    });

    //******************************** Proceso de envio ********************************
    /*
    SCSO1 sendQueue
    SCSO2 retrieveOffers
    SCSO3 generateSendIndividualPromises
    SCSO4 generateSinglePromise
    SCSO5 sendRequest
    SCSO6 processODataResponse
    SCSO7 updateSyncQueue
    SCSO8 clearBusinessError
    SCSO9 processODataResponseError
    SCSO10 upsertBusinessError
    */

    sap.ui.sync.CrossSellOffer.prototype.sendQueue = function() {
        this.handleTrace("Inicio sincronización Oferta de Crédito", "****************");
        return new Promise(function(resolveMasterPromise) {
            //retrieve all cross sell offers
            var oNow;
            this.handleTrace("SCSO1", "Inicio de sincronización || " + new Date() + " Type: " + this.sEntity);
            oNow = moment().format('DD/MM/YYYY HH:mm:ss');
            this.retrieveOffers()
                .then(function(result) {
                    var aPromises;
                    aPromises = this.generateSendIndividualPromises(result, resolveMasterPromise);
                    Promise.all(aPromises).then(this.handleOKResult.bind(this, resolveMasterPromise, oNow))
                        .catch(function(error) {
                            this.handleError("SCSO1", "Error al resolver Promise All ", error);
                            resolveMasterPromise(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, "", "", "¡Ups!, Ocurrio un error SCSO1-PA al sincronizar " + this.sEntityFormatted + ", por favor comunicate con mesa de servicio.", "")));
                        }.bind(this));

                }.bind(this))

                .catch(function(error) {
                    this.handleError("SCSO1", "Error general de sincronización ", error)
                        .then(resolveMasterPromise(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, "", "", "¡Ups!, Ocurrio un error SCSO1 al sincronizar " + this.sEntityFormatted + ", por favor comunicate con mesa de servicio.", ""))))
                }.bind(this));

        }.bind(this));
    };
    sap.ui.sync.CrossSellOffer.prototype.retrieveOffers = function() {
        this.handleTrace("SCSO2", "");
        return this.syncDB.get("RequestQueue" + this.sEntity);
    };
    sap.ui.sync.CrossSellOffer.prototype.generateSendIndividualPromises = function(_aResults, resolveMasterPromise) {
        this.handleTrace("SCSO3", "");
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
            // No results to process
            this.handleTrace("SCSO3", "No records in SyncQueue to process");
        }
        return aPromises;
    };
    sap.ui.sync.CrossSellOffer.prototype.generateSinglePromise = function(_oQueueItem) {
        return new Promise(function(resolveSendPromise) {
            this.handleTrace("SCSO4", _oQueueItem.id);
            var oSerializer;
            oSerializer = new sap.ui.serialize.CrossSellOfferSerialize("dataDB");
            oSerializer.deSerialize(_oQueueItem)
                .then(this.sendRequest.bind(this, _oQueueItem, resolveSendPromise))
                .catch(function(sError) {
                    this.handleError("SCSO4", "Error al deserializar " + this.sEntity, sError);
                    this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "¡Ups!, Ocurrio un error SCSO4 al sincronizar " + this.sEntityFormatted + ", por favor comunicate con mesa de servicio.", this.sEntity.toUpperCase()))
                    resolveSendPromise(this.ERROR);
                }.bind(this))
        }.bind(this));
    };
    sap.ui.sync.CrossSellOffer.prototype.sendRequest = function(_oQueueItem, _resolveSendPromise, result) {
        this.handleTrace("SCSO5", _oQueueItem.id + " Payload: " + JSON.stringify(result));
        //TRAINING - Se simula el POST
        //sap.ui.getCore().AppContext.myRest.create(_oQueueItem.requestUrl, result, true)
        this.simulatePost(_oQueueItem.requestUrl, result)
            .then(this.processODataResponse.bind(this, _oQueueItem, _resolveSendPromise))
            .catch(this.processODataResponseError.bind(this, _oQueueItem, _resolveSendPromise));
    };
    //TRAINING - Simulación de POST
    sap.ui.sync.CrossSellOffer.prototype.simulatePost = function(_oQueueItem, _result) {
        return new Promise(function(resolveSimulatePromise, rejectSimulatePromise) {
            var oResult = {
                data: _result,
                statusCode: 201,
                statusText: "Created"
            };
            resolveSimulatePromise(oResult)
        });
    };
    sap.ui.sync.CrossSellOffer.prototype.updateSyncQueue = function(_oQueueItem) {
        return new Promise(function(resolveUpdatePromise, rejectUpdatePromise) {
            this.handleTrace("SCSO7", _oQueueItem.id);
            this.syncDB.post("RequestQueue" + this.sEntity, _oQueueItem)
                .then(resolveUpdatePromise(this.OK))
                .catch(rejectUpdatePromise(this.ERROR));
        }.bind(this));
    };
    sap.ui.sync.CrossSellOffer.prototype.processODataResponse = function(_oQueueItem, _resolveSendPromise, result) {
        this.handleTrace("SCSO6", _oQueueItem.id);
        if (result.hasOwnProperty("statusCode")) {
            if (result.statusCode) {
                this.handleTrace("SCSO6", _oQueueItem.id + " HTTP Status Code: " + result.statusCode);
            }
        }
        var oNotification;
        _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.Sent;
        this.updateSyncQueue(_oQueueItem).then(
            this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.OK, _oQueueItem.id, _oQueueItem.requestDescription, "OK", this.sEntity.toUpperCase()))
            //TRAINING - Se comenta para realizar petición de envio de notificación sendNotification()
            //.then(_resolveSendPromise(this.OK))
            .then(this.sendNotification(_oQueueItem, result, _resolveSendPromise))
        ).catch(function(sError) {
            this.handleError.bind("SCSO6", "Error al actualizar Sync Queue a status 'Sent' de " + this.sEntity + " " + _oQueueItem.id, sError);
            _resolveSendPromise(this.ERROR);
        }.bind(this));
    };

    sap.ui.sync.CrossSellOffer.prototype.processODataResponseError = function(_oQueueItem, _resolveSendPromise, results) {
        try {
            this.handleTrace("SCSO9", "Error al enviar la petición OData para Oferta de Crédito: " + _oQueueItem.id + " Detalle: " + results);
            var sErrorMessage;
            var oErrorData;
            sErrorMessage = this.retrieveBusinessError(results);

            if (sErrorMessage != "") {
                this.handleTrace("SCSO9", "Business error encontrado: " + sErrorMessage);

                oErrorData = {
                    id: _oQueueItem.id,
                    errorDetail: "Error al enviar Oferta de Crédito '" + _oQueueItem.requestDescription + "' : " + sErrorMessage,
                    type: this.sEntity.toUpperCase()
                };

                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.BUSINESSERROR, _oQueueItem.id, _oQueueItem.requestDescription, sErrorMessage, this.sEntity.toUpperCase()));
                this.upsertBusinessError(oErrorData, _oQueueItem, _resolveSendPromise);

            } else {
                //Normal processing
                _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.Error;

                this.syncDB.update(this.oDictionary.oQueues.CrossSellOffer, _oQueueItem.id, _oQueueItem)
                    .then(
                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("SYNC", this.ERROR, _oQueueItem.id, _oQueueItem.requestDescription, "¡Ups! No se logró cargar toda la información. " + this.sEntityFormatted + ", Por favor, intenta de nuevo.", this.sEntity.toUpperCase()))
                        .then(this.deleteBusinessError(_oQueueItem, _resolveSendPromise))
                    )
                    .catch(this.handleError.bind(this, "SCSO9", "Error al actualizar el status del Queue a 'Error' para " + this.sEntity + " " + _oQueueItem.id))
                    .then(_resolveSendPromise(this.ERROR));
            }

        } catch (error) {
            this.handleError("SCSO9", "Error al procesar el error de la Oferta de Crédito " + _oQueueItem.id, error);
            _resolveSendPromise(this.ERROR)
        }
    };
    sap.ui.sync.CrossSellOffer.prototype.upsertBusinessError = function(_oBusinessError, _oQueueItem, _resolveSendPromise) {
        _oQueueItem.requestStatus = this.oDictionary.oRequestStatus.BusinessError;
        this.syncDB.update("BusinessError" + this.sEntity, _oQueueItem.id, _oQueueItem)
            .then(_resolveSendPromise(this.BUSINESSERROR))
            .catch(this.handleError.bind(this, "SCSO10", "Error al actualizar Business Error  " + _oQueueItem.id + "Detalle:" + _oBusinessError));
    };
    sap.ui.sync.CrossSellOffer.prototype.validatePouchResults = function(_aArray, _sCollection) {
        if (_aArray.hasOwnProperty(_sCollection)) {
            if (Array.isArray(_aArray[_sCollection])) {
                return _aArray[_sCollection];
            }
        }
        return [];
    };
    sap.ui.sync.CrossSellOffer.prototype.handleOKResult = function(_resolveMasterPromise, oNow, results) {
        var oThen;
        oThen = moment().format('DD/MM/YYYY HH:mm:ss');
        this.handleTrace("SCSO1", "Fin de sincronización, Tiempo transcurrido: " + moment.utc(moment(oThen, "DD/MM/YYYY HH:mm:ss").diff(moment(oNow, "DD/MM/YYYY HH:mm:ss"))).format("mm:ss"));
        _resolveMasterPromise("OK");
    };

    /*TRAINING - Se agrega método sendNotification para emular notificaciones de sistema
     * @params
     */
    sap.ui.sync.CrossSellOffer.prototype.sendNotification = function(_oQueueItem, result, _resolveSendPromise) {

        return new Promise(function(resolveSendNotification, rejectSendNotification) {
            jQuery.sap.require("js.buffer.notification.CrossSellSystemNotificationBuffer");
            var oSystemNotificationBuffer = new sap.ui.buffer.CrossSellSystemNotification("notiDB");

            var oRequest = {
                id: _oQueueItem.id,
                notificationID: _oQueueItem.id,
                dateTime: new Date(),
                status: 1,
                messageID: 125,
                message: "",
                objectTypeID: "5",
                description: _oQueueItem.requestDescription,
                objectDMID: _oQueueItem.id,
                productId: result.data.CrossSellProductId,
                attended: "0"
            };

            //TRAINING - Se ajusta mensaje de notificación
            if (result.data.IsAccepted === true) {
                oRequest.message = "La Oferta de Credito Hijo fue Aceptada"
            } else {
                oRequest.message = "La Oferta de Credito Hijo fue Rechazada"
            }

            oSystemNotificationBuffer.postRequest(oRequest)
                .then(function() {
                    _resolveSendPromise("ok");
                });
        });
    };

    //******************************** Fin - Proceso de envio **************************







    //******************************** Proceso de confirmación de notificaciones ********************************
    /*
        Confirmation(New numbers between steps will be added with characters)
        CCSO01 confirmQueue
        CCSO02 createIndividualPromises
        CCSO03 generateNotificationPromise
        CCSO04 reviewFormerNotificationError
        CCSO05 retryNotificationUpdate
        CCSO06 confirmNotification
        CCSO07 verifyNotificationContent
        CCSO08 deleteCrossSellOfferFromDataDB

        CCSO08 deleteCrossSellOfferFromSyncDB
        CCSO09 updateAttended
        CCSO10 saveUpdateError
        CCSO11 processErrorNotification
        CCSO12 upsertErrorNotificationData
    */
    //******************************** Proceso de confirmación de notificaciones ********************************


    /**
     * [confirmQueue Entry method for confirmations]
     * @return {[Promise]} [Master promise for confirmation]
     */
    sap.ui.sync.CrossSellOffer.prototype.confirmQueue = function() {
        return new Promise(function(resolve, reject) {
                var oNow;
                oNow = moment().format('DD/MM/YYYY HH:mm:ss');
                this.handleTrace("CCSO01", "Inicio de confirmación || " + new Date());
                this.handleTrace("CCSO01", "Obtener notificaciones de tipo Loan Request - Productos Hijo");
                //se obtienen notificaciones de tipo LoanRequest - Productos Hijo

                //TRAINING - Consulta de notifiaciones de sistema en PouchDB
                jQuery.sap.require("js.buffer.notification.CrossSellSystemNotificationBuffer");
                var oSystemNotificationBuffer = new sap.ui.buffer.CrossSellSystemNotification("notiDB");
                //sap.ui.getCore().AppContext.oRest.read("/SystemNotifications", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "' and attended eq '0' and objectTypeID eq '5'", true)
                oSystemNotificationBuffer.searchInNotiDB(this.oDictionary.oQueues.CrossSellSystemNotification)
                    .then(function(result) {
                        var oMainPromise;
                        oMainPromise = this.createIndividualPromises(resolve, result);
                        oMainPromise.then(
                            function(result) {
                                Promise.all(result)
                                    .then(this.processResults.bind(this, resolve, oNow))
                                    .catch(function(error) {
                                        this.handleError.bind(this, "CCSO01", "¡Ups!, Ocurrio un error CCSO01 al sincronizar Oferta de Créditos Hijo, por favor comunicate con mesa de servicio." + error);
                                        resolve(this.ERROR);
                                    }.bind(this));
                            }.bind(this));
                    }.bind(this))
                    .catch(function(error) {
                        this.handleError("CCSO01", "Error general en la confirmación de Oferta de Créditos Hijo. Error al obtener las notificaciones de oportunidades", error);
                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.ERROR, "", "", "¡Ups! No se logró descargar toda la información de Oferta de Crédito. Por favor, intenta de nuevo. ", "NOTIFICATION"));
                        resolve(this.ERROR);
                    }.bind(this));
            }.bind(this))
            .catch(function(error) {
                this.handleError("CCSO01a", "Error general en la confirmación de Oferta de Créditos Hijo. Error al obtener las notificaciones de oportunidades", error);
                this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.ERROR, "", "", "¡Ups! No se logró descargar toda la información de Oferta de Crédito. Por favor, intenta de nuevo.", "NOTIFICATION"));
                resolve(this.ERROR);
            }.bind(this));
    };
    /**
     * [processResults Final processing for confirmation]
     * @param  {[type]} resolve [Master promise to resolve]
     * @param  {[type]} oNow    [Date time of process start]
     * @param  {[type]} results [Results from confirmation]
     */
    sap.ui.sync.CrossSellOffer.prototype.processResults = function(resolve, oNow, results) {
        var bBusinessError;
        var oThen;
        bBusinessError = false;
        results.forEach(function(result) {
            result == this.BUSINESSERROR ? bBusinessError = true : bBusinessError = false;
        }.bind(this));
        oThen = moment().format('DD/MM/YYYY HH:mm:ss');
        this.handleTrace("CCSO01", "Fin de confirmación, Tiempo transcurrido: " + moment.utc(moment(oThen, "DD/MM/YYYY HH:mm:ss").diff(moment(oNow, "DD/MM/YYYY HH:mm:ss"))).format("mm:ss"));
        bBusinessError == true ? resolve(this.BUSINESSERROR) : resolve(this.OK);
    };
    /**
     * [createIndividualPromises Take results and generate individual promises for confirmation]
     * @param  {[Function]} resolve [Master promise resolve]
     * @param  {[Object]} oResult [Result of pending confirmations]
     * @return {[Promise]}         [Promise]
     */
    sap.ui.sync.CrossSellOffer.prototype.createIndividualPromises = function(resolve, oResult) {
        this.handleTrace("CCSO02", "Creación de promesas individuales");
        return new Promise(function(resolveIndividual) {
                var aPromises = [];
                if (oResult.results.length > 0) {
                    oResult.results.forEach(function(entry) {
                        aPromises.push(this.generateNotificationPromise(entry));
                    }.bind(this));
                    resolveIndividual(aPromises);
                } else {
                    this.handleTrace("CCSO02", "La lista de notificaciones viene vacia");
                    resolveIndividual(aPromises);
                }
            }.bind(this))
            .catch(function(error) {
                this.handleError("CCSO02", "Error al generar las notificaciones individuales de oportunidades", error);
            }.bind(this));
    };
    /**
     * [generateNotificationPromise Generation of individual confirmation promise]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Notification Promise]
     */
    sap.ui.sync.CrossSellOffer.prototype.generateNotificationPromise = function(oNotification) {
        this.handleTrace("CCSO03", "Generación de promesa individual : " + oNotification.notificationID + " Notification: " + JSON.stringify(oNotification));
        return new Promise(function(resolve, reject) {
            //Valida si existe error 
            this.reviewFormerNotificationError(oNotification)
                .then(function(result) {
                    if (result === "NormalProcessing") {
                        // Continuar procesamiento normal
                        this.confirmNotification(oNotification).then(function(msg) {
                            resolve(msg);
                        });
                    } else {
                        this.handleTrace("CCSO03", "Termina OK:" + oNotification.notificationID);
                        resolve(this.OK);
                    }
                }.bind(this))
                .catch(function(error) {
                    this.handleError("CCSO03", "Error al validar notificación previa ", error);
                    resolve(this.ERROR);
                }.bind(this));
        }.bind(this));
    };
    /**
     * [reviewFormerNotificationError Review if there was an Error associated to this notification in a previous sync]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.CrossSellOffer.prototype.reviewFormerNotificationError = function(oNotification) {
        return new Promise(function(resolve) {
            this.handleTrace("CCSO04", "Revision de error previo para Notificacion : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
            this.syncDB.getById(this.oDictionary.oErrors.Notification, oNotification.notificationID)
                .then(function(oResult) {
                    if (oResult.SystemErrorNotificationSet.length === 0) {
                        // Realizar procesamiento normal de la notificación 
                        resolve("NormalProcessing");
                    } else {
                        // Existe un error previo para la actualización del status de la notificación
                        // hacia el status "Attended", como la notificación ya fue procesada, no procesar
                        // nuevamente
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
    sap.ui.sync.CrossSellOffer.prototype.retryNotificationUpdate = function(oNotification, oResult) {
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
    sap.ui.sync.CrossSellOffer.prototype.confirmNotification = function(oNotification) {
        this.handleTrace("CCSO06", "Revisa si existe registros de tipo Oferta de Crédito en DataDB para Notificacion : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        return new Promise(function(confirmNotificationResolve, confirmNotificationReject) {
            this.dataDB.getById(this.oDictionary.oTypes.CrossSellOffer, oNotification.objectDMID)
                .then(this.verifyNotificationContent.bind(this, oNotification, confirmNotificationResolve))
                .catch(function(error) {
                    this.handleError.bind(this, "CCSO06", "Error al verificar el contenido de la notificación  " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
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
    sap.ui.sync.CrossSellOffer.prototype.verifyNotificationContent = function(oNotification, resolve, oResult) {
        this.handleTrace("CCSO07", "Verificar información contenida en la notificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        if (oResult.CrossSellOfferSet.length > 0) {
            //Verificar como se procesara la notificación
            if (oNotification.message.toUpperCase() == "LA OFERTA DE CREDITO HIJO FUE ACEPTADA" || oNotification.message.toUpperCase() == "LA OFERTA DE CREDITO HIJO FUE RECHAZADA") {
                //Camino normal
                this.handleTrace("CCSO07", "La notificación reporta exito en la Creación/Modificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
                this.deleteCrossSellOfferFromDataDB(oNotification, oResult)
                    .then(function(result) {
                        //resolve(this.OK);
                        this.deleteCrossSellOfferFromSyncDB(oNotification)
                            .then(function(result) {
                                resolve(this.OK)
                                this.updateAttended(oNotification)
                                    .then(this.handleTrace("CCSO07", "COMPLETED: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                                    .then(resolve(this.OK));
                            }.bind(this));
                    }.bind(this))
                    .catch(function(error) {
                        this.handleError("CCSO07", "Error al eliminar la Oferta de Crédito de DataDB/SyncDB " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
                            .then(resolve(this.ERROR));
                    }.bind(this, oNotification));
            } else {
                this.handleTrace("CCSO07", "La notificación reporta un error: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
                sap.ui.getCore().AppContext.myRest.read("/CrossSellingCandidateSet", "$filter=CandidateIdCRM eq '" + oResult.CrossSellOfferSet[0].CandidateIdCRM + "'", true)
                    .then(function(oCandidate) {
                        this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.BUSINESSERROR, oNotification.objectDMID, this.getCrossSellOfferDescriptionError(oCandidate), oNotification.message.toUpperCase(), oResult.CrossSellOfferSet[0].CrossSellProductId))
                            .then(resolve(this.BUSINESSERROR))
                    }.bind(this));
            }
        } else {
            this.handleTrace("CCSO07", "No existe registro de Oferta de Crédito en DataDB para notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
            resolve(this.OK);
        }
    };
    /**
     * [getCrossSellOfferDescriptionError Get description for the current CrossSellOffer]
     * @param  {[Object]} oResult [Result from Pouch where LoanRequestSet is content]
     * @return {[String]}         [Loan Request description]
     */
    sap.ui.sync.CrossSellOffer.prototype.getCrossSellOfferDescriptionError = function(oCandidate) {
        try {
            return oCandidate.results[0].CandidateName.FirstName + " " + oCandidate.results[0].CandidateName.MiddleName + " " + oCandidate.results[0].CandidateName.LastName + " " + oCandidate.results[0].CandidateName.SecondName;
        } catch (error) {
            return "";
        }
    };
    sap.ui.sync.CrossSellOffer.prototype.getCrossSellOfferDescriptionOK = function(oResult) {
        try {
            if (oResult.hasOwnProperty("CrossSellOfferSet")) {

                switch (oResult.CrossSellOfferSet[0].CrossSellProductId) {
                    case "C_IND_CCM_CCR":
                    case "C_IND_CA_CCR":
                        return oResult.CrossSellOfferSet[0].CrossSellProductId;
                        break;
                    default:
                        return "";
                }
            }
            return oCandidate.results[0].CandidateName.FirstName + " " + oCandidate.results[0].CandidateName.MiddleName + " " + oCandidate.results[0].CandidateName.LastName + " " + oCandidate.results[0].CandidateName.SecondName;
        } catch (error) {
            return "";
        }
    };
    /**
     * [deleteCrossSellOfferFromDataDB Delete CrossSellOffer when the process has gone correctly]
     * @param  {[type]} oNotification [description]
     * @param  {[type]} oResult       [description]
     * @return {[type]}               [description]
     */

    sap.ui.sync.CrossSellOffer.prototype.deleteCrossSellOfferFromDataDB = function(oNotification, oResult) {
        this.handleTrace("CCSO08", "Eliminar Oferta de Crédito de DataDB : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        return new Promise(function(resolve, reject) {
            this.dataDB.delete(this.oDictionary.oTypes.CrossSellOffer, oResult.CrossSellOfferSet[0].id, oResult.CrossSellOfferSet[0].rev)
                .then(this.handleTrace("CCSO08", "Registro de Oferta de Crédito eliminado en DataDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                .then(this.oSyncResultHelper.reportResult(this.oSyncResultHelper.getResultObject("NOTIFICATION", this.OK, oNotification.objectDMID, oNotification.message.toUpperCase(), "OK", this.getCrossSellOfferDescriptionOK(oResult)))) //Se reporta estatus OK en la pantalla de sincronización
                .then(resolve(this.OK))
                .catch(this.handleError.bind(this, "CCSO08", "Error al eliminar registro de Oferta de Crédito en DataDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                .then(resolve(this.ERROR))
        }.bind(this));
    };
    sap.ui.sync.CrossSellOffer.prototype.deleteCrossSellOfferFromSyncDB = function(oNotification) {
        this.handleTrace("CCSO8", "Eliminar Oferta de Crédito de SyncDB : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        return new Promise(function(resolve, reject) {
            this.syncDB.getById(this.oDictionary.oQueues.CrossSellOffer, oNotification.objectDMID)
                .then(function(oResult) {
                    if (oResult.RequestQueueCrossSellOfferSet.length > 0) {
                        this.handleTrace("CCSO8", "Existe en SyncDB, borrando : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
                        this.syncDB.delete(this.oDictionary.oQueues.CrossSellOffer, oResult.RequestQueueCrossSellOfferSet[0].id, oResult.RequestQueueCrossSellOfferSet[0].rev)
                            .then(resolve(oNotification))
                            .catch(function() {
                                this.handleError.bind(this, "CCSO13", "Error al eliminar registro de Oferta de Crédito en SyncDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                            }.bind(this)).then(resolve(oNotification));
                    } else {
                        this.handleTrace("CCSO8", "No existe en SyncDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
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
    /*sap.ui.sync.CrossSellOffer.prototype.updateAttended = function(oNotification) {
        this.handleTrace("CCSO09", "Actualizar status de attended para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        return new Promise(function(resolve, reject) {
            var oBody;
            oBody = { attended: "1" };
            sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
                .then(
                    this.handleTrace("CCSO09", "Actualización de status OK: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                    .then(resolve(this.OK))
                ).catch(function(error) {
                    this.handleError("CCSO09", "Error Actualizar status de attended para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
                        .then(this.saveUpdateError(oNotification))
                        .then(resolve(this.OK))
                }.bind(this));
        }.bind(this));
    };*/

    /** 
     * TRAINING - [updateAttended Delete de system notification from PouchDB]
     * @param  {[Object]} oNotification [Notification to process]
     * @return {[Promise]}               [Promise]
     */
    sap.ui.sync.CrossSellOffer.prototype.updateAttended = function(oNotification) {
        this.handleTrace("CCSO09", "TRAINING - Elimina notifcación de sistema de PouchDB para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        return new Promise(function(resolve, reject) {
            this.notiDB.delete(this.oDictionary.oQueues.CrossSellSystemNotification, oNotification.id, oNotification.rev)
                .then(
                    this.handleTrace("CCSO09", "TRAINING - Notificacion de Sistema elimnada de PouchDB: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID)
                    .then(resolve(this.OK))
                ).catch(function(error) {
                    this.handleError("CCSO09", "TRAINING - Error eliminar notificacion de sistema (PouchDB) para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID, error)
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
    sap.ui.sync.CrossSellOffer.prototype.saveUpdateError = function(oNotification) {
        this.handleTrace("CCSO10", "Se requerira reintento de actualización de status (a Attended) de la notificación : " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
        var ErrorUpdate = {
            id: oNotification.notificationID
        };
        return new Promise(function(resolve, reject) {
            this.syncDB.post(this.oDictionary.oErrors.Notification, ErrorUpdate)
                .then(this.handleTrace("CCSO10", "Reintento de actualización de status (a Attended) *Registrado* para la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID + " guardado OK").then(resolve(this.ERROR)))
                .catch(this.handleError.bind(this, "CCSO10", "##Error en el reintento de actualización de status (a Attended) para la notificación " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID).then(resolve(this.ERROR)));
        }.bind(this));
    };
    /**
     * [processErrorNotification Process the error message inside a notification]
     * @param  {[Object]} oNotification   [Notification to process]
     * @param  {[Object]} oLoanRequestSet [Object from DataDB]
     * @return {[Promise]}                 [Promise]
     */
    sap.ui.sync.CrossSellOffer.prototype.processErrorNotification = function(oNotification, oLoanRequestSet) {
        return new Promise(function(resolve, reject) {
            this.handleTrace("CCSO11", "Procesar error contenido en la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
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
                    this.handleError.bind(this, "CCSO11", "Error al actualizar error contenido en la notificación:  " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID))
                .then(resolve(this.ERROR));
        }.bind(this));
    };
    /**
     * [upsertErrorNotificationData Update error content inside the notification]
     * @param  {[Object]} oErrorDataSync [Error to process]
     * @return {[Promise]}                [Promise]
     */
    sap.ui.sync.CrossSellOffer.prototype.upsertErrorNotificationData = function(oErrorDataSync) {
        return new Promise(function(resolve, reject) {
            this.handleTrace("CCSO12", "Upsert información de error de la notificación: " + oNotification.notificationID + " ObjectIDDM: " + oNotification.objectDMID);
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
    sap.ui.sync.CrossSellOffer.prototype.deleteFromQueue = function(_sLoanRequestId, _oDictionary) {
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
    sap.ui.sync.CrossSellOffer.prototype.handleTrace = function(_sSyncStep, _oTraceData, _bIsError, sError) {
        return this.oSyncResultHelper.handleTrace(_sSyncStep, _oTraceData, sError);
    };
})();