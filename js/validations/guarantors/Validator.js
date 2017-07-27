(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.validations.guarantor");
    jQuery.sap.require("sap.ui.base.Object");
    sap.ui.base.Object.extend('sap.ui.validations.guarantor', {
        constructor: function(_oModel) {
            this.oModel = _oModel;
            this.validated = true;
            this.currentTab="";
            this.isTab=false;
        }
    });
    sap.ui.validations.guarantor.prototype.init = function() {
        var rules, validator;

        jQuery.sap.require("js.validations.BaseValidator","js.validations.guarantors.Rules");
        validator= new sap.ui.validations.base();
        rules=new sap.rules.Guarantor();    
         validator.evaluate(this,rules.getStructure());
        if(this.validated){
        	this.runValidations(rules.getValidations());
        }
       
    }

 	sap.ui.validations.guarantor.prototype.runValidations = function(_exp) { 		
        _exp.validations.some(function(validation) {
        	var entityValue = this.oModel.getProperty(validation.path);
        	if(validation.required && !this.validateRequired(entityValue)){
				sap.m.MessageToast.show(_exp.message);
                this.currentTab=validation.tabError;
                this.validated=false;
                this.isTab=validation.isTab;
                return true;
        	}      	
        }.bind(this));
    };

	sap.ui.validations.guarantor.prototype.validateRequired = function(_value) {		
        if(_value!==null&&_value!==undefined&&_value!==''){        
        	return true;
        }else{
        	return false;
        }
    };

    sap.ui.validations.guarantor.prototype.validatePhoneAndAddress = function(_exp) {
        _exp.rules.forEach(function(rule) {
            var entityLength = this.oModel.getProperty("/results/0/" + rule.entity + "/results").length;
            if (entityLength < rule.minimum) {
                sap.m.MessageToast.show(_exp.message);
                this.currentTab=_exp.tabError;
                this.validated=false;
                this.isTab=_exp.isTab;
                return;
            }
        }.bind(this));
    };

    sap.ui.validations.guarantor.prototype.validateEmployment = function(_exp) {
        var jobId,jobIdRequired,rules;
        rules=_exp.rules[0];
        jobId= this.oModel.getProperty(rules.pathJobId);
        jobIdRequired=rules.jobIdRequired;

        if(jobId===jobIdRequired){
            
            if(this.oModel.getProperty(rules.pathEmployerSet).length<rules.minimumPersonal){
                sap.m.MessageToast.show(_exp.message);
                this.currentTab=_exp.tabError;
                this.validated=false;
                this.isTab=_exp.isTab;
                return;  
            }
        }
    };

    sap.ui.validations.guarantor.prototype.validateMaritalStatus = function(_exp) {
        
        var maritalStatusId, maritalStatusIdRequired, rules, aReferences, bpAdditionalData;
        rules = _exp.rules[0];
        maritalStatusId = this.oModel.getProperty(rules.pathMaritalStatusId);
        maritalStatusIdRequired = rules.maritalStatusIdRequired;

        if (maritalStatusId === maritalStatusIdRequired) {


            bpAdditionalData = this.oModel.getProperty(rules.pathBpAdditionalData);
            if (bpAdditionalData.Spouse.BpNameData.FirstName.trim().length<1) {
                sap.m.MessageToast.show(_exp.message[0]);
                this.validated = false;
                this.currentTab=_exp.tabError;
                this.isTab=_exp.isTab;
                return;
            }


        }
    };
    
    sap.ui.validations.guarantor.prototype.validateLocal = function(_exp) {
        var typeOfStoreId,typeOfStoreIdRequired,shopFromWhoId,shopFromWhoIdEmpty,rules;
        rules=_exp.rules[0];
        typeOfStoreId= this.oModel.getProperty(rules.pathTypeOfStoreId);
        shopFromWhoId= this.oModel.getProperty(rules.pathShopFromWhoId);
        typeOfStoreIdRequired= rules.typeOfStoreIdRequired;
        shopFromWhoIdEmpty= rules.shopFromWhoIdEmpty;

        if(typeOfStoreId===typeOfStoreIdRequired && shopFromWhoId===shopFromWhoIdEmpty){
            sap.m.MessageToast.show(_exp.message);
            this.currentTab=_exp.tabError;
            this.validated=false;
            this.isTab=_exp.isTab;
            return;              
        }
    };

    sap.ui.validations.guarantor.prototype.validateDocuments = function(_exp) {
        var images,rules;
        rules=_exp.rules[0];
        images= this.oModel.getProperty(rules.pathImages);   
        if (Object.keys(images).length === 0) {
            sap.m.MessageToast.show(_exp.message);
            this.currentTab=_exp.tabError;
            this.validated=false;
            this.isTab=_exp.isTab;
            return;    
        }else{        	
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
                            //sap.m.MessageToast.show(_exp.message);
                            this.currentTab = _exp.tabError;
                            this.validated = false;
                            this.isTab = _exp.isTab;
                            return true;
                        }
                    }
                }.bind(this));
        }         
       
    };
    


    

})();
