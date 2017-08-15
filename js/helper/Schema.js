(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.helper.Schema");
    jQuery.sap.require("sap.ui.base.Object");
    sap.ui.base.Object.extend('sap.ui.helper.Schema', {});


    sap.ui.helper.Schema.prototype.getDataDBName = function() {

        return "dataDB"

    };


    sap.ui.helper.Schema.prototype.getSyncDBName = function() {

        return "syncDB"

    };

    sap.ui.helper.Schema.prototype.getNotiDBName = function() {

        return "notiDB"

    };

    sap.ui.helper.Schema.prototype.getRenoDBName = function() {

        return "renoDB"

    };

    sap.ui.helper.Schema.prototype.getDataDBSchema = function() {
        return [{
            singular: "Customer",
            plural: "CustomerSet",
            relations: {
                LinkSet: {
                    hasMany: "Link"
                }
            }
        }, {
            singular: "Guarantor",
            plural: "GuarantorSet",
            relations: {
                LinkGuarantorSet: {
                    hasMany: "LinkGuarantor"
                }
            }
        }, {
            singular: "LoanRequest",
            plural: "LoanRequestSet",
            relations: {
                LinkSet: {
                    hasMany: "Link"
                },
                LinkGuarantorSet: {
                    hasMany: "LinkGuarantor"
                }
            }
        }, {
            singular: "CrossSellingCandidate",
            plural: "CrossSellingCandidateSet",
            relations: {
                CrossSellOfferSet: {
                    hasMany: "CrossSellOffer"
                }
            }
        }, {
            singular: "CrossSellOffer",
            plural: "CrossSellOfferSet"
        }, {
            singular: "Link",
            plural: "LinkSet",
            relations: {
                LoanRequestSet: {
                    hasMany: "LoanRequest"
                },
                CustomerSet: {
                    hasMany: "Customer"
                },
            }
        }, {
            singular: "LinkGuarantor",
            plural: "LinkGuarantorSet",
            relations: {
                LoanRequestSet: {
                    hasMany: "LoanRequest"
                },
                GuarantorSet: {
                    hasMany: "Guarantor"
                },
            }
        }, {
            singular: "CustomerLoanRelationship",
            plural: "CustomerLoanRelationshipSet"
        }, {
            singular: "GuaranteeLoanRelationship",
            plural: "GuaranteeLoanRelationshipSet",
        }, {
            singular: "Insurance",
            plural: "InsuranceSet"
        }, {
            singular: "LinkInsurance",
            plural: "LinkInsuranceSet",
            relations: {
                InsuranceSet: {
                    hasMany: "Insurance"
                }
            }
        }, {
            singular: "GroupCrossSellGuarantorCandidate",
            plural: "GroupCrossSellGuarantorCandidateSet"
        }, {
            singular: "GroupCrossSellAssignedGuarantor",
            plural: "GroupCrossSellAssignedGuarantorSet"
        }];

    };

    sap.ui.helper.Schema.prototype.getSyncDBSchema = function() {
        return [{
            singular: "RequestQueueCustomer",
            plural: "RequestQueueCustomerSet"
        }, {
            singular: "RequestQueueLoanRequest",
            plural: "RequestQueueLoanRequestSet"
        }, {
            singular: "RequestQueueInsurance",
            plural: "RequestQueueInsuranceSet"
        }, {
            singular: "RequestQueueGuarantor",
            plural: "RequestQueueGuarantorSet"
        }, {
            singular: "RequestQueueCrossSellOffer",
            plural: "RequestQueueCrossSellOfferSet"
        }, {
            singular: "LoanRequestCustomerRelation",
            plural: "LoanRequestCustomerRelationSet"
        }, {
            singular: "InsuranceLoanRequestRelation",
            plural: "InsuranceLoanRequestRelationSet"
        }, {
            singular: "BusinessErrorLoanRequest",
            plural: "BusinessErrorLoanRequestSet"
        }, {
            singular: "BusinessErrorCustomer",
            plural: "BusinessErrorCustomerSet"
        }, {
            singular: "BusinessErrorInsurance",
            plural: "BusinessErrorInsuranceSet"
        }, {
            singular: "BusinessErrorGuarantor",
            plural: "BusinessErrorGuarantorSet"
        }, {
            singular: "SystemErrorNotification",
            plural: "SystemErrorNotificationSet"
        }];

    };

    sap.ui.helper.Schema.prototype.getNotiDBSchema = function() {
        return [{
            singular: "InsuranceSystemNotification",
            plural: "InsuranceSystemNotificationSet"
        }, {
            singular: "CustomerSystemNotification",
            plural: "CustomerSystemNotificationSet"
        }, {
            singular: "CrossSellSystemNotification",
            plural: "CrossSellSystemNotificationSet"
        }];
    };

    sap.ui.helper.Schema.prototype.getRenoDBSchema = function() {
        return [{
            singular: "Renovation",
            plural: "RenovationSet"
        }];
    }

})();