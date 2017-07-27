sap.ui.jsfragment("js.forms.insurance.Beneficiary", {

    createContent: function(oController) {
        "use strict";
        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.InputBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.ActionBase", "js.base.PopupBase");
        //Middleware de componentes SAPUI5
        var oDetailInputBase = new sap.ui.mw.InputBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oDetailDisplayBase = new sap.ui.mw.DisplayBase(),
            oForm, dataRelationship,
            oJson = new sap.ui.model.json.JSONModel({
                "InsuranceBeneficiaryIdCRM": "",
                "InsuranceBeneficiaryIdMD": "",
                "CustomerIdCRM": "",
                "LoanRequestIdCRM": "",
                "BeneficiaryType": "",
                "BeneficiaryGenderID": "1",
                "BeneficiaryRelationship": "",
                "BeneficiaryBirthday": "",
                "BeneficiaryIdMDToReplace": "",
                "CollaboratorID": "",
                "InsuranceIdCRM": "",
                "RemoveBeneficiary": false,
                "BeneficiaryName": {
                    "FirstName": "",
                    "MiddleName": "",
                    "LastName": "",
                    "SecondName": ""
                },
                "ImageSet": [{
                    "ImageIdSharepoint": "",
                    "DocumentId": "CAF",
                    "ImageBase64": "",
                    "CustomerIdCRM": "",
                    "InsuranceBeneficiaryIdMD": "",
                    "IsReceived": false,
                    "DocumentStatusId": "empty",
                    "DocumentStatusText": "Sin Captura",
                    "CustomerIdMD": "",
                    "DueDate": "0000-00-00T00:00:00",
                    "InsuranceIdMD": "",
                    "LoanRequestIdCRM": "",
                    "CollaboratorID": "",
                    "LoanRequestIdMD": ""
                }, {
                    "ImageIdSharepoint": "",
                    "DocumentId": "CAR",
                    "ImageBase64": "",
                    "CustomerIdCRM": "",
                    "InsuranceBeneficiaryIdMD": "",
                    "IsReceived": false,
                    "DocumentStatusId": "empty",
                    "DocumentStatusText": "Sin Captura",
                    "CustomerIdMD": "",
                    "DueDate": "0000-00-00T00:00:00",
                    "InsuranceIdMD": "",
                    "LoanRequestIdCRM": "",
                    "CollaboratorID": "",
                    "LoanRequestIdMD": "",
                }],
                "InsuranceIdMD": ""
            }),
            //Cargamos el catálogo de Género
            oItems = new sap.ui.core.Item({
                key: "{idCRM}",
                text: "{text}"
            }),
            oModel = oController.getView().getModel("InsuranceDetailsModel"),
            bEnable = oModel.getProperty("/results/0/isEntityInQueue") ? false : true,
            sTitle;

        //Ventana emergente para captura de información del beneficiario o el asegurado familiar
        var oDlgAsignacion = new sap.ui.mw.PopupBase().createDialog("", "", "Message", "").setModel(oJson);
        oDlgAsignacion.setContentWidth("100%").setContentHeight("100%").addStyleClass("fixPaddingFragment");
        oDlgAsignacion.addButton(oActionBase.createButton("", "Agregar", "Emphasized", "sap-icon://add", oController.addBeneficiary, oController).setEnabled(bEnable)); //[oDlgAsignacion,oController]));
        oDlgAsignacion.addButton(oActionBase.createButton("btnDocuments", "", "Default", "sap-icon://camera", oController.onDocuments, oController).setEnabled(bEnable));
        oDlgAsignacion.addButton(oActionBase.createButton("", "Cancelar", "Default", "sap-icon://sys-cancel", oController.onCancel, oDlgAsignacion));

        var sPath = sap.ui.getCore().byId("tblListBeneficiary").getSelectedContextPaths(), //.getSelectedItem().getBindingContextPath(),
            cBeneficiaryType = oModel.getProperty(sPath + "/BeneficiaryType");
        if (!cBeneficiaryType) {
            cBeneficiaryType = sap.ui.getCore().byId("slTipoAsignacion").getSelectedKey();
            oJson.setProperty("/BeneficiaryType", cBeneficiaryType);
        }
        switch (cBeneficiaryType) {
            case "00001100":
                oDlgAsignacion.setTitle("Beneficiario");
                sap.ui.getCore().byId("btnDocuments").setVisible(false); //El botón de documentos estará oculto
                break;
            case "Z0001100":
                oDlgAsignacion.setTitle("Familiar");
                sap.ui.getCore().byId("btnDocuments").setVisible(true); //El botón de documentos será mostrado
                break;
        }
        var dataInsuranceGenero = new sap.ui.model.json.JSONModel("data-map/catalogos/genero.json");


        var oTypeStr = new sap.ui.model.type.String(null);
        // var oTypeStr = new sap.ui.model.type.String();
        //Se crea formulario
        oForm = oLayoutBase.createForm("", true, 1, "");
        oForm.setLayout(sap.ui.layout.form.SimpleFormLayout.ResponsiveGridLayout);
        oForm.addContent(oDetailDisplayBase.createLabel("", "Primer Nombre*"));
        oForm.addContent(oDetailInputBase.createInputText("inputFirstName", "Text", "Ingresa el Primer Nombre", "{/BeneficiaryName/FirstName}", true, bEnable, "^(([A-Za-zÑñ]+)\\s?)*$", null).setMaxLength(26)
        // oForm.addContent(oDetailInputBase.createInputText("inputFirstName", "Text", "Ingresa el Primer Nombre", "{/BeneficiaryName/FirstName}", true, bEnable, "^[A-Za-zÑÁÉÍÓÚñáéíóú+][ [A-Za-zÑÁÉÍÓÚñáéíóú]+]*$", null).setMaxLength(26)
            .bindProperty("value", {
                path: "/BeneficiaryName/FirstName",
                type: oTypeStr
            })
        );


        oForm.addContent(oDetailDisplayBase.createLabel("", "Segundo Nombre"));
        oForm.addContent(oDetailInputBase.createInputText("inputSecondName", "Text", "Ingresa el Segundo Nombre", "{/BeneficiaryName/MiddleName}", true, bEnable, "^(([A-Za-zÑñ]+)\\s?)*$", null).setMaxLength(26)
            .bindProperty("value", {
                path: "/BeneficiaryName/MiddleName",
                type: oTypeStr
            })
        );
        oForm.addContent(oDetailDisplayBase.createLabel("", "Apellido Paterno*"));
        oForm.addContent(oDetailInputBase.createInputText("inputLastName", "Text", "Ingresa el Apellido Paterno", "{/BeneficiaryName/LastName}", true, bEnable, "^(([A-Za-zÑñ]+)\\s?)*$", null).setMaxLength(26)
            .bindProperty("value", {
                path: "/BeneficiaryName/LastName",
                type: oTypeStr
            })
        );
        oForm.addContent(oDetailDisplayBase.createLabel("", "Apellido Materno"));
        oForm.addContent(oDetailInputBase.createInputText("inputSecondLastName", "Text", "Ingresa el Apellido Materno", "{/BeneficiaryName/SecondName}", true, bEnable, "^(([A-Za-zÑñ]+)\\s?)*$", null).setMaxLength(26)
            .bindProperty("value", {
                path: "/BeneficiaryName/SecondName",
                type: oTypeStr
            })
        );
        oForm.addContent(oDetailDisplayBase.createLabel("", "Parentesco*"));
        var oValue = oModel.getProperty(sap.ui.getCore().byId("tblListBeneficiary").getSelectedContextPaths() + "/BeneficiaryRelationship");

        var mModel = new sap.ui.model.json.JSONModel("data-map/catalogos/relationships.json");
        sap.ui.getCore().setModel(mModel, "oModelRrelationship");
        var oItemSelectTemplate = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });
        oForm.addContent(new sap.m.Select("slRelationship", {
            enabled: bEnable,
            selectedKey: oValue,
            change: oController.onChangeRelationship.bind(oDlgAsignacion)
        }));
        var mySelectMenu = sap.ui.getCore().byId("slRelationship");
        mySelectMenu.setModel(sap.ui.getCore().getModel("oModelRrelationship"));
        mySelectMenu.bindAggregation("items", {
            path: "/parentescoSeguros",
            filters: [new sap.ui.model.Filter("tipo", sap.ui.model.FilterOperator.EQ, cBeneficiaryType)],
            template: oItemSelectTemplate
        });
        oForm.addContent(oDetailDisplayBase.createLabel("", "Género*"));
        var oValueGender = oModel.getProperty(sap.ui.getCore().byId("tblListBeneficiary").getSelectedContextPaths() + "/BeneficiaryGenderID");
        oForm.addContent(oDetailInputBase.createSelect("slGender", "/genero", oItems, dataInsuranceGenero, oController.onChangeGender, oDlgAsignacion).setSelectedKey(!oValueGender ? "1" : oValueGender).setEnabled(bEnable));
        oForm.addContent(oDetailDisplayBase.createLabel("", "Fecha de Nacimiento*"));
        oForm.addContent(oDetailInputBase.createDatePicker("dpBirthday", { path: '/BeneficiaryBirthday', formatter: oController.onFormatDatePicker },
            "Fecha de Nacimiento...", "dd.MM.yyyy").attachChange(oController.onChangeDatePicker, oDlgAsignacion).setEditable(bEnable));

        oDlgAsignacion.addContent(oForm);

        return oDlgAsignacion;
        

    }
});
