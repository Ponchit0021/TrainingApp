sap.ui.controller("originacion.MyPendings", {
    onInit: function() {
        jQuery.sap.require("js.base.NavigatorBase", "js.kapsel.Rest");
        oNavigatorBase = new sap.ui.mw.NavigatorBase();
        oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("pendingList").attachMatched(this._onRouteMatched, this);
    },
    _onRouteMatched: function(oEvent) {
        var notificationID = "",
            isRead;
        var msg = "";
        if (oEvent.getParameter("arguments")) {
            if (oEvent.getParameter("arguments")["?query"]) {
                notificationID = oEvent.getParameter("arguments")["?query"].notificationID ? oEvent.getParameter("arguments")["?query"].notificationID : "";
                isRead = oEvent.getParameter("arguments")["?query"].isRead;
                msg = oEvent.getParameter("arguments")["?query"] === undefined ? "" : oEvent.getParameter("arguments")["?query"].msg;
            }
        }
        sap.ui.getCore().AppContext.loader.show("Cargando Mis Pendientes");
        setTimeout(function() {
            this.updateStatus(notificationID, isRead)
                .then(this.getPendings.bind(this))
                .then(this.renderPendingstoTable.bind(this, msg))
                .catch(this.errorPendings.bind(this));
            console.log(this);

        }.bind(this), 100);
    },
    getPendings: function() {
        return new Promise(function(resolve) {
            var promiseReadPendings = sap.ui.getCore().AppContext.oRest.read("/PendingsPromoterSet", "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "' &$orderby=attended asc, dateTime desc", true);
            promiseReadPendings
                .then(function(oModel) {
                    resolve(oModel);
                })
                .catch(this.errorPendings.bind(this));
        }.bind(this));
    },
    errorPendings: function(error) {
        sap.ui.getCore().AppContext.loader.close();
        sap.m.MessageToast.show("Por favor intentelo de nuevo " + error);
    },
    renderPendingstoTable: function(_msg, _aDataPending) {
        var oTitle, oNum, oModelPendings;
        currentController = this;

        jQuery.sap.require("js.buffer.renovation.RenovationBuffer");
        var oRenovationBuffer = new sap.ui.buffer.Renovation("renoDB");

        return new Promise(function(resolve, reject) {

            oTitle = sap.ui.getCore().byId("oPagePendings");
            oNum = _aDataPending.results.length;
            oTitle.setTitle("Mis Pendientes (" + oNum + ")");
            //tabla mis pendietes
            oPendingsNotificationGroup = sap.ui.getCore().byId("ngPendings", "items");
            oModelPendings = new sap.ui.model.json.JSONModel();
            oModelPendings.setSizeLimit(oNum);
            /*oModelPendings.setData(_aDataPending);
            oPendingsNotificationGroup.setModel(oModelPendings);
            oModelPendings = null;*/

            oRenovationBuffer.searchAllInRenoDB()
            .then(function(oResult){
                _aDataPending.results.forEach(function(currMyPending, i) {
                    oResult.RenovationSet.forEach(function(currMyPendingDB,j) {
                        if(currMyPending.notificationID === currMyPendingDB.id)
                            _aDataPending.results[_.indexOf(_aDataPending.results, currMyPending)].attended = "1";
                    });
                });

                oModelPendings.setData(_aDataPending);
                oPendingsNotificationGroup.setModel(oModelPendings);
                oModelPendings = null;

                oPendingsNotificationGroup.bindAggregation("items", {
                    path: "/results",
                    factory: function(_id, _context) {
                        return currentController.onLoadTablePendings(_context);
                    }
                });
            });
            
            sap.ui.getCore().AppContext.loader.close();
            setTimeout(function() {
                if (_msg) {
                    sap.m.MessageToast.show(_msg, { duration: 4000 });
                }
            }, 0)

            resolve(true);
        })
    },

    onLoadTablePendings: function(_context) {
        var oRes, oDocument, oMessage, oResObs, currentController;
        jQuery.sap.require("js.base.NotificationBase");
        /*
        oRes = _context.getProperty("message").split(":");
        oDocument = oRes[0];
        oResObs = oRes[1].split("|");
        oMessage = oResObs[0];
        */
        oDocument = _context.getProperty("documentType");
        oMessage = _context.getProperty("reason");
        currentController = this;
        var pendingNotification = new sap.ui.mw.NotificationListItem();
        return pendingNotification.createNotificationAO(
            _context.getProperty("objectName"),
            _context.getProperty("comment"),
            _context.getProperty("objectCRMID"),
            oMessage, oDocument,_context.getProperty("documentID"),
            _context.getProperty("attended"),
            currentController.navToModules.bind(
                this,
                _context.getObject()
            ),
            _context.getProperty("objectTypeID")
        );

        /*var pendingNotification = new sap.m.NotificationListItem({
            title: _context.getProperty("objectName"),
            description: _context.getProperty("comment"),
            showCloseButton: false,
            authorName: _context.getProperty("objectCRMID"),
            datetime: oMessage,
            priority: sap.ui.core.Priority.None,
            buttons: [
                new sap.m.Button({
                    text: oDocument,
                    type: sap.m.ButtonType.Transparent,
                }),
                new sap.m.Button({
                    icon: "sap-icon://add-photo",
                    type: sap.m.ButtonType.Accept,
                    press: function() {
                        //sap.m.MessageToast.show('Accept button pressed');
                        currentController.navToModules(_context.getObject())
                    }
                })
            ]
        });

        if (_context.getProperty("attended") !== "true") {
            pendingNotification.setUnread(true);
            pendingNotification.setPriority(sap.ui.core.Priority.High)

        }
*/
        //return pendingNotification;

    },
    navToModules: function(_context) {
        /*oRes = _context.message.split("|");
        oText = oRes[0];
        oImageID = oRes[1];
        */
        oText = _context.documentType + ": " + _context.reason;
        oImageID = _context.documentID;
        console.log(arguments);

        switch (_context.objectTypeID) {
            // case "99": //Impresión de kit
            //     sap.m.MessageToast.show("Acude a la OS a imprimir tu kit de crédito.", { duration: 4000 });
            //     break;
            case "1": //Solicitante
                sap.ui.getCore().AppContext.flagPending = true;
                sap.ui.core.UIComponent.getRouterFor(this).navTo("applicantsDetail", {
                    applicantId: _context.objectDMID,
                    query: {
                        tab: "Name",
                        imageID: oImageID,// Para actualización de datos en este objeto lleva el dato '85'
                        notificationID: _context.notificationID,
                        pending: 1
                    }
                }, false);
                if (_context.attended === "0") {
                    this.updateStatus(_context.notificationID, "true")
                        .then(function(res) {
                            console.log(res);
                        });
                }
                break;
            case "2":
                switch (_context.productID) {
                    case 'C_GRUPAL_CCR':
                    case 'C_GRUPAL_CM':
                        sap.ui.core.UIComponent.getRouterFor(this).navTo("groupalApplication", {
                            grupalTypeID: _context.productID,
                            loanRequestId: _context.objectDMID,
                            query: {
                                tab: "Main",
                                announcement: 1
                            }
                        }, false);
                        break;
                    case 'C_IND_CI':
                        sap.ui.getCore().AppContext.flagPending = true;
                        sap.ui.getCore().AppContext.bIsCreating = false;
                        sap.ui.core.UIComponent.getRouterFor(this).navTo("IndividualApplications", {
                            aplicationId: _context.objectDMID,
                            query: {
                                tab: "Main",
                                announcement: 1
                            }
                        }, false);
                        break;
                        //créditos hijo    
                    case 'C_IND_CA':
                    case 'C_IND_CA_CCR':
                    case 'C_IND_CCM':
                    case 'C_IND_CCM':
                    case 'C_IND_CCM_CCR':
                        sap.ui.core.UIComponent.getRouterFor(this).navTo("crossSellApplication", {
                        aplicationId: _context.objectDMID,
                            query: {
                                tab: "Main"
                            }
                        }, false); 
                        break;
                }
                if (_context.attended === "0") {
                    this.updateStatus(_context.notificationID, "true")
                        .then(function(res) {
                            console.log(res);
                        });
                }
                break;
            case "3": //Aval
                sap.ui.getCore().AppContext.flagPending = true;
                sap.ui.core.UIComponent.getRouterFor(this).navTo("guarantorsDetail", {
                    guarantorId: _context.objectDMID,
                    query: {
                        tab: "Name",
                        imageID: oImageID,
                        notificationID: _context.notificationID,
                        pending: 1
                    }
                }, false);
                if (_context.attended === "0") {
                    this.updateStatus(_context.notificationID, "true")
                        .then(function(res) {
                            console.log(res);
                        });
                }
                break;
            case "4": //Seguro
                sap.ui.getCore().AppContext.flagPending = true;
                sap.ui.core.UIComponent.getRouterFor(this).navTo("insuranceDetails", {
                    LoanRequestIdCRM: _context.objectCRMID,
                    CustomerIdCRM: _context.customerCRMID,
                    query: {
                        imageID: oImageID,
                        notificationID: _context.notificationID,
                        source: 2
                    }
                }, false);
                if (_context.attended === "0") {
                    this.updateStatus(_context.notificationID, "true")
                        .then(function(res) {
                            console.log(res);
                        });
                }
                break;
            case "6": //Digitalización
                sap.m.MessageToast.show("Acude a la OS para recuperar el documento.", { duration: 4000 });
                //update
                var notificationID = _context.notificationID;
                if (_context.attended === "0") {
                    this.updateStatus(notificationID, "true")
                        .then(function(res) {
                            console.log(res);
                        });
                }
                break;
        }

    },
    toBack: function() {
        var router;
        router = sap.ui.core.UIComponent.getRouterFor(this);
        router.navTo("DashBoard", false);
    },
    goBackApp: function() {
        var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
        oCurrentApp.back();
    },
    updateStatus: function(_notificationID, _isRead) {
        jQuery.sap.require("js.buffer.renovation.RenovationBuffer");
        jQuery.sap.require("js.helper.Dictionary");
        var oDictionary, oRequest, oRenovationBuffer;

        oDictionary = new sap.ui.helper.Dictionary();
        oRenovationBuffer = new sap.ui.buffer.Renovation("renoDB");
        oRequest = {
            id: _notificationID,
            requestMethod: oDictionary.oMethods.POST,
            //requestUrl: oDictionary.oDataTypes.Insurance,
            requestBodyId: _notificationID,
            requestStatus: oDictionary.oRequestStatus.Initial
        };

        return new Promise(function(resolve, reject) {

            if (_isRead === "true") {
                var oBody = {};
                oBody.notificationID = _notificationID;

                sap.ui.getCore().AppContext.oRest.update("/PendingsPromoterSet('" + _notificationID + "')", oBody, true)
                    .then(function(resp) {
                        oRenovationBuffer.postRequest(oRequest)
                        .then(function(oResult) {
                            console.log("Registro mi  pendiente guardado");
                            console.log(resp)
                        });
                        resolve(resp)
                    }).catch(reject);

            } else {
                resolve("No fue leída");
            }
        }.bind(this));
    },

    //busqueda
    searchPendingsTxt: function(evt) {
        var aFilters = [];
        var txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            // colocamos el path del odata
            var filter = new sap.ui.model.Filter("objectName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            aFilters.push(filter);
        }
        var table = sap.ui.getCore().byId("ngPendings");
        var binding = table.getBinding("items");
        binding.filter(aFilters, "Application");
    }
});
