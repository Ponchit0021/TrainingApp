(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.mw.forms.bp.References");
  jQuery.sap.require("sap.ui.base.Object");
  // Se agregan Middleware de componentes SAPUI5
  jQuery.sap.require("js.base.InputBase", "js.base.ActionBase",
                     "js.base.DisplayBase", "js.base.LayoutBase",
                     "js.base.PopupBase", "js.base.ListBase",
                     "js.base.ContainerBase");

  sap.ui.base.Object.extend('sap.ui.mw.forms.bp.References', {});

  sap.ui.mw.forms.bp.References.prototype.createForm = function(oController) {
    var oInputBase = new sap.ui.mw.InputBase();
    var oActionBase = new sap.ui.mw.ActionBase();
    var oLayoutBase = new sap.ui.mw.LayoutBase();
    var oListBase = new sap.ui.mw.ListBase();
    // Variables para formulario
    var oForm, oFlex, selectAdditional;

    // Se crea formulario
    oForm = oLayoutBase.createForm(oController.idForm + "References", true, 1,
                                   "Adicionales")
                .destroyContent();

   
   
    // Cargamos el catálogo de Tipos de Pagos de Seguros
    var oItemAppRelationship =
        new sap.ui.core.Item({key : "{idCRM}", text : "{text}"});
    selectAdditional =
        oInputBase.createSelect(oController.idForm + "Relationship",
                                "/referencia", oItemAppRelationship,
                                oController._AppRelationship, null, null)
            .setLayoutData(new sap.m.FlexItemData().setGrowFactor(2))
            .setWidth("100%");

    

    oFlex = oLayoutBase.createFlexBox().setWidth("100%");
    oFlex.addItem(selectAdditional);
    oFlex.addItem(oActionBase.createButton("", "", "Default", "sap-icon://add",
                                           oController.addReference,
                                           oController));
    oForm.addContent(oFlex);

    oForm.addContent(
        oInputBase.createSearchField("", oController.searchReference,
                                     oController, "100%")
            .setLayoutData(new sap.m.FlexItemData().setGrowFactor(1))
            .setWidth("100%"));
    
    // Cuando se trata del modulo de avales solo muestra en el listado Conyuge y
    // Empleador
    if (oController.getView().getViewName() === "originacion.GuarantorDetail") {
      var bindSelect = selectAdditional.getBinding("items");
      bindSelect.filter(
          [
            new sap.ui.model.Filter("idCRM", sap.ui.model.FilterOperator.EQ,
                                    "ZC11"),
            new sap.ui.model.Filter("idCRM", sap.ui.model.FilterOperator.EQ,
                                    "ZC16"),
            new sap.ui.model.Filter("idCRM", sap.ui.model.FilterOperator.EQ, "")
          ],
          "referencias");
    }

    var oTable = oListBase.createTable(
        oController.idForm + "tblAppReferences", "",
        sap.m.ListMode.SingleSelectMaster, [ "", "", "" ], [ true, true, true ],
        [ false, false, false ], [ "10%", "75%", "15%" ],
        oController.renderReferenceDetail, oController);
    oTable.bindAggregation("items", {
      type : sap.m.ListType.Inactive,
      path : "ReferencesModel>/",
      factory : oController.createItemTableReference.bind(
          oController) 
    });
    oForm.addContent(oTable);
   
    return oForm;
  };

  sap.ui.mw.forms.bp.References.prototype.createSpouseForm = function(
      oController, oModel, isEdited) {
    // Middleware de componentes SAPUI5
    var oInputBase, oDisplayBase, oLayoutBase, oActionBase, oForm;
    // Variables campos de formulario
    var txtAppDgRefName, txtAppDgRefSecondName, txtAppDgRefLastname,
        txtAppDgRefSurname, txtAppDgRefPhone;
    // Se declaran objetos de Middleware de componentes SAPUI5
    oInputBase = new sap.ui.mw.InputBase();
    oDisplayBase = new sap.ui.mw.DisplayBase();
    oLayoutBase = new sap.ui.mw.LayoutBase();
    oActionBase = new sap.ui.mw.ActionBase();

    // Se agrega contenido a formulario}
    oForm = oLayoutBase.createForm(oController.idForm + "ReferenceSpouse", true,
                                   1, "Agregar cónyuge");
   
    oForm.destroyContent();
    oForm.addContent(oDisplayBase.createLabel("", "Primer nombre*"));
    txtAppDgRefName =
        oInputBase.createInputText("txtAppDgRefName", "Text",
                                   "Ingrese Primer Nombre...",
                                   "{FormModel>/BpNameData/FirstName}", true,
                                   true, "^(([A-Za-zÑñ]+)\\s?)*$", true)
            .setMaxLength(26);
    oForm.addContent(txtAppDgRefName);
    oForm.addContent(oDisplayBase.createLabel("", "Segundo nombre"));
    txtAppDgRefSecondName =
        oInputBase.createInputText("txtAppDgRefSecondName", "Text",
                                   "Ingrese Segundo Nombre...",
                                   "{FormModel>/BpNameData/MiddleName}", true,
                                   true, "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26);
    oForm.addContent(txtAppDgRefSecondName);
    oForm.addContent(oDisplayBase.createLabel("", "Apellido paterno*"));
    txtAppDgRefLastname =
        oInputBase.createInputText("txtAppDgRefLastname", "Text",
                                   "Ingrese Apellido Paterno...",
                                   "{FormModel>/BpNameData/LastName}", true,
                                   true, "^(([A-Za-zÑñ]+)\\s?)*$", true)
            .setMaxLength(26);
    oForm.addContent(txtAppDgRefLastname);
    oForm.addContent(oDisplayBase.createLabel("", "Apellido materno"));
    txtAppDgRefSurname =
        oInputBase.createInputText("txtAppDgRefSurname", "Text",
                                   "Ingrese Apellido Materno...",
                                   "{FormModel>/BpNameData/SecondName}", true,
                                   true, "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26);
    oForm.addContent(txtAppDgRefSurname);
    oForm.addContent(oDisplayBase.createLabel("", "Ocupación*"));
    oForm.addContent(
        oInputBase.createSelect(
                      "", "/ocupacion",
                      new sap.ui.core.Item({key : "{idCRM}", text : "{text}"}),
                      new sap.ui.model.json.JSONModel(
                          "data-map/catalogos/occupation.json"),
                      oController.onChangeJob, oController)
            .bindProperty("selectedKey", {
              path : "FormModel>/Job",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", "Teléfono*"));
    txtAppDgRefPhone =
        oInputBase.createInputText("", "Tel", "INGRESE TELÉFONO DE TRABAJO...",
                                   "{FormModel>/WorkPhone}", true, true,
                                   "\\d{10}$", true)
            .setMaxLength(10);
    oForm.addContent(txtAppDgRefPhone);
    var oDialog = new sap.ui.mw.PopupBase().createDialog(
        oController.idForm + "DialogReference", "Referencias", "Message",
        "sap-icon://add");
    oDialog.setContentWidth("80%").setContentHeight("75%").addContent(oForm);
    oDialog.addButton(
        oActionBase.createButton("", "Guardar", "Emphasized", "sap-icon://save",
                                 oController.saveReference, oController));
    oDialog.addButton(oActionBase.createButton("", "Cancelar", "Default",
                                               "sap-icon://sys-cancel",
                                               oController.onCancel, oDialog));
    oDialog.setModel(oModel, "FormModel");

   
    return oDialog.open();
  };
  sap.ui.mw.forms.bp.References.prototype.createEmployerForm = function(
      oController, oModel, isEdited) {
   
    // Middleware de componentes SAPUI5
    var oInputBase, oDisplayBase, oLayoutBase, oForm, oActionBase;
    // Variables para formulario
    var chkRazonSocial, txtAppDgEmpRazon, txtAppDgEmpName,
        txtAppDgEmpSecondName, txtAppDgEmpLastname, txtAppDgEmpSurname,
        txtAppDgPostCode, selectAppDgEntity, selectAppDgDelegation,
        txtAppDgCity, selectAppDgSuburb, txtAppDgStreet, txtAppDgNumExt,
        txtAppDgNumInt;

    var oItemAppDgEntity =
        new sap.ui.core.Item({key : "{idCRM}", text : "{text}"});
    var oItemAppDgDelegation =
        new sap.ui.core.Item({key : "{TownName}", text : "{TownName}"});
    var oItemAppDgSuburb =
        new sap.ui.core.Item({key : "{SuburbName}", text : "{SuburbName}"});
    var appDgEntity =
        new sap.ui.model.json.JSONModel("data-map/catalogos/entidadNac.json");
    // Se declaran objetos de Middleware de componentes SAPUI5
    oInputBase = new sap.ui.mw.InputBase();
    oDisplayBase = new sap.ui.mw.DisplayBase();
    oLayoutBase = new sap.ui.mw.LayoutBase();
    oActionBase = new sap.ui.mw.ActionBase();

    var oDialog = new sap.ui.mw.PopupBase().createDialog(
        oController.idForm + "DialogReference", "Referencias", "Message",
        "sap-icon://add");
    oDialog.setModel(oModel, "FormModel");
    oDialog.addButton(
        oActionBase.createButton("", "Guardar", "Emphasized", "sap-icon://save",
                                 oController.saveReference, oController));
    oDialog.addButton(oActionBase.createButton("", "Cancelar", "Default",
                                               "sap-icon://sys-cancel",
                                               oController.onCancel, oDialog));
    // Se agrega contenido a formulario}
    oForm = oLayoutBase.createForm(oController.idForm + "ReferencesEmployer",
                                   true, 1, "Agregar empleador")
                .destroyContent();
    oDialog.setContentWidth("80%").setContentHeight("75%").addContent(oForm);
    chkRazonSocial = oInputBase.createCheckBox(
        "chkRazonSocial", "¿Razón Social?", "{FormModel>/IsCompany}", true,
        oController.onCheckBox, oController);
    oForm.addContent(chkRazonSocial);
    oForm.addContent(oDisplayBase.createLabel("", "Razón Social*"));
    txtAppDgEmpRazon =
        oInputBase.createInputText("txtAppDgEmpRazon", "Text",
                                   "Ingrese razón social...",
                                   "{FormModel>/BusinessName}", true, true,
                                   "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(80);
    txtAppDgEmpRazon.bindProperty("visible", "FormModel>/IsCompany");
    oForm.addContent(txtAppDgEmpRazon);
 
    oForm.addContent(oDisplayBase.createLabel("", "Primer Nombre*"));
    txtAppDgEmpName =
        oInputBase.createInputText("txtAppDgEmpName", "Text",
                                   "Ingrese Primer Nombre...",
                                   "{FormModel>/Name/FirstName}", true, true,
                                   "^(([A-Za-zÑñ]+)\\s?)*$", true)
            .setMaxLength(26);
    txtAppDgEmpName.bindProperty("visible", {
      path : "FormModel>/IsCompany",
      formatter : function(oValue) { return oValue ? false : true; }
    });
    oForm.addContent(txtAppDgEmpName);
    oForm.addContent(oDisplayBase.createLabel("", "Segundo Nombre"));
    txtAppDgEmpSecondName =
        oInputBase.createInputText("txtAppDgEmpSecondName", "Text",
                                   "Ingrese Segundo Nombre...",
                                   "{FormModel>/Name/MiddleName}", true, true,
                                   "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26);
    txtAppDgEmpSecondName.bindProperty("visible", {
      path : "FormModel>/IsCompany",
      formatter : function(oValue) { return oValue ? false : true; }
    });
    oForm.addContent(txtAppDgEmpSecondName);
    oForm.addContent(oDisplayBase.createLabel("", "Apellido Paterno*"));
    txtAppDgEmpLastname =
        oInputBase.createInputText("txtAppDgEmpLastname", "Text",
                                   "Ingrese Apellido Paterno",
                                   "{FormModel>/Name/LastName}", true, true,
                                   "^(([A-Za-zÑñ]+)\\s?)*$", true)
            .setMaxLength(26);
    txtAppDgEmpLastname.bindProperty("visible", {
      path : "FormModel>/IsCompany",
      formatter : function(oValue) { return oValue ? false : true; }
    });
    oForm.addContent(txtAppDgEmpLastname);
    oForm.addContent(oDisplayBase.createLabel("", "Apellido Materno"));
    txtAppDgEmpSurname =
        oInputBase.createInputText("txtAppDgEmpSurname", "Text",
                                   "Ingrese Apellido Materno...",
                                   "{FormModel>/Name/SecondName}", true, true,
                                   "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26);
    txtAppDgEmpSurname.bindProperty("visible", {
      path : "FormModel>/IsCompany",
      formatter : function(oValue) { return oValue ? false : true; }
    });
    oForm.addContent(txtAppDgEmpSurname);
    oForm.addContent(oDisplayBase.createLabel("", "Código Postal*"));
    txtAppDgPostCode =
        oInputBase.createInputText("txtAppDgPostCode", "Number",
                                   "Ingrese Código Postal...",
                                   "{FormModel>/Place/PostalCode}", true, true,
                                   "^\\d{5}$", true)
            .setMaxLength(5);
    oForm.addContent(txtAppDgPostCode);
    oForm.addContent(oActionBase.createButton(
        "", "Buscar", "Default", "sap-icon://search",
        oController.onSearchAdressEmployer, oController));

    oForm.addContent(oDisplayBase.createLabel("", "Entidad Federativa*"));
    selectAppDgEntity = oInputBase.createSelect(
        "selectAppDgEntity", "/entidad", oItemAppDgEntity, appDgEntity,
        oController.onChangeEntity, oController);
    selectAppDgEntity.bindProperty("selectedKey", {
      path : "FormModel>/Place/StateId",
      type : new sap.ui.model.type.String({}, {required : true})
    });
    oForm.addContent(selectAppDgEntity);

    oForm.addContent(oDisplayBase.createLabel("", "Delegación o Municipio*"));
    selectAppDgDelegation =
        oInputBase.createSelect("selectAppDgDelegation", "/results",oItemAppDgDelegation)
            .bindProperty("selectedKey", {
              path : "FormModel>/Place/TownId",
              type : new sap.ui.model.type.String({})
            })
            .setEnabled(false);

    oForm.addContent(selectAppDgDelegation);
    oForm.addContent(oDisplayBase.createLabel("", "Ciudad o Localidad*"));
    txtAppDgCity =
        oInputBase.createInputText("txtAppDgCity", "Text",
                                   "Ingrese Ciudad o Localidad...",
                                   "{FormModel>/Place/City}", true, true,
                                   "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(40);
    oForm.addContent(txtAppDgCity);
    oForm.addContent(oDisplayBase.createLabel("", "Colonia o Barrio*"));
    selectAppDgSuburb = oInputBase.createSelect("selectAppDgSuburb", "/results",
                                                oItemAppDgSuburb)
                            .bindProperty("selectedKey",{
                                        path : "FormModel>/Place/Suburb",
                                        type : new sap.ui.model.type.String(
                                            {})
                                      })
                            .setAutoAdjustWidth(true)
                            
    oForm.addContent(selectAppDgSuburb);
    oForm.addContent(oDisplayBase.createLabel("", "Calle*"));
    txtAppDgStreet =
        oInputBase.createInputText("txtAppDgStreet", "Text", "Ingrese Calle...",
                                   "{FormModel>/Place/Street}", true, true,
                                   "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(60);
    oForm.addContent(txtAppDgStreet);
    oForm.addContent(oDisplayBase.createLabel("", "Número Exterior*"));
    txtAppDgNumExt =
        oInputBase.createInputText("txtAppDgNumExt", "Text",
                                   "Ingrese Número Exterior...",
                                   "{FormModel>/Place/OutsideNumber}", true,
                                   true, "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(10);
    oForm.addContent(txtAppDgNumExt);
    oForm.addContent(oDisplayBase.createLabel("", "Número Interior*"));
    txtAppDgNumInt =
        oInputBase.createInputText("txtAppDgNumInt", "Text",
                                   "Ingrese Número Interior...",
                                   "{FormModel>/Place/InteriorNumber}", true,
                                   true, "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(10);
    oForm.addContent(txtAppDgNumInt);

    

    return oDialog.open();
  };
  sap.ui.mw.forms.bp.References.prototype.createReferenceForm = function(
      oController, oModel, isEdited) {
    // Middleware de componentes SAPUI5
    var oInputBase, oDisplayBase, oLayoutBase, oActionBase, oForm;
    // Variables campos de formulario
    var txtAppDgRefName, txtAppDgRefSecondName, txtAppDgRefLastname,
        txtAppDgRefSurname, txtAppDgRefPhone;
    // Se declaran objetos de Middleware de componentes SAPUI5
    oInputBase = new sap.ui.mw.InputBase();
    oDisplayBase = new sap.ui.mw.DisplayBase();
    oLayoutBase = new sap.ui.mw.LayoutBase();
    oActionBase = new sap.ui.mw.ActionBase();

    // Se agrega contenido a formulario}
    oForm = oLayoutBase.createForm(oController.idForm + "ReferencesAdd", true,
                                   1, "Agregar Adicional");
   
    oForm.destroyContent();
    oForm.addContent(oDisplayBase.createLabel("", "Primer nombre*"));
    txtAppDgRefName =
        oInputBase.createInputText("txtAppDgRefName", "Text",
                                   "Ingrese Primer Nombre...",
                                   "{FormModel>/Name/FirstName}", true, true,
                                   "^(([A-Za-zÑñ]+)\\s?)*$", true)
            .setMaxLength(26);
    oForm.addContent(txtAppDgRefName);
    oForm.addContent(oDisplayBase.createLabel("", "Segundo nombre"));
    txtAppDgRefSecondName =
        oInputBase.createInputText("txtAppDgRefSecondName", "Text",
                                   "Ingrese Segundo Nombre...",
                                   "{FormModel>/Name/MiddleName}", true, true,
                                   "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26);
    oForm.addContent(txtAppDgRefSecondName);
    oForm.addContent(oDisplayBase.createLabel("", "Apellido paterno*"));
    txtAppDgRefLastname =
        oInputBase.createInputText("txtAppDgRefLastname", "Text",
                                   "Ingrese Apellido Paterno...",
                                   "{FormModel>/Name/LastName}", true, true,
                                   "^(([A-Za-zÑñ]+)\\s?)*$", true)
            .setMaxLength(26);
    oForm.addContent(txtAppDgRefLastname);
    oForm.addContent(oDisplayBase.createLabel("", "Apellido materno"));
    txtAppDgRefSurname =
        oInputBase.createInputText("txtAppDgRefSurname", "Text",
                                   "Ingrese Apellido Materno...",
                                   "{FormModel>/Name/SecondName}", true, true,
                                   "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26);
    oForm.addContent(txtAppDgRefSurname);
    oForm.addContent(oDisplayBase.createLabel("", "Teléfono*"));
    txtAppDgRefPhone =
        oInputBase.createInputText("", "Tel", "Ingrese Teléfono...",
                                   "{FormModel>/Phone}", true, true,
                                   "^\\d{10}$", true)
            .setMaxLength(10);
    oForm.addContent(txtAppDgRefPhone);
    var oDialog = new sap.ui.mw.PopupBase().createDialog(
        oController.idForm + "DialogReference", "Referencias", "Message",
        "sap-icon://add");
    oDialog.setContentWidth("80%").setContentHeight("75%").addContent(oForm);
    oDialog.addButton(
        oActionBase.createButton("", "Guardar", "Emphasized", "sap-icon://save",
                                 oController.saveReference, oController));
    oDialog.addButton(oActionBase.createButton("", "Cancelar", "Default",
                                               "sap-icon://sys-cancel",
                                               oController.onCancel, oDialog));
    oDialog.setModel(oModel, "FormModel");

  
    return oDialog.open();
  };
})();
