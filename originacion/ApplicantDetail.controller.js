sap.ui.controller("originacion.ApplicantDetail", {
    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf originacion.ApplicantDetail
     */
    idForm: "applicantForm",
    oAddressModelFiltered: null,
    lastTab: "Name",
    currentTab: "",
    lastIDNotification: "",
    lastDocumentID: "",
    isPendingRead: false,
    activateLongListDocuments: false,
    openFromNotifications: false,
    isAnnouncement: "",
    isBasicMinimumPending:false,
    // isPendingUpdateData: "",
    busyLoader: "",
    activatedSendTocore: false,
    onInit: function() {
        jQuery.sap.require("js.base.NavigatorBase", "js.kapsel.Rest", "js.serialize.GeneralSerialize", "js.helper.Dictionary", "js.serialize.bp.BPSerialize", "js.validations.Validator");
        jQuery.sap.require("js.forms.bp.Name");
        jQuery.sap.require("js.forms.bp.Phone");
        jQuery.sap.require("js.forms.bp.Address");
        jQuery.sap.require("js.forms.bp.Basic");
        jQuery.sap.require("js.forms.bp.Complementary");
        jQuery.sap.require("js.forms.bp.References");
        jQuery.sap.require("sap.ui.core.format.DateFormat");
        jQuery.sap.require("js.base.BusyBase");
        var oPhoneModel = new sap.ui.model.json.JSONModel("data-map/catalogos/phones.json");
        sap.ui.getCore().setModel(oPhoneModel, "oModelTypePhone");
        var oAddressModel = new sap.ui.model.json.JSONModel("data-map/catalogos/typeAddress.json");
        sap.ui.getCore().setModel(oAddressModel, "oModelAddressType");
        var estatusProspecto = new sap.ui.model.json.JSONModel("data-map/catalogos/estatusProspecto.json");
        this.busyLoader = new sap.ui.mw.BusyBase();
        sap.ui.getCore().setModel(estatusProspecto, "estatusProspecto");
        this.getRouter().getRoute("applicantsDetail").attachMatched(this._onRouteMatched, this);
    },
    getRouter: function() {
        return sap.ui.core.UIComponent.getRouterFor(this);
    },
    setFooterBarEnabled: function(_enabled) {
        sap.ui.getCore().byId("btnSaveApplicant").setEnabled(_enabled);
        sap.ui.getCore().byId("btnPrivacyApplicant").setEnabled(_enabled);
        sap.ui.getCore().byId("btnCameraApplicant").setEnabled(_enabled);
    },
    getRejectedState: function(_oData) {

        var state = false;

        if (_oData) {
            _oData.some(function(image) {
                if (image.DocumentStatusId === "ZA1" && image.ImageBase64.length === 0) {
                    state = true;
                }
            });

        }

        return state;
    },
    setDetailModeltoView: function(_aPending, _aResult) {
        return new Promise(function(resolve, reject) {

            this.getView().setModel(_aResult[0], "BPDetailsModel");

            if (!_aResult[1]) {
                if (this.getView().getModel("BPDetailsModel").getProperty("/results/0/IsEntityInQueue")) {
                    this.setFooterBarEnabled(false);
                } else {
                    if (_aPending[0]) {
                        if (_aPending[1] === "85") {
                            this.isPendingUpdateData = true;
                            this.isBasicMinimumPending = true;
                        } else {
                            this.lastDocumentID = _aPending[1];

                        }
                        this.lastIDNotification = _aPending[2];
                        if (this.isPendingUpdateData) {
                            sap.ui.getCore().byId("btnSendToCoreApplicant").setEnabled(true);
                        } else {
                            if (_aResult[0].getProperty("/results").length !== 0) {
                                sap.ui.getCore().byId("btnCameraApplicant").firePress(this);
                            }
                        }
                    } else {
                        if (this.getRejectedState(this.getView().getModel("BPDetailsModel").getProperty("/results/0/ImageSet/results/"))) {
                            this.getRouter().navTo("pendingList", {
                                query: {
                                    msg: "Tienes imágenes por recuperar",
                                    isError: 1
                                }
                            }, false);
                        }else
                            this.validatePendings();
                    }
                }
            }

            resolve(true);
        }.bind(this));

    },
    validatePendings: function() {
        var hasPending = false;
        var statusPending = "true"; //con este formato viene en el serivicio
        var oBPID = this.getView().getModel("BPDetailsModel").getProperty("/results/0/CustomerIdMD/");
        sap.ui.getCore().AppContext.oRest.oDataModel.read("/PendingsPromoterSet?$filter=promoterID eq '" + sap.ui.getCore().AppContext.Promotor + "'", null, "", false,
            function(oData) {

                var i;
                var data = oData.results;
                for (i = 0; i < data.length; i++) {
                    if (oBPID === data[i].objectDMID) {
                        hasPending = true;
                        statusPending = data[i].status
                        break;
                    }
                }
                if (hasPending && statusPending == "false") {
                    this.getRouter().navTo("pendingList", {
                        query: {
                            msg: "El BP tiene pendientes por atender",
                            isError: 1
                        }
                    }, false);
                }
            }.bind(this),
            function(error) { console.log(error) })
    },
    getSerializeApplicants: function(_oDataBase) {
        jQuery.sap.require("js.serialize.customer.CustomerSerialize");
        return new sap.ui.serialize.Customer(_oDataBase);
    },
    loadInitialProcess: function(_fx) {
        setTimeout(_fx(), 2000);
    },
    _onRouteMatched: function(oEvent) {
        var serializeBP, applicantId, isAnnouncement, currentTab, aPending;
        serializeBP = new sap.ui.serialize.BP("dataDB", "Customer");
        applicantId = oEvent.getParameter("arguments").applicantId;
        isAnnouncement = oEvent.getParameter("arguments")["?query"].announcement ? true : false;
        this.isAnnouncement = isAnnouncement;
        aPending = oEvent.getParameter("arguments")["?query"].pending ? [true, oEvent.getParameter("arguments")["?query"].imageID, oEvent.getParameter("arguments")["?query"].notificationID] : [];
        currentTab = oEvent.getParameter("arguments")["?query"].tab;
        this.isPendingRead = false;
        this.activateLongListDocuments = true;
        this.openFromNotifications = false;
        this.lastIDNotification = "";
        var oParams = {
            CustomerIdMD: applicantId
        };
        this.lastDocumentID = "";
        this.isPendingUpdateData = ""
        this.setFooterBarEnabled(true);
        this.activatedSendTocore = false;

        sap.ui.getCore().AppContext.loader.show("Cargando el detalle del solicitante");
        setTimeout(function() {

            new sap.ui.serialize.General("dataDB").getEntityDetail(new sap.ui.helper.Dictionary().oDataRequest(oParams).getRequest("CustomerSet"), applicantId)
                .then(serializeBP.getModelReviewed.bind(serializeBP, "CustomerSet", applicantId, [isAnnouncement, aPending], this.getRouter()))
                .then(this.setDetailModeltoView.bind(this, aPending))
                .then(this.setSupplierOfApplicant.bind(this, new sap.ui.helper.Dictionary().oDataRequest(oParams).getRequest("CustomerSet"), applicantId, currentTab));

            if (parseInt(oParams.CustomerIdMD) === 0) {
                sap.ui.getCore().byId("oPageDetailApplicants").setTitle("Crear Solicitante");
            } else {
                sap.ui.getCore().byId("oPageDetailApplicants").setTitle("Detalle Solicitante");
            }
            sap.ui.getCore().byId("btnSendToCoreApplicant").setEnabled(false);

        }.bind(this), 2000);
    },

    onTabSelect: function(oEvent) {
        this.tabSelect(oEvent.getParameter("selectedKey").replace("itfApplicants", ""));
    },
    tabSelect: function(tab) {
        this.currentTab = tab;
        var oForm = null,
            sStatusId = this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/StatusId"),
            bDisable = this.disableForms(tab);
        // enableSelectStatus = false,
        // oAddStyle = "";
        bDisable.then(function(results) {
            console.log("--> " + results + " <--")
            switch (tab) {
                case "Name":
                    oForm = new sap.ui.mw.forms.bp.Name();
                    break;
                case "Phone":
                    oForm = new sap.ui.mw.forms.bp.Phone();
                    break;
                case "Address":
                    oForm = new sap.ui.mw.forms.bp.Address();
                    break;
                case "Basic":
                    oForm = new sap.ui.mw.forms.bp.Basic();
                    break;
                case "Complementary":
                    oForm = new sap.ui.mw.forms.bp.Complementary();
                    break;
                case "Reference":
                    oForm = new sap.ui.mw.forms.bp.References();
                    this._onReferencesMerger();
                    break;
            }
            sap.ui.getCore().byId("itfApplicants" + this.lastTab).destroyContent();
            sap.ui.getCore().byId("itfApplicants" + tab).destroyContent();
            sap.ui.getCore().byId("itfApplicants" + tab).addContent(results[0].bDisable ? oForm.createForm(this).addStyleClass("readonlyForms") : (results[0].oEnableSelectStatus ? oForm.createForm(this).addStyleClass(results[0].oAddStyle) : oForm.createForm(this)));
            sap.ui.getCore().byId("itbApplicants").setSelectedKey("itfApplicants" + tab);
            this.lastTab = tab;
        }.bind(this));


    },
    onMessageWarningDialogPress: function() {
        jQuery.sap.require("sap.m.MessageBox");
        var oController;
        oController = this;
        sap.m.MessageBox.warning("¿Estás seguro que deseas salir?", {
            title: "Alerta",
            actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],

            onClose: function(MessageValue) {

                if (MessageValue === sap.m.MessageBox.Action.OK) {
                    oController.backToList();
                }
            }
        });
    },
    backToList: function() {
        jQuery.sap.require("js.base.EventBase");
        var statePending, oEventBase, serializeBP;
        oEventBase = new sap.ui.mw.EventBase();
        if (this.lastIDNotification === "") {
            if (this.isAnnouncement !== true) {
                oEventBase.backEvent(this, "");
            } else {
                this.getRouter().navTo("announcementList", {
                    query: {}
                }, false);
            }

        } else {

            serializeBP = new sap.ui.serialize.BP("dataDB", "Customer");
            serializeBP.getSupplierBp(new sap.ui.helper.Dictionary().oDataRequest({}).getRequest("CustomerSet"), this.getView().getModel("BPDetailsModel").getProperty("/results/0/CustomerIdMD")).then(function(resp) {
                if (resp) {
                    statePending = false;
                } else if (!this.getView().getModel("BPDetailsModel").getProperty("/results/0/ImageSet/results/")) {
                    statePending = false;
                } else if (this.isPendingUpdateData) {
                    statePending = true;
                } else {
                    statePending = this.getView().getModel("BPDetailsModel").getProperty("/results/0/ImageSet/results/").some(function(resp) {
                        return (resp.DocumentId === this.lastDocumentID && resp.ImageBase64.length > 0) ? true : false;
                    }.bind(this));

                }
                this.getRouter().navTo("pendingList", {
                    query: {
                        notificationID: this.lastIDNotification,
                        isRead: statePending
                    }
                }, false);

            }.bind(this))


        }

    },

    createItemTablePhones: function(_context) {
        var currentController = this;
        var oColumnTemplate = new sap.m.ColumnListItem({});
        oColumnTemplate.setType(sap.m.ListType.Active);
        oColumnTemplate.addCell(new sap.m.ObjectHeader({
            icon: "sap-icon://phone"
        }));
        oColumnTemplate.addCell(new sap.m.ObjectHeader({
            title: "Teléfono:" + _context.getProperty("PhoneNumber"),
            responsive: true,
            backgroundDesign: "Translucent",
            fullScreenOptimizeds: true,
            attributes: [
                new sap.m.ObjectAttribute({
                    title: "Tipo",
                    text: _.find(sap.ui.getCore().getModel("oModelTypePhone").getProperty("/tipo"), function(type) {
                        return type.idCRM === _context.getProperty("PhoneTypeId");
                    }).type
                })
            ]
        }));
        oColumnTemplate.addCell(new sap.ui.mw.ActionBase().createButton("", "", "Accept", "sap-icon://call", currentController.callPhone.bind({
            PhoneNumber: _context.getProperty("PhoneNumber")
        }), currentController));
        return oColumnTemplate;
    },
    getPhoneFormModel: function(path) {
        var isNew = path === "/results/0" ? true : false;
        var mainModel = this.getView().getModel("BPDetailsModel").getProperty(path);
        var currentModel = {
            CollaboratorID: mainModel.CollaboratorID,
            CustomerIdCRM: mainModel.CustomerIdCRM,
            CustomerIdMD: mainModel.CustomerIdMD,
            PhoneNumber: isNew ? "" : mainModel.PhoneNumber,
            PhoneTypeId: isNew ? "" : mainModel.PhoneTypeId,
            Path: isNew ? null : path
        };
        return new sap.ui.model.json.JSONModel(currentModel);
    },
    updatePhone: function(oEvent) {
        new sap.ui.mw.forms.bp.Phone().createPhoneDetailForm(this, this.getPhoneFormModel(oEvent.getParameter("listItem").getBindingContext("BPDetailsModel").getPath()), true, null).open();
    },
    addPhone: function() {
        new sap.ui.mw.forms.bp.Phone().createPhoneDetailForm(this, this.getPhoneFormModel("/results/0"), true, null).open();
    },
    bindAggregationPhone: function() {
        var oController = this;
        sap.ui.getCore().byId(oController.idForm + "tblAppPhones").bindAggregation("items", {
            type: sap.m.ListType.Inactive,
            path: "BPDetailsModel>/results/0/PhoneSet/results",
            factory: function(_id, _context) {
                return oController.createItemTablePhones(_context);
            }
        });
    },
    savePhone: function(model, dialog) {
        var oValidatorForm = new sap.ui.validations.Validator();
        var oModelPhones = this.getView().getModel("BPDetailsModel").getProperty("/results/0/PhoneSet/results/");
        if (oValidatorForm.validate(this.idForm + "PhoneDetail")) {


            if (model.getProperty("/Path")) {
                this.getView().getModel("BPDetailsModel").setProperty(model.getProperty("/Path") + "/PhoneNumber", model.getProperty("/PhoneNumber"));
                this.getView().getModel("BPDetailsModel").setProperty(model.getProperty("/Path") + "/PhoneTypeId", model.getProperty("/PhoneTypeId"));
            } else {
                var addModel = model.getProperty("/");
                if (!this.validateDuplicatePhone(oModelPhones, addModel)) {
                    sap.m.MessageToast.show("Tipo de teléfono ya existe");
                    return;
                } else {
                    delete addModel.Path;
                    this.getView().getModel("BPDetailsModel").getProperty("/results/0/PhoneSet/results").push(addModel);
                }
            }
            this.bindAggregationPhone();
            dialog.destroy();

        } else {
            sap.m.MessageToast.show("Completa datos obligatorios");
        }
    },
    validateDuplicatePhone: function(currentModel, addModel) {
        var duplicate = 0;
        currentModel.some(function(oValue) {
            if (oValue.PhoneTypeId === addModel.PhoneTypeId) {
                duplicate++;
            }
        }.bind(addModel));
        if (duplicate > 0) {
            return false;
        } else {
            return true;
        }
    },
    cancelSavePhone: function() {
        this.destroy();
    },
    onSearchPhones: function(evt) {
        var allFilter;
        var table = sap.ui.getCore().byId(this.idForm + "tblAppPhones");
        var binding = table.getBinding("items");
        var txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            var filter = new sap.ui.model.Filter("PhoneNumber", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            allFilter = new sap.ui.model.Filter([filter], false);
        }
        binding.filter(allFilter, "Application");
    },
    callPhone: function() {
        window.PhoneCaller.call(this.PhoneNumber, function(result) {
            console.log("Success:" + JSON.stringify(result));
        }, function(e) {
            console.log("Error:" + JSON.stringify(e));
        });
    },
    fnDoSearchSuburb: function(oEvent) {
        var aFilters = [],
            sSearchValue = oEvent.getParameter("value"),
            itemsBinding = oEvent.getParameter("itemsBinding");
        if (sSearchValue !== undefined && sSearchValue.length > 0) {
            // create multi-field filter to allow search over all attributes
            aFilters.push(new sap.ui.model.Filter("SuburbName", sap.ui.model.FilterOperator.Contains, sSearchValue));
            // apply the filter to the bound items, and the Select Dialog will update
            itemsBinding.filter(new sap.ui.model.Filter(aFilters, false));
        } else {
            // filter with empty array to reset filters
            itemsBinding.filter(aFilters);
        }
    },
    pickSuburb: function() {
        try {
            var oDataSuburb = new sap.ui.model.json.JSONModel(oAddressModelFiltered).getProperty("/results");
            if (oDataSuburb.length > 1) {
                var suburbTableDialog = new sap.ui.mw.forms.bp.Address().suburbTableDialog(this);
                var oItemTemplate = new sap.m.ColumnListItem({
                    type: "Active",
                    unread: false,
                    cells: [
                        new sap.m.Label({
                            text: "{SuburbName}"
                        })
                    ]
                });
                suburbTableDialog.open();
                suburbTableDialog.bindAggregation("items", "/results", oItemTemplate);
                suburbTableDialog.setModel(oModelSuburb);
                suburbTableDialog.attachConfirm(function(oEvent) {
                    var selectedItem = oEvent.getParameter('selectedItem');
                    var selectAppDgSuburb = sap.ui.getCore().byId("selectAppDgSuburb");
                    if (selectedItem) {
                        var oCells = selectedItem.getCells();
                        var oCell = oCells[0];
                        var selectedSub = _.where(oDataSuburb, {
                            SuburbName: oCell.getText()
                        });
                        selectAppDgSuburb.setSelectedKey(selectedSub[0].SuburbName);
                    }
                });
            }
        } catch (e) {
            console.log(e);
        }
    },
    createItemTableAddress: function(_context) {
        var oColumnTemplate = new sap.m.ColumnListItem({});
        oColumnTemplate.setType(sap.m.ListType.Active);
        oColumnTemplate.setSelected(true);
        oColumnTemplate.addCell(new sap.m.ObjectHeader({
            title: "Domicilio:",
            intro: _context.getProperty("Place/Street").toUpperCase() + ", " + _context.getProperty("Place/OutsideNumber").toUpperCase() + ", " + _context.getProperty("Place/InteriorNumber").toUpperCase() + ", " + _context.getProperty("Place/Suburb") + ", " + _context.getProperty("Place/City") + ", " + _context.getProperty("Place/PostalCode"),
            icon: "sap-icon://contacts",
            responsive: true,
            backgroundDesign: "Translucent",
            fullScreenOptimized: true,
            attributes: [
                new sap.m.ObjectAttribute({
                    title: "Tipo de domicilio",
                    //text: typeAddress
                    text: _.find(sap.ui.getCore().getModel("oModelAddressType").getProperty("/tipo"), function(type) {
                        return type.idCRM === _context.getProperty("AddressTypeId");
                    }).text
                })
            ]
        }));
        return oColumnTemplate;
    },
    saveAddress: function(model, dialog) {
        var addModel = model.getProperty("/");
        addModel.IsMainAddress = addModel.AddressTypeId === "XXDEFAULT" ? true : false;
        var oValidatorForm = new sap.ui.validations.Validator();

        if (oValidatorForm.validate(this.idForm + "AddressModal")) {
            if (model.getProperty("/Path")) {
                delete addModel.Path;
                this.getView().getModel("BPDetailsModel").setProperty(model.getProperty("/Path"), addModel);
            } else {
                delete addModel.Path;
                this.getView().getModel("BPDetailsModel").getProperty("/results/0/AddressSet/results").push(addModel);
            }
            this.bindAggregationAddress();
            dialog.destroy();
        } else {
            sap.m.MessageToast.show("Completa datos obligatorios");
        }
    },
    validateDuplicateAddress: function(currentModel, addModel) {
        var duplicate = 0;
        currentModel.some(function(oValue) {
            if (oValue.AddressTypeId === addModel.AddressTypeId) {
                duplicate++;
            }
        }.bind(addModel));
        if (duplicate > 0) {
            return false;
        } else {
            return true;
        }
    },
    cancelSaveAddress: function() {
        this.destroy();
    },
    bindAggregationAddress: function() {
        var oController = this;
        sap.ui.getCore().byId(oController.idForm + "tblAddress").bindAggregation("items", {
            type: sap.m.ListType.Inactive,
            path: "BPDetailsModel>/results/0/AddressSet/results",
            factory: function(_id, _context) {
                return oController.createItemTableAddress(_context);
            }
        });
    },

    addresTypeManager: function(currentType) {
        var addresSet = this.getView().getModel("BPDetailsModel").getProperty("/results/0/AddressSet/results");
        var typeAddress = sap.ui.getCore().getModel("oModelAddressType").getProperty("/tipo");
        var aux = [];
        _.each(typeAddress, function(oTypeAddress) {
            var flag = true;
            _.each(addresSet, function(oArray) {
                if (oTypeAddress.idCRM === oArray.AddressTypeId && oTypeAddress.idCRM !== currentType) {
                    flag = false;
                }
            });
            if (flag) {
                aux.push(oTypeAddress);
            }
        });
        return new sap.ui.model.json.JSONModel({
            "tipo": aux
        });
    },

    addAddress: function() {
        new sap.ui.mw.forms.bp.Address().createModalAddressForm(this, this.getAddressFormModel("/results/0")).open();
    },
    updateAddress: function(oEvent) {
        var model = this.getAddressFormModel(oEvent.getParameter("listItem").getBindingContext("BPDetailsModel").getPath());
        new sap.ui.mw.forms.bp.Address().createModalAddressForm(this, model).open();
        this.searchAddressByCP();
        sap.ui.getCore().byId("selectAppDgTypeAddress").setEnabled(model.getProperty("/AddressTypeId") !== "XXDEFAULT" ? true : false);
    },
    getAddressFormModel: function(path) {
        var mainModel = this.getView().getModel("BPDetailsModel").getProperty(path);
        var isNew = path === "/results/0" ? true : false;
        var formModel;
        if (isNew) {
            formModel = {
                AddressTypeId: "",
                CollaboratorID: mainModel.CollaboratorID,
                CustomerIdCRM: mainModel.CustomerIdCRM,
                CustomerIdMD: mainModel.CustomerIdMD,
                IsMainAddress: null,
                Latitude: null,
                Longitude: null,
                Place: {
                    BetweenStreets1: "",
                    BetweenStreets2: "",
                    City: "",
                    Comments: "",
                    CountryID: "",
                    InteriorNumber: "",
                    LocationReference: "",
                    OutsideNumber: "",
                    PostalCode: "",
                    StateId: "",
                    Street: "",
                    Suburb: "",
                    TownId: ""
                },
                Path: null
            };
        } else {
            formModel = mainModel;
            formModel["Path"] = path;
        }
        return new sap.ui.model.json.JSONModel(formModel);
    },
    onSearchAddress: function(evt) {
        var allFilter;
        var table = sap.ui.getCore().byId(this.idForm + "tblAddress");
        var binding = table.getBinding("items");
        var txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            var filter = new sap.ui.model.Filter("Place/Street", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter1 = new sap.ui.model.Filter("Place/OutsideNumber", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter2 = new sap.ui.model.Filter("Place/InteriorNumber", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter3 = new sap.ui.model.Filter("Place/Suburb", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter4 = new sap.ui.model.Filter("Place/City", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter5 = new sap.ui.model.Filter("Place/PostalCode", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            allFilter = new sap.ui.model.Filter([filter, filter1, filter2, filter3, filter4, filter5], false);
        }
        binding.filter(allFilter, "Application");
    },
    serchLocationMap: function() {
        if (sap.ui.getCore().byId("txtAppDgPostCode").getValue() !== "") {
            new sap.ui.mw.forms.bp.Address().locationMap(this, null).open();
        } else {
            sap.m.MessageToast.show("Debe capturar 'Código Postal' para visualizar mapa");
        }
    },
    getCoordinates: function(oMaps, dialog) {
        sap.ui.getCore().byId("txtAppDgLatitude").setValue(oMaps.latitude);
        sap.ui.getCore().byId("txtAppDgLongitude").setValue(oMaps.longitude);
        dialog.destroy();
    },
    cancelMaps: function() {
        this.destroy();
    },
    onChangeTypeAddress: function() {
        var chkMainAddress = sap.ui.getCore().byId("chkAppDgMainAddress");
        if (sap.ui.getCore().byId("selectAppDgTypeAddress").getSelectedKey() === '10') {
            chkMainAddress.setSelected(true);
        } else {
            chkMainAddress.setSelected(false);
        }
    },
    getAddressByCP: function(postalCode, setFunction) {

        var oController = this;
        oController.busyLoader.show("Cargando direcciones....");
        sap.ui.getCore().AppContext.myRest.read("/PostalCodeSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "' and Code eq '" + postalCode + "'", true)
            .then(function(response) {
                if (response.results.length === 0) {
                    sap.m.MessageToast.show("El código postal que desea consultar no se encuentra disponible para la OS");
                } else {
                    var oAddressModelFiltered = response;
                    setFunction(response);
                }
                oController.busyLoader.close();
            }).catch(function(error) {
                oController.busyLoader.close();
            });
    },
    cpSetterToAddress: function(data) {
        var oAddressModel = new sap.ui.model.json.JSONModel();
        oAddressModel.setData(data);
        var selectCountry = sap.ui.getCore().byId("selectAppDgCountry").setSelectedKey(oAddressModel.getProperty("/results/0/CountryId")).setEnabled(false);
        var selectEntity = sap.ui.getCore().byId("selectAppDgEntity").setSelectedKey(oAddressModel.getProperty("/results/0/StateId")).setEnabled(false);
        var selectDelegation = sap.ui.getCore().byId("selectAppDgDelegation").setModel(oAddressModel).setSelectedKey(oAddressModel.getProperty("/results/0/TownName")).setEnabled(false);
        var txtCity = sap.ui.getCore().byId("txtAppDgCity").setValue(oAddressModel.getProperty("/results/0/City"));
        var selectSuburb = sap.ui.getCore().byId("selectAppDgSuburb").setModel(oAddressModel).setSelectedKey(oAddressModel.getProperty("/results/0/SuburbName"));
        if (oAddressModel.getProperty("/results").length > 0) {
            selectEntity.addStyleClass("statusSuccesValue");
            selectDelegation.addStyleClass("statusSuccesValue");
            selectSuburb.addStyleClass("statusSuccesValue");
            txtCity.setValueState(sap.ui.core.ValueState.Success);
        }
    },
    searchAddressByCP: function() {
        this.getAddressByCP(sap.ui.getCore().byId("txtAppDgPostCode").getValue(), this.cpSetterToAddress);
    },
    ///basic
    onChangeMaritalStatus: function() {
        if (this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpBasicData/MaritalStatusId") === "1") {
            this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/Children", "0");
        }
    },
    onSelchkAppDataPEP: function(oEvent) {
        sap.ui.getCore().byId("applicantFormPEPName").setValue('');
        sap.ui.getCore().byId("applicantFormRelation").setSelectedKey('');
        this.hiddenOrShowElement(oEvent.getParameter('selected'), "applicantFormPEPName");
        this.hiddenOrShowElement(oEvent.getParameter('selected'), "applicantFormRelation");
    },
    onSelchkAppDataMagmt: function(oEvent) {
        sap.ui.getCore().byId("applicantFormManagment").setValue('');
        this.hiddenOrShowElement(oEvent.getParameter('selected'), "applicantFormManagment");
    },
    hiddenOrShowElement: function(visible, element) {
        sap.ui.getCore().byId(element).setVisible(visible);
    },
    searchActEconomic: function() {
        var oController = this;
        var activityId = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/BpBasicData/EconomicActivityId");

        var oModelActivity = new sap.ui.model.json.JSONModel("data-map/catalogos/activityE.json")
            .attachRequestCompleted(function() {
                var oDataActivity = oModelActivity.getProperty("/actEco");
                var filtroActivity = _.where(oDataActivity, {
                    idCRM: (activityId)
                });
                if (filtroActivity.length === 0) {
                    sap.m.MessageToast.show("No existe clave de actividad económica " + activityId);
                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/EconomicActivityId", "");
                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescEconomicActivity", "");
                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/GiroId", "");
                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescGiro", "");
                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/IndustryId", "");
                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescIndustry", "");
                } else {
                    var descEconomicActivity = filtroActivity[0].text;
                    var oModelRol = new sap.ui.model.json.JSONModel("data-map/catalogos/industry.json")
                        .attachRequestCompleted(function() {
                            var oDataRol = oModelRol.getProperty("/" + filtroActivity[0].idRol + "");
                            var filtroIndustry = _.where(oDataRol, {
                                idCRM: filtroActivity[0].idIndustry
                            });
                            var oModelGiro = new sap.ui.model.json.JSONModel("data-map/catalogos/rolAE.json")
                                .attachRequestCompleted(function() {
                                    var oDataGiro = oModelGiro.getProperty("/giro");
                                    var filtroGiro = _.where(oDataGiro, {
                                        idCRM: filtroActivity[0].idRol
                                    });

                                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/EconomicActivityId", activityId);
                                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescEconomicActivity", descEconomicActivity);
                                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/GiroId", filtroGiro[0].idCRM);
                                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescGiro", filtroGiro[0].text);
                                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/IndustryId", filtroIndustry[0].idCRM);
                                    this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescIndustry", filtroIndustry[0].text);

                                }.bind(this));
                        }.bind(this));
                }
            }.bind(this));

    },
    pickEconomicActivity: function() {
        var tableDialog = new sap.ui.mw.forms.bp.Basic().economicActivityForm(this);
        var oModelActivity = new sap.ui.model.json.JSONModel("data-map/catalogos/activityE.json")
            .attachRequestCompleted(function() {
                var oDataActivity = oModelActivity.getProperty("/actEco");
                tableDialog.open();
                tableDialog.setModel(oModelActivity);
            });
        tableDialog.attachConfirm(function(evt) {
            var selectedItem = evt.getParameter("selectedItem");
            if (selectedItem) {
                var oCells = selectedItem.getCells();
                var economicActivityID = oCells[1].getText();

                var filtroActivity = _.where(oModelActivity.getProperty("/actEco"), {
                    idCRM: economicActivityID
                });

                var descEconomicActivity = filtroActivity[0].text;
                var oModelRol = new sap.ui.model.json.JSONModel("data-map/catalogos/industry.json")
                    .attachRequestCompleted(function() {
                        var oDataRol = oModelRol.getProperty("/" + filtroActivity[0].idRol + "");
                        var filtroIndustry = _.where(oDataRol, {
                            idCRM: filtroActivity[0].idIndustry
                        });

                        var oModelGiro = new sap.ui.model.json.JSONModel("data-map/catalogos/rolAE.json")
                            .attachRequestCompleted(function() {
                                var oDataGiro = oModelGiro.getProperty("/giro");
                                var filtroGiro = _.where(oDataGiro, {
                                    idCRM: filtroActivity[0].idRol
                                });

                                this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/EconomicActivityId", economicActivityID);
                                this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescEconomicActivity", descEconomicActivity);
                                this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/GiroId", filtroGiro[0].idCRM);
                                this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescGiro", filtroGiro[0].text);
                                this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/IndustryId", filtroIndustry[0].idCRM);
                                this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpBasicData/DescIndustry", filtroIndustry[0].text);

                            }.bind(this));
                    }.bind(this));
            }
        }.bind(this));
    },

    fnDoSearch: function(oEvent) {
        var aFilters = [];
        var sSearchValue = oEvent.getParameter("value");
        var itemsBinding = oEvent.getParameter("itemsBinding");
        if (sSearchValue !== undefined && sSearchValue.length > 0) {
            aFilters.push(new sap.ui.model.Filter("idCRM", sap.ui.model.FilterOperator.Contains, sSearchValue));
            aFilters.push(new sap.ui.model.Filter("text", sap.ui.model.FilterOperator.Contains, sSearchValue));
            itemsBinding.filter(new sap.ui.model.Filter(aFilters, false));
        } else {
            itemsBinding.filter(aFilters);
        }
    },
    onSuccessSave: function(_sourceId, _statusId) {

        if (_statusId === "E0007" && _sourceId === "Z07" && !this.isBasicMinimumPending){
          sap.ui.getCore().byId("btnSendToCoreApplicant").setEnabled(false);
        } else {
          sap.ui.getCore().byId("btnSendToCoreApplicant").setEnabled(true);
        }
        /****************************************************************************
        //  StartChange DVH 26-09-2016
        /****************************************************************************
        //Se inicializa flag en falso para detectar edicion despues de guardar
        /*****************************************************************************/
        this.bEditionAfterSave = false;
        /****************************************************************************
        //  EndChange DVH 26-09-2016
        /****************************************************************************/
        sap.m.MessageToast.show("Registrado.");


    },
    save: function() {

        var oValidatorForm = new sap.ui.validations.Validator();
        oValidatorForm.validate("itfApplicantsName");

        if (this.basicDataValidator()) {
            //**Se settea la propiedad para volver a ver el semaforo en negro***
            this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpMainData/ServiceLevelId", 0);
            new sap.ui.serialize.BP("dataDB", "Customer").serialize(this.toUpperCaseDataModel(this.getView().getModel("BPDetailsModel").getProperty("/results/0")))
                .then(this.onSuccessSave(this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/SourceId"),this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/StatusId")));
        } else {
            if (this.curentTab !== 'Name' && this.lastTab !== 'Name') {
                this.tabSelect("Name");
            }
            oValidatorForm.validate("itfApplicantsName");
            sap.m.MessageToast.show("Completa datos obligatorios");
        }

        this.closeSendCore();

    },
    toUpperCaseDataModel: function(oModel) {
        oModel.BpName.FirstName = oModel.BpName.FirstName.toUpperCase(); //LastName
        oModel.BpName.LastName = oModel.BpName.LastName.toUpperCase();
        oModel.BpName.MiddleName = oModel.BpName.MiddleName.toUpperCase();
        oModel.BpName.SecondName = oModel.BpName.SecondName.toUpperCase();
        return oModel;
    },
    basicDataValidator: function() {
        var isValid = true;

        if (this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpName/FirstName").length === 0 || this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpName/LastName").length === 0) {
            isValid = false;
        }
        return isValid;
    },
    sendToCore: function(_sFuncion) {
        var sFuncion;
        sFuncion = _sFuncion;

        return function() {

            //Middleware de componentes SAPUI5
            var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase;
            //Variables para dialogo.
            var dialogAdds, oCurrentController;


            //Se declaran objetos de Middleware de componentes SAPUI5
            oInputBase = new sap.ui.mw.InputBase();
            oActionBase = new sap.ui.mw.ActionBase();
            oDisplayBase = new sap.ui.mw.DisplayBase();
            oLayoutBase = new sap.ui.mw.LayoutBase();
            oPopupBase = new sap.ui.mw.PopupBase();
            oListBase = new sap.ui.mw.ListBase();

            oCurrentController = this;
            oCurrentController.setFooterBarEnabled(false);
            if (sFuncion !== "SAVE") {
                sap.ui.getCore().byId("btnSendToCoreApplicant").setEnabled(false);
                oCurrentController.activatedSendTocore = true;

            }

            setTimeout(function() {
                dialogAdds = sap.ui.getCore().byId('appDialogSendCoreApplicant');
                //agregar contenido a dialogo
                if (sFuncion === "SAVE") {
                    dialogAdds.addContent(oDisplayBase.createLabel("", "¿Desea guardar?"));
                    dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.save, oCurrentController));
                } else {

                    dialogAdds.addContent(oDisplayBase.createLabel("", "¿Desea enviar la información a Integra?"));
                    dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.sendToBuffer, oCurrentController));
                }
                dialogAdds.addButton(oActionBase.createButton("", "Cancelar", "Default", "", oCurrentController.closeSendCore, oCurrentController));
                dialogAdds.open();
            }, 0);

        };
    },
    closeSendCore: function() {
        if (this.activatedSendTocore) {
            sap.ui.getCore().byId("btnSendToCoreApplicant").setEnabled(true);
            this.activatedSendTocore = false;
        }
        this.setFooterBarEnabled(true);
        var oCurrentDialog = sap.ui.getCore().byId("appDialogSendCoreApplicant");
        //Se destruye el contenido del dialogo y se cierra dialogo
        oCurrentDialog.destroyContent();
        oCurrentDialog.destroyButtons();
        oCurrentDialog.close();
    },

    goToDocs: function(oEvent, validateDocuments) {

        jQuery.sap.require("js.base.DocumentsBase");

        var oDocumentsBase, oInitValidateModel, oFragmentDocuments, oController, oStatusFinal;

        oController = this;

        oStatusFinal = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/StatusId");



        if (oEvent.hasOwnProperty("sId")) {
            oDocumentsBase = new sap.ui.mw.DocumentsBase("oTblDocuments", oEvent.getSource().sId);
            sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(false);
        } else {
            oDocumentsBase = new sap.ui.mw.DocumentsBase("oTblDocuments", "");
        }
        if (oController.isFromService) {
            if (oStatusFinal === "E0006") {
                //05-02-2017  OTX
                //Work around recuperacion de documentos subsecuentes, concluidos los ajustes de opentext
                //se debe habilitar esta linea de codigo nuevamente
                oDocumentsBase.setBlockByStatus(true);
            }
        }


        oController.busyLoader.show("Cargando imagenes...");
        oFragmentDocuments = sap.ui.jsfragment("js.fragments.documents.documentsList", [oController, oDocumentsBase, oController.closeFragmentDialog.bind(oController, oDocumentsBase)]);
        oDocumentsBase.setOFragment(oFragmentDocuments);

        sap.ui.getCore().AppContext.EventBase.setObjectToCloseWithBackEvent(oFragmentDocuments)
        sap.ui.getCore().AppContext.EventBase.setFunctionBackButtonWithOpenDialog(oController.closeFragmentDialog.bind(oController, oDocumentsBase))

        oDocumentsBase.setPathEntity("/results/0/ImageSet/results");


        if (oController.getView().getModel("BPDetailsModel").getProperty(oDocumentsBase.getPathEntity())) {
            if (oController.getView().getModel("BPDetailsModel").getProperty(oDocumentsBase.getPathEntity()).length === 0) {
                oDocumentsBase.onFailLoadModel();

                oController.busyLoader.close();
                if (oDocumentsBase.getBtnTrigger() !== "") {
                    sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(true);
                }

            } else {

                if (this.lastDocumentID !== "") {

                    oDocumentsBase.setVisibleMyPendingImage(this.lastDocumentID);
                    this.activateLongListDocuments = this.openFromNotifications;
                }
                oDocumentsBase.setLongList(this.activateLongListDocuments);
                oInitValidateModel = oDocumentsBase.initValidateModel(oController.getView().getModel("BPDetailsModel"));
                oInitValidateModel.then(oController.loadFragmentDocuments.bind(oController, oDocumentsBase, oFragmentDocuments, validateDocuments));
            }

        } else {
            oDocumentsBase.onFailLoadModel();

            oController.busyLoader.close();
            if (oDocumentsBase.getBtnTrigger() !== "") {
                sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(true);
            }
        }
    },
    /**
     * [closeFragmentDialog Se usa esta función para agregar nueva funcionalidad por módulo del fragment de documents]
     * @param  {[Object]} oDocumentsBase    [Objeto obtenido del binding]
     * @return {[]}                         [NA]
     */
    closeFragmentDialog: function(oDocumentsBase) {
        if (oDocumentsBase.getBtnTrigger() !== "") {
            sap.ui.getCore().byId(oDocumentsBase.getBtnTrigger()).setEnabled(true);
        }
        if (oDocumentsBase.getFlagImageSuccess() && this.lastDocumentID !== "") {
            this.isPendingRead = true;
        }
        sap.ui.getCore().AppContext.EventBase.setObjectToCloseWithBackEvent();
        oDocumentsBase.closeDialogDocuments();
    },

    loadFragmentDocuments: function(oDocumentsBase, oFragmentDocuments, validateDocuments) {
        var loadDocumentsInFragment, oController;
        oController = this;
        loadDocumentsInFragment = oDocumentsBase.loadDataInTableDocuments(oController.getView().getModel("BPDetailsModel"));
        loadDocumentsInFragment.then(oController.showFragmentDocument.bind(oController, oFragmentDocuments, validateDocuments));
    },
    showFragmentDocument: function(oFragmentDocuments, validateDocuments) {

        this.busyLoader.close();
        oFragmentDocuments.open();
        if (typeof(validateDocuments) !== "undefined") {
            if (!validateDocuments.validated) {
                sap.m.MessageToast.show(validateDocuments.message);
            }
        }
    },
    goToPrivacyNotice: function() {
        var oDialogSignature = sap.ui.jsfragment("js.fragments.signature.Signature", this);
        oDialogSignature.setStretch(true);
        oDialogSignature.open();
    },
    showPreventionNotice: function() {
        var oDialogPrevention = sap.ui.jsfragment("js.fragments.signature.PreventionNotice", this);
        oDialogPrevention.open();

    },
    showPrivacyNotice: function() {
        var oDialogPrivacy = sap.ui.jsfragment("js.fragments.signature.PrivacyNotice", this);
        oDialogPrivacy.open();
    },
    closePrivacyNoticeDialog: function(oEvt) {
        var oSource = oEvt.getSource();
        oSource.getParent().close();
        oSource.getParent().destroy(true);
    },
    closePreventionNoticeDialog: function(oEvt) {
        var oSource = oEvt.getSource();
        oSource.getParent().close();
        oSource.getParent().destroy(true);
    },

    closeSignatureDialog: function(oEvt) {
        var oSource = oEvt.getSource();
        oSource.getParent().close();
        oSource.getParent().destroy(true);
    },

    sendToBuffer: function() {
        var sApplicantIdMD, oApplicantModel, oApplicantValidator, oApplicantSerializer;
        var oRequest;
        var oApplicantBuffer;
        var sRequestDescription;
        var oApplicantSync;

        jQuery.sap.require("js.buffer.bp.BPBuffer");
        oApplicantModel = this.getView().getModel("BPDetailsModel");
        sApplicantIdMD = oApplicantModel.getProperty("/results/0/CustomerIdMD");

        jQuery.sap.require("js.validations.applicants.Validator");
        oApplicantValidator = new sap.ui.validations.applicant(oApplicantModel);
        this.bEditionAfterSave = true;

        oApplicantValidator.init();
        sap.ui.getCore().byId("btnSendToCoreApplicant").setEnabled(true);
        if (oApplicantValidator.validated) {

            /****************************************************************************
            //  StartChange DVH 03-10-2016
            /****************************************************************************
            //Guarda los ultimos cambios realizados antes de sincronizar
            /*****************************************************************************/
            if (this.bEditionAfterSave) {
                this.save();
            }

            sRequestDescription = oApplicantModel.getProperty("/results/0/BpName/FirstName") + " " + oApplicantModel.getProperty("/results/0/BpName/MiddleName") + " " + oApplicantModel.getProperty("/results/0/BpName/LastName") + " " + oApplicantModel.getProperty("/results/0/BpName/SecondName");

            oRequest = {
                requestMethod: "POST",
                requestUrl: "/CustomerSet",
                requestBodyId: sApplicantIdMD,
                requestStatus: "Initial",
                requestConfirmed: false,
                requestDescription: sRequestDescription,
                id: sApplicantIdMD,
                NotificationID: sap.ui.getCore().AppContext.NotificationID /// Guardar NotificationID (Para notificaciones con error de CRM)

            };
            jQuery.sap.require("js.sync.bp.BPSynchronizer");
            oApplicantSync = new sap.ui.sync.BP("dataDB", "syncDB", "Customer");
            oApplicantBuffer = new sap.ui.buffer.BP("syncDB", "Customer");
            oApplicantBuffer.postRequest(oRequest);

            jQuery.sap.require("js.serialize.bp.BPSerialize");
            oApplicantSerializer = new sap.ui.serialize.BP("dataDB", "Customer");

            oApplicantSerializer.updateFlagEntitityInQueue(sApplicantIdMD, true)
                .then(function(sApplicantIdMD, oApplicantSync, result) {

                    /////// Eliminar Business Error
                    oApplicantSync.deleteBusinessError({
                        id: sApplicantIdMD
                    }).then(
                        function(result) {
                            this.backToList();
                            sap.m.MessageToast.show("Solicitante preparado para ser enviado a Integra.");

                        }.bind(this)
                    );
                }.bind(this, sApplicantIdMD, oApplicantSync));
        } else {
            if (oApplicantValidator.currentTab && oApplicantValidator.isTab) {
                this.tabSelect(oApplicantValidator.currentTab);
                var oValidatorForm = new sap.ui.validations.Validator();
                oValidatorForm.validate("itfApplicants" + oApplicantValidator.currentTab);
            } else {
                this.goToDocs("", oApplicantValidator);
            }
        }
        this.closeSendCore();
    },
    //Referencias
    createItemTableReference: function(sId, oContext) {
        var oArrayVertical = [];
        oArrayVertical.push(new sap.ui.mw.DisplayBase().createText("", {
            parts: ["ReferencesModel>BusinessName", "ReferencesModel>Name"],
            formatter: function(BusinessName, Name) {
                return BusinessName ? BusinessName.toUpperCase() : Name.toUpperCase();
            }
        }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom"));

        var oArray = this._AppRelationship.getData().referencia.filter(function(v) {
                return v.idCRM === oContext.getProperty("Type");
            }),
            oTypeText = oArray.length === 1 ? oArray[0].text : "EMPLEADOR";

        oArrayVertical.push(new sap.ui.mw.DisplayBase().createLabel("", oTypeText).addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginTopBottom"));
        var oHBox = new sap.m.HBox({
            justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
            items: [new sap.m.VBox({
                items: oArrayVertical
            })]
        });

        var ColumnListItem = new sap.m.CustomListItem({
            type: sap.m.ListType.Active,
            content: oHBox
        });

        return ColumnListItem;

    },
    searchReference: function(oEvt) {
        var txtSeachFilter, allFilter;
        var tableBindings = sap.ui.getCore().byId(this.idForm + "tblAppReferences").getBinding("items");

        txtSeachFilter = oEvt.getParameter("newValue");
        if (txtSeachFilter.length > 0) {
            var filter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            var filter1 = new sap.ui.model.Filter("BusinessName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            allFilter = new sap.ui.model.Filter([filter, filter1], false);
        }
        tableBindings.filter(allFilter);

    },
    renderReferenceDetail: function(oEvt) {
        var sPath = oEvt.getParameter("listItem").getBindingContext("ReferencesModel").getProperty(oEvt.getParameter("listItem").getBindingContext("ReferencesModel").getPath() + "/path"),
            oJsonModel = this.getView().getModel("BPDetailsModel").getProperty("/results/0" + sPath);
        if (oJsonModel.hasOwnProperty("ReferenceTypeID")) {
            new sap.ui.mw.forms.bp.References().createReferenceForm(this, new sap.ui.model.json.JSONModel(oJsonModel), true);
        } else if (oJsonModel.hasOwnProperty("BPIdSpouse")) {
            new sap.ui.mw.forms.bp.References().createSpouseForm(this, new sap.ui.model.json.JSONModel(oJsonModel), true);
        } else {
            var oModel = new sap.ui.model.json.JSONModel(oJsonModel);
            new sap.ui.mw.forms.bp.References().createEmployerForm(this, oModel, true);
            this.getAddressByCP(oJsonModel.Place.PostalCode, this._onSetAddressEmployer);
        }
    },
    addReference: function(oEvent) {
        var selectAppRelationship = sap.ui.getCore().byId(this.idForm + "Relationship").getSelectedKey();
        switch (selectAppRelationship) {
            case "":
                sap.m.MessageToast.show("Debe seleccionar una opción de adicionales");
                break;
            case "ZC16": //Empleador
                var JobId = this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpComplementaryData/JobId");
                if (JobId === "ASAL") {
                    if (!this._onReferenceExist()) {
                        sap.m.MessageToast.show("Ya existe una referencia registrada del mismo tipo 'Empleador'");
                        return;
                    }
                    new sap.ui.mw.forms.bp.References().createEmployerForm(this, this._onCreateJsonReferences("ZC16"), true);
                } else {
                    sap.m.MessageToast.show("Debe seleccionar ocupación 'Asalariado'");
                }
                break;
            case "ZC11": //Cónyuge
                var maritalStatus = this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpBasicData/MaritalStatusId");
                if (maritalStatus == 2) {
                    if (!this._onReferenceExist()) {
                        sap.m.MessageToast.show("Ya existe una referencia registrada del mismo tipo 'Cónyuge'");
                        return;
                    }
                    var oJsonModel = this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpAdditionalData/Spouse");
                    new sap.ui.mw.forms.bp.References().createSpouseForm(this, new sap.ui.model.json.JSONModel(oJsonModel), true);
                } else {
                    sap.m.MessageToast.show("Debe seleccionar estado civil 'Casado'");
                }
                break;
            case "ZC14":
            case "ZC15":
                var oPersonalReferenceSet = this.getView().getModel("BPDetailsModel").getProperty("/results/0/PersonalReferenceSet/results/"),
                    oProduct = this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/ProductId"),
                    duplicate = 0;
                oPersonalReferenceSet.some(function(oValue) {
                    if (oValue.ReferenceTypeID === "ZC14" || oValue.ReferenceTypeID === "ZC15") {
                        duplicate++;
                    }
                });
                if (oProduct === "C_IND_CI") {
                    if (duplicate >= 6) {
                        sap.m.MessageToast.show("No puede capturar más de 6 referencias 'Personales'");
                        return;
                    } else {
                        new sap.ui.mw.forms.bp.References().createReferenceForm(this, this._onCreateJsonReferences(selectAppRelationship), true);
                    }
                } else {
                    // oProduct == "C_GRUPAL_CCR" || oProduct == "C_GRUPAL_CM"
                    if (!this._onReferenceExist()) {
                        sap.m.MessageToast.show("Ya existe una referencia registrada del mismo tipo");
                        return;
                    } else {

                        new sap.ui.mw.forms.bp.References().createReferenceForm(this, this._onCreateJsonReferences(selectAppRelationship), true);
                    }
                }
                break;
            default:
                new sap.ui.mw.forms.bp.References().createReferenceForm(this, this._onCreateJsonReferences(selectAppRelationship), true);

        }
    },
    saveReference: function(oEvt) {
        var oModelForm = oEvt.getSource().getModel("FormModel"),
            oModel = this.getView().getModel("BPDetailsModel"),
            oData = oModelForm.getData(),
            oValidatorForm = new sap.ui.validations.Validator();
        oValidatorForm.validate(this.idForm + "DialogReference");

        if (oValidatorForm.isValid()) {
            if (!oModelForm.getProperty("/CustomerIdMD") && !oData.hasOwnProperty("BPIdSpouse")) {
                var sTypeReference = oModelForm.getProperty("/ReferenceTypeID") ? "/PersonalReferenceSet/results" : "/EmployerSet/results",
                    oReferenceList = oModel.getProperty("/results/0" + sTypeReference);
                if (!oReferenceList) {
                    oReferenceList = [];
                }
                oModelForm.setProperty("/CustomerIdMD", oModel.getProperty("/results/0/CustomerIdMD"));
                oModelForm.setProperty("/CustomerIdCRM", oModel.getProperty("/results/0/CustomerIdCRM"));
                oModelForm.setProperty("/CollaboratorID", oModel.getProperty("/results/0/CollaboratorID"));
                oReferenceList.push(oModelForm.getData());
                oModel.setProperty("/results/0" + sTypeReference, oReferenceList, null, true);


            }
            this._onReferencesMerger();
            oEvt.getSource().getParent().close().destroy(true);
        } else {
            sap.m.MessageToast.show("Completa datos obligatorios");
        }




    },
    onSearchAdressEmployer: function() {
        this.getAddressByCP(sap.ui.getCore().byId("txtAppDgPostCode").getValue(), this._onSetAddressEmployer);
    },
    _onSetAddressEmployer: function(oModel) {
        var oAddressModel = new sap.ui.model.json.JSONModel();
        oAddressModel.setData(oModel);
        var selectEntity = sap.ui.getCore().byId("selectAppDgEntity").setSelectedKey(oAddressModel.getProperty("/results/0/StateId")).setEnabled(false);
        var selectDelegation = sap.ui.getCore().byId("selectAppDgDelegation").setModel(oAddressModel).setEnabled(false);
        var txtCity = sap.ui.getCore().byId("txtAppDgCity").setValue(oAddressModel.getProperty("/results/0/City"));
        var selectSuburb = sap.ui.getCore().byId("selectAppDgSuburb").setModel(oAddressModel).setSelectedKey(oAddressModel.getProperty("/results/0/"));
        sap.ui.getCore().byId("selectAppDgSuburbB").setModel(oAddressModel).setSelectedKey(oAddressModel.getProperty("/results/0/"));
        var appSuburbTableDialog = oAddressModel.getProperty("/results/0/SuburbName");
        if (oAddressModel.getProperty("/results").length > 0) {
            selectEntity.addStyleClass("statusSuccesValue");
            selectDelegation.addStyleClass("statusSuccesValue");
            selectSuburb.addStyleClass("statusSuccesValue");
            txtCity.setValueState(sap.ui.core.ValueState.Success);
        }
    },
    _onReferencesMerger: function() {
        var oModel = this.getView().getModel("BPDetailsModel"),
            oReferencesName = oModel.getProperty("/results/0/PersonalReferenceSet/results"),
            oEmployersName = oModel.getProperty("/results/0/EmployerSet/results"),
            oSpouseName = oModel.getProperty("/results/0/BpAdditionalData/Spouse"),
            oJsonList, oArrayList = [];

        if (oSpouseName.BpNameData.FirstName) {
            oArrayList.push({
                Name: oSpouseName.BpNameData.LastName + " " +
                    oSpouseName.BpNameData.SecondName + " " +
                    oSpouseName.BpNameData.FirstName + " " +
                    oSpouseName.BpNameData.MiddleName,
                Type: "ZC11",
                path: "/BpAdditionalData/Spouse"
            });
        }
        _.each(oReferencesName, function(oArray, iIndex) {
            oJsonList = {};
            oJsonList.Name = oArray.Name.LastName + " " +
                oArray.Name.SecondName + " " +
                oArray.Name.FirstName + " " +
                oArray.Name.MiddleName;
            oJsonList.Type = oArray.ReferenceTypeID;
            oJsonList.path = "/PersonalReferenceSet/results/" + iIndex;
            oArrayList.push(oJsonList);
        });
        _.each(oEmployersName, function(oArray, iIndex) {
            oJsonList = {};
            oJsonList.Name = oArray.Name.LastName + " " +
                oArray.Name.SecondName + " " +
                oArray.Name.FirstName + " " +
                oArray.Name.MiddleName;
            oJsonList.Type = "ZC16";
            oJsonList.BusinessName = oArray.BusinessName;
            oJsonList.path = "/EmployerSet/results/" + iIndex;
            oArrayList.push(oJsonList);
        });
        var oModelMerged = new sap.ui.model.json.JSONModel(oArrayList);
        this.getView().setModel(oModelMerged, "ReferencesModel");
    },
    _onCreateJsonReferences: function(_sType) {
        if (_sType === "ZC16") {
            return new sap.ui.model.json.JSONModel({
                BusinessName: "",
                CollaboratorID: "",
                CustomerIdCRM: "",
                CustomerIdMD: "",
                EmployerID: "",
                IsCompany: false,
                Name: {
                    FirstName: "",
                    LastName: "",
                    MiddleName: "",
                    SecondName: ""
                },
                Place: {
                    BetweenStreets1: "",
                    BetweenStreets2: "",
                    City: "",
                    Comments: "",
                    CountryID: "",
                    InteriorNumber: "",
                    LocationReference: "",
                    OutsideNumber: "",
                    PostalCode: "",
                    StateId: "",
                    Street: "",
                    Suburb: "",
                    TownId: ""
                }
            });
        } else {
            return new sap.ui.model.json.JSONModel({
                CollaboratorID: "",
                CustomerIdCRM: "",
                CustomerIdMD: "",
                Name: {
                    FirstName: "",
                    LastName: "",
                    MiddleName: "",
                    SecondName: ""
                },
                PersonalReferenceID: "",
                Phone: "",
                ReferenceTypeID: _sType
            });
        }
    },
    _onReferenceExist: function() {
        var oDataReferences = this.getView().getModel("ReferencesModel").getData(),
            oResult = oDataReferences.filter(function(oArray) {
                return oArray.Type === sap.ui.getCore().byId(this.idForm + "Relationship").getSelectedKey();
            }.bind(this));
        if (oResult.length === 0) {
            return true;
        } else {
            return false;
        }
    },
    onCancel: function() {
        this.close().destroy(true);
    },
    onCheckBox: function(oEvt) {
        if (oEvt.getParameter("selected")) {
            sap.ui.getCore().byId("txtAppDgEmpName").setValue("");
            sap.ui.getCore().byId("txtAppDgEmpSecondName").setValue("");
            sap.ui.getCore().byId("txtAppDgEmpLastname").setValue("");
            sap.ui.getCore().byId("txtAppDgEmpSurname").setValue("");
        } else {
            sap.ui.getCore().byId("txtAppDgEmpRazon").setValue("");
        }
    },
    onChangeEntity: function(oEvt) {
        oEvt.getSource().getModel("FormModel").setProperty("/Place/StateId", oEvt.getSource().getSelectedItem().getProperty("key"));
    },
    onChangeJob: function(oEvt) {
        oEvt.getSource().getModel("FormModel").setProperty("/Job", oEvt.getSource().getSelectedItem().getProperty("key"));
    },
    //Nombre
    onChangeTimeContact: function(oEvt) {
        if (!oEvt.getParameter("valid")) {
            return;
        }
        var oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
            pattern: "HH:mm"
        });
        var oNewTime = sap.ui.core.format.DateFormat.getTimeInstance({
            pattern: "PTH'H'm'M'SS'S'"
        }).format(oDateFormat.parse(oEvt.getParameter("value")));
        oEvt.getSource().getModel("BPDetailsModel").setProperty("/results/0/BpMainData/ContactLaterTime", oNewTime);
    },
    bindindStProspect: function(_statusProspect) {
        var selectAppStProspect = sap.ui.getCore().byId("selectAppStProspect");

        var oItemSelectStProspect = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });
        var path = '/' + _statusProspect;

        selectAppStProspect.bindItems({
            path: path,
            template: oItemSelectStProspect,
            change: [null, null]
        });
        selectAppStProspect.setModel(sap.ui.getCore().getModel("estatusProspecto"));

    },
    onChangeStProspect: function(oEvt) {
        var oSource, CustomerIdCRM, selectAppStProspect, selectAppReason, pickerAppContact, appTimeContect, selectAppStProspectText;
        oSource = oEvt.getSource().getSelectedItem();
        if (oSource) {
            selectAppStProspect = oEvt.getSource().getSelectedItem().getProperty("key");
            selectAppStProspectText = oEvt.getSource().getSelectedItem().getProperty("text");
            CustomerIdCRM = oSource.getModel("BPDetailsModel").getProperty("/results/0/CustomerIdCRM");
            oSource.getModel("BPDetailsModel").setProperty("/results/0/BpMainData/StatusId", selectAppStProspect);
        } else {
            selectAppStProspect = "E0000";
            selectAppStProspectText = "Interesado";
            this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpMainData/StatusId", "E0003");
            CustomerIdCRM = this.getView().getModel("BPDetailsModel").getProperty("/results/0/CustomerIdCRM");
        }


        selectAppReason = sap.ui.getCore().byId("selectAppReason");
        pickerAppContact = sap.ui.getCore().byId("pickerAppContact");
        appTimeContect = sap.ui.getCore().byId("appTimeContect");
        if (CustomerIdCRM === "") {

            if ((selectAppStProspect === "E0000") || (selectAppStProspect === "E0003")) {
                selectAppReason.setVisible(true);
                pickerAppContact.setVisible(false);
                appTimeContect.setVisible(false);
            }
            switch (selectAppStProspect) {
                case 'E0000':
                case 'E0003':
                    // ***INTERESADO***
                    selectAppReason.setVisible(true);
                    pickerAppContact.setVisible(false);
                    appTimeContect.setVisible(false);

                    var dataStatus = new sap.ui.model.json.JSONModel("data-map/catalogos/motivoRechazo.json");
                    var oItemSelectReason = new sap.ui.core.Item({
                        key: "{idCRM}",
                        text: "{text}"
                    });
                    path = '/' + selectAppStProspectText;
                    selectAppReason.bindItems({
                        path: path,
                        template: oItemSelectReason,
                        change: [null, null]
                    });
                    selectAppReason.setModel(dataStatus);
                    break;
                case 'E0006':
                    // ***PROCESO DE ORIGINACION***
                    selectAppReason.setVisible(false);
                    pickerAppContact.setVisible(false);
                    appTimeContect.setVisible(false);

                    break;
            }
            selectAppStProspect = "E0000";


        } else {

            switch (selectAppStProspect) {
                case 'E0000':
                case 'E0002':
                case 'E0003':
                case 'E0005':
                    selectAppReason.setVisible(true);
                    pickerAppContact.setVisible(false);
                    appTimeContect.setVisible(false);
                    dataStatus = new sap.ui.model.json.JSONModel("data-map/catalogos/motivoRechazo.json");
                    oItemSelectReason = new sap.ui.core.Item({
                        key: "{idCRM}",
                        text: "{text}"
                    });
                    path = '/' + selectAppStProspectText;
                    selectAppReason.bindItems({
                        path: path,
                        template: oItemSelectReason,
                        change: [null, null]
                    });
                    selectAppReason.setModel(dataStatus);
                    break;
                case 'E0007': // ***Actualizacón de datos***

                    if (!this.getView().getModel("BPDetailsModel").getProperty("/results/0/IsEntityInQueue")) {
                        sap.ui.getCore().byId("applicantFormName").removeStyleClass("enableSelectStatus")
                            .addStyleClass("enableNameByModification");
                        selectAppReason.setVisible(false);
                        pickerAppContact.setVisible(false);
                        appTimeContect.setVisible(false);
                        if(this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/SourceId")==="Z14"){
                            if (this.getView().getModel("BPDetailsModel").getProperty("/results/0/ImageSet/results/").length !== 0) {

                                var hasSccItem = false;

                                this.getView().getModel("BPDetailsModel").getProperty("/results/0/ImageSet/results/").some(function(image, index) {
                                    if (image.DocumentId === "SCC") {
                                        hasSccItem = true;
                                    }
                                });

                                if (!hasSccItem) {
                                    this.getView().getModel("BPDetailsModel").getProperty("/results/0/ImageSet/results/").unshift({
                                        "ImageIdSharepoint": "",
                                        "DocumentId": "SCC",
                                        "ImageBase64": "",
                                        "CustomerIdCRM": "",
                                        "InsuranceBeneficiaryIdMD": " 1",
                                        "IsReceived": true,
                                        "DocumentStatusId": "empty",
                                        "DocumentStatusText": "Sin Captura",
                                        "CustomerIdMD": "",
                                        "DueDate": null,
                                        "InsuranceIdMD": "",
                                        "LoanRequestIdCRM": "",
                                        "CollaboratorID": "",
                                        "LoanRequestIdMD": ""
                                    })
                                }
                            }
                        }
                    }
                    break;
                case 'E0001': // ***POR CONTACTAR***
                    selectAppReason.setVisible(false);
                    pickerAppContact.setVisible(false);
                    appTimeContect.setVisible(false);
                    break;
                case 'E0004':
                    // ***CONTACTAR POSTERIORMENTE***

                    /************27-06-2016**************/
                    /*Reglas de contactar posteriormente*/
                    /************27-06-2016**************/
                    var oModel = this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/");
                    if (oModel.hasOwnProperty("IsContactLaterEditable")) {
                        var isContactLaterEditable = oModel.IsContactLaterEditable;
                        if (isContactLaterEditable) { // no se puede edita
                            sap.m.MessageToast.show("¡Ouch! Has llegado al límite permitido para reprogramar esta visita");
                            sap.ui.getCore().byId("pickerAppContact").setEnabled(false);
                            sap.ui.getCore().byId("appTimeContect").setEnabled(false);
                        }
                    }
                    /************27-06-2016**************/
                    /*Reglas de contactar posteriormente*/
                    /************2
                    /************27-06-2016**************/
                    selectAppReason.setVisible(false);
                    pickerAppContact.setVisible(true);
                    appTimeContect.setVisible(true);

                    break;
                case 'E0006':
                    // ***PROCESO DE ORIGINACION***
                    if (this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/SourceId") === "Z14" && !this.getView().getModel("BPDetailsModel").getProperty("/results/0/IsEntityInQueue")) {

                        sap.ui.getCore().byId("applicantFormName").removeStyleClass("enableNameByModification").addStyleClass("enableSelectStatus");
                        var _index = "";

                        this.getView().getModel("BPDetailsModel").getProperty("/results/0/ImageSet/results/").some(function(image, index) {
                            if (image.DocumentId === "SCC") {
                                _index = index;
                            }
                        });

                        if (_index !== "") {
                            console.log(_index);
                            this.getView().getModel("BPDetailsModel").getProperty("/results/0/ImageSet/results/").splice(_index, 1);
                        }

                    }
                    selectAppReason.setVisible(false);
                    pickerAppContact.setVisible(false);
                    appTimeContect.setVisible(false);
                    break;
            } // END CASE

            if (this.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/SourceId") === "Z14") {

                selectAppStProspect = 'E0007Z14';
            } else {
                selectAppStProspect = 'E0002';
            }

            // es nuevo

        }


        this.bindindStProspect(selectAppStProspect);

    },
    onChanging: function(_oLocalRegularExpression) {
        var oLocalRegularExpression;

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
            }
        };
    },
    onChangeReason: function(oEvt) {
        var oSource = oEvt.getSource();
        oSource.getModel("BPDetailsModel").setProperty("/results/0/BpMainData/StatusReasonId", oSource.getSelectedItem().getProperty("key"));
    },
    onFormatterTime: function(oValue) {
        var oTimeFormat, iTZOffsetMs, sTimeStr;
        oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
            pattern: "PTH'H'm'M'SS'S'"
        });

        if (oValue && oValue.hasOwnProperty("ms")) {
            iTZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
            sTimeStr = oTimeFormat.format(new Date(oValue.ms + iTZOffsetMs));
        } else {
            sTimeStr = oValue;
        }

        return oTimeFormat.parse(sTimeStr);
    },
    onEditAfterSave: function() {

        this.bEditionAfterSave = true;
    },
    /**
     * DVH - addFunction
     * [onSelectedOption funcion para control de respuesta SI es persona fisica con actividad empresarial o NO]
     * @return {[type]} [description]
     */
    onSelectedOption: function() {
        var bIndivWBusiness = sap.ui.getCore().byId(this.idForm + "GroupOption").getSelectedIndex() === 0 ? true : false;
        this.getView().getModel("BPDetailsModel").setProperty("/results/0/BpComplementaryData/IsIndivWBusiness", bIndivWBusiness);
        if (bIndivWBusiness) {
            sap.ui.getCore().byId(this.idForm + "txtAppKeyRFC").setVisible(bIndivWBusiness);
            sap.ui.getCore().byId(this.idForm + "txtAppFiel").setVisible(bIndivWBusiness);
            sap.ui.getCore().byId(this.idForm + "complementCurp").setText('CURP*');
        } else {
            sap.ui.getCore().byId(this.idForm + "txtAppKeyRFC").setValue('');
            sap.ui.getCore().byId(this.idForm + "txtAppFiel").setValue('');
            sap.ui.getCore().byId(this.idForm + "txtAppKeyRFC").setVisible(bIndivWBusiness);
            sap.ui.getCore().byId(this.idForm + "txtAppFiel").setVisible(bIndivWBusiness);
            sap.ui.getCore().byId(this.idForm + "complementCurp").setText('CURP');
        }
    },
    disableForms: function(tab) {

        var oController = this;
        var oTab = tab;

        return new Promise(function(resolve) {
            var bDisable, oEnableSelectStatus = false,
                oAddStyle = "";
            var bSentToCore = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/IsEntityInQueue"),
                sStatusId = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/StatusId"),
                oSourceId = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/SourceId"),
                oCustomerIdCRM = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/CustomerIdCRM");


            if (bSentToCore) { //Enviado al core, no deberia de tener la posibilidad de guardar nada
                // return bSentToCore;
                bDisable = bSentToCore;
            } else {
                if (oCustomerIdCRM !== "") { //Viene del servicio, y puede editar y guardar informacion
                    switch (sStatusId) {
                        case "E0006":
                            bDisable = true;
                            if (oSourceId === "Z14" && oTab === "Name") {
                                bDisable = false;
                                oEnableSelectStatus = true;
                                oAddStyle = "enableSelectStatus";
                            }
                            if (oTab === "Complementary" || oTab === "Reference") {
                                bDisable = false;
                            }
                            break;
                        case "E0007":
                            if(oSourceId ==="Z07"){
                                bDisable = false;
                            }else{
                                bDisable = true;
                                if (oTab === "Name") {
                                    bDisable = false;
                                    oEnableSelectStatus = true;
                                    oAddStyle = "enableNameByModification";
                                }
                                if (oTab === "Basic") {
                                    bDisable = false;
                                    oEnableSelectStatus = true;
                                    oAddStyle = "enableBasicByModification";
                                }
                                if (oTab === "Complementary" || oTab === "Reference") {
                                    bDisable = false;
                                }
                            }
                            break;
                        case "E0005":
                            oController.setFooterBarEnabled(false);
                            bDisable = true;
                            break;
                        case "E0002":
                            oController.setFooterBarEnabled(false);
                            bDisable = true;
                            break;
                        default:
                            oController.isFromService = false;
                            bDisable = false;
                            break;
                    }
                } else { //guardado sin enviar al core, puede editar cualquier dato
                    bDisable = false;
                }
            }

            resolve([{ "bDisable": bDisable, "oEnableSelectStatus": oEnableSelectStatus, "oAddStyle": oAddStyle }]);

        });
    },
    setSupplierOfApplicant: function(_entity, _id, _tab) {
        jQuery.sap.require("js.serialize.bp.BPSerialize");
        var oSupplierApplicant = new sap.ui.serialize.BP("dataDB", "Customer");

        oSupplierApplicant.getSupplierBp(_entity, _id).then(function(resp) {
            this.isFromService = resp;
            this.tabSelect(_tab);
        }.bind(this));
    },
    onProductSelected: function() {
        return new Promise(function(resolve) {
            new sap.ui.mw.FileBase().loadFile("data-map/catalogos/productsIdCrm.json").then(function(oDataProducts) {
                new sap.ui.mw.FileBase().loadFile("data-map/catalogos/crossSellProducts.json").then(function(oDataProducts, oCrossellDataProducts) {
                    var aProducts = oDataProducts.getProperty("/products");
                    var aCrossSellProducts = oCrossellDataProducts.getProperty("/crossSellProducts");

                    //Se permiten nombres repetidos de venta cruzada pues la seleccion es por el SourceId el cual es único
                    _.each(aCrossSellProducts, function(item) {
                        if (item.idCRM !== "") {
                            aProducts.push(item);
                        }
                    }.bind(this));
                    oDataProducts.setProperty("/products", aProducts);
                    resolve(oDataProducts);
                }.bind(this, oDataProducts));

            }.bind(this));
        }.bind(this));
    },
    _AppRelationship: new sap.ui.model.json.JSONModel("data-map/catalogos/references.json")
});
