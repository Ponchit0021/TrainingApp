(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.initial.ConfirmPasscode");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase",
                       "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase",
                       "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase",
                       "js.login.AccessPasscode","js.login.Basic");


    sap.ui.base.Object.extend('sap.ui.mw.forms.initial.ConfirmPasscode', {});
    sap.ui.mw.forms.initial.ConfirmPasscode.prototype.confirmPassCode=function(user){

        var txtPasscode,txtPasscodeConfirm;
        var loginBasic= new sap.ui.login.Basic();
        txtPasscode=sap.ui.getCore().byId("txtPasscode").getValue();
        txtPasscodeConfirm= sap.ui.getCore().byId("txtPasscodeConfirm").getValue()

        if(txtPasscode===txtPasscodeConfirm)
        {

            if(txtPasscode.length>=8){
                
            
                localStorage.setItem("isAuth",true);
                localStorage.setItem("passCode",sap.ui.getCore().byId("txtPasscode").getValue());
                loginBasic.destroyContent("passCodeForm");
                loginBasic.createShell();
            }else{
                sap.m.MessageBox.alert("Código de acceso inválido.", {
                    title: "Error de registro",
                    onClose: null,
                    styleClass: "sapUiSizeCompact",
                    initialFocus: null ,
                    textDirection: sap.ui.core.TextDirection.Inherit
                });

            }
            
        }
        else{
            sap.m.MessageBox.alert("Código de acceso inválido.", {
                title: "Error de registro",
                onClose: null,
                styleClass: "sapUiSizeCompact",
                initialFocus: null ,
                textDirection: sap.ui.core.TextDirection.Inherit
            });
            
        }


      

    }

    sap.ui.mw.forms.initial.ConfirmPasscode.prototype.createForm = function(oController) {

        var oInputBase, oDisplayBase,oActionBase,oLayoutBase,oEventBase,oForm;

        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();

        oForm = oLayoutBase.createForm("passCodeForm", true, 1, "").destroyContent();
        oForm.addStyleClass("form-logon");
        oForm.addContent(oDisplayBase.createLabelHTML("lblCodAccesoOriginacion","class","Definir cód.acceso p.Originación <div>El código de acceso debería contener: <div>Mínimo 8 caracteres</div></div>"));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oInputBase.createInputText("txtPasscode", "Password", "Definir Código de Acceso", "", true, true, "", true).setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oInputBase.createInputText("txtPasscodeConfirm", "Password", "Confirmar Código de Acceso", "", true, true, "", true).setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "OK", "Emphasized", "", this.confirmPassCode, this));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oDisplayBase.createLabelHTML("","class","Copyright"));


        
        return oForm;
    };

    

})();
