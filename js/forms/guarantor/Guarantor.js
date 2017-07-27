(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.mw.forms.guarantor.Guarantor");
  jQuery.sap.require("sap.ui.base.Object");
  // Se agregan Middleware de componentes SAPUI5
  jQuery.sap.require("js.base.InputBase", "js.base.ActionBase",
                     "js.base.DisplayBase", "js.base.LayoutBase",
                     "js.base.PopupBase", "js.base.ListBase",
                     "js.base.ContainerBase", "js.base.EventBase");

  sap.ui.base.Object.extend('sap.ui.mw.forms.guarantor.Guarantor', {});

  sap.ui.mw.forms.guarantor.Guarantor.prototype.createFiltersForm = function(
      oController) {

    var oInputBase = new sap.ui.mw.InputBase();
    var oActionBase = new sap.ui.mw.ActionBase();
    var oDisplayBase = new sap.ui.mw.DisplayBase();
    var oLayoutBase = new sap.ui.mw.LayoutBase();
    var oForm = oLayoutBase.createForm("", true, 1, "").destroyContent();

    oForm.setModel(new sap.ui.model.json.JSONModel({
      FirstName : "",
      SecondName : "",
      LastName : "",
      MiddleName : "",
      IdBP : "",
      BirthDate : null
    }),
                   "oModelFilterGuarantor");

    // Se crea formulario

    // se agrega contenido a formulario
    oForm.addContent(oDisplayBase.createLabel("", "Primer Nombre*"));
    oForm.addContent(
        oInputBase.createInputText("", "Text", "Ingrese primer nombre...",
                                   "{oModelFilterGuarantor>/FirstName}", true,
                                   true, "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));
    oForm.addContent(oDisplayBase.createLabel("", "Segundo Nombre"));
    oForm.addContent(
        oInputBase.createInputText("", "Text", "Ingrese segundo nombre...",
                                   "{oModelFilterGuarantor>/SecondName}", true,
                                   true, "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));
    oForm.addContent(oDisplayBase.createLabel("", "Apellido Paterno*"));
    oForm.addContent(
        oInputBase.createInputText("", "Text", "Ingrese Apellido Paterno...",
                                   "{oModelFilterGuarantor>/LastName}", true,
                                   true, "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));
    oForm.addContent(oDisplayBase.createLabel("", "Apellido Materno"));
    oForm.addContent(
        oInputBase.createInputText("", "Text", "Ingrese Apellido Materno...",
                                   "{oModelFilterGuarantor>/MiddleName}", true,
                                   true, "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));
    oForm.addContent(oDisplayBase.createLabel("", "Id BP"));
    oForm.addContent(
        oInputBase.createInputText("", "Number", "Ingrese Id BP...",
                                   "{oModelFilterGuarantor>/IdBP}", true, true,
                                   "^[0-9]{10}$")
            .setMaxLength(10));

    oForm.addContent(oDisplayBase.createLabel("", "Fecha de Nacimiento"));
    oForm.addContent(oInputBase.createDatePicker(
        "pickerAppDate", "{oModelFilterGuarantor>/BirthDate}", "",
        "dd.MM.yyyy"));
    var oDlgFiltersGuarantor = new sap.ui.mw.PopupBase().createDialog(
        "", "Busqueda y asignación de rol aval", "Message", "");

    oDlgFiltersGuarantor.setContentWidth("80%").setContentHeight("75%");
    oDlgFiltersGuarantor.addButton(oActionBase.createButton(
        "", "Aceptar", "Emphasized", "sap-icon://accept",
        oController.searchFilterGuarantor.bind(
            oController, oForm.getModel("oModelFilterGuarantor"),
            oDlgFiltersGuarantor, oController),
        oController));
    oDlgFiltersGuarantor.addButton(oActionBase.createButton(
        "", "Cancelar", "Default", "sap-icon://sys-cancel",
        oController.onCancelFilterGuarantor, oDlgFiltersGuarantor));
    oDlgFiltersGuarantor.addContent(oForm);
    return oDlgFiltersGuarantor;
  };

  sap.ui.mw.forms.guarantor.Guarantor.prototype.createListFiltersForm =
      function(oController, oModel) {
    var oInputBase = new sap.ui.mw.InputBase();
    var oActionBase = new sap.ui.mw.ActionBase();
    var oDisplayBase = new sap.ui.mw.DisplayBase();

    var oTable = new sap.ui.mw.ListBase().createTable(
        "", "", sap.m.ListMode.SingleSelectMaster, [ "", "" ], [ true, true ],
        [ false, false ], [ "85%", "15%" ],
        oController.showGuarantor.bind(oController), oController);
    oTable.setModel(oModel);
    oTable.bindAggregation("items", {
      type : sap.m.ListType.Inactive,
      path : "/results",
      factory : function(_id, _context) {
        return oController.createItemGuarantorFilterList(_context);
      }
    });

    var oDlgFiltersGuarantor = new sap.ui.mw.PopupBase().createDialog(
        "", "Asignar rol y modificacion de avales", "Message", "");

    oDlgFiltersGuarantor.setContentWidth("80%").setContentHeight("75%");
    oDlgFiltersGuarantor.addButton(oActionBase.createButton(
        "", "Cancelar", "Default", "sap-icon://sys-cancel",
        oController.onCancelFilterGuarantor, oDlgFiltersGuarantor));
    oDlgFiltersGuarantor.addContent(oTable);
    return oDlgFiltersGuarantor;
  };

  sap.ui.mw.forms.guarantor.Guarantor.prototype.createDetailForm = function(
      oModel, oController) {
    console.log(oModel);
    var oInputBase = new sap.ui.mw.InputBase();
    var oActionBase = new sap.ui.mw.ActionBase();
    var oDisplayBase = new sap.ui.mw.DisplayBase();
     var birthdDate = oModel.BirthdDate !== null ? moment(oModel.BirthdDate).format('DD.MM.YYYY') : 'N/A' ;
    var oDlgDetailGuarantor =
        new sap.ui.mw.PopupBase().createDialog("", "Detalle", "Message", "");

    oDlgDetailGuarantor.setContentWidth("80%").setContentHeight("25%");
    oDlgDetailGuarantor.addButton(oActionBase.createButton(
        "", "Aceptar", "Default", "",
        oController.onCancelFilterGuarantor, oDlgDetailGuarantor));
     oDlgDetailGuarantor.addContent(oDisplayBase.createLabel("", oModel.LastName+" "+oModel.SecondName+" "+oModel.FirstName+" "+oModel.MiddleName).setWidth("100%"));
     oDlgDetailGuarantor.addContent(oDisplayBase.createLabel("", "Fecha de Nacimiento: "+birthdDate).setWidth("100%"));
     oDlgDetailGuarantor.addContent(oDisplayBase.createLabel("", "Id Client: "+oModel.BPIdCRM).setWidth("100%"));
    return oDlgDetailGuarantor;
  };

})();
