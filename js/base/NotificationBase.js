(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.NotificationListItem");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.NotificationListItem', {});
    sap.ui.mw.NotificationListItem.prototype.createNotificationAO = function(_name, _comments, _bpidcrm, _observation, _documenttype,_observationID, _read, _function, _objectTypeID) {
        sap.m.NotificationListItem.extend('listItemAO', {
            metadata: {
                properties: {
                    "name": "string",
                    "comments": "string",
                    "bpidcrm": "string",
                    "observation": "string",
                    "documenttype": "string",
                    "read": false,
                    "priority": "string"
                },
                aggregations: {
                    _button: {
                        type: "sap.m.Button",
                        multiple: false
                    }
                },
                events: {
                    press: {}
                }
            },
            init: function() {
                this.setAggregation("_button", new sap.m.Button({
                    type: sap.m.ButtonType.Emphasized,
                    icon: _objectTypeID === "2" ? "sap-icon://detail-view" : _observationID ==="85"?"sap-icon://leads" : "sap-icon://add-photo",
                    press: this.firePress.bind(this)
                }));
            },
            renderer: function(oRm, oControl) {

                oRm.write("<div class='container'>");
                if (oControl.getRead() === "1") {
                    oRm.write("<div class='sapMNotiContentPriority sapMNotiContentPriorityRead'></div>");

                } else {
                    oRm.write("<div class='sapMNotiContentPriority sapMNotiContentPriorityUnRead'></div>");

                }
                oRm.write("<div class='sapMNotiContent'>");
                oRm.write("<div class='sapMNotiHeaderContent'>");
                if (oControl.getRead() === "1") {
                    oRm.write("<div class='sapMNLB-Header sapMNLI-Header sapMTitleAO'><span class=''>" + oControl.getName() + "</span></div>");
                } else {
                    oRm.write("<div class='sapMNLB-Header sapMNLI-Header sapMTitleAO'><span class=''><b>" + oControl.getName() + "</b></span></div>");

                }
                oRm.write("<div class='sapMNotiAO sapMNotiAOSpace'>" + oControl.getComments() + "</div>");
                if (oControl.getRead() === "1") {
                    oRm.write("<div class='sapMNotiAO sapMNotiAONumber'>ID: " + oControl.getBpidcrm() + " </div>");

                } else {
                    oRm.write("<div class='sapMNotiAO sapMNotiAONumber'><b>ID: " + oControl.getBpidcrm() + "</b> </div>");
                }

                oRm.write("</div>");
                oRm.write("<div class='sapMNotiLegendsContent'>");
                oRm.write("<div class='sapMNotiLegends'>");

                if (oControl.getRead() === "1") {
                    oRm.write("<div class='sapMNotiAO sapMNotiAORight'>" + oControl.getDocumenttype() + " </div>");
                } else {
                    oRm.write("<div class='sapMNotiAO sapMNotiAORight'><b>" + oControl.getDocumenttype() + " </b></div>");
                }

                oRm.write("<div class='sapMNotiAO sapMNotiAORight'>" + oControl.getObservation() + " </div>");
                oRm.write("</div>");

                oRm.write("<div class='buttonBarAO'>");
                oRm.renderControl(oControl.getAggregation("_button"));
                oRm.write("</div>");
                oRm.write("</div>");
                oRm.write("</div>");
                oRm.write("</div>");
            }
        });
        return new listItemAO({
            name: _name,
            comments:_comments,
            bpidcrm:_bpidcrm,
            observation: _observation,
            documenttype: _documenttype,
            read: _read,
            press:_function/// function() { console.log("testing press multiple"); }
        });
    };

})();
