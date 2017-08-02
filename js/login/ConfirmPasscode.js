(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.initial.ConfirmPasscode");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase","js.login.AccessPasscode");


    sap.ui.base.Object.extend('sap.ui.mw.forms.initial.ConfirmPasscode', {});
    sap.ui.mw.forms.initial.ConfirmPasscode.prototype.reviewUser=function(user){
        console.log(user);
        sap.ui.getCore().byId("passCodeForm").destroyContent();

        var passCodeForm=new sap.ui.mw.forms.initial.AccessPasscode();
        passCodeForm.createForm(this).placeAt("content");

    }

    sap.ui.mw.forms.initial.ConfirmPasscode.prototype.createForm = function(oController) {

        var oInputBase, oDisplayBase,oActionBase,oLayoutBase,oEventBase,oForm;

        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();

        oForm = oLayoutBase.createForm("passCodeForm", true, 1, "").destroyContent();
        oForm.addContent(oDisplayBase.createLabelHTML("","class","Definir cód.acceso p.Originación <div>El código de acceso debería contener: <div>Mínimo 8 caracteres</div></div>"));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oInputBase.createInputText("txtPasscode", "Text", "Definir Código de Acceso", "", true, true, "^(([A-Za-zÑñ]+)\\s?)*$", true).setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oInputBase.createInputText("txtPasscodeConfirm", "Text", "Confirmar Código de Acceso", "", true, true, "^(([A-Za-zÑñ]+)\\s?)*$", true).setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "OK", "Emphasized", "", this.reviewUser, this));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "Cancelar", "Default", "", this.reviewUser, this));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oDisplayBase.createLabelHTML("","class","Copyright"));


        
        return oForm;
    };

    

})();
