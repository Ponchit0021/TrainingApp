sap.ui.controller("originacion.IndividualApplications", {

    formatJSONDate: function(_oDate) {
        if (_oDate) {
            if (_oDate != null) {

                if (typeof(_oDate) === "string") {
                    return _oDate;
                }
                return "/Date(" + _oDate.getTime() + ")/";
            }
        }
        return _oDate;
    },
    onMessageWarningDialogPress: function(oEvent) { 
        var currentController;
        currentController = this;
        jQuery.sap.require("sap.m.MessageBox");
        sap.m.MessageBox.warning("¿Estás seguro que deseas salir?", {
            title: "Alerta",
            actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],

            onClose: function(MessageValue) {

                if (MessageValue === sap.m.MessageBox.Action.OK) {
                    currentController.backToTiles();
                } else {
                    sap.ui.getCore().AppContext.Navigation.detail = true;
                }
            }
        });
    },
    _handleRouteMatched: function(evt) {
        var oGuaranteeTab, oItbIndividualApplication;
        if (evt.getParameters().name === "Applications") { /// on back
            oGuaranteeTab = sap.ui.getCore().byId("itIndividual3");
            if (oGuaranteeTab) {
                if (oGuaranteeTab.getContent().length > 0) {
                    oGuaranteeTab.destroyContent();
                }
            }
            oItbIndividualApplication = sap.ui.getCore().byId("itbIndividualApplication");
            oItbIndividualApplication.setSelectedKey("itIndividual1");
        }
    },

    backToTiles: function() {

        if (sap.ui.getCore().AppContext.flagAnnoucement) {
            sap.ui.getCore().AppContext.flagAnnoucement = false;
            this.getRouter().navTo("announcementList", {}, true);
        } else if(sap.ui.getCore().AppContext.flagPending) {
            sap.ui.getCore().AppContext.flagPending = false;
            this.getRouter().navTo("pendingList", {}, true);
        } else {
            window.history.go(-1);
        }

    },

    sendInformationToCore: function() {

        var sloanRequestIdMD, oLoanRequestModel,oLoanRequestSerializer;
        var oRequest;
        var oLoanRequestBuffer;
        var sRequestDescription;
       
        var oNotification;
        var oLoanRequestSync;

        

        /////// Retrieve model loanRequestIdMD

        jQuery.sap.require("js.buffer.loanRequest.LoanRequestBuffer");
        oLoanRequestModel = this.getView().getModel("oLoanRequestModel");
        sloanRequestIdMD = oLoanRequestModel.getProperty("/LoanRequestIdMD");

        /////// Post
        sRequestDescription = "Solicitud Individual";

        oRequest = {
            requestMethod: "POST", //::: POST deberia venir del diccionario
            requestUrl: "/LoanRequestSet",
            requestBodyId: sloanRequestIdMD,
            requestStatus: "Initial", ///::: Status deberia venir del diccionario
            requestConfirmed: false,
            /////// Este cambia dependiendo del tipo de solicitud :: Se utiliza para descripción de negocio
            requestDescription: sRequestDescription,
            // PouchDB id
            id: sloanRequestIdMD,
            productID: "C_IND_CI",
            NotificationID: sap.ui.getCore().AppContext.NotificationID
        };

        jQuery.sap.require("js.sync.loanRequest.LoanRequestSynchronizer");
        oLoanRequestSync = new sap.ui.sync.LoanRequest("dataDB", "syncDB");
        /////// 11/04/2016 EAMARCE :: Si hay notificationID, agregar la notificación a la lista de notificaciones con error
        if (sap.ui.getCore().AppContext.NotificationID) {

            if (sap.ui.getCore().AppContext.NotificationID !== "") {
                oNotification = {};
                oNotification.notificationID = sap.ui.getCore().AppContext.NotificationID;
                oLoanRequestSync.saveUpdateError(oNotification);
                sap.ui.getCore().AppContext.NotificationID = "";

            }
        }
        /////// 11/04/2016 EAMARCE :: Si hay notificationID, agregar la notificación a la lista de notificaciones con error

        oLoanRequestBuffer = new sap.ui.buffer.LoanRequest("syncDB");
        oLoanRequestBuffer.postRequest(oRequest);
        jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
        oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
        oLoanRequestSerializer.updateFlagEntitityInQueue(sloanRequestIdMD, true)
            .then(function(sloanRequestIdMD, oLoanRequestSync, result) {
                /////// Eliminar Business Error
                oLoanRequestSync.deleteBusinessError(sloanRequestIdMD).then(
                    function(result) {
                        //// Agregar id de notificación a notificaciones
                        ///  con error para que intente retry automático al iniciar la sincronización
                        this.closeSendToCore();
                        sap.m.MessageToast.show("Solicitud preparada para enviar a Integra.");
                        this.backToTiles();
                    }.bind(this)
                );
            }.bind(this, sloanRequestIdMD, oLoanRequestSync));

    },


    onInit: function() {
        var oRouter;
        jQuery.sap.require("js.base.NavigatorBase", "js.kapsel.Rest", "js.serialize.GeneralSerialize", "js.helper.Dictionary", "js.serialize.loanRequest.LoanRequestSerialize");

        oRouter = this.getRouter();
        oRouter.getRoute("IndividualApplications").attachMatched(this._onRouteMatched, this);

    },

    getRouter: function() {
        return sap.ui.core.UIComponent.getRouterFor(this);
    },

    
    _onRouteMatched: function(oEvent) {

        var  oGuaranteeTab, oItbIndividualApplication, oCreditTab, oProposalTab, isAnnouncement;
        var oArgs, oController, oGeneralSerialize, oLoanRequestSerialize, oDictionary, oParams;

        isAnnouncement = false;
        if (oEvent.getParameter("arguments").hasOwnProperty("?query")) {
            if (oEvent.getParameter("arguments").aplicationId !== "0") {
                isAnnouncement = oEvent.getParameter("arguments")["?query"].announcement ? true : false;
            }
        }

        oGeneralSerialize = new sap.ui.serialize.General("dataDB");
        oLoanRequestSerialize = new sap.ui.serialize.LoanRequest("dataDB");
        oDictionary = new sap.ui.helper.Dictionary();

        oController = this;
      
        oArgs = oEvent.getParameter("arguments");

        //Cambiar el parametro de entrada cuando nos confirme el equipo de odata
        oParams = {
            LoanRequestIdMD: oArgs.aplicationId
        };

        oGeneralSerialize.getEntityDetail(oDictionary.oDataRequest(oParams).getRequest("LoanRequestSet"), oArgs.aplicationId)
            .then(oLoanRequestSerialize.getModelReviewed.bind(oLoanRequestSerialize, "IndividualLoanRequestSet", oArgs.aplicationId, isAnnouncement, this.getRouter()))
            .then(oController.onInitializeLoanRequest.bind(this));

        if (oEvent.getParameters().name === "IndividualApplications") { /// on back
            oCreditTab = sap.ui.getCore().byId("itIndividual2");
            oGuaranteeTab = sap.ui.getCore().byId("itIndividual3");
            oProposalTab = sap.ui.getCore().byId("itIndividual4");
            if (oGuaranteeTab) {
                if (oGuaranteeTab.getContent().length > 0) {
                    oGuaranteeTab.destroyContent();
                }
            }
            if (oCreditTab) {
                if (oCreditTab.getContent().length > 0) {
                    oCreditTab.destroyContent();
                }
            }
            if (oProposalTab) {
                if (oProposalTab.getContent().length > 0) {
                    oProposalTab.destroyContent();
                }
            }
            oItbIndividualApplication = sap.ui.getCore().byId("itbIndividualApplication");
            oItbIndividualApplication.setSelectedKey("itIndividual1");
        }

    },

    onInitializeLoanRequest: function(_oDetail) {

        var oTmpModel, oView,
            bdLoader, loanRequest, dateId, semaphoreIcon, oSemaforo, oBtnGropuEnviarCore, oTmpModelCustomer;

        bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudIndividual");

        this.signatureOpen = false;
        sap.ui.getCore().AppContext.bSaveApprove = false;


        setTimeout(function() {

            var oIdentifierBase;
            jQuery.sap.require("js.base.IdentifierBase");
            oIdentifierBase = new sap.ui.mw.IdentifierBase();

            bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudIndividual");
            bdLoader.setText("Recuperando información de solicitante");
            bdLoader.open();

            this.sInitialLoanRequestIdCRM = "0"; /// id original de las propuestas
            this.bIsSignatureStillValid = false; /// La firma aun es valida
            this.bIsCreating = sap.ui.getCore().AppContext.bIsCreating;

            oBtnGropuEnviarCore = sap.ui.getCore().byId("btnNciEnviarALCore");
            oBtnGropuEnviarCore.setEnabled(false);
            this.bAlreadySavedOnPouch = false;
            oView = this.getView();

            if (this.bIsCreating) {

                this.bIsSignatureAdded = "";
                this.bIsEnabled = true;
                this.onFormEnable(true);
                sap.ui.getCore().AppContext.loanRequestIdMD = oIdentifierBase.createId();
                sap.ui.getCore().AppContext.bIsIndividualFormEnabled = true;
                sap.ui.getCore().AppContext.bHasIndividualLoanID = false;
                sap.ui.getCore().AppContext.MaxAmount = 0;

                if (sap.ui.getCore().byId("titleMonto")) {
                    sap.ui.getCore().byId("titleMonto").setText("Monto Solicitado");
                }

                if (sap.ui.getCore().byId("txtNciTipoDeCliente")) {
                    sap.ui.getCore().byId("txtNciTipoDeCliente").setValue("Nuevo");
                }

                if (sap.ui.getCore().byId("txtNciDireccion")) {
                    sap.ui.getCore().byId("txtNciDireccion").setValue("");
                }
                if (sap.ui.getCore().byId("txtNciNombreDelAval")) {
                    sap.ui.getCore().byId("txtNciNombreDelAval").setValue("");
                }

                if (sap.ui.getCore().byId("btnNciPorAprobar")) {
                    var btnAprroved = sap.ui.getCore().byId("btnNciPorAprobar");
                    btnAprroved.setEnabled(false);
                }


                if (sap.ui.getCore().byId("txtNciLiquidezMaxima")) {
                    sap.ui.getCore().byId("txtNciLiquidezMaxima").setEnabled(false);
                }

                oView.setModel(this.setMainValuesOfModel(_oDetail), "oLoanRequestModel");
                oView.getModel("oLoanRequestModel").refresh(true);
                this.sLoanRequestIdCRM = "";

                bdLoader.open();

                setTimeout(function() {

                    if (sap.ui.getCore().byId("iconSemaforoGuarantee")) {
                        var semaphoreIcon2 = sap.ui.getCore().byId("iconSemaforoGuarantee");
                        semaphoreIcon2.removeStyleClass('semaphoreLevelRed');
                        semaphoreIcon2.removeStyleClass('semaphoreLevelGreen');
                        semaphoreIcon2.addStyleClass('semaphoreInitial');
                    }
                    if (sap.ui.getCore().byId("iconSemaforoMain")) {
                        semaphoreIcon = sap.ui.getCore().byId("iconSemaforoMain");
                        semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                        semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                        bdLoader.close();
                    }

                }.bind(this), 0);
            }
            //si la solicitud ya existe
            else {
                if (_oDetail.getProperty("/LinkSet/results") && _oDetail.getProperty("/LinkSet/results").length >= 0) {
                    this.bIsSignatureAdded = "true";
                    this.bIsEnabled = true;
                    sap.ui.getCore().AppContext.bIsIndividualFormEnabled = true;

                    oView.setModel(_oDetail, "oLoanRequestModel");

                    /////// Determinar si esta habilitado:

                    if (oView.getModel("oLoanRequestModel").oData.IsApproved ||
                        oView.getModel("oLoanRequestModel").oData.GeneralLoanRequestData.StatusId === "E0009" ||
                        oView.getModel("oLoanRequestModel").oData.GeneralLoanRequestData.StatusId === "E0011" ||
                        oView.getModel("oLoanRequestModel").oData.GeneralLoanRequestData.StatusId === "E0013" ||
                        oView.getModel("oLoanRequestModel").oData.GeneralLoanRequestData.StatusId === "E0014" ||
                        oView.getModel("oLoanRequestModel").oData.GeneralLoanRequestData.StatusId === "E0017" ||
                        !oView.getModel("oLoanRequestModel").oData.LinkSet ||
                        !oView.getModel("oLoanRequestModel").oData.LinkSet.results.length > 0 ||
                        !oView.getModel("oLoanRequestModel").oData.LinkSet.results[0].Customer

                    ) {

                        this.bIsEnabled = false;
                        sap.ui.getCore().AppContext.bIsIndividualFormEnabled = false;
                        this.onFormEnable(false);
                        if (!oView.getModel("oLoanRequestModel").oData.LinkSet ||
                            !oView.getModel("oLoanRequestModel").oData.LinkSet.results.length > 0 ||
                            !oView.getModel("oLoanRequestModel").oData.LinkSet.results[0].Customer) {
                            sap.m.MessageToast.show("Solicitante no encontrado. Por favor sincronice e inténtelo de nuevo más tarde.");
                        }
                    } else {

                        if (oView.getModel("oLoanRequestModel").oData.IsEntityInQueue && oView.getModel("oLoanRequestModel").oData.IsEntityInQueue == true) {
                            this.bIsEnabled = false;
                            sap.ui.getCore().AppContext.bIsIndividualFormEnabled = false;
                            this.onFormEnable(false);
                        } else {
                            this.bIsEnabled = true;
                            sap.ui.getCore().AppContext.bIsIndividualFormEnabled = true;
                            this.onFormEnable(true);
                        }

                    }

                    bdLoader.open();
                    this.sLoanRequestIdCRM = oView.getModel("oLoanRequestModel").oData.LoanRequestIdCRM;


                    oTmpModel = oView.getModel("oLoanRequestModel");

                    if (oTmpModel) {
                        oTmpModel.setData(oView.getModel("oLoanRequestModel").oData);
                    } else {
                        oTmpModel = new sap.ui.model.json.JSONModel()
                        oTmpModel.setData(oView.getModel("oLoanRequestModel").oData);
                        oView.setModel(oTmpModel, "oLoanRequestModel");
                    }


                    if (oTmpModel.getProperty("/LoanRequestIdCRM") !== "") {

                        sap.ui.getCore().AppContext.bHasIndividualLoanID = true;


                    } else {

                        sap.ui.getCore().AppContext.bHasIndividualLoanID = false;




                    }



                    /// Deshabilitar liquidez máxima

                    if (sap.ui.getCore().byId("txtNciLiquidezMaxima")) {

                        if (sap.ui.getCore().AppContext.bIsIndividualFormEnabled && sap.ui.getCore().AppContext.bHasIndividualLoanID) {
                            sap.ui.getCore().byId("txtNciLiquidezMaxima").setEnabled(true);
                        } else {
                            sap.ui.getCore().byId("txtNciLiquidezMaxima").setEnabled(false);
                        }

                    }

                    if (sap.ui.getCore().byId("iconSemaforoMain")) {
                        semaphoreIcon = sap.ui.getCore().byId("iconSemaforoMain");
                        oSemaforo = oTmpModel.getProperty("/LinkSet/results/0/GeneralLoanData/SemaphoreResultFilters");


                        if (oSemaforo === 0) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === undefined) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === 1) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === 2) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreInitial');
                            semaphoreIcon.addStyleClass('semaphoreLevelGreen');

                        } else if (oSemaforo === 3) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.removeStyleClass('semaphoreInitial');
                            semaphoreIcon.addStyleClass('semaphoreLevelRed');

                        } else {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');
                        }



                    }

                    if (!oTmpModel.getProperty("/LinkGuarantorSet/results") ||
                        !oTmpModel.getProperty("/LinkGuarantorSet/results").length > 0) {
                        oTmpModel.setProperty("/LinkGuarantorSet", { results: [] });
                        oTmpModel.getProperty("/LinkGuarantorSet/results").push({
                            CustomerIdCRM: "",
                            LoanRequestIdCRM: "",
                            LoanRequestIdMD: sap.ui.getCore().AppContext.loanRequestIdMD,
                            CustomerIdMD: "",
                            GeneralLoanData: {
                                InsuranceAmount: 0,
                                ControlListsResult: 0,
                                RiskLevel: 0,
                                SavingsAmount: 0,
                                DispersionMediumId: "",
                                DispersionChannelId: "",
                                SemaphoreResultFilters: 0
                            },
                            Guarantor: {
                                CustomerIdCRM: "",
                                CollaboratorID: sap.ui.getCore().AppContext.Promotor,
                                CustomerIdMD: "",
                                BpName: {
                                    FirstName: "",
                                    MiddleName: "",
                                    LastName: "",
                                    SecondName: ""
                                },
                                BpMainData: {
                                    RegistrationDate: ""
                                },
                                AddressSet: {
                                    results: [{
                                        Latitude: 0,
                                        Longitude: 0,
                                        Place: {
                                            Street: "",
                                            OutsideNumber: "",
                                            InteriorNumber: "",
                                            Suburb: "",
                                            PostalCode: "",
                                            TownId: "",
                                            StateId: "",
                                            CountryId: ""
                                        }
                                    }]
                                },
                                PhoneSet: {
                                    results: [{
                                        PhoneNumber: ""
                                    }]
                                }
                            },
                            TotalIncomeAmountGuarantee: 0,
                            TotalOutcomeAmountGuarantee: 0,
                            GuarantorPaymentCapacity: 0
                        });
                    }

                    if (sap.ui.getCore().byId("iconSemaforoGuarantee")) {

                        var semaphoreIcon = sap.ui.getCore().byId("iconSemaforoGuarantee");
                        var oSemaforo = oTmpModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/SemaphoreResultFilters");

                        if (oSemaforo === 0) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === undefined) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === 1) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === 2) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreInitial');
                            semaphoreIcon.addStyleClass('semaphoreLevelGreen');

                        } else if (oSemaforo === 3) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.removeStyleClass('semaphoreInitial');
                            semaphoreIcon.addStyleClass('semaphoreLevelRed');

                        } else {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');
                        }

                    }

                    sap.ui.getCore().AppContext.MaxAmount = oTmpModel.getProperty("/LinkSet/results/0/IndividualLoanData/MaxRecurrentAmount");
                    if (!sap.ui.getCore().AppContext.MaxAmount) {
                        sap.ui.getCore().AppContext.MaxAmount = 0;
                    }
                    var oMaxAmountExpress = sap.ui.getCore().AppContext.MaxAmount;

                    if (sap.ui.getCore().byId("titleMonto")) {

                        if (oMaxAmountExpress === 0) {
                            sap.ui.getCore().byId("titleMonto").setText("Monto Solicitado");
                        } else {
                            sap.ui.getCore().byId("titleMonto").setText("Monto Propuesto Express");
                        }

                    }

                    sap.ui.getCore().AppContext.IndividualLoanGuaranteeRiskLevel = oTmpModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/RiskLevel");
                    this.onUpdateDispersion(oTmpModel.getProperty("/LinkSet/results/0/GeneralLoanData/DispersionChannelId"));
                    oTmpModel.refresh(true);
                    bdLoader.close();
                    
                }
            }
            bdLoader.close();
        }.bind(this), 500);
    },

    setMainValuesOfModel: function(_mainModel) {
        var oLoanRequestModel, oDate, oDateTomorrow;

        oDate = new Date().setHours(0, 0, 0, 0);
        oDate = new Date(oDate);
        oDateTomorrow = new Date().setHours(0, 0, 0, 0);
        oDateTomorrow = new Date(oDateTomorrow);
        oDateTomorrow.setDate(oDateTomorrow.getDate() + 1);

        //Completa valores iniciales en el modelo
        oLoanRequestModel = _mainModel;
        oLoanRequestModel.setProperty("/GeneralLoanRequestData/StartDate", oDate);
        oLoanRequestModel.setProperty("/GeneralLoanRequestData/FirstPaymentDate", oDateTomorrow);
        oLoanRequestModel.setProperty("/GeneralLoanRequestData/ExpenditureDate", oDateTomorrow);
        oLoanRequestModel.setProperty("/CollaboratorID", sap.ui.getCore().AppContext.Promotor);
        oLoanRequestModel.setProperty("/LoanRequestIdMD", sap.ui.getCore().AppContext.loanRequestIdMD);
        oLoanRequestModel.setProperty("/LinkSet/results/0/CollaboratorID", sap.ui.getCore().AppContext.Promotor);
        oLoanRequestModel.setProperty("/LinkSet/results/0/Customer", sap.ui.getCore().AppContext.oCurrentCustomer);
        oLoanRequestModel.setProperty("/LinkSet/results/0/CustomerIdCRM", sap.ui.getCore().AppContext.oCurrentCustomer.CustomerIdCRM);
        oLoanRequestModel.setProperty("/LinkSet/results/0/CustomerIdMD", sap.ui.getCore().AppContext.oCurrentCustomer.CustomerIdMD);
        oLoanRequestModel.setProperty("/LinkSet/results/0/LoanRequestIdMD", sap.ui.getCore().AppContext.loanRequestIdMD);
        oLoanRequestModel.setProperty("/LinkGuarantorSet/results/0/LoanRequestIdMD", sap.ui.getCore().AppContext.loanRequestIdMD);
        oLoanRequestModel.setProperty("/LinkGuarantorSet/results/0/Guarantor/CollaboratorID", sap.ui.getCore().AppContext.Promotor);

        oLoanRequestModel.refresh(true);

        return oLoanRequestModel;
    },

    getElectronicSignatureModel: function() {
        return {
            ImageIdSharepoint: "",
            TypeOfSignature: "",
            ImageBase64: "",
            NameRAndE: "",
            LoanRequestIdCRM: "",
            CustomerIdCRM: "",
            CollaboratorID: "",
            InsuranceID: "",
            CustomerIdMD: "",
            LoanRequestIdMD: "",
            InsuranceIdMD: "",
        };
    },
    //////////////// MODIFICADO
    signatures: function() {

        
        this.signatureOpen = true;
        //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase;
        //Variables para dialogo.
        var dialogSignature, oForm, currentController;

        currentController = this;

        //Se declaran objetos de Middleware de componentes SAPUI5
        oInputBase = new sap.ui.mw.InputBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        

        dialogSignature = sap.ui.getCore().byId('appDialogSignatureIndividual');
        dialogSignature.destroyContent();
        dialogSignature.destroyButtons();
        dialogSignature.destroyBeginButton();

        dialogSignature.destroyCustomHeader();
        dialogSignature.destroyEndButton();
        dialogSignature.destroySubHeader();
        //Formulario de dialogo
        oForm = oLayoutBase.createForm("idSignatureForm", true, 1, "");
        oForm.addContent(oInputBase.createCheckBox("chkBoxSignature", "Ruego y encargo", false, true, currentController.setExtraSignature, currentController));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oInputBase.createInputText("txtSignatureRuegoEncargo", "Text", "", "", false, true, "^[A-Za-zÑÁÉÍÓÚñáéíóú+][\\s[A-Za-zÑÁÉÍÓÚñáéíóú]+]*$"));
        oForm.addContent(oDisplayBase.createTitle("", "Solicitante"));
        oForm.addContent(oActionBase.createButton("", "Firma de Solicitante", "Default", "sap-icon://signature", this.openSignatureApplicant, this));
        oForm.addContent(oDisplayBase.createLabel("", "Prevención de lavado de dinero"));
        oForm.addContent(oActionBase.createButton("", "Visualizar", "Emphasized", "", currentController.showPrivacyNotice, currentController));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "Aviso de Privacidad", "Emphasized", "", currentController.readPDF, currentController));

        //Agregar Formulario a Dialogo
        dialogSignature.addContent(oForm);
        //Barra de botones
        dialogSignature.addButton(oActionBase.createButton("btnAceptarRandE", "Aceptar", "Emphasized", "sap-icon://accept", this.closeSignatures(), this));
        dialogSignature.addButton(oActionBase.createButton("btnCerrarRandE", "Cerrar", "Emphasized", "sap-icon://sys-cancel", this.closeSignatures(), this));


        dialogSignature.open();


    },

    showPrivacyNotice: function() {

        var dialogPrivacy, message;
        var oActionBase, oDisplayBase;
        //Se declaran objetos de Middleware de componentes SAPUI5
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
     

        dialogPrivacy = sap.ui.getCore().byId("privacyNoticeIndividual");

        message = oDisplayBase.createText("", "Declara el solicitante bajo protesta de decir verdad que:\n\n - Los datos capturados en la presente solicitud son correctos y se obtuvieron mediante entrevista personal con el Solicitante, autorizando a Banco Compartamos, S.A. Institución de Banca Múltiple, para que los compruebe a su entera satisfacción. \n\n  - Es la persona que se beneficiará en forma directa con los recursos que llegue a obtener en caso de que sea otorgado el Crédito que solicita, toda vez que actúa a nombre y por cuenta propia y no a nombre o por cuenta de un tercero.\n\n - Es de su conocimiento que proporcionar datos y documentos falsos, así como actuar a nombre de terceros sin estar facultado para ello constituye un delito.\n\n - Los recursos del Crédito solicitados en caso de que este sea autorizado, los destinará para fines lícitos. ");

        message.addStyleClass("sapPrivacyFormat");
        dialogPrivacy.addContent(message);
        dialogPrivacy.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", this.closePrivacy, this));

        dialogPrivacy.open();
    },
    closePrivacy: function() {
        var dialogPrivacy;

        dialogPrivacy = sap.ui.getCore().byId("privacyNoticeIndividual");

        dialogPrivacy.destroyContent();
        dialogPrivacy.destroyButtons();
        dialogPrivacy.close();
    },
    readPDF: function() {

        var dialogPrivacy, message, oActionBase, oDisplayBase ;
        //Se declaran objetos de Middleware de componentes SAPUI5
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        
        dialogPrivacy = sap.ui.getCore().byId("privacyNoticePDFIndividual");

        message = oDisplayBase.createReaderPDF("../www/js/vendor/pdfjs/web/viewer.html", "sapReaderPDF")

        dialogPrivacy.addStyleClass("dialogStyle");
        message.addStyleClass("sapPrivacyFormat");
        dialogPrivacy.addContent(message);
        dialogPrivacy.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", this.closePrivacyPDF, this));

        dialogPrivacy.open();
    },

    closePrivacyPDF: function() {
        var dialogPrivacy;

        dialogPrivacy = sap.ui.getCore().byId("privacyNoticePDFIndividual");

        dialogPrivacy.destroyContent();
        dialogPrivacy.destroyButtons();
        dialogPrivacy.close();
    },

    openSignaturePromoter: function() {
        this.signatureCapture("idSignaturePromoter");
    },
    openSignatureApplicant: function() {
        this.signatureCapture("idSignatureApplicant");
    },
    closeSignatures: function() {

        return function(evt) {
            //validaciones ruego y encargo
            var txtSignature = sap.ui.getCore().byId("txtSignatureRuegoEncargo");
            var chkSignature = sap.ui.getCore().byId("chkBoxSignature");
            var selectedChk = chkSignature.getSelected();
            var signatureDialog = sap.ui.getCore().byId("appDialogSignatureIndividual");
            var oElectronicSignature;
            var btnPressed = evt.getSource().sId;

            if (btnPressed === "btnCerrarRandE") {
                this.signatureOpen = false;
                signatureDialog.destroyContent();
                signatureDialog.destroyButtons();
                signatureDialog.destroyBeginButton();
                signatureDialog.destroyCustomHeader();
                signatureDialog.destroyEndButton();
                signatureDialog.destroySubHeader();
                signatureDialog.close();
            } else {
                if (selectedChk) {
                    if (txtSignature.getValue() !== "") {
                        //se guarda la firma ruego y encargo
                        var oLoanRequestModel = sap.ui.getCore().getModel("loanRequestModel"); // Modulo de Firmas, por el momento no se modifica nada.
                        var oElectronicSignatureSet = oLoanRequestModel.getProperty("/ElectronicSignatureSet");

                        if (oElectronicSignatureSet) {
                            if (oElectronicSignatureSet.results) {
                                if (oElectronicSignatureSet.results.length === 0) {
                                    if (oElectronicSignature) {
                                        oElectronicSignature.NameRAndE = txtSignature.getValue();
                                        oLoanRequestModel.setProperty("/ElectronicSignatureSet", oElectronicSignatureSet);
                                    } else {
                                        sap.m.MessageToast.show("Se debe capturar firma");
                                    }
                                } else {
                                   
                                    this.signatureOpen = false;
                                    signatureDialog.destroyContent();
                                    signatureDialog.destroyButtons();
                                    signatureDialog.destroyBeginButton();
                                    signatureDialog.destroyCustomHeader();
                                    signatureDialog.destroyEndButton();
                                    signatureDialog.destroySubHeader();
                                    signatureDialog.close();
                                }
                            }
                        }

                    } else {
                        sap.m.MessageToast.show("Se debe capturar firma ruego y encargo");
                    }
                } else {
                    this.signatureOpen = false;
                    signatureDialog.destroyContent();
                    signatureDialog.destroyButtons();
                    signatureDialog.destroyBeginButton();
                    signatureDialog.destroyCustomHeader();
                    signatureDialog.destroyEndButton();
                    signatureDialog.destroySubHeader();
                    signatureDialog.close();
                }
            }


        }.bind(this);

    },
    signatureCapture: function(_id) {
        jQuery.sap.require("js.base.SignatureBase");

        var signatureDialog = sap.ui.getCore().byId("appDialogSignatureCaptureIndividual");
        signatureDialog.setShowHeader(false);

        //Middleware de componentes SAPUI5
        var oActionBase, oDisplayBase, oSignatureBase;

        //Se declaran objetos de Middleware de componentes SAPUI5
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oSignatureBase = new sap.ui.mw.SignatureBase();

        signatureDialog.addContent(oDisplayBase.createSignatureCanvas(_id, "sapSignatureCanvas"));

        signatureDialog.addButton(oActionBase.createButton("", "", "Emphasized", "sap-icon://save", this.saveSignature(_id), this));
        signatureDialog.addButton(oActionBase.createButton("", "", "Emphasized", "sap-icon://eraser", this.clearSignature, this));
        signatureDialog.addButton(oActionBase.createButton("", "", "Emphasized", "sap-icon://sys-cancel", this.cancelSignature, this));

        oSignatureBase._id = _id;
        signatureDialog.attachAfterOpen(function() {
            oSignatureBase.signatureCapture();
        });

        signatureDialog.open();
    },
    saveSignature: function(_id) {
        screen.unlockOrientation();
        var oId, oCurrentController;
        oId;
        oId = _id;
        oCurrentController = this;

        return function() {

            var images, oTxtNciIdCliente;
            var oCurrentDialog;
            var images, oLoanRequestModel, oElectronicSignatureSet, i, bAlreadyAggregated, oElectronicSignature;
            var sCustomerIdMD, sBPIdCRM;
            

            oLoanRequestModel = sap.ui.getCore().getModel("loanRequestModel"); // Modulo de Firmas, por el momento no se modifica nada.
            sCustomerIdMD = oLoanRequestModel.getProperty("/LinkSet/results/0/CustomerIdMD");


            bAlreadyAggregated = false;
            oElectronicSignature = this.getElectronicSignatureModel();


            oCurrentDialog = sap.ui.getCore().byId("appDialogSignatureCaptureIndividual");
            oTxtNciIdCliente = sap.ui.getCore().byId("txtNciIdCliente");
            sBPIdCRM = oTxtNciIdCliente.getValue();

            ///// Buscar si existe firma en el modelo
            oElectronicSignatureSet = oLoanRequestModel.getProperty("/ElectronicSignatureSet");

            images = oSignatureBase.signatureSave();

            if (oElectronicSignatureSet) {

                if (oElectronicSignatureSet.results) {

                    if (oElectronicSignatureSet.results.length > 0) {
                        /////// Ya hay firma, buscar y reemplazar
                        for (i = 0; i < oElectronicSignatureSet.results.length; i++) {
                            if (oElectronicSignatureSet.results[i].TypeOfSignature === oSignatureBase._id && oElectronicSignatureSet.results[i].CustomerIdCRM === sBPIdCRM) {
                                /// Hay coincidencia, reemplazar
                                oElectronicSignature.ImageIdSharepoint = "";
                                oElectronicSignature.TypeOfSignature = oSignatureBase._id;
                                oElectronicSignature.ImageBase64 = images[0].split("data:image/png;base64,")[1];
                                oElectronicSignature.NameRAndE = sap.ui.getCore().byId("txtSignatureRuegoEncargo").getValue();
                                oElectronicSignature.LoanRequestIdCRM = this.sLoanRequestIdCRM;
                                oElectronicSignature.CustomerIdCRM = sBPIdCRM;
                                oElectronicSignature.CollaboratorID = sap.ui.getCore().AppContext.Promotor;
                                oElectronicSignature.InsuranceID = "";
                                oElectronicSignature.CustomerIdMD = sCustomerIdMD;
                                oElectronicSignature.LoanRequestIdMD = sap.ui.getCore().AppContext.loanRequestIdMD;
                                oElectronicSignature.InsuranceIdMD = "";
                                oElectronicSignatureSet.results[i] = oElectronicSignature;

                                oLoanRequestModel.setProperty("/ElectronicSignatureSet", oElectronicSignatureSet);

                                bAlreadyAggregated = true;
                            }
                        }
                        ////// No hay firma, agregar
                    }

                }

            } else {

                oElectronicSignatureSet = {};
                oElectronicSignatureSet.results = new Array();

            }

            if (!bAlreadyAggregated) {
                /// Si no se ha agregado, agregar
                if (!oElectronicSignatureSet.results) {
                    oElectronicSignatureSet.results = new Array();
                }

                oElectronicSignature.ImageIdSharepoint = "";
                oElectronicSignature.TypeOfSignature = oSignatureBase._id;
                oElectronicSignature.ImageBase64 = images[0].split("data:image/png;base64,")[1];
                oElectronicSignature.NameRAndE = sap.ui.getCore().byId("txtSignatureRuegoEncargo").getValue();
                oElectronicSignature.LoanRequestIdCRM = this.sLoanRequestIdCRM;
                oElectronicSignature.CustomerIdCRM = sBPIdCRM;
                oElectronicSignature.CollaboratorID = sap.ui.getCore().AppContext.Promotor;
                oElectronicSignature.InsuranceID = "";
                oElectronicSignature.CustomerIdMD = sCustomerIdMD;
                oElectronicSignature.LoanRequestIdMD = sap.ui.getCore().AppContext.loanRequestIdMD;
                oElectronicSignature.InsuranceIdMD = "";
                oElectronicSignatureSet.results.push(oElectronicSignature);

                oLoanRequestModel.setProperty("/ElectronicSignatureSet", oElectronicSignatureSet);


            }

            //Se destruye el contenido del dialogo y se cierra dialogo
            oSignatureBase = null;
            oCurrentDialog.destroyContent();
            oCurrentDialog.destroyButtons();
            oCurrentDialog.close();
            this.signatureOpen = false;
            oCurrentController.cancelSignature();

            if (oId === "idSignatureApplicant") /// La firma del solicitante es valida

                this.bIsSignatureStillValid = true;

            this.bIsSignatureAdded = sap.ui.getCore().AppContext.sCustomerIdMD;

        }



    },
    clearSignature: function() {
        oSignatureBase.signatureClear();
    },
    cancelSignature: function() {
        screen.unlockOrientation();
        var oCurrentDialog = sap.ui.getCore().byId("appDialogSignatureCaptureIndividual");
        //Se destruye el contenido del dialogo y se cierra dialogo
        oSignatureBase = null;
        oCurrentDialog.destroyContent();
        oCurrentDialog.destroyButtons();
        this.signatureOpen = false;
        oCurrentDialog.close();
    },
    onFormEnable: function(_bEnable, itf) {

        var oTabs, oTab;

        if (_bEnable) {

            sap.ui.getCore().byId("btnNciGuardar").setEnabled(true);
            sap.ui.getCore().byId("btnCameraCI").setEnabled(true);

            if (this.bAlreadySavedOnPouch) {

                sap.ui.getCore().byId("btnNciEnviarALCore").setEnabled(true);

            } else {


                sap.ui.getCore().byId("btnNciEnviarALCore").setEnabled(false);

            }



        } else {
            sap.ui.getCore().byId("btnNciGuardar").setEnabled(false);
            sap.ui.getCore().byId("btnNciEnviarALCore").setEnabled(false);
            sap.ui.getCore().byId("btnCameraCI").setEnabled(false);
        }



        if (itf) {
            oTabs = [itf];
        } else {

            oTabs = ["itIndividual1", "itIndividual2", "itIndividual3", "itIndividual4"];
        }

        for (var j = 0; j < oTabs.length; j++) {
            oTab = sap.ui.getCore().byId(oTabs[j]).getContent();
            if (oTab.length > 0) {
                if (oTab[0]._aElements) {
                    if (oTab[0]._aElements.length > 0) {
                        for (var i = 0; i < oTab[0]._aElements.length; i++) {
                            if (oTab[0]._aElements[i].setEnabled) {
                                //////// Habilitar todos menos combo tipo de producto, botón Por aprobar, y botón Propuesta
                                if (_bEnable === false || (_bEnable === true && oTab[0]._aElements[i].sId !== "selectNciTipoDeProducto" && oTab[0]._aElements[i].sId !== "btnNciPorAprobar" && oTab[0]._aElements[i].sId !== "btnNciPropuesta")) {
                                    oTab[0]._aElements[i].setEnabled(_bEnable); /// Disable all components
                                }
                            };
                        }
                    }
                }
            }
        }
    },
    onChangingExpress: function(_oLocalRegularExpression) {
        var  oLocalRegularExpression;
        oLocalRegularExpression = _oLocalRegularExpression;
        return function(oEvent) {
            if (_oLocalRegularExpression) {
                oEvent.getSource().setValueState(validateExprReg(oEvent.getSource().getProperty('value'), oLocalRegularExpression));
            }

            function validateExprReg(value, expReg) {
                if (value.toString().match(expReg)) {

                    if (sap.ui.getCore().AppContext.MaxAmount !== 0) {
                        if (parseInt(value) >= sap.ui.getCore().AppContext.MaxAmount) {
                            sap.ui.getCore().byId("titleMonto").setText("Monto Solicitado");
                        } else {
                            sap.ui.getCore().byId("titleMonto").setText("Monto Propuesto Express");
                        }
                    }

                    return 'Success';
                } else {
                    return 'Error';
                }
            };
        }

    },
    onChanging: function(_oLocalRegularExpression) {
        var  oLocalRegularExpression;

        oLocalRegularExpression = _oLocalRegularExpression;
        return function(oEvent) {
            if (_oLocalRegularExpression) {
                oEvent.getSource().setValueState(validateExprReg(oEvent.getSource().getProperty('value'), oLocalRegularExpression));
            }

            function validateExprReg(value, expReg) {
                if (value.toString().match(expReg)) {
                    return 'Success';
                } else {
                    return 'Error';
                }
            };
        }
    },
    onDateChanging: function(oEvent) {


        try {
            var oValue;
            oValue = oEvent.getSource().getProperty('value');
            oValue = oValue.replace("T12:00:00", "");
            oValue = oValue.replace("-", "/");
            oValue = oValue.replace("-", "/");

            if (oValue.toString().match("^((([0-9]){4})(\/)([0-9]){2}(\/)([0-9]){2})$")) {
                var dat = new Date(oValue);
                if (isValidDate(dat)) {
                    oEvent.getSource().setValueState('Success');
                } else {
                    oEvent.getSource().setValueState('Error');
                }
            } else {
                oEvent.getSource().setValueState('Error');
            }
        } catch (err) {
            oEvent.getSource().setValueState('Error');
        }

        function isValidDate(d) {
            if (Object.prototype.toString.call(d) !== "[object Date]")
                return false;
            return !isNaN(d.getTime());
        }
    },

    toStatePorAprobar: function() {

        //////// *    Todos los campos obligatorios deben estar capturados
        var sMessage, bIsValid, oLoanRequestModel, sMessageNotValidData, bValidData, oController, oView;

        /* Generales */
        var oTxtNciIdCliente, oTxtNciNombreCompleto, oSelectNciTipoDeProducto,
            oTxtNciCiclo, oTxtNciEstatusDeLaOportunidad, oTxtNciListasDeControl,
            oTxtNciNivelDeRiesgo, oSelectNciCanalDispersor, oSelectNciMedioDeDispersion;

        /* Aval */
        var oTxtNciIdAval, oTxtNciNombreDelAval, oTxtNciTelefono, oTxtNciDireccion;

        /* Credito */
        var oSelectNciTiempoEnLaViviendaAnios, oSelectNciTiempoEnLaViviendaMeses, oSelectNciTiempoEnElLocalAnios, oSelectNciTiempoEnElLocalMeses, oDtpNciDateFechaDePrimerPago, oTxtNciDateFechaDeDesembolso;

        /*Propuesta*/
        var oTxtNciMontoPropuesto, oTxtNciFrecuenciaPropuesta, oTxtNciCuotaPropuesta, oTxtNciPlazoPropuesto;

        /* Se valida solo el estado */
        var oTxtNciMontoSolicitado, oTxtIngresosMensuales, oTxtGastosMensuales,
            oTxtCuotaQuePuedePagar, oTxtNciLiquidezMaxima;

        /////// MODIFICADO
        var oModelImages,bIsIndivWBusiness;
        /////// MODIFICADO

        oController = this;
        oView = oController.getView();


        bIsValid = true;

        /* Generales */
        oTxtNciIdCliente = sap.ui.getCore().byId("txtNciIdCliente");
        oTxtNciNombreCompleto = sap.ui.getCore().byId("txtNciNombreCompleto");
        oSelectNciTipoDeProducto = sap.ui.getCore().byId("selectNciTipoDeProducto");
        oTxtNciCiclo = sap.ui.getCore().byId("txtNciCiclo");
        oTxtNciEstatusDeLaOportunidad = sap.ui.getCore().byId("txtNciEstatusDeLaOportunidad");
        oTxtNciListasDeControl = sap.ui.getCore().byId("txtNciListasDeControl");
        oTxtNciNivelDeRiesgo = sap.ui.getCore().byId("txtNciNivelDeRiesgo");
        oSelectNciCanalDispersor = sap.ui.getCore().byId("selectNciCanalDispersor");
        oSelectNciMedioDeDispersion = sap.ui.getCore().byId("selectNciMedioDeDispersion");

        /* Aval */
        oTxtNciIdAval = sap.ui.getCore().byId("txtNciIdAval");
        oTxtNciNombreDelAval = sap.ui.getCore().byId("txtNciNombreDelAval");
        oTxtNciTelefono = sap.ui.getCore().byId("txtNciTelefono");
        oTxtNciDireccion = sap.ui.getCore().byId("txtNciDireccion");

        /* Credito */
        oSelectNciTiempoEnLaViviendaAnios = sap.ui.getCore().byId("selectNciTiempoEnLaViviendaAnios");
        oSelectNciTiempoEnLaViviendaMeses = sap.ui.getCore().byId("selectNciTiempoEnLaViviendaMeses");
        oSelectNciTiempoEnElLocalAnios = sap.ui.getCore().byId("selectNciTiempoEnElLocalAnios");
        oSelectNciTiempoEnElLocalMeses = sap.ui.getCore().byId("selectNciTiempoEnElLocalMeses");
        oDtpNciDateFechaDePrimerPago = sap.ui.getCore().byId("dtpNciDateFechaDePrimerPago");
        oTxtNciDateFechaDeDesembolso = sap.ui.getCore().byId("txtNciDateFechaDeDesembolso");

        /*Propuesta*/
        oTxtNciMontoPropuesto = sap.ui.getCore().byId("txtNciMontoPropuesto");
        oTxtNciFrecuenciaPropuesta = sap.ui.getCore().byId("txtNciFrecuenciaPropuesta");
        oTxtNciCuotaPropuesta = sap.ui.getCore().byId("txtNciCuotaPropuesta");
        oTxtNciPlazoPropuesto = sap.ui.getCore().byId("txtNciPlazoPropuesto");

        /* Se valida solo el estado */
        oTxtNciMontoSolicitado = sap.ui.getCore().byId("txtNciMontoSolicitado");
        oTxtIngresosMensuales = sap.ui.getCore().byId("txtIngresosMensuales");
        oTxtGastosMensuales = sap.ui.getCore().byId("txtGastosMensuales");
       
        oTxtCuotaQuePuedePagar = sap.ui.getCore().byId("txtCuotaQuePuedePagar");
        oTxtNciLiquidezMaxima = sap.ui.getCore().byId("txtNciLiquidezMaxima");

        if (!(oTxtNciIdCliente && oTxtNciNombreCompleto && oSelectNciTipoDeProducto && oTxtNciCiclo && oTxtNciEstatusDeLaOportunidad && oTxtNciListasDeControl && oTxtNciNivelDeRiesgo && oSelectNciCanalDispersor && oSelectNciMedioDeDispersion && oTxtNciIdAval && oTxtNciNombreDelAval && oTxtNciTelefono && oTxtNciDireccion && oSelectNciTiempoEnLaViviendaAnios && oSelectNciTiempoEnLaViviendaMeses && oSelectNciTiempoEnElLocalAnios && oSelectNciTiempoEnElLocalMeses && oDtpNciDateFechaDePrimerPago && oTxtNciDateFechaDeDesembolso && oTxtNciMontoPropuesto && oTxtNciFrecuenciaPropuesta && oTxtNciCuotaPropuesta && oTxtNciPlazoPropuesto)) { /// No todos los campos han sido definidos (cargados)
            sap.m.MessageToast.show("Por favor verifique que todas las pestañas de la pantalla se hayan cargado correctamente");
            return false;
        }

        sMessage = "Por favor complete y valide: ";

        if (oTxtNciIdCliente.getValue() === "" || oTxtNciIdCliente.getValueState() == sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Id del Cliente \n";
            bIsValid = false;
        }
        if (oTxtNciNombreCompleto.getValue() === "" || oTxtNciNombreCompleto.getValueState() == sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Nombre completo \n";
            bIsValid = false;
        }
        if (oSelectNciTipoDeProducto.getSelectedKey() === "") {
            sMessage = sMessage + " Tipo de producto \n";
            bIsValid = false;
        }
        if (oTxtNciCiclo.getValue() === "" || oTxtNciCiclo.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Ciclo \n";
            bIsValid = false;
        }
        if (oTxtNciEstatusDeLaOportunidad.getValue() === "" || oTxtNciEstatusDeLaOportunidad.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Estatus de la oportunidad \n";
            bIsValid = false;
        }
        if (oTxtNciNivelDeRiesgo.getValue() === "" || oTxtNciNivelDeRiesgo.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Nivel de riesgo \n";
            bIsValid = false;
        }
        if (oSelectNciCanalDispersor.getSelectedKey() === "") {
            sMessage = sMessage + " Canal dispersor \n";
            bIsValid = false;
        }
        if (oSelectNciMedioDeDispersion.getSelectedKey() === "") {
            sMessage = sMessage + " Medio de dispersion \n";
            bIsValid = false;
        }

        /* Aval */
        if (oTxtNciIdAval.getValue() === "") {
            sMessage = sMessage + " Id Aval \n";
            bIsValid = false;
        }
        if (oTxtNciNombreDelAval.getValue() === "") {
            sMessage = sMessage + " Nombre del Aval \n";
            bIsValid = false;
        }
        if (oTxtNciTelefono.getValue() === "") {
            sMessage = sMessage + " Telefono del Aval \n";
            bIsValid = false;
        }
        if (oTxtNciDireccion.getValue() === "") {
            sMessage = sMessage + " Dirección del Aval \n";
            bIsValid = false;
        }

        /* Credito */
        if (oSelectNciTiempoEnLaViviendaAnios.getSelectedKey() === "") {
            sMessage = sMessage + " Tiempo en la vivienda en años \n";
            bIsValid = false;
        }
        if (oSelectNciTiempoEnLaViviendaMeses.getSelectedKey() === "") {
            sMessage = sMessage + " Tiempo en la vivienda en meses \n";
            bIsValid = false;
        }
        if (oSelectNciTiempoEnElLocalAnios.getSelectedKey() === "") {
            sMessage = sMessage + " Tiempo en el local en años \n";
            bIsValid = false;
        }
        if (oSelectNciTiempoEnElLocalMeses.getSelectedKey() === "") {
            sMessage = sMessage + " Tiempo en el local en meses \n";
            bIsValid = false;
        }
        if (oDtpNciDateFechaDePrimerPago.getDateValue() === null) {
            sMessage = sMessage + " Fecha de primer pago \n";
            bIsValid = false;
        }
        if (oTxtNciDateFechaDeDesembolso.getDateValue() === null) {
            sMessage = sMessage + " Fecha de desembolso \n";
            bIsValid = false;
        }

        /*Propuesta*/

        if (oTxtNciMontoPropuesto.getValue() === "" || oTxtNciMontoPropuesto.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Monto propuesto \n";
            bIsValid = false;
        }
        if (oTxtNciFrecuenciaPropuesta.getValue() === "" || oTxtNciFrecuenciaPropuesta.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Frecuencia propuesta \n";
            bIsValid = false;
        }
        if (oTxtNciCuotaPropuesta.getValue() === "" || oTxtNciCuotaPropuesta.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Cuota propuesta \n";
            bIsValid = false;
        }
        if (oTxtNciPlazoPropuesto.getValue() === "" || oTxtNciPlazoPropuesto.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Plazo propuesto \n";
            bIsValid = false;
        }

        //   Se tienen los datos complementarios del BP ??

      
        oLoanRequestModel = oView.getModel("oLoanRequestModel");
        bIsIndivWBusiness = oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/IsIndivWBusiness");
        sMessageNotValidData = "Al revisar los datos complemetarios del cliente no fue posible validar: ";

        bValidData = true;

        if (bIsIndivWBusiness) { // Es persona fisica con actividad empresarial ?
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/Rfc") === "") {
                sMessageNotValidData = sMessageNotValidData + " RFC \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/Homoclave") === "") {
                sMessageNotValidData = sMessageNotValidData + " Homoclave \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/FielNumber") === "") {
                sMessageNotValidData = sMessageNotValidData + " clave FIEL \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/Curp") === "") {
                sMessageNotValidData = sMessageNotValidData + " CURP \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/Dependents") === "") {
                sMessageNotValidData = sMessageNotValidData + " Dependientes \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/JobId") === "") {
                sMessageNotValidData = sMessageNotValidData + " Ocupación \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/Email") === "") {
                sMessageNotValidData = sMessageNotValidData + " Email \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpBasicData/GiroId") === "") {
                sMessageNotValidData = sMessageNotValidData + " Giro \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpBasicData/IndustryId") === "") {
                sMessageNotValidData = sMessageNotValidData + " Industria \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/EconomicActivityId") === "") {
                sMessageNotValidData = sMessageNotValidData + " Actividad economica \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/TimeInTheActivityId") === "") {
                sMessageNotValidData = sMessageNotValidData + " Tiempo en la actividad \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/HowMuchBusinessId") === "") {
                sMessageNotValidData = sMessageNotValidData + " Aportación del negocio \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/OtherSourceId") === "") {
                sMessageNotValidData = sMessageNotValidData + " Otra fuente de ingreso \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/TimeInTheBusiness") === "") {
                sMessageNotValidData = sMessageNotValidData + " Tiempo en el negocio actual \n";
                bValidData = false;
            }
           
        } else {

            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/Curp") === "") {
                sMessageNotValidData = sMessageNotValidData + " CURP \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/Dependents") === "") {
                sMessageNotValidData = sMessageNotValidData + " Dependientes \n";
                bValidData = false;
            }
            if (oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/BpComplementaryData/JobId") === "") {
                sMessageNotValidData = sMessageNotValidData + " Ocupación \n";
                bValidData = false;
            }
        }

        /* Se valida solo el estado */
        if (oTxtNciMontoSolicitado.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Monto Solicitado \n";
            bIsValid = false;
        }
        if (oTxtIngresosMensuales.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Ingresos mensuales \n";
            bIsValid = false;
        }
        if (oTxtGastosMensuales.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Gastos mensuales \n";
            bIsValid = false;
        }

        if (oTxtCuotaQuePuedePagar.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Cuota que puede pagar \n";
            bIsValid = false;
        }
        if (oTxtNciLiquidezMaxima.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Liquidez Maxima \n";
            bIsValid = false;
        }

        if (!bValidData) {
            sap.m.MessageToast.show(sMessageNotValidData);
            return false;
        }

        //   Se tienen los documentos de BP Aceptados ??

        ////////// MODIFICADO
        oModelImages = oLoanRequestModel.getProperty("/LinkSet/results/0/Customer/ImageSet/results");

        if (oModelImages) {

            for (var i = 0; i < oModelImages.length; i++) { /// Recorrer y validar los documentos

                if (oModelImages[i].documentStatusText !== "Validado Aceptado") {

                    sap.m.MessageToast.show("El documento : " + oModelImages[i].documentId + "  del solicitante no tiene status de 'Validado' y 'Aceptado'");
                    return false;
                }

            }
        } else {

            sap.m.MessageToast.show("No fue posible recuperar los documentos del solicitante para su validación");
            return false;

        }

        //////////////////MODIFICADO

        //   Se cuenta con las firmas correspondientes
        if (!this.bIsSignatureStillValid) {
            sMessage = sMessage + " Firmas \n";
            bIsValid = false;
        }

        if (bIsValid) {
            sMessage = "Enviando al core para estatus 'Por aprobar'";
            this.onFormEnable(false);
        } else {
            sMessage = sMessage + " para poder pasar el estatus a 'Por aprobar'";
        }

        sap.m.MessageToast.show(sMessage);
        return bIsValid;
    },
    proposalFieldValidation: function() {

        ///// Validaciones para poder dispara la propuesta:
        /// 1. Liquidez  2. Monto solicitado 3. frecuencia, 4. nivel de rsgo, 5. tipo de cliente
        ///

        var oTxtNciLiquidezMaxima, oTxtNciMontoSolicitado, oSelectNciFrecuenciaSolicitada,
            oTxtNciNivelDeRiesgo, oTxtNciTipoDeCliente;

        var bIsValid, sMessage;

        oTxtNciLiquidezMaxima = sap.ui.getCore().byId("txtNciLiquidezMaxima");
        oTxtNciMontoSolicitado = sap.ui.getCore().byId("txtNciMontoSolicitado");
        oSelectNciFrecuenciaSolicitada = sap.ui.getCore().byId("selectNciFrecuenciaSolicitada");
        oTxtNciNivelDeRiesgo = sap.ui.getCore().byId("txtNciNivelDeRiesgo");
        oTxtNciTipoDeCliente = sap.ui.getCore().byId("txtNciTipoDeCliente");



        if (!(oTxtNciLiquidezMaxima && oTxtNciMontoSolicitado && oSelectNciFrecuenciaSolicitada && oTxtNciNivelDeRiesgo && oTxtNciTipoDeCliente)) {

            sap.m.MessageToast.show("Por favor verifique que todas las pestañas de la pantalla se hayan cargado correctamente");
            return false;

        }

        bIsValid = true;

        sMessage = "Para enviar la propuesta de crédito por favor complete y valide: ";
        if (oTxtNciLiquidezMaxima.getValue() === "" || oTxtNciLiquidezMaxima.getValue() === "0" || oTxtNciLiquidezMaxima.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Liquidez Máxima \n";
            bIsValid = false;
        }


        if (oTxtNciMontoSolicitado.getValue() === "" || oTxtNciMontoSolicitado.getValue() === "0" || oTxtNciMontoSolicitado.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Monto solicitado \n";
            bIsValid = false;
        }

        if (oSelectNciFrecuenciaSolicitada.getSelectedKey() === "") {
            sMessage = sMessage + " Frecuencia solicitada \n";
            bIsValid = false;
        }

        if (oTxtNciNivelDeRiesgo.getValue() === "" || oTxtNciNivelDeRiesgo.getValue() === "0" || oTxtNciNivelDeRiesgo.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Nivel de Riesgo \n";
            bIsValid = false;
        }


        if (oTxtNciTipoDeCliente.getValue() === "" || oTxtNciTipoDeCliente.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Tipo de cliente \n";
            bIsValid = false;
        }



        if (bIsValid) {
            //////// Enviar a propuesta de credito
            return true;

        } else {

            sap.m.MessageToast.show(sMessage);
            return false;
        }
    },
    proposalAmountValidation: function(montoSolcitado, nivelRiesgo, tipoCliente) {
        var bIsValid, sMessage, bIsValid = true;
        //// Risk level ???  1 = Muy bajo, 2 = bajo, 3 = Medio, 4= Alto, 5 = Muy Alto
        /// Tipo de cliente ??? "Nuevo"  / != "Nuevo"
        if (tipoCliente === "Nuevo") {
            switch (nivelRiesgo) {
                case 'Muy Bajo': // muy bajo
                    if (montoSolcitado > 200000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 200,000 MXN";
                    }
                    break;
                case 'Bajo': // bajo
                    if (montoSolcitado > 70000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 70,000 MXN";
                    }
                    break;
                case 'Medio': // medio
                    if (montoSolcitado > 50000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 50,000 MXN";
                    }
                    break;
                case 'Alto': // alto
                case 'Muy Alto': // muy alto
                    if (montoSolcitado > 25000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 25,000 MXN";
                    }
                    break;
                default:
                    bIsValid = false;
                    sMessage = "El valor del nivel de riesgo no es valido";
            }
        } else { // Subsecuente
            switch (nivelRiesgo) {
                case 'Muy Bajo': // muy bajo
                    if (montoSolcitado > 200000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 200,000 MXN";
                    }
                    break;
                case 'Bajo': // bajo
                    if (montoSolcitado > 200000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 200,000 MXN";
                    }
                    break;
                case 'Medio': // medio
                    if (montoSolcitado > 50000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 50,000 MXN";
                    }
                    break;
                case 'Alto': // Alto
                    if (montoSolcitado > 50000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 50,000 MXN";
                    }
                    break;
                case 'Muy Alto': // muy alto
                    if (montoSolcitado > 30000) {
                        bIsValid = false;
                        sMessage = "De acuerdo a las condiciones, el monto solicitado no puede exceder $ 30,000 MXN";
                    }
                    break;
                default:
                    bIsValid = false;
                    sMessage = "El valor del nivel de riesgo no es valido";
            }
        }
        if (!bIsValid) {
            sap.m.MessageToast.show(sMessage);
            return false;
        } else {
            return true;
        }
    },
    onProposal: function() {
        /********************************************/
        this.onShowProposal();
    },
    sendToCore: function() {

        var oPoupNciDialogSendToCore;

        if (this.onSendingToCore()) { ///// Validaciones basicas para  enviar al core
            //////// Enviar al core
            oPoupNciDialogSendToCore = sap.ui.getCore().byId("popupNciDialogEnviarAlCore");
            oPoupNciDialogSendToCore.close();
        }
    },
    onSendingToCore: function() {

        //////// Validar la primera pantalla al menos para poder enviar al core
        var sMessage, bIsValid, oController, oView;
        var oTxtNciIdClienteValue, oTxtNciNombreCompletoValue, oSelectNciTipoDeProductoValue,
            oTxtNciCicloValue, oTxtNciEstatusDeLaOportunidadValue, 
            oSelectNciCanalDispersorValue, oSelectNciMedioDeDispersionValue;

        /* Se valida solo el estado */
        var oTxtNciMontoSolicitado, oTxtIngresosMensuales, oTxtGastosMensuales,
            oTxtCuotaQuePuedePagar, oTxtNciLiquidezMaxima;

        oController = this;
        oView = oController.getView();

        bIsValid = true;

        oTxtNciIdClienteValue = sap.ui.getCore().byId("txtNciIdCliente").getValue();
        oTxtNciNombreCompletoValue = sap.ui.getCore().byId("txtNciNombreCompleto").getValue();
        oSelectNciTipoDeProductoValue = sap.ui.getCore().byId("selectNciTipoDeProducto").getSelectedKey();
        oTxtNciCicloValue = sap.ui.getCore().byId("txtNciCiclo").getValue();
        oTxtNciEstatusDeLaOportunidadValue = sap.ui.getCore().byId("txtNciEstatusDeLaOportunidad").getValue();
        
        oSelectNciCanalDispersorValue = sap.ui.getCore().byId("selectNciCanalDispersor").getSelectedKey();
        oSelectNciMedioDeDispersionValue = sap.ui.getCore().byId("selectNciMedioDeDispersion").getSelectedKey();

        /* Se valida solo el estado */
        oTxtNciMontoSolicitado = sap.ui.getCore().byId("txtNciMontoSolicitado");
        oTxtIngresosMensuales = sap.ui.getCore().byId("txtIngresosMensuales");
        oTxtGastosMensuales = sap.ui.getCore().byId("txtGastosMensuales");
       
        oTxtCuotaQuePuedePagar = sap.ui.getCore().byId("txtCuotaQuePuedePagar");
        oTxtNciLiquidezMaxima = sap.ui.getCore().byId("txtNciLiquidezMaxima");


        sMessage = "Por favor complete: ";

        if (oTxtNciIdClienteValue === "") {
            sMessage = sMessage + " Id del Cliente \n";
            bIsValid = false;
        }
        if (oTxtNciNombreCompletoValue === "") {
            sMessage = sMessage + " Nombre completo \n";
            bIsValid = false;
        }
        if (oSelectNciTipoDeProductoValue === "") {
            sMessage = sMessage + " Tipo de producto \n";
            bIsValid = false;
        }

        if (oTxtNciCicloValue === "") {
            sMessage = sMessage + " Ciclo \n";
            bIsValid = false;
        }

        if (oTxtNciEstatusDeLaOportunidadValue === "") {
            sMessage = sMessage + " Estatus de la oportunidad \n";
            bIsValid = false;
        }

        if (oSelectNciCanalDispersorValue === "") {
            sMessage = sMessage + " Canal dispersor \n";
            bIsValid = false;
        }

        if (oSelectNciMedioDeDispersionValue === "") {
            sMessage = sMessage + " Medio de dispersion \n";
            bIsValid = false;
        }

        if (oTxtNciMontoSolicitado && oTxtIngresosMensuales && oTxtGastosMensuales && oTxtCuotaQuePuedePagar && oTxtNciLiquidezMaxima) {
            /* Se valida solo el estado */
            if (oTxtNciMontoSolicitado.getValueState() === sap.ui.core.ValueState.Error) {
                sMessage = sMessage + " Monto Solicitado \n";
                bIsValid = false;
            }
            if (oTxtIngresosMensuales.getValueState() === sap.ui.core.ValueState.Error) {
                sMessage = sMessage + " Ingresos mensuales \n";
                bIsValid = false;
            }
            if (oTxtGastosMensuales.getValueState() === sap.ui.core.ValueState.Error) {
                sMessage = sMessage + " Gastos mensuales \n";
                bIsValid = false;
            }

            if (oTxtCuotaQuePuedePagar.getValueState() === sap.ui.core.ValueState.Error) {
                sMessage = sMessage + " Cuota que puede pagar \n";
                bIsValid = false;
            }
            if (oTxtNciLiquidezMaxima.getValueState() === sap.ui.core.ValueState.Error) {
                sMessage = sMessage + " Liquidez Maxima \n";
                bIsValid = false;
            }
        }

        //   Se cuenta con las firmas correspondientes
        if (!this.bIsSignatureStillValid) {
            sMessage = sMessage + " Firmas \n";
            bIsValid = false;
        }

        if (bIsValid) {
            sMessage = "Enviando al core para creación de la oportunidad";
            /* Just simulating */
            var simulate = function(_this) {
                var that = _this;
                that.onFormEnable(false);
                return function() {
                    that.onFormEnable(true);
                    oView.getModel("oLoanRequestModel").setProperty("/LinkSet/results/0/GeneralLoanData/RiskLevel", 1);
                }
            };
            setTimeout(simulate(this), 2000);
            /* Just simulating */
        } else {
            sMessage = sMessage + " para poder enviar al core.";
        }
        sap.m.MessageToast.show(sMessage);
        return bIsValid;
    },
    guaranteeRelation: {
        BPIdCRM: "",
        loanRequestIdMD: "",
        CustomerIdMD: "",

        setBPIdCRM: function(_BPIdCRM) {
            this.BPIdCRM = _BPIdCRM;
        },
        getBPIdCRM: function() {
            return this.BPIdCRM;
        },
        setLoanRequestIdMD: function(_loanRequestIdMD) {
            this.loanRequestIdMD = _loanRequestIdMD;

        },
        getLoanRequestIdMD: function() {
            return this.loanRequestIdMD;

        },
        setCustomerIdMD: function(_CustomerIdMD) {
            this.CustomerIdMD = _CustomerIdMD;
        },
        getCustomerIdMD: function() {
            return this.CustomerIdMD;
        }
    },
    setAval: function(oEvent, oData) {


        var oPopupNciSeleccionarAval, loanRequestModel, oLoanRequestSerializer, oController, oView;
        var sloanRequestIdMD, sloanRequestIdCRM, sAllName, oPath, oSelectedRow;
        var oTxtNciIngresosMensuales, oTxtNciGastosMensuales, oTxtNciCapacidadDePagoDelAval;
        var iControlListsResult, iRiskLevel, iSemaphoreResultFilters, nTotalIncomeAmountGuarantee, nTotalOutcomeAmountGuarantee, nGuarantorPaymentCapacity;

        oController = this;
        oView = oController.getView();
        oPath = oEvent.getParameters().listItem.getBindingContext().sPath;
        oSelectedRow = oEvent.oSource.getModel().getProperty(oPath);
        sAllName = oSelectedRow.BpName.FirstName + " " + oSelectedRow.BpName.MiddleName + " " + oSelectedRow.BpName.LastName + " " + oSelectedRow.BpName.SecondName;
        //Se lanza mensaje de confirmación
        jQuery.sap.require("sap.m.MessageBox");
        sap.m.MessageBox.confirm("Se asignará el avál " + sAllName + " a la solicitud. ¿Desea Continuar?", {
            title: "Aviso",
            actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],

            onClose: function(MessageValue) {

                if (MessageValue === sap.m.MessageBox.Action.OK) {
                   
                    loanRequestModel = oView.getModel("oLoanRequestModel");

                    //Se obtienen valores asociados a LinkGuarantor
                    iControlListsResult = 0;
                    iRiskLevel = 0;
                    iSemaphoreResultFilters = 0;
                    nTotalIncomeAmountGuarantee = 0;
                    nTotalOutcomeAmountGuarantee = 0;
                    nGuarantorPaymentCapacity = 0;
                    if (oSelectedRow.LinkGuarantorSet && oSelectedRow.LinkGuarantorSet.results &&
                        oSelectedRow.LinkGuarantorSet.results.length > 0) {
                        oSelectedRow.LinkGuarantorSet.results.some(
                            function(_oLinkGuar) {
                                if (_oLinkGuar.LoanRequestIdMD === loanRequestModel.getProperty("/LoanRequestIdMD")) {
                                    nTotalIncomeAmountGuarantee = _oLinkGuar.TotalIncomeAmountGuarantee;
                                    nTotalOutcomeAmountGuarantee = _oLinkGuar.TotalOutcomeAmountGuarantee;
                                    nGuarantorPaymentCapacity = _oLinkGuar.GuarantorPaymentCapacity;
                                    if (_oLinkGuar.GeneralLoanData) {
                                        iControlListsResult = _oLinkGuar.GeneralLoanData.ControlListsResult;
                                        iRiskLevel = _oLinkGuar.GeneralLoanData.RiskLevel;
                                        iSemaphoreResultFilters = _oLinkGuar.GeneralLoanData.SemaphoreResultFilters;
                                    }
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                        );
                    }

                    oTxtNciIngresosMensuales = sap.ui.getCore().byId("txtNciIngresosMensuales");
                    oTxtNciGastosMensuales = sap.ui.getCore().byId("txtNciGastosMensuales");
                    oTxtNciCapacidadDePagoDelAval = sap.ui.getCore().byId("txtNciCapacidadDePagoDelAval");

                    oTxtNciIngresosMensuales.setEnabled(true);
                    oTxtNciGastosMensuales.setEnabled(true);
                    oTxtNciCapacidadDePagoDelAval.setEnabled(true);

                    /////// RISK LEVEL FIX
                    sap.ui.getCore().AppContext.IndividualLoanGuaranteeRiskLevel = iRiskLevel;
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/GeneralLoanData/ControlListsResult", iControlListsResult);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/GeneralLoanData/RiskLevel", iRiskLevel);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/GeneralLoanData/SemaphoreResultFilters", iSemaphoreResultFilters);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/TotalIncomeAmountGuarantee", nTotalIncomeAmountGuarantee);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/TotalOutcomeAmountGuarantee", nTotalOutcomeAmountGuarantee);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/GuarantorPaymentCapacity", nGuarantorPaymentCapacity);
                    /////// RISK LEVEL FIX

                    sap.ui.getCore().byId("txtNciIdAval").setValue(oSelectedRow.CustomerIdCRM);
                    sap.ui.getCore().byId("txtNciNombreDelAval").setValue(oSelectedRow.BpName.LastName + " " + oSelectedRow.BpName.SecondName + " " + oSelectedRow.BpName.FirstName + " " + oSelectedRow.BpName.MiddleName);

                    if (oSelectedRow.hasOwnProperty("PhoneSet")) {
                        if (oSelectedRow.PhoneSet.hasOwnProperty("results")) {
                            if (oSelectedRow.PhoneSet.results.length > 0) {
                                sap.ui.getCore().byId("txtNciTelefono").setValue(oSelectedRow.PhoneSet.results[0].PhoneNumber);
                            }
                        }
                    }


                    if (oSelectedRow.hasOwnProperty("AddressSet")) {
                        if (oSelectedRow.AddressSet.hasOwnProperty("results")) {
                            if (oSelectedRow.AddressSet.results.length > 0) {
                                sap.ui.getCore().byId("txtNciDireccion").setValue(oSelectedRow.AddressSet.results[0].Place.Street + " " + oSelectedRow.AddressSet.results[0].Place.OutsideNumber + " " + oSelectedRow.AddressSet.results[0].Place.InteriorNumber + ", " + oSelectedRow.AddressSet.results[0].Place.Suburb + ", " + oSelectedRow.AddressSet.results[0].Place.City + ", " + oSelectedRow.AddressSet.results[0].Place.StateId + ", " + oSelectedRow.AddressSet.results[0].Place.PostalCode);
                            }
                        }
                    }





                    if (sap.ui.getCore().byId("iconSemaforoGuarantee")) {
                        var semaphoreIcon = sap.ui.getCore().byId("iconSemaforoGuarantee");
                        var oSemaforo = loanRequestModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/SemaphoreResultFilters");

                        if (oSemaforo === 0) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === undefined) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === 1) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');

                        } else if (oSemaforo === 2) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreInitial');
                            semaphoreIcon.addStyleClass('semaphoreLevelGreen');

                        } else if (oSemaforo === 3) {

                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.removeStyleClass('semaphoreInitial');
                            semaphoreIcon.addStyleClass('semaphoreLevelRed');

                        } else {

                            semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                            semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                            semaphoreIcon.addStyleClass('semaphoreInitial');
                        }

                    }



                    /////////////////////////// Agregado para el modelo de Pouch
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/FirstName", oSelectedRow.BpName.FirstName);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/MiddleName", oSelectedRow.BpName.MiddleName);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/LastName", oSelectedRow.BpName.LastName);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/SecondName", oSelectedRow.BpName.SecondName);




                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/Guarantor", oSelectedRow);

                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/CustomerIdMD", oSelectedRow.CustomerIdMD);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/CustomerIdCRM", oSelectedRow.CustomerIdCRM);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/Guarantor/CustomerIdMD", oSelectedRow.CustomerIdMD);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/Guarantor/CustomerIdCRM", oSelectedRow.CustomerIdCRM);



                    /////////////////////////// Agregado para el modelo de Pouch

                    jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
                  
                    sloanRequestIdMD = loanRequestModel.getProperty("/LoanRequestIdMD");
                    sloanRequestIdCRM = loanRequestModel.getProperty("/LoanRequestIdCRM");
                    oController.guaranteeRelation.setBPIdCRM(oSelectedRow.CustomerIdCRM);
                    oController.guaranteeRelation.setCustomerIdMD(oSelectedRow.CustomerIdMD);
                    oController.guaranteeRelation.setLoanRequestIdMD(sloanRequestIdMD);
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/LoanRequestIdMD", sloanRequestIdMD);
           
                    loanRequestModel.setProperty("/LinkGuarantorSet/results/0/LoanRequestIdCRM", sloanRequestIdCRM);

                    loanRequestModel.refresh(true);

                    if (nTotalIncomeAmountGuarantee === 0) {
                        oTxtNciIngresosMensuales.setValue("");
                    }
                    if (nTotalOutcomeAmountGuarantee === 0) {
                        oTxtNciGastosMensuales.setValue("");
                    }
                    if (nGuarantorPaymentCapacity === 0) {
                        oTxtNciCapacidadDePagoDelAval.setValue("");
                    }

                    oPopupNciSeleccionarAval = sap.ui.getCore().byId("popupNciSeleccionarAval");
                    oPopupNciSeleccionarAval.close();
                }
            }
        });
    },
    onValidateObligatoryFields: function() {

        var oGuaranteeID, oGuaranteeName, oGuaranteeTelephone, oGuaranteeFullAddress, oYearsAtHome, oMontsAtHome, oYearsAtLocal, oMonthsAtLocal;
        var oFirstPaymentDate, oLoanDestination, oExpenditureDate, oProposedAmount, oProposedFrequency, oProposedFee, oProposedTerm;
        var sMessage;
        var bIsValid;


        /* Se valida solo el estado */
        var oTxtNciMontoSolicitado, oTxtIngresosMensuales, oTxtGastosMensuales,
            oTxtCuotaQuePuedePagar, oTxtNciLiquidezMaxima;






        oGuaranteeID = sap.ui.getCore().byId("txtNciIdAval");
        oGuaranteeName = sap.ui.getCore().byId("txtNciNombreDelAval");
        oGuaranteeTelephone = sap.ui.getCore().byId("txtNciTelefono");
        oGuaranteeFullAddress = sap.ui.getCore().byId("txtNciDireccion");
        oYearsAtHome = sap.ui.getCore().byId("selectNciTiempoEnLaViviendaAnios");
        oMontsAtHome = sap.ui.getCore().byId("selectNciTiempoEnLaViviendaMeses");
        oYearsAtLocal = sap.ui.getCore().byId("selectNciTiempoEnElLocalAnios");
        oMonthsAtLocal = sap.ui.getCore().byId("selectNciTiempoEnElLocalMeses");
        oFirstPaymentDate = sap.ui.getCore().byId("dtpNciDateFechaDePrimerPago");
        oLoanDestination = sap.ui.getCore().byId("rbGroupOptionDestinoPrestamo");
     
        oExpenditureDate = sap.ui.getCore().byId("txtNciDateFechaDeDesembolso");
        oProposedAmount = sap.ui.getCore().byId("txtNciMontoPropuesto");
        oProposedFrequency = sap.ui.getCore().byId("txtNciFrecuenciaPropuesta");
        oProposedFee = sap.ui.getCore().byId("txtNciCuotaPropuesta");
        oProposedTerm = sap.ui.getCore().byId("txtNciPlazoPropuesto");




        /* Se valida solo el estado */
        oTxtNciMontoSolicitado = sap.ui.getCore().byId("txtNciMontoSolicitado");
        oTxtIngresosMensuales = sap.ui.getCore().byId("txtIngresosMensuales");
        oTxtGastosMensuales = sap.ui.getCore().byId("txtGastosMensuales");
      
        oTxtCuotaQuePuedePagar = sap.ui.getCore().byId("txtCuotaQuePuedePagar");
        oTxtNciLiquidezMaxima = sap.ui.getCore().byId("txtNciLiquidezMaxima");





        if (!(oGuaranteeID && oGuaranteeName && oGuaranteeTelephone && oGuaranteeFullAddress && oYearsAtHome && oMontsAtHome && oYearsAtLocal && oMonthsAtLocal && oFirstPaymentDate && oLoanDestination && oExpenditureDate && oProposedAmount && oProposedFrequency && oProposedFee && oProposedTerm)) { /// No todos los campos han sido definidos (cargados)

            sap.m.MessageToast.show("Por favor verifique que todas las pestañas de la pantalla se hayan cargado correctamente");
            return false;

        }

        bIsValid = true;

        sMessage = "Por favor complete: ";
        if (oGuaranteeID.getValue() === "" || oGuaranteeID.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Id del Aval \n";
            bIsValid = false;
        }
        if (oGuaranteeName.getValue() === "" || oGuaranteeName.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Nombre del Aval \n";
            bIsValid = false;
        }
        if (oGuaranteeTelephone.getValue() === "" || oGuaranteeTelephone.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Teléfono del Aval \n";
            bIsValid = false;
        }
        if (oGuaranteeFullAddress.getValue() === "" || oGuaranteeFullAddress.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Direccion del Aval \n";
            bIsValid = false;
        }

        if (oExpenditureDate.getValue() === "" || oExpenditureDate.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Fecha de desembolso \n";
            bIsValid = false;
        }
        if (oProposedAmount.getValue() === "" || oGuaranteeID.getValue() === "0" || oProposedAmount.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Monto Propuesto \n";
            bIsValid = false;
        }
        if (oProposedFrequency.getValue() === "" || oProposedFrequency.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Frecuencia propuesta \n";
            bIsValid = false;
        }
        if (oProposedFee.getValue() === "" || oProposedFee.getValue() === "0" || oProposedFee.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Cuota propuesta \n";
            bIsValid = false;
        }
        if (oProposedTerm.getValue() === "" || oProposedTerm.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Plazo propuesto \n";
            bIsValid = false;
        }

        if (oYearsAtHome.getSelectedKey() === "") {
            sMessage = sMessage + " Años en el domicilio \n";
            bIsValid = false;
        }

        if (oMontsAtHome.getSelectedKey() === "") {
            sMessage = sMessage + " Meses en el domicilio \n";
            bIsValid = false;
        }

        if (oYearsAtLocal.getSelectedKey() === "") {
            sMessage = sMessage + " Años en el local \n";
            bIsValid = false;
        }


        if (oMonthsAtLocal.getSelectedKey() === "") {
            sMessage = sMessage + " Años en el local \n";
            bIsValid = false;
        }





        /* Se valida solo el estado */
        if (oTxtNciMontoSolicitado.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Monto Solicitado \n";
            bIsValid = false;
        }
        if (oTxtIngresosMensuales.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Ingresos mensuales \n";
            bIsValid = false;
        }
        if (oTxtGastosMensuales.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Gastos mensuales \n";
            bIsValid = false;
        }

        if (oTxtCuotaQuePuedePagar.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Cuota que puede pagar \n";
            bIsValid = false;
        }
        if (oTxtNciLiquidezMaxima.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Liquidez Maxima \n";
            bIsValid = false;
        }






        if (!this.bIsSignatureStillValid) {
            /// Si la firma no es valida
            bIsValid = false;
            sMessage = "La firma debe ser capturada nuevamente debido a los cambios realizados en la solicitud. \n" + sMessage;
            /// Al capturar nuevamente el aval
        }

        if (!bIsValid) {
            sap.m.MessageToast.show(sMessage);
        } else {
            sap.m.MessageToast.show("Guardado");
           
        }

        return bIsValid;

    },

    onChannelChange: function() {

        return function() {
            this.onUpdateDispersion();
        }.bind(this);


    },

    onUpdateDispersion: function(_oDispersionChannelKey) {

      
        var oFilterChannel, oDispersionChannel, oDispersionChannelKey, oSelectNgDispersionMedium;
        var  oItem, oView;

        oView = this.getView();
        if (_oDispersionChannelKey) {

            oDispersionChannelKey = _oDispersionChannelKey;

        } else {
            oDispersionChannel = sap.ui.getCore().byId("selectNciCanalDispersor");
            oDispersionChannelKey = oDispersionChannel.getSelectedKey();
        }

     

        oItem = new sap.ui.core.Item({
            text: "{MediumDescription}",
            key: "{MediumID}"
        });

        if (oDispersionChannelKey) { /// Verificar que el valor para el canal a buscar ya exista

            oFilterChannel = new sap.ui.model.Filter("ChannelID", sap.ui.model.FilterOperator.EQ, oDispersionChannelKey);
            oSelectNgDispersionMedium = sap.ui.getCore().byId("selectNciMedioDeDispersion").setModel(oView.getModel("dispersionModel"));
            oSelectNgDispersionMedium.bindAggregation("items", {
                path: "/results/",
                template: oItem,
                filters: oFilterChannel /////////// Pasar como filtro el ID del Canal
            });

        }
    },
    onInitializeDispersion: function() {

        // Make oDataCall
        var oTmpDispersionModel, oSeen, oToBind, oDispersionChannelsModel, oSelectNciDispersionChannel, oItem, promiseReadDispersion;
        var sFirstChannel, oView, oController;
        oController = this;
        oView = oController.getView();
        promiseReadDispersion = sap.ui.getCore().AppContext.myRest.read("/ChannelMediumDispersionSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "'", "", false, "dispersionModel");
        promiseReadDispersion
            .then(function(response) {
             
                oTmpDispersionModel = new sap.ui.model.json.JSONModel();
                oTmpDispersionModel.setData(response);
                oView.setModel(oTmpDispersionModel, "dispersionModel");
                oSeen = {};
                oToBind = new Array();

                //// Must verify if data is already present
                if (oTmpDispersionModel) {

                    if (oTmpDispersionModel.oData.results) {
                        if (oTmpDispersionModel.oData.results.length > 0) {
                            //////////// Pick distinct channelID only
                            jQuery.each(oTmpDispersionModel.oData.results, function() {
                                var sText;

                                if (!sFirstChannel) {
                                    sFirstChannel = this.ChannelID;
                                }

                                sText = this.ChannelID;
                                if (!oSeen[sText]) {
                                    oSeen[sText] = true;
                                    oToBind.push(this);
                                }
                            });
                        }
                    }

                }

                oDispersionChannelsModel = new sap.ui.model.json.JSONModel(oToBind);

                oItem = new sap.ui.core.Item({
                    text: "{ChannelDescription}",
                    key: "{ChannelID}"
                });

                oSelectNciDispersionChannel = sap.ui.getCore().byId("selectNciCanalDispersor");


                oSelectNciDispersionChannel.bindAggregation("items", {
                    path: "/",
                    template: oItem
                });

                oSelectNciDispersionChannel.setModel(oDispersionChannelsModel);

                oSelectNciDispersionChannel.attachChange(oController.onChannelChange());
                oController.onUpdateDispersion(sFirstChannel);

            }).catch(function() {
                sap.m.MessageToast.show("¡Ups! Existe un error en la red, intente más tarde");
                
            });
    },
   
    onShowSynchronizeConfirmation: function() {

    },
    onShowSynchronizeConfirmationClose: function() {

        var oPoupNciDialogSendToCore;

        oPoupNciDialogSendToCore = sap.ui.getCore().byId("popupNciDialogEnviarAlCore");
        oPoupNciDialogSendToCore.close();
    },
    onShowSynchronizeConfirmationAccept: function() {

        var oPoupNciDialogSendToCore;

        oPoupNciDialogSendToCore = sap.ui.getCore().byId("popupNciDialogEnviarAlCore");
        oPoupNciDialogSendToCore.close();
    },
    onShowExceptionCauses: function() {

        var oPopupNciChooseExceptionCause;

        oPopupNciChooseExceptionCause = sap.ui.getCore().byId("popupNciSeleccionarCausaExcepcion");
        oPopupNciChooseExceptionCause.open();
    },
    onShowExceptionCausesClose: function() {

        var oPopupNciChooseExceptionCause;

        oPopupNciChooseExceptionCause = sap.ui.getCore().byId("popupNciSeleccionarCausaExcepcion");
        oPopupNciChooseExceptionCause.close();
    },
    getGuaranteeSerialize: function(_oDataBase) {
        jQuery.sap.require("js.serialize.guarantee.GuaranteeSerialize");
        return new sap.ui.serialize.Guarantee(_oDataBase);
    },
    onShowGuarantees: function() {
        var oPopupNciChooseGuarantee, bdLoader, guaranteeSerialize, oTmpGuaranteeModel, oController, oView;

        oController = this;
        oView = oController.getView();
        guaranteeSerialize = this.getGuaranteeSerialize("dataDB");

        oPopupNciChooseGuarantee = sap.ui.getCore().byId("popupNciSeleccionarAval");
        oPopupNciChooseGuarantee.open();

        bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudIndividual");
        bdLoader.setText("Cargando Avales");
        bdLoader.open();


        guaranteeSerialize.getMainModelWithOutLoan("GuarantorSet", sap.ui.getCore().AppContext.Promotor).then(function(response) {

           
            oTmpGuaranteeModel = oView.getModel("guaranteeModel");
            if (!oTmpGuaranteeModel) {
                oTmpGuaranteeModel = new sap.ui.model.json.JSONModel();
            }
           

            oTmpGuaranteeModel.setData(response);

            oView.setModel(oTmpGuaranteeModel, "guaranteeModel");
            oTmpGuaranteeModel.refresh(true);
            bdLoader.close();

        }).catch(function() {
            sap.m.MessageToast.show("Se ha producido un error al consultar la lista de avales, por favor intente nuevamente. ");
           
            bdLoader.close();
        })
    },
    onShowGuaranteesClose: function() {

        var oPopupNciChooseGuarantee;

        oPopupNciChooseGuarantee = sap.ui.getCore().byId("popupNciSeleccionarAval");
        oPopupNciChooseGuarantee.close();
    },
    onShowProposal: function() {

        var   Frecuencia,amountRequested, typeClient, typeRisk, terms, frequency, resEvaluationProposal, sParameterFrequency;
        var  amountRequestedLiq;
        typeClient = sap.ui.getCore().byId("txtNciTipoDeCliente").getValue();
        typeRisk = sap.ui.getCore().byId("txtNciNivelDeRiesgo").getValue();
        /*******MedioHardCode*******/
        if ((!sap.ui.getCore().byId("selectNciFrecuenciaSolicitada")) || (!sap.ui.getCore().byId("selectNciFrecuenciaSolicitada").getSelectedKey())) {
            sap.m.MessageToast.show("Debe seleccionar la frecuencia solicitada");
            return false;
        } else {
            Frecuencia = sap.ui.getCore().byId("selectNciFrecuenciaSolicitada").getSelectedKey();
            terms = Frecuencia.substring(3, 5); /// Quitar ZYY

            if (terms.substring(0, 1) === "0") { /// Si empieza con 0, quitar el 0

                terms = terms.substring(1, 2);
            }
        }

        if ((!sap.ui.getCore().byId("txtNciLiquidezMaxima")) || (!sap.ui.getCore().byId("txtNciLiquidezMaxima").getValue())) {
            sap.m.MessageToast.show("Debe ingresar 'Liquidez Máxima'");
            return false;
        }
        amountRequestedLiq = parseInt(sap.ui.getCore().byId("txtNciLiquidezMaxima").getValue());
        if (amountRequestedLiq === 0) {
            sap.m.MessageToast.show("La 'Liquidez Máxima' debe de ser mayor a $0");
            return false;
        }

        if ((!sap.ui.getCore().byId("txtNciMontoSolicitado")) || (!sap.ui.getCore().byId("txtNciMontoSolicitado").getValue())) {
            sap.m.MessageToast.show("Debe ingresar un 'Monto Solicitado'");
            return false;
        } else {
            amountRequested = parseInt(sap.ui.getCore().byId("txtNciMontoSolicitado").getValue());
        }
        if (amountRequested > 200000) {
            sap.m.MessageToast.show("El 'Monto Solicitado', no debe de ser mayor a $200,000.00");
            return false;
        }
        if (amountRequested < 20000) {
            sap.m.MessageToast.show("El 'Monto Solicitado', no debe de ser menor a $20,000.00");
            return false;
        }
        if (amountRequested % 500 !== 0) {
            sap.m.MessageToast.show("El 'Monto Solicitado', solo acepta cantidades con intervalos de 500");
            return false;
        }

        frequency = sap.ui.getCore().byId("selectNciFrecuenciaSolicitada").getSelectedKey();
        resEvaluationProposal = this.evaluationProposal(typeClient, typeRisk, amountRequested, terms, frequency);
        if (resEvaluationProposal.response !== false) {
            sParameterFrequency = Frecuencia.substring(1, 3);
            if (sParameterFrequency === "14") {
                sParameterFrequency = "2";
            } else {
                sParameterFrequency = "3";
            }
            if (!this.proposalAmountValidation(amountRequested, typeRisk, typeClient) === false) {
                sap.m.MessageToast.show("Enviado a propuesta de crédito");
                this.showProposalRequestService(sParameterFrequency);
            }
        } else {
            sap.m.MessageToast.show("No fue posible encontrar el monto y plazo buscado en las validaciones de la propuesta de condiciones del crédito");
            /// Mostrar error
        }
        sap.ui.getCore().byId("txtNciMontoPropuesto").setValue(amountRequested.toFixed(2));
        sap.ui.getCore().byId("txtNciFrecuenciaPropuesta").setValue(frequency);
        //
    },
    showProposalRequestService: function(_sParameterFrequency) {

        var montoSolicitado, frecuanciaSolicitada, liquidezMaxima;
        var oModelSolicitudCreditoIndividual;
        var requestSolicitudesCreditoIndividual;
        var lengthModel;
        var newPropertyJson;
        var newJson;
        var propertyJson;
        var oPopupNciProposal;
        var comboSelectNciCuotaPlazo;
        var itemTemplate;
        var requestCreditSimulator;
        var frecuenciaFiltrada;
        var amountRequestedProposal;
        /****************************************************************/
        montoSolicitado = sap.ui.getCore().byId("txtNciMontoSolicitado").getValue();
        frecuanciaSolicitada = sap.ui.getCore().byId("selectNciFrecuenciaSolicitada").getSelectedKey();
        liquidezMaxima = sap.ui.getCore().byId("txtNciLiquidezMaxima").getValue();
        
        frecuenciaFiltrada = frecuanciaSolicitada.substring(1, 3);
        if (frecuenciaFiltrada === "14") {
            frecuenciaFiltrada = 2;
        } else {
            frecuenciaFiltrada = 3;
        }

        if (sap.OData) {
            sap.OData.removeHttpClient();
        }

        requestCreditSimulator = sap.ui.getCore().AppContext.myRest.read("/CreditSimulator",
            "reqAmount=" + montoSolicitado +
            "&reqTerm='" + frecuenciaFiltrada +
            "'&maxSolvencyAmount=" + liquidezMaxima, true);

        requestCreditSimulator
            .then(function(response) {

              
                if (sap.OData) {
                    sap.OData.applyHttpClient();
                }


                oModelSolicitudCreditoIndividual = response;
                sap.ui.getCore().setModel(oModelSolicitudCreditoIndividual, "oModelSolicitudCreditoIndividual");
                requestSolicitudesCreditoIndividual = oModelSolicitudCreditoIndividual.results;
                lengthModel = Object.keys(requestSolicitudesCreditoIndividual).length;

                if (lengthModel === 0) {
                    sap.m.MessageToast.show("No se pudieron recopilar los datos.");
                } else {
                    newJson = new sap.ui.model.json.JSONModel();
                    newJson.setData({
                        results: [{
                            amountPeriod: "selecione...",
                            frecuenciaPropuesta: "NA"
                        }]
                    });
                    propertyJson = newJson.getProperty("/results/");
                    for (var i = 0; i < lengthModel; i++) {
                        newPropertyJson = {
                            amountPeriod: parseFloat(requestSolicitudesCreditoIndividual[i].PropAmount).toFixed(2) + " / " + requestSolicitudesCreditoIndividual[i].PropPeriod,
                            frecuenciaPropuesta: requestSolicitudesCreditoIndividual[i].PropFrequency
                        }
                        propertyJson.push(newPropertyJson);

                    }
                    newJson.setProperty("/results/", propertyJson);
                
                    sap.ui.getCore().setModel(newJson, "newJson");
                    oPopupNciProposal = sap.ui.getCore().byId("popupNciPropuesta");
                    oPopupNciProposal.open();
                  

                    comboSelectNciCuotaPlazo = sap.ui.getCore().byId("selectNciCuotaPlazo");
                    comboSelectNciCuotaPlazo.setModel(newJson);
                    itemTemplate = new sap.ui.core.ListItem();
                    itemTemplate.bindProperty("text", "amountPeriod");
                    itemTemplate.bindProperty("key", "amountPeriod");
                    comboSelectNciCuotaPlazo.bindItems("/results", itemTemplate);

                    amountRequestedProposal = parseInt(sap.ui.getCore().byId("txtNciMontoSolicitado").getValue());

                    sap.ui.getCore().byId("txtNciMontoPropuesta").setValue(amountRequestedProposal);

                    frecuenciaFiltrada = requestSolicitudesCreditoIndividual[0].PropFrequency.substring(1, 3);
                    if (frecuenciaFiltrada === "14") {
                        sap.ui.getCore().byId("txtNciFrecuencia").setValue("BI-SEMANAL");
                    } else {
                        sap.ui.getCore().byId("txtNciFrecuencia").setValue("MENSUAL");
                    }


                }
            }).catch(function() {
               
                sap.m.MessageToast.show("Se presento un error al realizar la consulta de la simulación de crédito, por favor verifique los datos e intente nuevamente");

                if (sap.OData) {

                    sap.OData.applyHttpClient();
                }

            });
    },
    evaluationProposal: function(_typeClient, _typeRisk, _amount, _terms, _frequency) {

        var typeClient = _typeClient;
        var typeRisk = _typeRisk;
        var amount = parseInt(_amount);
        var terms = parseInt(_terms);
        var frequency = _frequency;
        var amountMin;
        var amountMax;
        var termsMin;
        var termsMax;
        var modelProperty;
        var oModel;
        var _this = this;
        var _return;
        var _returnHelper;
        var jsonDeadLines = '';
        var json_return = '';


        oModel = new sap.ui.model.json.JSONModel();

        //// Parse frequency
        frequency = frequency.substring(1, 3);

        //// Parse frequency


        if (frequency === "14") {
            jsonDeadLines = "data-map/catalogos/deadlinesbisemanal.json";
        } else {
            jsonDeadLines = "data-map/catalogos/deadlinesmensual.json";
        }

      

        oModel.loadData(jsonDeadLines, null, false);
        sap.ui.getCore().setModel(oModel, "oModel");

        /****para los subsecuentes****/
        modelProperty = oModel.getProperty("/" + typeClient + "/" + typeRisk + "/");
        if (!modelProperty) {
            json_return = '{}';
        } else {
            if (typeClient === "Subsecuente") {
                amountMin = parseInt(modelProperty.monto_min);
                amountMax = parseInt(modelProperty.monto_max);
                termsMin = parseInt(modelProperty.plazo_min);
                termsMax = parseInt(modelProperty.plazo_max);
            }
            /****para los nuevo****/
            if (typeClient === "Nuevo") {
                var lengthModel = Object.keys(modelProperty).length;
                for (var i = 1; i <= lengthModel; i++) {
                    modelProperty = oModel.getProperty("/" + typeClient + "/" + typeRisk + "/p" + i);
                    amountMin = parseInt(modelProperty.monto_min);
                    amountMax = parseInt(modelProperty.monto_max);
                    termsMin = parseInt(modelProperty.plazo_min);
                    termsMax = parseInt(modelProperty.plazo_max);
                    _returnHelper = _this.proposalResults(amount, amountMin, amountMax, terms, termsMin, termsMax);
                    if (_returnHelper) {
                        i = lengthModel + 1;
                    }
                }
                _return = _returnHelper;

            } else {
                _return = _this.proposalResults(amount, amountMin, amountMax, terms, termsMin, termsMax);
            }
            json_return = '{"response": ' + _return + ' ,"amountMin":' + amountMin + ',"amountMax":' + amountMax + ',"termsMin":' + termsMin + ',"termsMax":' + termsMax + '}';
        }

        return JSON.parse(json_return);
    },
    proposalResults: function(amount, amountMin, amountMax, terms, termsMin, termsMax) {
        var flagStatusAmount;
        var flagStatusTerms;
        var _return;
        flagStatusAmount = (amount >= amountMin && amount <= amountMax) ? true : false;
        flagStatusTerms = (terms >= termsMin && terms <= termsMax) ? true : false;

        _return = (flagStatusAmount && flagStatusTerms) ? true : false;

        return _return;
    },
    onShowProposalClose: function() {

        var oPopupNciProposal;

        oPopupNciProposal = sap.ui.getCore().byId("popupNciPropuesta");
        oPopupNciProposal.close();
    },
    onShowProposalAccept: function() {
        this.onChangingProposal();
        var oPopupNciProposal;

        oPopupNciProposal = sap.ui.getCore().byId("popupNciPropuesta");
        oPopupNciProposal.close();
    },
    onChangingProposal: function() {


        var comboSelectNciCuotaPlazo, montoSolicitado;
        var valueCombo;
        var divCombo;
        var cuota;
        var plazo;
        var oSelectedModel;
        var sPath;
        var oCurrentItem;

        montoSolicitado = sap.ui.getCore().byId("txtNciMontoSolicitado").getValue();
        comboSelectNciCuotaPlazo = sap.ui.getCore().byId("selectNciCuotaPlazo");

        valueCombo = comboSelectNciCuotaPlazo.getSelectedKey();

        if (valueCombo !== "selecione...") {
            divCombo = valueCombo.indexOf("/");
            cuota = valueCombo.substring(0, (divCombo - 1));
            plazo = valueCombo.substring((divCombo + 1), (divCombo.length));
            oSelectedModel = comboSelectNciCuotaPlazo.getSelectedItem().getBindingContext().getModel();
            sPath = comboSelectNciCuotaPlazo.getSelectedItem().getBindingContext().sPath;
            oCurrentItem = oSelectedModel.getProperty(sPath);
            sap.ui.getCore().byId("txtNciMontoPropuesto").setValue(montoSolicitado.trim());
            sap.ui.getCore().byId("txtNciFrecuenciaPropuesta").setValue(oCurrentItem.frecuenciaPropuesta);
            sap.ui.getCore().byId("txtNciCuotaPropuesta").setValue(cuota.trim());
            sap.ui.getCore().byId("txtNciPlazoPropuesto").setValue(plazo.trim());
        }
    },
    onPressbtnNciEntrevista: function(evt) {

        /////////// Validaciones previas a lanzar la aplicación
        // EAMARCE 29/12/2015

        var oTxtNciNivelDeRiesgo, oController, oView;
        var bIsValid, sMessage, levelRiskValue, sApp;

        oController = this;
        oView = oController.getView();

        oTxtNciNivelDeRiesgo = sap.ui.getCore().byId("txtNciNivelDeRiesgo");

        if (!(oTxtNciNivelDeRiesgo)) {
            sap.m.MessageToast.show("Por favor verifique que el nivel de riesgo haya sido validado");
            return false;
        }

        bIsValid = true;
        sMessage = "Para comenzar la evaluación favor complete y valide: ";

        if (oTxtNciNivelDeRiesgo.getValue() === "" || oTxtNciNivelDeRiesgo.getValue() === "0" || oTxtNciNivelDeRiesgo.getValueState() === sap.ui.core.ValueState.Error) {
            sMessage = sMessage + " Nivel de Riesgo \n";
            bIsValid = false;
        }

        if (!bIsValid) {
            //////// Enviar a propuesta de credito
            sap.m.MessageToast.show(sMessage);
            return false;
        }

        ///////// Lanzar la aplicación
         levelRiskValue = oView.getModel('oLoanRequestModel').getProperty('/LinkGuarantorSet/results/0/GeneralLoanData/RiskLevel');
        sApp = startApp.set({ /* params */
            "component": [sap.ui.getCore().AppContext.Config.getProperty("appEDN"), sap.ui.getCore().AppContext.Config.getProperty("appEDNMain")]
        }, { /* extras */
            "usuarioAo": sap.ui.getCore().AppContext.applicationContext.registrationContext.user,
            "nivelRiesgo": levelRiskValue
        });

        sApp.start(function(message) { /* success */
                
        }, function(error) { /* fail */
            sap.m.MessageToast.show("Hubo un problema al ejecutar la aplicación " + error);
        });
    },
    pressProductList: function(evt) {},
    searchAvalTxt: function(evt) {

        var aFilters, txtSeachFilter, list, binding, filter, filter2, filter3, filter4;
        txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            filter = new sap.ui.model.Filter("BpName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter2 = new sap.ui.model.Filter("BpName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter3 = new sap.ui.model.Filter("BpName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter4 = new sap.ui.model.Filter("BpName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            aFilters = new sap.ui.model.Filter([filter, filter2, filter3, filter4]);
        }

        list = sap.ui.getCore().byId("listNciAval");
        binding = list.getBinding("items");
        binding.filter(aFilters);
    },
    onLoadTableAval: function(_context) {

        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
        var oDisplayBase, itemsTemplate;
        oDisplayBase = new sap.ui.mw.DisplayBase();
        itemsTemplate = new sap.m.ColumnListItem({
            type: "Active"
        });
        itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("BpName/LastName") + " " + _context.getProperty("BpName/SecondName") + " " + _context.getProperty("BpName/FirstName") + " " + _context.getProperty("BpName/MiddleName")));
        itemsTemplate.addCell(oDisplayBase.createText("", oDisplayBase.formatDate(_context.getProperty("BpMainData/RegistrationDate"), "dd.MM.yyyy")));
        itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("CustomerIdCRM")));

        return itemsTemplate;
    },
    selectIconTabBarFilter: function(evt) {
        //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase, oController, oView;
        //Guarda tab seleccionado
        var currentTabFilter, option, contentFlag, oIndicatorTabs, currentController;
        //Se declaran objetos de Middleware de componentes SAPUI5
        //
        var oGuaranteeTmpModel;
        oInputBase = new sap.ui.mw.InputBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oListBase = new sap.ui.mw.ListBase();
        oController = this;
        oView = oController.getView();

        if (sap.ui.getCore().byId("txtNciListasDeControl") && sap.ui.getCore().byId("btnNciPropuesta")) {
            if (sap.ui.getCore().byId("txtNciListasDeControl").getValue() !== "" && this.bIsCreating === false) {
                if (sap.ui.getCore().AppContext.bIsIndividualFormEnabled) {
                    if (sap.ui.getCore().AppContext.isConected) {
                        sap.ui.getCore().byId("btnNciPropuesta").setEnabled(true);
                    } else {
                        sap.ui.getCore().byId("btnNciPropuesta").setEnabled(false);
                    }
                } else {
                    sap.ui.getCore().byId("btnNciPropuesta").setEnabled(false);
                }
            } else {
                sap.ui.getCore().byId("btnNciPropuesta").setEnabled(false);
            }
        }

        //Obtiene Tab actual seleccionado
        currentTabFilter = sap.ui.getCore().byId(evt.getParameter("key"));
        option = currentTabFilter.sId;
        contentFlag = currentTabFilter.getContent().length;

        if (option === "itIndividual3") {
            
            var oTmpLoanRequestModel = oView.getModel("oLoanRequestModel");
            if (!oTmpLoanRequestModel) {
                oTmpLoanRequestModel = new sap.ui.model.json.JSONModel();
                oView.setModel(oTmpLoanRequestModel, "oLoanRequestModel");
            }
            var oControlListsResult = oTmpLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/ControlListsResult");
            sap.ui.getCore().AppContext.IndividualLoanGuaranteeRiskLevel = oTmpLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/RiskLevel");
        }
        if (option === "itIndividual4") {
            if (sap.ui.getCore().byId("idCreditProposalForm")) {
                var oSourceId, oClientType = "Nuevo";
                oSourceId = oView.getModel("oLoanRequestModel").getProperty("/LinkSet/results/0/Customer/BpMainData/SourceId");
                /**
                 * Validación del tipo de cliente por fuente
                 * Si es de fuente Z07 se muestra una leyenda de Subsecuente, cualquier otro caso se muestra la leyenda de Nuevo
                 */
                if (oSourceId === "Z07") {
                    oClientType = "Subsecuente";
                }
                if (sap.ui.getCore().byId("txtNciMontoSolicitado") && sap.ui.getCore().AppContext.MaxAmount !== 0) {
                    if (sap.ui.getCore().byId("txtNciMontoSolicitado").getValue() <= sap.ui.getCore().AppContext.MaxAmount) {
                        oClientType = "Subsecuente Express"
                    }
                }
                sap.ui.getCore().byId("txtNciTipoDeCliente").setValue(oClientType);
            }
            if (sap.ui.getCore().byId("btnNciEntrevista")) {
                this._onHideButtonEntrevista();
            }
        }
        if (contentFlag === 0) {
            oIndicatorTabs = new sap.m.BusyIndicator({
                text: "Cargando componentes..."
            });
            currentTabFilter.addContent(oIndicatorTabs);
            currentController = this;
            setTimeout(function() {
                switch (option) {
                    case "itIndividual1": //TAB FILTER "Principales"
                        jQuery.sap.require("js.forms.individual.Main");
                        var oForm;
                        oForm = new sap.ui.mw.forms.individual.Main();
                        //se agrega formulario al tab
                        var oTmpLoanRequestModel;

                       
                        oTmpLoanRequestModel = oView.getModel("oLoanRequestModel");
                        if (!oTmpLoanRequestModel) {
                            oTmpLoanRequestModel = new sap.ui.model.json.JSONModel();
                           
                            oView.setModel(oTmpLoanRequestModel, "oLoanRequestModel");
                        }


                        //////////////////////////////////////////////////////
                        currentTabFilter.destroyContent();
                        currentTabFilter.addContent(oForm.createMainForm("idMainIndividualForm", currentController));
                        currentController.onInitializeDispersion();

                        if (!currentController.bIsEnabled) {
                            currentController.onFormEnable(false, "idMainIndividualForm");
                        }
                        break;
                    case "itIndividual2": //TAB FILTER "Datos del Crédito"
                        jQuery.sap.require("js.forms.individual.Credit");
                        var oForm;
                        var oSelectNciFrecuenciaSolicitada, oItemSelect, oFrecuenciasModel;
                        oForm = new sap.ui.mw.forms.individual.Credit();
                        //se agrega formulario al tab
                        currentTabFilter.destroyContent();
                        currentTabFilter.addContent(oForm.createCreditForm("idCreditIndividualForm", currentController));
                        //Bind a frecuencias
                        oSelectNciFrecuenciaSolicitada = sap.ui.getCore().byId("selectNciFrecuenciaSolicitada");
                        oFrecuenciasModel = new sap.ui.model.json.JSONModel("data-map/catalogos/frecuencia_C_IND_CI.json");
                     
                        oView.setModel(oFrecuenciasModel, "frecuenciasModel");
                        oSelectNciFrecuenciaSolicitada.setModel(oFrecuenciasModel);
                        oItemSelect = new sap.ui.core.Item({
                            key: "{idCRM}",
                            text: "{text}"
                        });
                        oSelectNciFrecuenciaSolicitada.bindAggregation("items", {
                            path: "/frecuencias",
                            template: oItemSelect
                        });


                        if (!currentController.bIsEnabled) {
                            currentController.onFormEnable(false, "itIndividual2");
                            sap.ui.getCore().byId("btnNciPorAprobar").setEnabled(false);
                        } else {
                           /* if (sap.ui.getCore().AppContext.isConected) {
                                sap.ui.getCore().byId("btnNciPorAprobar").setEnabled(true);

                            } else {
                                sap.ui.getCore().byId("btnNciPorAprobar").setEnabled(false);
                            }*/

                            if (currentController.bIsCreating) {
                               
                            }
                        }


                        // Bind a frecuencias
                        break;
                    case "itIndividual3": //TAB FILTER "DIRECCIONES"
                        jQuery.sap.require("js.forms.individual.Guarantee");
                        var oForm;
                        oForm = new sap.ui.mw.forms.individual.Guarantee();
                        //se agrega formulario al tab
                        currentTabFilter.destroyContent();

                        //////////Agregar inicialización de modelo de Guarantee
                        //oGuaranteeTmpModel = sap.ui.getCore().getModel("guaranteeModel");
                        oGuaranteeTmpModel = oView.getModel("guaranteeModel");
                        if (!oGuaranteeTmpModel) {
                            oGuaranteeTmpModel = new sap.ui.model.json.JSONModel();
                         
                            oView.setModel(oGuaranteeTmpModel, "guaranteeModel");
                        }

                       
                        var oTmpLoanRequestModel = oView.getModel("oLoanRequestModel");
                        if (!oTmpLoanRequestModel) {
                            oTmpLoanRequestModel = new sap.ui.model.json.JSONModel();
                            oView.setModel(oTmpLoanRequestModel, "loanRequestModel");
                        }


                        currentTabFilter.addContent(oForm.createGuaranteeForm("idCreditGuaranteeForm", currentController));

                        if (sap.ui.getCore().byId("iconSemaforoGuarantee")) {

                            var semaphoreIcon = sap.ui.getCore().byId("iconSemaforoGuarantee");
                            var oControlListsResult;

                            var oSemaforo = oTmpLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/SemaphoreResultFilters");
                            var oRiskLevel = oTmpLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/RiskLevel");
                            oControlListsResult = oTmpLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/ControlListsResult");

                            sap.ui.getCore().AppContext.IndividualLoanGuaranteeRiskLevel = oTmpLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/GeneralLoanData/RiskLevel");


                            if (oSemaforo === 0) {

                                semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                                semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                                semaphoreIcon.addStyleClass('semaphoreInitial');

                            } else if (oSemaforo === undefined) {

                                semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                                semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                                semaphoreIcon.addStyleClass('semaphoreInitial');

                            } else if (oSemaforo === 1) {

                                semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                                semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                                semaphoreIcon.addStyleClass('semaphoreInitial');

                            } else if (oSemaforo === 2) {

                                semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                                semaphoreIcon.removeStyleClass('semaphoreInitial');
                                semaphoreIcon.addStyleClass('semaphoreLevelGreen');

                            } else if (oSemaforo === 3) {

                                semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                                semaphoreIcon.removeStyleClass('semaphoreInitial');
                                semaphoreIcon.addStyleClass('semaphoreLevelRed');

                            } else {

                                semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                                semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                                semaphoreIcon.addStyleClass('semaphoreInitial');
                            }

                       


                        }


                        if (!currentController.bIsEnabled) {
                            currentController.onFormEnable(false, "itIndividual3");
                        }






                        break;
                    case "itIndividual4": //TAB FILTER "BASICOS"
                        jQuery.sap.require("js.forms.individual.Proposal");
                        var oForm;
                        oForm = new sap.ui.mw.forms.individual.Proposal();
                        currentTabFilter.destroyContent();
                        currentTabFilter.addContent(oForm.createProposalForm("idCreditProposalForm", currentController));


                        if (!currentController.bIsEnabled) {
                            currentController.onFormEnable(false, "itIndividual4");
                            sap.ui.getCore().byId("btnNciPropuesta").setEnabled(false);
                        } else {
                            if (sap.ui.getCore().byId("txtNciListasDeControl").getValue() === "" && currentController.bIsCreating === false) {
                                if (sap.ui.getCore().AppContext.isConected) {
                                    sap.ui.getCore().byId("btnNciPropuesta").setEnabled(false);
                                } else {
                                    sap.ui.getCore().byId("btnNciPropuesta").setEnabled(false);
                                }
                            } else {
                                if (sap.ui.getCore().byId("txtNciListasDeControl").getValue() !== "" && currentController.bIsCreating === false) {
                                    if (sap.ui.getCore().AppContext.isConected) {
                                        sap.ui.getCore().byId("btnNciPropuesta").setEnabled(true);
                                    } else {
                                        sap.ui.getCore().byId("btnNciPropuesta").setEnabled(false);
                                    }
                                }
                            }

                            if (currentController.bIsCreating || sap.ui.getCore().AppContext.bHasIndividualLoanID === false) {
                                sap.ui.getCore().byId("txtNciLiquidezMaxima").setEnabled(false);
                            } else {
                                sap.ui.getCore().byId("txtNciLiquidezMaxima").setEnabled(true);
                            }

                        }

                        currentController._onHideButtonEntrevista();
                        break;
                    default:
                }
            }, 0);
        }
    },

    _onHideButtonEntrevista: function() {
        var oController, oView;
        oController = this;
        oView = oController.getView();
        sap.ui.getCore().byId("btnNciEntrevista").setEnabled(
            ((oView.getModel("oLoanRequestModel").getProperty("/SubsequenceType") === "Z03" || sap.ui.getCore().byId("txtNciTipoDeCliente").getValue() === "Subsecuente Express") ? false : true)
        );
    },


    onSendToCore: function() {
        //Middleware de componentes SAPUI5
        var  oActionBase, oDisplayBase;
        //Variables para dialogo.
        var dialogAdds,  oCurrentController;

        //Se declaran objetos de Middleware de componentes SAPUI5
       
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
       
        oCurrentController = this;



        setTimeout(function() {
            dialogAdds = sap.ui.getCore().byId('appDialogIndSendToCore');
            dialogAdds.addContent(oDisplayBase.createLabel("", "¿Desea mandar la información a Integra?"));
            dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.sendInformationToCore, oCurrentController));
            dialogAdds.addButton(oActionBase.createButton("", "Cancelar", "Default", "", oCurrentController.closeSendToCore, oCurrentController));
            dialogAdds.open();
        }, 0);
    },



    //Guardar: se debe realizar actualización de ésta sección cuando se integré Offline
    onSaveApplication: function() {
        //Middleware de componentes SAPUI5
        var  oActionBase, oDisplayBase;
        //Variables para dialogo.
        var dialogAdds, oCurrentController;

        //Se declaran objetos de Middleware de componentes SAPUI5
      
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
       

        oCurrentController = this;

        setTimeout(function() {
            dialogAdds = sap.ui.getCore().byId('appDialogSave');
            dialogAdds.addContent(oDisplayBase.createLabel("", "¿Desea guardar?"));
            dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.save, oCurrentController));
            dialogAdds.addButton(oActionBase.createButton("", "Cancelar", "Default", "", oCurrentController.closeSave, oCurrentController));
            dialogAdds.open();
        }, 0);
    },
    closeSendToCore: function() {
        var oCurrentDialog = sap.ui.getCore().byId("appDialogIndSendToCore");
        oCurrentDialog.destroyContent(); //se destruye contenido del dialogo
        oCurrentDialog.destroyButtons();
        oCurrentDialog.close(); //se cierra modal
    },

    closeSave: function() {

        var oCurrentDialog = sap.ui.getCore().byId("appDialogSave");
        oCurrentDialog.destroyContent(); //se destruye contenido del dialogo
        oCurrentDialog.destroyButtons();
        oCurrentDialog.close(); //se cierra modal
    },

    save: function() {
      
        jQuery.sap.require("js.base.DisplayBase");
        //NOTA: ******** Aqui se deben realizar las validaciones de formulario ********
        var   oTxtNciMontoSolicitado;
        var oDtpNciFirstPaymentDate, oTxtNciDateExpenditureDate, oDate;
        var oFinalModel, amountRequested;

     
        ///////// Validacion de fechas
        ///

        oDate = new Date();

        oDtpNciFirstPaymentDate = this.getView().getModel("oLoanRequestModel").getProperty("/GeneralLoanRequestData/FirstPaymentDate");
      
        if (moment(oDtpNciFirstPaymentDate).isValid() && oDtpNciFirstPaymentDate !==undefined ) {
            if (moment(oDtpNciFirstPaymentDate.setHours(0, 0, 0, 0))<=moment(oDate.setHours(0, 0, 0, 0))) {
                this.closeSave();
                sap.m.MessageToast.show("La fecha de 'Primer Pago' debe ser mayor a la fecha actual.");
                return;
            }
            if (!moment(oDtpNciFirstPaymentDate).isValid()) {
                this.closeSave();
                sap.m.MessageToast.show("La fecha de 'Primer Pago' debe ser una fecha valida.");
                return;
            }
        }


        oTxtNciDateExpenditureDate = this.getView().getModel("oLoanRequestModel").getProperty("/GeneralLoanRequestData/ExpenditureDate");
       

        if (moment(oTxtNciDateExpenditureDate).isValid() && oTxtNciDateExpenditureDate !==undefined) {
            if (moment(oTxtNciDateExpenditureDate.setHours(0, 0, 0, 0))<=moment(oDate.setHours(0, 0, 0, 0))) {
                this.closeSave();
                sap.m.MessageToast.show("La fecha de 'Desembolso' debe ser mayor a la fecha actual.");
                return;
            }
            if (!moment(oTxtNciDateExpenditureDate).isValid()) {
                this.closeSave();
                sap.m.MessageToast.show("La fecha de 'Desembolso' debe ser una fecha valida.");
                return;
            }
        }
        ///////// Validacion de fechas



        oTxtNciMontoSolicitado = sap.ui.getCore().byId("txtNciMontoSolicitado");

        if ((!oTxtNciMontoSolicitado) || (!oTxtNciMontoSolicitado.getValue())) {

        } else {

            if (oTxtNciMontoSolicitado.getValue() !== "0.00") {

                amountRequested = parseInt(sap.ui.getCore().byId("txtNciMontoSolicitado").getValue());
                if (amountRequested > 200000) {
                    sap.m.MessageToast.show("El 'Monto Solicitado', no debe de ser mayor a $200,000.00");
                    this.closeSave();
                    return false;
                }
                if (amountRequested < 20000) {
                    sap.m.MessageToast.show("El 'Monto Solicitado', no debe de ser menor a $20,000.00");
                    this.closeSave();
                    return false;
                }

            }


        }



        jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
        oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
        oFinalModel = this.onCreate();

        /////// Modificar fechas para guardar en JSON
        ///////::: formatJSONDate deberia ser parte de un helper
        oFinalModel.GeneralLoanRequestData.StartDate = this.formatJSONDate(oFinalModel.GeneralLoanRequestData.StartDate);
        oFinalModel.GeneralLoanRequestData.FirstPaymentDate = this.formatJSONDate(oFinalModel.GeneralLoanRequestData.FirstPaymentDate);
        oFinalModel.GeneralLoanRequestData.ExpenditureDate = this.formatJSONDate(oFinalModel.GeneralLoanRequestData.ExpenditureDate);


        /////// Modificar fechas para guardar en JSON



        oLoanRequestSerializer.serialize(oFinalModel).then(function(msg) {

        
            /// TODO: Convertir en promesa, en el then:
            var oDisplayBase; //Para evitar error en databinding contra los datepickers cuando las fechas están en formato JSON
            oDisplayBase = new sap.ui.mw.DisplayBase();
            this.getView().getModel("oLoanRequestModel").oData.GeneralLoanRequestData.StartDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oLoanRequestModel").oData.GeneralLoanRequestData.StartDate));
            this.getView().getModel("oLoanRequestModel").oData.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oLoanRequestModel").oData.GeneralLoanRequestData.FirstPaymentDate));
            this.getView().getModel("oLoanRequestModel").oData.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oLoanRequestModel").oData.GeneralLoanRequestData.ExpenditureDate));
            this.closeSave();
            sap.m.MessageToast.show("Guardado.");


            //////// Habilitar boton enviar al core
            this.bAlreadySavedOnPouch = true;
            var oBtnGropuEnviarCore = sap.ui.getCore().byId("btnNciEnviarALCore");
            oBtnGropuEnviarCore.setEnabled(true);
            //////// Habilitar


        }.bind(this)).catch(function() {
          

        });

        this.closeSave();

    },
    onCreate: function() {


        var oModelLoanRequest, oModelFinal, oLinkSet, oLinkGuarantorSet, oController, oView;
        oController = this;
        oView = oController.getView();

      
        oModelLoanRequest = oView.getModel('oLoanRequestModel');
       
        oModelFinal = jQuery.extend({}, oModelLoanRequest.getProperty("/"));
        oModelFinal.LinkSet = new Array();
        oModelFinal.LinkGuarantorSet = new Array();
        oLinkSet = oModelLoanRequest.getProperty("/LinkSet/results/0");
        oLinkGuarantorSet = oModelLoanRequest.getProperty("/LinkGuarantorSet/results/0");

        if (oLinkSet.Customer.PhoneSet) {
            oLinkSet.Customer.PhoneSet = [];
        }
        if (oLinkSet.Customer.AddressSet) {
            oLinkSet.Customer.AddressSet = [];
        }
        if (oLinkSet.Customer.PersonalReferenceSet) {
            oLinkSet.Customer.PersonalReferenceSet = [];
        }
        if (oLinkSet.Customer.EmployerSet) {
            oLinkSet.Customer.EmployerSet = [];
        }
        if (oLinkSet.Customer.ImageSet) {
            oLinkSet.Customer.ImageSet = [];
        }
        if (oLinkSet.Customer.InsuranceSet) {

            delete oLinkSet.Customer['InsuranceSet'];

        }

        if (oLinkSet.Customer.IsEntityInQueue) {
            delete oLinkSet.Customer['IsEntityInQueue'];
        }



        if (sap.ui.getCore().byId("selectNciCanalDispersor").getSelectedKey()) {

            oLinkSet.GeneralLoanData.DispersionChannelId = sap.ui.getCore().byId("selectNciCanalDispersor").getSelectedKey();

        } else {
            oLinkSet.GeneralLoanData.DispersionChannelId = 1;
        }

        if (sap.ui.getCore().byId("selectNciMedioDeDispersion").getSelectedKey()) {
            oLinkSet.GeneralLoanData.DispersionMediumId = sap.ui.getCore().byId("selectNciMedioDeDispersion").getSelectedKey();

        } else {
            oLinkSet.GeneralLoanData.DispersionMediumId = 1
        }



        //////////// Modificar valor para destino del prestamo
        if (oLinkSet.IndividualLoanData.LoanDestiny !== "") {

            if (oLinkSet.IndividualLoanData.LoanDestiny.length === 1) {
                oLinkSet.IndividualLoanData.LoanDestiny = "0" + oLinkSet.IndividualLoanData.LoanDestiny;
            }

        }

        /////////////
        if (oLinkSet.Customer.BpMainData) {
            delete oLinkSet.Customer.BpMainData['RegistrationDate'];
        }
        oModelFinal.LinkSet.push(oLinkSet); //Inserta LinkSet
        oModelFinal.LinkGuarantorSet.push(oLinkGuarantorSet); //Inserta LinkGuarantorSet

        if (typeof oModelFinal.ElectronicSignatureSet !== "undefined") {

            oModelFinal.ElectronicSignatureSet = oModelFinal.ElectronicSignatureSet.results; //inserta ElectronicSignatureSet

        } else {
            oModelFinal.ElectronicSignatureSet = [];
        }



        oModelFinal.InsuranceSet = [];

        var bDeleteGuaranteeSet = false;

        if (oModelFinal.LinkGuarantorSet) {

            if (!oModelFinal.LinkGuarantorSet[0].CustomerIdCRM && !oModelFinal.LinkGuarantorSet[0].CustomerIdMD) {
                bDeleteGuaranteeSet = true;
            } else {

                if (oModelFinal.LinkGuarantorSet[0].CustomerIdCRM === "" && oModelFinal.LinkGuarantorSet[0].CustomerIdMD === "") {
                    bDeleteGuaranteeSet = true;
                } else {
                    if (oModelFinal.LinkGuarantorSet[0].Guarantor) {
                        delete oModelFinal.LinkGuarantorSet[0].Guarantor.BpMainData['RegistrationDate'];

                        if (oModelFinal.LinkGuarantorSet[0].Guarantor.AddressSet) {
                            if (oModelFinal.LinkGuarantorSet[0].Guarantor.AddressSet.results) {
                                if (oModelFinal.LinkGuarantorSet[0].Guarantor.AddressSet.results.length > 0) {
                                    delete oModelFinal.LinkGuarantorSet[0].Guarantor.AddressSet.results[0]['Latitude'];
                                    delete oModelFinal.LinkGuarantorSet[0].Guarantor.AddressSet.results[0]['Longitude'];
                                }
                            }
                        }
                    }

                }

            }

        }

        if (bDeleteGuaranteeSet) {
            delete oModelFinal['LinkGuarantorSet'];
        }


        delete oModelFinal['IsEntityInQueue'];

        
        return oModelFinal;
    },

    toStateApprove: function() {


        return function() {

            var oApproveModel, promiseApprove, oController, oModelLoanRequest, oIdOportunidad, oIdProcessType, oView;
            var oMontoPropuesto, oFrecuenciaPropuesta, oCuotaPropuesta, oPlazoPropuesto, bdLoader;
            oController = this;
            oView = oController.getView();
            //modal cargando datos

          
            oModelLoanRequest = oView.getModel('oLoanRequestModel');
            oIdOportunidad = oModelLoanRequest.getProperty('/LoanRequestIdCRM');
            oIdProcessType = oModelLoanRequest.getProperty('/ProcessType');

            /*Propuesta*/
            oMontoPropuesto = oModelLoanRequest.getProperty('/LinkSet/results/0/IndividualLoanData/ProposedAmount');
            oFrecuenciaPropuesta = oModelLoanRequest.getProperty('/LinkSet/results/0/IndividualLoanData/ProposedFrequency');
            oCuotaPropuesta = oModelLoanRequest.getProperty('/LinkSet/results/0/IndividualLoanData/ProposedFee');
            oPlazoPropuesto = oModelLoanRequest.getProperty('/LinkSet/results/0/IndividualLoanData/ProposedPeriod');
            if (oMontoPropuesto === "0.00" || oFrecuenciaPropuesta === "" || oCuotaPropuesta === "0.00" || oPlazoPropuesto === "0") {
                sap.m.MessageToast.show("Capturar obligatorios de 'Propuesta de Condiciones de Crédito'.");
                return;
            }

            bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudIndividual");
            if (sap.OData) {
                sap.OData.removeHttpClient();
            }
            bdLoader.setText("Aprobando...");
            bdLoader.open();

            //setTimeout(function() {

                 sap.ui.getCore().AppContext.bSaveApprove = true;
                 oController.saveApprove();

               /* promiseApprove = sap.ui.getCore().AppContext.myRest.read("/OpportunityApproval?loanRequestIdCRM='" + oIdOportunidad + "'&processType='" + oIdProcessType + "'", true); // servicio - consulta solicitantes sin oportunidad asignada
                promiseApprove.then(function(response) {
                    if (sap.OData) {
                        sap.OData.applyHttpClient();
                    }
                    if (response.results) {
                        if (response.results.length <= 0) {
                            sap.ui.getCore().AppContext.bSaveApprove = true; /////////// Guardar
                        } else {
                            sap.ui.getCore().AppContext.bSaveApprove = false; /////////// No Guardar
                        }
                    }
                   
                    oApproveModel = new sap.ui.model.json.JSONModel();
                    oApproveModel.setData(response);
                    oController.bindTableApprove(oApproveModel, oController);
                    bdLoader.close();
                }).catch(function() {
                    if (sap.OData) {
                        sap.OData.applyHttpClient();
                    }
                    sap.m.MessageToast.show("Se produjo un error al aprobar la oportunidad, por favor intente nuevamente. ");
                    bdLoader.close();
                  
                });*/
           // }, 0);


        };


    },


    bindTableApprove: function(oModel, oController) {
        //Middleware de componentes SAPUI5
        var  oListBase, oCurrentController, oActionBase, oDialogAdds, tblApprove;
        //Se declaran objetos de Middleware de componentes SAPUI5
        var  oCompoundFilter, tableFields, tableFieldVisibility, tableFieldDemandPopid;
        oActionBase = new sap.ui.mw.ActionBase();
        oListBase = new sap.ui.mw.ListBase();


        oCurrentController = this;

        oDialogAdds = sap.ui.getCore().byId('appDialogApproveInd');
        oDialogAdds.destroyContent();
        oDialogAdds.destroyButtons();
        //tabla de integrantes
        tableFields = [
            "Id Cliente",
            "Mensaje"
        ];
        tableFieldVisibility = [
            true,
            true
        ];
        tableFieldDemandPopid = [
            false,
            false
        ];
        oDialogAdds.addContent(oListBase.createTable("tblApprovedInd", "", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, null));

        tblApprove = sap.ui.getCore().byId("tblApprovedInd");
        tblApprove.setModel(oModel);
        tblApprove.bindAggregation("items", {
            path: "/results/",
            factory: function(_id, _context) {
                return oCurrentController.onLoadTableApprove(_context);
            },
            filters: oCompoundFilter
        });

        oDialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "sap-icon://accept", oCurrentController.successApprove.bind(this), oCurrentController));
        oDialogAdds.open();
    },


    onLoadTableApprove: function(_context) {
        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
        var oDisplayBase, itemsTemplate;
        oDisplayBase = new sap.ui.mw.DisplayBase();
        itemsTemplate = new sap.m.ColumnListItem({
            type: "Active"
        });
        itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("CustomerIdCRM")));
        itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("ErrorMessage")));

        return itemsTemplate;
    },

    successApprove: function() {
        var oCurrentDialog = sap.ui.getCore().byId("appDialogApproveInd");
        //Se destruye el contenido del dialogo y se cierra dialogo
        if (sap.ui.getCore().AppContext.bSaveApprove === true) {
            this.saveApprove();
        }
        oCurrentDialog.destroyContent();
        oCurrentDialog.destroyButtons();
        oCurrentDialog.close();
    },

    saveApprove: function() {

        var oFinalModel,oBtnGropuEnviarCore;            
        jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
        oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
        oFinalModel = this.onCreate();

        /////// Modificar fechas para guardar en JSON
        ///////::: formatJSONDate deberia ser parte de un helper
        oFinalModel.startDate = this.formatJSONDate(oFinalModel.startDate);
        oFinalModel.firstPaymentDate = this.formatJSONDate(oFinalModel.firstPaymentDate);
        oFinalModel.expenditureDate = this.formatJSONDate(oFinalModel.expenditureDate);
        oFinalModel.IsApproved = true;


        /////// Modificar fechas para guardar en JSON



        oLoanRequestSerializer.serialize(oFinalModel).then(function(msg) {

            if (this.guaranteeRelation.getCustomerIdMD() !== "") {
                oLoanRequestSerializer.relateGuaranteesToLoan(this.guaranteeRelation.getLoanRequestIdMD(), this.guaranteeRelation.getCustomerIdMD());
            }
           
            /// TODO: Convertir en promesa, en el then:
            this.closeSave();



            //////// Habilitar boton enviar al core
            this.bAlreadySavedOnPouch = true;
            oBtnGropuEnviarCore = sap.ui.getCore().byId("btnNciEnviarALCore");
            oBtnGropuEnviarCore.setEnabled(true);
            //////// Habilitar
            sap.m.MessageToast.show("Regresando a pantalla principal");
            this.backToTiles();


        }.bind(this)).catch(function(error) {
            console.log(error);
            sap.m.MessageToast.show("¡Ups! Existe un error en la red, intente más tarde");

        });

        this.closeSave();

    },

    setExtraSignature: function() {
        var txtSignature = sap.ui.getCore().byId("txtSignatureRuegoEncargo");
        var chkSignature = sap.ui.getCore().byId("chkBoxSignature");
        var selectedChk = chkSignature.getSelected();

        if (selectedChk) {
            txtSignature.setEnabled(true);
        } else {
            txtSignature.setEnabled(false);
        }
    },
    goToDocs: function(oEvent) {


        jQuery.sap.require("js.base.DocumentsBase");

        var oDocumentsBase, oInitValidateModel, oFragmentDocuments, oController;
        oController = this;
        if (oEvent.hasOwnProperty("sId")) {
            oDocumentsBase = new sap.ui.mw.DocumentsBase("oTblDocumentsCI", oEvent.getSource().sId);
            sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(false);
        } else {
            oDocumentsBase = new sap.ui.mw.DocumentsBase("oTblDocumentsCI", "");
        }

        sap.ui.getCore().byId("oPageIndividualApplication").setBusy(true);
        oFragmentDocuments = sap.ui.jsfragment("js.fragments.documents.documentsList", [oController, oDocumentsBase, oController.closeFragmentDialog.bind(oController, oDocumentsBase)]);
        oDocumentsBase.setOFragment(oFragmentDocuments);

        sap.ui.getCore().AppContext.EventBase.setObjectToCloseWithBackEvent(oFragmentDocuments)
        sap.ui.getCore().AppContext.EventBase.setFunctionBackButtonWithOpenDialog(oController.closeFragmentDialog.bind(oController, oDocumentsBase))

        oDocumentsBase.setPathEntity("/ImageSet/results");
        if (oController.getView().getModel("oLoanRequestModel").getProperty(oDocumentsBase.getPathEntity())) {
            if (oController.getView().getModel("oLoanRequestModel").getProperty(oDocumentsBase.getPathEntity()).length === 0) {
                oDocumentsBase.onFailLoadModel();
                sap.ui.getCore().byId("oPageIndividualApplication").setBusy(false);
                sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(true);
            } else {
                oInitValidateModel = oDocumentsBase.initValidateModel(oController.getView().getModel("oLoanRequestModel"));
                oInitValidateModel.then(oController.loadFragmentDocuments.bind(oController, oDocumentsBase, oFragmentDocuments));
            }
        } else {
            oDocumentsBase.onFailLoadModel();
            sap.ui.getCore().byId("oPageIndividualApplication").setBusy(false);
            sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(true);
        }

    },
    closeFragmentDialog: function(oDocumentsBase) {
        if (oDocumentsBase.getBtnTrigger() !== "") {
            sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(true);
        }
        sap.ui.getCore().AppContext.EventBase.setObjectToCloseWithBackEvent();
        oDocumentsBase.closeDialogDocuments();
    },

    loadFragmentDocuments: function(oDocumentsBase, oFragmentDocuments) {
        var loadDocumentsInFragment, oController;
        oController = this;
        loadDocumentsInFragment = oDocumentsBase.loadDataInTableDocuments(oController.getView().getModel("oLoanRequestModel"));
        loadDocumentsInFragment.then(oController.showFragmentDocument.bind(oController, oFragmentDocuments));
    },
    showFragmentDocument: function(oFragmentDocuments) {
        sap.ui.getCore().byId("oPageIndividualApplication").setBusy(false);
        oFragmentDocuments.open();
    }
});
