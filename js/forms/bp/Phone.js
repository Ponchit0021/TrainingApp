(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.mw.forms.bp.Phone");
  jQuery.sap.require("sap.ui.base.Object");
  jQuery.sap.require("js.base.InputBase");
  jQuery.sap.require("js.base.ActionBase");
  jQuery.sap.require("js.base.LayoutBase");
  jQuery.sap.require("js.base.PopupBase");
  jQuery.sap.require("js.base.ListBase");
  jQuery.sap.require("js.base.DisplayBase");
  sap.ui.base.Object.extend('sap.ui.mw.forms.bp.Phone', {});

  sap.ui.mw.forms.bp.Phone.prototype.createForm = function(oController) {
    var oForm =
        new sap.ui.mw.LayoutBase()
            .createForm(oController.idForm + "Phone", true, 2, "Teléfonos")
            .destroyContent();
    oForm.addContent(new sap.ui.mw.DisplayBase().createLabel("", ""));
    oForm.addContent(new sap.ui.mw.ActionBase()
                         .createButton("", "Nuevo teléfono", "Default",
                                       "sap-icon://add", oController.addPhone,
                                       oController)
                         .setWidth("100%"));
    oForm.addContent(new sap.ui.mw.DisplayBase().createLabel("", ""));
    oForm.addContent(new sap.ui.mw.InputBase().createSearchField(
        "", oController.onSearchPhones, oController, "100%"));
    oForm.addContent(new sap.ui.mw.DisplayBase().createLabel("", ""));
    var oTable = new sap.ui.mw.ListBase().createTable(
        oController.idForm + "tblAppPhones", "",
        sap.m.ListMode.SingleSelectMaster, [ "", "", "" ], [ true, true, true ],
        [ false, false, false ], [ "10%", "75%", "15%" ],
        oController.updatePhone, oController);
    oController.bindAggregationPhone();
    oForm.addContent(oTable);
   
    return oForm;
  };

  sap.ui.mw.forms.bp.Phone.prototype.createPhoneDetailForm = function(
      oController, oModel, isEdited, modelPath) {
    var oModelTypePhone =
        new sap.ui.model.json.JSONModel("data-map/catalogos/phones.json");
    var phoneDialog = new sap.ui.mw.PopupBase().createDialog(
        "", "Agregar Teléfono", "Message", "");
    var oActionBase = new sap.ui.mw.ActionBase();
    var oInputBase = new sap.ui.mw.InputBase();
    var oDisplayBase = new sap.ui.mw.DisplayBase();
    var oLayoutBase = new sap.ui.mw.LayoutBase();
    var oForm =
        oLayoutBase.createForm(oController.idForm + "PhoneDetail", true, 1, "")
            .destroyContent();
    oForm.setModel(oModel, "PhoneModel");
    phoneDialog.setContentWidth("75%").setContentHeight("40%");
    oForm.addContent(oDisplayBase.createLabel("", "Teléfono *"));
    oForm.addContent(oInputBase.createInputText("", "Tel",
                                                "Ingrese LADA+TELEFONO...",
                                                "{PhoneModel>/PhoneNumber}",
                                                true, true, "\\d{10}$", true)
                         .setMaxLength(10));
    oForm.addContent(oDisplayBase.createLabel("", "Tipo de Teléfono *"));
    oForm.addContent(
        oInputBase.createSelect(
                      "", "/tipo",
                      new sap.ui.core.Item({key : "{idCRM}", text : "{type}"}),
                      oModelTypePhone, null, null)
            .bindProperty("selectedKey", {
              path : "PhoneModel>/PhoneTypeId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    phoneDialog.addContent(oForm);
    phoneDialog.addButton(oActionBase.createButton(
        "", "Guardar", "Emphasized", "sap-icon://save",
        oController.savePhone.bind(oController, oForm.getModel("PhoneModel"),
                                   phoneDialog),
        oController));
    phoneDialog.addButton(oActionBase.createButton(
        "", "Cancelar", "Default", "sap-icon://sys-cancel",
        oController.cancelSavePhone, phoneDialog));

    return phoneDialog;
  };
})();
