sap.ui.jsfragment("js.forms.bp.FiltersGuarantor", {
    createContent: function(oController) {
        "use strict";

        jQuery.sap.require("sap.ui.base.Object");

        jQuery.sap.require("js.base.InputBase", "js.base.ActionBase",
            "js.base.DisplayBase", "js.base.LayoutBase",
            "js.base.PopupBase", "js.base.ListBase",
            "js.base.ContainerBase");

        var oInputBase = new sap.ui.mw.InputBase();
        var oActionBase = new sap.ui.mw.ActionBase();
        var oDisplayBase = new sap.ui.mw.DisplayBase();
        var oLayoutBase = new sap.ui.mw.LayoutBase();

        var oDlgFiltersGuarantor = new sap.ui.mw.PopupBase().createDialog(
            "", "Busqueda y asignación de rol aval", "Message", "");

        oDlgFiltersGuarantor.setContentWidth("80%").setContentHeight("75%");
        oDlgFiltersGuarantor.addButton(oActionBase.createButton(
            "", "Aceptar", "Emphasized", "sap-icon://accept",
            oController.searchFilterGuarantor, oController));
        oDlgFiltersGuarantor.addButton(oActionBase.createButton(
            "", "Cancelar", "Default", "sap-icon://sys-cancel",
            oController.onCancelFilterGuarantor, oDlgFiltersGuarantor));

        // Se crea formulario
        var oForm = oLayoutBase.createForm("", true, 1, "Nombre");
        oForm.destroyContent();
        // se agrega contenido a formulario
        oForm.addContent(oDisplayBase.createLabel("", "Primer Nombre*"));
        oForm.addContent(oInputBase.createInputText("txtAppFirstName", "Text",
                "Ingrese primer nombre...", "",
                true, true,
                "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", "Segundo Nombre"));
        oForm.addContent(oInputBase.createInputText("txtAppSecondName", "Text",
                "Ingrese segundo nombre...", "",
                true, true,
                "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", "Apellido Paterno*"));
        oForm.addContent(oInputBase.createInputText("txtAppLastName", "Text",
                "Ingrese Apellido Paterno...",
                "", true, true,
                "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", "Apellido Materno"));
        oForm.addContent(oInputBase.createInputText("txtAppSurname", "Text",
                "Ingrese Apellido Materno...",
                "", true, true,
                "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", "Id BP"));
        oForm.addContent(oInputBase.createInputText("txtAppIdBP", "Number",
                "Ingrese Id BP...",
                "", true, true,
                "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(26));

        oForm.addContent(oDisplayBase.createLabel("", "Fecha de Alta"));

        var oPatternFuture = new sap.ui.model.type.Date({
            pattern: "dd.MM.yyyy",
            UTC: true
        }, {
            minimum: new Date() /// is not less or equal, but less
        });
        var oDatePickerFirstPayment = new sap.m.DatePicker("dtpNciDateFechaDePrimerPago", {
            value: {
                path: "",
                type: oPatternFuture
            },
        });
        oDatePickerFirstPayment.attachValidationError(function(evt) {
            sap.m.MessageToast.show("Por favor indique una fecha posterior al día de hoy. ");
        });
        oForm.addContent(oDatePickerFirstPayment);
        oDlgFiltersGuarantor.addContent(oForm);
        return oDlgFiltersGuarantor;
    }
});
