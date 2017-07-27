jQuery.sap.declare("com.gentera.Component");

sap.ui.core.UIComponent.extend("com.gentera.Component", {
    metadata: {
        routing: {
            config: {

                "routerClass": "sap.m.routing.Router",
                "viewType": "JS",
                "viewPath": "originacion",
                "controlId": "navContainer",
                "controlAggregation": "pages",
                "transition": "slide",
                "bypassed": {
                    "target": "notFound"
                }
            },
            routes: [{
                pattern: "announcements/:?query:",
                name: "announcementList",
                target: "announcements"
            }, {
                pattern: "applicants/:?query:",
                name: "applicantList",
                target: "applicants"
            }, {
                pattern: "applicants/{applicantId}/detail:?query:",
                name: "applicantsDetail",
                target: "applicantsDetail"
            }, {
                pattern: "applications/:?query:",
                name: "applicationList",
                target: "applications"
            }, {
                pattern: "",
                name: "DashBoard",
                target: "home"
            }, {
                pattern: "documents/:?query:",
                name: "documentList",
                target: "documents"
            }, {
                pattern: "groupalapplication/{grupalTypeID}/{loanRequestId}/detail:?query:",
                name: "groupalApplication",
                target: "groupalapplication"
            }, {
                pattern: "IndividualApplications",
                name: "IndividualApplications",
                view: "IndividualApplications"
            }, {
                pattern: "IndividualApplications/{aplicationId}/detail:?query:",
                name: "IndividualApplications",
                view: "IndividualApplications"
            }, {
                pattern: "mypendings/:?query:",
                name: "pendingList",
                target: "mypendings"
            }, {
                pattern: "PdfReader",
                name: "PdfReader",
                view: "PdfReader"
            }, {
                pattern: "PrivacyNotice",
                name: "PrivacyNotice",
                view: "PrivacyNotice"
            }, {
                pattern: "renovations",
                name: "renovationList",
                target: "renovations"
            }, {
                pattern: "SyncErrorQueue",
                name: "SyncErrorQueue",
                view: "SyncErrorQueue"
            }, {
                pattern: "insuranceprospects/:?query:",
                name: "insuranceMaster",
                target: "insuranceprospects"
            }, {
                pattern: "insuranceprospects/{LoanRequestIdCRM}/{CustomerIdCRM}/detail:?query:",
                name: "insuranceDetails",
                target: "insuranceprospect"
            }, {
                pattern: "guarantors/:?query:",
                name: "guarantorList",
                target: "guarantors"
            }, {
                pattern: "guarantors/{guarantorId}/detail:?query:",
                name: "guarantorsDetail",
                target: "guarantorsDetail"
            }, {
                pattern: "syncresults",
                name: "syncResultsList",
                target: "syncresults"
            }, {
                pattern: "about",
                name: "about",
                target: "about"
            }, {
                pattern: "crosssell",
                name: "crossSellDashboard",
                target: "crosssell"
            }, {
                pattern: "crossselloffer/{productId}/{candidateId}/detail:?query:",
                name: "crossSellOffer",
                target: "crossselloffer"
            }, {
                pattern: "crosssellcandidates",
                name: "crossSellCandidates",
                target: "crosssellcandidates"
            }, {
                pattern: "crosssellofflinecandidates/:?query:",
                name: "crossSellOfflineCandidateList",
                target: "crosssellofflinecandidates"
            }, {
                pattern: "crosssellproducts/{candidateId}",
                name: "crossSellProductList",
                target: "crosssellproducts"
            }, {
                pattern: "crosssellapplication/{aplicationId}/detail:?query:",
                name: "crossSellApplication",
                target: "crosssellapplication"
            }],
            targets: {

                syncresults: {
                    viewName: "SyncResults",
                    viewLevel: 2,
                    transition: "slide"
                },

                documents: {
                    viewName: "Documents",
                    viewLevel: 4,
                    transition: "slide"
                },
                guarantors: {
                    viewName: "GuarantorList",
                    viewLevel: 2,
                    transition: "slide"
                },
                guarantorsDetail: {
                    viewName: "GuarantorDetail",
                    viewLevel: 3
                },
                home: {
                    viewName: "DashBoard",
                    viewLevel: 1
                },
                announcements: {
                    viewName: "Announcements",
                    viewLevel: 2
                },
                applicants: {
                    viewName: "ApplicantList",
                    viewLevel: 2
                },
                applicantsDetail: {
                    viewName: "ApplicantDetail",
                    viewLevel: 3
                },
                applications: {
                    viewName: "Applications",
                    viewLevel: 2
                },
                groupalapplication: {
                    viewName: "GroupalApplication",
                    viewLevel: 3
                },
                renovations: {
                    viewName: "Renovations",
                    viewLevel: 2,
                    transition: "slide"
                },
                mypendings: {
                    viewName: "MyPendings",
                    viewLevel: 2,
                    transition: "slide"
                },
                insuranceprospects: {
                    viewName: "InsuranceMaster",
                    viewLevel: 2
                },
                insuranceprospect: {
                    viewName: "InsuranceDetails",
                    viewLevel: 3
                },
                about: {
                    viewName: "About",
                    viewLevel: 2,
                    transition: "slide"
                },
                notFound: {
                    viewName: "NotFound",
                    viewType: "XML",
                    transition: "show"
                },
                crosssell: {
                    viewName: "CrossSellDashBoard",
                    viewLevel: 2
                },
                crossselloffer: {
                    viewName: "CrossSellOffer",
                    transition: "slide"
                },
                crosssellcandidates: {
                    viewName: "CrossSellCandidates",
                    viewLevel: 3,
                    transition: "slide"
                },
                crosssellofflinecandidates: {
                    viewName: "CrossSellOfflineCandidateList",
                    viewLevel: 3
                },
                crosssellproducts: {
                    viewName: "CrossSellProductList",
                    viewLevel: 4
                },
                crosssellapplication: {
                    viewName: "CrossSellApplication",
                    transition: "slide"
                },
            }
        }
    }
});

com.gentera.Component.prototype.init = function() {
    jQuery.sap.require("sap.ui.core.routing.History");
    jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

    sap.ui.core.UIComponent.prototype.init.apply(this);
    var router = this.getRouter();
    this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);
    router.initialize();
};
com.gentera.Component.prototype.destroy = function() {
    if (this.routeHandler) {
        this.routeHandler.destroy();
    }
    sap.ui.core.UIComponent.destroy.apply(this, arguments);
};
com.gentera.Component.prototype.createContent = function() {
    this.view = sap.ui.view({
        id: "app",
        viewName: "originacion.App",
        type: sap.ui.core.mvc.ViewType.JS
    });
    return this.view;
};
