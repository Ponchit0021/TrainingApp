/**
 * [RouterBase
 * 25/03/2015]
 */
(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.RouterBase");
    jQuery.sap.require("sap.ui.base.Object");
    sap.ui.base.Object.extend('sap.ui.mw.RouterBase', {});


    /**
     * [getRouteParameters Obtiene los parametros de la ruta actual]
     * @param  {[Object]} _controller  [Controlador this actual de la instancia de RouterBase]
     * @return {[Promise]}             [Promesa que contiene en su resolve los argumentos actuales de la ruta]
     */
    sap.ui.mw.RouterBase.prototype.getRouteParameters = function(_controller) {
        return new Promise(function(resolve, reject) {
            try {
                _controller.router = sap.ui.core.UIComponent.getRouterFor(_controller);
                _controller.router.attachRouteMatched(function(evt) {

                    alert(evt.getParameter("name"));
                    resolve(evt.getParameter("arguments"));

                }, _controller);
            } catch (e) {
                reject(e);

            }
        });

    };
})();
