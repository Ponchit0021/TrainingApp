(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.ContainerBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.ContainerBase', {});
    sap.ui.mw.ContainerBase.prototype.createBar = function(_id, _contentLeft, _contentMiddle, _contentRight) {
        var oBar, contentLeftLength, contentMiddleLength, contentRightLength;
        oBar = new sap.m.Bar(_id, {});
        if (_contentLeft) {
            if ($.isArray(_contentLeft)) {
                contentLeftLength = _contentLeft.length;
                for (var i = 0; i < contentLeftLength; i++) {
                    oBar.addContentLeft(_contentLeft[i]);
                }
            } else {
                oBar.addContentLeft(_contentLeft);
            }
        }
        if (_contentMiddle) {
            if ($.isArray(_contentMiddle)) {
                contentMiddleLength = _contentMiddle.length;
                for (var i = 0; i < contentMiddleLength; i++) {
                    oBar.addContentMiddle(_contentMiddle[i]);
                }
            } else {
                oBar.addContentMiddle(_contentMiddle);
            }
        }

        if (_contentRight) {
            if ($.isArray(_contentRight)) {
                contentRightLength = _contentRight.length;
                for (var i = 0; i < contentRightLength; i++) {
                    oBar.addContentRight(_contentRight[i]);
                }
            } else {
                oBar.addContentRight(_contentRight);
            }

        }
        return oBar;
    };
    sap.ui.mw.ContainerBase.prototype.createPage = function(_id, _title, _showNavButton, _showHeader, _enableScrolling, _showFooter, _backFunction, _controller, _footerBar) {
        var oPage;
        oPage = new sap.m.Page(_id, {
            title: _title,
            showNavButton: _showNavButton,
            showHeader: _showHeader,
            enableScrolling: _enableScrolling,
            showFooter: _showFooter
        });
        if (_showNavButton) {
            oPage.attachNavButtonPress(_backFunction, _controller);
        }
        if (_footerBar) {
            oPage.setFooter(_footerBar);
        }
        return oPage;
    };
    sap.ui.mw.ContainerBase.prototype.createApp = function(_id, _stringApp, _masterPage, _detailPage, _defaultTransitionName) {
        var oApp;
        oApp = new sap.m.App(_id, {
            initalPage: _stringApp,
            defaultTransitionName: _defaultTransitionName

        });
        oApp.addPage(_masterPage).addPage(_detailPage);
        return oApp;
    };
    sap.ui.mw.ContainerBase.prototype.createIconTabBar = function(_id, _iconTabFilters, _select, _controller) {
        var oIconTabBar, iconTabFilterLength;
        iconTabFilterLength = _iconTabFilters.length;
        oIconTabBar = new sap.m.IconTabBar(_id, {
            expandable: false,
            expanded: true,
            select: [_select, _controller]
        });
        for (var i = 0; i < iconTabFilterLength; i++) {
            oIconTabBar.addItem(_iconTabFilters[i]);
        };
        return oIconTabBar;
    };
    sap.ui.mw.ContainerBase.prototype.createIconTabFilter = function(_id, _key, _icon, _text) {
        var oIconTabFilter;
        oIconTabFilter= new sap.m.IconTabFilter(_id, {
            key: _key,
            icon: _icon,
            text: _text
        });
        return oIconTabFilter;
    };
    sap.ui.mw.ContainerBase.prototype.createPanel = function(_id, _expandable, _expanded, _arrayContent, _headerToolbar, _infoToolbar ) {
        var oPanel;
        var oToolbar, oInfoToolbar, aContent;

        console.log(_arrayContent);
        if (_headerToolbar){
            oToolbar = _headerToolbar;
        } else {
            oToolbar = new sap.m.Toolbar();
        }

        if (_infoToolbar){
            oInfoToolbar = _infoToolbar;
        } else {
            oInfoToolbar = new sap.m.Toolbar();
        }

        if (Object.prototype.toString.call(_arrayContent) == '[object Array]'){
            aContent = _arrayContent;
        } else {
            aContent = [];
        }

        oPanel= new sap.m.Panel(_id, {
            expandable: false,
            expanded: true,
            //backgroundDesign: sap.m.BackgroundDesign.Translucent,
            //height: "auto",
            //headerToolbar: oToolbar,
            //infoToolbar: oInfoToolbar,
            content: aContent
        });
        return oPanel; 
    };
})();
