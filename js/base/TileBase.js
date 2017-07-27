(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.TileBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.TileBase', {});


    sap.ui.mw.TileBase.prototype.createTileContainer = function(_path, _jsonStructureTile, _oModel, _router) {
        var oTileContainer, oStandardTile, currentRoute, currentQuery;
        oTileContainer = new sap.m.FlexBox({
            justifyContent: sap.m.FlexJustifyContent.Center,
            alignItems: sap.m.FlexAlignItems.Center,
        }).addStyleClass('box');
        oStandardTile = new sap.m.StandardTile(_jsonStructureTile).addStyleClass("relocateTile");
        
        oTileContainer.bindAggregation("items", "/options", function (sId, oContext) {
            var oStandardTile;
            oStandardTile = new sap.m.StandardTile(oContext.getObject().option.id, _jsonStructureTile).addStyleClass("relocateTile");
            oStandardTile.attachPress(function(evt) {
                currentRoute = evt.getSource().getBindingContext().getObject().option.routeName;
                currentQuery = evt.getSource().getBindingContext().getObject().option.query;
                _router.navTo(currentRoute, { query: currentQuery });
            });
            return oStandardTile;
        });
        oTileContainer.setModel(_oModel);
        return oTileContainer;
    };

})();
