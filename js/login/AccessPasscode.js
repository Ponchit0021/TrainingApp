(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.initial.AccessPasscode");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase");


    sap.ui.base.Object.extend('sap.ui.mw.forms.initial.AccessPasscode', {});
    sap.ui.mw.forms.initial.AccessPasscode.prototype.reviewUser=function(user){

        sap.ui.getCore().byId("passCodeAccessForm").destroyContent();
        new sap.m.Shell("Shell", {
            title: "AO",
            app: new sap.ui.core.ComponentContainer({ name: "com.gentera" })
        })
        .placeAt("content");

    }

    sap.ui.mw.forms.initial.AccessPasscode.prototype.createForm = function(oController) {

        var oInputBase, oDisplayBase,oActionBase,oLayoutBase,oEventBase,oForm;

        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();

        oForm = oLayoutBase.createForm("passCodeAccessForm", true, 1, "").destroyContent();
        oForm.addContent(oDisplayBase.createLabelHTML("","class","Introduzca la siguiente información como se indica en las instrucciones de su gestor TI"));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oInputBase.createInputText("txtAccessPasscode", "Text", "", "", true, true, "^(([A-Za-zÑñ]+)\\s?)*$", true).setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "OK", "Emphasized", "", this.reviewUser, this));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "Código de Acceso olvidado", "Default", "", this.reviewUser, this));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oDisplayBase.createLabelHTML("","class","Copyright"));


        
        return oForm;
    };

    

})();
