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
        var txtPassword,configPassword,txtUserName,promoterId;
        txtUserName=sap.ui.getCore().byId("txtUserName").getValue();
        txtPassword=sap.ui.getCore().byId("txtPassword").getValue();

        promoterId=sap.ui.getCore().AppContext.Config.getProperty("promoterId");
        configPassword=sap.ui.getCore().AppContext.Config.getProperty("passPromoterId");
        
        if(txtPassword===configPassword && txtUserName === promoterId ){
            sap.ui.getCore().byId("formLogon").destroyContent();
            var passCodeForm=new sap.ui.mw.forms.initial.ConfirmPasscode();
            passCodeForm.createForm(this).placeAt("content");
        }
        else{

            
            sap.m.MessageBox.alert("Compruebe sus credenciales.", {
                title: "Error de registro",                                      // default
                onClose: null,                                       // default
                styleClass: "sapUiSizeCompact",                                      // default
                initialFocus: null ,                                 // default
                textDirection: sap.ui.core.TextDirection.Inherit     // default
            });
            
        }
            

        

    }

    sap.ui.mw.forms.initial.logon.prototype.createForm = function(oController) {

        var oInputBase, oDisplayBase,oActionBase,oLayoutBase,oEventBase,oForm,loginBasic,oContainerBase;
        oInputBase = new sap.ui.mw.InputBase();
        oDisplayBase = new sap.ui.mw.DisplayBase();
        oActionBase = new sap.ui.mw.ActionBase();
        oLayoutBase = new sap.ui.mw.LayoutBase();
        loginBasic= new sap.ui.login.Basic();
        oContainerBase=new sap.ui.mw.ContainerBase();
        var _self=this;

       return new Promise(function(resolve, reject) {
           loginBasic.initializeRest();
           if(localStorage.getItem("isAuth")==="true"){
            var passCodeForm=new sap.ui.mw.forms.initial.AccessPasscode();
            passCodeForm.createForm(this).placeAt("content");
            resolve(true);
            }else{

                oForm = oLayoutBase.createForm("formLogon", true, 1, "").destroyContent();
                oForm.addStyleClass("form-logon");
               // loginBasic.hideForm('.form-logon');

                oForm.addContent(oDisplayBase.createLabelHTML("lblCodAccesoOriginacion1","lblMessage","Introduzca la siguiente información como se indica en las instrucciones de su gestor TI"));
                oForm.addContent(oDisplayBase.createLabel("", ""));
                oForm.addContent(oInputBase.createInputText("txtUserName", "Text", "", "", true, true, "^(([A-Za-zÑñ]+)\\s?)*$", true).setMaxLength(26));
                oForm.addContent(oDisplayBase.createLabel("", ""));
                oForm.addContent(oInputBase.createInputText("txtPassword", "Password", "", "", true, true, "", true));
                oForm.addContent(oDisplayBase.createLabel("", ""));
                oForm.addContent(oActionBase.createButton("", "OK", "Emphasized", "", _self.reviewUser, _self));
                oForm.addContent(oDisplayBase.createLabel("", ""));
                oForm.addContent(oActionBase.createButton("", "Cancelar", "Default", "", function(){}, _self));
                oForm.addContent(oDisplayBase.createLabel("", ""));
                oForm.addContent(oDisplayBase.createLabelHTML("","","<div class='blank-space'></div>"));
                oForm.addContent(oDisplayBase.createLabelHTML("","","<div class='footer-sap-container'><div><img class='sapLogo' src='img/sapLogo.png' alt=''></div><div class='sap-copy'>Copyright &#169 2016 SAP SE.<br> Reservados todos los derechos.</div></div>"));
                //oForm.addContent(oDisplayBase.createImage("", "img/sapLogo.png", "sapLogo"));
                //oForm.addContent(oDisplayBase.createLabelHTML("","class","Copyright"));
                oForm.placeAt("content");
                resolve(false)
            }

        });       
    };

    

})();
