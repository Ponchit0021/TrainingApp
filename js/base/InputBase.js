(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.InputBase");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.InputBase', {});
    sap.ui.mw.InputBase.prototype.createSelect = function(_id, _path, _itemTemplate, oModel, _changeFunction, _oController, _bVisible) {
        var oSelect = new sap.m.Select(_id, {
            items: {
                path: _path,
                template: _itemTemplate
            },
            visible: _bVisible
        });
        if (_oController !== undefined && _oController !== null) {
            oSelect.attachChange(_changeFunction, _oController);
        }
        oSelect.setModel(oModel);
       
        return oSelect;
    };
   
    sap.ui.mw.InputBase.prototype.createComboBox = function(_id, _path, _itemTemplate, _oModel, _changeFunction, _oController) {

        var oComboBox;
        if (_changeFunction !== "") {
            oComboBox = new sap.m.ComboBox(_id, {
                items: {
                    path: _path,
                    template: _itemTemplate
                },
                selectionChange: [_changeFunction, _oController]
            });
        } else {
            oComboBox = new sap.m.ComboBox(_id, {
                items: {
                    path: _path,
                    template: _itemTemplate
                }
            });
        }

        oComboBox.setModel(_oModel);
        return oComboBox;
    };
    sap.ui.mw.InputBase.prototype.createDateTimeInput = function(_id, _value, _placeholder, _displayFormat, _type, _changeFunction, _oController) {
        var oDateTimeInput = new sap.m.TimePicker(_id, {
            type: _type,
            value: _value,
            placeholder: _placeholder,
            displayFormat: _displayFormat,
            valueFormat: "HH:mm",
            localeId: "es-MX",
            change: [_changeFunction, _oController]
        });
        return oDateTimeInput;
    };
    sap.ui.mw.InputBase.prototype.createSearchField = function(_id, _eventHandler, _oController, _settings) {
        var oSearchField = new sap.m.SearchField(_id, {
            width: _settings,
            search: [_eventHandler, _oController],
            placeholder: "Buscar"

        });
        return oSearchField;
    };
    sap.ui.mw.InputBase.prototype.createDatePickerRange = function(_id, _valueMin, _valueMax, _placeholder, _displayFormat) {

        var data = {
            minimumConstraint: _valueMin, //"2016-02-05"//YYYY-MM-DD
            maximumConstraint: _valueMax
        };


        var oModelDPR = new sap.ui.model.json.JSONModel();
        oModelDPR.setData(data);
        sap.ui.getCore().setModel(oModelDPR, "oModelDPR");
        var oGetModelDPR = sap.ui.getCore().getModel("oModelDPR");

        var oDatePicker = new sap.m.DatePicker(_id, {
            value: {
                path: "/",
                type: new sap.ui.model.type.Date({
                    pattern: _placeholder,
                    source: {
                        pattern: _placeholder
                    },
                    strictParsing: true
                }, {
                    maximum: oModelDPR.getProperty("/maximumConstraint"),
                    minimum: oModelDPR.getProperty("/minimumConstraint")
                })
            },
            placeholder: _placeholder,
            displayFormat: _displayFormat,
            valueFormat: "yyyy-MM-ddThh:mm:ss", //1988-02-10T00:00:00
            validationSuccess: function(oEvent) {
                oEvent.preventDefault();
                oEvent.cancelBubble();
                oEvent.getSource().setValueState('Success');
            },
            validationError: function(oEvent) {
                oEvent.preventDefault();
                oEvent.cancelBubble();
                oEvent.getSource().setValueState('Error');

            }

        });
        

        oDatePicker.setModel(oModelDPR);
        return oDatePicker;
    };

    sap.ui.mw.InputBase.prototype.createDatePicker = function(_id, _value, _placeholder, _displayFormat) {

        var oDatePicker = new sap.m.DatePicker(_id, {
            dateValue: _value,
            //value: _value,
            placeholder: _placeholder,
            displayFormat: "dd.MM.yyyy",
            valueFormat: "yyyy-MM-ddThh:mm:ss",
            //// EAMARCE: 07/01/2015
            /// Agregada funcionalidad para validación de formato y validez de las fechas vs. Input de usuario
            change: function(oEvent) {

                try {

                    var oValue;
                    oValue = oEvent.getSource().getProperty('value');
                    oValue = oValue.replace("T12:00:00", "").replace(/\-/gi, "/");
                    if (oValue.toString().match("^((([0-9]){4})(\/)([0-9]){2}(\/)([0-9]){2})$")) {
                        var dat = new Date(oValue);
                        if (isValidDate(dat)) {
                            oEvent.getSource().setValueState('Success');
                            return;
                        }
                    }
                    oEvent.getSource().setValueState('Error');
                } catch (err) {
                    oEvent.getSource().setValueState('Error');
                }

            }
        });

        //// EAMARCE: 07/01/2015
        /// Agregada funcionalidad para validación de formato y validez de las fechas vs. Input de usuario

        return oDatePicker;

        //// EAMARCE: 07/01/2015
        /// Agregada funcionalidad para validación de formato y validez de las fechas vs. Input de usuario
        function isValidDate(d) {
            if (Object.prototype.toString.call(d) !== "[object Date]")
                return false;
            return !isNaN(d.getTime());
        }
        //// EAMARCE: 07/01/2015
        /// Agregada funcionalidad para validación de formato y validez de las fechas vs. Input de usuario


    };

    sap.ui.mw.InputBase.prototype.createCheckBox = function(_id, _text, _selected, _enabled, _function, _oController) {
        var oCheckBox = new sap.m.CheckBox(_id, {
            text: _text,
            selected: _selected,
            enabled: _enabled
        });

        if(_function && _oController){
            oCheckBox.attachSelect("", _function, _oController);
        }

        return oCheckBox;
    };

    sap.ui.mw.InputBase.prototype.createRadioButton = function(_id, _groupName, _selected) {
        var oRadioButton = new sap.m.RadioButton(_id, {
            groupName: _groupName,
            selected: _selected
        });
        return oRadioButton;
    };
    sap.ui.mw.InputBase.prototype.createRadioButtonGroup = function(_id, _radioButtons, _columns, _selectedIndex) {

        var oRBGroup, radioButtonsLength;
        radioButtonsLength = _radioButtons.length;

        oRBGroup = new sap.m.RadioButtonGroup(_id, {
            selectedIndex: _selectedIndex,
            columns: _columns
        });
        if (_radioButtons) {
            if (_radioButtons instanceof Array) {
                for (var i = 0; i < radioButtonsLength; i++) {
                    oRBGroup.addButton(_radioButtons[i]);
                }
            } else {
                oRBGroup.addButton(_radioButtons);
            }
        }
        return oRBGroup;
    };
    sap.ui.mw.InputBase.prototype.createRadioButtonForGroupName = function(_id, _text) {
        var oRadioButton = new sap.m.RadioButton(_id, {
            text: _text
        });
        return oRadioButton;
    };
    sap.ui.mw.InputBase.prototype.createTextArea = function(_id, _rows, _cols, _height, _maxLength, _wrapping) {
        var oTextArea;

        oTextArea = new sap.m.TextArea(_id, {
            rows: _rows,
            cols: _cols,
            height: _height,
            maxLength: _maxLength,
            wrapping: _wrapping
        });

        return oTextArea;
    };

    sap.ui.mw.InputBase.prototype.createInputText = function(_id, _type, _placeholder, _value, _enabled, _editable, _regularExpression, _bRequired) {
        var oInputText, jsonModel, sV;

        if (_regularExpression) {
            oInputText = new sap.m.Input(_id, {
                type: _type,
                placeholder: _placeholder,
                enabled: _enabled,
                editable: _editable,
                valueLiveUpdate: true,
                value: {
                    path: _value.replace(/{|}/g, ""),
                    type: new sap.ui.model.type.String({}, {
                        search: _regularExpression,
                        required: _bRequired
                    })
                },
                change: function(oEvent) {
                    oEvent.getSource().setValueState(validateExprReg(oEvent.getSource().getProperty('value'), _regularExpression));
                },
                liveChange: function() {
                    sV = this._$input.val();
					this._$input.val(sV);
                    if (this.getMaxLength() > 0 && sV.length > this.getMaxLength()) {
                        sV = sV.substring(0, this.getMaxLength());
                        this._$input.val(sV);
                    }

                    if (!this.invalidKeyCode) {
                        this.setValueState(validateExprReg(this._$input.val(), _regularExpression));
                    }

                    this.invalidKeyCode = false;
                }
            });
        } else {
            oInputText = new sap.m.Input(_id, {
                type: _type,
                placeholder: _placeholder,
                enabled: _enabled,
                editable: _editable,
                value: _value
            });
        }
        if (_value) {
            if (_value.indexOf("{") < 0) {
                if (validateExprReg(_value, _regularExpression) === 'Error') {
                    sap.ui.getCore().byId(_id).setValueState(sap.ui.core.ValueState.Error);
                } else {
                    sap.ui.getCore().byId(_id).setValueState(sap.ui.core.ValueState.None);
                }
            }
        }

        return oInputText;

        function validateExprReg(value, expReg) {
            if (value.length === 0) {
                return sap.ui.core.ValueState.None;
            } else if (value.toString().match(expReg)) {
                return sap.ui.core.ValueState.Success;
            } else {
                return sap.ui.core.ValueState.Error;
            }
        }

    };
    sap.ui.mw.InputBase.prototype.validationForForm = function(_idField, _typeField) {

        var currentField;

        currentField = sap.ui.getCore().byId(_idField);

        if (_typeField === "Input") {
            if (currentField) {
                if (currentField.getValue().length === 0) {

                    currentField.setValueState(sap.ui.core.ValueState.Error);
                    return {
                        type: false,
                        message: "Completar campos obligatorios"
                    };
                } else {
                    if (currentField.getValueState() === "Error") {
                        return {
                            type: false,
                            message: "Entrada no valida"
                        };
                    } else {
                        currentField.setValueState(sap.ui.core.ValueState.Success);
                        return {
                            type: true,
                            message: "Campo valido"
                        };
                    };
                };
            } else {
                return {
                    type: false,
                    message: "Seleccione una opción"
                };
            };
        } else if (_typeField === "Select") {
            if (currentField) {
                if (currentField.getSelectedKey().length === 0) {

                    if (currentField.hasStyleClass("statusSuccesValue")) {
                        currentField.removeStyleClass("statusSuccesValue");
                    }
                    currentField.addStyleClass("statusErrorValue");

                    return {
                        type: false,
                        message: "Seleccione una opción"
                    };
                } else {
                    currentField.addStyleClass("statusSuccesValue");
                    return {
                        type: true,
                        message: "Campo Valido"
                    };
                };
            } else {
                return {
                    type: false,
                    message: "Seleccione una opción"
                };
            };
        } else if (_typeField === "Combo") {
            if (currentField) {
                if (currentField.getValue().length === 0) {
                    currentField.addStyleClass("statusErrorValue");
                    return {
                        type: false,
                        message: "Seleccione una opción"
                    };
                } else {
                    currentField.addStyleClass("statusSuccesValue");
                    return {
                        type: true,
                        message: "Campo Valido"
                    };
                };
            } else {
                return {
                    type: false,
                    message: "Seleccione una opción"
                };
            };
        };
    };
    sap.ui.mw.InputBase.prototype.checkStatusValue = function(_idField, _typeField) {

        var currentField;

        currentField = sap.ui.getCore().byId(_idField);

        if (currentField) {
            if (_typeField === 'Input') {
                if (currentField.getValueState() === "Error") {
                    return {
                        type: false,
                        message: "Entrada no valida"
                    };
                } else {
                    return {
                        type: true,
                        message: "Campo valido"
                    };
                };
            } else if (_typeField === 'Select') {
                if (currentField.hasStyleClass("statusErrorValue")) {
                    return {
                        type: false,
                        message: "Entrada no valida"
                    };
                } else {
                    return {
                        type: true,
                        message: "Campo valido"
                    };
                };
            };
        } else {
            return {
                type: true,
                message: "Campo valido"
            };
        };
    };
    sap.ui.mw.InputBase.prototype.resetStatusValue = function(_idField, _typeField) {

        var currentField;

        currentField = sap.ui.getCore().byId(_idField);

        if (currentField) {
            if (_typeField === 'Input') {
                currentField.setValueState(sap.ui.core.ValueState.None);
            } else if (_typeField === 'Select') {
                if (currentField.hasStyleClass("statusErrorValue")) {
                    currentField.removeStyleClass("statusErrorValue");
                };
            };
        };
    };
})();
