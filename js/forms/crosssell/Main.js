(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.crosssell.Main");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase", "js.SimpleTypes.ListaControlBase", "js.SimpleTypes.LevelRiskBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.crosssell.Main', {});
    sap.ui.mw.forms.crosssell.Main.prototype.createForm = function(_oController) {
        var oListaControl, oLevelRisk, semaphoreIcon, iSemaforo;
        var oContainerBase = new sap.ui.mw.ContainerBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase(),
            oInputBase = new sap.ui.mw.InputBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oListaControl = new sap.ui.model.SimpleType.ListaControl(),
            oLevelRisk = new sap.ui.model.SimpleType.LevelRisk(),
            oModel, oForm, oItems, sParentProduct, sChildProduct;


        oItems = new sap.ui.core.Item({
            key: "{idCRM}",
            text: "{text}"
        });
        oModel = _oController.getView().getModel("oViewModel");
        oForm = oLayoutBase.createForm("fCrossSellMain", true, 1, "Principales");
        oForm.setModel(oModel, "CrossSellApplicationModel");

        _oController.onInitializeDispersion();
        sParentProduct = oModel.getProperty('/LRGeneralCrossSell/ParentProductId');
        sChildProduct = oModel.getProperty('/ProductID');
        //Principales
        oForm.addContent(oDisplayBase.createLabel("", "Producto Padre"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellMainProduct", "Text", "", _oController.getParentProductToString(sParentProduct), true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Id Grupo"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellIdGroup", "Text", "", "{CrossSellApplicationModel>/LRGroupCrossSell/ParentGroupId}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Nombre de Grupo"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellNameProduct", "Text", "", "{CrossSellApplicationModel>/LRGroupCrossSell/ParentGroupName}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Id Oportunidad"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellIdOportunity", "Text", "", "{CrossSellApplicationModel>/LoanRequestIdCRM}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Id Cliente"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellIdCustomer", "Text", "", "{CrossSellApplicationModel>/LinkSet/results/0/CustomerIdCRM}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Nombre Completo"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellFullName", "Text", "",
            "{CrossSellApplicationModel>/LinkSet/results/0/Customer/BpName/LastName}" + " " +
            "{CrossSellApplicationModel>/LinkSet/results/0/Customer/BpName/SecondName}" + " " +
            "{CrossSellApplicationModel>/LinkSet/results/0/Customer/BpName/FirstName}" + " " +
            "{CrossSellApplicationModel>/LinkSet/results/0/Customer/BpName/MiddleName}",
            true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Producto de Venta Cruzada"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellProduct", "Text", "", _oController.getChildProductToString(sChildProduct), true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Estatus de la Oportunidad"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellIdOportunityStatus", "Text", "", "{CrossSellApplicationModel>/GeneralLoanRequestData/StatusText}", true, false));
        oForm.addContent(oDisplayBase.createLabel("", "Listas de Control"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellControlList", "Text", "", "", true, false).bindProperty("value", {
            path: "CrossSellApplicationModel>/LinkSet/results/0/GeneralLoanData/ControlListsResult",
            type: oListaControl
        }));
        oForm.addContent(oDisplayBase.createLabel("", "Nivel de Riesgo"));
        oForm.addContent(oInputBase.createInputText("txtCrossSellRiskLevel", "Text", "", "", true, false).bindProperty("value", {
            path: "CrossSellApplicationModel>/LinkSet/results/0/GeneralLoanData/RiskLevel",
            type: oLevelRisk
        }));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        semaphoreIcon = oDisplayBase.createIcon("iconCrossSellSemaphoreMain", "sap-icon://status-error", "2.0rem");
        iSemaforo = oModel.getProperty("/LinkSet/results/0/GeneralLoanData/SemaphoreResultFilters");
        _oController.setSemaphore("iconCrossSellSemaphoreMain",iSemaforo);
        oForm.addContent(semaphoreIcon);

        oForm.addContent(oDisplayBase.createLabel("", "Canal de Dispersión*"));
        oForm.addContent(
            oInputBase.createSelect("selCrossSellDispersionChannel", "/results",
                oItems, null, null, null)
            .bindProperty("selectedKey", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GeneralLoanData/DispersionChannelId",
                type: new sap.ui.model.type.String({}, { required: true })
            }));

        oForm.addContent(oDisplayBase.createLabel("", "Medio de Dispersión*"));
        oForm.addContent(
            oInputBase.createSelect("selCrossSellDispersionMedium", "/results",
                oItems, null, null, null)
            .bindProperty("selectedKey", {
                path: "CrossSellApplicationModel>/LinkSet/results/0/GeneralLoanData/DispersionMediumId",
                type: new sap.ui.model.type.String({}, { required: true })
            }));

        return oForm;
    }
})();
