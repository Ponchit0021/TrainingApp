 sap.ui.controller("originacion.ApplicantList", {
     backToTiles: function() {
         jQuery.sap.require("js.base.EventBase");
         var oEventBase = new sap.ui.mw.EventBase();
        if (this.isError==="1") {
            oEventBase.backEvent(this,"#");
        }else{
            oEventBase.backEvent(this,"");
        }
         
     },
     isError:"",

     onListPress: function(oEvent) {
        swal("Cargando datos...")
         sap.ui.core.UIComponent.getRouterFor(this).navTo("applicantsDetail", {
             applicantId: oEvent.getParameters().listItem.getBindingContext().getModel().getProperty(oEvent.getParameters().listItem.getBindingContext().getPath()).CustomerIdMD,
             query: {
                 tab: "Name"
             }
         }, false);
     },
     /*    onBeforeShow: function(evt) {
             sap.ui.getCore().AppContext.loader.setText("Cargando Lista de Solicitantes");
             sap.ui.getCore().AppContext.loader.open();
         },*/

     /**
      * Called when a controller is instantiated and its View controls (if available) are already created.
      * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
      * @memberOf originacion.ApplicantList
      */
     onInit: function() {
         var oNavigatorBase;
         jQuery.sap.require("js.base.NavigatorBase", "js.kapsel.Rest", "js.serialize.bp.BPSerialize");

         oNavigatorBase = new sap.ui.mw.NavigatorBase();

         sap.ui.core.UIComponent.getRouterFor(this).getRoute("applicantList").attachMatched(this._onRouteMatched, this);
     },

     getSerializeApplicants: function(_oDataBase) {
         jQuery.sap.require("js.serialize.customer.CustomerSerialize");
         return new sap.ui.serialize.Customer(_oDataBase);
     },
     _onRouteMatched: function(evt) {

    var currentController = this;
    var oApplicantListTable;
  
    this.isError = evt.getParameter("arguments")["?query"] === undefined ? "" : evt.getParameter("arguments")["?query"].isError;
        return new Promise(function(resolve) { 
            sap.ui.getCore().AppContext.loader.show("Cargando Lista de Solicitantes");
            setTimeout(function() {
                new sap.ui.serialize.BP("dataDB", "Customer").getMainModel("CustomerSet", sap.ui.getCore().AppContext.Promotor).then(function(oModel) {
                    var oNum = oModel.getProperty("/results").length;
                    oModel.setSizeLimit(oNum);
                    oApplicantListTable = sap.ui.getCore().byId("tblCustomers", "items");
                    oApplicantListTable.setModel(oModel);
                    oApplicantListTable.bindAggregation("items", {
                        path: "/results",
                        factory: function(_id, _context) {
                            return currentController.bindApplicantListTable(_context);
                        }
                    });
                    
                    sap.ui.getCore().AppContext.loader.close();
                });

            }.bind(this), 1000);

        });

     },



     bindApplicantListTable: function(_context) {
         jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
         var oDisplayBase, colonia, itemsTemplate, JSONCustomer, semaforo, semaphoreIcon, lastName = '',
             secondName = '',
             firstName = '',
             middleName = '';
        
         var currentContext = _context.getObject();

         try {
             oDisplayBase = new sap.ui.mw.DisplayBase();
         
             itemsTemplate = new sap.m.ColumnListItem({});
             itemsTemplate.setType(sap.m.ListType.Navigation);
             itemsTemplate.setSelected(true);
             //semáforos
             semaforo = parseInt(currentContext.BpMainData.ServiceLevelId);
             // E0006 En proceso de Originación
             if (currentContext.BpMainData.StatusId !== 'E0006') {
                 semaphoreIcon = oDisplayBase.createIcon("", "sap-icon://status-error", "2.0rem");
                 if (semaforo === 1) {
                     semaphoreIcon.addStyleClass('semaphoreLevelGreen');
                 } else if (semaforo === 2) {
                     semaphoreIcon.addStyleClass('semaphoreLevelYellow');
                 } else if (semaforo === 3) {
                     semaphoreIcon.addStyleClass('semaphoreLevelRed');
                 }
             } else {
                 semaphoreIcon = oDisplayBase.createIcon("", "sap-icon://status-error", "0rem");
                 semaphoreIcon.addStyleClass('semaphoreLevelTransparent');
             }
             itemsTemplate.addCell(semaphoreIcon);
             if (currentContext.BpName.LastName) {
                 lastName = currentContext.BpName.LastName.toUpperCase();
             }
             if (currentContext.BpName.SecondName) {
                 secondName = currentContext.BpName.SecondName.toUpperCase();
             }
             if (currentContext.BpName.FirstName) {
                 firstName = currentContext.BpName.FirstName.toUpperCase();
             }
             if (currentContext.BpName.MiddleName) {
                 middleName = currentContext.BpName.MiddleName.toUpperCase();
             }
             itemsTemplate.addCell(oDisplayBase.createText("", lastName + " " + secondName + " " + firstName + " " + middleName));

             var oDateFormat = moment(currentContext.BpMainData.RegistrationDate);
             itemsTemplate.addCell(oDisplayBase.createText("", oDateFormat.isValid() ? oDateFormat.format("DD.MM.YYYY") : ""));
             itemsTemplate.addCell(oDisplayBase.createText("", currentContext.CustomerIdCRM));
             itemsTemplate.addCell(oDisplayBase.createText("", currentContext.BpMainData.RemainingDays));


             if (!_.isUndefined(_context.getProperty("AddressSet/results"))) {
                 colonia = _.last(_.sortBy(_context.getProperty("AddressSet/results"), 'Place.Suburb'));
             }
             itemsTemplate.addCell(oDisplayBase.createText("", _.isUndefined(colonia) || _.isUndefined(colonia.Place) ? "" : colonia.Place.Suburb));
             return itemsTemplate;
         } catch (err) {
             sap.m.MessageToast.show(err);
           
         }

     },
     onSearchApplicants: function(evt) {
         var txtSeachFilter, table, binding, allFilter;
         txtSeachFilter = evt.getSource().getValue();
         if (txtSeachFilter.length > 0) {
             var filter = new sap.ui.model.Filter("BpName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             var filter2 = new sap.ui.model.Filter("BpName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             var filter3 = new sap.ui.model.Filter("BpName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             var filter4 = new sap.ui.model.Filter("BpName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             var filter5 = new sap.ui.model.Filter("CustomerIdCRM", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             allFilter = new sap.ui.model.Filter([filter, filter2, filter3, filter4, filter5], false);
         }
         table = sap.ui.getCore().byId("tblCustomers");
         binding = table.getBinding("items");
         binding.filter(allFilter, "Application");
     },
     addApplicant: function() {
         sap.ui.core.UIComponent.getRouterFor(this).navTo("applicantsDetail", {
             applicantId: "0",
             query: {
                 tab: "Name"
             }
         }, false);
     },
     openFilters: function() {
         sap.ui.jsfragment("js.forms.bp.FiltersApplicant", this).open();
     },
     goToSearchApplicants: function() {
         //Middleware de componentes SAPUI5
         var oInputBase, oActionBase, oDisplayBase, oLayoutBase;
         //Variables para dialogo.
         var  oForm, currentController, appDialogFilterSearch;
         //Se declaran objetos de Middleware de componentes SAPUI5
         oInputBase = new sap.ui.mw.InputBase();
         oActionBase = new sap.ui.mw.ActionBase();
         oDisplayBase = new sap.ui.mw.DisplayBase();
         oLayoutBase = new sap.ui.mw.LayoutBase();
       
     
         currentController = this;
         appDialogFilterSearch = sap.ui.getCore().byId("appDialogFilterSearch");
         oForm = oLayoutBase.createForm("idDgFiltersSearch", true, 1, "");
         //Nombre
         oForm.addContent(oDisplayBase.createLabel("", "Nombre"));
         oForm.addContent(oInputBase.createInputText("txtDfsNombre", "Text", ""));

         oForm.addContent(oDisplayBase.createLabel("", "Id BP"));
         oForm.addContent(oInputBase.createInputText("txtDfsIdBP", "Number", ""));

         //Fuente/Origen
         oForm.addContent(oDisplayBase.createLabel("", "Fuente/Origen"));
         var dataOrigen = new sap.ui.model.json.JSONModel("data-map/catalogos/origen.json");
         var oItemOrigen = new sap.ui.core.Item({
             key: "{idOrigen}",
             text: "{desOrigen}"
         });
         oForm.addContent(oInputBase.createSelect("selectFuenteOrigen", "/origen", oItemOrigen, dataOrigen, null, null));
         //Fecha de alta
         oForm.addContent(oDisplayBase.createLabel("", "Fecha de Alta"));
         oForm.addContent(oInputBase.createDatePicker("txtDfsFechaAlta", null, "12/10/2015", "dd-MM-yyyy"));
         //Nivel de atención
         oForm.addContent(oDisplayBase.createLabel("", "Nivel de atención"));
         var dataNivel = new sap.ui.model.json.JSONModel("data-map/catalogos/nivel.json");
         var oItemNivel = new sap.ui.core.Item({
             key: "{idNivel}",
             text: "{desNivel}"
         });
         oForm.addContent(oInputBase.createSelect("selectNivel", "/nivel", oItemNivel, dataNivel, null, null));
         appDialogFilterSearch.addButton(oActionBase.createButton("", "Aceptar", "Accept", "sap-icon://accept", currentController.pressAceptFilterDialogSearch, currentController));
         appDialogFilterSearch.addButton(oActionBase.createButton("", "Cancelar", "Transparent", "sap-icon://sys-cancel", currentController.closeFilterDgSearch, currentController));
         appDialogFilterSearch.addContent(oForm);
         appDialogFilterSearch.open();
     },
     pressAceptFilterDialogSearch: function() {
         var  aFilters = [],
             aTemp = [],
             txtDfsNombre, txtDfsIdBP, currentController, selectFuenteOrigen, selectNivel, txtDfsFechaAlta, filter, filter2, filter3, filter4, filter5, filter6, filter7, filter8;
         var table, binding;
         currentController = this;
         txtDfsNombre = sap.ui.getCore().byId("txtDfsNombre").getValue();
         selectFuenteOrigen = sap.ui.getCore().byId("selectFuenteOrigen").getSelectedKey();
         selectNivel = sap.ui.getCore().byId("selectNivel").getSelectedKey();
         txtDfsFechaAlta = sap.ui.getCore().byId("txtDfsFechaAlta").getValue();
         txtDfsIdBP = sap.ui.getCore().byId("txtDfsIdBP").getValue();
         if (txtDfsNombre.length > 0) {
             filter = new sap.ui.model.Filter("BpName/FirstName", sap.ui.model.FilterOperator.Contains, txtDfsNombre);
             filter2 = new sap.ui.model.Filter("BpName/LastName", sap.ui.model.FilterOperator.Contains, txtDfsNombre);
             filter3 = new sap.ui.model.Filter("BpName/SecondName", sap.ui.model.FilterOperator.Contains, txtDfsNombre);
             filter4 = new sap.ui.model.Filter("BpName/MiddleName", sap.ui.model.FilterOperator.Contains, txtDfsNombre);
             aTemp.push(filter, filter2, filter3, filter4);
         }
         if (txtDfsIdBP.length > 0) {
             filter8 = new sap.ui.model.Filter("CustomerIdCRM", sap.ui.model.FilterOperator.EQ, parseInt(txtDfsIdBP));
             aTemp.push(filter8);
         }
         if (selectNivel.length > 0) {
             filter5 = new sap.ui.model.Filter("BpMainData/ServiceLevelId", sap.ui.model.FilterOperator.EQ, parseInt(selectNivel));
             aTemp.push(filter5);
         }
         if (selectFuenteOrigen.length > 0) {
             filter6 = new sap.ui.model.Filter("BpMainData/SourceId", sap.ui.model.FilterOperator.EQ, selectFuenteOrigen);
             aTemp.push(filter6);
         }
         if (txtDfsFechaAlta.length > 0) {
             var fecha = moment(txtDfsFechaAlta).format("YYYY-MM-DD");
             var parts = fecha.split('-');
             var f_final = new Date(parts[0], parts[1] - 1, parts[2], '23', '00', '00');
             parts = fecha.split('-');
             var f_inicial = new Date(parts[0], parts[1] - 1, parts[2], '00', '00', '00');
             filter7 = new sap.ui.model.Filter("BpMainData/RegistrationDate", sap.ui.model.FilterOperator.BT, f_inicial, f_final);
             aTemp.push(filter7);
         }
         var table, binding;
         aFilters = new sap.ui.model.Filter(aTemp, false);
         table = sap.ui.getCore().byId("tblCustomers");
         binding = table.getBinding("items");
         binding.filter(aFilters, "Application");
         currentController.closeFilterDgSearch();

     },
     closeFilterDgSearch: function() {
         var appDialogFilterSearch = sap.ui.getCore().byId("appDialogFilterSearch");
         appDialogFilterSearch.destroyContent().destroyButtons();
         appDialogFilterSearch.close();
     },
     setFilterApplicants: function(evt) {
         var currentTabFilter = sap.ui.getCore().byId(evt.getParameter("key"));
         var option = currentTabFilter.sId;

         setTimeout(function() {
             switch (option) {
                 case "appList1":

                     //filtro bps con ciclo = 0
                     var oTable = sap.ui.getCore().byId("tblCustomers");
                     var oBinding = oTable.getBinding("items");
                     var eq = sap.ui.model.FilterOperator.EQ;
                     var oFilter = new sap.ui.model.Filter("BpMainData/Cycle", eq, "0");
                     oBinding.filter(oFilter);
                   
                     break;
                 case "appList2":

                     //filtro bps con ciclo > 0
                     var oTable = sap.ui.getCore().byId("tblCustomers");
                     var oBinding = oTable.getBinding("items");
                     var ne = sap.ui.model.FilterOperator.NE;
                     var oFilter = new sap.ui.model.Filter("BpMainData/Cycle", ne, "0");
                     oBinding.filter(oFilter);
                    
                     break;
                 default:
                     //do nothing
             }
         }, 0);
     },
     searchFilterApplicant: function() {},
     onCancelFilterApplicant: function() {
         this.destroy();
     },
 });
