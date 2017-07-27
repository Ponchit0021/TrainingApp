(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.sync.Customer");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");

    sap.ui.base.Object.extend('sap.ui.sync.Customer', {
        constructor: function(_dataDB, _syncDB) {
            var oSchemaDB;

            jQuery.sap.require("js.helper.Dictionary");
            jQuery.sap.require("js.helper.Schema");
            jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
            jQuery.sap.require("js.serialize.customer.CustomerSerialize");

            oSchemaDB = new sap.ui.helper.Schema();

            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
            this.syncDB = new sap.ui.db.Pouch(_syncDB);
            this.syncDB.setSchema(oSchemaDB.getSyncDBSchema());



        },
    });

    sap.ui.sync.Customer.prototype.deleteBusinessError = function(sDeleteBusinessErrorID) {

        var self = this;
        var oDictionary = new sap.ui.helper.Dictionary();

        return new Promise(function(resolve) {
            self.syncDB.getById(oDictionary.oErrors.Customer, sDeleteBusinessErrorID)
                .then(function(sDeleteBusinessErrorID, oDictionary, result) { /// Confirmar si ya existe el registro del error, hacer upsert

                    if (result.BusinessErrorCustomerSet) {
                        if (result.BusinessErrorCustomerSet.length > 0) { // Ya existia previamente
                            this.syncDB.delete(oDictionary.oErrors.Customer, result.BusinessErrorCustomerSet[0].id, result.BusinessErrorCustomerSet[0].rev)
                                .then(function(success) {
                                    resolve("OK");
                                });
                        } else {
                            resolve("OK");
                        }
                    } else {
                        resolve("OK");
                    }
                }.bind(self, sDeleteBusinessErrorID, oDictionary))
                .catch(function(error) {
                    console.log("Error al eliminar BusinessError " + error)
                    resolve("Error al eliminar BusinessError " + error);
                });
        });
    };


    sap.ui.sync.Customer.prototype.deleteBusinessErrorOnOK = function(_oDictionary, _oCustomerQueueItem, _resolveSendPromise) {

        return function(_oDictionary, _oCustomerQueueItem, result) {

            this.syncDB.getById(_oDictionary.oErrors.Customer, _oCustomerQueueItem.id)
                .then(function(_oCustomerQueueItem, _oDictionary, result) { /// Confirmar si ya existe el registro del error, hacer upsert
                    if (result.BusinessErrorCustomerSet) {
                        if (result.BusinessErrorCustomerSet.length > 0) { // Ya existia previamente

                            this.syncDB.delete(_oDictionary.oErrors.Customer, result.BusinessErrorCustomerSet[0].id, result.BusinessErrorCustomerSet[0].rev)
                                .then(function(success) {
                                    _resolveSendPromise("COMPLETED");
                                });
                        } else {
                            _resolveSendPromise("COMPLETED");
                        }
                    } else {
                        _resolveSendPromise("COMPLETED");
                    }



                }.bind(this, _oCustomerQueueItem, _oDictionary))
                .catch(function(error){
                console.log("Error al actualizar business error del customer " + error);
                    _resolveSendPromise("Error updating Business Error");
                });

            /////////// Eliminar BusinessError

            

       }.bind(this, _oDictionary, _oCustomerQueueItem)

    };

    sap.ui.sync.Customer.prototype.sendQueue = function() {

        var a;

        return new Promise(function(resolveMasterPromise) {

            var oDictionary;
            oDictionary = new sap.ui.helper.Dictionary();

            ///////// Retrieve all loan requests
            this.syncDB.get(oDictionary.oQueues.Customer).then(function(_oDictionary, result) {

                    var i;
                    var aPromises, oPromise;
                    aPromises = new Array();
                        

                    if (result.RequestQueueCustomerSet.length > 0) {
                        for (i = 0; i < result.RequestQueueCustomerSet.length; i++) {
                            //////// For each Customer, retrieve details and send

                            ///:::: "Sent" deberia venir del diccionario
                            if (result.RequestQueueCustomerSet[i].requestStatus !== _oDictionary.oRequestStatus.Sent) {



                                //////// Generar promesas individuales


                                ///::: Aqui comienza promesa individual
                                oPromise = new Promise(function(_oCustomerQueueItem, resolveSendPromise, rejectDeletePromise) {

                                    ///// Deserialize
                                    var oCustomerSerializer;
                                    oCustomerSerializer = new sap.ui.serialize.Customer("dataDB");
                                    ///:::: "Customer" deberia venir del diccionario
                                    oCustomerSerializer.deSerialize(_oCustomerQueueItem.id)
                                        .then(
                                            function(_oCustomerQueueItem, _oDictionary, result) {

                                               

                                                delete result["IsEntityInQueue"];
                                                delete result["bRegisterComesFromLoanRequest"];

                                                //// Send
                                                sap.ui.getCore().AppContext.myRest.create(_oCustomerQueueItem.requestUrl, result, true).then(
                                                    function(_oDictionary, _oCustomerQueueItem, result) {
                                                        
                                                        _oCustomerQueueItem.requestStatus = _oDictionary.oRequestStatus.Sent;

                                                        this.syncDB.post(_oDictionary.oQueues.Customer, _oCustomerQueueItem).then(

                                                            this.deleteBusinessErrorOnOK(_oDictionary, _oCustomerQueueItem, resolveSendPromise)

                                                        ).catch(function(error) {

                                                           
                                                            resolveSendPromise("Error");



                                                        });

                                                    }.bind(this, _oDictionary, _oCustomerQueueItem)
                                                ).catch(
                                                    function(_oDictionary, _oCustomerQueueItem, error) {
                                                       

                                                        /////// Verificar si se trata de un business error

                                                        var sErrorMessage, oErrorService;
                                                        var oErrorData;
                                                        var sMessage;



                                                        sErrorMessage = "";

                                                        try {

                                                            oErrorService = JSON.parse(error);

                                                            if (oErrorService.error.innererror.errordetails !== "undefined") {
                                                                sErrorMessage = oErrorService.error.innererror.errordetails[0].message;
                                                                if (sErrorMessage) {
                                                                    if (sErrorMessage !== "") {
                                                                        sap.m.MessageToast.show("Se ha producido un error: " + sErrorMessage);
                                                                    }
                                                                }

                                                            }

                                                        } catch (catchError) {

                                                            //// Nada debe pasar aqui, este error es solo si el mensaje de error que viene del servicio
                                                            /// es de negocio

                                                        }


                                                        //sErrorMessage = "Woops, a business error occured";

                                                        if (sErrorMessage !== "") {
                                                            /////// Business Error || Log
                                                            ///


                                                            sMessage = "Error al enviar la solicitud '" + _oCustomerQueueItem.requestDescription + "' : " + sErrorMessage;

                                                            oErrorData = {

                                                                id: _oCustomerQueueItem.id,
                                                                errorDetail: sMessage,
                                                                type: "APPLICANT"

                                                            };




                                                            this.syncDB.getById(_oDictionary.oErrors.Customer, _oCustomerQueueItem.id)
                                                                .then(function(_oCustomerQueueItem, _oDictionary, oErrorData, result) { /// Confirmar si ya existe el registro del error, hacer upsert


                                                                    if (result.BusinessErrorCustomerSet) {

                                                                        if (result.BusinessErrorCustomerSet.length > 0) { // Ya existia previamente
                                                                            oErrorData.rev = result.BusinessErrorCustomerSet[0].rev;
                                                                        }

                                                                    }



                                                                    this.syncDB.post(_oDictionary.oErrors.Customer, oErrorData).then(
                                                                        function(_oCustomerQueueItem, _oDictionary, success) {

                                                                            _oCustomerQueueItem.requestStatus = _oDictionary.oRequestStatus.BusinessError;
                                                                            ///:::: "RequestQueueCustomer" deberia venir del diccionario
                                                                            this.syncDB.post(_oDictionary.oQueues.Customer, _oCustomerQueueItem).then(
                                                                                function(result) {

                                                                                    resolveSendPromise("BUSINESSERROR");

                                                                                });


                                                                        }.bind(this, _oCustomerQueueItem, _oDictionary)
                                                                    );

                                                                }.bind(this, _oCustomerQueueItem, _oDictionary, oErrorData));

                                                        } else {
                                                            //// Normal processing
                                                            ///:::: "Error" deberia venir del diccionario
                                                            _oCustomerQueueItem.requestStatus = _oDictionary.oRequestStatus.Error;
                                                            ///:::: "RequestQueueCustomer" deberia venir del diccionario
                                                            this.syncDB.post(_oDictionary.oQueues.Customer, _oCustomerQueueItem).then(
                                                                /////////// Eliminar BusinessError
                                                                function(_oDictionary, _oCustomerQueueItem) {
                                                                    this.syncDB.getById(_oDictionary.oErrors.Customer, _oCustomerQueueItem.id)
                                                                        .then(function(_oCustomerQueueItem, _oDictionary, oErrorData, result) { /// Confirmar si ya existe el registro del error, hacer upsert
                                                                            if (result.BusinessErrorCustomerSet) {
                                                                                if (result.BusinessErrorCustomerSet.length > 0) { // Ya existia previamente
                                                                                    oErrorData.rev = result.BusinessErrorCustomerSet[0].rev;
                                                                                }
                                                                            }

                                                                            if (oErrorData) {

                                                                                this.syncDB.delete(_oDictionary.oErrors.Customer, oErrorData.id, oErrorData.rev)
                                                                                    .then(function(success) {
                                                                                        resolveSendPromise(error);
                                                                                    });

                                                                            } else {

                                                                                resolveSendPromise(error);

                                                                            }

                                                                        }.bind(this, _oCustomerQueueItem, _oDictionary, oErrorData));
                                                                }.bind(this, _oDictionary, _oCustomerQueueItem)
                                                                /////////// Eliminar BusinessError

                                                            ).
                                                            catch(function(error) {

                                                                resolveSendPromise(error);

                                                            });
                                                        }



                                                    }.bind(this, _oDictionary, _oCustomerQueueItem));

                                            }.bind(this, _oCustomerQueueItem, _oDictionary)) /// Bind para Pouch de datos
                                        .catch(function(error) {

                                           
                                            resolveSendPromise(error);


                                        });

                                    ///::: Aqui termina promesa individual
                                }.bind(this, result.RequestQueueCustomerSet[i]));


                                aPromises.push(oPromise);


                            }


                        };

                        /// Fuera del For, resolver promesas

                        Promise.all(aPromises).then(
                            function(results) {

                                var oResults = {};
                                var i;
                                oResults.resultsOK = 0;
                                oResults.resultsError = 0;
                                oResults.businessError = 0;
                                oResults.resultsTotal = results.length;

                                for (i = 0; i < results.length; i++) {
                                    if (results[i] === "COMPLETED") {
                                        oResults.resultsOK = oResults.resultsOK + 1;
                                    } else {
                                       if (results[i] === "BUSINESSERROR") {
                                            oResults.businessError = oResults.businessError + 1;
                                        } else {
                                            oResults.resultsError = oResults.resultsError + 1;
                                        }
                                    }

                                }

                                resolveMasterPromise(oResults);

                            }
                        ).catch(
                            function(error) {


                            }
                        );



                    } else { /// No se obtuvieron resultados

                        var oResults = {};
                        oResults.resultsOK = 0;
                        oResults.resultsError = 0;
                        oResults.resultsTotal = 0;
                        oResults.businessError = 0;
                        resolveMasterPromise(oResults);
                       

                    }


                }.bind(this, oDictionary))
                .catch(function(error) {

                    var oResults = {};
                    oResults.resultsOK = 0;
                    oResults.resultsError = 0;
                    oResults.resultsTotal = 0;
                    oResults.businessError = 0;
                    
                    resolveMasterPromise(oResults);
                  

                });

            ////////////// Aqui termina promesa maestra
        }.bind(this));

    };

    //******************************** INICIO - PROCESO SINCRONIZACIÓN ********************************
    sap.ui.sync.Customer.prototype.confirmQueue = function() {
       
        var self = this;
        return new Promise(function(resolve, reject) {
           
            //sap.ui.getCore().AppContext.oRest.read("/SystemNotifications", "", true) //se usa sin filtro para traer las notificaciones de mockserver
                sap.ui.getCore().AppContext.oRest.read("/SystemNotifications", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "' and attended eq '0' and objectTypeID eq '1'", true)
                .then(function(oResult) {
                    self.checkNotifications(oResult).then(function(array) {
                        //promise all
                        Promise.all(array).then(function(results) {
                            var oRRay = results;
                            var i;
                            var bBUSINESSERROR = false;

                            for (i = 0; i < results.length; i++) {
                                if (results[i] === "BUSINESSERROR") {
                                    bBUSINESSERROR = true;
                                }
                            }

                            /// BUSINESSERROR <<<< Continuar aqui
                            if (bBUSINESSERROR) {
                                
                                resolve("BUSINESSERROR");
                            }else{
                                resolve("OK");
                            }
                        });
                    });
                }.bind(this))
                .catch(function(oErrorStatusCode) {
                    console.log("Error - Master Promise: " + oErrorStatusCode);
                    resolve(oErrorStatusCode);
                });
        }.bind(this));
    };

    //(1) obtener notificaciones de tipo customer
    sap.ui.sync.Customer.prototype.checkNotifications = function(oResult) {
        var self = this;
        var oPromises = new Array(); //promesas individuales
        var counter = 0;
        return new Promise(function(resolve, reject) {
            if (oResult.results.length > 0) {
                oResult.results.forEach(function(entry) {
                    console.log("(2) verifica si existe id en tabla de UPDATE ERROR");
                    oPromises.push(self.checkUpdateError(oResult.results[counter]));
                    counter++;
                    if (oResult.results.length === counter) {
                        resolve(oPromises);
                    }
                }); //for 
            } else {
                console.log("(1)la lista de notificaciones viene vacia");
                resolve("Null"); //resuelve promesa master
            }
        });
    };

    //(2) verifica si existe id en tabla de update error
    sap.ui.sync.Customer.prototype.checkUpdateError = function(oNotification) {
        var oDictionary = new sap.ui.helper.Dictionary();
        var self = this;
        return new Promise(function(resolve, reject) {
            try {
                self.syncDB.getById(oDictionary.oErrors.Notification, oNotification.notificationID)
                    .then(function(oResult) {
                        if (oResult.SystemErrorNotificationSet.length === 0) {
                            console.log("NO Existe - Inicia SINCRONIZACION:");
                            self.searchInDataDB(oNotification).then(function(msg) {
                               
                                resolve(msg);
                            })

                        } else {
                            console.log("SI Existe - Inicia REINTENTO de UPDATE:");
                            self.retrySync(oNotification).then(function(msg) {
                                
                                resolve("2.2");
                            })
                        }

                    }).catch(function(e) {
                        console.log("Error (checkUpdateError): " + e);
                        resolve("2.2");
                    })
            } catch (e) {
                reject(e);
            }
        });
    };

    //(3) verifica si existe en dataDB 
    sap.ui.sync.Customer.prototype.searchInDataDB = function(oNotification) {
        console.log("(3) verifica si existe en dataDB: " + oNotification.notificationID + " - " + oNotification.objectDMID);
        var oDictionary = new sap.ui.helper.Dictionary();
        var self = this;
        return new Promise(function(resolve, reject) {
            try {
                self.dataDB.getById(oDictionary.oTypes.Customer, oNotification.objectDMID)
                    .then(function(oResult) {
                        if (oResult.CustomerSet.length > 0) {
                            console.log("SI Existe en dataDB");

                            //verifica el mensaje de la notificacion para determinar su procesamiento
                            if (oNotification.message.toUpperCase() === "BP CREADO EXITOSAMENTE" || oNotification.message.toUpperCase() === "BP MODIFICADO EXITOSAMENTE") {
                                self.deleteDataDB(oResult, oNotification).then(function(msg) {
                                    
                                    resolve("3.1");
                                });
                            } else {
                                //la notificacion idica que el solicitante no fue creado o actualizado - existe error en el workflow
                                var oErrorData = {
                                    id: oNotification.objectDMID,
                                    errorDetail: oNotification.message,
                                    type: "APPLICANT",
                                    NotificationID: oNotification.notificationID
                                };
                                //se almacena en BusinessError para visualizar posteriormente 
                                self.insertErrorData(oErrorData).then(function(msg) {
                                   
                                    resolve("BUSINESSERROR");
                                });
                            }
                        } else {
                            
                            resolve("3.2");
                        }
                    }).catch(function(e) {
                       
                        resolve("3.2");
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    //(4) elimina si existe en dataDB 
    sap.ui.sync.Customer.prototype.deleteDataDB = function(oResult, oNotification) {
        var oDictionary = new sap.ui.helper.Dictionary();
        var self = this;
        return new Promise(function(resolve, reject) {
            try {
                self.dataDB.delete(oDictionary.oTypes.Customer, oResult.CustomerSet[0].id, oResult.CustomerSet[0].rev)
                    .then(function(oResult) {
                        
                        self.searchInSyncDB(oNotification).then(function(msg) {
                          
                            resolve("4.1")
                        });
                    }).catch(function(e) {
                       
                        resolve("4.2");
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    //(5) verifica si existe en syncDB
    sap.ui.sync.Customer.prototype.searchInSyncDB = function(oNotification) {
        
        var oDictionary = new sap.ui.helper.Dictionary();
        var self = this;
        return new Promise(function(resolve, reject) {
            try {
                self.syncDB.getById(oDictionary.oQueues.Customer, oNotification.objectDMID)
                    .then(function(oResult) {
                        if (oResult.RequestQueueCustomerSet.length > 0) {
                           
                            self.deleteSyncDB(oResult, oNotification).then(function(msg) {
                              
                                resolve("5.1");
                            });
                        } else {
                           
                            resolve("5.2");
                        }
                    }).catch(function(e) {
                       
                        resolve("5.2");
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    //(6) elimina si existe en syncDB
    sap.ui.sync.Customer.prototype.deleteSyncDB = function(oResult, oNotification) {
        var oDictionary = new sap.ui.helper.Dictionary();
        var self = this;
        return new Promise(function(resolve, reject) {
            try {
                self.syncDB.delete(oDictionary.oQueues.Customer, oResult.RequestQueueCustomerSet[0].id, oResult.RequestQueueCustomerSet[0].rev)
                    .then(function(oResult) {
                       
                        self.updateAttended(oNotification).then(function(msg) {
                           
                            resolve("6.1")
                        });
                    }).catch(function(e) {
                       
                        resolve("6.2");
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    //(7) actualiza estatus notificación - attended = true 
    sap.ui.sync.Customer.prototype.updateAttended = function(oNotification) {
        var oBody = {};
        oBody.attended = "1"; //estatus
        var self = this;
        return new Promise(function(resolve, reject) {
            try {
                sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
                    .then(function() {
                        
                        resolve("7.1");
                    }).catch(function(e) {
                       
                        self.saveUpdateError(oNotification).then(function(msg) {
                           
                            resolve("7.2");
                        });
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    //(8) guarda error de actualizar para después reintentar 
    sap.ui.sync.Customer.prototype.saveUpdateError = function(oNotification) {
        var oDictionary = new sap.ui.helper.Dictionary();
        var self = this;
        var ErrorUpdate = {
            id: oNotification.notificationID
        };
        return new Promise(function(resolve, reject) {
            try {
                self.syncDB.post(oDictionary.oErrors.Notification, ErrorUpdate)
                    .then(function(oResult) {
                       
                        resolve("8.1");
                    }).catch(function(e) {
                        
                        resolve("8.2");
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    //(3) renvio de peticiones de actualización de estatus attended ****
    sap.ui.sync.Customer.prototype.retrySync = function(oNotification) {
        return new Promise(function(resolve, reject) {
            try {
                var oBody = {};
                oBody.attended = "1"; //estatus
                sap.ui.getCore().AppContext.oRest.update("/SystemNotifications('" + oNotification.notificationID + "')", oBody, true)
                    .then(function(oResult) {
                       
                        resolve("3.1")
                    }).catch(function(e) {
                       
                        resolve("3.2")
                    })
            } catch (e) {
                reject(e);
            }
        });
    };

    // (3.2) se almacena el error para ser procesado posteriormente 
    sap.ui.sync.Customer.prototype.insertErrorData = function(oErrorData) {
        var oDictionary = new sap.ui.helper.Dictionary();
        var self = this;
        return new Promise(function(resolve, reject) {

            self.syncDB.getById(oDictionary.oErrors.Customer, oErrorData.id)
                .then(function(_oDictionary, _oErrorData, result) {
                    resolve("3.2 BusinessError - Guardado");
                    if (result.BusinessErrorCustomerSet) {
                        if (result.BusinessErrorCustomerSet.length > 0) { //ya existía previamente
                            oErrorData.rev = result.BusinessErrorCustomerSet[0].rev;
                        }
                    }
                    self.syncDB.post(_oDictionary.oErrors.Customer, _oErrorData).then(function() {
                        resolve("3.2 BusinessError - Guardado");
                    });
                }.bind(self, oDictionary, oErrorData)).catch(function(e) {
                    resolve("3.2 BusinessError - Error al recuperar: " + e);
                });
        });
    };


    //******************************** FIN - PROCESO SINCRONIZACIÓN ********************************

    sap.ui.sync.Customer.prototype.retrieveErrors = function(_oDictionary) {
        return this.syncDB.get(_oDictionary.oErrors.Customer);
    };


    sap.ui.sync.Customer.prototype.deleteFromQueue = function(_sCustomerId, _oDictionary) {

        return new Promise(function(resolveDeletePromise) {

            this.syncDB.getById(_oDictionary.oQueues.Customer, _sCustomerId)
                .then(function(_oDictionary, result) { /// Confirmar si ya existe el registro del error, hacer upsert

                    if (result.RequestQueueCustomerSet) {
                        if (result.RequestQueueCustomerSet.length > 0) { // Ya existia previamente

                            this.syncDB.delete(_oDictionary.oQueues.Customer, result.RequestQueueCustomerSet[0].id, result.RequestQueueCustomerSet[0].rev)
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

                resolveDeletePromise("Error al eliminar el solicitante del queue: " + error);

            });

        }.bind(this));

    };



})();
