 sap.ui.controller("originacion.GuarantorList", {
     /**
      * Is used to back to the DashBoart.
      * @memberOf originacion.GuarantorList
      */
     onMessageWarningDialogPress: function() {
         jQuery.sap.require("js.base.EventBase");
         var oEventBase = new sap.ui.mw.EventBase();
         if (this.isError === "1") {
             oEventBase.backEvent(this, "#");
         } else {
             oEventBase.backEvent(this, "");
         }
     },
     isError: "",

     onListPress: function(oEvent) {
         sap.ui.core.UIComponent.getRouterFor(this).navTo("guarantorsDetail", {
             guarantorId: oEvent.getParameters().listItem.getBindingContext().getModel().getProperty(oEvent.getParameters().listItem.getBindingContext().getPath()).CustomerIdMD,
             query: {
                 tab: "Name"
             }
         }, false);

     },
     /**
      * Called when a controller is instantiated and its View controls (if available) are already created.
      * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
      * @memberOf originacion.GuarantorList
      */
     onInit: function() {
         jQuery.sap.require("js.base.NavigatorBase", "js.kapsel.Rest", "js.serialize.bp.BPSerialize", "js.forms.guarantor.Guarantor");
         jQuery.sap.require("js.base.DisplayBase");
         var oNavigatorBase = new sap.ui.mw.NavigatorBase();


         sap.ui.core.UIComponent.getRouterFor(this).getRoute("guarantorList").attachMatched(this._onRouteMatched, this);
     },
    _onRouteMatched: function(evt) {
        var currentController = this, oGuarantorListTable;
        //var oView = currentController.getView();
        this.isError = evt.getParameter("arguments")["?query"] === undefined ? "" : evt.getParameter("arguments")["?query"].isError;

        sap.ui.getCore().AppContext.loader.show("Cargando Lista de Avales");
        setTimeout(function() {
            new sap.ui.serialize.BP("dataDB", "Guarantor").getMainModel("GuarantorSet", sap.ui.getCore().AppContext.Promotor).then(function(oModel) {
                var oNum = oModel.getProperty("/results").length;
                oModel.setSizeLimit(oNum);
                oGuarantorListTable = sap.ui.getCore().byId("tblGuarantors", "items");
                oGuarantorListTable.setModel(oModel);
                oGuarantorListTable.bindAggregation("items", {
                    path: "/results",
                    factory: function(_id, _context) {
                        return currentController.bindGuarantorListTable(_context);
                    }
                });
            });
            sap.ui.getCore().AppContext.loader.close();
        }.bind(this), 1000);

    },

     bindGuarantorListTable: function(_context) {
         var currentContext = _context.getObject();

         jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
         var oDisplayBase, itemsTemplate,
             lastName = '',
             secondName = '',
             firstName = '',
             middleName = '',
             colonia = "";

         try {
             oDisplayBase = new sap.ui.mw.DisplayBase();
             itemsTemplate = new sap.m.ColumnListItem({});
             itemsTemplate.setType(sap.m.ListType.Navigation);
             itemsTemplate.setSelected(true);
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


             if (!_.isUndefined(_context.getProperty("AddressSet/results"))) {
                 colonia = _.last(_.sortBy(_context.getProperty("AddressSet/results"), 'Place.Suburb'));
             }
             itemsTemplate.addCell(oDisplayBase.createText("", _.isUndefined(colonia) || _.isUndefined(colonia.Place) ? "" : colonia.Place.Suburb));

             return itemsTemplate;
         } catch (err) {
             sap.m.MessageToast.show(err);
            
         }
        
     },
     onSearchGuarantors: function(evt) {
         var txtSeachFilter, allFilter;
         var table = sap.ui.getCore().byId("tblGuarantors");
         var binding = table.getBinding("items");
         txtSeachFilter = evt.getSource().getValue();
         if (txtSeachFilter.length > 0) {
             var filter = new sap.ui.model.Filter("BPIdCRM", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             var filter1 = new sap.ui.model.Filter("BpName/FirstName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             var filter2 = new sap.ui.model.Filter("BpName/LastName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             var filter3 = new sap.ui.model.Filter("BpName/SecondName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             var filter4 = new sap.ui.model.Filter("BpName/MiddleName", sap.ui.model.FilterOperator.Contains, txtSeachFilter);
             allFilter = new sap.ui.model.Filter([filter, filter1, filter2, filter3, filter4], false);
         }
         binding.filter(allFilter, "Application");
     },
     addGuarantor: function() {
         sap.ui.core.UIComponent.getRouterFor(this).navTo("guarantorsDetail", {
             guarantorId: 0,
             query: {
                 tab: "Name"
             }
         }, false);
     },
     openFilters: function() {
         new sap.ui.mw.forms.guarantor.Guarantor().createFiltersForm(this).open();
     },
     filterGuarantorValidate: function(model) {
         var flag = true;
         var message = "";
         if (model.getProperty("/IdBP").length === 0) {
             if (model.getProperty("/FirstName").length === 0 || model.getProperty("/FirstName").length === 0) {
                 flag = false;
                 message = "Completa datos obligatorios";
             }
         }
         if (!flag) {
             sap.m.MessageToast.show(message);
         }
         return flag;
     },
     searchFilterGuarantor: function(model, dialog, oController) {
         var oDisplayBase = new sap.ui.mw.DisplayBase();
        
         if (sap.OData) {
             sap.OData.removeHttpClient();
         }
         var bdLoader = new sap.m.BusyDialog("", {
             text: 'Espere por favor...',
             title: 'Cargando'
         });
         bdLoader.setText("Cargando Resultados");
        
         var birthdDate = model.getProperty("/BirthDate") !== null ? moment(model.getProperty("/BirthDate")).format('YYYY-MM-DDTHH:mm:ss') : '0000-00-00T00:00:00' ;
         var params = ["CollaboratorID='" + sap.ui.getCore().AppContext.Promotor +
             "'&BPIdCRM='" + model.getProperty("/IdBP") +
             "'&FirstName='" + model.getProperty("/FirstName") +
             "'&MiddleName='" + model.getProperty("/MiddleName") +
             "'&LastName='" + model.getProperty("/LastName") +
             "'&SecondName='" + model.getProperty("/SecondName") +
             "'&BirthdDate=datetime'"+birthdDate+"'"
         ]; 
         if (this.filterGuarantorValidate(model)) {
             sap.ui.getCore().AppContext.myRest.read("/GuarantorCandidate", params, true).then(function(response) {
                 if (sap.OData) {
                     sap.OData.applyHttpClient();
                 }
                var oModelAvales = new sap.ui.model.json.JSONModel(response);

                 oController.showListFilter(dialog, oModelAvales);
             }).catch(function(error) {
                 sap.m.MessageToast.show("Se presentó un error al realizar la consulta de avales");
                 if (sap.OData) {
                     sap.OData.applyHttpClient();
                 }
             });
         }
     },

     assignGuarantorRole: function(guarantor) {
         if (sap.OData) {
             sap.OData.removeHttpClient();
         }
         var bdLoader = new sap.m.BusyDialog("", {
             text: 'Espere por favor...',
             title: 'Asignando rol'
         });
         var params = ["CollaboratorID='" + sap.ui.getCore().AppContext.Promotor +
             "'&CustomerIDCRM='" + guarantor.getProperty("BPIdCRM") + "'"
         ];
         sap.ui.getCore().AppContext.myRest.read("/AssignGuarantorRole", params, true).then(function(response) {
             if (sap.OData) {
                 sap.OData.applyHttpClient();
             }
            
         }).catch(function(error) {
             sap.m.MessageToast.show("Se presentó un error al realizar la asignación del rol de aval");
           
             if (sap.OData) {
                 sap.OData.applyHttpClient();
             }
         });
         this.closeShowConfirmation();
     },

     updateGuarantorValidityPeriod: function(guarantor) {
         if (sap.OData) {
             sap.OData.removeHttpClient();
         }
         var bdLoader = new sap.m.BusyDialog("", {
             text: 'Espere por favor...',
             title: 'Actualizando periodo'
         });
         var params = ["CollaboratorID='" + sap.ui.getCore().AppContext.Promotor +
             "'&CustomerIDCRM='" + guarantor.getProperty("BPIdCRM") + "'"
         ];
         sap.ui.getCore().AppContext.myRest.read("/UpdateGuarantorValidityPeriod", params, true).then(function(response) {
             if (sap.OData) {
                 sap.OData.applyHttpClient();
             }
             
             
         }).catch(function(error) {
             sap.m.MessageToast.show("Se presentó un error al actualizar el periodo del aval");
           
             if (sap.OData) {
                 sap.OData.applyHttpClient();
             }
         });
         this.closeShowConfirmation();
     },

     createItemGuarantorFilterList: function(_context) {
        
         var currentController = this;
         var oColumnTemplate = new sap.m.ColumnListItem({});
         oColumnTemplate.setType(sap.m.ListType.Active);
         oColumnTemplate.addCell(new sap.m.ObjectHeader({
             title: _context.getProperty("FirstName") + " " + _context.getProperty("MiddleName") + " " + _context.getProperty("LastName") + " " + _context.getProperty("SecondName"),
             responsive: true,
             backgroundDesign: "Translucent",
             fullScreenOptimizeds: true,
             attributes: [
                 new sap.m.ObjectAttribute({
                     title: "Id Cliente",
                     text: _context.getProperty("BPIdCRM")
                 })
             ]
         }));
         oColumnTemplate.addCell(new sap.ui.mw.ActionBase().createButton("", "", "Accept", _context.getProperty("IsGuarantor") ? "sap-icon://visits" : "sap-icon://hr-approval", currentController.showConfirmation.bind(currentController, _context), currentController));
         return oColumnTemplate;
     },

     showGuarantor: function(oEvent) {
         new sap.ui.mw.forms.guarantor.Guarantor().createDetailForm(oEvent.getParameters().listItem.getBindingContext().getModel().getProperty(oEvent.getParameters().listItem.getBindingContext().getPath()), this).open();
     },
     showListFilter: function(dialog, oModelAvales) {
         dialog.destroy();
         new sap.ui.mw.forms.guarantor.Guarantor().createListFiltersForm(this, oModelAvales).open();
     },
     onCancelFilterGuarantor: function() {
         this.destroy();
     },
     showConfirmation: function(guarantor) {
         var dialogAdds;
         var oActionBase = new sap.ui.mw.ActionBase();
         var oDisplayBase = new sap.ui.mw.DisplayBase();
         var oCurrentController = this;
         setTimeout(function() {
             dialogAdds = sap.ui.getCore().byId('appDialogConfirmation');
             //agregar contenido a dialogo
             if (!guarantor.getProperty("IsGuarantor")) {
                 dialogAdds.addContent(oDisplayBase.createLabel("", "¿Desea asignar el rol Aval?"));
                 dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.assignGuarantorRole.bind(oCurrentController, guarantor), oCurrentController));
             } else {
                 dialogAdds.addContent(oDisplayBase.createLabel("", "¿Desea habilitar el Aval?"));
                 dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.updateGuarantorValidityPeriod.bind(oCurrentController, guarantor), oCurrentController));
             }
             dialogAdds.addButton(oActionBase.createButton("", "Cancelar", "Default", "", oCurrentController.closeShowConfirmation, oCurrentController));
             dialogAdds.open();
         }, 0);
     },
     closeShowConfirmation: function() {
         var oCurrentDialog = sap.ui.getCore().byId("appDialogConfirmation");
         oCurrentDialog.destroyContent();
         oCurrentDialog.destroyButtons();
         oCurrentDialog.close();
     },

 });
