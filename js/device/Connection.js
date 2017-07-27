(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.device.Connection");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.device.Connection', {
        constructor: function() {
            if (navigator.connection.type == Connection.NONE) {
                sap.ui.getCore().AppContext.isConected = false;
            } else {
                sap.ui.getCore().AppContext.isConected = true;
            }
            document.addEventListener("online", this.onlineNetwork, false);
            document.addEventListener("offline",this.offlineNetwork, false);
        }
    });
    sap.ui.device.Connection.prototype.verifyNetwork = function() {
        var currentClass = this;
        if (navigator.connection.type == Connection.NONE) {
            sap.ui.getCore().AppContext.isConected = false;
            currentClass.offlineNetwork();
        } else {
            sap.ui.getCore().AppContext.isConected = true;
            currentClass.onlineNetwork();
        }

    };
    sap.ui.device.Connection.prototype.onlineNetwork = function() {
        var oButtonSync, oButtonProposal, oButtonApprovalIndividual, oButtonApprovalGroupal;
            console.log("NETWORK STATUS: ONLINE");
            sap.ui.getCore().AppContext.isConected = true;
            oButtonSync = sap.ui.getCore().byId("btnSync");
            oButtonSync.setEnabled(true);
            
            if (sap.ui.getCore().AppContext.bIsIndividualFormEnabled) {

            this.bIsCreating = sap.ui.getCore().AppContext.bIsCreating;
            if (sap.ui.getCore().byId("txtNciListasDeControl").getValue() != "" && this.bIsCreating == false) {
                oButtonProposal = sap.ui.getCore().byId("btnNciPropuesta");
                if (oButtonProposal) {
                    oButtonProposal.setEnabled(true);
                }
            }    
                oButtonApprovalIndividual = sap.ui.getCore().byId("btnNciPorAprobar");
                if (oButtonApprovalIndividual) {
                    oButtonApprovalIndividual.setEnabled(true);
                }
            }
            if (sap.ui.getCore().AppContext.bIsGroupalFormEnabled) {
                if (sap.ui.getCore().AppContext.bHasGroupalLoanID) {
                    oButtonApprovalGroupal = sap.ui.getCore().byId("btnForApprovalGroupal");
                    if (oButtonApprovalGroupal) {
                        oButtonApprovalGroupal.setEnabled(true);
                    }
                }
            }
    };
    sap.ui.device.Connection.prototype.offlineNetwork = function() {
        var oButtonApprovalIndividual, oButtonProposal, oButtonSync, oButtonApprovalGroupal;
            console.log("NETWORK STATUS: OFFLINE");
            sap.ui.getCore().AppContext.isConected = false;
            oButtonSync = sap.ui.getCore().byId("btnSync");
            oButtonProposal = sap.ui.getCore().byId("btnNciPropuesta");
            oButtonApprovalGroupal = sap.ui.getCore().byId("btnForApprovalGroupal");
            oButtonApprovalIndividual = sap.ui.getCore().byId("btnNciPorAprobar");

            if (oButtonSync) {
                oButtonSync.setEnabled(false);
            }
            if (oButtonProposal) {
                oButtonProposal.setEnabled(false);
            }
            if (oButtonApprovalGroupal) {
                oButtonApprovalGroupal.setEnabled(false);
            }
            if (oButtonApprovalIndividual) {
                oButtonApprovalIndividual.setEnabled(false);
            }
    };
})();
