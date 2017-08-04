(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.forms.initial.logon");
    jQuery.sap.require("sap.ui.base.Object");
    //Se agregan Middleware de componentes SAPUI5
    jQuery.sap.require("js.base.InputBase", "js.base.ActionBase", "js.base.DisplayBase", 
                       "js.base.LayoutBase", "js.base.PopupBase", "js.base.ListBase", 
                       "js.base.ContainerBase", "js.base.EventBase", "js.base.FileBase",
                       "js.login.ConfirmPasscode","js.base.ContainerBase", "js.base.EventBase", 
                       "js.base.FileBase","js.login.AccessPasscode","js.login.Basic");


    sap.ui.base.Object.extend('sap.ui.mw.forms.initial.logon', {});
    sap.ui.mw.forms.initial.logon.prototype.reviewUser=function(user){
        console.log(user);

        sap.ui.getCore().byId("formLogon").destroyContent();

        var passCodeForm=new sap.ui.mw.forms.initial.ConfirmPasscode();
        passCodeForm.createForm(this).placeAt("content");

    }

    sap.ui.mw.forms.initial.logon.prototype.createForm = function(oController) {

        var oInputBase, oDisplayBase,oActionBase,oLayoutBase,oEventBase,oForm,loginBasic;
        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        loginBasic= new sap.ui.login.Basic();
        var _self=this;

       return new Promise(function(resolve, reject) {
           loginBasic.initializeRest();
           if(localStorage.getItem("isAuth")==="true"){

            

            
            //sap.ui.getCore().byId("passCodeForm").destroyContent();
            var passCodeForm=new sap.ui.mw.forms.initial.AccessPasscode();
            passCodeForm.createForm(this).placeAt("content");
            resolve(true)


        }else{
            oForm = oLayoutBase.createForm("formLogon", true, 1, "").destroyContent();
            oForm.addContent(oDisplayBase.createLabelHTML("","class","Introduzca la siguiente información como se indica en las instrucciones de su gestor TI"));
            oForm.addContent(oDisplayBase.createLabel("", ""));
            oForm.addContent(oInputBase.createInputText("txtUserName", "Text", "Nombre de usuario", "", true, true, "^(([A-Za-zÑñ]+)\\s?)*$", true).setMaxLength(26));
            oForm.addContent(oDisplayBase.createLabel("", ""));
            oForm.addContent(oInputBase.createInputText("txtPassword", "Text", "Contraseña", "", true, true, "^(([A-Za-zÑñ]+)\\s?)*$", true).setMaxLength(26));
            oForm.addContent(oDisplayBase.createLabel("", ""));
            oForm.addContent(oActionBase.createButton("", "OK", "Emphasized", "", _self.reviewUser, _self));
            oForm.addContent(oDisplayBase.createLabel("", ""));
            oForm.addContent(oActionBase.createButton("", "Cancelar", "Default", "", _self.reviewUser, _self));
            oForm.addContent(oDisplayBase.createLabel("", ""));
            oForm.addContent(oDisplayBase.createLabelHTML("","class","Copyright"));
            oForm.placeAt("content");
            resolve(false)
        }

        });       
    };

    

})();
