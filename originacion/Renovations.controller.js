sap.ui.controller("originacion.Renovations", {
    currentModelContext:new sap.ui.model.json.JSONModel(),
    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf originacion.Renovations
     */
    //  onInit: function() {
    //
    //  },

    /**
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
     * (NOT before the first rendering! onInit() is used for that one!).
     * @memberOf originacion.Renovations
     */
    //  onBeforeRendering: function() {
    //
    //  },

    /**
     * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
     * This hook is the same one that SAPUI5 controls get after being rendered.
     * @memberOf originacion.Renovations
     */
    //  onAfterRendering: function() {
    //
    //  },

    /**
     * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
     * @memberOf originacion.Renovations
     */
    //  onExit: function() {
    //
    //  }
    onInit: function() {
        var oController, oNavigatorBase;
        oController = this;
        jQuery.sap.require("js.kapsel.Rest");

        jQuery.sap.require("js.base.NavigatorBase");
        oNavigatorBase = new sap.ui.mw.NavigatorBase();
        if (!oNavigatorBase.testUserAgent()) {
            
            oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("renovationList").attachMatched(this._onRouteMatched, this);
        };

    },

    _onRouteMatched: function(evt) {
        console.log("1 getApplicationsList");
        var oController, parametrosServicio, oModelPreLoan, oModel, myTableRenovations, oPreLoanRequests;
        var currentData, count = 0, aux = 0;
        oController = this;
        
        // PreLoanRequest
        oModelPreLoan = sap.ui.getCore().AppContext.myRest.read("/PreLoanRequestSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "'&$expand=LinkPreloanRequestSet/CustomerSet&format=json", true);        

        console.log("oModelPreLoan");
        console.log(oModelPreLoan);
        sap.ui.getCore().AppContext.loader.show("Cargando Subsecuencias");
        return new Promise(function(resolve, reject) {
            try {
                //oPromise = sap.ui.getCore().AppContext.myRest.read("/InsuranceSet?$filter=CustomerIdCRM eq '" + _oArg.CustomerIdCRM + "'&$expand=InsuranceBeneficiarySet,ElectronicSignatureSet" + "", null, null, false);
              //  oFilter = "$filter=CustomerIdCRM eq '" + _oArg.CustomerIdCRM + "' and LoanRequestIdCRM eq '" + _oArg.LoanRequestIdCRM + "'";
                oPromise = sap.ui.getCore().AppContext.myRest.read("/PreLoanRequestSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "'&$expand=LinkPreloanRequestSet/CustomerSet&format=json", true);   
                oPromise
                    .then(function(oResult) {

                        console.log(oResult);
                        jQuery.sap.require("js.buffer.renovation.RenovationBuffer");
                        var oRenovationBuffer = new sap.ui.buffer.Renovation("renoDB");
                          
                        sap.ui.getCore().AppContext.loader.close();
                        oModel = new sap.ui.model.json.JSONModel();
                        oModel.setData(oResult);
                        oPreLoanRequests = oModel.getProperty("/results");
                        console.log(oPreLoanRequests);

                        currentData = oModel.getData();
                        console.log(currentData.results.length);

                        /*oRenovationBuffer.searchAllInRenoDB()
                        .then(function(ooResult){

                            oPreLoanRequests.forEach(function(currPreLoanRequest) {
                                ooResult.RenovationSet.forEach(function(currPreLoanRequestDB) {
                                    if(currPreLoanRequest.PreLoanRequestID === currPreLoanRequestDB.id){
                                        //while(_.where(currentData.results, {PreLoanRequestID: currPreLoanRequest.PreLoanRequestID}).length > 0){
                                            
                                            currentData.results = _.filter(currentData.results, function(item){
                                                item.PreLoanRequestID = currPreLoanRequest.PreLoanRequestID;
                                            });

                                            oModel.refresh();
                                        //}
                                    }
                                });
                            });

                            if (oResult.results.length > 0) {
                                myTableRenovations = sap.ui.getCore().byId("tblAppRenovations", "items");

                                myTableRenovations.setModel(oModel);
                                itemsTemplate = new sap.m.ColumnListItem({});
                                myTableRenovations.bindAggregation("items", {
                                    path: "/results",
                                    factory: function(_id, _context) {
                                        return oController.onLoadTableRenovations(_context,oController);
                                    }
                                });
                                //resolve(oDataModel);
                                sap.ui.getCore().AppContext.loader.close();
                            } else {
                              
                                sap.ui.getCore().AppContext.loader.close();
                               // sap.m.MessageToast.show("No se logró cargar toda la información, intente de nuevo por favor.");
                                resolve(oResult);
                              
                            }
                        });
                        */

                        oPreLoanRequests.forEach(function(currPreLoanRequest, i) {
                            console.log(currPreLoanRequest);

                            oRenovationBuffer.searchInRenoDB(currPreLoanRequest.PreLoanRequestID)
                                .then(function(ooResult) {
                                    if (ooResult) {
                                        console.log('si existe ' + currPreLoanRequest.PreLoanRequestID + ' . quitando...');
                                        currentData.results.splice(i - count, 1);
                                        oModel.refresh();
                                        count++;
                                    }

                                    aux++;

                                    if(currentData.results.length == aux){
                                        if (oResult.results.length > 0) {
                                            myTableRenovations = sap.ui.getCore().byId("tblAppRenovations", "items");

                                            myTableRenovations.setModel(oModel);
                                            itemsTemplate = new sap.m.ColumnListItem({});
                                            myTableRenovations.bindAggregation("items", {
                                                path: "/results",
                                                factory: function(_id, _context) {
                                                    return oController.onLoadTableRenovations(_context,oController);
                                                }
                                            });
                                            //resolve(oDataModel);
                                            sap.ui.getCore().AppContext.loader.close();
                                        } else {
                                          
                                            sap.ui.getCore().AppContext.loader.close();
                                           // sap.m.MessageToast.show("No se logró cargar toda la información, intente de nuevo por favor.");
                                            resolve(oResult);
                                          
                                        }
                                    }
                                });
                        });

                        
                    }).catch(function(e) {
                        resolve(e);
                         sap.ui.getCore().AppContext.loader.close();
                    });
            } catch (e) {
                reject(e);
                 sap.ui.getCore().AppContext.loader.close();
            }
        });

        /*bdLoader = sap.ui.getCore().byId("bdLoaderRenovations");
        bdLoader.setText("Cargando Subsecuencias");
        bdLoader.open();
        sap.ui.getCore().AppContext.loader.show("Cargando Subsecuencias");
        setTimeout(function() {
            oModelPreLoan
                .then(function(response) {
                    console.log(response);
                    sap.ui.getCore().AppContext.loader.close();
                    oModel = new sap.ui.model.json.JSONModel();
                    console.log(response);
                    oModel.setData(response);

                    myTableRenovations = sap.ui.getCore().byId("tblAppRenovations", "items");

                    myTableRenovations.setModel(oModel);
                    itemsTemplate = new sap.m.ColumnListItem({});
                    myTableRenovations.bindAggregation("items", {
                        path: "/results",
                        factory: function(_id, _context) {
                            return oController.onLoadTableRenovations(_context,oController);
                        }
                    });
                }).catch(function(error) {
                    sap.ui.getCore().AppContext.loader.close();
                    sap.m.MessageToast.show("No se logró cargar toda la información, intente de nuevo por favor.");
                    console.log(error);
                });
        },2000)
        */
    },
    onBeforeShow: function(evt) {

        var oController, oNavigatorBase;
        oController = this;

        jQuery.sap.require("js.base.NavigatorBase");
        oNavigatorBase = new sap.ui.mw.NavigatorBase();

        /*if (oNavigatorBase.testUserAgent()) {
            if (sap.ui.getCore().AppContext.isConected === true) {
                sap.OData.removeHttpClient();
                setTimeout(function() {
                    oController._onRouteMatched();
                }, 1000);

            } else {
                sap.m.MessageToast.show("Modulo disponible solo online.", {
                    duration: 1000,
                    closeOnBrowserNavigation: false,
                    onClose: function() {
                        sap.OData.applyHttpClient();
                        window.history.go(-1);
                    }
                });
            }        
        };  */
        oController._onRouteMatched();       
    },

    toBack: function() {
        jQuery.sap.require("js.base.NavigatorBase");
        oNavigatorBase = new sap.ui.mw.NavigatorBase();

        /*if (!oNavigatorBase.testUserAgent()) {
            setTimeout(function() {
                window.history.go(-1);
            }, 1000);
        } else {
            if (sap.ui.getCore().AppContext.isConected === true) {
                sap.OData.applyHttpClient();
            } else {
                sap.OData.removeHttpClient();
            }
            setTimeout(function() {
                window.history.go(-1);
            }, 1000);
        };*/
        window.history.go(-1);
    },
    getRenovationData: function(isRenovation) {
        var promiseSubsequence, context, oportunidad, createSubsequence, oModelError;
        tblIntegrantes = sap.ui.getCore().byId("tblAppRenovations");

        if (tblIntegrantes.getSelectedItems().length < 1) {
            sap.m.MessageToast.show("Tienes que seleccionar una oportunidad.", {
                duration: 4000
            });
        }

        context = tblIntegrantes.getSelectedItems()[0].getBindingContext();

        oportunidad = tblIntegrantes.getModel().getProperty(context.sPath);
        createSubsequence = {
            PreLoanRequestID: oportunidad.PreLoanRequestID,
            LoanRequestIdCRM: oportunidad.LoanRequestIdCRM,
            CollaboratorID: sap.ui.getCore().AppContext.Promotor,
            ServiceOfficeId: oportunidad.ServiceOfficeId,
            LoanAssignedName: oportunidad.LoanAssignedName,
            IsRenovation: IsRenovation
        };

        console.log(JSON.stringify(createSubsequence));
        promiseSubsequence = sap.ui.getCore().AppContext.myRest.create("PreLoanRequestSet", createSubsequence, true);
        promiseSubsequence.then(function(response) {
            console.log(response);
            sap.m.MessageToast.show("Se ha creado la oportunidad.", {
                duration: 4000
            });
        }).catch(function(error) {
            oModelError = new sap.ui.model.json.JSONModel();
            oModelError.setJSON(error);
            sap.m.MessageToast.show(oModelError.oData.error.message.value);
            console.log(error);
        });

    },
    onListItemPressAccept: function(evt) {
        jQuery.sap.require("js.buffer.renovation.RenovationBuffer");
        jQuery.sap.require("js.helper.Dictionary");
        var oDictionary, oRequest, oRenovationBuffer;

        var promiseSubsequence, context, createSubsequence, path;
        var tblRenovations, currentModel, aux, auxPath, currentData, oModelError;
        path = evt.getSource().getBindingContext().getPath();
        context = evt.getSource().getBindingContext().getProperty(path);

        if (Object.keys(context).length < 1) {
            sap.m.MessageToast.show("Tienes que seleccionar una oportunidad.", {
                duration: 4000
            });
        }

        /*bdLoader = sap.ui.getCore().byId("bdLoaderRenovations");
        bdLoader.setText("Aprobando Subsecuencia");*/
        sap.ui.getCore().AppContext.loader.show("Aprobando Subsecuencia");
        createSubsequence = {
            PreLoanRequestID: context.PreLoanRequestID,
            LoanRequestIdCRM: context.LoanRequestIdCRM,
            CollaboratorID: sap.ui.getCore().AppContext.Promotor,
            ServiceOfficeId: context.ServiceOfficeId,
            LoanAssignedName: context.LoanAssignedName,
            IsRenovation: true
        };

        console.log(JSON.stringify(createSubsequence));
        promiseSubsequence = sap.ui.getCore().AppContext.myRest.create("PreLoanRequestSet", createSubsequence, true);
        promiseSubsequence.then(function(response) {
            sap.ui.getCore().AppContext.loader.close();
            console.log(response);

            oDictionary = new sap.ui.helper.Dictionary();
            oRenovationBuffer = new sap.ui.buffer.Renovation("renoDB");
            oRequest = {
                id: context.PreLoanRequestID,
                loanRequestIdCRM: context.LoanRequestIdCRM,
                accepted: true,
                requestMethod: oDictionary.oMethods.POST,
                //requestUrl: oDictionary.oDataTypes.Insurance,
                requestBodyId: context.PreLoanRequestID,
                requestStatus: oDictionary.oRequestStatus.Initial
            };

            oRenovationBuffer.postRequest(oRequest)
                .then(function(oResult) {
                    console.log("Registro renovation guardado");
                    //Se valida si existe BussinessError en una s
                });

            sap.m.MessageToast.show("Se ha creado la oportunidad.", {
                duration: 4000
            });
            /*********StartChange DVH 26-05-2016***********/
            /*Refresh a modelo de tabla de proximas renovaciones*/
            /**********************************************/
            tblRenovations = sap.ui.getCore().byId("tblAppRenovations");
            currentModel = tblRenovations.getModel();
            currentData = currentModel.getData();
            aux = path.split("/");
            auxPath = aux[aux.length - 1];
            currentData.results.splice(auxPath, 1);
            currentModel.refresh();
            /*********EndChange DVH 26-05-2016***********/
            /*Refresh a modelo de tabla de proximas renovaciones*/
            /**********************************************/
        }).catch(function(error) {
            sap.ui.getCore().AppContext.loader.close();
            oModelError = new sap.ui.model.json.JSONModel();
            oModelError.setJSON(error);
            sap.m.MessageToast.show(oModelError.oData.error.message.value);
            console.log(error);
        });

    },
    onLoadTableRenovations: function(_context, oController) {
        console.log("2. onLoadTableRenovations");
        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
        var oDisplayBase, oActionBase, itemsTemplate, fechaString, fechaDate, oController;
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();

        itemsTemplate = new sap.m.ColumnListItem({});
        itemsTemplate.setType(sap.m.ListType.Active);
        itemsTemplate.addCell(new sap.m.ObjectIdentifier({
            title: _context.getProperty(_context.sPath + "/LoanAssignedName"),
            //text: fechaDate,
            responsive: true
        }));
        itemsTemplate.addCell(oActionBase.createButton("", "", "Emphasized", "sap-icon://accept", oController.onListItemPressAccept, oController));
        itemsTemplate.addCell(oActionBase.createButton("", "", "Emphasized", "sap-icon://decline", oController.onListItemPressDecline, oController));
        return itemsTemplate;
    },
    onListItemPress: function(evt) {
        var name, listaDeIntegrantes, tblIntegrantes, oController, context, oListBase, oActionBase, oContainerBase, buttons, oObjectListItem, barraBotones;
        listaDeIntegrantes = sap.ui.getCore().byId("nsApplicantsList");
        tblIntegrantes = sap.ui.getCore().byId("tblAppRenovations");
        oController = this;

        //Validamos el producto de crédito (Si es Individual no se muestra el cuadro de diálogo de los Integrantes)
        context = tblIntegrantes.getSelectedItems()[0].getBindingContext();
        //Obtenemos la Oportunidad seleccionada
        oportunidad = tblIntegrantes.getModel().getProperty(context.sPath + "/LinkPreloanRequestSet/results"); 
        // oportunidad = tblIntegrantes.getModel().getProperty(context.sPath + "/LinkPreloanRequestSet" + context.sPath + "/CustomerSet/results"); 

        // oportunidad={ results: [oportunidad] }
        
        oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(oportunidad);
        

        listaDeIntegrantes.open();

        oListBase = new sap.ui.mw.ListBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oContainerBase = new sap.ui.mw.ContainerBase();

        buttons = [
            oActionBase.createButton("btnAceptar", "Cerrar", "Emphasized", null, this.onAcceptApplicantsList, this)
        ];

        //Creamos el detalle de la lista (Información a mostrar)
        oObjectListItem = new sap.m.ObjectListItem({
            title: "{CustomerSet/results/0/BpName/FirstName} {CustomerSet/results/0/BpName/MiddleName} {CustomerSet/results/0/BpName/LastName} {CustomerSet/results/0/BpName/SecondName}"
        });

        barraBotones = oContainerBase.createBar("", null, buttons, null);

        listaDeIntegrantes.addContent(oListBase.createList("lstLIstaIntegrantesPrev", "",
            sap.m.ListMode.SingleSelectMaster, oModel,
            "/", oObjectListItem, null, null));
        listaDeIntegrantes.addContent(barraBotones);

    },
    onAcceptApplicantsList: function(evt) {
        var listaDeIntegrantes;
        listaDeIntegrantes = sap.ui.getCore().byId("nsApplicantsList");
        listaDeIntegrantes.destroyContent();
        listaDeIntegrantes.destroyButtons();
        listaDeIntegrantes.close();
    },

    searchRenovationTxt: function(evt) {
        var aFilters = [],
            txtSeachFilter, table, binding, filter;

        txtSeachFilter = evt.getSource().getValue();

        if (txtSeachFilter.length > 0) {
            // colocamos el path del odata
            filter = new sap.ui.model.Filter("LoanAssignedName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            aFilters.push(filter);
        }
        table = sap.ui.getCore().byId("tblAppRenovations"); //this.getView().byId("mprList");
        binding = table.getBinding("items");
        binding.filter(aFilters, "Application");
        //binding.filter(aFilters);
    },
    // Ini OUB 08.08.2016
    closeDialogReject: function(evt) {
        var selectDialogReject;
        selectDialogReject = sap.ui.getCore().byId("appDialogRejection");
        selectDialogReject.destroyContent().destroyButtons();
        selectDialogReject.close();
    },
    onLoadTableReject: function(_context, oController) {
        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
        var oDisplayBase, oActionBase, itemsTemplate, rejectReason;
        
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();

        itemsTemplate = new sap.m.ColumnListItem({});
        itemsTemplate.setType(sap.m.ListType.Active);
        itemsTemplate.addCell(new sap.m.ObjectIdentifier({
            //title: _context.getProperty(_context.sPath + "text"),
            text: _context.getProperty("text"),
            responsive: true
        }));
        return itemsTemplate;
    },
    onListItemPressDecline: function(evt) {
        console.log("3. onListItemPressDecline");
        var oListBase, myRejectReasonModel, oRejectListItem, oRejectList, oCurrentController, productType, context, pathRejectCat;
        oCurrentController = this;

         //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oReasonListModel, oReasonListItem, oRouteModel;
             //Variables para dialogo.
        var dialogAdds, oForm, oCurrentController, tableFields, tableFieldVisibility, tableFieldDemandPopid, productID, dialogReason;


        path = evt.getSource().getBindingContext().getPath();
        context = evt.getSource().getBindingContext().getProperty(path);
        this.currentModelContext.setData(context);

         oInputBase = new sap.ui.mw.InputBase();
         oActionBase = new sap.ui.mw.ActionBase();
         oDisplayBase = new sap.ui.mw.DisplayBase();
         oLayoutBase = new sap.ui.mw.LayoutBase();
         oPopupBase = new sap.ui.mw.PopupBase();
         oListBase = new sap.ui.mw.ListBase();

        jQuery.sap.require("sap.m.MessageBox");
        sap.m.MessageBox.warning("¿Deseas rechazar la oportunidad?", {
            title: "¡Atención!",
            actions: ["SI", "NO"], 
            onClose: function(MessageValue) {
                if(MessageValue == "SI"){
                    console.log("Rechazo Oportunidad");
                     dialogReason = sap.ui.getCore().byId('appDialogRejection');
                     oReasonListModel = new sap.ui.model.json.JSONModel("data-map/catalogos/motivoRechazoSub.json");
                     oReasonListItem = new sap.m.StandardListItem({
                         title: "{text}",
                         type: "Active"
                     });

                      tableFields = [
                            "Descripción motivo de rechazo",
                        ];
                        tableFieldVisibility = [
                            true
                        ];
                        tableFieldDemandPopid = [
                            false
                        ];
                     dialogReason.addContent(oListBase.createTable("tblRejection", null, sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, null, oCurrentController.pressRejectReason, oCurrentController));
                     tblRejection = sap.ui.getCore().byId("tblRejection");
                     tblRejection.setModel(oReasonListModel);
              
                  
                     if (context.ProcessType === 'ZOPI') {
                            pathRejectCat = "/Individual";
                        } else if (context.ProcessType === 'ZOPG') {
                            pathRejectCat = "/Grupal";
                        }

                    tblRejection.bindAggregation("items", {
                        path: pathRejectCat,
                        factory: function(_id, _context) {
                            return oCurrentController.onLoadTableReject(_context);
                        },
                    });
                     dialogReason.addButton(oActionBase.createButton("", "Cancelar", "Emphasized", "sap-icon://sys-cancel", oCurrentController.cancelReasonRejected, oCurrentController));
                     dialogReason.open();
                }
            }
        });


        
    },
     cancelReasonRejected: function() {

         var oCurrentDialogRejected = sap.ui.getCore().byId("appDialogRejection");
         oCurrentDialogRejected.destroyContent();
         oCurrentDialogRejected.destroyButtons();
         oCurrentDialogRejected.close();

    },

    sendRejected: function(oEvent) {
        console.log("Selección realizda");
         },
    pressRejectReason: function(oEvent) {
        jQuery.sap.require("js.buffer.renovation.RenovationBuffer");
        jQuery.sap.require("js.helper.Dictionary");
        var oCurrentPath,tblRejection,oCurrentModel,currentItem,RejectIdCatalog, tblAppRenovations, oCurrentRenovation, oModelError, createSubsequence, selectDialogReject;
        var oDictionary, oRequest, oRenovationBuffer;

        //console.log("Selección de motivo de rechazo y envío a RFC");    
        //var currentView;
        oCurrentPath = oEvent.getParameters().listItem.getBindingContext().sPath;
        tblRejection = sap.ui.getCore().byId("tblRejection");
        oCurrentModel = tblRejection.getModel();
        currentItem = oCurrentModel.getProperty(oCurrentPath);
        tblAppRenovations = sap.ui.getCore().byId("tblAppRenovations");
        oCurrentRenovationModel = tblAppRenovations.getModel();
        currentItemRenovations = oCurrentRenovationModel.getProperty(path);

        /*if (Object.keys(context).length < 1) {
            sap.m.MessageToast.show("Tienes que seleccionar una oportunidad.", {
                duration: 4000
            });
        }*/
        //contactena info correspondiente al catálogo, GW realizará split
        RejectIdCatalog = currentItem.idCatalog.concat(currentItem.idCodeGroup, currentItem.idCRM);
sap.ui.getCore().AppContext.loader.show("Enviando motivo de rechazo");/*
        bdLoader = sap.ui.getCore().byId("bdLoaderRenovations");
        bdLoader.setText("Enviando motivo de rechazo");*/
        createSubsequence = {
            PreLoanRequestID: currentItemRenovations.PreLoanRequestID,
            LoanRequestIdCRM: currentItemRenovations.LoanRequestIdCRM,
            CollaboratorID: sap.ui.getCore().AppContext.Promotor,
            ServiceOfficeId: currentItemRenovations.ServiceOfficeId,
            LoanAssignedName: currentItemRenovations.LoanAssignedName,
            LoanRejectIdCatalog: RejectIdCatalog,
            IsRenovation: false
        };
        /*bdLoader.open();*/

        console.log(JSON.stringify(createSubsequence));
        promiseSubsequence = sap.ui.getCore().AppContext.myRest.create("PreLoanRequestSet", createSubsequence, true);
        promiseSubsequence.then(function(response) {
            sap.ui.getCore().AppContext.loader.close();
            console.log(response);

            oDictionary = new sap.ui.helper.Dictionary();
            oRenovationBuffer = new sap.ui.buffer.Renovation("renoDB");
            oRequest = {
                id: currentItemRenovations.PreLoanRequestID,
                loanRequestIdCRM: currentItemRenovations.LoanRequestIdCRM,
                accepted: false,
                requestMethod: oDictionary.oMethods.POST,
                //requestUrl: oDictionary.oDataTypes.Insurance,
                requestBodyId: createSubsequence.PreLoanRequestID,
                requestStatus: oDictionary.oRequestStatus.Initial
            };

            oRenovationBuffer.postRequest(oRequest)
                .then(function(oResult) {
                    console.log("Registro renovation guardado");
                    //Se valida si existe BussinessError en una s
                });

            //Envia mensaje en pantalla
            sap.m.MessageToast.show("Se rechazó la oportunidad.", {
                duration: 4000
            });

            //Cierra modal catálogo 
            selectDialogReject = sap.ui.getCore().byId("appDialogRejection");
            selectDialogReject.destroyContent().destroyButtons();
            selectDialogReject.close();

            //Elimina registro rechazado de la lista de candidatos próximos a renovar
            tblRenovations = sap.ui.getCore().byId("tblAppRenovations");
            currentModel = tblRenovations.getModel();
            currentData = currentModel.getData();
            aux = path.split("/");
            auxPath = aux[aux.length - 1];
            currentData.results.splice(auxPath, 1);
            currentModel.refresh();

        }).catch(function(error) {
            sap.ui.getCore().AppContext.loader.close();
            oModelError = new sap.ui.model.json.JSONModel();
            oModelError.setJSON(error);
            sap.m.MessageToast.show(oModelError.oData.error.message.value);
            console.log(error);
        });
    },
    // Fin OUB 08.08.2016 
});