sap.ui.controller("originacion.About", {
	onInit: function() {
      
        jQuery.sap.require("js.base.DisplayBase",
        	               "js.base.LayoutBase");

		sap.ui.core.UIComponent.getRouterFor(this).getRoute("about").attachMatched(this.onLoadInfoAbout, this);
    },
    onLoadInfoAbout:function() {
    },
    getVersionNumber: function (){
        return new Promise(function(resolve) {
            var promiseVersionNum = "WEB";
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                   cordova.getAppVersion.getVersionNumber().then(function (version) {
                      resolve(version);
                    });
            }else{
                resolve(promiseVersionNum);
            }
        }.bind(this));
       
    },
    toBack: function() {
        var router;
        sap.ui.getCore().AppContext.flagAbout = false;
        router = sap.ui.core.UIComponent.getRouterFor(this);
        router.navTo("DashBoard", false);
    },
    clearCacheAction: function(){
        //STRAT
        //BORRADO DE CACHE Y REINICIO DE LA APLICACION
        if(window.cache){
            window.cache.clear(function(succes){
                console.log("Clearing Cache... ");
                // reload the app.
                setTimeout(function () {
                    window.location.reload(true);
                }, 300);
            }, function (error){
            console.log(error);
            });
        }else{
            window.location.reload(true);
        }            
        //BORRADO DE CACHE Y REINICIO DE LA APP
        //END
            
    },
    closeClearCache: function(){
        var oCurrentDialog = sap.ui.getCore().byId("appDialogClearCache");
        //Se destruye el contenido del dialogo y se cierra dialogo
        oCurrentDialog.destroyContent();
        oCurrentDialog.destroyButtons();
        oCurrentDialog.close();
    },    
    clearCacheButton: function(){
        var dialogAdds,oCurrentController;
        var oDisplayBase = new sap.ui.mw.DisplayBase();
        var oActionBase = new sap.ui.mw.ActionBase();
        oCurrentController = this;
        setTimeout(function() {
                dialogAdds = sap.ui.getCore().byId('appDialogClearCache');
                dialogAdds.addContent(oDisplayBase.createText("", "Esta acción borrará toda la información que aún no ha sido enviada a Integra.\n ¿Desea continuar?"));
                dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.clearCacheAction, oCurrentController));
                dialogAdds.addButton(oActionBase.createButton("", "Cancelar", "Default", "", oCurrentController.closeClearCache, oCurrentController));
                dialogAdds.open();
        }, 0);
    }
});