sap.ui.jsview("originacion.InsuranceDetails", {

    getControllerName: function() {
        return "originacion.InsuranceDetails";
    },
    createContent: function(oController) {

        //Declaramos la variable que se conectan a los JSON
        var dataInsurancePayment = new sap.ui.model.json.JSONModel("data-map/catalogos/tipoPagoSeguro.json");
        var dataInsuranceModal = new sap.ui.model.json.JSONModel("data-map/catalogos/modalidad.json");
        var dataInsuranceTipoBenfeciario = new sap.ui.model.json.JSONModel("data-map/catalogos/tipoBeneficiario.json");

        var oItems = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });

        //Se agregan Middleware de componentes SAPUI5
        jQuery.sap.require("js.base.InputBase",
            "js.base.ActionBase",
            "js.base.DisplayBase",
            "js.base.LayoutBase",
            "js.base.PopupBase",
            "js.base.ListBase",
            "js.base.ContainerBase");

        var oContainerBase = new sap.ui.mw.ContainerBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oInputBase = new sap.ui.mw.InputBase(),
            oPopupBase = new sap.ui.mw.PopupBase();


        var iconTabFilters = [oContainerBase.createIconTabFilter("itfInsurance1", "itfInsurance1", "sap-icon://activity-assigned-to-goal", ""),
            oContainerBase.createIconTabFilter("itfInsurance2", "itfInsurance2", "sap-icon://group", "")
        ];
        var iconTabBar = oContainerBase.createIconTabBar("itbInsuranceApplication", iconTabFilters, oController.selectIconTabBarFilter, oController);

        /*
         *Pestaña Información de seguro
         *
         */
        var oForm = oLayoutBase.createForm("fInsuranceInfo", true, 1, "Cliente");
        oForm.addContent(oDisplayBase.createLabel("", "Número de Cliente"));
        oForm.addContent(
            oInputBase.createInputText("txtNumeroCte", "Text", "", "{CustomerDetailsModel>/results/0/CustomerIdCRM}", true, false)
        );
        oForm.addContent(oDisplayBase.createLabel("", "Nombre de Cliente"));
        oForm.addContent(oInputBase.createInputText("txtInsAppName", "Text", "", "{CustomerDetailsModel>/results/0/Customer/BpName/FirstName} {CustomerDetailsModel>/results/0/Customer/BpName/SecondName} {CustomerDetailsModel>/results/0/Customer/BpName/MiddleName} {CustomerDetailsModel>/results/0/Customer/BpName/LastName}", true, false));
        //Generar casilla de Verificación para indicar si se capturará un seguro opcional
        oForm.addContent(oDisplayBase.createTitle("tltInsurance", "Captura de Seguros"));
        oForm.addContent(oInputBase.createCheckBox("chkInsuranceOpt", "Capturar Seguro Voluntario", "{InsuranceDetailsModel>/results/0/InsuranceOptional}",{path:"InsuranceDetailsModel>/results/0/isEntityInQueue",formatter:oController.onFormatterViewEnabled}, oController.optionalInsurance, oController));
        //Generar controles para la Fecha de Inicio de Vigencia
        oForm.addContent(oDisplayBase.createTitle("", "Datos Generales del Seguro"));
        oForm.addContent(oDisplayBase.createLabel("", "Fecha de Inicio de Vigencia"));
        oForm.addContent(oInputBase.createDatePicker("dpInsStartDate",{path:'CustomerDetailsModel>/results/0/LoanRequest/GeneralLoanRequestData/StartDate',formatter:oController.onFormatDatePicker},
        "Inicio Vigencia", "dd.MM.yyyy").setEditable(false));
        //Generación de controles para el Tipo de Pago del Seguro
        oForm.addContent(oDisplayBase.createLabel("", "Forma de Pago"));
        oForm.addContent(oInputBase.createSelect("selectInsPayType", "/tipoPagoSeguro", oItems, dataInsurancePayment, oController.changeKindOfPayment, oController));
        sap.ui.getCore().byId("selectInsPayType").setEnabled(false).setSelectedKey("{InsuranceDetailsModel>/results/0/InsurancePaymentID}");
        //Se generan los controles para el Plazo
        oForm.addContent(oDisplayBase.createLabel("", "Plazo"));
        oForm.addContent(oInputBase.createInputText("txtInsDuration", "Text", "","{CustomerDetailsModel>/results/0/LoanRequest/GeneralLoanRequestData/Term}", true, false));
        //Generación de controles para la Modalidad del Seguro
        oForm.addContent(oDisplayBase.createLabel("", "Modalidad"));
        var lstModalidad = oInputBase.createSelect("slInsModalidad", "/modalidad", oItems, dataInsuranceModal, oController.changeInsuranceModal, oController);
        lstModalidad.bindProperty("selectedKey","InsuranceDetailsModel>/results/0/InsuranceModalityID").bindProperty(
          "enabled",{
            parts:[
              "InsuranceDetailsModel>/results/0/isEntityInQueue",
              "InsuranceDetailsModel>/results/0/InsuranceOptional"
            ],
            formatter: oController.onFormatterViewEnabled,
            useRawValues : true
          });
        oForm.addContent(lstModalidad);

        //Botones de la pantalla de detalle
        var detailButtons = [
            oActionBase.createButton("btnGuardar", "Guardar", "Emphasized", "sap-icon://save", oController.saveInsurance, oController
              ).bindProperty("enabled",{path:"InsuranceDetailsModel>/results/0/isEntityInQueue",formatter:oController.onFormatterViewEnabled}),
            // oActionBase.createButton("btnFirma", "", "Default", "sap-icon://signature", oController.signatureInsurance, oController),
            oActionBase.createButton("btnEnviar", "", "Emphasized", "sap-icon://synchronize", oController.sendToCore, oController
              ).bindProperty("enabled",{path:"InsuranceDetailsModel>/results/0/isEntityInQueue",formatter:oController.onFormatterButtonSyncEnabled})
        ];
        //Se crea la barra de botones para la pantalla principal
        var oBarInsurance = oContainerBase.createBar("barIsurance", null, detailButtons, null);

        /*
         *Pestaña asignación beneficiarios/asegurados
         *
         */
        //Pantalla asignación beneficiarios
        var oFormAsignacion = new sap.ui.mw.LayoutBase().createFlexBox();
        oFormAsignacion.addItem(oInputBase.createSelect(
            "slTipoAsignacion", "/tipos", oItems, dataInsuranceTipoBenfeciario, oController.changeInsuranceTipoBen, oController
        ).setLayoutData(new sap.m.FlexItemData().setGrowFactor(2)).setWidth("100%"
        ).bindProperty(
          "enabled",{
            parts:[
              "InsuranceDetailsModel>/results/0/isEntityInQueue",
              "InsuranceDetailsModel>/results/0/InsuranceModalityID"
            ],
            formatter: oController.onFormatterSelectEnabled,
            useRawValues : true
          }));
        oFormAsignacion.addItem(oActionBase.createButton("btnAdd", "", "Emphasized", "sap-icon://add", oController.openFormBeneficiary, oController
      ).bindProperty("enabled",{path:"InsuranceDetailsModel>/results/0/isEntityInQueue",formatter: oController.onFormatterButtonAddEnabled}));

        var oListBeneficiary =  new sap.m.List("tblListBeneficiary",{
              mode: sap.m.ListMode.SingleSelectMaster,
              selectionChange: [oController.openFormBeneficiary, oController]
        });
        oListBeneficiary.bindAggregation("items",{
              path: "InsuranceDetailsModel>/results/0/InsuranceBeneficiarySet/results",
              filters: [new sap.ui.model.Filter("RemoveBeneficiary", sap.ui.model.FilterOperator.NE, true)],
              factory: oController.onFactoryTabExecuted.bind(oController)
        });

        //Agrega formulario a cada pestaña (tab)
        sap.ui.getCore().byId("itfInsurance1").addContent(oForm);
        sap.ui.getCore().byId("itfInsurance2").addContent(oLayoutBase.createForm("fInsuranceAsig", true, 1, "Personas relacionadas")).addContent(oFormAsignacion).addContent(oListBeneficiary);
        //dialogos
        // oPopupBase.createDialog("appInsSave", "Confirmación", "Message", "");
        // oPopupBase.createDialog("appInsSendCore", "Confirmación", "Message", "");
        oPopupBase.createDialog("appInsDialogSignatureCapture", "Firma", "Message", "");

        var oPage = oContainerBase.createPage("oPageDetailInsurance", "Seguros", true, true, true, true, oController.onMessageWarningDialogPress, oController, oBarInsurance);
        oPage.addContent(iconTabBar);
        return oPage;
    }

});
