(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.helper.SyncResults");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.helper.SyncResults', {});


    sap.ui.helper.SyncResults.prototype.getResultObject = function(_sSource, _sStatus, _sId, _sRequestDescription, _sStatusDescription, _sObjectType, _sNotificationID, _insuranceID) {
        return {

            source: _sSource, // Notification / Sync
            status: _sStatus, // Ok, Error, BusinessError
            id: _sId, // Id DM
            requestDescription: _sRequestDescription, // Nombre del cliente o del grupo
            statusDescription: _sStatusDescription, // Describir si existio error u OK
            objectType: _sObjectType, // Tipo de objeto: CUSTOMER, LOAN, INSURANCE
            NotificationID: _sNotificationID, ///Notificacion correspondiente para su posterior procesamiento
            insuranceObjectIdDM: _insuranceID//Identificador del seguro
        };
    };


    sap.ui.helper.SyncResults.prototype.reportResult = function(oResult) {

        return new Promise(function(resolve) {

            sap.ui.getCore().AppContext.SyncError = 0;
            sap.ui.getCore().AppContext.SyncOK = 0;

            sap.ui.getCore().getModel("ModelResult").getProperty("/").push(oResult);
            sap.ui.getCore().getModel("ModelResult").refresh(true);

            resolve("OK");

        }.bind(this));



    };


    sap.ui.helper.SyncResults.prototype.handleTrace = function(_sSyncStep, _oTraceData, _bIsError, sError) {

        return new Promise(function(resolve) {
            var bIsTraceEnabled = false;
            var bIsConsoleEnabled = true;
            var sMessage;

            if (!_bIsError) {

                sMessage = Math.floor(Date.now() / 1000).toString() + " Step: " + _sSyncStep + " Data: " + _oTraceData;

            } else {
                sMessage = Math.floor(Date.now() / 1000).toString() + " Step: " + _sSyncStep + " -AppError: " + sError + " || Data: " + _oTraceData;
            }

            if (bIsTraceEnabled) {
                if (sap.ui.getCore().AppContext.hasOwnProperty("LoggerSMP")) {
                    if (sap.ui.getCore().AppContext.hasOwnProperty("errorTrace")) {
                        sap.ui.getCore().AppContext.LoggerSMP.errorTrace(sMessage, this.loggerSMPComponent);
                    }
                }
            }

            if (bIsConsoleEnabled) {

                console.log(sMessage);
                jQuery.sap.log.trace(sMessage);

            }

            resolve("OK");

        }).catch(function(error) {

            console.log("Error al hacer manejo de trace: " + error);

        });


    };


    sap.ui.helper.SyncResults.prototype.handleError = function(_sSyncStep, _oTraceData, sError) {

        return new Promise(function(resolve) {
                this.handleTrace(_sSyncStep, _oTraceData, true, sError)
                resolve("OK");

            }.bind(this))
            .catch(function(error) {
                console.log("Error al hacer manejo del error: " + error);
            });

    };


    sap.ui.helper.SyncResults.prototype.initializeSynchronizingResults = function(_sSyncStep, _oTraceData, sError) {

        return {

            resultsOK: 0,
            resultsError: 0,
            businessError: 0,
            resultsTotal: 0
        }

    };




})();
