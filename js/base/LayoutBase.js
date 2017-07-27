(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.LayoutBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.LayoutBase', {});
    sap.ui.mw.LayoutBase.prototype.createForm = function(_id, _editable, _numCols, _title) {
        var oForm;
        oForm = new sap.ui.layout.form.SimpleForm(_id, {
            editable: _editable,
            maxContainerCols: _numCols,
            title: _title
        });
        return oForm;
    };
    sap.ui.mw.LayoutBase.prototype.createFlexBox = function(_id, _height, _width, _displayInline, _direction, _fitContainer, _renderType, _justifyContent, _alignItems) {
        var oFlexBox;
        oFlexBox= new sap.m.FlexBox(_id, {
            height: _height,
            width: _width,
            displayInline: _displayInline,
            direction: _direction,
            fitContainer: _fitContainer,
            renderType: _renderType,
            justifyContent: _justifyContent,
            alignItems: _alignItems
        });
        return oFlexBox;
    };



})();
