(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.helper.Entity");
  jQuery.sap.require("sap.ui.base.Object");

  sap.ui.base.Object.extend('sap.ui.helper.Entity', {});

  sap.ui.helper.Entity.prototype.getGuarantorSet = function() {
    return {
      "results" : [
        {
          "CustomerIdCRM" : "",
          "CollaboratorID" : "",
          "CustomerIdMD" : "",
          "IsAvailableForReq" : true,
          "BpName" : {
            "FirstName" : "",
            "MiddleName" : "",
            "LastName" : "",
            "SecondName" : ""
          },
          "BpMainData" : {
            "ProductId" : "",
            "RegistrationDate" : new Date(),
            "RoleId" : "ZFS005",
            "StatusId" : "",
            "StatusReasonId" : "",
            "SourceName" : "",
            "LeadIdCRM" : "",
            "ServiceOfficeID" : "",
            "ServiceOfficeName" : "",
            "ContactLaterDate" : null,
            "ContactLaterTime" : null,
            "ControlListsResult" : "",
            "RiskLevel" : "",
            "Cycle" : 0,
            "RemainingDays" : 0,
            "ServiceLevelId" : 0
          },
          "BpComplementaryData" : {
            "Curp" : "",
            "Dependents" : "0",
            "JobId" : "",
            "Email" : "",
            "TimeInTheActivityId" : "",
            "HowActivityId" : "",
            "HowMuchBusinessId" : "",
            "OtherSourceId" : "",
            "TimeInTheBusiness" : "",
            "ShopFromWhoId" : "",
            "EconomicActivityId" : "",
            "IsIndivWBusiness" : false,
            "FielNumber" : "",
            "Rfc" : "",
            "Homoclave" : ""
          },
          "BpBasicData" : {
            "GenderId" : "1",
            "BirthdDate" : null,
            "ElectorKey" : "",
            "CountryOfBirthId" : "MX",
            "BirthPlace" : "",
            "NationalityId" : "MX",
            "MaritalStatusId" : "",
            "Children" : "",
            "SchoolLevelId" : "",
            "HouseTypeId" : "",
            "TypeOfStoreId" : "",
            "GiroId" : "",
            "IndustryId" : "I",
            "EconomicActivityId" : "",
            "VoterRegistration" : "",
            "IsPEP" : false,
            "NamePEP" : "",
            "IsRelatedToGentera" : false,
            "RelatedName" : "",
            "BasicDataStartDTime" : "",
            "RelationshipId" : ""
          },
          "BpAdditionalData" : {
            "Spouse" : {
              "Job" : "",
              "WorkPhone" : "",
              "BPIdSpouse" : "",
              "BpNameData" : {
                "FirstName" : "",
                "MiddleName" : "",
                "LastName" : "",
                "SecondName" : ""
              }
            }
          },
          "BpFlag" : {"BPFlagDistinction" : 1},
          "LinkGuarantorSet" : {},
          "AddressSet" : {"results" : []},
          "PhoneSet" : {"results" : []},
          "PersonalReferenceSet" : {"results" : []},
          "EmployerSet" : {"results" : []},
          "ImageSet" : {
            "results" : [
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "IDO",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : " 1",
                "IsReceived" : true,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "ID2",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "CDO",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "CBU",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "CUR",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "CIF",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "FEL",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              }
            ]
          }
        }
      ]
    };
  };

  sap.ui.helper.Entity.prototype.getLoanRequestSet = function() {
    return {
      "LoanRequestIdCRM" : "",
      "LoanRequestIdMD" : "",
      "CollaboratorID" : "",
      "ProductID" : "",
      "ProcessType" : "",
      "GroupRequestData" : {
        "GroupID" : "",
        "GroupName" : "",
        "ContractID" : "",
        //"MemberIDSharingHouse": "",
        "MeetingDate" : "",
        "MeetingTime" : "",
        "DelayPenalty" : 0,
        "MinimumSavingsAmount" : 0,
        "AbsencePenalty" : 0,
        "MemberIDSharingHouseMD" : "",
        "GroupMeetingPlace" : {
          "PostalCode" : "",
          "CountryID" : "",
          "StateId" : "",
          "TownId" : "",
          "City" : "",
          "Suburb" : "",
          "Street" : "",
          "OutsideNumber" : "",
          "BetweenStreets1" : "",
          "BetweenStreets2" : "",
          "LocationReference" : "",
          "Comments" : "",
          "InteriorNumber" : ""
        },
        "GroupMeetingPhone" : {"PhoneTypeId" : "", "PhoneNumber" : ""}
      },
      "GeneralLoanRequestData" : {
        "IsRenewal" : false,
        "StartDate" : "",
        "Cycle" : 0,
        "StatusId" : "",
        "StatusText" : "",
        "FirstPaymentDate" : "",
        "ExpenditureDate" : "",
        "Term" : "",
        "Frequency" : "",
        "IsReadyToApprove" : false,
        "IsReadyToApproveDescription" : ""
      },
      "LinkSet" : {"results" : []},
      "ElectronicSignatureSet" : []
    };

  };
  sap.ui.helper.Entity.prototype.getCustomerSet = function() {
    return {
      "results" : [
        {
          "CustomerIdCRM" : "",
          "CustomerIdMD" : "",
          "CollaboratorID" : "",
          "BpName" : {
            "FirstName" : "",
            "MiddleName" : "",
            "LastName" : "",
            "SecondName" : ""
          },
          "BpMainData" : {
            "ProductId" : "",
            "RegistrationDate" : new Date(),
            "RoleId" : "ZFS003",
            "StatusId" : "E0000",
            "StatusReasonId" : "",
            "SourceName" : "",
            "LeadIdCRM" : "",
            "ServiceOfficeID" : "",
            "ServiceOfficeName" : "",
            "ContactLaterDate" : null,
            "ContactLaterTime" : null,
            "Cycle" : 0,
            "RemainingDays" : 0,
            "ServiceLevelId" : 0,
            "SourceId" : "",
            "ControlListsResult" : "",
            "RiskLevel" : "",
            "IsContactLaterEditable" : null,
            "AccumulatedCycle" : 0
          },
          "BpComplementaryData" : {
            "Curp" : "",
            "Dependents" : "0",
            "JobId" : "",
            "Email" : "",
            "TimeInTheActivityId" : "",
            "HowActivityId" : "",
            "HowMuchBusinessId" : "",
            "OtherSourceId" : "",
            "TimeInTheBusiness" : "",
            "ShopFromWhoId" : "",
            "EconomicActivityId" : "",
            "IsIndivWBusiness" : false,
            "FielNumber" : "",
            "Rfc" : "",
            "Homoclave" : ""
            //"MonthlySalary" : 0
          },
          "BpBasicData" : {
            "GenderId" : "1",
            "BirthdDate" : null,
            "ElectorKey" : "",
            "CountryOfBirthId" : "MX",
            "BirthPlace" : "",
            "NationalityId" : "MX",
            "MaritalStatusId" : "",
            "Children" : "0",
            "SchoolLevelId" : "",
            "HouseTypeId" : "",
            "TypeOfStoreId" : "",
            "GiroId" : "",
            "IndustryId" : "",
            "EconomicActivityId" : "",
            "VoterRegistration" : "",
            "IsPEP" : false,
            "NamePEP" : "",
            "IsRelatedToGentera" : false,
            "RelatedName" : "",
            "BasicDataStartDTime" : "",
            "RelationshipId" : ""
          },
          "BpAdditionalData" : {
            "Spouse" : {
              "Job" : "",
              "WorkPhone" : "",
              "BPIdSpouse" : "",
              "BpNameData" : {
                "FirstName" : "",
                "MiddleName" : "",
                "LastName" : "",
                "SecondName" : ""
              }
            }
          },
          "BpFlag" : {"BPFlagDistinction" : 0},
          "PreLoanRequestID" : null,
          "LinkSet" : {"results" : []},
          "AddressSet" : {"results" : []},
          "PhoneSet" : {"results" : []},
          "PersonalReferenceSet" : {"results" : []},
          "ImageSet" : {
            "results" : [
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "IDO",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : " 1",
                "IsReceived" : true,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "ID2",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "CDO",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "CBU",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "CUR",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "CIF",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              },
              {
                "ImageIdSharepoint" : "",
                "DocumentId" : "FEL",
                "ImageBase64" : "",
                "CustomerIdCRM" : "",
                "InsuranceBeneficiaryIdMD" : "",
                "IsReceived" : false,
                "DocumentStatusId" : "empty",
                "DocumentStatusText" : "Sin Captura",
                "CustomerIdMD" : "",
                "DueDate" : null,
                "InsuranceIdMD" : "",
                "LoanRequestIdCRM" : "",
                "CollaboratorID" : "",
                "LoanRequestIdMD" : ""
              }
            ]
          },

          "EmployerSet" : {"results" : []},
          "InsuranceSet" : {"results" : []},
          "LinkPreloanRequest" : {"results" : []}

        }
      ]
    };
  };

  sap.ui.helper.Entity.prototype.getIndividualLoanRequestSet = function() {
    return {
      "LoanRequestIdCRM" : "",
      "GeneralLoanRequestData" : {
        "IsRenewal" : false,
        "StartDate" : "",
        "Cycle" : 0,
        "StatusId" : "",
        "StatusText" : "",
        "FirstPaymentDate" : "",
        "ExpenditureDate" : "",
        "Term" : "",
        "Frequency" : "",
        "IsReadyToApprove" : false,
        "IsReadyToApproveDescription" : ""
      },
      "CollaboratorID" : "",
      "LoanRequestIdMD" : "",
      "ProductID" : "C_IND_CI",
      "LinkSet" : {
        "results" : [
          {
            "CollaboratorID" : "",
            "Customer" : "",
            "CustomerIdCRM" : "",
            "CustomerIdMD" : "",
            "GeneralLoanData" : {
              "ControlListsResult" : 0,
              "DispersionChannelId" : "",
              "DispersionMediumId" : "",
              "RiskLevel" : 0,
              "SemaphoreResultFilters" : 0
            },
            "IndividualLoanData" : {
              "LoanDestiny" : "01",
              "ProposedFrequency" : "",
              "ProposedFee" : 0.00,
              "ProposedAmount" : 0.00,
              "ProposedPeriod" : 0
            },
            "LoanRequestIdCRM" : "",
            "LoanRequestIdMD" : ""
          }
        ]
      },
      "ElectronicSignatureSet" : {"results" : []},
      "InsuranceSet" : {"results" : []},
      "ImageSet" : {
        "results" : [
          {
            "ImageIdSharepoint" : "",
            "DocumentId" : "IMI",
            "ImageBase64" : "",
            "CustomerIdCRM" : "",
            "InsuranceBeneficiaryIdMD" : "",
            "IsReceived" : null,
            "DocumentStatusId" : "empty",
            "DocumentStatusText" : "Sin Captura",
            "CustomerIdMD" : "",
            "DueDate" : null,
            "InsuranceIdMD" : "",
            "LoanRequestIdCRM" : "",
            "CollaboratorID" : "",
            "LoanRequestIdMD" : ""
          },
          {
            "ImageIdSharepoint" : "",
            "DocumentId" : "IME",
            "ImageBase64" : "",
            "CustomerIdCRM" : "",
            "InsuranceBeneficiaryIdMD" : "",
            "IsReceived" : null,
            "DocumentStatusId" : "empty",
            "DocumentStatusText" : "Sin Captura",
            "CustomerIdMD" : "",
            "DueDate" : null,
            "InsuranceIdMD" : "",
            "LoanRequestIdCRM" : "",
            "CollaboratorID" : "",
            "LoanRequestIdMD" : ""
          }
        ]
      },
      "LinkGuarantorSet" : {
        "results" : [
          {
            "CustomerIdCRM" : "",
            "LoanRequestIdCRM" : "",
            "LoanRequestIdMD" : "",
            "CustomerIdMD" : "",
            "GeneralLoanData" : {
              "ControlListsResult" : 0,
              "RiskLevel" : 0,
              "SemaphoreResultFilters" : 0
            },
            "Guarantor" : {
              "CustomerIdCRM" : "",
              "CollaboratorID" : "",
              "CustomerIdMD" : "",
              "BpName" : {
                "FirstName" : "",
                "MiddleName" : "",
                "LastName" : "",
                "SecondName" : ""
              },
              "BpMainData" : {"RegistrationDate" : ""},
              "AddressSet" : {
                "results" : [
                  {
                    "Latitude" : 0,
                    "Longitude" : 0,
                    "Place" : {
                      "PostalCode" : "",
                      "CountryID" : "",
                      "StateId" : "",
                      "TownId" : "",
                      "Suburb" : "",
                      "Street" : "",
                      "OutsideNumber" : "",
                      "InteriorNumber" : ""
                    }
                  }
                ]
              },
              "PhoneSet" : {"results" : [ {"PhoneNumber" : ""} ]}
            }
          }
        ]
      }
    };
  };

})();
