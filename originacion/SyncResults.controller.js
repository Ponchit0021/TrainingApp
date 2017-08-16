sap.ui.controller("originacion.SyncResults", {
    /*
                source: _sSource, // Notification / Sync
                status: _sStatus, // Ok, Error, BusinessError
                id: _sId, // Id DM
                requestDescription: _sRequestDescription, // Nombre del cliente o del grupo
                statusDescription: _sStatusDescription
     */
    onInit: function() {

        jQuery.sap.require("js.sync.Synchronizer");

        var oRouter;

        currentController = this;
        if (!sap.ui.getCore().getModel("ModelResult")) {

            var oModelResult;

            oModelResult = new sap.ui.model.json.JSONModel();
            oModelResult.setProperty("/", []);
            sap.ui.getCore().setModel(oModelResult, "ModelResult");


        }
        currentController.router = sap.ui.core.UIComponent.getRouterFor(currentController);
        //currentController.router.attachRoutePatternMatched(currentController.onLoadTable.bind(this), currentController);
        //oRouter = this.getRouter();
        //oRouter.getRoute("syncResultsList").attachMatched(currentController.onLoadTable.bind(this), this);


        sap.ui.core.UIComponent.getRouterFor(this).getRoute("syncResultsList").attachMatched(currentController.onLoadTable.bind(this), this);

        var oSyncResultsTable = sap.ui.getCore().byId("tbldSyncResults");

        oSyncResultsTable.setModel(sap.ui.getCore().getModel("ModelResult"));
        oSyncResultsTable.bindAggregation("items", {
            path: "/",
            factory: function(_id, _context) {
                return this.onLoadTableSyncResults(_context);
            }.bind(this)
        });

        oSyncResultsTable.attachUpdateFinished(function(evt) {
            this.updateCounters();
        }.bind(this));




    },

    sync: function() {


        /// Variable para sincronización parcial de Stores
        if (!sap.ui.getCore().AppContext.iSyncs) {
            sap.ui.getCore().AppContext.iSyncs = 1
        } else {
            sap.ui.getCore().AppContext.iSyncs++;
        }


        console.log("Se dispara sincronización");
        sap.ui.getCore().AppContext.bAlreadyInSync = true;
        oHelper = new sap.ui.helper.Schema();
        oSync = new sap.ui.sync.Synchronizer(oHelper.getDataDBName(), oHelper.getSyncDBName());
        oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oSync.sync(oRouter).then(sap.ui.getCore().AppContext.bAlreadyInSync = false).catch(sap.ui.getCore().AppContext.bAlreadyInSync = false);

        sap.ui.getCore().AppContext.SyncError = 0;
        sap.ui.getCore().AppContext.SyncOK = 0;

    },

    updateCounters: function() {

        if (sap.ui.getCore().byId("appListResults1")) {

            sap.ui.getCore().byId("appListResults1").setCount(sap.ui.getCore().getModel("ModelResult").getProperty("/").length);
            sap.ui.getCore().byId("appListResults2").setCount(sap.ui.getCore().AppContext.SyncOK);
            sap.ui.getCore().byId("appListResults3").setCount(sap.ui.getCore().AppContext.SyncError);
        }


    },

    toBack: function() {
        window.history.go(-1);
    },
    goToDetail: function() {
        var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
        oCurrentApp.to("oPageDetailSyncResults");
    },
    goBackApp: function() {
        var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
        oCurrentApp.back();
    },

    setFilterResults: function(evt) {
        var currentTabFilter = sap.ui.getCore().byId(evt.getParameter("key"));
        var option = currentTabFilter.sId;

        setTimeout(function() {
            switch (option) {
                case "appListResults2":

                    sap.ui.getCore().AppContext.SyncOK = 0;
                    //sap.ui.getCore().AppContext.SyncError = 0;

                    var oTable = sap.ui.getCore().byId("tbldSyncResults");
                    var oBinding = oTable.getBinding("items");
                    var eq = sap.ui.model.FilterOperator.EQ
                    var oFilter = new sap.ui.model.Filter("status", eq, "OK");
                    oBinding.filter(oFilter);


                    break;
                case "appListResults3":

                    //sap.ui.getCore().AppContext.SyncOK = 0;
                    sap.ui.getCore().AppContext.SyncError = 0;

                    var oTable = sap.ui.getCore().byId("tbldSyncResults");
                    var oBinding = oTable.getBinding("items");
                    var ne = sap.ui.model.FilterOperator.NE
                    var oFilter = new sap.ui.model.Filter("status", ne, "OK");
                    oBinding.filter(oFilter);

                    break;
                default:
                    sap.ui.getCore().AppContext.SyncOK = 0;
                    sap.ui.getCore().AppContext.SyncError = 0;
                    var oTable = sap.ui.getCore().byId("tbldSyncResults");
                    var oBinding = oTable.getBinding("items");
                    oBinding.aSorters = null;
                    oBinding.aFilters = null;
                    sap.ui.getCore().getModel("ModelResult").refresh(true);
                    break;


            }
        }, 0);

    },

    onLoadTable: function(oEvent) {


        var oLoanRequestSync, oDictionary, oArgs;





        jQuery.sap.require("js.sync.loanRequest.LoanRequestSynchronizer");
        jQuery.sap.require("js.sync.customer.CustomerSynchronizer");
        jQuery.sap.require("js.helper.Dictionary");
        oCustomerSync = new sap.ui.sync.Customer("dataDB", "syncDB");
        oLoanRequestSync = new sap.ui.sync.LoanRequest("dataDB", "syncDB");
        oDictionary = new sap.ui.helper.Dictionary();

        oArgs = oEvent.getParameter("arguments");

        sap.ui.getCore().AppContext.SyncError = 0;
        sap.ui.getCore().AppContext.SyncOK = 0;

        if (sap.ui.getCore().AppContext.bDoSync == false) {

            if (sap.ui.getCore().getModel("ModelResult")) {
                sap.ui.getCore().getModel("ModelResult").refresh(true);
            }

        } else {

            this.sync();
            sap.ui.getCore().AppContext.bDoSync = false;

        }


    },
    onLoadTableSyncResults: function(_context) {
        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
        var oDisplayBase, oActionBase;
        var oItem;
        var sType;
        var sDescription;

        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        var itemsTemplate;
        itemsTemplate = new sap.m.ColumnListItem({});
        itemsTemplate.setType(sap.m.ListType.Active);


        oItem = _context.getProperty(_context.sPath);

        var oIcon;

        var oHorizontalLayout;


        if (oItem.status == "ERROR" || oItem.status == "BUSINESSERROR") {

            oHorizontalLayout = new sap.ui.layout.HorizontalLayout();

            if (oItem.source == "NOTIFICATION") {

                oHorizontalLayout.addContent(oDisplayBase.createIcon("", "sap-icon://error", "1.0rem").addStyleClass('semaphoreLevelRed'));
                oHorizontalLayout.addContent(oDisplayBase.createIcon("", "sap-icon://download", "1.0rem").addStyleClass('semaphoreLevelRed'));
                oIcon = oHorizontalLayout;

            } else {

                oIcon = oDisplayBase.createIcon("", "sap-icon://error", "1.0rem").addStyleClass('semaphoreLevelRed');

            }
            sap.ui.getCore().AppContext.SyncError++;

        } else {

            sap.ui.getCore().AppContext.SyncOK++;
            if (oItem.source == "NOTIFICATION") {
                oIcon = oDisplayBase.createIcon("", "sap-icon://download", "1.0rem").addStyleClass('semaphoreLevelGreen');

            } else {
                oIcon = oDisplayBase.createIcon("", "sap-icon://upload", "1.0rem").addStyleClass('semaphoreLevelGreen');

            }
        }

        if (oItem.objectType == "C_GRUPAL_CCR" || oItem.objectType == "C_GRUPAL_CM") {
            sType = "Solicitud";
        }

        if (oItem.objectType == "C_IND_CI") {
            sType = "Solicitud";
        }

        if (oItem.objectType == "GUARANTOR") {
            sType = "Aval";
        }

        if (oItem.objectType == "CUSTOMER") {
            sType = "Solicitante";
        }
        if (oItem.objectType == "NOTIFICATION") {
            sType = "Notificación";
        }
        if (oItem.objectType == "INSURANCE" || oItem.objectType == "INS") {
            sType = "Seguro";
        }
        //agregar otra validacion para diferenciar de la oportunidad
        if (oItem.objectType == "C_IND_CA" || oItem.objectType == "C_IND_CCM" || oItem.objectType == "C_IND_CA_CCR" || oItem.objectType == "C_IND_CCM_CCR" || oItem.objectType == "CROSSSELLOFFER") {
            sType = "Oferta de Crédito";
        }

        sDescription = oItem.requestDescription.toUpperCase();
        itemsTemplate.addCell(oDisplayBase.createText("", sType));
        itemsTemplate.addCell(oDisplayBase.createText("", sDescription)); // Se quita el idDM para evitar confución del usuario final - oItem.id 
        itemsTemplate.addCell(oIcon);
        itemsTemplate.addCell(new sap.m.ObjectIdentifier({
            title: oItem.statusDescription
        }));




        return itemsTemplate;
    },
    onListItemPress: function(evt) {

        jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
        jQuery.sap.require("js.sync.loanRequest.LoanRequestSynchronizer");
        jQuery.sap.require("js.serialize.bp.BPSerialize");
        jQuery.sap.require("js.sync.bp.BPSynchronizer");
        jQuery.sap.require("js.helper.Dictionary");

        var oLoanRequestSerializer, oLoanRequestSync, oRouter, oLoanRequestSync;
        var sPath, oItem, aPromises;

        sPath = evt.getParameters().listItem.getBindingContext().getPath();
        oItem = evt.getParameters().listItem.getBindingContext().getModel().getProperty(sPath);
        aPromises = [];

        sap.ui.getCore().AppContext.iCurrentSyncElement = Number.parseInt(sPath.replace("/", ""));

        oRouter = sap.ui.core.UIComponent.getRouterFor(this);


        if (oItem.objectType == "C_GRUPAL_CCR" || oItem.objectType == "C_GRUPAL_CM") {
            //////// Es un credito grupal


            if (oItem.status === "OK" || oItem.status === "ERROR") {
                /// Solo mostrar la oportunidad
                oRouter.navTo("groupalApplication", {
                    grupalTypeID: oItem.objectType,
                    loanRequestId: oItem.id
                }, false);

            } else {

                oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
                oLoanRequestSync = new sap.ui.sync.LoanRequest("dataDB", "syncDB");
                oDictionary = new sap.ui.helper.Dictionary();

                aPromises.push(oLoanRequestSerializer.updateFlagEntitityInQueue(oItem.id, false));
                aPromises.push(oLoanRequestSync.deleteFromQueue(oItem.id, oDictionary));

                Promise.all(aPromises).then(function(oItem, oRouter, results) {

                    oItem.hasOwnProperty("NotificationID") ? sap.ui.getCore().AppContext.NotificationID = oItem.NotificationID : sap.ui.getCore().AppContext.NotificationID = "";

                    oRouter.navTo("groupalApplication", {
                        grupalTypeID: oItem.objectType,
                        loanRequestId: oItem.id
                    }, false);

                }.bind(this, oItem, oRouter));


            }

        }


        if (oItem.objectType == "GUARANTOR") {
            //////// Es un credito grupal


            if (oItem.status === "OK" || oItem.status === "ERROR") {
                /// Solo mostrar la oportunidad

                sap.ui.core.UIComponent.getRouterFor(this).navTo("guarantorsDetail", {
                    guarantorId: oItem.id,
                    query: {
                        tab: "Name"
                    }
                }, false);




            } else {

                oBPSerializer = new sap.ui.serialize.BP("dataDB", "Guarantor");
                oBPSync = new sap.ui.sync.BP("dataDB", "syncDB", "Guarantor");
                oDictionary = new sap.ui.helper.Dictionary();

                aPromises.push(oBPSerializer.updateFlagEntitityInQueue(oItem.id, false));
                aPromises.push(oBPSync.deleteFromQueue(oItem.id, oDictionary));

                Promise.all(aPromises).then(function(oItem, oRouter, results) {

                    //oItem.hasOwnProperty("NotificationID") ? sap.ui.getCore().AppContext.NotificationID = oItem.NotificationID : sap.ui.getCore().AppContext.NotificationID = "";

                    sap.ui.core.UIComponent.getRouterFor(this).navTo("guarantorsDetail", {
                        guarantorId: oItem.id,
                        query: {
                            tab: "Name"
                        }
                    }, false);

                }.bind(this, oItem, oRouter));


            }


        }


        if (oItem.objectType == "CUSTOMER") {
            //////// Es un credito grupal


            if (oItem.status === "OK" || oItem.status === "ERROR") {
                /// Solo mostrar la oportunidad

                sap.ui.core.UIComponent.getRouterFor(this).navTo("applicantsDetail", {
                    applicantId: oItem.id,
                    query: {
                        tab: "Name"
                    }
                }, false);




            } else {

                oBPSerializer = new sap.ui.serialize.BP("dataDB", "Customer");
                oBPSync = new sap.ui.sync.BP("dataDB", "syncDB", "Customer");
                oDictionary = new sap.ui.helper.Dictionary();

                aPromises.push(oBPSerializer.updateFlagEntitityInQueue(oItem.id, false));
                aPromises.push(oBPSync.deleteFromQueue(oItem.id, oDictionary));

                Promise.all(aPromises).then(function(oItem, oRouter, results) {

                    //oItem.hasOwnProperty("NotificationID") ? sap.ui.getCore().AppContext.NotificationID = oItem.NotificationID : sap.ui.getCore().AppContext.NotificationID = "";

                    sap.ui.core.UIComponent.getRouterFor(this).navTo("applicantsDetail", {
                        applicantId: oItem.id,
                        query: {
                            tab: "Name"
                        }
                    }, false);

                }.bind(this, oItem, oRouter));


            }


        }



        /*  oBPSerializer.updateFlagEntitityInQueue(oItem.id, false)
                .then(
                    function(oItem, oRouter, result) {
                        var oLoanRequestSync;




                        oLoanRequestSync.deleteFromQueue(oItem.id, oDictionary).then(
                            function(oItem, oRouter, result) {

                                if (oItem.NotificationID) {
                                    sap.ui.getCore().AppContext.NotificationID = oItem.NotificationID;
                                } else {
                                    sap.ui.getCore().AppContext.NotificationID = "";
                                }


                                oRouter.navTo("groupalApplication", {
                                    grupalTypeID: oItem.objectType,
                                    loanRequestId: oItem.id
                                }, false);


                            }.bind(this, oItem, oRouter));

                    }.bind(this, oItem, oRouter));




        } */


        if (oItem.objectType == "C_IND_CI") {
            if (oItem.status === "OK" || oItem.status === "ERROR") {
                /// Solo mostrar la oportunidad
                sap.ui.getCore().AppContext.bIsCreating = false;
                oRouter.navTo("IndividualApplications", {
                    aplicationId: oItem.id,
                    query: {
                        tab: "Main"
                    }
                }, false);

            } else {

                oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
                oLoanRequestSync = new sap.ui.sync.LoanRequest("dataDB", "syncDB");
                oDictionary = new sap.ui.helper.Dictionary();

                aPromises.push(oLoanRequestSerializer.updateFlagEntitityInQueue(oItem.id, false));
                aPromises.push(oLoanRequestSync.deleteFromQueue(oItem.id, oDictionary));

                Promise.all(aPromises).then(function(oItem, oRouter, results) {

                    oItem.hasOwnProperty("NotificationID") ? sap.ui.getCore().AppContext.NotificationID = oItem.NotificationID : sap.ui.getCore().AppContext.NotificationID = "";
                    sap.ui.getCore().AppContext.bIsCreating = false;
                    oRouter.navTo("IndividualApplications", {
                        aplicationId: oItem.id,
                        query: {
                            tab: "Main"
                        }
                    }, false);




                }.bind(this, oItem, oRouter));


            }

        }




        if (oItem.type == "APPLICANT") {
            //////// Es un credito grupal
            oCustomerSerializer = new sap.ui.serialize.Customer("dataDB");




            oCustomerSerializer.deSerialize(oItem.id, true).then(

                function(_oRouter, _sItemId, _oCustomerSerializer, oItem, result) {
                    ///////// Eliminar del Queue
                    _oCustomerSerializer.updateFlagEntitityInQueue(_sItemId, false)
                        .then(function(_sItemId, _oRouter, _ApplicantsResult, oItem, result) {
                            var oDictionary;
                            oCustomerSync = new sap.ui.sync.Customer("dataDB", "syncDB");

                            jQuery.sap.require("js.helper.Dictionary");
                            oDictionary = new sap.ui.helper.Dictionary()


                            oCustomerSync.deleteFromQueue(_sItemId, oDictionary).then(
                                function(_ApplicantsResult, _oRouter, oItem, result) {

                                    var oModelApplicant;

                                    var currentPhoneSet = [];

                                    _ApplicantsResult.PhoneSet.forEach(function(entry) {
                                        currentPhoneSet.push(entry)

                                    });
                                    _ApplicantsResult.PhoneSet = { results: currentPhoneSet };
                                    var currentAddressSet = [];
                                    console.log(_ApplicantsResult);
                                    _ApplicantsResult.AddressSet.forEach(function(entry) {
                                        currentAddressSet.push(entry)

                                    });
                                    _ApplicantsResult.AddressSet = { results: currentAddressSet };
                                    console.log(_ApplicantsResult);
                                    var currentPersonalReferenceSet = [];
                                    _ApplicantsResult.PersonalReferenceSet.forEach(function(entry) {
                                        currentPersonalReferenceSet.push(entry)

                                    });
                                    _ApplicantsResult.PersonalReferenceSet = { results: currentPersonalReferenceSet }
                                    var currentEmployerSet = [];
                                    _ApplicantsResult.EmployerSet.forEach(function(entry) {
                                        currentEmployerSet.push(entry);

                                    });
                                    _ApplicantsResult.EmployerSet = { results: currentEmployerSet }

                                    oModelApplicant = new sap.ui.model.json.JSONModel();
                                    oModelApplicant.setData(_ApplicantsResult);

                                    sap.ui.getCore().AppContext.FlagDetailCustomer = false;
                                    //var oModelContext = new sap.ui.model.Context(oModelApplicant, "/");
                                    sap.ui.getCore().AppContext.ApplicantContextModel = oModelApplicant; // oModelContext;
                                    sap.ui.getCore().AppContext.FlagGetDetailCustomerAnnouncements = true;
                                    sap.ui.getCore().AppContext.FlagDetailCustomer = false;

                                    if (oItem.NotificationID) {
                                        sap.ui.getCore().AppContext.NotificationID = oItem.NotificationID;
                                    } else {
                                        sap.ui.getCore().AppContext.NotificationID = "";
                                    }


                                    _oRouter.navTo("Applicants", {
                                        typeId: 3
                                    }, false);




                                }.bind(this, _ApplicantsResult, _oRouter, oItem));

                        }.bind(this, _sItemId, _oRouter, result, oItem));
                    /// Actualizar bandera

                }.bind(this, oRouter, oItem.id, oCustomerSerializer, oItem)

            ).catch(
                function(error) {

                    console.log("No fue posible recuperar el detalle de la solicitud: " + error)
                    sap.m.MessageToast.show("No fue posible recuperar el detalle de la solicitud.");

                }
            );

        }

        if (oItem.objectType == "INSURANCE") { /// Los seguros tienen errores de negocio ?
            //////// Es un seguro
            oItem.hasOwnProperty("NotificationID") ? sap.ui.getCore().AppContext.sCurrentInsuranceNotificationID = oItem.NotificationID : sap.ui.getCore().AppContext.sCurrentInsuranceNotificationID = "";

            if (oItem.source == "NOTIFICATION" && oItem.status == "OK") {
                //Asignación del seguro OK
            } else {
                //Asignación del seguro ERROR - BUSINESSERROR
                var oInsuranceSerializer = new sap.ui.serialize.Insurance("dataDB");
                oInsuranceSerializer.getInsuranceSyncResult(oItem.insuranceObjectIdDM)
                    .then(function(results) {
                        if (results.InsuranceSet.length > 0) {
                            //elimina de SyncDB
                            var oInsuranceSet = results.InsuranceSet[0];
                            var oInsuranceSync = new sap.ui.sync.Insurance("dataDB", "syncDB");
                            var oDictionary = new sap.ui.helper.Dictionary();
                            aPromises.push(oInsuranceSync.deleteFromQueue(oItem.id, oDictionary));
                            Promise.all(aPromises).then(function(oInsuranceSet, oRouter, results) {
                                oRouter.navTo("insuranceDetails", {
                                    LoanRequestIdCRM: oInsuranceSet.LoanRequestIdCRM !== "" ? oInsuranceSet.LoanRequestIdCRM : oInsuranceSet.LoanRequestIdMD,
                                    CustomerIdCRM: oInsuranceSet.CustomerIdCRM !== "" ? oInsuranceSet.CustomerIdCRM : oInsuranceSet.CustomerIdMD,
                                    query: {
                                        source: "1", //SyncResults
                                        notificationId: oItem.NotificationID
                                    }
                                }, false);
                            }.bind(this, oInsuranceSet, oRouter));
                        } else {
                            sap.m.MessageToast.show("No fue posible recuperar el detalle del seguro.");
                        }
                    });
            }
        }
    },

    buscarIndiceOportunidadSeleccionada: function(oData, numeroOportunidad) {
        var oportunidadSeleccionada = null;
        for (var liX = 0; liX < oData.length; liX++) {
            if (oData[liX].loanRequestIdCRM == numeroOportunidad) {
                oportunidadSeleccionada = liX;
            }
        }
        return oportunidadSeleccionada;
    },
    //Busqueda
    searchSyncResultsTxt: function(evt) {
        var aFilters = [];
        var txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            // colocamos el path del odata
            var filter = new sap.ui.model.Filter("option/solicitanteNombre", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            aFilters.push(filter);
        }
        var table = sap.ui.getCore().byId("tblSyncResults"); //this.getView().byId("mprList");
        var binding = table.getBinding("items");
        binding.filter(aFilters, "Application");
    }
});
