(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.helper.PostValidator");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.helper.PostValidator', {
        constructor: function(oMetadata) {
            this._oMetadata = oMetadata;
            this._mEntitySets = this._findEntitySets(oMetadata);
            this.oEntityTypesSchema = this._findEntityTypes(oMetadata);
            this.oComplexTypesSchema = this._findComplexTypes(oMetadata);

        }
    });



    sap.ui.helper.PostValidator.prototype.ValidateRequest = function(oRequest, sRequestName) {

        var oEntityToValidate = jQuery.extend({}, oRequest);

        var aResults = [];
        
        var that = this;

        ////////// Iterate over entities
        this.validateEntity(oEntityToValidate, sRequestName, this.oEntityTypesSchema, this.oComplexTypesSchema, aResults);


        if (aResults.length > 0) {

            console.log("********** INVALID PROPERTIES ********")

            console.log("Entity: " + sRequestName)

            if (this.oEntityTypesSchema.hasOwnProperty(sRequestName)) {

                if (this.oEntityTypesSchema[sRequestName].hasOwnProperty("keys")) {
                    if (this.oEntityTypesSchema[sRequestName].keys.length > 0) {

                        this.oEntityTypesSchema[sRequestName].keys.forEach(function(key) {

                            if (oRequest[key] != undefined) {
                                console.log(key + ":" + oRequest[key]);
                            } else {
                                console.log(key + ": undefined");
                            }


                        })
                    }
                }
            }

            aResults.forEach(function(propiedad) {
                console.log(propiedad);
            });
        }
        /// Evaluar las propiedades


    };


    sap.ui.helper.PostValidator.prototype.validateEntity = function(oEntityToValidate, sRequestName, oEntityTypesSchema, oComplexTypesSchema, aResults) {

        /// Validate child properties (recursive)
        
        var oResponse;

        var sEntitySetName = sRequestName + "Set";

        if (this._mEntitySets[sEntitySetName].hasOwnProperty("navprops")) {

            for (var oNavigationProperty in this._mEntitySets[sEntitySetName].navprops) {

                /// Validar si deberia ser un Objeto o un arreglo

                if (typeof oEntityToValidate[oNavigationProperty] !== "undefined") {

                    oResponse = this.validateNavPropertyIsArray(this._mEntitySets[sEntitySetName].navprops[oNavigationProperty], oEntityToValidate[oNavigationProperty], aResults);

                    if (oResponse.bEvaluationOK) {

                        if (oResponse.bIsArray) {
                            /// Como es un arreglo, evaluar cada una de las entidades contenidas
                            var iCounter = 0;
                            oEntityToValidate[oNavigationProperty].forEach(
                                function(oNavigationPropertyEntityData) {

                                    this.validateEntityInternal(oNavigationPropertyEntityData, oNavigationProperty.replace("Set", ""), oEntityTypesSchema, oComplexTypesSchema, aResults, "/" + iCounter);
                                    iCounter++;

                                }.bind(this)
                            );
                        } else {
                            this.validateEntityInternal(oEntityToValidate[oNavigationProperty], oNavigationProperty.replace("Set", ""), oEntityTypesSchema, oComplexTypesSchema, aResults);
                        }
                    }

                    this.validateEntity(oEntityToValidate[oNavigationProperty],  oNavigationProperty.replace("Set", "") , oEntityTypesSchema, oComplexTypesSchema, aResults);



                    oEntityToValidate[oNavigationProperty] = null;
                    delete oEntityToValidate[oNavigationProperty];

                }


            }

        }


        /// Validate this level properties
        this.validateEntityInternal(oEntityToValidate, sRequestName, oEntityTypesSchema, oComplexTypesSchema, aResults);


    };

    sap.ui.helper.PostValidator.prototype.validateNavPropertyIsArray = function(oNavigationProperty, oEntityToValidateProperty, aResults) {

        var oResponse;
        oResponse = {
            bEvaluationOK: false,
            bIsArray: false
        };

        if (oNavigationProperty.to.multiplicity === "*") {
            oResponse.bIsArray = true;
            /// Object property should be an Array
            if (!(Object.prototype.toString.call(oEntityToValidateProperty) === '[object Array]')) {
                aResults.push({ Entity: oNavigationProperty.name, message: "This EntitySet should be an Array of entities" });
            } else {
                oResponse.bEvaluationOK = true;
            }

        } else {
            /// Object property should be an Array
            oResponse.bIsArray = false;
            if (!Object.prototype.toString.call(oEntityToValidateProperty) === '[object Object]') {
                aResults.push({ Entity: oNavigationProperty.name, message: "This EntitySet should be an Object" });
            } else {
                oResponse.bEvaluationOK = true;
            }
        }

        return oResponse;

    };


    sap.ui.helper.PostValidator.prototype.validateEntityInternal = function(oEntityToValidate, sEntityName, oEntityTypesSchema, oComplexTypesSchema, aResults, sIndex) {


        var sPropertyType = "";

        ///  Indice para cuando se evalua un arreglo de propiedades (solo para el Path)
        if (!sIndex) {
            sIndex = "";
        }



        for (var oProperty in oEntityToValidate) {

            sPropertyType = "";

            if (oEntityToValidate.hasOwnProperty(oProperty)) { /// Test that the property belongs to the object

                if (oEntityTypesSchema[sEntityName].hasOwnProperty(oProperty)) { // La propiedad existe en el esquema?

                    this.processProperty(oProperty, sEntityName, "/" + sEntityName + "Set" + sIndex, oEntityToValidate, oEntityTypesSchema[sEntityName], oComplexTypesSchema, aResults)

                } else {

                    aResults.push({ property: "/" + sEntityName + "Set" + sIndex + "/" + oProperty, message: "Property not found in schema" });
                }



            }
        }

    };


    sap.ui.helper.PostValidator.prototype.processProperty = function(oCurrentProperty, oParentProperty, sPath, oBaseObjectData, oEntityTypesSchema, oComplexTypesSchema, aResults) {
    
        if (oEntityTypesSchema.hasOwnProperty(oCurrentProperty))   {
    
        var sPropertyType = oEntityTypesSchema[oCurrentProperty].type;

        if (this.isComplexType(sPropertyType, oComplexTypesSchema)) {

            for (var oComplexProperty in oBaseObjectData[oCurrentProperty]) {
                var sPathComplexType;
                sPathComplexType = sPath + "/" + oCurrentProperty;
                this.processProperty(oComplexProperty, oCurrentProperty, sPathComplexType, oBaseObjectData[oCurrentProperty], oComplexTypesSchema[sPropertyType], oComplexTypesSchema, aResults)
            }
        } else {

            sPath = sPath + "/" + oCurrentProperty;
            if (!this.evaluateProperty(oEntityTypesSchema[oCurrentProperty].type, oBaseObjectData[oCurrentProperty])) {
                aResults.push({ property: sPath, message: "Invalid type, expected: " + sPropertyType });
            }
            return false;
        }

        }else{
            aResults.push({ property: sPath + "/" + oCurrentProperty, message: "Property not found in the schema."});
        }

    };




    sap.ui.helper.PostValidator.prototype._findEntitySets = function(oMetadata) {

        // here we need to analyse the EDMX and identify the entity sets
        var mEntitySets = {};
        var oPrincipals = jQuery(oMetadata).find("Principal");
        var oDependents = jQuery(oMetadata).find("Dependent");

        jQuery(oMetadata).find("EntitySet").each(function(iIndex, oEntitySet) {
            var $EntitySet = jQuery(oEntitySet);
            // split the namespace and the name of the entity type (namespace could have dots inside)
            var aEntityTypeParts = /((.*)\.)?(.*)/.exec($EntitySet.attr("EntityType"));
            mEntitySets[$EntitySet.attr("Name")] = {
                "name": $EntitySet.attr("Name"),
                "schema": aEntityTypeParts[2],
                "type": aEntityTypeParts[3],
                "keys": [],
                "keysType": {},
                "navprops": {}
            };
        });

        // helper function to find the entity set and property reference
        // for the given role name
        var fnResolveNavProp = function(sRole, aAssociation, aAssociationSet, bFrom) {
            var sEntitySet = jQuery(aAssociationSet).find("End[Role=" + sRole + "]").attr("EntitySet");
            var sMultiplicity = jQuery(aAssociation).find("End[Role=" + sRole + "]").attr("Multiplicity");

            var aPropRef = [];
            var aConstraint = jQuery(aAssociation).find("ReferentialConstraint > [Role=" + sRole + "]");
            if (aConstraint && aConstraint.length > 0) {
                jQuery(aConstraint[0]).children("PropertyRef").each(function(iIndex, oPropRef) {
                    aPropRef.push(jQuery(oPropRef).attr("Name"));
                });
            } else {
                var oPrinDeps = (bFrom) ? oPrincipals : oDependents;
                jQuery(oPrinDeps).each(function(iIndex, oPrinDep) {
                    if (sRole === (jQuery(oPrinDep).attr("Role"))) {
                        jQuery(oPrinDep).children("PropertyRef").each(function(iIndex, oPropRef) {
                            aPropRef.push(jQuery(oPropRef).attr("Name"));
                        });
                        return false;
                    }
                });
            }

            return {
                "role": sRole,
                "entitySet": sEntitySet,
                "propRef": aPropRef,
                "multiplicity": sMultiplicity
            };
        };

        // find the keys and the navigation properties of the entity types
        jQuery.each(mEntitySets, function(sEntitySetName, oEntitySet) {
            // find the keys
            var $EntityType = jQuery(oMetadata).find("EntityType[Name='" + oEntitySet.type + "']");
            var aKeys = jQuery($EntityType).find("PropertyRef");
            jQuery.each(aKeys, function(iIndex, oPropRef) {
                var sKeyName = jQuery(oPropRef).attr("Name");
                oEntitySet.keys.push(sKeyName);
                oEntitySet.keysType[sKeyName] = jQuery($EntityType).find("Property[Name='" + sKeyName + "']").attr("Type");
            });
            // resolve the navigation properties
            var aNavProps = jQuery(oMetadata).find("EntityType[Name='" + oEntitySet.type + "'] NavigationProperty");
            jQuery.each(aNavProps, function(iIndex, oNavProp) {
                var $NavProp = jQuery(oNavProp);
                var aRelationship = $NavProp.attr("Relationship").split(".");
                var aAssociationSet = jQuery(oMetadata).find("AssociationSet[Association = '" + aRelationship.join(".") + "']");
                var sName = aRelationship.pop();
                var aAssociation = jQuery(oMetadata).find("Association[Name = '" + sName + "']");
                oEntitySet.navprops[$NavProp.attr("Name")] = {
                    "name": $NavProp.attr("Name"),
                    "from": fnResolveNavProp($NavProp.attr("FromRole"), aAssociation, aAssociationSet, true),
                    "to": fnResolveNavProp($NavProp.attr("ToRole"), aAssociation, aAssociationSet, false)
                };
            });
        });

        // return the entity sets
        return mEntitySets;

    };






    sap.ui.helper.PostValidator.prototype._loadMetadata = function(sMetadataUrl) {

        // load the metadata
        var oMetadata = jQuery.sap.sjax({
            url: sMetadataUrl,
            dataType: "xml"
        }).data;
        jQuery.sap.assert(oMetadata !== undefined, "The metadata for url \"" + sMetadataUrl + "\" could not be found!");
        this._oMetadata = oMetadata;

        return oMetadata;

    };



    sap.ui.helper.PostValidator.prototype.exploreEntities = function(mEntitySets, oMetadata) {
        // load the entity sets (map the entity type data to the entity set)
        var that = this,
            sRootUri = this._getRootUri(),
            oMockData = {};

        // here we need to analyse the EDMX and identify the entity types and complex types
        var oEntityTypesSchema = this._findEntityTypes(oMetadata);
        var oComplexTypesSchema = this._findComplexTypes(oMetadata);


    };




    sap.ui.helper.PostValidator.prototype.isComplexType = function(sProperty, oComplexTypes) {



        if (typeof oComplexTypes[sProperty] !== "undefined") {
            return true;
        } else {
            return false;
        }



    };

    sap.ui.helper.PostValidator.prototype._findComplexTypes = function(oMetadata) {
        var oComplexTypesSchema = {};
        jQuery(oMetadata).find("ComplexType").each(function(iIndex, oComplexType) {
            var $ComplexType = jQuery(oComplexType);
            oComplexTypesSchema[$ComplexType.attr("Name")] = {
                "name": $ComplexType.attr("Name"),
            };


            $ComplexType.find("Property").each(function(iIndex, oProperty) {
                var $Property = jQuery(oProperty);
                var type = $Property.attr("Type");
                oComplexTypesSchema[$ComplexType.attr("Name")][$Property.attr("Name")] = {
                    "type": type.substring(type.lastIndexOf(".") + 1),
                    "precision": $Property.attr("Precision"),
                    "scale": $Property.attr("Scale")
                };
            });
        });
        return oComplexTypesSchema;
    };


    /////// Aqui se reunen las propiedades
    sap.ui.helper.PostValidator.prototype._findEntityTypes = function(oMetadata) {
        var oEntityTypesSchema = {};
        jQuery(oMetadata).find("EntityType").each(function(iIndex, oEntityType) {
            var $EntityType = jQuery(oEntityType);
            oEntityTypesSchema[$EntityType.attr("Name")] = {
                "name": $EntityType.attr("Name"),
                //"properties": [],
                "keys": []
            };
            $EntityType.find("Property").each(function(iIndex, oProperty) {
                var $Property = jQuery(oProperty);
                var type = $Property.attr("Type");
                oEntityTypesSchema[$EntityType.attr("Name")][$Property.attr("Name")] = {
                    "type": type.substring(type.lastIndexOf(".") + 1),
                    "precision": $Property.attr("Precision"),
                    "scale": $Property.attr("Scale")
                }
            });

            $EntityType.find("PropertyRef").each(function(iIndex, oKey) {
                var $Key = jQuery(oKey);
                var sPropertyName = $Key.attr("Name");
                oEntityTypesSchema[$EntityType.attr("Name")].keys.push(sPropertyName);
            });
        });
        return oEntityTypesSchema;
    };





    sap.ui.helper.PostValidator.prototype._generateDataFromEntity1 = function(oEntityType, iIndex, oComplexTypesSchema) {
        var oEntity = {};
        if (!oEntityType) {
            return oEntity;
        }
        for (var i = 0; i < oEntityType.properties.length; i++) {
            var oProperty = oEntityType.properties[i];
            oEntity[oProperty.name] = this._generatePropertyValue1(oProperty.name, oProperty.type, oComplexTypesSchema, iIndex);
        }
        return oEntity;
    };



    sap.ui.helper.PostValidator.prototype.evaluateProperty = function(sType, oProperty) {



        switch (sType) {
            case "String":
                if (typeof oProperty == "string" || oProperty == null) {
                    return true;
                } else {
                    return false;
                }
                break;

            case "DateTime":

                if (Object.prototype.toString.call(oProperty) === '[object Date]' || oProperty == null) {
                    return true;
                } else {
                    return false;
                }

                break;

            case "Decimal":
                 if (typeof oProperty == "string" || oProperty == null) {
                     var oPattern;
                    oPattern = new RegExp("^[0123456789.]+$");
                    return oPattern.test(oProperty);
                } else {
                    return false;
                }

            break;
            case "Int16":
            case "Int32":
            case "Int64":

            case "Double":
            case "Single":
            case "SByte":
            case "Byte":
                if (Object.prototype.toString.call(oProperty) === '[object Number]' || oProperty == null) {
                    return true;
                } else {
                    return false;
                }

            case "Boolean":
                if (typeof oProperty == "boolean" || oProperty == null) {
                    return true;
                } else {
                    return false;
                }
                break;
            case "Time":
                /// Pattern
                if (typeof oProperty == "string" || oProperty == null) {
                    var oPattern;
                    oPattern = new RegExp("^([P])([T]([0-9]{0,2}))([H]([0-9]{0,2}))([M]([0-9]{0,2})([S]([0-9]{0,2})$))");
                    oPattern.test(oProperty);
                    return true;
                } else {
                    return false;
                }
            case "Guid":
                /// Pattern
                if (typeof oProperty == "string" || oProperty == null) {
                    var oPattern;
                    oPattern = new RegExp("((([a-z0-9]){8})-(([a-z0-9]){4})-(([a-z0-9]){4})-(([a-z0-9]){4})-(([a-z0-9]){12}))");
                    return oPattern.test(oProperty);
                } else {
                    return false;
                }
                break;
            case "Binary":
                /// Pattern
                if (typeof oProperty == "string" || oProperty == null) {
                    var oPattern;
                    oPattern = new RegExp("^[01]+$");
                    return oPattern.test(oProperty);
                } else {
                    return false;
                }
                break;
            case "DateTimeOffset":
                if (Object.prototype.toString.call(oProperty) === '[object Date]' || oProperty == null) {
                    return true;
                } else {
                    return false;
                }
            default:
                return false;
        }
    };





})();
