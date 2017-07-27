(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.PopupBase");
    jQuery.sap.require("sap.ui.base.Object", "sap.m.MessageBox");

    sap.ui.base.Object.extend('sap.ui.mw.PopupBase', {});
    sap.ui.mw.PopupBase.prototype.createDialog = function(_id, _title, _type, _icon, _height,_width,_button,_content) {
        var oDialog = new sap.m.Dialog(_id, {
            title: _title,
            type: _type,
            icon: _icon,
            contentHeight: _height,
            contentWidth:_width,
            buttons:_button,
            content:_content

        });

        return oDialog;

    };
    sap.ui.mw.PopupBase.prototype.createTableDialog = function(_id, _title, _search, _liveChange, _arrayColumns) {
        var oTableSelectDialog, aColumns;

        if (Object.prototype.toString.call(_arrayColumns) == '[object Array]') {
            aColumns = _arrayColumns;
        } else {
            aColumns = [];
        }

        var oTableSelectDialog = new sap.m.TableSelectDialog(_id, {
            title: _title,
            search: _search,
            liveChange: _liveChange,
            columns: aColumns
        });

        return oTableSelectDialog;
    };
    sap.ui.mw.PopupBase.prototype.createMessageBox = function(_title, _text, _actions, _method) {
        var actions = _actions ? _actions : ["Aceptar", sap.m.MessageBox.Action.CANCEL];
        return sap.m.MessageBox.show(_text, {
            title: _title,
            actions: actions,
            onClose: _method
        });
    };

})();
