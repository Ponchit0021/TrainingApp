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
    }
});