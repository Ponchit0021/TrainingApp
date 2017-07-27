(function() {
    "use strict";
    jQuery.sap.declare("sap.rules.Guarantor");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.rules.Guarantor', {});

    sap.rules.Guarantor.prototype.getStructure = function() {
        return {
            "bussinessRules": [{
                "name": "phoneAndAddress",
                "desc": "Validar que el aval contenga al menos un teléfono y una dirección",
                "fx": "validatePhoneAndAddress",
                "rules": [{
                        "entity": "PhoneSet",
                        "minimum": 1
                    }, {
                        "entity": "AddressSet",
                        "minimum": 1
                    }

                ],
                "message": "Debes ingresar al menos un teléfono y una dirección",
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
                "message": "Debe capturar un adicional del empleador",
                "isTab":true,
                "tabError": "Reference"
            }, {
                "name": "validateMaritalStatus",
                "desc": "...",
                "fx": "validateMaritalStatus",
                "rules": [{
                        "pathMaritalStatusId": "/results/0/BpBasicData/MaritalStatusId",
                        "maritalStatusIdRequired": "2",
                        "pathBpAdditionalData":"/results/0/BpAdditionalData/"

                    }

                ],
                "message": ["Debe capturar un 'Cónyuge' en adicionales","Solo se permite un cónyuge"],
                "isTab":true,
                "tabError": "Reference"
            },{
                "name": "validateLocal",
                "desc": "Validar tipo de propiedad del tipo de Comercio Establecido ",
                "fx": "validateLocal",
                "rules": [{
                		"pathTypeOfStoreId": "/results/0/BpBasicData/TypeOfStoreId",
                        "typeOfStoreIdRequired": "001",
                        "pathShopFromWhoId": "/results/0/BpComplementaryData/ShopFromWhoId",
                        "shopFromWhoIdEmpty":""
                    }
                ],
                "message": "Captura ¿El local es?",
                "isTab":true,
                "tabError": "Complementary"
            },
            {
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
                        "sourceId":"Z07"

                    }
                ],
                "message": "Captura los documentos requeridos",
                "isTab":false,
                "tabError": "Documentos"
            }]
        }
    }
     sap.rules.Guarantor.prototype.getValidations = function() {
         return {
            "validations": [
            	{"field":"FirstName","path":"/results/0/BpName/FirstName","required" : true,"tabError":"Name","isTab":true},
                {"field":"MiddleName","path":"/results/0/BpName/MiddleName","required" : false,"tabError":"Name","isTab":true},
                {"field":"LastName","path":"/results/0/BpName/LastName","required" : true,"tabError":"Name","isTab":true},
                {"field":"SecondName","path":"/results/0/BpName/SecondName","required" : false,"tabError":"Name","isTab":true},

                {"field":"GenderId","path":"/results/0/BpBasicData/GenderId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"BirthdDate","path":"/results/0/BpBasicData/BirthdDate","required" : true,"tabError":"Basic","isTab":true},
                {"field":"ElectorKey","path":"/results/0/BpBasicData/ElectorKey","required" : true,"tabError":"Basic","isTab":true},
                {"field":"CountryOfBirthId","path":"/results/0/BpBasicData/CountryOfBirthId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"BirthPlace","path":"/results/0/BpBasicData/BirthPlace","required" : true,"tabError":"Basic","isTab":true},
                {"field":"NationalityId","path":"/results/0/BpBasicData/NationalityId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"MaritalStatusId","path":"/results/0/BpBasicData/MaritalStatusId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"Children","path":"/results/0/BpBasicData/Children","required" : true,"tabError":"Basic","isTab":true},
                {"field":"SchoolLevelId","path":"/results/0/BpBasicData/SchoolLevelId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"HouseTypeId","path":"/results/0/BpBasicData/HouseTypeId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"TypeOfStoreId","path":"/results/0/BpBasicData/TypeOfStoreId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"GiroId","path":"/results/0/BpBasicData/GiroId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"IndustryId","path":"/results/0/BpBasicData/IndustryId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"EconomicActivityId","path":"/results/0/BpBasicData/EconomicActivityId","required" : true,"tabError":"Basic","isTab":true},
                {"field":"VoterRegistration","path":"/results/0/BpBasicData/VoterRegistration","required" : true,"tabError":"Basic","isTab":true},
                {"field":"IsPEP","path":"/results/0/BpBasicData/IsPEP","required" : false,"tabError":"Basic","isTab":true},
                //"NamePEP": "",
                {"field":"IsRelatedToGentera","path":"/results/0/BpBasicData/IsRelatedToGentera","required" : false,"tabError":"Basic","isTab":true},
                //"RelatedName": "",
                //"BasicDataStartDTime": "",
                //"RelationshipId": ""
                //{"field":"Curp","path":"/results/0/BpComplementaryData/Curp","required" : false,"tabError":"Complementary","isTab":true},
                //{"field":"Dependents","path":"/results/0/BpComplementaryData/Dependents","required" : false,"tabError":"Complementary","isTab":true},
                {"field":"JobId","path":"/results/0/BpComplementaryData/JobId","required" : true,"tabError":"Complementary","isTab":true},
                //{"field":"Email","path":"/results/0/BpComplementaryData/Email","required" : false,"tabError":"Complementary","isTab":true},
                //{"field":"TimeInTheActivityId","path":"/results/0/BpComplementaryData/TimeInTheActivityId","required" : true,"tabError":"Complementary","isTab":true},
                //{"field":"HowActivityId","path":"/results/0/BpComplementaryData/HowActivityId","required" : true,"tabError":"Complementary","isTab":true},
                //{"field":"HowMuchBusinessId","path":"/results/0/BpComplementaryData/HowMuchBusinessId","required" : false,"tabError":"Complementary","isTab":true},
                //{"field":"OtherSourceId","path":"/results/0/BpComplementaryData/OtherSourceId","required" : false,"tabError":"Complementary","isTab":true},
                //{"field":"TimeInTheBusiness","path":"/results/0/BpComplementaryData/TimeInTheBusiness","required" : true,"tabError":"Complementary","isTab":true},
                //{"field":"ShopFromWhoId","path":"/results/0/BpComplementaryData/ShopFromWhoId","required" : true,"tabError":"Complementary","isTab":true}
                //***"EconomicActivityId": {"path":"/results/0/BpComplementaryData/EconomicActivityId","required" : true,"tabError":"Complementary"}
                //Puede ser Business Rule,
                //"IsIndivWBusiness": false,
                //"FielNumber": "",
                //"Rfc": "",
                //"Homoclave": ""             
                ]   ,
            "message":"Faltan campos obligatorios"         
            }
	}


})();
