(function() {
    "use strict";
    jQuery.sap.declare("sap.rules.Applicant");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.rules.Applicant', {});

    sap.rules.Applicant.prototype.getStructure = function() {
        return {
            "bussinessRules": [ {
                "name": "validateContactLater",
                "desc": "Validar fecha y hora al contactar porteriormente",
                "fx": "validateContactLater",
                "rules": [{
                        "pathContactLaterDate": "/results/0/BpMainData/ContactLaterDate",
                        "pathContactLaterTime":"/results/0/BpMainData/ContactLaterTime", 
                        "pathStatusId": "/results/0/BpMainData/StatusId",                         
                        "statusId":"E0004"
                    }
                ],
                "message": "Captura una FECHA y HORA correcta.",
                "isTab":true,
                "tabError": "Name"
            },{
                "name": "phoneAndAddress",
                "desc": "Validar que el aval contenga al menos un teléfono y una dirección",
                "fx": "validatePhoneAndAddress",
                "rules": [{
                       "interested": [{
                            "entityPhone": "PhoneSet",
                            "entityAddress": "AddressSet",
                            "minimum": 1,
                            "statusId": "E0003",
                            "message": "Debes ingresar al menos un teléfono una dirección"
                       }]
                    }, {
                       "originProcess": [{
                            "entityPhone": "PhoneSet",
                            "phoneTab" : "Phone",
                            "entityAddress": "AddressSet",
                            "addressTab" : "Address",
                            "minimum": 1,
                            "statusId": "E0006",
                            "message": "Debes ingresar al menos un teléfono y una dirección",
                            "messageMainAddress": "Debe de agregar una dirección Principal."
                        }]
                    }, {
                        "updateData": [{
                            "entityPhone": "PhoneSet",
                            "phoneTab": "Phone",
                            "entityAddress": "AddressSet",
                            "addressTab": "Address",
                            "minimum": 1,
                            "statusId": "E0007",
                            "message": "Debes ingresar al menos un teléfono y una dirección",
                            "messageMainAddress": "Debe de agregar una dirección Principal."
                        }]
                    }

                ],
                "message": "",
                "isTab":true,
                "tabError": "Phone"
            }, {
                "name": "validateEmployment",
                "desc": "...",
                "fx": "validateEmployment",
                "rules": [{
                        "pathJobId": "/results/0/BpComplementaryData/JobId",
                        "jobIdRequired": "ASAL",
                        "pathEmployerSet": "/results/0/EmployerSet/results/",
                        "minimumPersonal":1

                    }

                ],
                "message": "Debe capturar un adicional del 'Empleador'",
                "isTab":true,
                "tabError": "Reference"
            }, {
                "name": "validateMaritalStatus",
                "desc": "...",
                "fx": "validateMaritalStatus",
                "rules": [{
                        "pathMaritalStatusId": "/results/0/BpBasicData/MaritalStatusId",
                        "maritalStatusIdRequired": ["2","5"],
                        "pathBpAdditionalData":"/results/0/BpAdditionalData/"

                    }

                ],
                "message": ["Debe capturar un CONYUGE en adicionales","No se permite más de un 'Cónyuge'"],
                "isTab":true,
                "tabError": "Reference"
            },{
                "name": "validateLocal",
                "desc": "Validar tipo de propiedad del tipo de 'Comercio Establecido'",
                "fx": "validateLocal",
                "rules": [{
                		"pathTypeOfStoreId": "/results/0/BpBasicData/TypeOfStoreId",
                        "typeOfStoreIdRequired": "001",
                        "pathStatusId":"/results/0/BpMainData/StatusId",
                        "statusId":"E0006",
                        "pathShopFromWhoId": "/results/0/BpComplementaryData/ShopFromWhoId",
                        "shopFromWhoIdEmpty":""
                    }
                ],
                "message": "Captura ¿El local es?",
                "isTab":true,
                "tabError": "Complementary"
            }, {
                "name": "validateDocuments",
                "desc": "Validar documentos capturados",
                "fx": "validateDocuments",
                "rules": [{
                		"pathImages": "/results/0/ImageSet/results",
                		"documentsNoRequired":["CIF","FEL","CUR"], ///DocumentNoRequired CIF,FEL,CUR; IMN como ID se elimina
                        "documentStatusId": ["ZP1","ZA1","ACE"], //Documento que es requerido pero que no se encuentre en estos status
                        "documentStatusText":"DOCUMENTO CAPTURADO", ///ImageBase64 en vez de text ya que es un and de docText e Img64
                        "pathStatusId":"/results/0/BpMainData/StatusId",
                        "statusId":"E0006",
                        "pathSourceId":"/results/0/BpMainData/SourceId",
                        "sourceId":"Z07",
                        "sourceIdExcluded":"Z14"

                    }
                ],
                "message": "Captura los documentos requeridos",
                "isTab":false,
                "tabError": "Documentos"
            }, {
                "name": "validateDocumentsScc",
                "desc": "Validar documentos capturados para un BP con modificación de datos",
                "fx": "validateDocumentsScc",
                "rules": [{
                    "pathImages": "/results/0/ImageSet/results",
                    "documentsNoRequired": ["CIF", "FEL", "CUR","CDO"], ///DocumentNoRequired CIF,FEL,CUR,CDO; IMN como ID se elimina
                    "documentStatusId": ["ZP1", "ZA1", "ACE"], //Documento que es requerido pero que no se encuentre en estos status
                    "documentStatusText": "DOCUMENTO CAPTURADO", ///ImageBase64 en vez de text ya que es un and de docText e Img64
                    "pathStatusId": "/results/0/BpMainData/StatusId",
                    "statusId": "E0007",
                    "pathSourceId": "/results/0/BpMainData/SourceId",
                    "sourceId": "Z14"

                }],
                "message": "Captura los documentos requeridos para actualizacón de datos.",
                "isTab": false,
                "tabError": "Documentos"
            }, {
                "name": "validateAdditional",
                "desc": "Validar adicionales",
                "fx": "validateAdditional",
                "rules": [{
                        "pathCredit": "/results/0/BpMainData/ProductId",
                        "individual": [{
                                "product": "C_IND_CI",
                                "validateConyugue" : 1,
                                "pathConyugue" : "/results/0/BpAdditionalData/Spouse/",
                                "messageConyugue" : "No se permite más de un ‘Cónyuge’",
                                "validarReferenciaP" : 6,
                                "pathReferenciaP" : "/results/0/PersonalReferenceSet/results/",
                                "messageReferenciaP" : "No puede capturar más de 6 referencias Personales",                                
                                "validateEmpleador" : 1,
                                "pathEmpleador" : "/results/0/EmployerSet/results/",
                                "messageEmpleador" : "No se permite más de un 'Empleador'"                          

                        }],                        
                        "grupal": [{
                                "productCCR": "C_GRUPAL_CCR",
                                "productCM": "C_GRUPAL_CM",
                                "validateConyugue" : 1,
                                "pathConyugue" : "/results/0/BpAdditionalData/Spouse/",
                                "messageConyugue" : "No se permite más de un ‘Cónyuge’",
                                "validateEmpleador" : 1,
                                "pathEmpleador" : "/results/0/EmployerSet/results/",
                                "messageEmpleador" : "No se permite más de un 'Empleador'"                          

                        }]                     
                    }
                ],
                "message": "",
                "isTab":true,
                "tabError": "Reference"
            },{
                "name": "validateBornDateCredit",
                "desc": "Validar Fechas adicionales",
                "fx": "validateBornDateCredit",
                "rules": [{
                        "pathCredit": "/results/0/BpMainData/ProductId",
                        "pathBirthdDate": "/results/0/BpBasicData/BirthdDate",
                        "individual": [{
                                "product": "C_IND_CI",
                                "minYears": 23,
                                "maxYears": 75,
                                "specificYears": 76,
                                "message" : "Para el producto crédito individual el rango de edad es de 23 a 75 años."                          

                        }],                        
                        "grupalccr": [{
                                "product": "C_GRUPAL_CCR",
                                "minYears": 20,
                                "maxYears": 75,
                                "specificYears": 76,
                                "message" : "Para el producto crédito comerciante el rango de edad es de 20 a 75 años."                          

                        }],                     
                        "grupalcm": [{
                                "product": "C_GRUPAL_CM",
                                "minYears": 18,
                                "maxYears": 98,
                                "specificYears": 99,
                                "message" : "Para el producto crédito mujer el rango de edad es de 18 a 98 años."                          

                        }]                     
                    }
                ],
                "message": "",
                "isTab":true,
                "tabError": "Basic"
            },{
                "name": "validateGenreProduct",
                "desc": "Validar genero acorde al producto",
                "fx": "validateGenreProduct",
                "rules": [{
                        "pathProduct": "/results/0/BpMainData/ProductId",
                        "product": "C_GRUPAL_CM",
                        "pathGender": "/results/0/BpBasicData/GenderId",
                        "gender": 2
                        
                    }
                ],
                "message": "El género no corresponde con el tipo de producto",
                "isTab":true,
                "tabError": "Basic"
            },{
                "name": "validateIsIndivWBusiness",
                "desc": "Validar persona fisica con actividad empresarial",
                "fx": "validateIsIndivWBusiness",
                "rules": [{
                        "pathIsIndivWBusiness": "/results/0/BpComplementaryData/IsIndivWBusiness",
                        "pathHomoclave": "/results/0/BpComplementaryData/Homoclave",
                        "pathFielNumber": "/results/0/BpComplementaryData/FielNumber",
                        "pathCurp": "/results/0/BpComplementaryData/Curp"
                        
                    }
                ],
                "message": "Captura los campos requeridos para la persona física con actividad empresarial (Homoclave,Fiel,Curp)",
                "isTab":true,
                "tabError": "Complementary"
            }                                    
            ]
        }
    }
    sap.rules.Applicant.prototype.getValidations = function() {
         return {
            "validations": [
                { "field": "FirstName", "statusId": ["E0003", "E0006", "E0007"], "path": "/results/0/BpName/FirstName", "required": true, "tabError": "Name", "isTab": true },
                { "field": "MiddleName", "statusId": ["E0003", "E0006", "E0007"], "path": "/results/0/BpName/MiddleName", "required": false, "tabError": "Name", "isTab": true },
                { "field": "LastName", "statusId": ["E0003", "E0006", "E0007"], "path": "/results/0/BpName/LastName", "required": true, "tabError": "Name", "isTab": true },
                { "field": "SecondName", "statusId": ["E0003", "E0006", "E0007"], "path": "/results/0/BpName/SecondName", "required": false, "tabError": "Name", "isTab": true },

                { "field": "ProductId", "statusId": ["E0003", "E0006", "E0007"], "path": "/results/0/BpMainData/ProductId", "required": false, "tabError": "Name", "isTab": true },
                { "field": "StatusId", "statusId": ["E0003", "E0006", "E0007"], "path": "/results/0/BpMainData/StatusId", "required": false, "tabError": "Name", "isTab": true },

                { "field": "GenderId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/GenderId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "BirthdDate", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/BirthdDate", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "ElectorKey", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/ElectorKey", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "CountryOfBirthId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/CountryOfBirthId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "BirthPlace", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/BirthPlace", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "NationalityId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/NationalityId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "MaritalStatusId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/MaritalStatusId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "Children", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/Children", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "SchoolLevelId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/SchoolLevelId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "HouseTypeId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/HouseTypeId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "TypeOfStoreId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/TypeOfStoreId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "GiroId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/GiroId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "IndustryId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/IndustryId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "EconomicActivityId", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/EconomicActivityId", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "VoterRegistration", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/VoterRegistration", "required": true, "tabError": "Basic", "isTab": true },
                { "field": "IsPEP", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/IsPEP", "required": false, "tabError": "Basic", "isTab": true },
                //"NamePEP": "",
                { "field": "IsRelatedToGentera", "statusId": ["E0006", "E0007"], "path": "/results/0/BpBasicData/IsRelatedToGentera", "required": false, "tabError": "Basic", "isTab": true },
                //"RelatedName": "",
                //"BasicDataStartDTime": "",
                //"RelationshipId": ""
                {"field":"Curp","statusId": [],"path":"/results/0/BpComplementaryData/Curp","required" : false,"tabError":"Complementary","isTab":true},
                {"field":"Dependents","statusId": [],"path":"/results/0/BpComplementaryData/Dependents","required" : true,"tabError":"Complementary","isTab":true},
                {"field":"JobId","statusId": [],"path":"/results/0/BpComplementaryData/JobId","required" : true,"tabError":"Complementary","isTab":true},
                {"field":"Email","statusId": [],"path":"/results/0/BpComplementaryData/Email","required" : false,"tabError":"Complementary","isTab":true},
                {"field":"TimeInTheActivityId","statusId": [],"path":"/results/0/BpComplementaryData/TimeInTheActivityId","required" : true,"tabError":"Complementary","isTab":true},
                {"field":"HowActivityId","statusId": [],"path":"/results/0/BpComplementaryData/HowActivityId","required" : true,"tabError":"Complementary","isTab":true},
                {"field":"HowMuchBusinessId","statusId": [],"path":"/results/0/BpComplementaryData/HowMuchBusinessId","required" : false,"tabError":"Complementary","isTab":true},
                {"field":"OtherSourceId","statusId": [],"path":"/results/0/BpComplementaryData/OtherSourceId","required" : false,"tabError":"Complementary","isTab":true},
                {"field":"TimeInTheBusiness","statusId": [],"path":"/results/0/BpComplementaryData/TimeInTheBusiness","required" : true,"tabError":"Complementary","isTab":true},
                {"field":"ShopFromWhoId","statusId": [],"path":"/results/0/BpComplementaryData/ShopFromWhoId","required" : true,"tabError":"Complementary","isTab":true}
                //***"EconomicActivityId": {"path":"/results/0/BpComplementaryData/EconomicActivityId","required" : true,"tabError":"Complementary"}
                //Puede ser Business Rule,
                //"IsIndivWBusiness": false,
                //"FielNumber": "",
                //"Rfc": "",  //E006(Minimos,Basicos);Adicionales Dependiendo el Producto(BR) Todos menos Complementarios; 
                ////E003 Minimos; 
                //"Homoclave": ""             
                ]   ,
            "message":"Faltan campos obligatorios"         
            }
    }

})();
