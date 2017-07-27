(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.validations.applicant");
    jQuery.sap.require("sap.ui.base.Object");
    sap.ui.base.Object.extend('sap.ui.validations.applicant', {
        constructor: function(_oModel) {
            this.oModel = _oModel;
            this.validated = true;
            this.currentTab = "";
            this.isTab = false;
            this.message = "";
        }
    });
    sap.ui.validations.applicant.prototype.init = function() {
        var rules, validator;

        jQuery.sap.require("js.validations.BaseValidator", "js.validations.applicants.Rules");
        validator = new sap.ui.validations.base();
        rules = new sap.rules.Applicant();
        validator.evaluate(this, rules.getStructure());
        if (this.validated) {
            this.runValidations(rules.getValidations());
        }
    };
    sap.ui.validations.applicant.prototype.runValidations = function(_exp) {
        _exp.validations.some(function(validation) {
            var entityValue = this.oModel.getProperty(validation.path);
            var arrayStatus = validation.statusId;
            var statusId = this.oModel.getProperty("/results/0/BpMainData/StatusId");
            for (var i = 0; i < arrayStatus.length; i++) {
                if (statusId === arrayStatus[i]) {
                    if (validation.required && !this.validateRequired(entityValue)) {
                        sap.m.MessageToast.show(_exp.message);
                        this.currentTab = validation.tabError;
                        this.validated = false;
                        this.isTab = validation.isTab;
                        return true;
                    }
                }
            }
        }.bind(this));
    };

    sap.ui.validations.applicant.prototype.validateRequired = function(_value) {
        if (_value != null && _value != undefined && _value !== '') {
            return true;
        } else {
            return false;
        }
    };
    sap.ui.validations.applicant.prototype.validatePhoneAndAddress = function(_exp) {
        var statusId, entityPhone, entityAddress;
        statusId = this.oModel.getProperty("/results/0/BpMainData/StatusId");



        if (statusId == _exp.rules[0].interested[0].statusId) {
            // INTERESADO
            entityPhone = this.oModel.getProperty("/results/0/" + _exp.rules[0].interested[0].entityPhone + "/results");
            entityAddress = this.oModel.getProperty("/results/0/" + _exp.rules[0].interested[0].entityAddress + "/results");
            if (entityPhone.length < _exp.rules[0].interested[0].minimum && entityAddress.length < _exp.rules[0].interested[0].minimum) {
                sap.m.MessageToast.show(_exp.rules[0].interested[0].message);
                this.currentTab = _exp.tabError;
                this.validated = false;
                this.isTab = _exp.isTab;
                return;
            }

        }
        if (statusId == _exp.rules[1].originProcess[0].statusId) {
            entityPhone = this.oModel.getProperty("/results/0/" + _exp.rules[1].originProcess[0].entityPhone + "/results");
            entityAddress = this.oModel.getProperty("/results/0/" + _exp.rules[1].originProcess[0].entityAddress + "/results");

            if (entityPhone.length < _exp.rules[1].originProcess[0].minimum) {
                sap.m.MessageToast.show(_exp.rules[1].originProcess[0].message);
                this.currentTab = _exp.rules[1].originProcess[0].phoneTab;
                this.validated = false;
                this.isTab = _exp.isTab;
                return;
            }

            if (entityAddress.length < _exp.rules[1].originProcess[0].minimum) {
                sap.m.MessageToast.show(_exp.rules[1].originProcess[0].message);
                this.currentTab = _exp.rules[1].originProcess[0].addressTab;
                this.validated = false;
                this.isTab = _exp.isTab;
                return;
            } else {
                var isMainAddress = false;
                entityAddress.forEach(function(object) {
                    if (object.IsMainAddress) {
                        isMainAddress = true;
                    }
                }.bind(this));
                if (!isMainAddress) {
                    sap.m.MessageToast.show(_exp.rules[1].originProcess[0].messageMainAddress);
                    this.currentTab = _exp.rules[1].originProcess[0].addressTab;
                    this.validated = false;
                    this.isTab = _exp.isTab;
                }


            }

        }

        if (statusId == _exp.rules[2].updateData[0].statusId) {
            entityPhone = this.oModel.getProperty("/results/0/" + _exp.rules[2].updateData[0].entityPhone + "/results");
            entityAddress = this.oModel.getProperty("/results/0/" + _exp.rules[2].updateData[0].entityAddress + "/results");

            if (entityPhone.length < _exp.rules[2].updateData[0].minimum) {
                sap.m.MessageToast.show(_exp.rules[2].updateData[0].message);
                this.currentTab = _exp.rules[2].updateData[0].phoneTab;
                this.validated = false;
                this.isTab = _exp.isTab;
                return;
            }

            if (entityAddress.length < _exp.rules[2].updateData[0].minimum) {
                sap.m.MessageToast.show(_exp.rules[2].updateData[0].message);
                this.currentTab = _exp.rules[2].updateData[0].addressTab;
                this.validated = false;
                this.isTab = _exp.isTab;
                return;
            } else {
                var isMainAddress = false;
                entityAddress.forEach(function(object) {
                    if (object.IsMainAddress) {
                        isMainAddress = true;
                    }
                }.bind(this));
                if (!isMainAddress) {
                    sap.m.MessageToast.show(_exp.rules[2].updateData[0].messageMainAddress);
                    this.currentTab = _exp.rules[2].updateData[0].addressTab;
                    this.validated = false;
                    this.isTab = _exp.isTab;
                }


            }

        }



    };

    sap.ui.validations.applicant.prototype.validateEmployment = function(_exp) {
        var jobId, jobIdRequired, rules;
        rules = _exp.rules[0];
        jobId = this.oModel.getProperty(rules.pathJobId);
        jobIdRequired = rules.jobIdRequired;

        if (jobId === jobIdRequired) {

            if (this.oModel.getProperty(rules.pathEmployerSet).length < rules.minimumPersonal) {
                sap.m.MessageToast.show(_exp.message);
                this.currentTab = _exp.tabError;
                this.validated = false;
                this.isTab = _exp.isTab;
                return;
            }
        }
    };
    sap.ui.validations.applicant.prototype.validateContactLater = function(_exp) {
        var statusId, statusIdRequired, rules;
        rules = _exp.rules[0];
        statusId = this.oModel.getProperty(rules.pathStatusId);
        statusIdRequired = rules.statusId;

        if (statusId === statusIdRequired) {
            var contactLaterDate, contactLaterTime;
            contactLaterDate = this.oModel.getProperty(rules.pathContactLaterDate);
            contactLaterTime = this.oModel.getProperty(rules.pathContactLaterTime);
            contactLaterDate = moment(contactLaterDate).format('YYYY-MM-DD');
            var dateNow = moment(new Date).format('YYYY-MM-DD');
            var dateFuture = moment(new Date).add(3, 'month').format('YYYY-MM-DD');
            var time = moment(new Date).format('HH:mm');
            var timeNow = moment(time, 'HH:mm');
            contactLaterTime = moment(contactLaterTime, 'HH:mm');
            if (moment(contactLaterDate).isValid() && contactLaterTime.isValid()) {
                if (moment(contactLaterDate).isSame(dateNow)) {
                    if (contactLaterTime.diff(timeNow) <= 0) {
                        sap.m.MessageToast.show(_exp.message);
                        this.currentTab = _exp.tabError;
                        this.validated = false;
                        this.isTab = _exp.isTab;
                        return;
                    }
                } else {
                    if (!moment(contactLaterDate).isBetween(dateNow, dateFuture)) {
                        sap.m.MessageToast.show(_exp.message);
                        this.currentTab = _exp.tabError;
                        this.validated = false;
                        this.isTab = _exp.isTab;
                        return;
                    }

                }
            } else {
                sap.m.MessageToast.show(_exp.message);
                this.currentTab = _exp.tabError;
                this.validated = false;
                this.isTab = _exp.isTab;
                return;
            }

            //}
        }
    };
    sap.ui.validations.applicant.prototype.validateMaritalStatus = function(_exp) {

        var maritalStatusId, maritalStatusIdRequired, rules, aReferences, bpAdditionalData;
        rules = _exp.rules[0];
        maritalStatusId = this.oModel.getProperty(rules.pathMaritalStatusId);
        maritalStatusIdRequired = rules.maritalStatusIdRequired;

        for (var i = 0; i < maritalStatusIdRequired.length; i++) {
            if (maritalStatusId === maritalStatusIdRequired) {

                bpAdditionalData = this.oModel.getProperty(rules.pathBpAdditionalData);
                if (bpAdditionalData.Spouse.BpNameData.FirstName.trim().length < 1) {
                    sap.m.MessageToast.show(_exp.message[0]);
                    this.validated = false;
                    this.currentTab = _exp.tabError;
                    this.isTab = _exp.isTab;
                    return;
                }
            }
        }
    };

    sap.ui.validations.applicant.prototype.validateLocal = function(_exp) {
        var typeOfStoreId, typeOfStoreIdRequired, shopFromWhoId, shopFromWhoIdEmpty, rules, statusId;
        rules = _exp.rules[0];
        statusId = this.oModel.getProperty(rules.pathStatusId);
        typeOfStoreId = this.oModel.getProperty(rules.pathTypeOfStoreId);
        shopFromWhoId = this.oModel.getProperty(rules.pathShopFromWhoId);
        typeOfStoreIdRequired = rules.typeOfStoreIdRequired;
        shopFromWhoIdEmpty = rules.shopFromWhoIdEmpty;

        if (statusId === rules.statusId && typeOfStoreId === typeOfStoreIdRequired && shopFromWhoId === shopFromWhoIdEmpty) {
            sap.m.MessageToast.show(_exp.message);
            this.currentTab = _exp.tabError;
            this.validated = false;
            this.isTab = _exp.isTab;
            return;
        }
    };
    sap.ui.validations.applicant.prototype.validateIsIndivWBusiness = function(_exp) {
        var isIndivWBusiness, homoclave, fiel, curp, rules;
        rules = _exp.rules[0];
        isIndivWBusiness = this.oModel.getProperty(rules.pathIsIndivWBusiness);
        homoclave = this.oModel.getProperty(rules.pathHomoclave);
        fiel = this.oModel.getProperty(rules.pathFielNumber);
        curp = this.oModel.getProperty(rules.pathCurp);
        if (isIndivWBusiness) {
            if (!this.validateRequired(homoclave) && !this.validateRequired(fiel) && !this.validateRequired(curp)) {
                sap.m.MessageToast.show(_exp.message);
                this.currentTab = _exp.tabError;
                this.validated = false;
                this.isTab = _exp.isTab;
                return;
            }
        }
    };

    sap.ui.validations.applicant.prototype.validateDocuments = function(_exp) {
        var images, rules, statusId, oModelCustomer, sourceId;
        rules = _exp.rules[0];
        oModelCustomer = this.oModel;
        statusId = oModelCustomer.getProperty(rules.pathStatusId);
        sourceId = oModelCustomer.getProperty(rules.pathSourceId);
        images = oModelCustomer.getProperty(rules.pathImages);
        
        if(sourceId !== rules.sourceIdExcluded){
            if (statusId === rules.statusId || sourceId === rules.sourceId) {
                if (Object.keys(images).length === 0) {
                    sap.m.MessageToast.show(_exp.message);
                    this.currentTab = _exp.tabError;
                    this.validated = false;
                    this.isTab = _exp.isTab;
                    this.message = _exp.message;
                    return;
                } else {
                    images.some(function(image) {
                        if ((rules.documentStatusId[0] !== image.DocumentStatusId) && (rules.documentStatusText != image.DocumentStatusText) && (rules.documentStatusId[1] !== image.DocumentStatusId) && (rules.documentStatusId[2] !== image.DocumentStatusId)) {
                            var arrayNoRequired = rules.documentsNoRequired;
                            var flagRequired = true;
                            //Busca si el ID del documento es requerido
                            for (var i = 0; i < arrayNoRequired.length; i++) {
                                if (image.DocumentId == arrayNoRequired[i]) {
                                    flagRequired = false;
                                }
                            }
                            if (flagRequired) {
                                // sap.m.MessageToast.show(_exp.message,{closeOnBrowserNavigation:false});
                                this.currentTab = _exp.tabError;
                                this.validated = false;
                                this.isTab = _exp.isTab;
                                this.message = _exp.message;
                                return true;
                            }
                        }
                    }.bind(this));
                }
            }
        }
    };
    sap.ui.validations.applicant.prototype.validateDocumentsScc = function(_exp) {
        var images, rules, statusId, oModelCustomer, sourceId;
        rules = _exp.rules[0];
        oModelCustomer = this.oModel;
        statusId = oModelCustomer.getProperty(rules.pathStatusId);
        sourceId = oModelCustomer.getProperty(rules.pathSourceId);
        images = oModelCustomer.getProperty(rules.pathImages);
            if (statusId === rules.statusId && sourceId === rules.sourceId) {
                if (Object.keys(images).length === 0) {
                    sap.m.MessageToast.show(_exp.message);
                    this.currentTab = _exp.tabError;
                    this.validated = false;
                    this.isTab = _exp.isTab;
                    this.message = _exp.message;
                    return;
                } else {
                    images.some(function(image) {
                        if ((rules.documentStatusId[0] !== image.DocumentStatusId) && (rules.documentStatusText != image.DocumentStatusText) && (rules.documentStatusId[1] !== image.DocumentStatusId) && (rules.documentStatusId[2] !== image.DocumentStatusId)) {
                            var arrayNoRequired = rules.documentsNoRequired;
                            var flagRequired = true;
                            //Busca si el ID del documento es requerido
                            for (var i = 0; i < arrayNoRequired.length; i++) {
                                if (image.DocumentId == arrayNoRequired[i]) {
                                    flagRequired = false;
                                }
                            }
                            if (flagRequired) {
                                // sap.m.MessageToast.show(_exp.message,{closeOnBrowserNavigation:false});
                                this.currentTab = _exp.tabError;
                                this.validated = false;
                                this.isTab = _exp.isTab;
                                this.message = _exp.message;
                                return true;
                            }
                        }
                    }.bind(this));
                }
            }
    };



    sap.ui.validations.applicant.prototype.validateAdditional = function(_exp) {
        var pathCredit, rules, individual, grupal, bpAdditionaConyuge, bpAdditionaReferenciaP, bpAdditionaEmpleador;
        rules = _exp.rules[0];
        pathCredit = this.oModel.getProperty(rules.pathCredit);
        individual = rules.individual[0];
        grupal = rules.grupal[0];
        bpAdditionaConyuge = this.oModel.getProperty(individual.pathConyugue);
        bpAdditionaReferenciaP = this.oModel.getProperty(individual.pathReferenciaP);
        bpAdditionaEmpleador = this.oModel.getProperty(individual.pathEmpleador);

        if (pathCredit == individual.product) {

            // if (bpAdditionaConyuge.BpNameData.FirstName.trim().length < individual.validateConyugue) {
            //     sap.m.MessageToast.show(individual.messageConyugue);
            //     this.validated = false;
            //     this.currentTab=_exp.tabError;
            //     this.isTab=_exp.isTab;
            //     return;
            // }

            // if (bpAdditionaReferenciaP.length <= individual.validarReferenciaP) {
            //     sap.m.MessageToast.show(individual.messageConyugue);
            //     this.validated = false;
            //     this.currentTab=_exp.tabError;
            //     this.isTab=_exp.isTab;
            //     return;
            // }    
            // if (bpAdditionaEmpleador.length <= individual.validateEmpleador) {
            //     sap.m.MessageToast.show(individual.messageEmpleador);
            //     this.validated = false;
            //     this.currentTab=_exp.tabError;
            //     this.isTab=_exp.isTab;
            //     return;
            // }    
        }

        if (pathCredit == grupal.productCCR || pathCredit == grupal.productCM) {
            // if (bpAdditionaConyuge.BpNameData.FirstName.trim().length <= grupal.validateConyugue) {
            //     sap.m.MessageToast.show(grupal.messageConyugue);
            //     this.validated = false;
            //     this.currentTab=_exp.tabError;
            //     this.isTab=_exp.isTab;
            //     return;
            // }  
            // if (bpAdditionaEmpleador.length <= grupal.validateEmpleador) {
            //     sap.m.MessageToast.show(grupal.messageEmpleador);
            //     this.validated = false;
            //     this.currentTab=_exp.tabError;
            //     this.isTab=_exp.isTab;
            //     return;
            // }   

        }
    };
    sap.ui.validations.applicant.prototype.validateBornDateCredit = function(_exp) {
        var rules, oProduct, oBbirthday, individual, grupalccr, grupalcm, bpAdditionaConyuge, bpAdditionaReferenciaP, bpAdditionaEmpleador;
        rules = _exp.rules[0];
        individual = rules.individual[0];
        oProduct = this.oModel.getProperty(rules.pathCredit);
        oBbirthday = this.oModel.getProperty(rules.pathBirthdDate);
        grupalccr = rules.grupalccr[0];
        grupalcm = rules.grupalcm[0];
        if (oBbirthday != null) {
            var currentDate = new Date();
            var currentDay = currentDate.getDate();
            var currentMonth = currentDate.getMonth();
            var birthdayDay = oBbirthday.getDate();
            var birthdayMonth = oBbirthday.getMonth();

            currentDate = currentDay + "-" + currentMonth;
            var currentBirthDay = birthdayDay + "-" + birthdayMonth;
            var ageDifMs = Date.now() - oBbirthday.getTime();
            var ageDate = new Date(ageDifMs);
            var oYears = Math.abs(ageDate.getUTCFullYear() - 1970);
            switch (oProduct) {
                case grupalccr.product: // GRUPAL COMERCIAL
                    if (oYears >= grupalccr.minYears && oYears <= grupalccr.maxYears) {
                        if (oYears === grupalccr.specificYears) {
                            if (currentDate === currentBirthDay) {
                                sap.m.MessageToast.show(grupalccr.message);
                                this.validated = false;
                                this.currentTab = _exp.tabError;
                                this.isTab = _exp.isTab;
                                return;
                            } else {
                                this.validated = true;
                                return;
                            }
                        } else {
                            this.validated = true;
                            return;
                        }
                    } else {
                        sap.m.MessageToast.show(grupalccr.message);
                        this.validated = false;
                        this.currentTab = _exp.tabError;
                        this.isTab = _exp.isTab;
                        return;
                    }
                    break;
                case individual.product: // INDIVIDUAL
                    if (oYears >= individual.minYears && oYears <= individual.maxYears) {
                        if (oYears === individual.specificYears) {
                            if (currentDate === currentBirthDay) {
                                sap.m.MessageToast.show(individual.message);
                                this.validated = false;
                                this.currentTab = _exp.tabError;
                                this.isTab = _exp.isTab;
                                return;
                            } else {
                                this.validated = true;
                                return;
                            }
                        } else {
                            this.validated = true;
                            return;
                        }
                    } else {
                        sap.m.MessageToast.show(individual.message);
                        this.validated = false;
                        this.currentTab = _exp.tabError;
                        this.isTab = _exp.isTab;
                        return;
                    }
                    break;
                case grupalcm.product: // GRUPAL MUJER
                    if (oYears >= grupalcm.minYears && oYears <= grupalcm.maxYears) {
                        if (oYears === grupalcm.specificYears) {
                            if (currentDate === currentBirthDay) {
                                sap.m.MessageToast.show(grupalcm.message);
                                this.validated = false;
                                this.currentTab = _exp.tabError;
                                this.isTab = _exp.isTab;
                                return;
                            } else {
                                this.validated = true;
                                return;
                            }
                        } else {
                            this.validated = true;
                            return;
                        }
                    } else {
                        sap.m.MessageToast.show(grupalcm.message);
                        this.validated = false;
                        this.currentTab = _exp.tabError;
                        this.isTab = _exp.isTab;
                        return;
                    }
                    break;

            } // FIN switch
        }


    };

    sap.ui.validations.applicant.prototype.validateGenreProduct = function(_exp) {
        var rules, oProduct, oGender;
        rules = _exp.rules[0];
        oProduct = this.oModel.getProperty(rules.pathProduct);
        oGender = this.oModel.getProperty(rules.pathGender);
        if ((oProduct == rules.product) && (oGender == rules.gender)) {
            sap.m.MessageToast.show(_exp.message);
            this.currentTab = _exp.tabError;
            this.validated = false;
            this.isTab = _exp.isTab;
            return;
        }
    };



})();
