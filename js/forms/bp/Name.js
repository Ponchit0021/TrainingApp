(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.bp.Name");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.bp.Name', {});

    sap.ui.mw.forms.bp.Name.prototype.createForm = function(oController) {

        var oInputBase = new sap.ui.mw.InputBase();
       
        var oDisplayBase = new sap.ui.mw.DisplayBase();
        var oLayoutBase = new sap.ui.mw.LayoutBase();
        var oFileBase = new sap.ui.mw.FileBase();
        var oEventBase = new sap.ui.mw.EventBase(oController.onEditAfterSave);
        var oForm = oLayoutBase.createForm(oController.idForm + "Name", true, 1, "Nombre").destroyContent();
        var dataProducts = new sap.ui.model.json.JSONModel("data-map/catalogos/productsIdCrm.json");
        var oRolCatalog = new sap.ui.model.json.JSONModel("data-map/catalogos/rolBP.json");
        var sCurrentRol = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/RoleId");
        var bIsContactLaterEditable = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/IsContactLaterEditable");
        var oItemProducts = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{productName}"
        });
    
        var dataReasonProspect = new sap.ui.model.json.JSONModel("data-map/catalogos/motivoRechazo.json");
    

        var dataStProspect = new sap.ui.model.json.JSONModel("data-map/catalogos/prospectStatus.json");
        var oItemSelectStProspect = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });
        var oItemReasonProspect = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });
        var dateActual = moment(new Date()).format('YYYY-MM-DD');
        var dateFuture = moment(new Date()).add(3, 'month').format('YYYY-MM-DD');
        var oCurrentControl;

        oForm.addContent(oDisplayBase.createLabel("", "Primer Nombre*"));
        oCurrentControl = oInputBase.createInputText(oController.idForm +"InputFirstName", "Text", "Ingrese primer nombre...", "{BPDetailsModel>/results/0/BpName/FirstName}", true, true, "^(([A-Za-zÑñ]+)\\s?)*$", true).setMaxLength(26);
        oEventBase.addTouchEvent(oCurrentControl);
        oForm.addContent(oCurrentControl);

        oForm.addContent(oDisplayBase.createLabel("", "Segundo Nombre"));
        oCurrentControl = null;
        oCurrentControl = oInputBase.createInputText(oController.idForm +"InputMiddleName", "Text", "Ingrese segundo nombre...", "{BPDetailsModel>/results/0/BpName/MiddleName}", true, true, "^(([A-Za-zÑñ]+)\\s?)*$").setMaxLength(26);
        oEventBase.addTouchEvent(oCurrentControl);
        oForm.addContent(oCurrentControl);

        oForm.addContent(oDisplayBase.createLabel("", "Apellido Paterno*"));
        oCurrentControl = null;
        oCurrentControl = oInputBase.createInputText(oController.idForm +"InputLastName", "Text", "Ingrese Apellido Paterno...", "{BPDetailsModel>/results/0/BpName/LastName}", true, true, "^(([A-Za-zÑñ]+)\\s?)*$", true).setMaxLength(26);
        oEventBase.addTouchEvent(oCurrentControl);
        oForm.addContent(oCurrentControl);

        oForm.addContent(oDisplayBase.createLabel("", "Apellido Materno"));
        oCurrentControl = null;
        oCurrentControl = oInputBase.createInputText(oController.idForm +"InputLastSecondName", "Text", "Ingrese Apellido Materno...", "{BPDetailsModel>/results/0/BpName/SecondName}", true, true, "^(([A-Za-zÑñ]+)\\s?)*$").setMaxLength(26);
        oEventBase.addTouchEvent(oCurrentControl);
        oForm.addContent(oCurrentControl);

        if (oController.idForm !== "guarantorForm") {   
            oForm.addContent(oDisplayBase.createLabel("", "Producto*"));
            oForm.addContent(oInputBase.createSelect("selectAppProduct", "/products", oItemProducts, dataProducts, null, null, true).bindProperty("selectedKey", {
                path: "BPDetailsModel>/results/0/BpMainData/ProductId",
                type: new sap.ui.model.type.String({}, {
                    required: true
                })         
            }));
        }
            oForm.addContent(oDisplayBase.createLabel("", "Listas de Control"));
            oForm.addContent(oInputBase.createInputText("", "Text", "", "{BPDetailsModel>/results/0/BpMainData/ControlListsResult}", true, false));
            oForm.addContent(oDisplayBase.createLabel("", "Nivel de Riesgo"));
            oForm.addContent(oInputBase.createInputText("", "Text", "", "{BPDetailsModel>/results/0/BpMainData/RiskLevel}", true, false));
        


        oForm.addContent(oDisplayBase.createLabel("", "Id Oficina de Servicio"));
        oForm.addContent(oInputBase.createInputText("", "Number", "", "{BPDetailsModel>/results/0/BpMainData/ServiceOfficeID}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Oficina de Servicio"));
        oForm.addContent(oInputBase.createInputText("", "Text", "", "{BPDetailsModel>/results/0/BpMainData/ServiceOfficeName}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Fecha de Alta"));
        oForm.addContent(oInputBase.createDatePicker("", "{BPDetailsModel>/results/0/BpMainData/RegistrationDate}", "", "dd.MM.yyyy").setEditable(false));

        oForm.addContent(oDisplayBase.createLabel("", "Rol"));
        if (oController.idForm !== "guarantorForm") {
            oForm.addContent(oInputBase.createInputText("txtNpRol", "Text", "", "", true, false));
            oRolCatalog.attachRequestCompleted(function(oEvt) {
                for (var i = 0; i < oEvt.getSource().getProperty("/rolBP").length; i++) {
                    if (oRolCatalog.getProperty("/rolBP/" + i + "/idCRM") === sCurrentRol) {
                        sap.ui.getCore().byId("txtNpRol").setValue(oEvt.getSource().getProperty("/rolBP/" + i + "/text"));
                    }
                }
            });
            oForm.addContent(oDisplayBase.createLabel("", "Estatus Prospecto"));
            oForm.addContent(oInputBase.createSelect("selectAppStProspect", null, null, null, null, null));
            oFileBase.loadFile("data-map/catalogos/prospectStatus.json").then(this.createSelectStprospect.bind(this, oController));
            oForm.addContent(oDisplayBase.createLabel("lbAppReason", "Motivo"));
            oForm.addContent(oInputBase.createSelect("selectAppReason", "/Interesado", oItemReasonProspect, dataReasonProspect, oController.onChangeReason, oController).setVisible(false).bindProperty("selectedKey", "BPDetailsModel>/results/0/BpMainData/StatusReasonId"));
            oForm.addContent(oDisplayBase.createLabel("appDatePostCont", "Fecha"));
            oForm.addContent(oInputBase.createDatePickerRange("pickerAppContact", dateActual, dateFuture, "dd.MM.yyyy", "dd.MM.yyyy").setVisible(false).setEditable(bIsContactLaterEditable ? false : true).bindProperty("dateValue", "BPDetailsModel>/results/0/BpMainData/ContactLaterDate"));
            oForm.addContent(oDisplayBase.createLabel("appTimePostCont", "Hora"));
            oForm.addContent(oInputBase.createDateTimeInput("appTimeContect", "", "", "HH:mm", "Time", oController.onChangeTimeContact, oController).setVisible(false).setEditable(bIsContactLaterEditable ? false : true).bindProperty("dateValue", { path: "BPDetailsModel>/results/0/BpMainData/ContactLaterTime", formatter: oController.onFormatterTime }));
            oForm.addContent(oDisplayBase.createLabel("", "Origen"));
            oForm.addContent(oInputBase.createInputText("txtAppOrigin", "Text", "Promocion directa", "Promocion directa", true, false));
            oForm.addContent(oDisplayBase.createLabel("", "ID Lead"));
            oForm.addContent(oInputBase.createInputText("txtAppIdLead", "Text", "", "{BPDetailsModel>/results/0/BpMainData/LeadIdCRM}", true, false));
            oForm.addContent(oDisplayBase.createLabel("", "ID BP"));
            oForm.addContent(oInputBase.createInputText("txtAppIdBP", "Number", "", "{BPDetailsModel>/results/0/CustomerIdCRM}", true, false));

        } else {
            oForm.addContent(oInputBase.createInputText("", "Text", "Aval", "", true, false));
            oForm.addContent(oDisplayBase.createLabel("", "ID Aval"));
            oForm.addContent(oInputBase.createInputText("", "Number", "", "{BPDetailsModel>/results/0/CustomerIdCRM}", true, false));
        }
        sap.ui.getCore().AppContext.loader.close();

               
        //Setting del producto conciderando los productos hijos de venta cruzada.       
        if (oController.idForm !== "guarantorForm") {   
            var pdct = oController.getView().getModel("BPDetailsModel").getProperty("/results/0/BpMainData/ProductId"); 
            if(pdct!==""){
                oController.onProductSelected().then(function(dataProducts){
                    var oProductSelct = sap.ui.getCore().byId("selectAppProduct");
                    oProductSelct.setModel(dataProducts);
                    oProductSelct.setSelectedKey(pdct);                         
                }.bind(this));
            }
        }
        
        return oForm;
    };

    sap.ui.mw.forms.bp.Name.prototype.createSelectStprospect = function(oController, oResults) {
        var selectAppStProspect = sap.ui.getCore().byId("selectAppStProspect");
        var oItemSelectStProspect = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });
        selectAppStProspect.bindItems({
            path: "/status",
            template: oItemSelectStProspect,
            change: [null, null]
        }).setModel(oResults).
        bindProperty("selectedKey", { path: "BPDetailsModel>/results/0/BpMainData/StatusId" }).
        attachChange(oController.onChangeStProspect, oController).
        fireChange(oController.onChangeStProspect, oController);


    };

})();
