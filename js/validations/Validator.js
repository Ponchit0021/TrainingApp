(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.validations.Validator");

    /**
     * [constructor of validator class]
     * @param  {[type]} )  {                   	this._isValid [description]
     * @param  {[type]} } [description]
     * @return {[type]}    [description]
     */
    sap.ui.base.Object.extend('sap.ui.validations.Validator', {
        constructor: function() {
            this._isValid = true;
            this._isValidationPerformed = false;
        },
    });

    /**
     * [isValid regresa verdadero solamente cuando se ha realizado la validación de formularios y no se encontraron errores de validación]
     * @return {Boolean} [validacion realizada y valida]
     */
    sap.ui.validations.Validator.prototype.isValid = function() {
        return this._isValidationPerformed && this._isValid;
    };

    /**
     * [validate Valida el contro dado en el parametro de entrada y todos los controles hijo que pudiera tener]
     * @param  {[type]} sIdControl [id de Control a validar]
     * @return {[boolean]}       [regresa verdadero si al control se le realizo la validación y es valido]
     */
    sap.ui.validations.Validator.prototype.validate = function(sIdControl) {
        var oControl = sap.ui.getCore().byId(sIdControl);
        this._isValid = true;
        this._validate(oControl);
        return this.isValid();
    };

    /**
     * [_validate Valida el control dado en el parametro de entrada y todos los controles hijo que pudiera tener]
     * @param  {[type]} oControl [Control o elemento a validar]
     */
    sap.ui.validations.Validator.prototype._validate = function(oControl) {
        var aPossibleAggregations = ["items", "content", "form", "formContainers", "formElements", "fields"],
            aControlAggregation = null,
            oControlBinding = null,
            aValidateProperties = ["value", "selectedKey", "text"], // yes, I want to validate Select and Text controls too
            isValidatedControl = false,
            oExternalValue, oInternalValue,
            i, j;

        // only validate controls and elements which have a 'visible' property
        if (oControl instanceof sap.ui.core.Control ||
            oControl instanceof sap.m.IconTabFilter ||
            oControl instanceof sap.ui.layout.form.FormContainer ||
            oControl instanceof sap.ui.layout.form.FormElement) {

            // only check visible controls (invisible controls make no sense checking)
            if (oControl.getVisible()) {

                // check control for any properties worth validating 
                for (i = 0; i < aValidateProperties.length; i += 1) {
                    if (oControl.getBinding(aValidateProperties[i])) {
                        // check if a data type exists (which may have validation constraints)
                        //console.log(oControl);
                        if (oControl.getBinding(aValidateProperties[i]).getType()) {
                            // try validating the bound value
                            try {
                                oControlBinding = oControl.getBinding(aValidateProperties[i]);
                                oExternalValue = oControl.getProperty(aValidateProperties[i]);
                                oInternalValue = oControlBinding.getType().parseValue(oExternalValue, oControlBinding.sInternalType);
                                oControlBinding.getType().validateValue(oInternalValue);
                                this.validateRequired(oInternalValue, oControlBinding.getType().oConstraints.required);
                                if (aValidateProperties[i] === 'selectedKey') {
                                    oControl.removeStyleClass("statusErrorValue"); 
                                }else{
                                	oControl.setValueState(sap.ui.core.ValueState.None);
                                }
                            }
                            // catch any validation errors
                            catch (ex) {
                                this._isValid = false;
                                if (aValidateProperties[i] === 'selectedKey') {
                                    oControl.addStyleClass("statusErrorValue"); 
                                }else{
                                	oControl.setValueState(sap.ui.core.ValueState.Error);
                                }
                                /*oControlBinding = oControl.getBinding(aValidateProperties[i]);
                                sap.ui.getCore().getMessageManager().addMessages(
                                    new sap.ui.core.message.Message({
                                        message: ex.message,
                                        type: sap.ui.core.MessageType.Error,
                                        target: (oControlBinding.getContext() ? oControlBinding.getContext().getPath() + "/" : "") +
                                            oControlBinding.getPath(),
                                        processor: oControl.getBinding(aValidateProperties[i]).getModel()
                                    })
                                );*/
                            }

                            isValidatedControl = true;
                        }
                    }
                }

                // if the control could not be validated, it may have aggregations
                if (!isValidatedControl) {
                    for (i = 0; i < aPossibleAggregations.length; i += 1) {
                        aControlAggregation = oControl.getAggregation(aPossibleAggregations[i]);

                        if (aControlAggregation) {
                            // generally, aggregations are of type Array
                            if (aControlAggregation instanceof Array) {
                                for (j = 0; j < aControlAggregation.length; j += 1) {
                                    this._validate(aControlAggregation[j]);
                                }
                            }
                            // ...however, with sap.ui.layout.form.Form, it is a single object *sigh*
                            else {
                                this._validate(aControlAggregation);
                            }
                        }
                    }
                }
            }
        }
        this._isValidationPerformed = true;
    };

    /**
     * [validateRequired Valida si entrada es requerida y contiene un valor, de lo contrario lanza una excepcion]
     * @param  {[string]} _sValue    [valor vinculado al control]
     * @param  {[boolean]} _bRequired [si es requerido]
     * @return {[type]}            [description]
     */
    sap.ui.validations.Validator.prototype.validateRequired = function(_sValue, _bRequired){
    	if (_bRequired !== undefined && _bRequired) {
	    	if (_sValue.length !== 0) {
	    		return _bRequired;
	    	}else{
	    		throw this.exceptionValidateRequired(_bRequired);
	    	}
    	}
    };

    sap.ui.validations.Validator.prototype.exceptionValidateRequired = function(_bRequired){
    	var ex = {};

    	ex.message = "Completar obligatorio";
    	ex.name = "ValidateRequired";
    	ex.violatedMandatory = [{'required': _bRequired}];

    	return ex;
    }; 

})();
