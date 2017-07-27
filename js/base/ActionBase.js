(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.ActionBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.ActionBase', {});
    sap.ui.mw.ActionBase.prototype.createButton = function(_id, _text, _type, _icon, _event, _oController) {
        var oButton;
        oButton= new sap.m.Button(_id, {
            type: _type,
            icon: _icon,
            text: _text,
            press: [_event, _oController]
        });
        return oButton;
    };
	sap.ui.mw.ActionBase.prototype.createActionSheet = function(_id, _placement, _arrayButtons) {
        var oActionSheet;
        var oActionSheet = new sap.m.ActionSheet(_id,{
			//title : _title,
			//showCancelButton : true,
			placement : _placement,
			buttons : _arrayButtons
		}).addStyleClass('sapUiSizeCompact');
        return oActionSheet;
    }

})();
