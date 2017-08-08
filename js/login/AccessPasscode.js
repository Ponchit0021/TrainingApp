(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.initial.AccessPasscode");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase",
                       "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", 
                       "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase",
                       "js.login.Basic");


    sap.ui.base.Object.extend('sap.ui.mw.forms.initial.AccessPasscode', {});

    sap.ui.mw.forms.initial.AccessPasscode.prototype.reviewPassCode=function(user){

        if(sap.ui.getCore().byId("txtAccessPasscode").getValue()===localStorage.getItem("passCode")){
            var loginBasic= new sap.ui.login.Basic();
            localStorage.setItem("isAuth",true);
            loginBasic.destroyContent("passCodeAccessForm");
            
            loginBasic.createShell();
        }
        else{
            alert("passcode incorrecto");
        }
        

    }

    sap.ui.mw.forms.initial.AccessPasscode.prototype.forgotPassword=function(){
        localStorage.setItem("isAuth",false);
        localStorage.setItem("passCode",false);

        var logonSMP, loginBasic;
        jQuery.sap.require("js.login.LogonForm","js.login.Basic");

        logonSMP=new sap.ui.mw.forms.initial.logon();
        loginBasic= new sap.ui.login.Basic();
        
        loginBasic.destroyContent("passCodeAccessForm");
        //currentClass.hideLoader();
        logonSMP.createForm(this).then(function(resp){
            console.log(resp);
        })
        
    }

    sap.ui.mw.forms.initial.AccessPasscode.prototype.createForm = function(oController) {

        var oInputBase, oDisplayBase,oActionBase,oLayoutBase,oEventBase,oForm;

        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();

        oForm = oLayoutBase.createForm("passCodeAccessForm", true, 1, "").destroyContent();
        oForm.addStyleClass("form-logon");
        oForm.addContent(oDisplayBase.createLabelHTML("lblCodAccesoOriginacion2","class","Introduzca la siguiente información como se indica en las instrucciones de su gestor TI"));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oInputBase.createInputText("txtAccessPasscode", "Password", "", "", true, true, "", true).setMaxLength(26));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "OK", "Emphasized", "", this.reviewPassCode, this));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oActionBase.createButton("", "Código de Acceso olvidado", "Default", "", this.forgotPassword, this));
        oForm.addContent(oDisplayBase.createLabel("", ""));
        oForm.addContent(oDisplayBase.createLabelHTML("","class","Copyright"));


        
        return oForm;
    };

    

})();
