(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.mw.forms.bp.Basic");
  jQuery.sap.require("sap.ui.base.Object");
  jQuery.sap.require("js.base.InputBase");
  jQuery.sap.require("js.base.ActionBase");
  jQuery.sap.require("js.base.DisplayBase");
  jQuery.sap.require("js.base.LayoutBase");
  jQuery.sap.require("js.base.PopupBase");
  jQuery.sap.require("js.base.ListBase");
  jQuery.sap.require("js.base.ContainerBase");
  jQuery.sap.require("js.SimpleTypes.EconomicActivityBase");
  jQuery.sap.require("js.SimpleTypes.BasicChildrenBase");

  sap.ui.base.Object.extend('sap.ui.mw.forms.bp.Basic', {});
  sap.ui.mw.forms.bp.Basic.prototype.createForm = function(oController) {
    var oComboItem = new sap.ui.core.Item({key : "{idCRM}", text : "{text}"});
    var oItemAppRelation = new sap.ui.core.Item(
        {key : "{idCRM}", text : "{text}", familiar : "{familiar}"});
    var oFloatType = new sap.ui.model.type.Float(
        {"groupingEnabled" : false, "decimalSeparator" : "."});
    var oTypeInt = new sap.ui.model.type.Integer();
    var oTypeEconomicActivityID =
        new sap.ui.model.SimpleType.EconomicActivityID();
    var oTypeBasicChildren = new sap.ui.model.SimpleType.BasicChildren();

    var dataStatusIndustry =
        new sap.ui.model.json.JSONModel("data-map/catalogos/industry.json");
    var dataGenre =
        new sap.ui.model.json.JSONModel("data-map/catalogos/genero.json");
    var AppCountry =
        new sap.ui.model.json.JSONModel("data-map/catalogos/pais.json");
    AppCountry.setSizeLimit(300);
    var AppEntityBorn =
        new sap.ui.model.json.JSONModel("data-map/catalogos/entidadNac.json");
    var AppNationality =
        new sap.ui.model.json.JSONModel("data-map/catalogos/nationality.json");
    var AppMaritalStatus =
        new sap.ui.model.json.JSONModel("data-map/catalogos/civilStatus.json");
    var AppLevelSchool =
        new sap.ui.model.json.JSONModel("data-map/catalogos/levelSchool.json");
    var AppTypeHouse =
        new sap.ui.model.json.JSONModel("data-map/catalogos/livingPlace.json");
    var AppTypeCommerce =
        new sap.ui.model.json.JSONModel("data-map/catalogos/localType.json");
    var TypeBussines =
        new sap.ui.model.json.JSONModel("data-map/catalogos/rolAE.json");
    var AppRelation = new sap.ui.model.json.JSONModel(
        "data-map/catalogos/parentescoPEP.json");
    var oInputBase = new sap.ui.mw.InputBase();
    var oActionBase = new sap.ui.mw.ActionBase();
    var oDisplayBase = new sap.ui.mw.DisplayBase();
    var oLayoutBase = new sap.ui.mw.LayoutBase();
    var oForm =
        oLayoutBase.createForm(oController.idForm + "Basic", true, 1, "Básicos")
            .destroyContent();

    var activityId =
        oController.getView()
            .getModel("BPDetailsModel")
            .getProperty("/results/0/BpBasicData/EconomicActivityId");

    var aActividadEconomicaForm = [];
    aActividadEconomicaForm.push(
        oDisplayBase.createLabel("", "Clave de actividad económica*"));
    // aActividadEconomicaForm.push(oInputBase.createInputText("", "Text",
    // "0000000", "{BPDetailsModel>/results/0/BpBasicData/EconomicActivityId}",
    // true, true, "^[0-9]{7}$").setMaxLength(7)); //txtAppKeyActivity
    aActividadEconomicaForm.push(
        oInputBase.createInputText("", "Number", "0000000", "", true, true,
                                   "^[0-9]{7}$")
            .setMaxLength(7)
            .bindProperty("value", {
              path : "BPDetailsModel>/results/0/BpBasicData/EconomicActivityId",
              type : oTypeEconomicActivityID
            }));
    aActividadEconomicaForm.push(oActionBase.createButton(
        oController.idForm + "btnEconomicActivity", "Buscar", "Default",
        "sap-icon://search", oController.searchActEconomic, oController));
    aActividadEconomicaForm.push(
        oDisplayBase.createLabel("", "Actividad económica*"));
    aActividadEconomicaForm.push(
        oInputBase.createTextArea("", null, null, null, 70)
            .setEnabled(false)
            .bindProperty("value", {
              path :
                  "BPDetailsModel>/results/0/BpBasicData/DescEconomicActivity",
              type : new sap.ui.model.type.String({}, {required : false})
            }));
    aActividadEconomicaForm.push(oDisplayBase.createLabel("", ""));
    aActividadEconomicaForm.push(oActionBase.createButton(
        "", "Catálogo Actividad Económica", "Default", "sap-icon://list",
        oController.pickEconomicActivity, oController));

    if (activityId !== undefined && activityId !== "") {
      sap.ui.getCore()
          .byId(oController.idForm + "btnEconomicActivity")
          .firePress();
    }

    oForm.addContent(oDisplayBase.createLabel("", "Género*"));
    oForm.addContent(
        oInputBase.createSelect("", "/genero", oComboItem, dataGenre, null,
                                null)
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpBasicData/GenderId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));

    oForm.addContent(oDisplayBase.createLabel("", "Fecha de nacimiento*"));
    oForm.addContent(oInputBase.createDatePicker(
         oController.idForm+"BirthdDate", "{BPDetailsModel>/results/0/BpBasicData/BirthdDate}", "",
        "dd.MM.yyyy",true, true));

    oForm.addContent(oDisplayBase.createLabel("", "Clave de Elector*"));
    oForm.addContent(
        oInputBase
            .createInputText(
                oController.idForm+"ElectorKey", "Text", "",
                "{BPDetailsModel>/results/0/BpBasicData/ElectorKey}", true,
                true,
                "^[A-Za-z]{6}[0-9]{8}(H|M|h|m)[0-9]{3}$")
            .setMaxLength(18)); // txtppIdCardKey
    oForm.addContent(oDisplayBase.createLabel("", "Registro Electoral*"));
    oForm.addContent(
        oInputBase
            .createInputText(
                oController.idForm+"VoterRegistration", "Number", "",
                "{BPDetailsModel>/results/0/BpBasicData/VoterRegistration}",
                true, true, "^[0-9]{13}$")
            .setMaxLength(13)); // txtAppRegisterId
    oForm.addContent(oDisplayBase.createLabel("", "País de Nacimiento*"));
    oForm.addContent(
        oInputBase.createSelect("", "/pais", oComboItem, AppCountry, null, null)
            .setEnabled(true)
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpBasicData/CountryOfBirthId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(
        oDisplayBase.createLabel("", "Entidad Federativa de Nacimiento*"));
    oForm.addContent(
        oInputBase.createSelect("", "/entidad", oComboItem, AppEntityBorn, null,
                                null)
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpBasicData/BirthPlace",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", "Nacionalidad*"));
    oForm.addContent(
        oInputBase.createSelect("", "/nationality", oComboItem, AppNationality,
                                null, null)
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpBasicData/NationalityId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", "Estado Civil*"));
    oForm.addContent(
        oInputBase.createSelect("", "/eCivil", oComboItem, AppMaritalStatus,
                                null, null)
            .bindProperty(
                "selectedKey",
                {
                  path :
                      "BPDetailsModel>/results/0/BpBasicData/MaritalStatusId",
                  type : new sap.ui.model.type.String({}, {required : true})
                })
            .attachChange(oController.onChangeMaritalStatus, oController));

    oForm.addContent(oDisplayBase.createLabel("", "Hijos"));
    var oTxtHijos =
        oInputBase.createInputText("", "Number", "", "", true, true, "^[0-9]{1,2}$")
           .setMaxLength(2)
            .bindProperty("value", {
              path : "BPDetailsModel>/results/0/BpBasicData/Children",
              type : oTypeBasicChildren
            });
    oForm.addContent(oTxtHijos);
    oForm.addContent(oDisplayBase.createLabel("", "Nivel Escolar*"));
    oForm.addContent(
        oInputBase.createSelect("", "/nivel", oComboItem, AppLevelSchool, null,
                                null)
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpBasicData/SchoolLevelId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", "Tipo de vivienda*"));
    oForm.addContent(
        oInputBase.createSelect("", "/tipo", oComboItem, AppTypeHouse, null,
                                null)
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpBasicData/HouseTypeId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", "Tipo de Local*"));
    oForm.addContent(
        oInputBase.createSelect("", "/tipoLocal", oComboItem, AppTypeCommerce,
                                null, null)
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpBasicData/TypeOfStoreId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", ""));
    oForm.addContent(
        new sap.ui.mw.ContainerBase().createPanel("", true, false, [
          new sap.ui.layout.form.SimpleForm("",
                                            {
                                              editable : true,
                                              maxContainerCols : 1,
                                              title : "Actividad Económica",
                                              content : aActividadEconomicaForm
                                            })
        ]));
    oForm.addContent(oDisplayBase.createLabel("", "Giro*"));
    oForm.addContent(oInputBase.createInputText(
        "", "Text", "", "{BPDetailsModel>/results/0/BpBasicData/DescGiro}",
        false, false));

    oForm.addContent(oDisplayBase.createLabel("", "Industria o Sector*"));
    oForm.addContent(oInputBase.createInputText(
        "", "Text", "", "{BPDetailsModel>/results/0/BpBasicData/DescIndustry}",
        false, false));

    oForm.addContent(
        oDisplayBase.createTitle("", "Datos Directivo Compartamos"));
    var oFlex = oLayoutBase.createFlexBox();
    oFlex.addItem(oInputBase.createCheckBox(
        "", "", "{BPDetailsModel>/results/0/BpBasicData/IsRelatedToGentera}",
        true, oController.onSelchkAppDataMagmt,
        oController)); // chkAppDataManagement
    oFlex.addItem(oDisplayBase.createLabelHTML(
        "", "",
        "¿Es usted Consejero/Director de grupo Gentera o Familiar de alguno de ellos?"));
    oForm.addContent(oFlex);
    oForm.addContent(oDisplayBase.createLabel("", "Nombre Completo"));

    oForm.addContent(
        oInputBase.createInputText(
                      oController.idForm + "Managment", "Text",
                      "Ingrese Nombre Completo",
                      "{BPDetailsModel>/results/0/BpBasicData/RelatedName}",
                      true, true, "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(60)
            .setVisible(
                oController.getView()
                    .getModel("BPDetailsModel")
                    .getProperty(
                        "/results/0/BpBasicData/IsRelatedToGentera"))); // txtAppManagementName
    oForm.addContent(oDisplayBase.createTitle("", "Datos PEP"));
    var oFlex2 = oLayoutBase.createFlexBox();
    oFlex2.addItem(oInputBase.createCheckBox(
        "", "", "{BPDetailsModel>/results/0/BpBasicData/IsPEP}", true,
        oController.onSelchkAppDataPEP, oController)); // chkAppDataPEP
    oFlex2.addItem(oDisplayBase.createLabelHTML(
        "", "",
        "¿Ocupa usted o alguno de sus familiares puestos de alta relevancia en el Servicio Público?")); // lblAppDataPEP
    oForm.addContent(oFlex2);
    oForm.addContent(oDisplayBase.createLabel("", "Nombre Completo"));
    oForm.addContent(
        oInputBase.createInputText(
                      oController.idForm + "PEPName", "Text",
                      "Ingrese Nombre Completo...",
                      "{BPDetailsModel>/results/0/BpBasicData/NamePEP}", true,
                      true, "^(([A-Za-zÑñ]+)\\s?)*$")
            .setMaxLength(60)
            .setVisible(oController.getView()
                            .getModel("BPDetailsModel")
                            .getProperty("/results/0/BpBasicData/IsPEP")));
    oForm.addContent(oDisplayBase.createLabel("", "Parentesco"));
    oForm.addContent(
        oInputBase.createSelect(
                      oController.idForm + "Relation", "/parentescoPEP",
                      oItemAppRelation, AppRelation, null, null,
                      oController.getView()
                          .getModel("BPDetailsModel")
                          .getProperty("/results/0/BpBasicData/IsPEP"))
            .bindProperty("selectedKey", {
              path : "BPDetailsModel>/results/0/BpBasicData/RelationshipId"
            }));
    oForm.addContent(oInputBase.createInputText("", "Text", "", "", true, false)
                         .setVisible(false)); // pickerAppBasicDate
    return oForm;
  };

  sap.ui.mw.forms.bp.Basic.prototype.economicActivityForm = function(
      oController) {
    var oColumns = [
      new sap.m.Column({
        hAlign : "Begin",
        popinDisplay : "Inline",
        header : new sap.m.Label({text : "Descripción"}),
        minScreenWidth : "Small",
        demandPopin : true
      }),
      new sap.m.Column({
        hAlign : "Begin",
        popinDisplay : "Inline",
        header : new sap.m.Label({text : "ID"}),
        minScreenWidth : "Small",
        demandPopin : true
      })
    ];
    var tableDialog = new sap.ui.mw.PopupBase().createTableDialog(
        "", "Catálogo de actividad económica", oController.fnDoSearch,
        oController.fnDoSearch, oColumns);
    var oItemTemplate1 = new sap.m.ColumnListItem({
      type : "Active",
      unread : false,
      cells : [
        new sap.m.Label({text : "{text}"}),
        new sap.m.Label({text : "{idCRM}"})
      ]
    });
    tableDialog.bindAggregation("items", "/actEco", oItemTemplate1);
    return tableDialog;
  };

})();
