(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.mw.forms.bp.Complementary");
  jQuery.sap.require("sap.ui.base.Object");
  jQuery.sap.require("js.base.InputBase");
  jQuery.sap.require("js.base.DisplayBase");
  jQuery.sap.require("js.base.LayoutBase");
  jQuery.sap.require("js.SimpleTypes.BasicChildrenBase");
  sap.ui.base.Object.extend('sap.ui.mw.forms.bp.Complementary', {});
  sap.ui.mw.forms.bp.Complementary.prototype.createForm = function(
      oController) {
    var AppEmployment =
        new sap.ui.model.json.JSONModel("data-map/catalogos/occupation.json");
    var AppTimeActivity =
        new sap.ui.model.json.JSONModel("data-map/catalogos/antiguedad.json");
    var AppHowActivity =
        new sap.ui.model.json.JSONModel("data-map/catalogos/realizaAE.json");
    var AppInputEconomic =
        new sap.ui.model.json.JSONModel("data-map/catalogos/inputHome.json");
    var AppOtherInput =
        new sap.ui.model.json.JSONModel("data-map/catalogos/otherIngess.json");
    var AppBussinesTimeInput =
        new sap.ui.model.json.JSONModel("data-map/catalogos/timeBusiness.json");
    var AppLocal =
        new sap.ui.model.json.JSONModel("data-map/catalogos/local.json");
    var bIndivWBusiness =
        oController.getView()
            .getModel("BPDetailsModel")
            .getProperty("/results/0/BpComplementaryData/IsIndivWBusiness");
    var oTypeBasicChildren = new sap.ui.model.SimpleType.BasicChildren();
    var oItemAppSelect =
        new sap.ui.core.Item({key : "{idCRM}", text : "{text}"});
    var oInputBase = new sap.ui.mw.InputBase();
    var oDisplayBase = new sap.ui.mw.DisplayBase();
    var oLayoutBase = new sap.ui.mw.LayoutBase();
    var oTypeInt = new sap.ui.model.type.Integer();
    var oFloatType = new sap.ui.model.type.Float(
        {"groupingEnabled" : false, "decimalSeparator" : "."});

    var oRadioButtons = [
      oInputBase.createRadioButtonForGroupName("", "Si"),
      oInputBase.createRadioButtonForGroupName("", "No")
    ];
    var oForm = oLayoutBase.createForm(oController.idForm + "Complementary",
                                       true, 1, "Complementarios")
                    .destroyContent();
    oForm.addContent(oDisplayBase.createLabel(
        "", "¿Es persona física con actividad empresarial?"));
    oForm.addContent(
        oInputBase.createRadioButtonGroup(oController.idForm + "GroupOption",
                                          oRadioButtons, 2,
                                          bIndivWBusiness ? 0 : 1)
            .attachSelect(oController.onSelectedOption, oController));
    oForm.addContent(oDisplayBase.createLabel("", "Homoclave*"));
    oForm.addContent(
        oInputBase
            .createInputText(
                oController.idForm + "txtAppKeyRFC", "Text",
                "Ingrese homoclave...",
                "{BPDetailsModel>/results/0/BpComplementaryData/Homoclave}",
                true, true, "^[A-Za-z0-9]{3}$")
            .setMaxLength(3)
            .setVisible(bIndivWBusiness)); // txtAppKeyRFC
    if (oController.idForm !== "guarantorForm") {
      oForm.addContent(oDisplayBase.createLabel("", "Número FIEL*"));
      oForm.addContent(
          oInputBase
              .createInputText(
                  oController.idForm + "txtAppFiel", "Number",
                  "Ingrese número fiel...",
                  "{BPDetailsModel>/results/0/BpComplementaryData/FielNumber}",
                  true, true, "^[0-9]*$")
              .setMaxLength(20)
              .setVisible(bIndivWBusiness)); // txtAppNumFIEL
    }
    oForm.addContent(oDisplayBase.createLabel(
        oController.idForm + "complementCurp", "CURP"));
    oForm.addContent(
        oInputBase
            .createInputText(
                "", "Text", "Ingrese CURP...", "", true, true,
                "^[A-Za-z]{1}[A-Za-z]{1}[A-Za-z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HMhm]{1}(AS|as|BC|bc|BS|bs|CC|cc|CS|cs|CH|ch|CL|cl|CM|cm|DF|df|DG|dg|GT|gt|GR|gr|HG|hg|JC|jc|MC|mc|MN|mn|MS|ms|NT|nt|NL|nl|OC|oc|PL|pl|QT|qt|QR|qr|SP|sp|SL|sl|SR|sr|TC|tc|TS|ts|TL|tl|VZ|vz|YN|yn|ZS|zs|NE|ne)[B-DF-HJ-NP-TV-Z|b-df-hj-np-tv-z]{3}[0-9A-Za-z]{1}[0-9]{1}$")
            .setMaxLength(18)
            .bindProperty("value", {
              path : "BPDetailsModel>/results/0/BpComplementaryData/Curp",
              type : new sap.ui.model.type.String(
                  {}, {required : bIndivWBusiness})
            })); // txtAppCURP
    oForm.addContent(oDisplayBase.createLabel("", "Dependientes económicos"));
    var oTxtDependientes =
        oInputBase.createInputText("", "Number",
                                   "Ingrese dependientes económicos...", "",
                                   true, true, "^[0-9]{1,2}$")
            .setMaxLength(2)
            .bindProperty("value", {
              path : "BPDetailsModel>/results/0/BpComplementaryData/Dependents",
              type : new sap.ui.model.type.String({}, {required : false})
            });
    oForm.addContent(oTxtDependientes);
    // oForm.addContent(oInputBase.createInputText("", "Number", "Ingrese
    // dependientes
    // económicos...","{BPDetailsModel>/results/0/BpComplementaryData/Dependents}",true,true,"^[0-9]+$").setMaxLength(2));
    oForm.addContent(oDisplayBase.createLabel("", "Ocupación*"));
    oForm.addContent(
        oInputBase.createSelect("", "/ocupacion", oItemAppSelect, AppEmployment,
                                null, null)
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpComplementaryData/JobId",
              type : new sap.ui.model.type.String(
                  {}, {required : true})
            })); // selectAppEmployment
    oForm.addContent(oDisplayBase.createLabel("", "Correo electrónico"));
    oForm.addContent(
        oInputBase
            .createInputText(
                "", "Email", "INGRESE CORREO ELECTRONICO...",
                "{BPDetailsModel>/results/0/BpComplementaryData/Email}", true,
                true,
                "^$|^[_a-z0-9-]+(\\.[_a-z0-9-]+)*@[a-z0-9-]+(\\.[a-z0-9-]+)*(\\.[a-z]{2,3})$",false)
            .setMaxLength(60)); // txtAppEmail
    oForm.addContent(oDisplayBase.createTitle("", "Actividad Económica"));
    oForm.addContent(oDisplayBase.createLabel(
        "", "¿Cuánto tiempo tiene realizando la actividad?"));
    oForm.addContent(
        oInputBase.createSelect("", "/antiguedad", oItemAppSelect,
                                AppTimeActivity, null, null)
            .bindProperty("selectedKey", {
              path :
                  "BPDetailsModel>/results/0/BpComplementaryData/TimeInTheActivityId",
              type : new sap.ui.model.type.String(
                  {}, {required : false})
            })); // selectAppTimeActivity
    oForm.addContent(
        oDisplayBase.createLabel("", "¿Cómo realiza la actividad económica?"));
    oForm.addContent(
        oInputBase.createSelect("", "/realizaAE", oItemAppSelect,
                                AppHowActivity, null, null)
            .bindProperty("selectedKey", {
              path :
                  "BPDetailsModel>/results/0/BpComplementaryData/HowActivityId",
              type : new sap.ui.model.type.String(
                  {}, {required : false})
            })); 
    oForm.addContent(oDisplayBase.createLabel("", ""));
    oForm.addContent(
        oDisplayBase
            .createLabelHTML(
                "", "",
                "¿Cuál es la aportación del negocio en el ingreso del hogar?")
            .addStyleClass("sapLabelWrap"));
    oForm.addContent(oDisplayBase.createLabel("", ""));
    oForm.addContent(
        oInputBase.createSelect("", "/aporta", oItemAppSelect, AppInputEconomic,
                                null, null)
            .bindProperty("selectedKey", {
              path :
                  "BPDetailsModel>/results/0/BpComplementaryData/HowMuchBusinessId"
            })); 
    oForm.addContent(oDisplayBase.createLabel("", "Otra fuente de ingresos"));
    oForm.addContent(
        oInputBase.createSelect("", "/ingreso", oItemAppSelect, AppOtherInput,
                                null, null)
            .bindProperty("selectedKey", {
              path :
                  "BPDetailsModel>/results/0/BpComplementaryData/OtherSourceId",
              type: new sap.ui.model.type.String({}, {required : false})
            })); 
    oForm.addContent(
        oDisplayBase.createLabel("", "Tiempo en el Negocio Actual"));
    oForm.addContent(
        oInputBase.createSelect("", "/antiguedad", oItemAppSelect,
                                AppBussinesTimeInput, null, null)
            .bindProperty("selectedKey", {
              path :
                  "BPDetailsModel>/results/0/BpComplementaryData/TimeInTheBusiness"
            })); 
    oForm.addContent(oDisplayBase.createLabel("", "¿El local es?*"));
    oForm.addContent(
        oInputBase.createSelect("", "/tipoLocal", oItemAppSelect, AppLocal,
                                null, null)
            .bindProperty("selectedKey", {
              path :
                  "BPDetailsModel>/results/0/BpComplementaryData/ShopFromWhoId"
            })); 
       return oForm;
  };

})();
