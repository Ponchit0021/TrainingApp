(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.crosssell.Guarantor");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase", "js.base.ContainerBase", "js.SimpleTypes.ListaControlBase", "js.SimpleTypes.ListaControlBaseAval", "js.SimpleTypes.LevelRiskBase", "js.base.PopupBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.crosssell.Guarantor', {});
    sap.ui.mw.forms.crosssell.Guarantor.prototype.createForm = function(_oController) {
        var oContainerBase = new sap.ui.mw.ContainerBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase(),
            oInputBase = new sap.ui.mw.InputBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oListaControl = new sap.ui.model.SimpleType.ListaControlAval(),
            oLevelRisk = new sap.ui.model.SimpleType.LevelRisk(),
            oPopupBase = new sap.ui.mw.PopupBase(),
            oListBase = new sap.ui.mw.ListBase(),
            oForm, oModel;
        var oInputGuaranteeName, sFirstName, sSecondName, sLastName, sMiddleName, sFullName, bAvalExists, oTxtLevelRisk, semaphoreIcon, iSemaforo;
        var oDialogSelectGuarantee, oTxtListaDeContorlAval;

        oModel = _oController.getView().getModel("oViewModel");
        //Se crea formulario
        oForm = oLayoutBase.createForm("frmCrossSellGuarantorForm", true, 1, "Datos del Aval");
        oForm.setModel(oModel, "CrossSellApplicationModel");

        oForm.addContent(oActionBase.createButton("btnCrossSellAsignarAval", "Asignar Aval", "Emphasized", "sap-icon://add", _oController.onShowGuarantors, _oController));
        oForm.addContent(oDisplayBase.createLabel("", "ID Aval*"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellIdAval", "Text", "00000000000", "{CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/CustomerIdCRM}", true, false).attachChange(null));

        oForm.addContent(oDisplayBase.createLabel("", "Nombre del Aval*"));
        oInputGuaranteeName = oInputBase.createInputText(
            "txtCrossSellNombreDelAval", "Text", "Nombre del Aval",
            "{CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/GuarantorName/LastName}" +
            " " +
            "{CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/GuarantorName/SecondName}" +
            " " +
            "{CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/GuarantorName/FirstName}" +
            " " +
            "{CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/GuarantorName/MiddleName}",
            true,
            false);
        /*sFirstName = oModel.getProperty("CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/GuarantorName/FirstName");*/
        /*        sSecondName = oModel.getProperty("CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/GuarantorName/SecondName");*/
        /*        sLastName = oModel.getProperty("CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/GuarantorName/LastName");*/
        /*        sMiddleName = oModel.getProperty("CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/GuarantorName/MiddleName");*/
        /*        if (sLastName) {*/
        /*            sFullName = sLastName;*/
        /*        }*/
        /*        if (sSecondName) {*/
        /*            sFullName = sFullName + " " + sSecondName;*/
        /*        }*/
        /*        if (sFirstName) {*/
        /*            sFullName = sFullName + " " + sFirstName;*/
        /*        }*/
        /*        if (sMiddleName) {*/
        /*            sFullName = sFullName + " " + sMiddleName;*/
        /*        }*/
        //oInputGuaranteeName.setValue(sFullName);
        oForm.addContent(oInputGuaranteeName);
        /*if (oModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/FirstName") == "") {

            bAvalExists = false;

        } else {
            bAvalExists = true;
        }*/
        oForm.addContent(oDisplayBase.createLabel("", "Listas de Control"));
        oTxtListaDeContorlAval = oInputBase.createInputText("txtCrossSellListaDeContorlAval", "Text", "", "", true, false);
        oTxtListaDeContorlAval.bindProperty("value", {
            path: "CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/FilterResults/ControlListsResult",
            type: oListaControl
        });
        oForm.addContent(oTxtListaDeContorlAval);

        oTxtLevelRisk = oInputBase.createInputText("txtCrossSellNivelDeRiesgoAval", "Text", "", "", true, false);
        oTxtLevelRisk.bindProperty("value", {
            path: "CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/FilterResults/RiskLevel",
            type: oLevelRisk
        });
        oForm.addContent(oDisplayBase.createLabel("", "Nivel de riesgo"));
        oForm.addContent(oTxtLevelRisk);

        semaphoreIcon = oDisplayBase.createIcon("iconCrossSellSemaphoreGuarantor", "sap-icon://status-error", "2.0rem");
        oForm.addContent(oDisplayBase.createLabel("", ""));
        iSemaforo = oModel.getProperty("/GroupCrossSellAssignedGuarantorSet/FilterResults/SemaphoreResultFilters");
        _oController.setSemaphore("iconCrossSellSemaphoreGuarantor", iSemaforo);
        oForm.addContent(semaphoreIcon);
        //CrossSellApplicationModel>/GroupCrossSellAssignedGuarantorSet/FilterResults/SemaphoreResultFilters

        //////// Create popup - Seleccionar Aval
        oDialogSelectGuarantee = sap.ui.getCore().byId("popupCrossSellSelectGuarantor");

        if (!oDialogSelectGuarantee) {
            oDialogSelectGuarantee = oPopupBase.createDialog("popupCrossSellSelectGuarantor", "Seleccionar Aval", sap.m.DialogType.Standard);
            oDialogSelectGuarantee.addContent(oInputBase.createSearchField("searchCrossSellGuarantorCandidate", _oController.searchCrossSellGuarantorCandidate, _oController, "100%"));

            //seleccion de aval
            var tableFields = ["Nombre", "Fecha de Alta","Id Cliente"];
            var tableFieldVisibility = [true, false,true];
            var tableFieldDemandPopid = [false, false, true];

            oDialogSelectGuarantee.addContent(oListBase.createTable("listCrossSellGuarantorCandidate", "", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, null, _oController.setGuarantor, _oController));

            var listCsaAval = sap.ui.getCore().byId("listCrossSellGuarantorCandidate");
            listCsaAval.bindAggregation("items", {
                path: "/results/",
                factory: function(_id, _context) {
                    return _oController.bindGuarantorCandidateListTable(_context);
                }
            });
            oDialogSelectGuarantee.addButton(oActionBase.createButton("btnCrossSellCancelarAval", "Cancelar", "Emphasized", "", _oController.closeCrossSellGuarantortDialog, _oController));
        }
        return oForm;
    }
})();
