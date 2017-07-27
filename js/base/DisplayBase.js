(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.DisplayBase");
    jQuery.sap.require("sap.ui.base.Object");



    sap.ui.base.Object.extend('sap.ui.mw.DisplayBase', {});

    sap.ui.mw.DisplayBase.prototype.createLabel = function(_id, _label) {
        var oLabel = new sap.m.Label(_id, {
            text: _label
        });
        return oLabel;
    };
    sap.ui.mw.DisplayBase.prototype.createText = function(_id, _text) {
        var oText = new sap.m.Text(_id, {
            text: _text
        });
        return oText;
    };
    sap.ui.mw.DisplayBase.prototype.createImage = function(_id, _src, _style) {
        var oImage = new sap.m.Image(_id, {
            src: _src
        }).addStyleClass(_style);
        return oImage;
    };
    sap.ui.mw.DisplayBase.prototype.createTitle = function(_id, _text) {
        var oTitle = new sap.ui.core.Title(_id, {
            text: _text
        });
        return oTitle;
    };
    sap.ui.mw.DisplayBase.prototype.labelTitle = function(_id, _text) {
        var oTitle = new sap.ui.core.Title(_id, {
            text: _text,
            level : sap.ui.core.TitleLevel.H6
        });
        return oTitle;
    };
    sap.ui.mw.DisplayBase.prototype.createSignatureCanvas = function(_id, _styleClass) {
        var signature = '<div id="sketch" style= "width: 100%; height: 100%; position: relative;"><canvas id="' + _id + '" class="' + _styleClass + '"></canvas></div>';
        var ohtml = new sap.ui.core.HTML({
            preferDOM: true,
            content: signature
        });
        return ohtml;
    };
    sap.ui.mw.DisplayBase.prototype.createIcon = function(_id, _src, _size) {
        var oIcon = new sap.ui.core.Icon(_id, {
            src: _src,
            size: _size
        });
        return oIcon;
    };
    sap.ui.mw.DisplayBase.prototype.createLabelHTML = function(_id, _style, _text) {
        var content = '<div id =' + _id + ' class="' + _style + '">' + _text + '</div>';
        var ohtml = new sap.ui.core.HTML({
            preferDOM: true,
            content: content
        });
        return ohtml;
    };
    sap.ui.mw.DisplayBase.prototype.createMapsContent = function(_id, _mapsStyle) {
        var mapsContent = '<div id=' + _id + ' class="' + _mapsStyle + '">' +
            '</div>';
        var oHTML = new sap.ui.core.HTML({
            preferDOM: true,
            content: mapsContent
        });

        return oHTML;
    };
    sap.ui.mw.DisplayBase.prototype.createReaderPDF = function(_id, _style) {
        var content = '<embed src=' + _id + ' class="' + _style + '">';
        var oHTML = new sap.ui.core.HTML({
            preferDOM: true,
            content: content
        });
        return oHTML;
    };
    sap.ui.mw.DisplayBase.prototype.formatDate = function(_value, _format) {
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
            pattern: _format
        });

        var returnValue = dateFormat.format(new Date(_value));

        return returnValue;
    };
    /**
     * [formatJSONDate conversión de fecha javascript a date para oData]
     * @param  {[date]} _oDate      [Date javascript]
     * @return {[String]}           [string con formato oData]
     */
    sap.ui.mw.DisplayBase.prototype.formatJSONDate = function(_oDate) {
        if (_oDate) {
            if (_oDate != null) {
                if (typeof _oDate.getTime != "undefined") {
                    return "/Date(" + _oDate.getTime() + ")/";
                }
            }
        }
        return _oDate;
    };

    sap.ui.mw.DisplayBase.prototype.retrieveJSONDate = function(_sDate) {

        if (typeof _sDate == "string") {

            if (_sDate.indexOf("/Date(") >= 0) {
                var sDate;
                sDate = _sDate.replace("/Date(", "").replace(")/", "");

                return new Date(parseInt(sDate));

            }

        } else {
            return _sDate;
        }

        

    };

    sap.ui.mw.DisplayBase.prototype.retrieveUTCDate = function(_oDate) {

        if (_oDate instanceof Date) {

            var offsetInMs = ((_oDate.getTimezoneOffset() * 60)  * 1000);                          

            return new Date(_oDate.getTime() + offsetInMs);


        } else {


            return null;
        }


    };

})();
