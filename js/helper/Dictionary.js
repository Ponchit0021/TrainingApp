(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.helper.Dictionary");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.helper.Dictionary', {});

    sap.ui.helper.Dictionary.prototype.oResults = {

        OK: "OK"

    };

    sap.ui.helper.Dictionary.prototype.oCollections = {
        CustomerSet: "CustomerSet",
        LoanRequestSet: "LoanRequestSet",
        InsuranceSet: "InsuranceSet",
        LinkSet: "LinkSet",
        LinkGuarantorSet: "LinkGuarantorSet",
        GuarantorSet: "GuarantorSet",
        CrossSellingCandidateSet: "CrossSellingCandidateSet",
        CrossSellOfferSet: "CrossSellOfferSet",
        GroupCrossSellGuarantorCandidateSet: "GroupCrossSellGuarantorCandidateSet",
        GroupCrossSellAssignedGuarantorSet: "GroupCrossSellAssignedGuarantorSet"

    };

    sap.ui.helper.Dictionary.prototype.oTypes = {
        Customer: "Customer",
        LoanRequest: "LoanRequest",
        Insurance: "Insurance",
        Link: "Link",
        LinkGuarantor: "LinkGuarantor",
        LinkInsurance: "LinkInsurance",
        LoanRequestCustomerRelation: "LoanRequestCustomerRelation",
        InsuranceLoanRequestRelationSet: "InsuranceLoanRequestRelationSet",
        CustomerLoanRelationship: "CustomerLoanRelationship",
        GuaranteeLoanRelationship: "GuaranteeLoanRelationship",
        Guarantor: "Guarantor",
        CrossSellingCandidate: "CrossSellingCandidate",
        CrossSellOffer: "CrossSellOffer",
        GroupCrossSellGuarantorCandidate: "GroupCrossSellGuarantorCandidate",
        GroupCrossSellAssignedGuarantor: "GroupCrossSellAssignedGuarantor"
    };
    sap.ui.helper.Dictionary.prototype.oDataTypes = {
        Customer: "/CustomerSet",
        LoanRequest: "/LoanRequestSet",
        Insurance: "/InsuranceSet",
        Link: "/LinkSet",
        CrossSellingCandidate: "/CrossSellingCandidateSet",
        CrossSellOffer: "/CrossSellOfferSet",
        GroupCrossSellGuarantorCandidate: "/GroupCrossSellGuarantorCandidateSet",
        GroupCrossSellAssignedGuarantor: "/GroupCrossSellAssignedGuarantorSet"
    };

    sap.ui.helper.Dictionary.prototype.oMethods = {
        POST: "POST",
        PUT: "PUT",
        GET: "GET"
    };


    sap.ui.helper.Dictionary.prototype.oQueues = {
        Customer: "RequestQueueCustomer",
        LoanRequest: "RequestQueueLoanRequest",
        Insurance: "RequestQueueInsurance",
        Renovation: "Renovation",
        Message: "Message",
        Link: "RequestQueueLink",
        Guarantor: "RequestQueueGuarantor",
        CrossSellingCandidate: "RequestQueueCrossSellingCandidate",
        CrossSellOffer: "RequestQueueCrossSellOffer",
        GroupCrossSellGuarantorCandidate: "RequestQueueGroupCrossSellGuarantorCandidate",
        GroupCrossSellAssignedGuarantor: "RequestQueueGroupCrossSellAssignedGuarantor",
        InsuranceSystemNotification: "InsuranceSystemNotification",
        CrossSellSystemNotification: "CrossSellSystemNotification",
        CustomerSystemNotification: "CustomerSystemNotification",
        LoanRequestSystemNotification: "LoanRequestSystemNotification",
        CrossSellBatch: "CrossSellBatch"
    };

    sap.ui.helper.Dictionary.prototype.oErrors = {
        Customer: "BusinessErrorCustomer",
        LoanRequest: "BusinessErrorLoanRequest",
        Insurance: "BusinessErrorInsurance",
        Guarantor: "BusinessErrorGuarantor",
        CrossSellingCandidate: "BusinessErrorCrossSellingCandidate",
        CrossSellOffer: "BusinessErrorCrossSellOffer",
        GroupCrossSellGuarantorCandidate: "BusinessErrorGroupCrossSellGuarantorCandidate",
        GroupCrossSellAssignedGuarantor: "BusinessErrorGroupCrossSellAssignedGuarantor",
        Notification: "SystemErrorNotification"
    };

    sap.ui.helper.Dictionary.prototype.oRequestStatus = {
        Initial: "Initial",
        Sent: "Sent",
        Error: "Error",
        BusinessError: "BusinessError"
    };
    sap.ui.helper.Dictionary.prototype.oDataRequest = function(_params) {
        return {
            CustomerSet: {
                pouch: {
                    name: "CustomerSet",
                    entityName: "Customer",
                    entitySet: "CustomerSet",
                },
                odata: {
                    name: "CustomerSet",
                    get: {
                        filterDetail: "$filter=CustomerIdMD eq '" + _params.CustomerIdMD + "'&$expand=AddressSet,PhoneSet,LinkSet,PersonalReferenceSet,EmployerSet,ImageSet",
                        filter: {
                            customer: "$filter=CollaboratorID eq '" + _params.promoterID + "'&$expand=AddressSet,PersonalReferenceSet,PhoneSet,ImageSet,EmployerSet",
                            loanRequest: "$filter=CollaboratorID eq '" + _params.promoterID + "' and BpMainData/StatusId eq 'E0006' and BpMainData/ProductId eq '" + _params.productID + "'",
                            BPIdCRM: "$filter=BPIdCRM eq '" + _params.BPIdCRM + "'"
                        },

                        expand: "?$expand=AddressSet,PhoneSet,LinkSet,PersonalReferenceSet,EmployerSet,ImageSet",
                        expandList: "$expand=AddressSet,PhoneSet,LinkSet,PersonalReferenceSet,EmployerSet,ImageSet",
                        expandDetail: "&$expand=LinkSet,ImageSet,LinkSet/Customer"
                    }
                }
            },
            LoanRequestSet: {
                pouch: {
                    entityName: "LoanRequest",
                    entitySet: "LoanRequestSet",
                    name: "LoanRequestSet"
                },
                odata: {
                    name: "LoanRequestSet",
                    get: {
                        filter: "$filter=CollaboratorID eq '" + _params.promoterID + "'",
                        filterDetail: "$filter=LoanRequestIdMD eq '" + _params.LoanRequestIdMD + "'&$expand=LinkSet,LinkSet/Customer,LinkGuarantorSet,LinkGuarantorSet/Guarantor,LinkGuarantorSet/Guarantor/PhoneSet,LinkGuarantorSet/Guarantor/AddressSet,ImageSet,GroupCrossSellAssignedGuarantorSet",
                        expand: "?$expand=LinkSet,LinkSet/Customer,LinkGuarantorSet,LinkGuarantorSet/Guarantor,LinkGuarantorSet/Guarantor/PhoneSet,LinkGuarantorSet/Guarantor/AddressSet,ImageSet,GroupCrossSellAssignedGuarantorSet"
                    }
                }
            },
            InsuranceSet: {
                pouch: {
                    entityName: "Insurance",
                    entitySet: "InsuranceSet",
                    name: "InsuranceSet"
                },
                odata: {
                    name: "InsuranceSet",
                    get: {
                        filter: "",
                        expand: ""
                    }
                }
            },
            GuarantorSet: {
                pouch: {
                    entityName: "Guarantor",
                    entitySet: "GuarantorSet"
                },
                odata: {
                    name: "GuarantorSet",
                    get: {
                        filterDetail: "$filter=CustomerIdMD eq '" + _params.CustomerIdMD + "'&$expand=AddressSet,PhoneSet,LinkGuarantorSet,PersonalReferenceSet,EmployerSet,ImageSet",
                        filter: "$filter=CustomerIdMD eq '" + _params.CustomerIdMD + "'",
                        expand: "?$expand=AddressSet,PhoneSet,LinkGuarantorSet,PersonalReferenceSet,EmployerSet,ImageSet",
                        filterAvFReqExpand: "?$filter=IsAvailableForReq eq true & $expand=AddressSet,PhoneSet,LinkGuarantorSet,PersonalReferenceSet,EmployerSet,ImageSet",
                        expandList: "$expand=AddressSet,PhoneSet,LinkSet,PersonalReferenceSet,EmployerSet,ImageSet"
                    }
                }
            },
            CrossSellingCandidateSet: {
                pouch: {
                    entityName: "CrossSellingCandidate",
                    entitySet: "CrossSellingCandidateSet"
                },
                odata: {
                    name: "CrossSellingCandidateSet",
                    get: {
                        filterDetail: "$filter=CandidateIdCRM eq '" + _params.CandidateIdCRM + "'&$expand=CrossSellOfferSet",
                        filterCandidates: "$filter=CollaboratorID eq '" + _params.promoterID + "'&$expand=CrossSellOfferSet",
                        expand: ""
                    }
                }
            },
            CrossSellOfferSet: {
                pouch: {
                    entityName: "CrossSellOffer",
                    entitySet: "CrossSellOfferSet"
                },
                odata: {
                    name: "CrossSellOfferSet",
                    get: {
                        filter: "$filter=CollaboratorID eq '" + _params.promoterID + "'",
                    }
                }
            },
            GroupCrossSellGuarantorCandidateSet: {
                pouch: {
                    entityName: "GroupCrossSellGuarantorCandidate",
                    entitySet: "GroupCrossSellGuarantorCandidateSet"
                },
                odata: {
                    name: "GroupCrossSellGuarantorCandidateSet",
                    get: {
                        filter: "$filter=CollaboratorID eq '" + _params.promoterID + "' and  LoanRequestIdCRM eq '" + _params.loanRequestID + "'",
                        expand: ""
                    }
                }
            },
            GroupCrossSellAssignedGuarantorSet: {
                pouch: {
                    entityName: "GroupCrossSellAssignedGuarantor",
                    entitySet: "GroupCrossSellAssignedGuarantorSet"
                },
                odata: {
                    name: "GroupCrossSellAssignedGuarantorSet",
                    get: {
                        filter: "$filter=CollaboratorID eq '" + _params.promoterID + "'",
                        expand: ""
                    }
                }
            },
            getRequest: function(_oType) {
                var value = eval("this." + _oType);
                return value;
            }
        }
    };

    sap.ui.helper.Dictionary.prototype.oInsurance = {
        duracionMensaje: 4000,
        claveCreditoMujer: "C_GRUPAL_CM",
        claveCreditoComerciante: "C_GRUPAL_CCR",
        claveCreditoIndividual: "C_IND_CI",
        modalidadIndividual: "001",
        modalidadFamiliar: "002",
        tipoBeneficiario: "00001100",
        tipoAseguradoFam: "Z0001100"
    };

})();