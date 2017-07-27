(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.individual.Guarantee");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.SimpleTypes.ListaControlBase", "js.SimpleTypes.ListaControlBaseAval", "js.SimpleTypes.LevelRiskBase");

    sap.ui.base.Object.extend('sap.ui.mw.forms.individual.Guarantee', {});
    sap.ui.mw.forms.individual.Guarantee.prototype.createGuaranteeForm = function(_idForm, oController) {
        //Middleware de componentes SAPUI5
        var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oPopupBase, oListBase, oLoanRequestModel;
        var oFloatType = new sap.ui.model.type.Float({
            "groupingEnabled": false,
            "decimalSeparator": "."
        });
        //Variables para formulario
        var oForm, oDialogSelectGuarantee, oItemGuarantee, oAvalList, oInputAddress, oInputGuaranteeName, oGuaranteeModel, semaphoreIcon;

        var sFirstName, sSecondName, sLastName, sMiddleName, sFullName;
        var street, outsideNumber, interiorNumber, suburb, city, postalCode, townId, stateId, countryId, sFullAddress;
        var oTxtNciListaDeContorlAval, oListaControl, oLevelRisk, oTxtLevelRisk;
        var bAvalExists;

        bAvalExists = false;
        sFullAddress = "";

        //Dialog
        oGuaranteeModel = oController.getView().getModel("guaranteeModel");
        oLoanRequestModel = oController.getView().getModel("oLoanRequestModel");


        //Cargamos el catálogo de Tipos de Pagos de Seguros
        oItemGuarantee = new sap.m.StandardListItem({
            title: "{}",
            description: "{BPIdCRM}",
            info: "{registrationDate}"
        });
        //Se declaran objetos de Middleware de componentes SAPUI5
        oInputBase = new sap.ui.mw.InputBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        oPopupBase = new sap.ui.mw.PopupBase();
        oListBase = new sap.ui.mw.ListBase();
        oLevelRisk = new sap.ui.model.SimpleType.LevelRisk();
        oListaControl = new sap.ui.model.SimpleType.ListaControlAval();


        //Se crea formulario
        oForm = oLayoutBase.createForm(_idForm, true, 1, "Datos del Aval");
        
        oForm.addContent(oActionBase.createButton("btnNciAsignarAval", "Asignar Aval", "Emphasized", "sap-icon://add", oController.onShowGuarantees, oController));
        oForm.addContent(oDisplayBase.createLabel("", "ID Aval*"));
        oForm.addContent(oInputBase.createInputText("txtNciIdAval", "Number", "00000000000", "{oLoanRequestModel>/LinkGuarantorSet/results/0/CustomerIdCRM}", true, false).attachChange(oController.onChanging()));

        oForm.addContent(oDisplayBase.createLabel("", "Nombre del Aval*"));
        oInputGuaranteeName = oInputBase.createInputText(
            "txtNciNombreDelAval", "Text", "Nombre del Aval",
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/BpName/LastName}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/BpName/SecondName}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/BpName/FirstName}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/BpName/MiddleName}",
            true,
            false);
        sFirstName = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/FirstName");
        sSecondName = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/SecondName");
        sLastName = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/LastName");
        sMiddleName = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/MiddleName");
        if (sLastName) {
            sFullName = sLastName;
        }
        if (sSecondName) {
            sFullName = sFullName + " " + sSecondName;
        }
        if (sFirstName) {
            sFullName = sFullName + " " + sFirstName;
        }
        if (sMiddleName) {
            sFullName = sFullName + " " + sMiddleName;
        }
        
        oForm.addContent(oInputGuaranteeName);
        if (oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/BpName/FirstName") === "") {

            bAvalExists = false;

        } else {
            bAvalExists = true;
        }

        oForm.addContent(oDisplayBase.createLabel("", "Ingresos Mensuales"));
        var oInMensAval = oInputBase.createInputText("txtNciIngresosMensuales", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(13).setEnabled(bAvalExists);
        oInMensAval.bindProperty("value", {
            path: "oLoanRequestModel>/LinkGuarantorSet/results/0/TotalIncomeAmountGuarantee",
            type: oFloatType
        });
        oForm.addContent(oInMensAval);

        oForm.addContent(oDisplayBase.createLabel("", "Gastos Mensuales"));
        var oGaMenAval = oInputBase.createInputText("txtNciGastosMensuales", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(13).setEnabled(bAvalExists);
        oGaMenAval.bindProperty("value", {
            path: "oLoanRequestModel>/LinkGuarantorSet/results/0/TotalOutcomeAmountGuarantee",
            type: oFloatType
        });
        oForm.addContent(oGaMenAval);

        oForm.addContent(oDisplayBase.createLabel("", "Capacidad de Pago del Aval"));
        var oCapPagAval = oInputBase.createInputText("txtNciCapacidadDePagoDelAval", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,15})(\.[0-9]{1,2})?$").setMaxLength(13).setEnabled(bAvalExists);
        oCapPagAval.bindProperty("value", {
            path: "oLoanRequestModel>/LinkGuarantorSet/results/0/GuarantorPaymentCapacity",
            type: oFloatType
        });
        oForm.addContent(oCapPagAval);

        oForm.addContent(oDisplayBase.createLabel("", "Teléfono"));
        oForm.addContent(oInputBase.createInputText("txtNciTelefono", "Text", "", "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/PhoneSet/results/0/PhoneNumber}", true, false).attachChange(oController.onChanging()));

        oForm.addContent(oDisplayBase.createLabel("", "Dirección"));
        oInputAddress = oInputBase.createInputText(
            "txtNciDireccion",
            "Text",
            "Dirección Completa",
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/Street}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/OutsideNumber}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/InteriorNumber}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/Suburb}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/PostalCode}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/TownId}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/StateId}" +
            " " +
            "{oLoanRequestModel>/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/CountryId}",
            true,
            false
        );
        street = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/Street");
        outsideNumber = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/OutsideNumber");
        interiorNumber = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/InteriorNumber");
        suburb = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/Suburb");
        city = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/City");
        postalCode = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/PostalCode");
        townId = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/TownId");
        stateId = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/StateId");
        countryId = oLoanRequestModel.getProperty("/LinkGuarantorSet/results/0/Guarantor/AddressSet/results/0/Place/CountryId");
        if (street) {
            sFullAddress = street;
        }
        if (outsideNumber) {
            sFullAddress = sFullAddress + " " + outsideNumber;
        }
        if (interiorNumber) {
            sFullAddress = sFullAddress + " " + interiorNumber;
        }
        if (suburb) {
            sFullAddress = sFullAddress + " " + suburb;
        }
        if (postalCode) {
            sFullAddress = sFullAddress + " " + postalCode;
        }
        if (townId) {
            sFullAddress = sFullAddress + " " + townId;
        }
        if (stateId) {
            sFullAddress = sFullAddress + " " + stateId;
        }
        if (countryId) {
            sFullAddress = sFullAddress + " " + countryId;
        }
       
        oForm.addContent(oInputAddress);

        oTxtNciListaDeContorlAval = oInputBase.createInputText("txtNciListaDeContorlAval", "Text", "", "", true, false);
        oTxtNciListaDeContorlAval.bindProperty("value", {
            path: "oLoanRequestModel>/LinkGuarantorSet/results/0/GeneralLoanData/ControlListsResult",
            type: oListaControl
        });
        oForm.addContent(oDisplayBase.createLabel("", "Listas de Control"));
        oForm.addContent(oTxtNciListaDeContorlAval);

        oTxtLevelRisk = oInputBase.createInputText("txtNciNivelDeRiesgoAval", "Text", "", "", true, false);
        oTxtLevelRisk.bindProperty("value", {
            path: "oLoanRequestModel>/LinkGuarantorSet/results/0/GeneralLoanData/RiskLevel",
            type: oLevelRisk
        });
        oForm.addContent(oDisplayBase.createLabel("", "Nivel de riesgo"));
        oForm.addContent(oTxtLevelRisk);

        semaphoreIcon = oDisplayBase.createIcon("iconSemaforoGuarantee", "sap-icon://status-error", "2.0rem");
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(semaphoreIcon);


        //////// Create popup - Seleccionar Aval
        oDialogSelectGuarantee = sap.ui.getCore().byId("popupNciSeleccionarAval");

        if (!oDialogSelectGuarantee) {
            oDialogSelectGuarantee = oPopupBase.createDialog("popupNciSeleccionarAval", "Seleccionar Aval", sap.m.DialogType.Standard);
            oDialogSelectGuarantee.addContent(oInputBase.createSearchField("searchNciBusquedaAval", oController.searchAvalTxt, oController, "100%"));

            var tableFields = ["Nombre", "Fecha de Alta", "Id Cliente"];
            var tableFieldVisibility = [true, true, true];
            var tableFieldDemandPopid = [false, false, true];

            oDialogSelectGuarantee.addContent(oListBase.createTable("listNciAval", "", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, null, oController.setAval, oController));

            var listNciAval = sap.ui.getCore().byId("listNciAval");


            listNciAval.setModel(oGuaranteeModel);
            listNciAval.bindAggregation("items", {
                path: "/results/",
                factory: function(_id, _context) {
                    return oController.onLoadTableAval(_context);
                }
            });

            oDialogSelectGuarantee.addButton(oActionBase.createButton("btnNciCancelarAval", "Cancelar", "Emphasized", "", oController.onShowGuaranteesClose, oController));

        }

        return oForm;
    };

})();
