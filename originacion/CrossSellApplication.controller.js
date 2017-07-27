sap.ui.controller('originacion.CrossSellApplication', {
    lastTab: "MainData",
    aCrossSellProducts: {},
    onInit: function() {
        jQuery.sap.require("js.kapsel.Rest");
        jQuery.sap.require("js.base.NavigatorBase");
        jQuery.sap.require("js.forms.crosssell.Main");
        jQuery.sap.require("js.forms.crosssell.Liquidity");
        jQuery.sap.require("js.forms.crosssell.Credit");
        jQuery.sap.require("js.forms.crosssell.Guarantor");
        jQuery.sap.require("js.serialize.GeneralSerialize");
        jQuery.sap.require("js.base.ActionBase");
        jQuery.sap.require("js.base.DisplayBase");
        jQuery.sap.require("js.validations.Validator");

        jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");

        var oRouter, oNavigatorBase;
        oNavigatorBase = new sap.ui.mw.NavigatorBase();
        oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("crossSellApplication").attachMatched(this.onRouteMatched, this);
    },
    getProductDescription: function(idProduct) {
        var product = _.where(this.aCrossSellProducts, { idCRM: idProduct })
        return product[0].productName;

    },
    getCrossSellProducts: function(oEvent) {
        var _self = this;

        return new Promise(function(resolve) {
            new sap.ui.mw.FileBase().loadFile("data-map/catalogos/crossSellProducts.json")
                .then(function(aProducts) {
                    _self.aCrossSellProducts = aProducts.getProperty("/crossSellProducts");
                    resolve("OK");
                });
        });
    },
    /**
     * [onRouteMatched - get the loan request data from any of the sources]
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     * @author :Israel
     */
    onRouteMatched: function(oEvent) {
        var oArgs, oParams, oView, oController, oModel, oGeneralSerialize;
        oArgs = oEvent.getParameter("arguments");
        oView = this.getView();
        oModel = new sap.ui.model.json.JSONModel();
        oParams = {
            LoanRequestIdMD: oArgs.aplicationId
        };
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        oGeneralSerialize = new sap.ui.serialize.General("dataDB");
        oLoanRequestSerialize = new sap.ui.serialize.LoanRequest("dataDB");
        this.getCrossSellProducts();
        this.bAlreadySavedOnPouch = false;


        oGeneralSerialize.getEntityDetail(oDictionary.oDataRequest(oParams).getRequest("LoanRequestSet"), oArgs.aplicationId)
            .then(oLoanRequestSerialize.getModelReviewed.bind(oLoanRequestSerialize, "LoanRequestSet", oArgs.aplicationId, null, null))
            .then(function(oModel) {
                oView.setModel(oModel, "oViewModel")
                this.onTabSelected("MainData");
                this.setTitle(oModel);
            }.bind(this));
    },
    setTitle: function(_oModel) {
        var sChildProduct = _oModel.getProperty('/ProductID');
        var title = this.getChildProductToString(sChildProduct);
        sap.ui.getCore().byId("pCrossSell").setTitle(title);
    },
    /**
     * [onTabSelect description]
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     * @author :Israel
     */
    onTabSelect: function(oEvent) {
        this.onTabSelected(oEvent.getParameter("selectedKey").replace("itfCrossSell", ""));
    },
    /**
     * [onTabSelected description]
     * @param  {[type]} oTab [description]
     * @return {[type]}      [description]
     * @author :Israel
     */
    onTabSelected: function(oTab) {
        var oForm, oModel, fDisable;
        oForm = null;
        oModel = this.getView().getModel("oViewModel");
        fDisable = this.disableForm();

        switch (oTab) {
            case "MainData":
                oForm = new sap.ui.mw.forms.crosssell.Main();
                break;
            case "LiquidityData":
                oForm = new sap.ui.mw.forms.crosssell.Liquidity();
                break;
            case "CreditData":
                oForm = new sap.ui.mw.forms.crosssell.Credit();
                break;
            case "GuarantorData":
                oForm = new sap.ui.mw.forms.crosssell.Guarantor();
                break;
        }
        sap.ui.getCore().byId("itfCrossSell" + this.lastTab).destroyContent();
        sap.ui.getCore().byId("itfCrossSell" + oTab).destroyContent();
        sap.ui.getCore().byId("itfCrossSell" + oTab).addContent(fDisable ? oForm.createForm(this).addStyleClass("readonlyForms") : oForm.createForm(this));






        sap.ui.getCore().byId("itbCrossSell").setSelectedKey("itfCrossSell" + oTab);
        this.lastTab = oTab;


        //  sap.ui.getCore().byId("itfApplicants" + this.lastTab).destroyContent();
        // sap.ui.getCore().byId("itfApplicants" + tab).destroyContent();
        // sap.ui.getCore().byId("itfApplicants" + tab).addContent(bDisable ? oForm.createForm(this).addStyleClass("readonlyForms") : oForm.createForm(this));
        // sap.ui.getCore().byId("itbApplicants").setSelectedKey("itfApplicants" + tab);
        // this.lastTab = tab;
    },
    toStateApprove: function() {
        return function() {
            sap.ui.getCore().AppContext.bSaveApprove = false;

            var oApproveModel, promiseApprove, oController, oCrossSellApplicationModel, oIdOportunidad, oIdProcessType, oView, bdLoader;
            oController = this;
            oView = oController.getView();
            //modal cargando datos

            oCrossSellApplicationModel = oView.getModel('oViewModel');
            oIdOportunidad = oCrossSellApplicationModel.getProperty('/LoanRequestIdCRM');
            oIdProcessType = oCrossSellApplicationModel.getProperty('/ProcessType');

            /*Propuesta*/
            oMontoPropuesto = oCrossSellApplicationModel.getProperty('/LinkSet/results/0/GrpCrossSellData/RequiredAmount');
            oFrecuenciaPropuesta = oCrossSellApplicationModel.getProperty('/GeneralLoanRequestData/Frequency');
            oCuotaPropuesta = oCrossSellApplicationModel.getProperty('/LinkSet/results/0/GrpCrossSellData/FeeEnabledToPay');
            oPlazoPropuesto = oCrossSellApplicationModel.getProperty('/GeneralLoanRequestData/Term');

            if (oMontoPropuesto === "0.00" || oFrecuenciaPropuesta === "" || oCuotaPropuesta === "0.00" || oPlazoPropuesto === "0") {
                sap.m.MessageToast.show("Capturar obligatorios de 'Propuesta de Condiciones de Crédito'.");
                return;
            }

            bdLoader = sap.ui.getCore().byId("bdLoaderCrossSellApplication");
            if (sap.OData) {
                sap.OData.removeHttpClient();
            }
            bdLoader.setText("Aprobando...");
            bdLoader.open();


            //se utiliza el mismo servicio que valida por arobar en oportunidades individuales
            setTimeout(function() {
                promiseApprove = sap.ui.getCore().AppContext.myRest.read("/OpportunityApproval?loanRequestIdCRM='" + oIdOportunidad + "'&processType='" + oIdProcessType + "'", true);
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
                    console.log("================> Response - Approve Service");
                    console.log(response);
                    oApproveModel = new sap.ui.model.json.JSONModel();
                    oApproveModel.setData(response);
                    oController.bindTableApprove(oApproveModel, oController);
                    bdLoader.close();
                }).catch(function(error) {
                    if (sap.OData) {
                        sap.OData.applyHttpClient();
                    }
                    sap.m.MessageToast.show("Se produjo un error al aprobar la oportunidad, por favor intente nuevamente. ");
                    bdLoader.close();
                    console.log(error);
                });
            }, 0);
        };
    },

    bindTableApprove: function(oModel, oController) {
        //Middleware de componentes SAPUI5
        var oListBase, oCurrentController, oActionBase, oDialogAdds, tblApprove;
        //Se declaran objetos de Middleware de componentes SAPUI5
        var oCompoundFilter;
        oActionBase = new sap.ui.mw.ActionBase();
        oListBase = new sap.ui.mw.ListBase();


        oCurrentController = this;

        oDialogAdds = sap.ui.getCore().byId('appDialogCrossSellConfirm');
        oDialogAdds.destroyContent();
        oDialogAdds.destroyButtons();
        //tabla de integrantes
        var tableFields = [
            "Id Cliente",
            "Mensaje"
        ];
        var tableFieldVisibility = [
            true,
            true
        ];
        var tableFieldDemandPopid = [
            false,
            false
        ];
        oDialogAdds.addContent(oListBase.createTable("tblApproved", "", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, null));

        tblApprove = sap.ui.getCore().byId("tblApproved");
        tblApprove.setModel(oModel);
        tblApprove.bindAggregation("items", {
            path: "/results/",
            factory: function(_id, _context) {
                return oCurrentController.onLoadTableApprove(_context);
            },
            filters: oCompoundFilter
        });

        oDialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "sap-icon://accept", oCurrentController.successApprove, oCurrentController));
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

    successApprove: function(evt) {
        var oCurrentDialog = sap.ui.getCore().byId("appDialogCrossSellConfirm");
        //Se destruye el contenido del dialogo y se cierra dialogo
        if (sap.ui.getCore().AppContext.bSaveApprove === true) {
            this.saveApprove();
        }
        oCurrentDialog.destroyContent();
        oCurrentDialog.destroyButtons();
        oCurrentDialog.close();
    },
    saveApprove: function() {

        var oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
        oDisplayBase = new sap.ui.mw.DisplayBase();
        this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.StartDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.StartDate));
        this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.FirstPaymentDate));
        this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.ExpenditureDate));
        this.getView().getModel("oViewModel").setProperty("/IsApproved", true)
        var oFinalModel = this.getJSONForDeepInsert();
        oLoanRequestSerializer.serialize(oFinalModel)
            .then(
                function(msg) {


                    this.backToTiles();
                }.bind(this)
            )
            .catch(function(error) {
                console.log(error);
            });
    },



    save: function(_evt) {
        var oLoanRequestSerializer, oFinalModel, oDisplayBase;
        var oStartDate, oFirstPaymentDate, oExpenditureDate;
        var oCurrentDate = new Date();
        var oDisplayBase = new sap.ui.mw.DisplayBase();
        oCurrentDate.setHours(0, 0, 0, 0);


        _evt.getSource().setEnabled(false);
        sap.ui.getCore().AppContext.loader.show("Guardando...");

        //Se quitan horas de las fechas para evitar cambios durante las conversiones
        if (typeof this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.StartDate == "string") {
            oStartDate = oDisplayBase.retrieveJSONDate(this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.StartDate);
        }else{
            oStartDate = this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.StartDate;
        }
              
        oFirstPaymentDate = this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.FirstPaymentDate;
        oExpenditureDate = this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.ExpenditureDate;
        if (oFirstPaymentDate && moment(oStartDate).isValid()) {
            oStartDate.setHours(0, 0, 0, 0);
        }
        if (oFirstPaymentDate && moment(oFirstPaymentDate).isValid()) {
            oFirstPaymentDate.setHours(0, 0, 0, 0);
            if (oFirstPaymentDate <= oCurrentDate) {
                this.closeConfirmDialog("btnSaveCrossSell");
                sap.m.MessageToast.show("La fecha de 'Primer Pago' debe ser mayor a la fecha actual.");
                return;
            }
        }
        if (oExpenditureDate && moment(oExpenditureDate).isValid()) {
            oExpenditureDate.setHours(0, 0, 0, 0);
            if (oExpenditureDate <= oCurrentDate) {
                this.closeConfirmDialog("btnSaveCrossSell");
                sap.m.MessageToast.show("La fecha de 'Desembolso' debe ser mayor a la fecha actual.");
                return;
            }
        }

        oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
        oFinalModel = this.getJSONForDeepInsert();
        oLoanRequestSerializer.serialize(oFinalModel)
            .then(
                function(msg) {
                    oDisplayBase = new sap.ui.mw.DisplayBase();
                    this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.StartDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.StartDate));
                    this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.FirstPaymentDate));
                    this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.retrieveUTCDate(oDisplayBase.retrieveJSONDate(this.getView().getModel("oViewModel").oData.GeneralLoanRequestData.ExpenditureDate));
                    this.closeConfirmDialog("btnSaveCrossSell");
                    sap.m.MessageToast.show("Guardado.");
                    // Habilitar boton enviar al core
                    this.bAlreadySavedOnPouch = true;
                    oBtnSendToCore = sap.ui.getCore().byId("btnSendToCoreCrossSell");
                    oBtnSendToCore.setEnabled(true);
                }.bind(this)
            )
            .catch(function(error) {
                console.log(error);
            });
    },
    onMessageWarningDialogPress: function(oEvent) {
        currentController = this;
        jQuery.sap.require("sap.m.MessageBox");
        sap.m.MessageBox.warning("Los cambios no guardados se perderán. ¿Desea salir?", {
            title: "Alerta",
            actions: ["Aceptar", sap.m.MessageBox.Action.CANCEL],

            onClose: function(MessageValue) {

                if (MessageValue == "Aceptar") {
                    currentController.backToTiles();
                } else {
                    sap.ui.getCore().AppContext.Navigation.detail = true;
                }
            }
        });
    },
    backToTiles: function() {
        if (sap.ui.getCore().AppContext.flagAnnoucement) {
            sap.ui.getCore().AppContext.flagAnnoucement = false;
            this.getRouter().navTo("announcementList", {}, true);
        } else {
            window.history.go(-1);
        }
    },
    onChannelChange: function() {
        return function() {
            this.onUpdateDispersion();
        }.bind(this);
    },
    onUpdateDispersion: function(_oDispersionChannelKey) {
        var oFilterChannel, oDispersionChannel, oDispersionChannelKey, oSelectNgDispersionMedium;
        var oBinding, oItem, oView;

        oView = this.getView();
        if (_oDispersionChannelKey) {
            oDispersionChannelKey = _oDispersionChannelKey;
        } else {
            oDispersionChannel = sap.ui.getCore().byId("selCrossSellDispersionChannel");
            oDispersionChannelKey = oDispersionChannel.getSelectedKey();
        }

        oItem = new sap.ui.core.Item({
            text: "{MediumDescription}",
            key: "{MediumID}"
        });

        if (oDispersionChannelKey) { /// Verificar que el valor para el canal a buscar ya exista

            oFilterChannel = new sap.ui.model.Filter("ChannelID", sap.ui.model.FilterOperator.EQ, oDispersionChannelKey);
            oSelectNgDispersionMedium = sap.ui.getCore().byId("selCrossSellDispersionMedium").setModel(oView.getModel("dispersionModel"));
            oSelectNgDispersionMedium.bindAggregation("items", {
                path: "/results/",
                template: oItem,
                filters: oFilterChannel /////////// Pasar como filtro el ID del Canal
            });

        }
    },
    onInitializeDispersion: function() {
        // Make oDataCall
        var oTmpDispersionModel, oSeen, oToBind, oDispersionChannelsModel, oSelectCrossSellDispersionChannel, oItem, promiseReadDispersion;
        var oBinding, oItem, sFirstChannel, oView;
        oController = this;
        oView = oController.getView();
        promiseReadDispersion = sap.ui.getCore().AppContext.myRest.read("/ChannelMediumDispersionSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "'", "", false, "dispersionModel");
        promiseReadDispersion
            .then(function(response) {
                console.log("================> Response Dispersion ");
                console.log(response);
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

                oSelectCrossSellDispersionChannel = sap.ui.getCore().byId("selCrossSellDispersionChannel");
                oSelectCrossSellDispersionChannel.bindAggregation("items", {
                    path: "/",
                    template: oItem
                });

                oSelectCrossSellDispersionChannel.setModel(oDispersionChannelsModel);
                oSelectCrossSellDispersionChannel.attachChange(oController.onChannelChange());
                oController.onUpdateDispersion(sFirstChannel);

            }).catch(function(error) {
                sap.m.MessageToast.show("¡Ups! Existe un error en la red, intente más tarde");
                console.log(error);
            });
    },
    getCrossSellGuarantorCandidate: function(_entity, _sLoanReqParent, _sCustomer, _promoterID) {
        return new Promise(function(resolve) {
            jQuery.sap.require("js.serialize.crosssell.CrossSellGuarantorSerialize");
            new sap.ui.serialize.CrossSellGuarantorSerialize("dataDB", _entity)
                .reviewCrossSellGuarantorCandidates(_entity + "Set", _sLoanReqParent, _sCustomer, _promoterID)
                .then(resolve);

        });
    },
    getCrossSellAssignedGuarantor: function(_entity, _sLoanReq, _sCustomer, _promoterID, _aDataCandidate) {
        return new Promise(function(resolve) {
            jQuery.sap.require("js.serialize.crosssell.CrossSellGuarantorSerialize");
            new sap.ui.serialize.CrossSellGuarantorSerialize("dataDB", _entity)
                .reviewCrossSellAssignedGuarantor(_entity + "Set", _sLoanReq, _sCustomer, _promoterID, _aDataCandidate)
                .then(resolve);
        });
    },
    setGuarantorCandidateList: function(_aDataCandidates) {
        var currentController = this;
        return new Promise(function(resolve) {
            var oModelCrossSellGuarantorCandidates, oCandidateListTable;
            oModelCrossSellGuarantorCandidates = new sap.ui.model.json.JSONModel();
            oModelCrossSellGuarantorCandidates.setData(_aDataCandidates);
            oCandidateListTable = sap.ui.getCore().byId("listCrossSellGuarantorCandidate", "items");
            oCandidateListTable.setModel(oModelCrossSellGuarantorCandidates);
            //GuarantorCandidateName,RegistrationDate
            resolve("ok");
        });
    },
    bindGuarantorCandidateListTable: function(_context) {
        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
        var oDisplayBase, oActionBase, itemsTemplate;
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        itemsTemplate = new sap.m.ColumnListItem({
            type: "Active"
        });
        itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("GuarantorCandidateName/LastName") + " " + _context.getProperty("GuarantorCandidateName/SecondName") + " " + _context.getProperty("GuarantorCandidateName/FirstName") + " " + _context.getProperty("GuarantorCandidateName/MiddleName")));
        itemsTemplate.addCell(oDisplayBase.createText("", oDisplayBase.formatDate(_context.getProperty("RegistrationDate"), "dd.MM.yyyy")));
        itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("CustomerIdCRM")));
        return itemsTemplate;
    },
    onShowGuarantors: function() {
        var oPopupCrossSellGuarantorCandidate, bdLoader, guaranteeSerialize, oTmpGuaranteeModel, oController, oView, pCrossSellGuarantorSerialize;
        var oGenaralModel, sLoanReqParent, sLoanReq, sCustomer, oFinalCandidate;
        oController = this;
        oView = oController.getView();

        oPopupCrossSellGuarantorCandidate = sap.ui.getCore().byId("popupCrossSellSelectGuarantor");
        oPopupCrossSellGuarantorCandidate.open();

        bdLoader = sap.ui.getCore().byId("bdLoaderCrossSellApplication");
        bdLoader.setText("Cargando Avales Venta Cruzada");
        bdLoader.open();

        oGenaralModel = oView.getModel("oViewModel");
        sLoanReqParent = oGenaralModel.getProperty('/LRGeneralCrossSell/ParentLoanRequestIdCRM');
        sLoanReq = oGenaralModel.getProperty('/LoanRequestIdMD');
        sCustomer = oGenaralModel.getProperty('/LinkSet/results/0/CustomerIdCRM');

        this.getCrossSellGuarantorCandidate("GroupCrossSellGuarantorCandidate", sLoanReqParent, sCustomer, sap.ui.getCore().AppContext.Promotor)
            // .then(this.getCrossSellAssignedGuarantor.bind(this, "GroupCrossSellAssignedGuarantor", sLoanReq, sCustomer, sap.ui.getCore().AppContext.Promotor))
            .then(this.setGuarantorCandidateList.bind(this))
            .then(this.finishProcess)
            .catch(function(err) {
                sap.m.MessageToast.show("Se ha producido un error al consultar la lista de avales, por favor intente nuevamente. ");
                console.log(err);
                bdLoader.close();
            });

    },
    finishProcess: function() {
        bdLoader = sap.ui.getCore().byId("bdLoaderCrossSellApplication");
        bdLoader.close();
    },
    setGuarantor: function(oEvent) {

        var oPopUpCossSellSelectGuarantor,
            bIsTrueSet, oModel,
            oLoanRequestSerializer, oController, oView;
        var sloanRequestIdMD, sloanRequestIdCRM, sWholeName;
        var iControlListsResult, iRiskLevel, iSemaphoreResultFilters;

        oController = this;
        oView = oController.getView();
        oPath = oEvent.getParameters().listItem.getBindingContext().sPath;
        oSelectedRow = oEvent.oSource.getModel().getProperty(oPath);
        sWholeName = oSelectedRow.GuarantorCandidateName.FirstName + " " + oSelectedRow.GuarantorCandidateName.MiddleName + " " + oSelectedRow.GuarantorCandidateName.LastName + " " + oSelectedRow.GuarantorCandidateName.SecondName;
        //Se lanza mensaje de confirmación
        jQuery.sap.require("sap.m.MessageBox");
        sap.m.MessageBox.confirm("Se asignará/reemplazará el aval " + sWholeName + " a la solicitud. ¿Desea Continuar?", {
            title: "Aviso",
            actions: ["Aceptar", sap.m.MessageBox.Action.CANCEL],

            onClose: function(MessageValue) {

                if (MessageValue == "Aceptar") {
                    // if (MessageValue == sap.m.MessageBox.Action.OK) {
                    oModel = oView.getModel("oViewModel");
                    sloanRequestIdCRM = oModel.getProperty("/LoanRequestIdCRM");
                    var oGuarantorSet = {
                        GuarantorName: {
                            FirstName: oSelectedRow.GuarantorCandidateName.FirstName,
                            MiddleName: oSelectedRow.GuarantorCandidateName.MiddleName,
                            LastName: oSelectedRow.GuarantorCandidateName.LastName,
                            SecondName: oSelectedRow.GuarantorCandidateName.SecondName
                        },
                        CustomerIdCRM: oSelectedRow.CustomerIdCRM,
                        LoanRequestIdCRM: sloanRequestIdCRM, //Se asigna a la Oportunidad hija
                        CollaboratorID: sap.ui.getCore().AppContext.Promotor,
                        FilterResults: {
                            InsuranceAmount: "",
                            ControlListsResult: 0,
                            RiskLevel: 0,
                            SavingsAmount: "",
                            DispersionMediumId: "",
                            DispersionChannelId: "",
                            SemaphoreResultFilters: 0
                        }
                    };

                    /////////////////////////// Agregado para el modelo de Pouch
                    oModel.setProperty("/GroupCrossSellAssignedGuarantorSet", oGuarantorSet);
                    //show on screen
                    sap.ui.getCore().byId("txtCrossSellIdAval").setValue(oSelectedRow.CustomerIdCRM);
                    sap.ui.getCore().byId("txtCrossSellNombreDelAval").setValue(oSelectedRow.GuarantorCandidateName.LastName + " " + oSelectedRow.GuarantorCandidateName.SecondName + " " + oSelectedRow.GuarantorCandidateName.FirstName + " " + oSelectedRow.GuarantorCandidateName.MiddleName);
                    //serialize to pouch
                    oPopupNciSeleccionarAval = sap.ui.getCore().byId("popupCrossSellSelectGuarantor");
                    oPopupNciSeleccionarAval.close();
                }
            }
        });
    },
    searchCrossSellGuarantorCandidate: function(evt) {
        var aFilters, txtSeachFilter, list, binding, filter, filter2, filter3, filter4;
        txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            filter = new sap.ui.model.Filter("GuarantorCandidateName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter2 = new sap.ui.model.Filter("GuarantorCandidateName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter3 = new sap.ui.model.Filter("GuarantorCandidateName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter4 = new sap.ui.model.Filter("GuarantorCandidateName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            aFilters = new sap.ui.model.Filter([filter, filter2, filter3, filter4]);
        }

        list = sap.ui.getCore().byId("listCrossSellGuarantorCandidate");
        binding = list.getBinding("items");
        binding.filter(aFilters);
    },
    closeCrossSellGuarantortDialog: function() {
        var oPopupCrossSellGuarantorCandidate;
        oPopupCrossSellGuarantorCandidate = sap.ui.getCore().byId("popupCrossSellSelectGuarantor");
        oPopupCrossSellGuarantorCandidate.close();
    },
    getParentProductToString: function(_sParent) {
        var sPatentToString;
        switch (_sParent) {
            case "C_GRUPAL_CM":
                sPatentToString = "CRÉDITO MUJER";
                break;
            case "C_GRUPAL_CCR":
                sPatentToString = "CRÉDITO COMERCIANTE";
                break;
        }
        return sPatentToString;
    },
    getChildProductToString: function(_sChild) {
        var sChildToString;
        switch (_sChild) {
            case "C_IND_CA":
            case "C_IND_CA_CCR":
                sChildToString = "Crédito Adicional";
                break;
            case "C_IND_CCM":
            case "C_IND_CCM_CCR":
                sChildToString = "Crédito Crece y Mejora";
                break;
        }
        return sChildToString;
    },
    openConfirmDialog: function(_evt) {
        var dialogConfirm, oDisplayBase, oActionBase;

        dialogConfirm = sap.ui.getCore().byId('appDialogCrossSellConfirm');
        dialogConfirm.destroyContent();
        dialogConfirm.destroyButtons();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();

        // if (_evt.getSource().getText() === "Guardar") {
        _evt.getSource().setEnabled(false);
        if (_evt.getSource().getId() === "btnSaveCrossSell") {
            dialogConfirm.addContent(oDisplayBase.createLabel("", "¿Desea guardar?"));
            dialogConfirm.addButton(oActionBase.createButton("btnAceptSaveCrossSell", "Aceptar", "Emphasized", "", this.save, this));
        } else {
            dialogConfirm.addContent(oDisplayBase.createLabel("", "¿Desea mandar la información al core?"));
            dialogConfirm.addButton(oActionBase.createButton("btnAceptSendToCoreCrossSell", "Aceptar", "Emphasized", "", this.sendToCore, this));
        }
        dialogConfirm.addButton(oActionBase.createButton("", "Cancelar", "Default", "", this.closeConfirmDialog, this));
        dialogConfirm.open();


    },
    sendToCore: function(_evt) {
        jQuery.sap.require("js.buffer.loanRequest.LoanRequestBuffer");
        var oCrossSellApplicationModel, oCrossSellApplicationModelValidator, sRequestDescription, oLoanRequestBuffer, oLoanRequestSync, sloanRequestIdMD;

        _evt.getSource().setEnabled(false);
        sap.ui.getCore().AppContext.loader.show("Registrando...");

        jQuery.sap.require("js.validations.crosssell.Validator", "js.validations.Validator");
        // jQuery.sap.require("js.validations.Validator");
        jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
        jQuery.sap.require("js.sync.loanRequest.LoanRequestSynchronizer");


        oCrossSellApplicationModel = this.getView().getModel("oViewModel");

        oCrossSellApplicationModelValidator = new sap.ui.validations.crosssell(oCrossSellApplicationModel);

        oCrossSellApplicationModelValidator.init();
        if (oCrossSellApplicationModelValidator.validated) {

            console.log("--> Validaciones correctas");

            sRequestDescription = this.getProductDescription(oCrossSellApplicationModel.getProperty("/ProductID"));
            sLoanRequestIdMD = oCrossSellApplicationModel.getProperty("/LoanRequestIdMD");

            oRequest = {
                requestMethod: "POST",
                requestUrl: "/LoanRequestSet",
                requestBodyId: sLoanRequestIdMD,
                requestStatus: "Initial",
                requestConfirmed: false,
                requestDescription: sRequestDescription,
                id: sLoanRequestIdMD,
                productID: oCrossSellApplicationModel.getProperty("/ProductID"),
                NotificationID: sap.ui.getCore().AppContext.NotificationID /// Guardar NotificationID (Para notificaciones con error de CRM)

            };
            jQuery.sap.require("sap.ui.buffer.LoanRequest");
            oLoanRequestBuffer = new sap.ui.buffer.LoanRequest("syncDB", "LoanRequest");
            oLoanRequestBuffer.postRequest(oRequest);

            oLoanRequestSync = new sap.ui.sync.LoanRequest("dataDB", "syncDB");
            oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");
            oLoanRequestSerializer.updateFlagEntitityInQueue(sLoanRequestIdMD, true)
                .then(function(sLoanRequestIdMD, oLoanRequestSync, result) {
                    /////// Eliminar Business Error
                    oLoanRequestSync.deleteBusinessError(sLoanRequestIdMD).then(
                        function(result) {
                            //// Agregar id de notificación a notificaciones
                            ///  con error para que intente retry automático al iniciar la sincronización
                            this.closeConfirmDialog("btnSendToCoreCrossSell");
                            sap.m.MessageToast.show("Solicitud preparada para enviar a Integra.");
                            this.backToTiles();
                        }.bind(this)
                    );
                }.bind(this, sLoanRequestIdMD, oLoanRequestSync));



        } else {
            if (oCrossSellApplicationModelValidator.currentTab && oCrossSellApplicationModelValidator.isTab) {
                this.onTabSelected(oCrossSellApplicationModelValidator.currentTab);
                setTimeout(function() {
                    var oValidatorForm = new sap.ui.validations.Validator();
                    oValidatorForm.validate("itfCrossSell" + oCrossSellApplicationModelValidator.currentTab);
                }, 0)


                // var oValidatorForm = new sap.ui.validations.Validator();

                // var oValidatorForm = new sap.ui.validations.Validator();
                // oValidatorForm.validate("itfApplicants" + oCrossSellApplicationModelValidator.currentTab);
            }
            console.log("--> Validaciones incorrectas");
        }


        this.closeConfirmDialog("btnSendToCoreCrossSell");


    },
    closeConfirmDialog: function(_evt) {

        var dialogConfirm = sap.ui.getCore().byId('appDialogCrossSellConfirm');

        if (typeof _evt === "object") {
            if (_evt.getSource().getParent().getButtons().some(element => "btnAceptSaveCrossSell" === element.getId())) {
                sap.ui.getCore().byId("btnSaveCrossSell").setEnabled(true);
            } else {
                sap.ui.getCore().byId("btnSendToCoreCrossSell").setEnabled(true);
            }
        } else {
            sap.ui.getCore().byId(_evt).setEnabled(true);
        }

        dialogConfirm.close();
        sap.ui.getCore().AppContext.loader.close();
    },


    /**
      * [getJSONForDeepInsert  Procesa el modelo asociado a la vista, generando un nuevo modelo JSON con el formato requerido 
            para ejecturar un deep insert contra el servicios GW POST de la colección LoanRequest.]
      * @return {[Object]}     [Objeto JSON con formato para deep insert.]
      */
    getJSONForDeepInsert: function() {


        var oModelLoanRequest, oModelFinal, oLinkSet, oController, oView, oDisplayBase;
        oController = this;
        oView = oController.getView();
        oDisplayBase = new sap.ui.mw.DisplayBase();

        oModelLoanRequest = oView.getModel('oViewModel');
        oModelFinal = jQuery.extend({}, oModelLoanRequest.getProperty("/"));
        oModelFinal.LinkSet = new Array();
        oLinkSet = oModelLoanRequest.getProperty("/LinkSet/results/0");

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

        if (oLinkSet.Customer.BpMainData) {
            delete oLinkSet.Customer.BpMainData['RegistrationDate'];
        }
        oModelFinal.LinkSet.push(oLinkSet); //Agrega LinkSet


        delete oModelFinal['GroupRequestData'];
        delete oModelFinal['LinkGuarantorSet'];
        delete oModelFinal['InsuranceSet'];
        delete oModelFinal['ImageSet'];
        delete oModelFinal['LoanRequestIdCRMParent'];
        delete oModelFinal['SubsequenceType'];
        if (oModelFinal.LinkSet.length > 0) {
            delete oModelFinal.LinkSet[0]['GroupLoanData'];
            delete oModelFinal.LinkSet[0]['IndividualLoanData'];
            delete oModelFinal.LinkSet[0]['AvailableToFilter'];
        }

        /////// Modificar fechas para guardar en JSON
        oModelFinal.GeneralLoanRequestData.StartDate = oDisplayBase.formatJSONDate(oModelFinal.GeneralLoanRequestData.StartDate);
        oModelFinal.GeneralLoanRequestData.FirstPaymentDate = oDisplayBase.formatJSONDate(oModelFinal.GeneralLoanRequestData.FirstPaymentDate);
        oModelFinal.GeneralLoanRequestData.ExpenditureDate = oDisplayBase.formatJSONDate(oModelFinal.GeneralLoanRequestData.ExpenditureDate);


        console.log(oModelFinal);
        return oModelFinal;
    },
    setSemaphore: function(_sSemaphore, oSemaforo) {
        //posibles valores _sSemaphore
        //"iconCrossSellSemaphoreMain"
        //"iconCrossSellSemaphoreGuarantor"
        if (sap.ui.getCore().byId(_sSemaphore)) {
            var semaphoreIcon = sap.ui.getCore().byId(_sSemaphore);
            switch (oSemaforo) {
                case undefined:
                    semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                    semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                    semaphoreIcon.addStyleClass('semaphoreInitial');
                    break;
                case 0:
                    semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                    semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                    semaphoreIcon.addStyleClass('semaphoreInitial');
                    break;

                case 1:
                    semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                    semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                    semaphoreIcon.addStyleClass('semaphoreInitial');
                    break;
                case 2:
                    semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                    semaphoreIcon.removeStyleClass('semaphoreInitial');
                    semaphoreIcon.addStyleClass('semaphoreLevelGreen');
                    break;
                case 3:
                    semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                    semaphoreIcon.removeStyleClass('semaphoreInitial');
                    semaphoreIcon.addStyleClass('semaphoreLevelRed');
                    break;
                default:
                    semaphoreIcon.removeStyleClass('semaphoreLevelRed');
                    semaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                    semaphoreIcon.addStyleClass('semaphoreInitial');
                    break;
            }
        }
    },

    disableForm: function() {
        var fDisable;
        if (this.getView().getModel("oViewModel").getProperty("/IsEntityInQueue") ||
            this.getView().getModel("oViewModel").getProperty("/GeneralLoanRequestData/StatusId") !== "E0007" ||
            this.getView().getModel("oViewModel").getProperty("/IsApproved")) {
            this.setFooterBarEnabled(false);
            fDisable = true;
        } else {
            fDisable = false;
            this.setFooterBarEnabled(true);
        }
        return fDisable;
    },

    setFooterBarEnabled: function(_enabled) {
        sap.ui.getCore().byId("btnSaveCrossSell").setEnabled(_enabled);
        if (this.bAlreadySavedOnPouch)
            sap.ui.getCore().byId("btnSendToCoreCrossSell").setEnabled(true);
        else
            sap.ui.getCore().byId("btnSendToCoreCrossSell").setEnabled(false);
    },
    getDestinyModel: function() {
        return new Promise(function(resolve) {
            new sap.ui.mw.FileBase()
                .loadFile("data-map/catalogos/destinoPrestamo_C_IND_CCM.json")
                .then(function(oDataDestiny) {
                    resolve(oDataDestiny);
                })
        });
    },
    getFrecuencyModel: function(_product) {
        var sFrequencyModel;
        switch (_product) {
            case "C_IND_CA":
                sFrequencyModel = "data-map/catalogos/frecuencia_C_IND_CM_CA.json";
                break;
            case "C_IND_CCM":
                sFrequencyModel = "data-map/catalogos/frecuencia_C_IND_CM_CCM.json";
                break;
            case "C_IND_CA_CCR":
                sFrequencyModel = "data-map/catalogos/frecuencia_C_IND_CCR_CA.json";
                break;
            case "C_IND_CCM_CCR":
                sFrequencyModel = "data-map/catalogos/frecuencia_C_IND_CCR_CCM.json";
                break;
        }
        return new Promise(function(resolve) {
            new sap.ui.mw.FileBase()
                .loadFile(sFrequencyModel)
                .then(function(oDataFrecuency) {
                    resolve(oDataFrecuency);
                })
        });
    }
});
