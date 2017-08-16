sap.ui.controller("originacion.Announcements", {
    onInit: function() {
        jQuery.sap.require("js.kapsel.Rest");
        jQuery.sap.require("js.base.NavigatorBase");
        sap.ui.core.UIComponent.getRouterFor(this).getRoute("announcementList").attachMatched(this.onLoadTable, this);
    },
    onLoadTable: function(oEvent) {
        var currentController;
        var msg = oEvent.getParameter("arguments")["?query"] === undefined ? "" : oEvent.getParameter("arguments")["?query"].msg;
        currentController = this;
        sap.ui.getCore().AppContext.loader.show("Cargando Avisos");
        setTimeout(function() {
            currentController.getAnnouncementsList()
                .then(currentController.renderAnnouncements.bind(this, msg))
                .catch(currentController.errorAnnouncements.bind(this));
        }.bind(this), 1000);
    },
    renderAnnouncements: function(_msg, _aDataAnnouncement) {
        var oTitle, oNum, oModelAnnouncements, currentController, oAnnouncementsNotificationGroup;
        currentController = this;
        
        jQuery.sap.require("js.buffer.renovation.RenovationBuffer");
        var oRenovationBuffer = new sap.ui.buffer.Renovation("renoDB");

        return new Promise(function(resolve, reject) {
            //número de mis pendientes sin leer
            oTitle = sap.ui.getCore().byId("oPageMasterAnnouncements");
            oNum = _aDataAnnouncement.results.length;
            oTitle.setTitle("Avisos (" + oNum + ")");
            //tabla mis pendietes
            oAnnouncementsNotificationGroup = sap.ui.getCore().byId("ngAnnouncement", "items");
            oModelAnnouncements = new sap.ui.model.json.JSONModel();
            oModelAnnouncements.setSizeLimit(oNum);
            /*oModelAnnouncements.setData(_aDataAnnouncement);
            oAnnouncementsNotificationGroup.setModel(oModelAnnouncements);
            oModelAnnouncements = null;*/
            setTimeout(function() {
                if (_msg) {
                    sap.m.MessageToast.show(_msg, { duration: 4000 });
                }
            }, 0)

            oRenovationBuffer.searchAllInRenoDB()
            .then(function(oResult){
                _aDataAnnouncement.results.forEach(function(currAnnouncement, i) {
                    oResult.RenovationSet.forEach(function(currAnnouncementDB,j) {
                        if(currAnnouncement.notificationID === currAnnouncementDB.id)
                            _aDataAnnouncement.results[_.indexOf(_aDataAnnouncement.results, currAnnouncement)].attended = "1";
                    });
                });

                oModelAnnouncements.setData(_aDataAnnouncement);
                oAnnouncementsNotificationGroup.setModel(oModelAnnouncements);
                oModelAnnouncements = null;

                oAnnouncementsNotificationGroup.bindAggregation("items", {
                    path: "/results",
                    factory: function(_id, _context) {
                        return currentController.onLoadAnnouncements(_context);
                    }
                });
            });

            if (oNum === 0) {
                sap.ui.getCore().AppContext.loader.close();
            }
        })
    },
    errorAnnouncements: function(error) {
        this.getView().setBusy(false);
    },
    toBack: function() {
        var router;
        sap.ui.getCore().AppContext.flagAnnoucement = false;
        router = sap.ui.core.UIComponent.getRouterFor(this);
        router.navTo("DashBoard", false);
    },
    getAnnouncementsList: function() {
        return new Promise(function(resolve) {
            var promiseReadAnnouncements;
            var filter = "";
            var oNavigatorBase = new sap.ui.mw.NavigatorBase();
            if (!oNavigatorBase.testUserAgent()) {
                filter = "$filter=promoterID eq '" + sap.ui.getCore().AppContext.Config.getProperty("promoterId") + "'";
            }
            promiseReadAnnouncements = sap.ui.getCore().AppContext.oRest.read("/AnnouncementsPromoterSet?$orderby=dateTime desc", filter, true);
            promiseReadAnnouncements
                .then(function(oModel) {
                    resolve(oModel);
                }).catch(
                    function(error) {
                        sap.m.MessageToast.show("Hubo un problema, vuelva a intentarlo.", { duration: 5000 });
                    });
        }.bind(this));
    },
    onLoadAnnouncements: function(_context) {
        var currentController = this;
        var templateNotification = new sap.m.NotificationListItem({
            title: _context.getProperty("objectName"),
            description: _context.getProperty("message"),
            showCloseButton: false,
            authorName: _context.getProperty("objectCRMID"),
            priority: sap.ui.core.Priority.None,
        });
        var oIcon = 'sap-icon://detail-view';

        if (_context.getProperty("attended") !== "1") {
            templateNotification.setUnread(true);
            templateNotification.setPriority(sap.ui.core.Priority.High)

        }
        templateNotification.addButton(new sap.m.Button({
            text: '',
            icon: oIcon,
            type: sap.m.ButtonType.Emphasized,
            press: function() {
                currentController.updateStatus(_context.getObject().notificationID).then(currentController.navToModules.bind(currentController, _context.getObject()));
            }
        }))
        sap.ui.getCore().AppContext.loader.close();
        return templateNotification;
    },
    navToModules: function(_context) {

        jQuery.sap.require("js.base.FileBase");
        var oFileBase;
        oFileBase = new sap.ui.mw.FileBase();

        switch (_context.objectTypeID) {
            case "1": //BP
                sap.ui.getCore().AppContext.flagAnnoucement = true;
                sap.ui.core.UIComponent.getRouterFor(this).navTo("applicantsDetail", {
                    applicantId: _context.objectDMID,
                    query: {
                        tab: "Name",
                        announcement: 1
                    }
                }, false);
                break;
            case "2": //Oportunidad 
                switch (_context.productID) {
                    case 'C_GRUPAL_CCR':
                    case 'C_GRUPAL_CM':
                        oFileBase.loadFile("data-map/catalogos/messageRejected.json")
                            .then(this.validateGroupalNotification.bind(this, _context));
                        break; 
                    case 'C_IND_CI':
                        oFileBase.loadFile("data-map/catalogos/messageRejected.json")
                            .then(this.validateIndividualNotification.bind(this, _context));
                        break;
                        //créditos hijo    
                    case 'C_IND_CA':
                    case 'C_IND_CA_CCR':
                    case 'C_IND_CCM':
                    case 'C_IND_CCM':
                    case 'C_IND_CCM_CCR':
                        oFileBase.loadFile("data-map/catalogos/messageAnnouncements.json")
                            .then(this.validateTypeNotification.bind(this, _context));
                        break;
                }
                break;
            case "3": //Aval
                sap.ui.getCore().AppContext.flagAnnoucement = true;
                sap.ui.core.UIComponent.getRouterFor(this).navTo("guarantorsDetail", {
                    guarantorId: _context.objectDMID,
                    query: {
                        tab: "Name",
                        announcement: 1
                    }
                }, false);
                break;
        }
    },
    validateTypeNotification: function(_context, results) {
        _.mapObject(results.getProperty("/results"), function(val) {
            if (val.message === _context.message) {
                if (val.nav) {
                    sap.ui.core.UIComponent.getRouterFor(this).navTo("crossSellApplication", {
                        aplicationId: _context.objectDMID,
                        query: {
                            tab: val.tab
                        }
                    }, false);
                } else {
                    if (val.toast !== "") {
                        sap.m.MessageToast.show(val.toast, { duration: 4000 });
                    }
                }
            }
        }.bind(this));
    },
    validateIndividualNotification: function(_context, results) {
        _.mapObject(results.getProperty("/results"), function(val) {
            if (val.message === _context.message) {
                if (val.toast !== "") {
                    sap.m.MessageToast.show(val.toast, { duration: 4000 });
                }
            } else {
                sap.ui.getCore().AppContext.flagAnnoucement = true;
                sap.ui.getCore().AppContext.bIsCreating = false;
                sap.ui.core.UIComponent.getRouterFor(this).navTo("IndividualApplications", {
                            aplicationId: _context.objectDMID,
                            query: {
                                tab: "Main",
                                announcement: 1
                            }
                }, false);
            }
        }.bind(this));
    },
    validateGroupalNotification: function(_context, results) {
        _.mapObject(results.getProperty("/results"), function(val) {
            if (val.message === _context.message) { 
                if (val.toast !== "") {
                    sap.m.MessageToast.show(val.toast, { duration: 4000 });
                }
            } else {
                sap.ui.core.UIComponent.getRouterFor(this).navTo("groupalApplication", {
                            grupalTypeID: _context.productID,
                            loanRequestId: _context.objectDMID,
                            query: {
                                tab: "Main",
                                announcement: 1
                            }
                }, false);
            }
        }.bind(this));
    },
    onListItemPress: function(evt) {
        var context, path;
        path = evt.getSource().getSelectedItem().getBindingContext().getPath();
        context = evt.getSource().getSelectedItem().getBindingContext().getProperty(path);
        this.updateStatus(context.notificationID).then(this.navToModules.bind(this, context));
    },
    //actualización de estatus de notificación - avisos
    updateStatus: function(oNotification) {
        jQuery.sap.require("js.buffer.renovation.RenovationBuffer");
        jQuery.sap.require("js.helper.Dictionary");
        var oDictionary, oRequest, oRenovationBuffer;

        oDictionary = new sap.ui.helper.Dictionary();
        oRenovationBuffer = new sap.ui.buffer.Renovation("renoDB");
        oRequest = {
            id: oNotification,
            requestMethod: oDictionary.oMethods.POST,
            //requestUrl: oDictionary.oDataTypes.Insurance,
            requestBodyId: oNotification,
            requestStatus: oDictionary.oRequestStatus.Initial
        };

        var oBody = {};
        oBody.notificationID = oNotification;
        return new Promise(function(resolve, reject) {
            sap.ui.getCore().AppContext.oRest.update("/AnnouncementsPromoterSet('" + oNotification + "')", oBody, true)
                .then(function(resp) {
                    oRenovationBuffer.postRequest(oRequest)
                    .then(function(oResult) {
                        console.log("Registro aviso guardado");
                    });
                    resolve(resp)
                }).catch(reject);
        });
    },
    //Busqueda
    searchAnnouncementsTxt: function(evt) {
        var aFilters = [];
        var txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            // colocamos el path del odata
            var filter = new sap.ui.model.Filter("objectName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            aFilters.push(filter);
        }
        var table = sap.ui.getCore().byId("ngAnnouncement");
        var binding = table.getBinding("items");
        binding.filter(aFilters, "Application");
    }
});
