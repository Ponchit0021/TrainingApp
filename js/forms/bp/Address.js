(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.mw.forms.bp.Address");
  jQuery.sap.require("sap.ui.base.Object");
  jQuery.sap.require("js.base.InputBase");
  jQuery.sap.require("js.base.ActionBase");
  jQuery.sap.require("js.base.LayoutBase");
  jQuery.sap.require("js.base.PopupBase");
  jQuery.sap.require("js.base.ListBase");
  jQuery.sap.require("js.base.DisplayBase");

  
  var oPopupBase = new sap.ui.mw.PopupBase();
  var oAddressModel;
  sap.ui.base.Object.extend('sap.ui.mw.forms.bp.Address', {});

  sap.ui.mw.forms.bp.Address.prototype.createForm = function(oController) {

    var oForm = new sap.ui.mw.LayoutBase().createForm(
        oController.idForm + "Address", true, 1, "Direcciones");
    oForm.destroyContent();
    oForm.addContent(new sap.ui.mw.DisplayBase().createLabel("", ""));
    oForm.addContent(new sap.ui.mw.ActionBase()
                         .createButton("", "Nueva Dirección", "Default",
                                       "sap-icon://add", oController.addAddress,
                                       oController)
                         .setWidth("100%"));
    oForm.addContent(new sap.ui.mw.DisplayBase().createLabel("", ""));
    oForm.addContent(new sap.ui.mw.InputBase().createSearchField(
        "", oController.onSearchAddress, oController, "100%"));
    oForm.addContent(new sap.ui.mw.DisplayBase().createLabel("", ""));
    var oTblAddress = new sap.ui.mw.ListBase().createTable(
        oController.idForm + "tblAddress", "",
        sap.m.ListMode.SingleSelectMaster, [ "" ], [ true ], [ false ],
        [ "100%" ], oController.updateAddress, oController);
    oController.bindAggregationAddress();
    oForm.addContent(oTblAddress);
    return oForm;
  };

  sap.ui.mw.forms.bp.Address.prototype.createModalAddressForm = function(
      oController, _oModel) {
  
    var AppDgTypeAddress =
        oController.addresTypeManager(_oModel.getProperty("/AddressTypeId"));
    
    var oItemSelect = new sap.ui.core.Item({key : "{idCRM}", text : "{text}"});
    var oItemAppDgDelegation =
        new sap.ui.core.Item({key : "{TownName}", text : "{TownName}"});
    var oItemAppDgSuburb =
        new sap.ui.core.Item({key : "{SuburbName}", text : "{SuburbName}"});
    var AppDgCountry =
        new sap.ui.model.json.JSONModel("data-map/catalogos/pais.json");
    var AppDgEntity =
        new sap.ui.model.json.JSONModel("data-map/catalogos/entidadNac.json");

    var oInputBase = new sap.ui.mw.InputBase();
    var oActionBase = new sap.ui.mw.ActionBase();
    var oDisplayBase = new sap.ui.mw.DisplayBase();
    var oLayoutBase = new sap.ui.mw.LayoutBase();
    var addressDialog = new sap.ui.mw.PopupBase().createDialog(
        "", "Agregar Dirección", "Message", "");
    addressDialog.setContentWidth("80%").setContentHeight("85%");
    var oForm =
        oLayoutBase.createForm(oController.idForm + "AddressModal", true, 1, "")
            .destroyContent();
    oForm.setModel(_oModel, "oModelAddress");
    oForm.setWidth("100%");
    oForm.setLayout(sap.ui.layout.form.SimpleFormLayout.ResponsiveGridLayout);
    oForm.addContent(oDisplayBase.createLabel("", "Tipo de domicilio*"));
    oForm.addContent(
        oInputBase.createSelect("selectAppDgTypeAddress", "/tipo", oItemSelect,
                                AppDgTypeAddress, null, null)
            .bindProperty(
                "selectedKey",
                {
                  path : "oModelAddress>/AddressTypeId",
                  type : new sap.ui.model.type.String({}, {required : true})
                })
            .attachChange(oController.onChangeTypeAddress, oController));
    oForm.addContent(oInputBase.createCheckBox("chkAppDgMainAddress",
                                               "Es Principal",
                                               "{oModelAddress>/IsMainAddress}",
                                               true, null, null)
                         .setVisible(false));
    oForm.addContent(oDisplayBase.createLabel("", "Código Postal*"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgPostCode", "Number",
                                   "Ingrese código postal...",
                                   "{oModelAddress>/Place/PostalCode}", true,
                                   true, "^[0-9]{5}$", true)
            .setMaxLength(5));
    oForm.addContent(
        oActionBase.createButton("", "Buscar", "Default", "sap-icon://search",
                                 oController.searchAddressByCP, oController));
    oForm.addContent(oDisplayBase.createLabel("", "País*"));
    AppDgCountry.setSizeLimit(300);
    oForm.addContent(
        oInputBase.createSelect("selectAppDgCountry", "/pais", oItemSelect,
                                AppDgCountry, null, null)
            .setSelectedKey("MX")
            .setEnabled(false)
            .bindProperty("selectedKey", {
              path : "oModelAddress>/Place/CountryID",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", "Entidad Federativa*"));
    oForm.addContent(
        oInputBase.createSelect("selectAppDgEntity", "/entidad", oItemSelect,
                                AppDgEntity, null, null)
            .setEnabled(false)
            .bindProperty("selectedKey", {
              path : "oModelAddress>/Place/StateId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", "Delegación o Municipio*"));
    oForm.addContent(
        oInputBase.createSelect("selectAppDgDelegation", "/results",
                                oItemAppDgDelegation, null, null, null)
            .bindProperty("selectedKey", {
              path : "oModelAddress>/Place/TownId",
              type : new sap.ui.model.type.String({}, {required : true})
            }));
    oForm.addContent(oDisplayBase.createLabel("", "Ciudad o Localidad*"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgCity", "Text",
                                   "Ingrese Ciudad o Localidad...",
                                   "{oModelAddress>/Place/City}", true, true,
                                   "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(40));
   
    var formColony = [];
    oForm.addContent(oDisplayBase.createLabel("", "Colonia o Barrio*"));
    formColony.push(oInputBase.createSelect("selectAppDgSuburb", "/results",
                                            oItemAppDgSuburb)
                        .bindProperty("selectedKey",
                                      {
                                        path : "oModelAddress>/Place/Suburb",
                                        type : new sap.ui.model.type.String(
                                            {}, {required : true})
                                      })
                        .setWidth("90%"));
    formColony.push(oActionBase.createButton("btnSearchSuburb", "", "Default",
                                             "sap-icon://search",
                                             oController.pickSuburb,
                                             oController)
                        .setWidth("10%"));
    oForm.addContent(oContainerBase.createPanel("panelColony", false, true,
                                                formColony, null, null));

    oForm.addContent(oDisplayBase.createLabel("", "Calle*"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgStreet", "Text", "Ingrese Calle...",
                                   "{oModelAddress>/Place/Street}", true, true,
                                   "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(60));
    oForm.addContent(oDisplayBase.createLabel("", "Número exterior*"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgNumExt", "Text",
                                   "Ingrese Número Exterior...",
                                   "{oModelAddress>/Place/OutsideNumber}", true,
                                   true, "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(10));
    oForm.addContent(oDisplayBase.createLabel("", "Número interior*"));
    oForm.addContent(
        oInputBase.createInputText(
                      "txtAppDgNumInt", "Text", "Ingrese Número Interior...",
                      "{oModelAddress>/Place/InteriorNumber}", true, true,
                      "^(([A-Za-zÑñ0-9]+)\\s?)*$", true)
            .setMaxLength(10));
    oForm.addContent(
        oDisplayBase.createLabel("", "Ingrese Entre que Calles(Calle 1)"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgStreet1", "Text",
                                   "Ingrese entre que calle 1...",
                                   "{oModelAddress>/Place/BetweenStreets1}",
                                   true, true, "^(([A-Za-zÑñ0-9]+)\\s?)*$")
            .setMaxLength(40));
    oForm.addContent(
        oDisplayBase.createLabel("", "Ingrese Entre que Calles(Calle 2)"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgStreet2", "Text",
                                   "Ingrese entre que calle 2...",
                                   "{oModelAddress>/Place/BetweenStreets2}",
                                   true, true, "^(([A-Za-zÑñ0-9]+)\\s?)*$")
            .setMaxLength(40));
    oForm.addContent(oDisplayBase.createLabel("", "Referencia de ubicación"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgLocationRef", "Text",
                                   "Ingrese referencia de ubicación ...",
                                   "{oModelAddress>/Place/LocationReference}", true,
                                   true, "^(([A-Za-zÑñ0-9]+)\\s?)*$")
            .setMaxLength(80));
    oForm.addContent(oDisplayBase.createLabel("", "Latitud"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgLatitude", "Text", "Latitude",
                                   "{oModelAddress>/Latitude}", true, true,
                                   "^(\\-?\\d+(\\.\\d+)?)*$", false)
            .setMaxLength(20)
            .setVisible(false));
    oForm.addContent(oDisplayBase.createLabel("", "Longitud"));
    oForm.addContent(
        oInputBase.createInputText("txtAppDgLongitude", "Text", "Longitude",
                                   "{oModelAddress>/Longitude}", true, true,
                                   "^(\\-?\\d+(\\.\\d+)?)*$", false)
            .setMaxLength(20)
            .setVisible(false));
    oForm.addContent(oDisplayBase.createLabel("", ""));
    oForm.addContent(
        oActionBase.createButton("", "Ver Mapa", "Default", "sap-icon://map",
                                 oController.serchLocationMap, oController));
    addressDialog.addContent(oForm);
    addressDialog.addButton(oActionBase.createButton(
        "", "Guardar", "Emphasized", "sap-icon://save",
        oController.saveAddress.bind(
            oController, oForm.getModel("oModelAddress"), addressDialog),
        oController));
    addressDialog.addButton(oActionBase.createButton(
        "", "Cancelar", "Default", "sap-icon://sys-cancel",
        oController.cancelSaveAddress, addressDialog));

    return addressDialog;
  };

  sap.ui.mw.forms.bp.Address.prototype.suburbTableDialog = function(
      oController) {
    
    var oColumnsSubs = [
      new sap.m.Column({
        hAlign : "Begin",
        popinDisplay : "Inline",
        minScreenWidth : "Small",
        demandPopin : true
      })
    ];
    var suburbDialog = oPopupBase.createTableDialog(
        "", "Catálogo de colonias o barrios", oController.fnDoSearchSuburb,
        oController.fnDoSearchSuburb, oColumnsSubs);
    return suburbDialog;
  };

  sap.ui.mw.forms.bp.Address.prototype.locationMap = function(oController,
                                                              _oModel) {
    jQuery.sap.require("js.maps.GoogleMaps");
    var mapsDialog = new sap.ui.mw.PopupBase().createDialog(
        "", "Mapa de ubicación", "Message", "sap-icon://map");
    mapsDialog.setContentWidth("100%");
    mapsDialog.setContentHeight("100%");
    // Se declaran objetos de Middleware de componentes SAPUI5
    var oActionBase = new sap.ui.mw.ActionBase();
    var oDisplayBase = new sap.ui.mw.DisplayBase();
    var oMaps = new sap.ui.mw.GoogleMaps();
    var zipCode = sap.ui.getCore().byId("txtAppDgPostCode");

   
    var oIndicatorMaps = new sap.m.BusyIndicator({text : "Cargando mapa..."});
    mapsDialog.addContent(oIndicatorMaps);

    setTimeout(function() {
      // Agrega el maps
     
      mapsDialog.destroyContent();
      mapsDialog.addContent(oDisplayBase.createMapsContent(
          "appDgMapsContent", "sapGoogleMapsContent"));
      mapsDialog.addButton(oActionBase.createButton(
          "", "Obtener Coordenadas", "Emphasized", "",
          oController.getCoordinates.bind(oController, oMaps, mapsDialog),
          oController));
      mapsDialog.addButton(oActionBase.createButton(
          "", "Cancelar", "Default", "", oController.cancelMaps, mapsDialog));

    }, 0);

    oMaps.zipCode = zipCode.getValue();
    mapsDialog.attachAfterOpen(function() {
      oMaps.idContentMap = "appDgMapsContent";
      oMaps.initializeMaps();
    });
    return mapsDialog;
  };
})();
