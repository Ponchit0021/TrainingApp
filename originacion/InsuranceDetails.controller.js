sap.ui.controller('originacion.InsuranceDetails', {
    isError: false, //Synchronization Error
    notificationId: "", //My Pending Id 
    imageID: "", //Document's Id Ex. CAF or CAR
    isPending: false, //My pending flag
    isPendingRead: false, //My pending's read validation, after document photo was taken and saved.
    activateLongListDocuments: false, //onDocuments
    openFromNotifications: false, //onDocuments
    oMessage: "", //General toast message
    fragmentBeneficiary: "",
    /**
     * [getInsuranceSerialize description]
     * @param  {[type]} _oDB [description]
     * @return {[type]}      [description]
     * author: israel
     */
    getInsuranceSerialize: function(_oDB) {
        jQuery.sap.require("js.serialize.insurance.InsuranceSerialize");
        return new sap.ui.serialize.Insurance(_oDB);
    },
    /**
     * [getLoanRequestSerialize description]
     * @param  {[type]} _oDB [description]
     * @return {[type]}      [description]
     * author: israel
     */
    getLoanRequestSerialize: function(_oDB) {
        jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
        return new sap.ui.serialize.LoanRequest(_oDB);
    },
    /**
     * [onInit description]
     * @return {[type]} [description]
     * author: israel
     */
    onInit: function() {
        
        jQuery.sap.require("js.kapsel.Rest");
        jQuery.sap.require("js.base.NavigatorBase");
        var oRouter, oController;
        oController = this;
      
        this.getView().setModel(new sap.ui.model.json.JSONModel("data-map/catalogos/relationships.json"), "relationships");


        oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
        oRouter.getRoute("insuranceDetails").attachMatched(oController.onRouteMatched, oController);
    },
    /**
     * [onRouteMatched description]
     * @param  {[type]} oEvt [description]
     * @return {[type]}      [description]
     * author: israel
     */
    onRouteMatched: function(oEvt) {
        var oArgs, oView, oController, oSerializedModelCustomer, oSerializedModelInsurance;
        oController = this;
        oArgs = oEvt.getParameter("arguments");
        oView = oController.getView();
        oController.isPending = false;
        oController.isPendingRead = false;
        oController.activateLongListDocuments = true;
        oController.openFromNotifications = false;
        oController.imageID = "";
        oController.oMessage = "";
        oController.fragmentBeneficiary = "";

        //origen 
        if (oEvt.getParameter("arguments")["?query"]) {

            if (oEvt.getParameter("arguments")["?query"].source === "1") {
                //error de negocio
                oController.isError = true;
                oController.isPending = false;
                oController.notificationId = oEvt.getParameter("arguments")["?query"].notificationId;
            } else if (oEvt.getParameter("arguments")["?query"].source === "2") {
                //mis pendientes
                oController.isError = false;
                oController.isPending = true;
                oController.notificationId = oEvt.getParameter("arguments")["?query"].notificationID;
                oController.imageID = oEvt.getParameter("arguments")["?query"].imageID;
            } else {
                //error otro
                oController.isError = false;
                oController.isPending = false;
            }
        } else {
            //dashboard
            oController.isError = false;
            oController.isPending = false;
        }

        oSerializedModelCustomer = oController.getInsuranceSerialize("dataDB");
        oSerializedModelCustomer.getCustomerDetail("LoanRequestSet", oArgs)
            .then(function(oModel) {
                oView.setModel(oModel, "CustomerDetailsModel");
                oSerializedModelInsurance = oController.getInsuranceSerialize("dataDB");
                oSerializedModelInsurance.getInsuranceDetail("InsuranceSet", oArgs)
                    .then(function(oModel) {
                        oView.setModel(oModel, "InsuranceDetailsModel");
                        if (oController.onCycloEstatusValidation(
                                oView.getModel("CustomerDetailsModel").getProperty("/results/0/Customer/BpMainData/AccumulatedCycle"),
                                oView.getModel("CustomerDetailsModel").getProperty("/results/0/LoanRequest/GeneralLoanRequestData/StatusId"),
                                oView.getModel("CustomerDetailsModel").getProperty("/results/0/LoanRequest/GeneralLoanRequestData/InsuranceMinimumCycle"))) {
                            //se bloquea el módulo
                            oView.getModel("InsuranceDetailsModel").setProperty("/results/0/isEntityInQueue", true);
                            sap.m.MessageToast.show(oController.oMessage);
                        } else {
                            //se inyecta manualmente R9 siempre es pago diferido
                            oView.getModel("InsuranceDetailsModel").setProperty("/results/0/InsurancePaymentID", "001");
                            oController.isInQueue(oModel.getProperty("/results/0/InsuranceIdMD"));
                            if (oController.isPending) {
                                //proviene de mis pendietes permite captura de imagenes
                                oController.onDocuments("");
                            } else {
                                //proviene de dashboard o del error
                            }
                        }
                    });
            });
        sap.ui.getCore().byId("itbInsuranceApplication").setSelectedKey("itfInsurance1");
    },
    selectIconTabBarFilter: function(oEvt) {
        //Sí la modalidad es Individual se permite unicamente la creación de un Beneficiario
        if (oEvt.getParameter("key") === "itfInsurance2") {
            if (sap.ui.getCore().byId("slInsModalidad").getSelectedKey() === "001") {
                var oListBeneficiary = sap.ui.getCore().byId("tblListBeneficiary");
                var oBeneficiaries = oListBeneficiary.getBindingInfo("items").binding.getCurrentContexts();
                if (!oBeneficiaries.length) {
                    return;
                }
                oBeneficiaries = this._onFindBeneficiaryType(oBeneficiaries, "Z0001100");
                if (oBeneficiaries) {
                    new sap.ui.mw.PopupBase().createMessageBox("Advertencia",
                        "Ha seleccionado la modalidad individual y existe un asegurado familiar anteriormente registrado.\n¿Desea eliminar el registro?", null,
                        this.onModalityIndividualConfirmed.bind(this, oBeneficiaries));
                }
            }
        }
    },
    //Not used in phase 3 and 4. The only kind of payment accepted is "Pago Diferido"
    changeKindOfPayment: function() {},
    optionalInsurance: function() {},
    changeInsuranceTipoBen: function() {},
    /**
     * [openFormBeneficiary description]
     * @param  {[type]} evt [description]
     * @return {[type]}     [description]
     * author: jesús
     */
    openFormBeneficiary: function(evt) {
        var oJsonModel, oBpCycle, oMinCycle, oInsuranceType, oShowFragment, oController;
        oController = this;
        if (evt.sId === "press") { //Proviene del botón "Agregar"
            oBpCycle = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/Customer/BpMainData/AccumulatedCycle");
            oMinCycle = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/LoanRequest/GeneralLoanRequestData/InsuranceMinimumCycle");
            oInsuranceType = this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceOptional");
            oMinCycle = parseInt(oMinCycle);

            //Valida el ciclo padre del integrante, ciclo padre minimo del producto y tipo de seguro
            if (oInsuranceType === false) {
                if (oBpCycle >= parseInt(oMinCycle)) {
                    oShowFragment = true;
                    //Valida el tipo de beneficiario seleccionado
                    if (!this._onValidateBeneficiarySelected()) {
                        return;
                    }
                } else {
                    oShowFragment = false;
                    sap.m.MessageToast.show("Lo sentimos, no cumple con los requisitos para seleccionar un 'Seguro Básico'.");
                }
            } else {
                oShowFragment = true;
                //Valida el tipo de beneficiario seleccionado
                if (!this._onValidateBeneficiarySelected()) {
                    return;
                }
            }
        } else {
            //Proviene de la lista
            oShowFragment = true;
            oJsonModel = this.getView().getModel("InsuranceDetailsModel").getProperty(
                evt.getParameter("listItem").getBindingContext("InsuranceDetailsModel").getPath());
        }

        if (oShowFragment) {
            var oFragment = sap.ui.jsfragment("js.forms.insurance.Beneficiary", this);
            if (oJsonModel) {
                oFragment.getModel().setData(oJsonModel, true);
            }

            this.closeGenericFragment(oFragment, oController.onCancel.bind(this, "", oFragment));
            oFragment.setModel(this.getView().getModel("relationships"), "relationsBen");
            oController.fragmentBeneficiary = oFragment;
            oFragment.open();
        }
    },


    /**
     * [addBeneficiary description]
     * author: jesús
     */
    addBeneficiary: function(oEvt) {
        var sPath = "/results/0/InsuranceBeneficiarySet/results/",
            oSource = oEvt.getSource();
        sap.ui.getCore().AppContext.EventBase.setFunctionBackButtonWithOpenDialog();

        //Valida campos obligatorios
        if (sap.ui.getCore().byId("inputFirstName").getValueState() !== "Error" && sap.ui.getCore().byId("inputLastName").getValueState() !== "Error" && sap.ui.getCore().byId("inputSecondName").getValueState() !== "Error" && sap.ui.getCore().byId("inputSecondLastName").getValueState() !== "Error") {
            if (!this._onValidateFormBeneficiary(oSource.getModel())) {
                return;
            }
        } else {
            return;
        }

        if (sap.ui.getCore().byId("tblListBeneficiary").getSelectedContextPaths().length !== 0) { //Popup invocado desde el listado
            sPath = sap.ui.getCore().byId("tblListBeneficiary").getSelectedContextPaths() + "/";
            var oBenGlobal = this.getView().getModel("InsuranceDetailsModel").getProperty(sPath),
                oBenPopup = oSource.getModel().getData();
            oBenPopup.BeneficiaryName = this.setNameToUpperCase(oBenPopup.BeneficiaryName);
            //validación tipo de beneficiario
            if (oBenPopup.BeneficiaryType === "1" || oBenPopup.BeneficiaryType === "00001100") {
                oBenPopup.BeneficiaryType = "00001100";
            } else {
                oBenPopup.BeneficiaryType = "Z0001100";
            }

            $.extend(true, oBenGlobal, oBenPopup); //Realiza Merge
            this.getView().getModel("InsuranceDetailsModel").setProperty(sPath, oBenGlobal, null, true);
        } else { //Popup invocado por el botón Añadir
            var oArray = this.getView().getModel("InsuranceDetailsModel").getProperty(sPath);
            if (!oArray) {
                oArray = [];
            }
            //generación de InsuranceBeneficiaryIdMD
            var oIdentifierBase = this.getIdMD("dataDB");
            var oId = oIdentifierBase.createId();
            var oModelGeneral = this.getView().getModel("CustomerDetailsModel");

            //se inyectan propiedades al InsuranceBeneficiary
            oSource.getModel().setProperty("/InsuranceBeneficiaryIdMD", oId);
            oSource.getModel().setProperty("/CustomerIdCRM", oModelGeneral.getProperty("/results/0/CustomerIdCRM"));
            oSource.getModel().setProperty("/LoanRequestIdCRM", oModelGeneral.getProperty("/results/0/LoanRequestIdCRM"));
            oSource.getModel().setProperty("/CollaboratorID", oModelGeneral.getProperty("/results/0/CollaboratorID"));
            oSource.getModel().setProperty("/InsuranceIdMD", oModelGeneral.getProperty("/results/0/InsuranceIdMD"));

            //se guardan datos generales en la entidad ImageSet
            //ID0
            oSource.getModel().setProperty("/ImageSet/0/InsuranceBeneficiaryIdMD", oId);
            oSource.getModel().setProperty("/ImageSet/0/CustomerIdCRM", oModelGeneral.getProperty("/results/0/CustomerIdCRM"));
            oSource.getModel().setProperty("/ImageSet/0/CustomerIdMD", oModelGeneral.getProperty("/results/0/CustomerIdMD"));
            oSource.getModel().setProperty("/ImageSet/0/LoanRequestIdCRM", oModelGeneral.getProperty("/results/0/LoanRequestIdCRM"));
            oSource.getModel().setProperty("/ImageSet/0/LoanRequestIdMD", oModelGeneral.getProperty("/results/0/LoanRequestIdMD"));
            oSource.getModel().setProperty("/ImageSet/0/InsuranceIdMD", oModelGeneral.getProperty("/results/0/InsuranceIdMD"));
            oSource.getModel().setProperty("/ImageSet/0/CollaboratorID", oModelGeneral.getProperty("/results/0/CollaboratorID"));
            //ID0
            oSource.getModel().setProperty("/ImageSet/1/InsuranceBeneficiaryIdMD", oId);
            oSource.getModel().setProperty("/ImageSet/1/CustomerIdCRM", oModelGeneral.getProperty("/results/0/CustomerIdCRM"));
            oSource.getModel().setProperty("/ImageSet/1/CustomerIdMD", oModelGeneral.getProperty("/results/0/CustomerIdMD"));
            oSource.getModel().setProperty("/ImageSet/1/LoanRequestIdCRM", oModelGeneral.getProperty("/results/0/LoanRequestIdCRM"));
            oSource.getModel().setProperty("/ImageSet/1/LoanRequestIdMD", oModelGeneral.getProperty("/results/0/LoanRequestIdMD"));
            oSource.getModel().setProperty("/ImageSet/1/InsuranceIdMD", oModelGeneral.getProperty("/results/0/InsuranceIdMD"));
            oSource.getModel().setProperty("/ImageSet/1/CollaboratorID", oModelGeneral.getProperty("/results/0/CollaboratorID"));

            //Set name to uppercase
            oSource.getModel().getData().BeneficiaryName = this.setNameToUpperCase(oSource.getModel().getData().BeneficiaryName);
            oArray.push(oSource.getModel().getData());
            this.getView().getModel("InsuranceDetailsModel").setProperty(sPath, oArray, null, true);
        }
        oSource.getParent().close().destroy(true);
        sap.ui.getCore().byId("tblListBeneficiary").removeSelections();
    },
    /**
     * [onCancel description]
     * @return {[type]} [description]
     * author: jesús
     */
    onCancel: function(oEvent, oFragment) {

        if (oEvent !== "") {
            this.close().destroy(true);
        } else {
            oFragment.close().destroy(true);
        }
        sap.ui.getCore().AppContext.EventBase.setObjectToCloseWithBackEvent();
        sap.ui.getCore().byId("tblListBeneficiary").removeSelections();
    },
    _onDeleteBeneficiary: function(oEvt) {
        var oContext = oEvt.getSource()._getBindingContext("InsuranceDetailsModel");
        new sap.ui.mw.PopupBase().createMessageBox("Confirmación", "¿Desea eliminar el registro?", null,
            this.onConfirmDeleteBeneficiary.bind(this, oContext));
    },
    onConfirmDeleteBeneficiary: function(oData, sAction) {
        if (sAction !== "Aceptar") {
            return;
        }
        this._onRunRemoveBeneficiaryeficiary(oData.getPath(), oData.getModel());
    },
    onModalityIndividualConfirmed: function(oData, sAction) {
        if (sAction === "Aceptar") {
            this._onRunRemoveBeneficiaryeficiary(oData.getPath(), oData.getModel());
        } else {
            sap.ui.getCore().byId("itbInsuranceApplication").setSelectedKey("itfInsurance1");
        }
    },
    /**
     * [saveInsurance - alamacena la infromación en PouchDB]
     * @return {[type]} [description]
     * author: israel
     */
    saveInsurance: function() {
        var oController = this;
        new sap.ui.mw.PopupBase().createMessageBox("Guardar Seguro", "¿Desea guardar?", null, oController.onConfirmationSave.bind(oController));
    },
    /**
     * [sendToCore - enviar al core, en lista las peticiones a ser enviadas al backend  ]
     * @return {[type]} [description]
     * author: israel
     */
    sendToCore: function() {
        var oController = this;
        new sap.ui.mw.PopupBase().createMessageBox("Enviar al Core", "¿Desea enviar la información a Integra?", null, oController.onConfirmationSendToCore.bind(oController));
    },
    /**
     * [onFormatDatePicker description]
     * @param  {[type]} oValue [description]
     * @return {[type]}        [description]
     * author: jesús
     */
    onFormatDatePicker: function(oValue) {
        if (!oValue) {
            return;
        }
        return new Date(oValue);
    },
    /**
     * [onChangeGender description]
     * @param  {[type]} oEvt [description]
     * @return {[type]}      [description]
     * author: jesús
     */
    onChangeGender: function(oEvt) {
        this.getModel().setProperty("/BeneficiaryGenderID", oEvt.getSource().getSelectedItem().getProperty("key")); //Actualiza valor en el modelo del Dialog
        oEvt.getSource().removeStyleClass("selectErrorValueState");
    },
    /**
     * [onChangeRelationship description]
     * @param  {[type]} oEvt [description]
     * @return {[type]}      [description]
     * author: jesús
     */
    onChangeRelationship: function(oEvt) {
        this.getModel().setProperty("/BeneficiaryRelationship", oEvt.getSource().getSelectedItem().getProperty("key")); //Actualiza valor en el modelo del Dialog
        oEvt.getSource().removeStyleClass("selectErrorValueState");
    },
    changeInsuranceModal: function(oEvt) {
        this.getView().getModel("InsuranceDetailsModel").setProperty("/results/0/InsuranceModalityID", oEvt.getSource().getSelectedItem().getProperty("key"));
    },
    /**
     * [onChangeDatePicker description]
     * @param  {[type]} oEvt [description]
     * @return {[type]}      [description]
     * author: jesús
     */
    onChangeDatePicker: function(oEvt) {
        var sValue = oEvt.getParameters("value");
        if (!sValue.valid) {
            return;
        }

        var _iAge = moment().diff(moment(sValue.value.split('T')[0], "YYYY-MM-DD"), "months"),
            _iMaxAge = this.getModel().getProperty("/BeneficiaryType") === "00001100" ? 840 : 839;
        //216 meses = 18, 840 meses =  70 años ó 839 meses = 69 años y 11 meses
        if (_iAge < 216.0226444440711 || _iAge > _iMaxAge) {
            sap.m.MessageToast.show("No se cumple con la edad requerida.");
            oEvt.getSource().setValueState('Error');
            return;
        }
    
        //Formato de fecha: "2009-02-28T01:19:06.000Z"  to "1987-09-23T12:00:00"
        this.getModel().setProperty("/BeneficiaryBirthday", sValue.value.split('.')[0]);
    },
    /**
     * [signatureInsurance - Se invoca al fragment de la firma y retorna un dialogo]
     * @return {[type]} [description]
     * author: israel
     */
    signatureInsurance: function() {
        var oController;
        oController = this;

        if (!oController.oDialogSignature) {
            oController.oDialogSignature = sap.ui.jsfragment("js.fragments.signature.Signature", oController);
            oController.getView().addDependent(oController.oDialogSignature);
        }
        oController.oDialogSignature.open();
    },
    _onFormatBeneficiaryType: function(oValue) {
        if (!oValue) {
            return;
        }
        return "Tipo: " + sap.ui.getCore().byId("slTipoAsignacion").getItemByKey(oValue).getText();
    },
    _onFormatRelationship: function(oValue) {
        if (!oValue) {
            return;
        }
        var oJson = this.getView().getModel("relationships").getProperty("/parentescoSeguros");
        var sRelationship = oJson.filter(function(n) {
            return n.idCRM === oValue && n.tipo === "Z0001100";
        });
        return sRelationship.length > 0 ? "Parentesco: " + sRelationship[0].text : "";
    },
    _onValidateBeneficiarySelected: function() {
        var oJson = this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceBeneficiarySet/results/"),
            oResult;
        switch (sap.ui.getCore().byId("slTipoAsignacion").getSelectedKey()) {
            case "1", "00001100":
                if (!oJson) {
                    return true;
                }
                oResult = oJson.filter(function(n) {
                    return n.BeneficiaryType === "00001100" && n.RemoveBeneficiary !== true;
                });
                if (oResult.length) {
                    sap.m.MessageToast.show("Existe un beneficiario registrado.");
                    return false;
                } else {
                    return true;
                }
                break;
            case "2", "Z0001100":
                if (!oJson) {
                    return true;
                }
                oResult = oJson.filter(function(n) {
                    return n.BeneficiaryType === "Z0001100" && n.RemoveBeneficiary !== true;
                });
                if (oResult.length) {
                    sap.m.MessageToast.show("Existe una persona tipo familiar registrada.");
                    return false;
                } else {
                    return true;
                }
                break;
            default:
                sap.m.MessageToast.show("Selecciona el tipo de beneficiario y/o asegurado.");
                return false;
        }
    },
    _onValidateFormBeneficiary: function(_oJson) {
        if (!_oJson.getProperty("/BeneficiaryName/FirstName")) {
            sap.ui.getCore().byId("inputFirstName").setValueState('Error');
            sap.m.MessageToast.show("El campo 'Primer Nombre' es obligatorio.");
            return false;
        } else if (!_oJson.getProperty("/BeneficiaryName/LastName")) {
            sap.ui.getCore().byId("inputLastName").setValueState('Error');
            sap.m.MessageToast.show("El campo 'Apellido Paterno' es obligatorio.");
            return false;
        } else if (!_oJson.getProperty("/BeneficiaryRelationship")) {
            jQuery.sap.includeStyleSheet("../css/valueState.css");
            sap.ui.getCore().byId("slRelationship").addStyleClass("selectErrorValueState");
            sap.m.MessageToast.show("El campo 'Parentesco' es obligatorio.");
            return false;
        } else if (!_oJson.getProperty("/BeneficiaryGenderID")) {
            jQuery.sap.includeStyleSheet("../css/valueState.css");
            sap.ui.getCore().byId("slGender").addStyleClass("selectErrorValueState");
            sap.m.MessageToast.show("El campo 'Género' es obligatorio.");
            return false;
        } else if (!_oJson.getProperty("/BeneficiaryBirthday")) {
            sap.ui.getCore().byId("dpBirthday").setValueState('Error');
            sap.m.MessageToast.show("El campo 'Fecha de Nacimiento' es obligatorio.");
            return false;
        } else if (_oJson.getProperty("/BeneficiaryType") === "Z0001100" && (!_oJson.getProperty("/ImageSet/0/ImageBase64") || !_oJson.getProperty("/ImageSet/1/ImageBase64"))) {
            //validación de estatus documentos asegurado familiar. Si el documento es nuevo
            if (_oJson.getProperty("/ImageSet/0/DocumentStatusId") === "empty" || _oJson.getProperty("/ImageSet/1/DocumentStatusId") === "empty") {
                sap.m.MessageToast.show("Favor de capturar la identificación oficial del familiar");
                return false;
            } else {
                return true; //cualquier otro estatus "ACE": "Aceptado","ZA1": "En recuperación","ZP1": "Creado"
            }
        } else {
            return true;
        }
    },
    onFactoryTabExecuted: function(sId, oContext) {
        var oArrayVertical = [
            new sap.ui.mw.DisplayBase().createText("", "{InsuranceDetailsModel>BeneficiaryName/FirstName} {InsuranceDetailsModel>BeneficiaryName/MiddleName} \n {InsuranceDetailsModel>BeneficiaryName/LastName} {InsuranceDetailsModel>BeneficiaryName/SecondName}").addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom"),
            new sap.ui.mw.DisplayBase().createLabel("", { path: "InsuranceDetailsModel>BeneficiaryType", formatter: this._onFormatBeneficiaryType }).addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginTopBottom")
        ];

        if (oContext.getProperty("BeneficiaryType") === "Z0001100") {
            var fam = oContext.getProperty("BeneficiaryRelationship");
            oArrayVertical.push(new sap.ui.mw.DisplayBase().createLabel("", { path: "InsuranceDetailsModel>BeneficiaryRelationship", formatter: this._onFormatRelationship.bind(this) }).addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginTopBottom")); //.addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom"));
        }


        var oHBox = new sap.m.HBox({
            justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
            items: [new sap.m.VBox({
                    items: oArrayVertical
                }),
                new sap.ui.mw.ActionBase().createButton("", "", sap.m.ButtonType.Reject, "sap-icon://employee-rejections", this._onDeleteBeneficiary, this).addStyleClass("sapUiLargeMarginBeginEnd sapUiTinyMarginTopBottom").bindProperty("enabled", { path: "InsuranceDetailsModel>/results/0/isEntityInQueue", formatter: this.onFormatterButtonAddEnabled })
            ]
        });

        return new sap.m.CustomListItem({
            type: sap.m.ListType.Active,
            content: oHBox
        });
    },
    /**
     * [isInQueue - Revisa si los datos del seguro se encuentra en la lista de peticiones syncDb]
     * @param  {[type]}  _id [description]
     * @return {Boolean}     [description]
     * author: israel
     */
    isInQueue: function(_id) {
        jQuery.sap.require("js.buffer.insurance.InsuranceBuffer");
        jQuery.sap.require("js.helper.Dictionary");
        var oController, oDictionary, oInsuranceBuffer;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        oInsuranceBuffer = new sap.ui.buffer.Insurance("syncDB");
        oInsuranceBuffer.searchInSyncDB(_id)
            .then(function(oResult) {
                if (oResult) {
                 
                    oController.getView().getModel("InsuranceDetailsModel").setProperty("/results/0/isEntityInQueue", false, null, false);
                } else {
                  
                    oController.getView().getModel("InsuranceDetailsModel").setProperty("/results/0/isEntityInQueue", true, null, false);
                }
            });
    },
    /**
     * [closeSignatureDialog - ACEPTAR O CERRAR - Cierra dialogo de firma sin guardar cambios y destruye contenido]
     * @param  {[type]} oEvt [description]
     * @return {[type]}      [description]
     * author: israel
     */
    closeSignatureDialog: function(oEvt) {
        var oController, oSource;
        oController = this;
        oSource = oEvt.getSource();
        if (oSource.getId() !== "btnAceptarSignatureFragment") {
            oController.oDialogSignature.close();
           
        } else {
            oController.oDialogSignature.close();
        }
    },
    /**
     * [setSignatureCustomer - Se invoca SignatureBase y retorna un dialogo para la captura de la firma]
     * author: israel
     */
    setSignatureCustomer: function() {
      
        jQuery.sap.require("js.base.SignatureBase");
        var oDialog, oController, oSignatureBase;
        oController = this;
        var _id = "signatureCustomerInsurance";
        oDialog = sap.ui.getCore().byId("appInsDialogSignatureCapture");
        oDialog.setShowHeader(false);

        //Middleware de componentes SAPUI5
        var oActionBase, oDisplayBase;

        //Se declaran objetos de Middleware de componentes SAPUI5
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oSignatureBase = new sap.ui.mw.SignatureBase();

        oDialog.addContent(oDisplayBase.createSignatureCanvas(_id, "sapSignatureCanvas"));

        oDialog.addButton(oActionBase.createButton("", "", "Emphasized", "sap-icon://save", oController.saveSignature, oController));
        oDialog.addButton(oActionBase.createButton("", "", "Emphasized", "sap-icon://eraser", oController.clearSignature, oController));
        oDialog.addButton(oActionBase.createButton("", "", "Emphasized", "sap-icon://sys-cancel", oController.cancelSignature, oController));

        oSignatureBase._id = _id;
        oDialog.attachAfterOpen(function() {
            oSignatureBase.signatureCapture();
        });

        oDialog.open();
    },
    /**
     * [saveSignature - se obtiene el ImageBase64, se inyecta al modelo del seguro y se detruye el dialogo]
     * @return {[type]} [description]
     * author: israel
     */
    saveSignature: function() {
        
        var oController, oView, oDialog, oModel;
        oController = this;
        oDialog = sap.ui.getCore().byId("appInsDialogSignatureCapture");

        //se obtiene ImageBase64
        oController.customerSignature = {
            id: oSignatureBase._id,
            image: oSignatureBase.signatureSave()[0]
        };

        //se inyectan las propiedades propias de ElectronicSignature
        oModel = oController.getView().getModel("InsuranceDetailsModel");
        oModel.setProperty("/results/0/ElectronicSignatureSet/ImageBase64", oController.customerSignature.image.split(',')[1]);
        oModel.setProperty("/results/0/ElectronicSignatureSet/TypeOfSignature", "idSignatureApplicant");


       
        //Se destruye el contenido del dialogo y se cierra dialogo
        oSignatureBase = null;
        oDialog.destroyContent();
        oDialog.destroyButtons();
        oDialog.close();
    },
    /**
     * [clearSignature - borra el contenido de la captura de la firma]
     * @return {[type]} [description]
     */
    clearSignature: function() {
        var oController;
        oController = this;
        oSignatureBase.signatureClear();
        oController.customerSignature = null;
    },
    /**
     * [cancelSignature - limpia el contenido del SignatureBase y destruye el dialogo]
     * @return {[type]} [description]
     */
    cancelSignature: function() {
        var oController, oDialog;
        oController = this;
        oDialog = sap.ui.getCore().byId("appInsDialogSignatureCapture");
        oSignatureBase = null;
        oDialog.destroyContent();
        oDialog.destroyButtons();
        oDialog.close();
        oController.customerSignature = null;
    },
    /**
     * [setSignatureRAndE - Se habilita firma ruega y encargo]
     * @param {[type]} oEvt [description]
     * author: israel
     */
    setSignatureRAndE: function(oEvt) {
        var oSource, oStatus;
        oSource = oEvt.getSource();
        oStatus = oSource.getSelected();
        if (oStatus) {
            sap.ui.getCore().byId("txtSignatureRuegoEncargoFragment").setEnabled(oStatus);
        } else {
            sap.ui.getCore().byId("txtSignatureRuegoEncargoFragment").setValue("");
            sap.ui.getCore().byId("txtSignatureRuegoEncargoFragment").setEnabled(oStatus);
        }
    },
    /**
     * [showPreventionNotice - Abre dialogo de prevensión de lavado de dinero]
     * @return {[type]} [description]
     * author: israel
     */
    showPreventionNotice: function() {
        var oDialogPrivacy, oController;
        oController = this;
        oDialogPrivacy = sap.ui.jsfragment("js.fragments.signature.PreventionNotice", oController);
        oDialogPrivacy.open();
    },
    /**
     * [closePreventionNoticeDialog - Cierra dialogo de aviso de privacidad y destruye contenido]
     * @param  {[type]} oEvt [description]
     * @return {[type]}      [description]
     * author: israel
     */
    closePreventionNoticeDialog: function(oEvt) {
        var oSource = oEvt.getSource();
        oSource.getParent().close();
        oSource.getParent().destroy(true);
    },
    /**
     * [showPrivacyNotice - Abre dialogo de aviso de privacidad]
     * @return {[type]} [description]
     * author: israel
     */
    showPrivacyNotice: function() {
        var oDialogPrivacy, oController;
        oController = this;
        oDialogPrivacy = sap.ui.jsfragment("js.fragments.signature.PrivacyNotice", oController);
        oDialogPrivacy.open();
    },
    /**
     * [closePrivacyNoticeDialog - Cierra dialogo de aviso de privacidad y destruye contenido]
     * @param  {[type]} oEvt [description]
     * @return {[type]}      [description]
     * author: israel
     */
    closePrivacyNoticeDialog: function(oEvt) {
        var oSource = oEvt.getSource();
        oSource.getParent().close();
        oSource.getParent().destroy(true);
    },
    /**
     * [onMessageWarningDialogPress - Dialogo de confirmación para regresar sin guardar ninguna modificación]
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     * author: israel - 20160906
     */
    onMessageWarningDialogPress: function() {
        jQuery.sap.require("sap.m.MessageBox");
        var oController;
        oController = this;
        sap.m.MessageBox.warning("¿Estás seguro que deseas salir?", {
            title: "Alerta",
            actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],

            onClose: function(MessageValue) {

                if (MessageValue === sap.m.MessageBox.Action.OK) {
                    oController.backToTiles();
                }
            }
        });
    },
    /**
     * [backToTiles - Regresa a la vista anterior]
     * @return {[type]} [description]
     * author: israel - 20160906
     */
    backToTiles: function() {
        var oController, oRouter, statePending;
        oController = this;
        oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        statePending = false;


        if (oController.isPending) {
            if (oController.isPendingRead) {
                statePending = true;
            } else {
                statePending = false;
            }
            oRouter.navTo("pendingList", {
                query: {
                    notificationID: oController.notificationId,
                    isRead: statePending
                }
            }, false);
        } else {
            if (sap.ui.core.routing.History.getInstance().getPreviousHash() !== undefined) {
                window.history.go(-1);
            } else {
                oRouter.navTo("DashBoard", true);
            }
        }
    },
    onFormatNameRAndE: function(oValue) {
        if (!oValue) {
            return false;
        } else {
            return true;
        }
    },
    /**
     * [onConfirmationSave - alamacena la infromación en PouchDB]
     * @param  {[type]} oAction [description]
     * @return {[type]}         [description]
     * author: israel - 20160907
     */
    onConfirmationSave: function(oAction) {
        jQuery.sap.require("js.helper.Dictionary");
        var oDictionary, oStatus, oController;
        var oStartDate, oTerm, oBeneficiaries;
        oController = this;
        oDictionary = new sap.ui.helper.Dictionary();
        oStatus = true;

        if (oAction === "Aceptar") {

            oStartDate = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/LoanRequest/GeneralLoanRequestData/StartDate");
            oTerm = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/LoanRequest/GeneralLoanRequestData/Term");
            oModality = this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceModalityID");

           

            //validación - fecha de desembolso (Prioridad # 1)
            if (oStartDate === "" || oStartDate === null) {
                sap.m.MessageToast.show("No se cuenta con una fecha de desembolso (Oportunidad), favor de validar.", {
                    duration: oDictionary.duracionMensaje
                });
                oStatus = false;
            } else {
                //validación - plazo (Prioridad # 2)
                if (oTerm === "" || oTerm === null || oTerm === "0000000000") {
                    sap.m.MessageToast.show("No se cuenta con un plazo (Oportunidad), favor de validar.", {
                        duration: oDictionary.duracionMensaje
                    });
                    oStatus = false;
                } else {
                    //validación - firma - plazo (Prioridad # 3)
                   
                    if (this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceBeneficiarySet/results")) {
                        switch (oModality) {
                            case "001":
                                
                                oBeneficiaries = this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceBeneficiarySet/results").length;
                                if (oBeneficiaries < 1) {
                                    sap.m.MessageToast.show("No existe un beneficiario registrado", {
                                        duration: oDictionary.duracionMensaje
                                    });
                                    oStatus = false;
                                } else {
                                    oBpCycle = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/Customer/BpMainData/AccumulatedCycle");
                                    oMinCycle = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/LoanRequest/GeneralLoanRequestData/InsuranceMinimumCycle");
                                    oInsuranceType = this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceOptional");
                                    oMinCycle = parseInt(oMinCycle);
                                    //Valida el ciclo padre del integrante, ciclo padre minimo del producto y tipo de seguro
                                    if (oBpCycle < oMinCycle && oInsuranceType === false) {
                                        oStatus = false;
                                        sap.m.MessageToast.show("Lo sentimos, no cumple con los requisitos para seleccionar un 'Seguro Básico'.");
                                    }
                                }
                                break;
                            case "002":
                                
                                oBeneficiaries = this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceBeneficiarySet/results").length;
                                if (oBeneficiaries < 2) {
                                    sap.m.MessageToast.show("Debe existir registrado un beneficiario y un asegurado familiar", {
                                        duration: oDictionary.duracionMensaje
                                    });
                                    oStatus = false;
                                } else {
                                    oBpCycle = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/Customer/BpMainData/AccumulatedCycle");
                                    oMinCycle = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/LoanRequest/GeneralLoanRequestData/InsuranceMinimumCycle");
                                    oInsuranceType = this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceOptional");
                                    oMinCycle = parseInt(oMinCycle);
                                    //Valida el ciclo padre del integrante, ciclo padre minimo del producto y tipo de seguro
                                    if (oBpCycle < oMinCycle && oInsuranceType === false) {
                                        oStatus = false;
                                        sap.m.MessageToast.show("Lo sentimos, no cumple con los requisitos para seleccionar un 'Seguro Básico'.");
                                    }
                                }
                                break;
                            default:
                                
                                sap.m.MessageToast.show("La modalidad del seguro no es válida", {
                                    duration: oDictionary.duracionMensaje
                                });
                                oStatus = false;
                        }
                    } else {
                        sap.m.MessageToast.show("No existe beneficiario y/o asegurado familiar registrado", {
                            duration: oDictionary.duracionMensaje
                        });
                        oStatus = false;
                    }

                    // }
                }
            }
            oController.saveInsuranceSet(oStatus);
        } else {
            //CANCELAR
        }
    },
    /**
     * [saveInsuranceSet - inserta la información del seguro a PouchDB - dataDB]
     * @param  {[type]} _oStatus [description]
     * @return {[type]}          [description]
     * author: israel - 20160907
     */
    saveInsuranceSet: function(_oStatus) {
        if (_oStatus) {
           
            var btnSendToCore;
            btnSendToCore = sap.ui.getCore().byId("btnEnviar");
            var oModel = this.getView().getModel("InsuranceDetailsModel");
               /********************************* Cuano es nuevo*************************/
            var oModelGeneral = this.getView().getModel("CustomerDetailsModel");
            oModel.setProperty("/results/0/CustomerIdMD", oModelGeneral.getProperty("/results/0/CustomerIdMD"));
            oModel.setProperty("/results/0/CustomerIdCRM", oModelGeneral.getProperty("/results/0/CustomerIdCRM"));
            oModel.setProperty("/results/0/LoanRequestIdMD", oModelGeneral.getProperty("/results/0/LoanRequestIdMD"));
            oModel.setProperty("/results/0/LoanRequestIdCRM", oModelGeneral.getProperty("/results/0/LoanRequestIdCRM"));

            //Datos Generales del Seguro
             oModel.setProperty("/results/0/StartDateTerm", "2016-09-23T12:00:00");
            //Only for mockserver
       
            oModel.setProperty("/results/0/InsuranceTerm", oModelGeneral.getProperty("/results/0/LoanRequest/GeneralLoanRequestData/Term"));
            oModel.setProperty("/results/0/CollaboratorID", oModelGeneral.getProperty("/results/0/CollaboratorID"));
            /***********************************************************************/
            var oInsuranceSerializer = this.getInsuranceSerialize("dataDB");
            oInsuranceSerializer.serialize(oModel)
                .then(function(oResult) {
                    
                    btnSendToCore.setEnabled(true);
                    sap.m.MessageToast.show("Guardado.");
                });
        } 
    },
    /**
     * [onConfirmationSendToCore - inserta la información del seguro a PouchDB - syncDB ]
     * @param  {[type]} oAction [description]
     * @return {[type]}         [description]
     * author: israel - 20160907
     */
    onConfirmationSendToCore: function(oAction) {
       
        var oController = this;
        if (oAction === "Aceptar") {
            jQuery.sap.require("js.buffer.insurance.InsuranceBuffer");
            jQuery.sap.require("js.helper.Dictionary");
            var oDictionary, oRequest, oId, oBp, oInsuranceBuffer;

            oDictionary = new sap.ui.helper.Dictionary();
            oInsuranceBuffer = new sap.ui.buffer.Insurance("syncDB");
            oId = this.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceIdMD");
            oBp = this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/Customer/BpName/FirstName") + " " + this.getView().getModel("CustomerDetailsModel").getProperty("/results/0/Customer/BpName/LastName");
            oRequest = {
                id: oId,
                requestMethod: oDictionary.oMethods.POST,
                requestUrl: oDictionary.oDataTypes.Insurance,
                requestBodyId: oId,
                requestStatus: oDictionary.oRequestStatus.Initial,
                requestConfirmed: false,
                requestDescription: oBp,
                productID: "INS"
            };
           
          
            oInsuranceBuffer.postRequest(oRequest)
                .then(function(oResult) {
                    //Se valida si existe BussinessError en una sincrnización previa.
                    if (oController.isError) {
                        if (sap.ui.getCore().AppContext.sCurrentInsuranceNotificationID) {
                            if (sap.ui.getCore().AppContext.sCurrentInsuranceNotificationID !== "") {
                                var oInsuranceSync = new sap.ui.sync.Insurance("dataDB", "syncDB");
                                var oNotification = {};
                                oNotification.notificationID = sap.ui.getCore().AppContext.sCurrentInsuranceNotificationID;
                              
                                oInsuranceSync.saveUpdateError(oNotification);
                                sap.ui.getCore().AppContext.NotificationID = "";
                            }
                        }
                        sap.m.MessageToast.show("Solicitud preparada para enviar a Integra");
                        window.history.go(-1);
                    } else if (oController.isPending) {
                        sap.m.MessageToast.show("Solicitud preparada para enviar a Integra");
                        oController.backToTiles();
                    } else {
                        //dashbaord
                        sap.m.MessageToast.show("Solicitud preparada para enviar a Integra");
                        window.history.go(-1);
                    }
                });
        }
    },
    /**
     * [onCycloEstatusValidation description]
     * @param  {[type]} iCycle    Ciclo Acumulado por BP
     * @param  {[type]} sEstatus  Estatus de la Oportunidad de Crédito
     * @param  {[type]} iMinCycle Dato Maestro de acuerdo al producto
     * @return {[type]}           Validación para habilitar campos
     */
    onCycloEstatusValidation: function(iCycle, sEstatus, iMinCycle) {
        var oController = this;
        /*Estatus oportunidad para edición - cambio de reglas visualización de oportunidad en DM.
        E0001 = Creada, E0007 = En Proceso,E0009 = Por Aprobar*/
        if (sEstatus === "E0001" || sEstatus === "E0007" || sEstatus === "E0009") {
            
        } else {
            oController.oMessage = "Lo sentimos, el estatus de la oportunidad no cumple con los requisitos para editar el seguro.";
            return true;
        }
    },
    getIdMD: function(_oDB) {
        jQuery.sap.require("js.base.IdentifierBase");
        return new sap.ui.mw.IdentifierBase(_oDB);
    },
    _onRunRemoveBeneficiaryeficiary: function(_sPath, _oModel) {
        if (!_oModel.getProperty(_sPath + "/InsuranceBeneficiaryIdCRM")) {
            var _oJson = _oModel.getProperty("/results/0/InsuranceBeneficiarySet/results");
            _oJson.splice(parseInt(_sPath.substr(_sPath.length - 1)), 1);
            _oModel.setProperty("/results/0/InsuranceBeneficiarySet/results", _oJson);
        } else {
            _oModel.setProperty(_sPath + "/RemoveBeneficiary", true); //Actualiza modelo de la vista
            _oModel.refresh(true);
        }

        //Formato de fecha: "2009-02-28T01:19:06.000Z"  to "1987-09-23T12:00:00"
    },
    _onFindBeneficiaryType: function(_oBeneficiaries, _cType) {
        for (var i = 0, iLen = _oBeneficiaries.length; i < iLen; i++) {
            var _oModel = _oBeneficiaries[i].getModel(),
                _sPath = _oBeneficiaries[i].getPath();
            if (_oModel.getProperty(_sPath + "/BeneficiaryType") === _cType) {
                break;
            }
        }
        return _oBeneficiaries[i];
    },
    onFormatterViewEnabled: function(bIsEnqueue, oValue) {
        if (oValue === undefined) { oValue = true; }
        return bIsEnqueue ? false : oValue;
    },
    onFormatterSelectEnabled: function(bIsEnqueue, oValue) {
        var _status;
        switch (oValue) {
            case "001":
                sap.ui.getCore().byId("slTipoAsignacion").setSelectedKey("00001100");
                _status = false;
                break;
            case "002":
                sap.ui.getCore().byId("slTipoAsignacion").setSelectedKey("");
                _status = true;
                break;
        }
        return bIsEnqueue ? false : _status;
    },
    onFormatterButtonAddEnabled: function(bIsEnqueue) {
        return bIsEnqueue ? false : true;
    },
    onFormatterButtonSyncEnabled: function() {
        return false;
    },
    //Captura y Edición de Documentos
    onDocuments: function(oEvent) {
        jQuery.sap.require("js.base.DocumentsBase");
        var oDocumentsBase, oInitValidateModel, oFragmentDocuments, oController, benModel, benPath;
        oController = this;

        if (oEvent.hasOwnProperty("sId")) {
            //origen formulario familiar
            oDocumentsBase = new sap.ui.mw.DocumentsBase("oTblDocuments", oEvent.getSource().sId);
            sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(false);
            benModel = oEvent.getSource().getModel();
            //verifica resultado del imageset si es nuevo o es edición
            if (benModel.getProperty("/ImageSet/results")) {
                benPath = "/ImageSet/results";
            } else {
                benPath = "/ImageSet";
            }
        } else {
            //origen mis pendientes
            oDocumentsBase = new sap.ui.mw.DocumentsBase("oTblDocuments", "");
            var oBeneficiaries = oController.getView().getModel("InsuranceDetailsModel").getProperty("/results/0/InsuranceBeneficiarySet/results");

            if (oBeneficiaries.length === 0) {

            } else {
                oBeneficiaries.forEach(function(currBeneficiary, i) {
                    if (currBeneficiary.BeneficiaryType === "Z0001100" && currBeneficiary.RemoveBeneficiary !== true) {
                        benModel = oController.getView().getModel("InsuranceDetailsModel");
                        benPath = "/results/0/InsuranceBeneficiarySet/results/" + i + "/ImageSet/results";
                    }
                });
            }
        }
        oFragmentDocuments = sap.ui.jsfragment("js.fragments.documents.documentsList", [oController, oDocumentsBase, oController.closeFragmentDialog.bind(oController, oDocumentsBase)]);
        oDocumentsBase.setOFragment(oFragmentDocuments);
        //bloquea el botón regresar nativo de android
        this.closeGenericFragment(oFragmentDocuments, oController.closeFragmentDialog.bind(oController, oDocumentsBase));
        oDocumentsBase.setPathEntity(benPath);

        if (benModel === undefined) {
            oDocumentsBase.onFailLoadModel();
            oController.closeFragmentDialog(oDocumentsBase);
        } else {
            if (benModel.getProperty(benPath).length === 0 || benModel.getProperty(benPath).length === undefined) {
                oDocumentsBase.onFailLoadModel();
                oController.closeFragmentDialog(oDocumentsBase);
            } else {
                if (oController.imageID !== "") {
                    oDocumentsBase.setVisibleMyPendingImage(oController.imageID);
                    oController.activateLongListDocuments = oController.openFromNotifications;
                }
                oDocumentsBase.setLongList(oController.activateLongListDocuments);
                oInitValidateModel = oDocumentsBase.initValidateModel(benModel);
                oInitValidateModel.then(oController.loadFragmentDocuments.bind(oController, oDocumentsBase, oFragmentDocuments, benModel));
            }
        }

    },
    loadFragmentDocuments: function(oDocumentsBase, oFragmentDocuments, validateDocuments) {
        var loadDocumentsInFragment, oController;
        oController = this;
        loadDocumentsInFragment = oDocumentsBase.loadDataInTableDocuments(validateDocuments);
        loadDocumentsInFragment.then(oController.showFragmentDocument.bind(oController, oFragmentDocuments, validateDocuments));
    },
    showFragmentDocument: function(oFragmentDocuments, validateDocuments) {
        oFragmentDocuments.open();
     
        if (!validateDocuments && typeof(validateDocuments) !== "undefined") {
            sap.m.MessageToast.show("Captura los documentos requeridos");
        }
    },
    closeFragmentDialog: function(oDocumentsBase) {
        var oController = this;
        if (oDocumentsBase.getBtnTrigger() !== "") {
            sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(true);
        }
        if (oDocumentsBase.getFlagImageSuccess() && oController.imageID !== "") {
            oController.isPendingRead = true;
            oController.getView().getModel("InsuranceDetailsModel").setProperty("/results/0/isEntityInQueue", false, null, false);
        }
        sap.ui.getCore().AppContext.EventBase.setObjectToCloseWithBackEvent();
        if (oController.fragmentBeneficiary !== "") {
            this.closeGenericFragment(oController.fragmentBeneficiary, oController.onCancel.bind(this, "", oController.fragmentBeneficiary));
        }

        oDocumentsBase.closeDialogDocuments();
    },
    formatJSONDate: function(_oDate) {
        if (_oDate) {
            if (_oDate !== null) {
                if (typeof _oDate.getTime !== "undefined") {
                    return "/Date(" + _oDate.getTime() + ")/";
                }
            }
        }
        return _oDate;
    },
    closeGenericFragment: function(oFragment, fnClose) {
        sap.ui.getCore().AppContext.EventBase.setObjectToCloseWithBackEvent(oFragment)
        sap.ui.getCore().AppContext.EventBase.setFunctionBackButtonWithOpenDialog(fnClose);
    },
    setNameToUpperCase: function(oName) {
        oName.FirstName = oName.FirstName.toUpperCase();
        oName.MiddleName = oName.MiddleName.toUpperCase();
        oName.LastName = oName.LastName.toUpperCase();
        oName.SecondName = oName.SecondName.toUpperCase();
        return oName
    }
});
