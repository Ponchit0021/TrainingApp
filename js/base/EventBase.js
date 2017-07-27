(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.EventBase");
    jQuery.sap.require("sap.ui.base.Object");

    /**
     * [constructor for attachEvent to current control]
     * @param  {[type]} _fnEvent) { this.fnCurrentEvetn [current function in the use controller]
     * @param  {[type]} }        [description]
     * @return {[type]}           [description]
     */
    sap.ui.base.Object.extend('sap.ui.mw.EventBase', {
        constructor: function(_fnEvent) {
            if (_fnEvent !== undefined) {
                this.fnCurrentEvent = _fnEvent;
            }
        }
    });

    /**
     * [addTouchEvent add touchStart event for current control]
     * @param {[type]} _oControl [current control to add an event]
     */
    sap.ui.mw.EventBase.prototype.addTouchEvent = function(_oControl) {
        _oControl.attachBrowserEvent('touchstart', this.fnCurrentEvent);
    };

    sap.ui.mw.EventBase.prototype.backEvent = function(oController, _name) {
        var oHistory, oPreviousHash, oFunction;
        console.log("-->traer el get");
        if (oController.type !== "backbutton") {
            oHistory = sap.ui.core.routing.History.getInstance();
            oPreviousHash = oHistory.getPreviousHash();
            if (oPreviousHash !== undefined) {
                if (_name) {
                    sap.ui.core.UIComponent.getRouterFor(oController).navTo(_name, {}, true /*no history*/ );
                } else {
                    window.history.go(-1);
                }
            } else {
                sap.ui.core.UIComponent.getRouterFor(oController).navTo("", {}, true /*no history*/ );
            }
        } else {
            if (sap.ui.getCore().AppContext.EventBase.getObjectToCloseWithBackEvent() === undefined) {
                window.history.go(-1);
            } else {
                if (typeof sap.ui.getCore().AppContext.EventBase.getFunctionBackButtonWithOpenDialog() !== "undefined" && sap.ui.getCore().AppContext.EventBase.getObjectToCloseWithBackEvent().isOpen()) {
                    sap.ui.getCore().AppContext.EventBase.doFunctionBackButtonWithOpenDialog();
                }
            }
        }
    };

    sap.ui.mw.EventBase.prototype.setObjectToCloseWithBackEvent = function(ObjectToClose) {
        this.ObjectToClose = ObjectToClose;
    };
    sap.ui.mw.EventBase.prototype.getObjectToCloseWithBackEvent = function() {
        return this.ObjectToClose;
    };
    sap.ui.mw.EventBase.prototype.setFunctionBackButtonWithOpenDialog = function(fnCurrentBackEvent) {
        this.fnCurrentBackEvent = fnCurrentBackEvent;
    };
    sap.ui.mw.EventBase.prototype.getFunctionBackButtonWithOpenDialog = function() {
        return this.fnCurrentBackEvent;
    };
    sap.ui.mw.EventBase.prototype.doFunctionBackButtonWithOpenDialog = function() {
        this.fnCurrentBackEvent();
    };

})();
