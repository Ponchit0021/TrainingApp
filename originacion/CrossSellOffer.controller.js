sap.ui.controller('originacion.CrossSellOffer', {
    onInit: function() {
        jQuery.sap.require("js.kapsel.Rest");
        jQuery.sap.require("js.base.NavigatorBase");
        jQuery.sap.require("js.base.ListBase");
        jQuery.sap.require("js.base.ActionBase");
        jQuery.sap.require("js.base.DisplayBase");
        jQuery.sap.require("js.forms.crosssell.Offer");
        jQuery.sap.require("js.buffer.crosssell.CrossSellOfferBuffer");

        var oRouter, oNavigatorBase;
        oNavigatorBase = new sap.ui.mw.NavigatorBase();
        oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("crossSellOffer").attachMatched(this.onRouteMatched, this);
    },
    onRouteMatched: function(oEvent) {
        var oArgs, oView, oModelCandidate, oModelOffer, oForm, oBuffer;
        oArgs = oEvent.getParameter("arguments");
        oView = this.getView();
        oModelCandidate = new sap.ui.model.json.JSONModel();
        oModelOffer = new sap.ui.model.json.JSONModel();
        //se consultan datos de la oferta de crédito - localstore
        sap.ui.getCore().AppContext.myRest.read("/CrossSellingCandidateSet", "$filter=CandidateIdCRM eq '" + oArgs.candidateId + "'", true)
            .then(function(oResult) {
                oModelCandidate.setData(oResult);
                oView.setModel(oModelCandidate, "CrossSellCandidateModel");
                sap.ui.getCore().AppContext.myRest.read("/CrossSellOfferSet", "$filter=CandidateIdCRM eq '" + oArgs.candidateId + "' and CrossSellProductId eq '" + oArgs.productId + "'", true)
                    .then(function(oResultOffer) {
                        if (oResultOffer.results.length === 0) {
                            //la oferta no existe - localstore
                            this.messageGenerator("La oferta de crédito no fue encontrada.", 9000);
                            sap.ui.getCore().byId("btnAcceptOffer").setEnabled(false);
                            sap.ui.getCore().byId("btnRejectOffer").setEnabled(false);
                            sap.ui.getCore().byId("btnCancelOffer").setEnabled(false);
                            //revisar
                            window.history.go(-1);
                            sap.ui.getCore().byId("pCrossSellOffer").destroyContent();
                        } else {
                            //oferta existe - localstore
                            //se revisa si ya fue aceptada/rechazada 
                            oSerialize = this.getCrossSellOfferSerialize("dataDB");
                            oSerialize.searchInDataDB(oArgs)
                                .then(function(oRes) {
                                    if (oRes) {
                                        this.messageGenerator("La oferta de crédito ya fue aceptada o rechazada anteriormente.", 9000);
                                        sap.ui.getCore().byId("btnAcceptOffer").setEnabled(false);
                                        sap.ui.getCore().byId("btnRejectOffer").setEnabled(false);
                                        sap.ui.getCore().byId("btnCancelOffer").setEnabled(false);
                                        //revisar
                                        window.history.go(-1);
                                        sap.ui.getCore().byId("pCrossSellOffer").destroyContent();
                                    } else {
                                        //muestra el detalle de la oferta
                                        oModelOffer.setData(oResultOffer);
                                        oView.setModel(oModelOffer, "CrossSellOfferModel");
                                        //se habilitan botones 
                                        sap.ui.getCore().byId("btnAcceptOffer").setEnabled(true);
                                        sap.ui.getCore().byId("btnRejectOffer").setEnabled(true);
                                        sap.ui.getCore().byId("btnCancelOffer").setEnabled(true);
                                        //se muestra titulo
                                        var oProduct = oModelOffer.getProperty("/results/0/CrossSellProductId");
                                        switch (oProduct) {
                                            case "C_IND_CA":
                                            case "C_IND_CA_CCR":
                                                sap.ui.getCore().byId("pCrossSellOffer").setTitle("Propuesta (CA)");
                                                break;
                                            case "C_IND_CCM_CCR":
                                            case "C_IND_CCM":
                                                sap.ui.getCore().byId("pCrossSellOffer").setTitle("Propuesta (CCM)");
                                                break;
                                        }
                                        oForm = new sap.ui.mw.forms.crosssell.Offer();
                                        sap.ui.getCore().byId("pCrossSellOffer").addContent(oForm.createForm(oModelCandidate, oModelOffer));
                                    }
                                }.bind(this));
                        }
                    }.bind(this));
            }.bind(this));
    },
    onGoBack: function(oEvent) {
        sap.ui.getCore().byId("pCrossSellOffer").destroyContent();
        if (sap.ui.getCore().byId("fCrossSellOffer")) {
            sap.ui.getCore().byId("fCrossSellOffer").destroyContent();
        }
        window.history.go(-1);
    },
    getCrossSellOfferSerialize: function(_oDB) {
        jQuery.sap.require("js.serialize.crosssell.CrossSellOfferSerialize");
        return new sap.ui.serialize.CrossSellOfferSerialize(_oDB);
    },
    onCancelOffer: function() {
        window.history.go(-1);
        sap.ui.getCore().byId("pCrossSellOffer").destroyContent();
        sap.ui.getCore().byId("dlgRejectOffer").destroyContent();
    },
    onAcceptOffer: function() {
        var oController = this;
        new sap.ui.mw.PopupBase().createMessageBox("Oferta de Crédito", "¿Esta seguro que desea aceptar la oferta de crédito?", null, oController.onAcceptConfirmation.bind(oController));
    },
    onRejectOffer: function() {
        var oController, oListBase, oDialog, oModel, oItemTemplate, oList;
        oListBase = new sap.ui.mw.ListBase();
        oController = this;
        oDialog = sap.ui.getCore().byId("dlgRejectOffer");
        oDialog.addButton(oActionBase.createButton("", "Cancelar", "Transparent", null, oController.onCancelDialogReject, oController));
        //lista
        oModel = new sap.ui.model.json.JSONModel("data-map/catalogos/motivoRechazoSub.json");
        oItemTemplate = new sap.m.StandardListItem({
            title: '{text}',
            type: sap.m.ListType.Active,
            press: oController.onSelectRejectReason
        });
        oList = oListBase.createList("lstApplicantsList", null, sap.m.ListMode.SingleSelectMaster, null, "/Individual", oItemTemplate, oController.onSelectRejectReason, oController);
        oController.getView().setModel(oModel, "oReasonsModel");
        oList.setModel(oModel);
        oDialog.addContent(oList);
        oDialog.open();
    },
    onSelectRejectReason: function(oEvent) {
        var oController, oPath, oSelection;
        oController = this;
        oPath = oEvent.mParameters.listItem.getBindingContext().getPath();
        oSelection = oController.getView().getModel("oReasonsModel").getProperty(oPath);
        oController.onRejectConfirmation(oSelection.idCRM);
    },
    onCancelDialogReject: function() {
        var oDialog;
        oDialog = sap.ui.getCore().byId("dlgRejectOffer");
        oDialog.destroyContent().destroyButtons();
        oDialog.close();
    },
    onAcceptConfirmation: function(oEvent) {
        var oModel, oCandidate, oSerialize, oController;
        oController = this;
        oModel = this.getView().getModel("CrossSellOfferModel");
        oCandidate = this.getView().getModel("CrossSellCandidateModel");
        if (oEvent === "Aceptar") {
            oSerialize = this.getCrossSellOfferSerialize("dataDB");
            oSerialize.serialize(oModel, "Accept", null)
                .then(function() {
                    oSerialize.sendToCore(oModel, oCandidate)
                        .then(function() {
                            sap.m.MessageToast.show("La oferta de crédito fue aceptada y está preparada para enviar a Integra.", {
                                animationDuration: 6000
                            });
                            oController.onDestroyComponents();
                        });
                });
        }
    },
    onRejectConfirmation: function(oId) {
        var oModel, oCandidate, oSerialize, oController;
        oController = this;
        oModel = this.getView().getModel("CrossSellOfferModel");
        oCandidate = this.getView().getModel("CrossSellCandidateModel");
        oSerialize = this.getCrossSellOfferSerialize("dataDB");
        oSerialize.serialize(oModel, "Reject", oId)
            .then(function() {
                oSerialize.sendToCore(oModel, oCandidate)
                    .then(function() {
                        sap.m.MessageToast.show("El Credito Hijo ha sido rechazado. Sincronice para enviar la información a Integra.", {
                            animationDuration: 6000
                        });
                        //  sap.m.MessageToast.show("La oferta de crédito fue rechazada y está preparada para enviar a Integra.", {
                        //     animationDuration: 6000
                        // });
                        oController.onDestroyComponents();
                    });
            });
    },
    messageGenerator: function(oMessage, oTimer) {
        sap.m.MessageToast.show(oMessage, {
            animationDuration: oTimer
        });
    },
    onDestroyComponents: function() {
        var oController = this;
        sap.ui.getCore().byId("pCrossSellOffer").destroyContent();
        sap.ui.getCore().byId("dlgRejectOffer").destroyContent();
        oController.onGoBack();
    }
});
