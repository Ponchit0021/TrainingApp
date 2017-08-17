sap.ui.controller("originacion.CrossSellCandidates", {

    /**
     * [queryParams - Contiene los parametros de la ruta]
     * @type {Object}
     */
    queryParams: {},

    onInit: function() {
        jQuery.sap.require("js.base.NavigatorBase");
        var oRouter;

        oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("crossSellCandidates").attachMatched(this._onRouteMatched, this);
    },
    /**
     * [_onRouteMatched     Función usada en el listener de la ruta]
     * @param  {[map]}      oEvent   [Map del evento ocurrido en la ruta]
     * @return {[NA]}       [NA]
     */
    _onRouteMatched: function(oEvent) {
        var oRouterArgs, promiseODataCrSellCandidate, oNavigatorBase;
        var bQueryService = true;

        oNavigatorBase = new sap.ui.mw.NavigatorBase();
        if (oNavigatorBase.testUserAgent()) { //Se está operando desde un DM

            //TRAININIG - El módulo debe funcionar aun estando OFFLINE
            bQueryService = true;
            /*if (sap.ui.getCore().AppContext.isConected === true) {
                sap.OData.removeHttpClient();
            } else {
                bQueryService = false;
            }*/
        }

        if (bQueryService) {
            //se obtienen los parametros enviados en la ruta - queryParams
            oRouterArgs = oEvent.getParameter("arguments");
            this.queryParams = oRouterArgs["?query"] || {};

            promiseODataCrSellCandidate = sap.ui.getCore().AppContext.myRest.read("/CrossSellingCandidateSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "'", true);
            sap.ui.getCore().AppContext.loader.show("Cargando Candidatos");
            promiseODataCrSellCandidate.then(
                this.renderCrossSellCandidates.bind(this)
            ).catch(
                function(error) {
                    sap.ui.getCore().AppContext.loader.close();
                    sap.m.MessageToast.show("No se logró cargar toda la información, intente de nuevo por favor.");
                    console.log(error);
                }
            );
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
    },

    /**
     * [bindCandidateTable Bindeo desde el factory de la tabla principal de candidatos]
     * @param  {[type]} _context [Obtiene el contexto actual de la row de los datos bindeados previamente]
     * @return {[NA]}          [NA]
     */
    bindCandidateTable: function(_context) {

        jQuery.sap.require("js.base.DisplayBase");

        var oDisplayBase, oItemsCrossSellCandidates, oName, oCkBox;
        var sLastName, sSecondName, sFirstName, sMiddleName;
        var currentContext = _context.getObject();

        sLastName = '';
        sSecondName = '';
        sFirstName = '';
        sMiddleName = '';

        oDisplayBase = new sap.ui.mw.DisplayBase();
        oItemsCrossSellCandidates = new sap.m.ColumnListItem({});
        oItemsCrossSellCandidates.setType(sap.m.ListType.Active);

        if (currentContext.CandidateName.LastName) {
            sLastName = currentContext.CandidateName.LastName.toUpperCase();
        }
        if (currentContext.CandidateName.SecondName) {
            sSecondName = currentContext.CandidateName.SecondName.toUpperCase();
        }
        if (currentContext.CandidateName.FirstName) {
            sFirstName = currentContext.CandidateName.FirstName.toUpperCase();
        }
        if (currentContext.CandidateName.MiddleName) {
            sMiddleName = currentContext.CandidateName.MiddleName.toUpperCase();
        }

        oItemsCrossSellCandidates.addCell(new sap.m.ObjectHeader({
            icon: "sap-icon://customer"
        }));

        oName = sLastName + " " + sSecondName + " " + sFirstName + " " + sMiddleName;
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", oName));
        oCkBox = oInputBase.createCheckBox("", "", false, true, null, null);
        oCkBox.bindProperty("selected", {
            path: "IsMarkedToDownload"
        });
        oItemsCrossSellCandidates.addCell(oCkBox);
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", currentContext.CandidateIdCRM));
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", currentContext.ParentGroupName));
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", currentContext.ParentLoanRequestIdCRM));

        return oItemsCrossSellCandidates;
    },

    /**
     * [backToTiles     Navegación una posición atrás en la ruta]
     * @return {[NA]}   [NA]
     */
    backToTiles: function() {
        var oNavigatorBase = new sap.ui.mw.NavigatorBase();

        /* if (oNavigatorBase.testUserAgent()) { //Se está operando desde un DM
             sap.OData.applyHttpClient();
         }*/

        setTimeout(function() {
            window.history.go(-1);
        }, 1000);
    },

    goBackApp: function() {
        var oCurrentApp = sap.ui.getCore().byId('oAppAplication');
        oCurrentApp.back();
    },

    //Búsqueda detalle
    openFilters: function() {
        var oActionBase, oLayoutBase, oDisplayBase, oForm, oDlSearchCrSellCandidates, oFormFiltersCrossSellCandidates;
        var oTxtSearchCandidateIdCRM, oTxtSearchParentLoanRequestIdCRM;
        oActionBase = new sap.ui.mw.ActionBase();
        oInputBase = new sap.ui.mw.InputBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();

        currentController = this;
        oDlSearchCrSellCandidates = sap.ui.getCore().byId("oDlSearchCrSellCandidates");
        oDlSearchCrSellCandidates.open();
        setTimeout(function() {
            oDlSearchCrSellCandidates.addButton(oActionBase.createButton("", "Aceptar", "Accept", "sap-icon://accept", currentController.onSearchCrSellCandidateOnline, currentController));
            oDlSearchCrSellCandidates.addButton(oActionBase.createButton("", "Cancelar", "Transparent", "sap-icon://sys-cancel", currentController.closeDlSearchCrSellCandidates, currentController));
            oFormFiltersCrossSellCandidates = oLayoutBase.createForm("", true, 1, "");
            //Primer Nombre
            oFormFiltersCrossSellCandidates.addContent(oDisplayBase.createLabel("", "Primer Nombre*"));
            oFormFiltersCrossSellCandidates.addContent(oInputBase.createInputText("txtSearchFirstName", "Text", "Ingrese Primer Nombre...").setMaxLength(25));
            //Segundo Nombre
            oFormFiltersCrossSellCandidates.addContent(oDisplayBase.createLabel("", "Segundo Nombre"));
            oFormFiltersCrossSellCandidates.addContent(oInputBase.createInputText("txtSearchMiddleName", "Text", "Ingrese Segundo Nombre...").setMaxLength(25));
            //Apellido Paterno
            oFormFiltersCrossSellCandidates.addContent(oDisplayBase.createLabel("", "Apellido Paterno*"));
            oFormFiltersCrossSellCandidates.addContent(oInputBase.createInputText("txtSearchLastName", "Text", "Ingrese Apellido Paterno...").setMaxLength(25));
            //Apellido Materno
            oFormFiltersCrossSellCandidates.addContent(oDisplayBase.createLabel("", "Apellido Materno"));
            oFormFiltersCrossSellCandidates.addContent(oInputBase.createInputText("txtSearchSecondName", "Text", "Ingrese Apellido Materno...").setMaxLength(25));
            //Id Cliente
            oFormFiltersCrossSellCandidates.addContent(oDisplayBase.createLabel("", "Id Cliente"));
            oTxtSearchCandidateIdCRM = oInputBase.createInputText("txtSearchCandidateIdCRM", "Text", "Ingrese Id de Cliente...").setMaxLength(10);
            oTxtSearchCandidateIdCRM.attachLiveChange(null, currentController.confirmNumberImput, currentController);
            oFormFiltersCrossSellCandidates.addContent(oTxtSearchCandidateIdCRM);
            //Id Oportunidad
            oFormFiltersCrossSellCandidates.addContent(oDisplayBase.createLabel("", "Id Oportunidad"));
            oTxtSearchParentLoanRequestIdCRM = oInputBase.createInputText("txtSearchParentLoanRequestIdCRM", "Text", "Ingrese Id de Oportunidad...").setMaxLength(10);
            oTxtSearchParentLoanRequestIdCRM.attachLiveChange(null, currentController.confirmNumberImput, currentController);
            oFormFiltersCrossSellCandidates.addContent(oTxtSearchParentLoanRequestIdCRM);
            //Nombre del Grupo
            oFormFiltersCrossSellCandidates.addContent(oDisplayBase.createLabel("", "Nombre del Grupo*"));
            oFormFiltersCrossSellCandidates.addContent(oInputBase.createInputText("txtSearchParentGroupName", "Text", "Ingrese Nombre del Grupo...").setMaxLength(26));

            oDlSearchCrSellCandidates.addContent(oFormFiltersCrossSellCandidates);
        }, 100);
    },

    closeDlSearchCrSellCandidates: function() {
        var oDlSearchCrSellCandidates = sap.ui.getCore().byId("oDlSearchCrSellCandidates");
        oDlSearchCrSellCandidates.destroyContent().destroyButtons();
        oDlSearchCrSellCandidates.close();
    },

    simpleSearchCrSellCandidate: function(evt) {
        var txtSeachFilter, filter, filter2, filter3, filter4, table, binding, filterOr, aFilters;
        aFilters = [];
        txtSeachFilter = evt.getSource().getValue();
        if (txtSeachFilter.length > 0) {
            filter = new sap.ui.model.Filter("CandidateName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter2 = new sap.ui.model.Filter("CandidateName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter3 = new sap.ui.model.Filter("CandidateName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
            filter4 = new sap.ui.model.Filter("CandidateName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);


            aFilters.push(filter);
            aFilters.push(filter2);
            aFilters.push(filter3);
            aFilters.push(filter4);

            filterOr = new sap.ui.model.Filter({
                filters: aFilters,
                and: false
            });
        }
        table = sap.ui.getCore().byId("tblListCrSellCandidates");
        binding = table.getBinding("items");
        binding.filter(filterOr, "Application");
    },

    onSearchCrSellCandidateOnline: function(evt) {
        var promiseODataFilteredCrSellCandidate, strFirstNameFilter, strMiddleNameFilter, strLastNameFilter;
        var strSecondNameFilter, strCandidateIdCRMFilter, strParentLoanRequestIdCRMFilter, strParentGroupNameFilter;
        var oTable, _self, searchResultDialog, oActionBase;
        var strODataQuery = "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "'";
        var tblSearchResultCrSellCandidates, oTableFields2, oTableFieldsWidth2, oTableFieldVisibility2;
        var oTableFieldDemandPopid2, isValidSearh = false;

        oActionBase = new sap.ui.mw.ActionBase();
        _self = this;

        strFirstNameFilter = sap.ui.getCore().byId("txtSearchFirstName").getValue();
        sap.ui.getCore().byId("txtSearchFirstName").setValueState(sap.ui.core.ValueState.None);
        strMiddleNameFilter = sap.ui.getCore().byId("txtSearchMiddleName").getValue();
        strLastNameFilter = sap.ui.getCore().byId("txtSearchLastName").getValue();
        sap.ui.getCore().byId("txtSearchLastName").setValueState(sap.ui.core.ValueState.None);
        strSecondNameFilter = sap.ui.getCore().byId("txtSearchSecondName").getValue();
        strCandidateIdCRMFilter = sap.ui.getCore().byId("txtSearchCandidateIdCRM").getValue();
        strParentLoanRequestIdCRMFilter = sap.ui.getCore().byId("txtSearchParentLoanRequestIdCRM").getValue();
        strParentGroupNameFilter = sap.ui.getCore().byId("txtSearchParentGroupName").getValue();
        sap.ui.getCore().byId("txtSearchParentGroupName").setValueState(sap.ui.core.ValueState.None);

        //Primer método de busqueda válido: Nombre del Cliente + Apellido Paterno + Nombre del Grupo
        if (strFirstNameFilter || strLastNameFilter || strMiddleNameFilter || strSecondNameFilter ||
            strCandidateIdCRMFilter || strParentLoanRequestIdCRMFilter) {
            if (strFirstNameFilter && strLastNameFilter && strParentGroupNameFilter) {
                isValidSearh = true;
                strODataQuery += " and CandidateName/FirstName eq '" + strFirstNameFilter.toUpperCase() +
                    "' and CandidateName/LastName eq '" +
                    strLastNameFilter.toUpperCase() +
                    "' and ParentGroupName eq '" +
                    strParentGroupNameFilter.toUpperCase() + "'";
                if (strMiddleNameFilter) {
                    strODataQuery += " and CandidateName/MiddleName eq '" + strMiddleNameFilter.toUpperCase() + "'";
                }
                if (strSecondNameFilter) {
                    strODataQuery += " and CandidateName/SecondName eq '" + strSecondNameFilter.toUpperCase() + "'";
                }
                if (strCandidateIdCRMFilter) {
                    strODataQuery += " and CandidateIdCRM eq '" + strCandidateIdCRMFilter + "'";
                }
                if (strParentLoanRequestIdCRMFilter) {
                    strODataQuery += " and ParentLoanRequestIdCRM eq '" + strParentLoanRequestIdCRMFilter + "'";
                }
            } else {
                if (!strFirstNameFilter) {
                    sap.ui.getCore().byId("txtSearchFirstName").setValueState(sap.ui.core.ValueState.Error);
                }
                if (!strLastNameFilter) {
                    sap.ui.getCore().byId("txtSearchLastName").setValueState(sap.ui.core.ValueState.Error);
                }
                if (!strParentGroupNameFilter) {
                    sap.ui.getCore().byId("txtSearchParentGroupName").setValueState(sap.ui.core.ValueState.Error);
                }
            }
        } else if (strParentGroupNameFilter) {
            //Segundo método de busqueda válido: Nombre del Grupo
            isValidSearh = true;
            strODataQuery += " and ParentGroupName eq '" + strParentGroupNameFilter.toUpperCase() + "'";
            if (strMiddleNameFilter) {
                strODataQuery += " and CandidateName/MiddleName eq '" + strMiddleNameFilter.toUpperCase() + "'";
            }
            if (strSecondNameFilter) {
                strODataQuery += " and CandidateName/SecondName eq '" + strSecondNameFilter.toUpperCase() + "'";
            }
            if (strCandidateIdCRMFilter) {
                strODataQuery += " and CandidateIdCRM eq '" + strCandidateIdCRMFilter + "'";
            }
            if (strParentLoanRequestIdCRMFilter) {
                strODataQuery += " and ParentLoanRequestIdCRM eq '" + strParentLoanRequestIdCRMFilter + "'";
            }
        } else {
            sap.ui.getCore().byId("txtSearchParentGroupName").setValueState(sap.ui.core.ValueState.Error);
        }

        if (isValidSearh) {
            promiseODataFilteredCrSellCandidate = sap.ui.getCore().AppContext.myRest.read("/CrossSellingCandidateSet", strODataQuery, true);
            sap.ui.getCore().AppContext.loader.show("Cargando Candidatos");

            setTimeout(function() {
                promiseODataFilteredCrSellCandidate.then(
                    function(response) {
                        if (response.results.length > 0) {
                            oModel = new sap.ui.model.json.JSONModel();

                            oModel.setData(response);

                            searchResultDialog = sap.ui.getCore().byId("oDlSearchResultCrSellCandidates");
                            searchResultDialog.open();
                            oTableFields2 = ["", "", "Id Cliente", "Grupo", "Id Oportunidad", "Día de Reunión"];
                            oTableFieldsWidth2 = ["12%", "35%", "23%", "15%", "15%", "15%"];
                            oTableFieldVisibility2 = [true, true, true, true, true, true, true];
                            oTableFieldDemandPopid2 = [false, false, true, true, true, true, true];
                            tblSearchResultCrSellCandidates = oListBase.createTable("tblSearchResultCrSellCandidates", "", sap.m.ListMode.SingleSelect, oTableFields2, oTableFieldVisibility2, oTableFieldDemandPopid2, oTableFieldsWidth2, null, null);
                            searchResultDialog.addContent(tblSearchResultCrSellCandidates);
                            searchResultDialog.addButton(oActionBase.createButton("", "Aceptar", "Accept", "sap-icon://accept", _self.acceptSearchResulCandidate, _self));
                            searchResultDialog.addButton(oActionBase.createButton("", "Cancelar", "Transparent", "sap-icon://sys-cancel", _self.closeSearchResultCandidate, _self));
                            oTable = sap.ui.getCore().byId("tblSearchResultCrSellCandidates", "items");
                            oTable.setModel(oModel);
                            oTable.bindAggregation("items", {
                                path: "/results",
                                factory: function(_id, _context) {
                                    return _self.bindResultSearchCrSellCandidateTable(_context);
                                }
                            });

                            sap.ui.getCore().AppContext.loader.close();
                        } else {
                            sap.ui.getCore().AppContext.loader.close();
                            sap.m.MessageToast.show("No se encontró candidato.");
                        }
                    }
                ).catch(
                    function(error) {
                        sap.ui.getCore().AppContext.loader.close();
                        sap.m.MessageToast.show("No se logró cargar toda la información, intente de nuevo por favor.");
                        console.log(error);
                    }
                );
            }, 0);
        }
    },

    markRecordsToDownload: function() {
        jQuery.sap.require("js.base.ObjectBase");

        var aAllTableItems = sap.ui.getCore().byId("tblListCrSellCandidates", "items").getModel().oData.results;
        var oObjectBase = new sap.ui.mw.ObjectBase();
        var promiseODataPostCrSellCandidates;
        var currentController = this;

        if (aAllTableItems.length > 0) {
            aAllTableItems.forEach(
                function(oCandidateItem) {
                    oObjectBase.deletePropertyFromObject(oCandidateItem, "__metadata");
                    oObjectBase.deletePropertyFromObject(oCandidateItem, "CrossSellOfferSet");
                }
            );

            //TRAININIG - Se realiza simulación de petición BATCH
            //promiseODataPostCrSellCandidates = sap.ui.getCore().AppContext.myRest.executePostBatchRequest("/CrossSellingCandidateSet", aAllTableItems, true);
            promiseODataPostCrSellCandidates = this.simulateBatch(aAllTableItems);
            promiseODataPostCrSellCandidates.then(
                function(response) {
                    currentController.backToTiles();
                    sap.m.MessageToast.show("Candidatos preparados para descarga. Por favor Sincronice.", { animationDuration: 2000 });
                }
            ).catch(
                function(error) {
                    sap.m.MessageToast.show("No se logró cargar toda la información, intente de nuevo por favor.");
                    console.log(error);
                }
            );
        }
    },
    //TRAINING - Simulación de peticion BATCH
    simulateBatch: function(_candidates) {
        return new Promise(function(resolveSimulatePromise, rejectedSimulatePromise) {
            jQuery.sap.require("js.buffer.crosssell.CrossSellCandidatesBuffer");
            var oBuffer, oSelectedCandidates, oCandidates;
            oBuffer = new sap.ui.buffer.CrossSellCandidates("crossDB");
            var oSelectedCandidates = []

            if (_candidates.length > 0) {
                _candidates.forEach(function(item) {
                    if (item.IsMarkedToDownload === true) {
                        oSelectedCandidates.push(item.CandidateIdCRM);
                    }
                });
            }
            oCandidates = { selectedCandidates: oSelectedCandidates };
            console.log(oCandidates);
            oBuffer.postRequest(oCandidates)
                .then(function() {
                    resolveSimulatePromise(this.ok);
                });
        });
    },

    sortTable: function() {},

    onODataChange: function(oEvent) {
        if (oEvent.mParameters.path === "IsMarkedToDownload") {
            this.refreshSelectedCounter();
        }
    },

    refreshSelectedCounter: function(oData) {
        var counter;

        if (oData) {
            counter = $.grep(oData.results, function(n) {
                return (n.IsMarkedToDownload === true);
            }).length;
        } else {
            counter = $.grep(sap.ui.getCore().byId("tblListCrSellCandidates", "items").getModel().oData.results, function(n) {
                return (n.IsMarkedToDownload === true);
            }).length;
        }

        sap.ui.getCore().byId("txtSelectedCounter").setText("Seleccionados (" + counter + ")");
        if (counter > 50) {
            sap.ui.getCore().byId("btnMarkRecToDownload").setEnabled(false);
        } else {
            if (!sap.ui.getCore().byId("btnMarkRecToDownload").getEnabled()) {
                sap.ui.getCore().byId("btnMarkRecToDownload").setEnabled(true);
            }
        }
    },

    bindResultSearchCrSellCandidateTable: function(_context) {

        jQuery.sap.require("js.base.DisplayBase");

        var oDisplayBase, oItemsCrossSellCandidates, oName;
        var sLastName, sSecondName, sFirstName, sMiddleName;
        var currentContext = _context.getObject();

        sLastName = '';
        sSecondName = '';
        sFirstName = '';
        sMiddleName = '';

        oDisplayBase = new sap.ui.mw.DisplayBase();
        oItemsCrossSellCandidates = new sap.m.ColumnListItem({});
        oItemsCrossSellCandidates.setType(sap.m.ListType.Active);

        if (currentContext.CandidateName.LastName) {
            sLastName = currentContext.CandidateName.LastName.toUpperCase();
        }
        if (currentContext.CandidateName.SecondName) {
            sSecondName = currentContext.CandidateName.SecondName.toUpperCase();
        }
        if (currentContext.CandidateName.FirstName) {
            sFirstName = currentContext.CandidateName.FirstName.toUpperCase();
        }
        if (currentContext.CandidateName.MiddleName) {
            sMiddleName = currentContext.CandidateName.MiddleName.toUpperCase();
        }

        oItemsCrossSellCandidates.addCell(new sap.m.ObjectHeader({
            icon: "sap-icon://customer"
        }));

        oName = sLastName + " " + sSecondName + " " + sFirstName + " " + sMiddleName;
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", oName));
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", currentContext.CandidateIdCRM));
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", currentContext.ParentGroupName));
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", currentContext.ParentLoanRequestIdCRM));
        oItemsCrossSellCandidates.addCell(oDisplayBase.createText("", currentContext.WeeklyMeetingDay));

        oItemsCrossSellCandidates.bindProperty("selected", {
            path: "IsMarkedToDownload"
        });

        return oItemsCrossSellCandidates;
    },

    acceptSearchResulCandidate: function() {
        var tblSearchResultCrSellCandidates = sap.ui.getCore().byId("tblSearchResultCrSellCandidates");
        var tblListCrSellCandidatesModel = sap.ui.getCore().byId("tblListCrSellCandidates", "items").getModel();
        var selectedItm = tblSearchResultCrSellCandidates.getSelectedItem();
        var selectedCtxt, selectedODataItem;

        if (selectedItm) {
            selectedCtxt = sap.ui.getCore().byId("tblSearchResultCrSellCandidates").getSelectedContexts();
            selectedODataItem = tblSearchResultCrSellCandidates.getModel().getProperty(selectedCtxt[0].sPath);
            tblListCrSellCandidatesModel.oData.results.push(selectedODataItem);
            tblListCrSellCandidatesModel.refresh(true);
            this.refreshSelectedCounter();
        }

        this.closeSearchResultCandidate();
        this.closeDlSearchCrSellCandidates();
    },

    closeSearchResultCandidate: function() {
        var diaSearchResulCandidate = sap.ui.getCore().byId("oDlSearchResultCrSellCandidates");

        diaSearchResulCandidate.destroyContent().destroyButtons();
        diaSearchResulCandidate.close();
    },

    confirmNumberImput: function(oEvent) {
        var value = oEvent.getSource().getValue();
        var bNotnumber = isNaN(value);
        if (bNotnumber) {
            oEvent.getSource().setValue("");
        }
    },

    renderCrossSellCandidates: function(oODataResponse) {
        var currentController = this;
        var oModel = new sap.ui.model.json.JSONModel();
        var oTable;

        oModel.attachPropertyChange(null, currentController.onODataChange, currentController);
        oModel.setData(oODataResponse);
        currentController.refreshSelectedCounter(oModel.oData);
        oTable = sap.ui.getCore().byId("tblListCrSellCandidates", "items");
        oTable.setModel(oModel);
        oTable.bindAggregation("items", {
            path: "/results",
            factory: function(_id, _context) {
                return currentController.bindCandidateTable(_context);
            }
        });

        sap.ui.getCore().AppContext.loader.close();
    },

    testBatchRequest: function() {
        var currentController = this;
        var aODataKeys = [];
        var aOData = [];
        var promiseODataPostCrSellCandidates;

        aODataKeys.push("'1000000002'");
        aOData.push({ "IsMarkedToDownload": true });
        aODataKeys.push("'1000000003'");
        aOData.push({ "IsMarkedToDownload": true });

        promiseODataPostCrSellCandidates = sap.ui.getCore().AppContext.myRest.executeMergeBatchRequest("/CrossSellingCandidateSet", aOData, true, aODataKeys);
        promiseODataPostCrSellCandidates.then(
            function(response) {
                currentController.backToTiles();
                sap.m.MessageToast.show("Candidatos preparados para descarga. Por favor Sincronice.", { animationDuration: 2000 });
            }
        ).catch(
            function(error) {
                sap.m.MessageToast.show("No se logró cargar toda la información, intente de nuevo por favor.");
                console.log(error);
            }
        );
    }
});