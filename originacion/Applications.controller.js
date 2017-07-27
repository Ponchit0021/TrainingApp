sap.ui.controller("originacion.Applications", {

    /**
     * [queryParams - Contiene los parametros de la ruta]
     * @type {Object}
     * author: israel
     */
    queryParams: {},
    aCrossSellProducts: {},

    /**
     * [getCustomerSerialize Encapsulamiento de la instancia de LoanRequestSerialize, basicamente para no escribir dos líneas cada vez que se requiere la instancia]
     * @param  {[String]} _oDataBase                [Nombre de la base de datos]
     * @return {[sap.ui.serialize.LoanRequest]}     [nueva instancia del LoanRequestSerialize]
     */
    getCustomerSerialize: function(_oDataBase) {
        return new sap.ui.serialize.LoanRequest(_oDataBase);
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
    getShortProductDescription: function(idProduct) {
        var product = _.where(this.aCrossSellProducts, { idCRM: idProduct })
        return product[0].shortName;

    },

    onInit: function() {

        jQuery.sap.require("js.base.NavigatorBase", "js.serialize.loanRequest.LoanRequestSerialize", "js.base.DisplayBase", "js.base.FileBase");
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("applicationList").attachMatched(this._onRouteMatched, this);

    },
    _onRouteMatched: function(oEvent) {
        sap.ui.getCore().byId("rbNTodas").setSelected(true);
        var oRouterArgs = oEvent.getParameter("arguments");
        this.queryParams = oRouterArgs["?query"] || {};
        this.getApplications()
            .then(this.renderApplications.bind(this));
        this.onSetFilters();
    },
    getApplications: function() {
        var loanRequestSerialize, _self;
        _self = this;
        loanRequestSerialize = this.getCustomerSerialize("dataDB");

        return new Promise(function(resolve) {
            sap.ui.getCore().AppContext.loader.show("Cargando Solicitudes");
            setTimeout(function() {
                new sap.ui.mw.FileBase().loadFile("data-map/catalogos/crossSellProducts.json")
                    .then(function(aProducts) {
                        _self.aCrossSellProducts = aProducts.getProperty("/crossSellProducts");
                        loanRequestSerialize.getMainModel("LoanRequestSet", sap.ui.getCore().AppContext.Promotor, _self.queryParams.module).then(resolve);
                    });

            }, 0);
        });
    },
    renderApplications: function(_aApplications) {
        var oTable, _self;
        oTable = sap.ui.getCore().byId("tblListSolicitudes", "items");
        _self = this;
        oTable.setModel(_aApplications);
        oTable.bindAggregation("items", {
            path: "/results",
            factory: function(_id, _context) {
                return _self.bindApplicationTable(_context);
            }

        });
        sap.ui.getCore().AppContext.loader.close();
    },
    getCustomerName: function(_context) {
        var sLastName = "",
            sSecondName = "",
            sFirstName = "",
            sMiddleName = "";
        if (_context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpName/LastName")) {
            sLastName = _context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpName/LastName").toUpperCase()
        }
        if (_context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpName/SecondName")) {
            sSecondName = _context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpName/SecondName").toUpperCase()
        }
        if (_context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpName/FirstName")) {
            sFirstName = _context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpName/FirstName").toUpperCase()
        }
        if (_context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpName/MiddleName")) {
            sMiddleName = _context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpName/MiddleName").toUpperCase()
        }
        return sLastName + " " + sSecondName + " " + sFirstName + " " + sMiddleName;
    },

    /**
     * [bindApplicationTable Bindeo desde el factory de la tabla principal de solicitudes]
     * @param  {[type]} _context [Obtiene el contexto actual de la row de los datos bindeados previamente]
     * @return {[NA]}          [NA]
     */
    bindApplicationTable: function(_context) {

        var oDisplayBase, oItemsApplications, oName, oType, oSourceId, sDate;
        var sProductType;
        var iCycle, bIsEntityInQueue;

        oDisplayBase = new sap.ui.mw.DisplayBase();
        oItemsApplications = new sap.m.ColumnListItem({});
        oItemsApplications.setType(sap.m.ListType.Active);


        sProductType = _context.getProperty(_context.sPath + "/ProductID");
        bIsEntityInQueue = _context.getProperty(_context.sPath + "/IsEntityInQueue");
        iCycle = _context.getProperty(_context.sPath + "/GeneralLoanRequestData/Cycle");
        oType = iCycle === 0 ? 'Solicitud' : 'Próxima Renovación';


        switch (sProductType) {
            case "C_IND_CI":

                oName = this.getCustomerName(_context);

                oSourceId = _context.getProperty(_context.sPath + "/LinkSet/results/0/Customer/BpMainData/SourceId");
                if (oSourceId === "Z07") {
                    oType = 'Próxima Renovación';
                    oItemsApplications.addCell(new sap.m.ObjectHeader({
                        icon: "sap-icon://customer-history",
                        attributes: [
                            new sap.m.ObjectAttribute({
                                text: oType
                            })
                        ]
                    }));
                } else {

                    oItemsApplications.addCell(new sap.m.ObjectHeader({
                        icon: "sap-icon://opportunities",
                        attributes: [
                            new sap.m.ObjectAttribute({
                                text: oType
                            })
                        ]
                    }));
                }

                break;

            case "C_GRUPAL_CCR":
            case "C_GRUPAL_CM":
                oName = _context.getProperty(_context.sPath + "/GroupRequestData/GroupName").toUpperCase();

                if (iCycle === 0) {
                    oItemsApplications.addCell(new sap.m.ObjectHeader({
                        icon: "sap-icon://opportunities",
                        attributes: [
                            new sap.m.ObjectAttribute({
                                text: oType
                            })
                        ]
                    }));
                } else {
                    oItemsApplications.addCell(new sap.m.ObjectHeader({
                        icon: "sap-icon://customer-history",
                        attributes: [
                            new sap.m.ObjectAttribute({
                                text: oType
                            })
                        ]
                    }));
                }
                break;
            case "C_IND_CA":
            case "C_IND_CA_CCR":
            case "C_IND_CCM_CCR":
            case "C_IND_CCM":
                oName = this.getCustomerName(_context);
                oType = this.getShortProductDescription(_context.getProperty(_context.sPath + "/ProductID"));
                oItemsApplications.addCell(new sap.m.ObjectHeader({
                    icon: "sap-icon://family-care",
                    attributes: [
                        new sap.m.ObjectAttribute({
                            text: oType
                        })
                    ]
                }));
                break;
        }


        if (!_.isUndefined(bIsEntityInQueue)) {
            oItemsApplications.addCell(new sap.m.ObjectHeader({
                icon: "sap-icon://lateness"
            }));
        } else {
            oItemsApplications.addCell(oDisplayBase.createText("", ""));
        }

        oItemsApplications.addCell(oDisplayBase.createText("", oName));
        sDate = _context.getProperty(_context.sPath + "/GeneralLoanRequestData/StartDate");
        if (sDate != null && sDate != "") {
            oItemsApplications.addCell(oDisplayBase.createText("", oDisplayBase.formatDate(sDate, "dd.MM.yyyy")));
        } else {
            oItemsApplications.addCell(oDisplayBase.createText("", "No disponible"));
        }
        return oItemsApplications;
    },
    /**
     * [onSelectApplications Función que se dispara al presionar cualquier elemento de la tabla de solicitudes]
     * @param  {[map]} evt      [Mapa con el contexto seleccionado]
     * @return {[NA]}           [NA]
     */
    onSelectApplications: function(evt) {
        var oController, oRouter, oCurrentPath, oApplicationsModel, oCurrentModel, currentItem;
        oCurrentPath, oApplicationsModel, oCurrentModel;
        oController = this;
        oCurrentPath = evt.getParameters().listItem.getBindingContext().sPath;
        oApplicationsModel = sap.ui.getCore().byId("tblListSolicitudes");
        oCurrentModel = oApplicationsModel.getModel();
        currentItem = oCurrentModel.getProperty(oCurrentPath);

        oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        sap.ui.getCore().AppContext.oCurrentLoanRequest = currentItem;
        sap.ui.getCore().AppContext.bIsCreating = false;

        if (oController.queryParams.module !== "insurances") { //Cuando no se selecciona Seguros

            switch (currentItem.ProductID) {
                case "C_IND_CI":
                    //Nos dirigimos a la pantalla de Solcitud Individual
                    /// Set de Aval
                    oRouter.navTo("IndividualApplications", {
                        aplicationId: currentItem.LoanRequestIdMD,
                        query: {
                            tab: "Main"
                        }
                    }, false);

                    break;
                case "C_GRUPAL_CCR":
                case "C_GRUPAL_CM":
                    oRouter.navTo("groupalApplication", {
                        grupalTypeID: currentItem.ProductID,
                        loanRequestId: currentItem.LoanRequestIdMD,
                        query: {
                            tab: "Main"
                        }
                    }, false);
                    break;
                case "C_IND_CA":
                case "C_IND_CA_CCR":
                case "C_IND_CCM_CCR":
                case "C_IND_CCM":
                    oRouter.navTo("crossSellApplication", {
                        aplicationId: currentItem.LoanRequestIdMD,
                        query: {
                            tab: "Main"
                        }
                    }, false);
                    break;


            }

        } else { //Se selecciona Seguros
            sap.ui.getCore().AppContext.ApplicationMerge = currentItem;
            switch (currentItem.ProductID) {
                case "C_IND_CI":
                    oRouter.navTo("insuranceDetails", {
                        LoanRequestIdCRM: currentItem.LoanRequestIdCRM !== "" ? currentItem.LoanRequestIdCRM : currentItem.LoanRequestIdMD,
                        CustomerIdCRM: currentItem.LinkSet.results[0].CustomerIdCRM !== "" ? currentItem.LinkSet.results[0].CustomerIdCRM : currentItem.LinkSet.results[0].CustomerIdMD
                    }, false);
                    break;
                case "C_GRUPAL_CM":
                case "C_GRUPAL_CCR":
                    sap.ui.getCore().AppContext.loader.show("Cargando lista de integrantes");
                    var oLoanRequestIdCRM = currentItem.LoanRequestIdCRM !== "" ? currentItem.LoanRequestIdCRM : currentItem.LoanRequestIdMD;
                    oRouter.navTo("insuranceMaster", { query: { LoanRequestIdCRM: oLoanRequestIdCRM } });
                    break;
            }
        }
    },
    /**
     * [backToTiles Navegación una posición atrás en la ruta]
     * @return {[NA]} [NA]
     */
    backToTiles: function() {
        window.history.go(-1);
    },
    /**
     * [addApplications         Evento que ocurre al presionar el botón de Agregar Solicitud]
     *                             Abre un dialogo con tres opciones diferentes referentes al tipo de solicitud.
     */
    addApplications: function(oEvent) {


        var oListBase, myProductsModel, oProductListItem, oListProducts, currentView;
        currentView = this;

        if (oEvent.hasOwnProperty("sId")) {
            oEvent.getSource().setEnabled(false);
        }
        setTimeout(function() {
            oListBase = new sap.ui.mw.ListBase();
            var oActionBase = new sap.ui.mw.ActionBase();
            var selectDialogProduct = sap.ui.getCore().byId("nsDialogProduct");
            myProductsModel = new sap.ui.model.json.JSONModel("data-map/catalogos/productsIdCrmPantalla.json");
            oProductListItem = new sap.m.StandardListItem({
                title: "{productName}",
                type: "Active"
            });
            oListProducts = oListBase.createList("nsListProducts", "", sap.m.ListMode.SingleSelectMaster, myProductsModel, "/products", oProductListItem, currentView.pressProductList, currentView);
            selectDialogProduct.addContent(oListProducts);
            selectDialogProduct.addButton(oActionBase.createButton("", "Cancelar", "Transparent", "sap-icon://sys-cancel", currentView.closeFilterDialogProduct, currentView));
            selectDialogProduct.open();
        }, 100);
    },
    /**
     * [pressProductList Evento que ocurre al presionar un elemento del dialogo: nsDialogProduct]
     * @param  {[map]} oEvent   [Mapa con el contexto del producto seleccionado]
     * @return {[NA]}           [NA]
     */
    pressProductList: function(oEvent) {
        var oCurrentPath, oProductModel, oCurrentModel, currentItem, router;
        oCurrentPath = oEvent.getParameters().listItem.getBindingContext().sPath;
        oProductModel = sap.ui.getCore().byId("nsListProducts");
        oCurrentModel = oProductModel.getModel();
        currentItem = oCurrentModel.getProperty(oCurrentPath);
        //test = currentItem; //revisar

        router = sap.ui.core.UIComponent.getRouterFor(this);
        sap.ui.getCore().AppContext.oCurrentLoanRequest = null;
        sap.ui.getCore().AppContext.bIsCreating = true;

        if (currentItem.idCRM === 'C_IND_CI') {
            this.showApplicantsList();
            this.closeFilterDialogProduct();
        } else {
            currentItem.productView = "groupalApplication"
            router.navTo(currentItem.productView, {
                grupalTypeID: currentItem.idCRM,
                loanRequestId: 0,
                query: {
                    tab: "Main"
                }
            }, false);
            this.closeFilterDialogProduct();
        }
        sap.ui.getCore().AppContext.Navigation.detail = true;
        sap.ui.getCore().AppContext.Navigation.back = function(_sProductID) {
            var sProductID = _sProductID;
            return function() {
                if (sProductID === "C_IND_CI") {
                    ////// individual
                } else {

                    var oCurrentDialog = sap.ui.getCore().byId("appDialogDetailMember");
                    //Se destruye el contenido del dialogo y se cierra dialogo
                    if (oCurrentDialog) {
                        oCurrentDialog.destroyContent();
                        oCurrentDialog.destroyButtons();
                        oCurrentDialog.close();
                    }
                }
                window.history.go(-1);
            }
        }(currentItem.idCRM);
    },

    /**
     * [showApplicantsList Muestra los solicitantes sin oportunidad asignada por la opción de crédito individual]
     * @return {[NA]} [NA]
     */
    showApplicantsList: function() {

        var oModel, currentController;
        jQuery.sap.require("js.kapsel.Rest");

        jQuery.sap.require("js.serialize.bp.BPSerialize");
        currentController = this;
        bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudes");
        bdLoader.setText("Cargando Solicitantes");
        setTimeout(function() {
            bdLoader.open();
            var customerSerialize = new sap.ui.serialize.BP("dataDB", "Customer");
            customerSerialize.getMainModelWithOutLoan("CustomerSet", sap.ui.getCore().AppContext.Promotor, "C_IND_CI").then(function(oModel) {

                currentController.bindTable(oModel, currentController);

                bdLoader.close();

            }).catch(function(error) {


            });
        }, 0);
    },
    bindTable: function(oModel, oController) {
        //variables tabla
        var selectDialogApplicants, oTableIndividual, tableFields, tableFieldVisibility, tableFieldDemandPopid, tableFieldsWidth, tblListIndividual;
        var oListBase = new sap.ui.mw.ListBase();
        var oInputBase = new sap.ui.mw.InputBase();
        //propiedades de la tabla
        tableFields = ["Nombre", "Fecha de Alta", "Id Cliente"];
        tableFieldVisibility = [true, true, true];
        tableFieldDemandPopid = [false, false, true];
        tableFieldsWidth = ["60%", "auto", "auto"];

        selectDialogApplicants = sap.ui.getCore().byId("nsDialogApplicants");

        oTableIndividual = oListBase.createTable("tblListIndividual", "", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, tableFieldsWidth, oController.onDetailIndividual, oController);
        tblListIndividual = sap.ui.getCore().byId("tblListIndividual");

        tblListIndividual.setModel(oModel);
        tblListIndividual.bindAggregation("items", {
            path: "/results",
            factory: function(_id, _context) {
                return oController.createItemTableApplicants(_context);
            },
        });
        //filtra lista de solicitantes - solo credito individual

        var binding = oTableIndividual.getBinding("items");

        selectDialogApplicants.addContent(oInputBase.createSearchField("idSearchSolicitante", oController.searchMemberSolicitante, oController, "100%"));
        selectDialogApplicants.addContent(oTableIndividual);
        selectDialogApplicants.addButton(oActionBase.createButton("", "Cancelar", "Transparent", "sap-icon://sys-cancel", oController.closeFilterDialogApplicant, oController));
        selectDialogApplicants.open();

    },
    searchMemberSolicitante: function(evt) {
        //filtro de busqueda
        var aFilters, txtSeachFilter, table, binding, filter, filter2, filter3, filter4;
        txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            filter = new sap.ui.model.Filter("BpName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter2 = new sap.ui.model.Filter("BpName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter3 = new sap.ui.model.Filter("BpName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter4 = new sap.ui.model.Filter("BpName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            aFilters = new sap.ui.model.Filter([filter, filter2, filter3, filter4]);
        }
        //actualización resultado del filtro
        table = sap.ui.getCore().byId("tblListIndividual");
        binding = table.getBinding("items");
        binding.filter(aFilters);
    },
    createItemTableApplicants: function(_context) {
        jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
        var oDisplayBase, oActionBase, itemsTemplate, sDate, lastName = '',
            secondName = '',
            firstName = '',
            middleName = '';
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();

        if (_context.getProperty("BpName/LastName")) {
            lastName = _context.getProperty("BpName/LastName").toUpperCase()
        }
        if (_context.getProperty("BpName/SecondName")) {
            secondName = _context.getProperty("BpName/SecondName").toUpperCase()
        }
        if (_context.getProperty("BpName/FirstName")) {
            firstName = _context.getProperty("BpName/FirstName").toUpperCase()
        }
        if (_context.getProperty("BpName/MiddleName")) {
            middleName = _context.getProperty("BpName/MiddleName").toUpperCase()
        }

        itemsTemplate = new sap.m.ColumnListItem({
            type: "Active"
        });
        itemsTemplate.addCell(oDisplayBase.createText("", lastName + " " + secondName + " " + firstName + " " + middleName));
        sDate = _context.getProperty("BpMainData/RegistrationDate");
        if (sDate !== null && sDate !== "") {
            itemsTemplate.addCell(oDisplayBase.createText("", oDisplayBase.formatDate(_context.getProperty("BpMainData/RegistrationDate"), "dd.MM.yyyy")));
        } else {
            itemsTemplate.addCell(oDisplayBase.createText("", "No disponible"));
        }
        itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("CustomerIdCRM")));
        return itemsTemplate;
    },
    onDetailIndividual: function(oEvent, oData) {


        var oRouter, sCustomerIdMD, sAplicationID;


        oPath = oEvent.getParameters().listItem.getBindingContext().sPath; //path solicitante de referencia
        oSelectedRow = oEvent.oSource.getModel().getProperty(oPath); //datos solicitante de referencia


        oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        sCustomerIdMD = oSelectedRow.CustomerIdMD;
        sAplicationID = "0";


        sap.ui.getCore().AppContext.oCurrentLoanRequest = null;
        sap.ui.getCore().AppContext.bIsCreating = true;



        /////// Nuevas
        sap.ui.getCore().AppContext.sCustomerIdMD = sCustomerIdMD;
        sap.ui.getCore().AppContext.oCurrentCustomer = oSelectedRow;
        /////// Nuevas

        oRouter.navTo("IndividualApplications", {
            aplicationId: sAplicationID,
            query: {
                tab: "Main"
            }
        }, false);
        this.closeFilterDialogApplicant();
    },
    goBackApp: function() {
        var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
        oCurrentApp.back();
    },

    //Búsqueda detalle
    openFilters: function() {
        var oActionBase, oInputBase, oLayoutBase, oDisplayBase, selectDialogSearch, oFormFiltersApplications, currentController;
        oActionBase = new sap.ui.mw.ActionBase();
        oInputBase = new sap.ui.mw.InputBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();

        currentController = this;
        selectDialogSearch = sap.ui.getCore().byId("nsDialogSearch");
        selectDialogSearch.open();
        setTimeout(function() {
            new sap.ui.mw.FileBase().loadFile("data-map/catalogos/productsIdCrm.json").then(function(oDataProducts) {
                selectDialogSearch.addButton(oActionBase.createButton("", "Aceptar", "Accept", "sap-icon://accept", currentController.onSearchAplicantsOR, currentController));
                selectDialogSearch.addButton(oActionBase.createButton("", "Cancelar", "Transparent", "sap-icon://sys-cancel", currentController.closeFilterDialogSearch, currentController));
                oFormFiltersApplications = oLayoutBase.createForm("", true, 1, "");
                //Nombre de la Solicitud
                oFormFiltersApplications.addContent(oDisplayBase.createLabel("", "Nombre Solicitud Grupal / Individual"));
                oFormFiltersApplications.addContent(oInputBase.createInputText("txtNgSearchNombre", "Text", "Ingrese Nombre Solicitud..."));
                //Id Solicitud
                oFormFiltersApplications.addContent(oDisplayBase.createLabel("", "Identificador de la Solicitud"));
                oFormFiltersApplications.addContent(oInputBase.createInputText("txtNgSearchId", "Text", "Ingrese Identificador..."));
                //Fecha de Creación
                oFormFiltersApplications.addContent(oDisplayBase.createLabel("", "Fecha de Creación"));
                oFormFiltersApplications.addContent(oInputBase.createDatePicker("txtNgFechaAlta", { path: '/StartDate', formatter: currentController.onFormatDatePicker }, "", "dd.MM.yyyy"));
                //Producto
                oFormFiltersApplications.addContent(oDisplayBase.createLabel("", "Producto"));



                var aProducts = oDataProducts.getProperty("/products");


                var filteredCrossSellProducts = _.uniq(this.aCrossSellProducts, function(item, key, a) {
                    return item.shortName;
                });
                _.each(filteredCrossSellProducts, function(item) {
                    if (item.idCRM !== "") {
                        aProducts.push(item);
                    }
                }.bind(this));


                var oItemProduct = new sap.ui.core.Item({
                    key: "{idCRM}",
                    text: "{productName}"
                });
                oDataProducts.setProperty("/products", aProducts);
                oFormFiltersApplications.addContent(oInputBase.createSelect("selectNgSearcProducto", "/products", oItemProduct, oDataProducts, null, null));
                selectDialogSearch.addContent(oFormFiltersApplications);

            }.bind(this));

        }.bind(this), 100);
    },

    closeFilterDialogSearch: function() {
        var selectDialogSearch = sap.ui.getCore().byId("nsDialogSearch");
        selectDialogSearch.destroyContent().destroyButtons();
        selectDialogSearch.close();
    },
    closeFilterDialogProduct: function() {
        if (sap.ui.getCore().byId("btnAddApplications")) {
            sap.ui.getCore().byId("btnAddApplications").setEnabled(true);
        }
        var selectDialogProduct = sap.ui.getCore().byId("nsDialogProduct");
        selectDialogProduct.destroyContent().destroyButtons();
        selectDialogProduct.close();
    },
    closeFilterDialogApplicant: function() {
        var selectDialogApplicants = sap.ui.getCore().byId("nsDialogApplicants");
        selectDialogApplicants.destroyContent().destroyButtons();
        selectDialogApplicants.close();
    },
    searchAplicationTxt: function(evt) {
        var txtSeachFilter, filter, filter2, filter3, filter4, filter5, table, binding, filterOr, aFilters;
        aFilters = [];
        txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            filter = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter2 = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter3 = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter4 = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter5 = new sap.ui.model.Filter("GroupRequestData/GroupName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);


            aFilters.push(filter);
            aFilters.push(filter2);
            aFilters.push(filter3);
            aFilters.push(filter4);
            aFilters.push(filter5);

            filterOr = new sap.ui.model.Filter({
                filters: aFilters,
                and: false
            });
        }
        table = sap.ui.getCore().byId("tblListSolicitudes");
        binding = table.getBinding("items");
        binding.filter(filterOr, "Application");
    },
    onItemRadio: function(evt) {
        var optSelect, filterOr, aFilters = [],
            table, filter, binding;
        optSelect = evt.mParameters.selectedIndex;

        //filtros de pestañas
        if (optSelect === 1) {
            // filter = new sap.ui.model.Filter("GeneralLoanRequestData/Cycle", sap.ui.model.FilterOperator.EQ, 0);
            //Se cambia la validacion del ciclo por el sourceid ya que el ciclo en indivudual nunca cambia, siempre es igual a 0.
            //filter = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpMainData/SourceId", sap.ui.model.FilterOperator.NE, "Z07");
            filter = new sap.ui.model.Filter([
                new sap.ui.model.Filter("LinkSet/results/0/Customer/BpMainData/SourceId", sap.ui.model.FilterOperator.NE, "Z07"),
                new sap.ui.model.Filter("GeneralLoanRequestData/Cycle", sap.ui.model.FilterOperator.EQ, 0)
            ], false);
        } else if (optSelect === 2) {
            //filter = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpMainData/SourceId", sap.ui.model.FilterOperator.EQ, "Z07");
            filter = new sap.ui.model.Filter([
                new sap.ui.model.Filter("LinkSet/results/0/Customer/BpMainData/SourceId", sap.ui.model.FilterOperator.EQ, "Z07"),
                new sap.ui.model.Filter("GeneralLoanRequestData/Cycle", sap.ui.model.FilterOperator.GE, 1)
            ], false);
        } else {
            filter = new sap.ui.model.Filter("GeneralLoanRequestData/Cycle", sap.ui.model.FilterOperator.GE, 0);
        }

        aFilters.push(filter);
        filterOr = new sap.ui.model.Filter({
            filters: aFilters,
            and: false
        });
        table = sap.ui.getCore().byId("tblListSolicitudes");
        binding = table.getBinding("items");
        binding.filter(filterOr, "Application");
    },
    //Busqueda detalle AND
    onSearchAplicantsAND: function(oEvent) {

        var filters, table, txtNgSearchName, txtNgSearchId, txtNgSearchDate, txtNgSearchProduct, selectDialogSearch;

        var table = sap.ui.getCore().byId("tblListSolicitudes");


        txtNgSearchName = sap.ui.getCore().byId("txtNgSearchNombre").getValue();

        txtNgSearchId = sap.ui.getCore().byId("txtNgSearchId").getValue();

        txtNgSearchProduct = sap.ui.getCore().byId("selectNgSearcProducto").getSelectedKey();


        filters = new sap.ui.model.Filter([
                new sap.ui.model.Filter("CustomerSet/results/0/firstName", sap.ui.model.FilterOperator.Contains, txtNgSearchName),
                new sap.ui.model.Filter("CustomerSet/results/0/BPIdCRM", sap.ui.model.FilterOperator.EQ, txtNgSearchId)

            ],
            true); //false para OR

        var binding = table.getBinding("items");
        binding.filter(filters);

        //cierra modal
        selectDialogSearch = sap.ui.getCore().byId("nsDialogSearch");
        selectDialogSearch.destroyContent().destroyButtons();
        selectDialogSearch.close();
        //mostrar resultado en el la pestaña resultados
    },
    //Busqueda detalle OR
    onSearchAplicantsOR: function(evt) {
        var filterOr, aFilters = [],
            txtNgSearchNombre, txtNgSearchId, txtNgFechaAlta, txtNgSearcProducto, selectDialogSearch, filter, filter2, filter3, filter4, filter5, filter6, filter7, filter8;

        txtNgSearchNombre = sap.ui.getCore().byId("txtNgSearchNombre").getValue();
        txtNgSearchId = sap.ui.getCore().byId("txtNgSearchId").getValue();
        txtNgFechaAlta = sap.ui.getCore().byId("txtNgFechaAlta").getValue();
        txtNgSearcProducto = sap.ui.getCore().byId("selectNgSearcProducto").getSelectedKey();

        // Busqueda por Nombre Solicitud Grupal / Individual
        if (txtNgSearchNombre !== "") {
            filter = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpName/FirstName", sap.ui.model.FilterOperator.Contains, txtNgSearchNombre);
            filter2 = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpName/LastName", sap.ui.model.FilterOperator.Contains, txtNgSearchNombre);
            filter3 = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpName/SecondName", sap.ui.model.FilterOperator.Contains, txtNgSearchNombre);
            filter7 = new sap.ui.model.Filter("LinkSet/results/0/Customer/BpName/MiddleName", sap.ui.model.FilterOperator.Contains, txtNgSearchNombre);
            filter8 = new sap.ui.model.Filter("GroupRequestData/GroupName", sap.ui.model.FilterOperator.Contains, txtNgSearchNombre);
            aFilters.push(filter);
            aFilters.push(filter2);
            aFilters.push(filter3);
            aFilters.push(filter7);
            aFilters.push(filter8);
        }
        // Busqueda por Identificador de la Solicitud
        if (txtNgSearchId !== "") {
            filter4 = new sap.ui.model.Filter("LoanRequestIdCRM", sap.ui.model.FilterOperator.Contains, txtNgSearchId);
            aFilters.push(filter4);
        }
        // Busqueda por Fecha de Creación
        if (txtNgFechaAlta !== "") {

            var anio = txtNgFechaAlta.substring(0, 4);
            var mes = txtNgFechaAlta.substring(5, 7);
            var dia = txtNgFechaAlta.substring(8, 10);
            var fechaAlta = anio + "-" + mes + "-" + dia;

            var f_inicial = this.parseDate(fechaAlta);
            var f_final = this.parseDateFinal(fechaAlta);

            filter5 = new sap.ui.model.Filter("GeneralLoanRequestData/StartDate", sap.ui.model.FilterOperator.BT, f_inicial, f_final);

            aFilters.push(filter5);

        }
        // Busqueda por Producto
        if (txtNgSearcProducto !== "") {
            filter6 = new sap.ui.model.Filter("ProductID", sap.ui.model.FilterOperator.Contains, txtNgSearcProducto);
            if (txtNgSearcProducto === "C_IND_CA") {
                filter6.oValue2 = "C_IND_CA_CCR";

            }
            if (txtNgSearcProducto === "C_IND_CCM_CCR") {
                filter6.oValue2 = "C_IND_CCM";
            }
            aFilters.push(filter6);
        }

        filterOr = new sap.ui.model.Filter({
            filters: aFilters,
            and: false
        });

        table = sap.ui.getCore().byId("tblListSolicitudes");
        binding = table.getBinding("items");
        binding.filter(filterOr, "Application");

        selectDialogSearch = sap.ui.getCore().byId("nsDialogSearch");
        selectDialogSearch.destroyContent().destroyButtons();
        selectDialogSearch.close();
    },

    parseDate: function(input) {
        var parts = input.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2], 00, 00, 00);
    },

    parseDateFinal: function(input) {
        var parts = input.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2], 23, 00, 00);
    },
    /**
     * [onSetFilter - Modifica los objetos a visualizar de la vista dependiendo si es seguros u oportunidades]
     * @param  {[type]} evt [description]
     * @return {[type]}     [description]
     * author: israel
     */
    onSetFilters: function() {
        var oController, oAdd, oFilters, oPage, oTitle;
        oController = this;
        oAdd = sap.ui.getCore().byId("btnAddApplications");
        oFilters = sap.ui.getCore().byId("rbGroupOptionSolicitudes");
        oPage = sap.ui.getCore().byId("oPageMasterApplication");
        oTitle = sap.ui.getCore().byId("lblLeyendaIns");

        if (oController.queryParams.module !== "insurances") {
            oPage.setTitle("Solicitudes");
            oAdd.setVisible(true);
            oTitle.setVisible(false);
            oFilters.setVisible(true);
        } else {
            oPage.setTitle("Seguros");
            oAdd.setVisible(false);
            oTitle.setVisible(true);
            oFilters.setVisible(false);
        }
    }
});
