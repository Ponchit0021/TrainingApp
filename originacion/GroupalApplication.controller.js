 var oApplicantsList = []; //lista de id's solicitantes asignados a la solicitud
 var myData = null; //requerido para obtener id y rev
 var isUpdate = false;


 /////////////////////

 sap.ui.controller("originacion.GroupalApplication", {
     oSignatureBase: "",

     /**
      * Called when a controller is instantiated and its View controls (if available) are already created.
      * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
      * @memberOf originacion.GroupalApplication
      */

     /** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed.
      * Since the Controller is given to this method, its event handlers can be attached right away.
      * @memberOf originacion.GroupalApplication
      */


     /**
      * [onInitializeLoanRequest description]
      * @param  {[type]} _oDetailModel [inicializa modelo recuperado de consulta o crea modelo nuevo para el caso de creacion]
      * @return {[type]}               [description]
      */
     onInitializeLoanRequest: function(_oDetail) {
         var oView;
         var oBtnGropuEnviarCore;

         this.oCustomerInRequestArray = []; //// Los que ya existen en el modelo que viene de Gateway
         this.AssociatedBPs = 0; /// Validar que al menos haya un BP asociado
         this.oCustomerIdsVisual = []; /// Id's de los solicitantes pertenecientes a la solicitud
         this.oCustomerIdsVisualCRM = []; /// Id's de los solicitantes pertenecientes a la solicitud (Id CRM para los solicitantes que no provienen del dispositivo)
         this.oCurrentSignaturePromoter = "";
         this.oCurrentSignatureApplicant = "";
         this.oEnableDelete = true;
         this.bIsEnabled = true;
         this.registerApplicationRoles();
         this.aIsCustomerOriginal = new Array();
         this.signatureOpen = false; /// Variable para controlar la apertura del popup de firma
         this.blockCustomersIncomplete = false; /// Campo utilizado para determinar si todos los solicitantes estan disponibles en el servicio (Kapsel)
         sap.ui.getCore().AppContext.bSaveApprove = false;

         //Obtenemos la vista solicitud grupal
         oView = this.getView();

         /***************************** LOGICA DE ACTUALIZACION o CREACIÓN *********************/
         if (this.sLoanRequestId === "0") { //// Si es creacion

             oView.setModel(this.setMainValuesOfModel(_oDetail), "oLoanRequestModel");
             oView.getModel("oLoanRequestModel").refresh(true);
             this.sLoanRequestIdCRM = "";
             sap.ui.getCore().AppContext.bHasGroupalLoanID = false;

             sap.ui.getCore().AppContext.bIsCreating = true;

         } else { //Si es edicion
             sap.ui.getCore().AppContext.bIsCreating = false;


             oView.setModel(_oDetail, "oLoanRequestModel");
             oView.getModel("oLoanRequestModel").refresh(true);
             this.sLoanRequestIdCRM = _oDetail.LoanRequestIdCRM;
             sap.ui.getCore().AppContext.bHasGroupalLoanID = false;

         }

         this.retrieveCustomersInLoan();

         this.calculateMembersTableHeader();

         this.determineIfFormIsEnabled(_oDetail.getProperty("/"));

         this.showMessageBlockCustomersIncomplete();

         this.disableGroupNameIfEditing();

         this.loadRolCatalog(); /// Crear diccionario de roles

         /////// Deshabilitar boton de enviar al core hasta haber utilizado guardar
         oBtnGropuEnviarCore = sap.ui.getCore().byId("btnGropuEnviarCore");
         oBtnGropuEnviarCore.setEnabled(false);
         this.bAlreadySavedOnPouch = false;
     },

     showMessageBlockCustomersIncomplete: function() {

         if (this.blockCustomersIncomplete) {
             sap.m.MessageToast.show("Uno de los solicitantes no fue encontrado. Por favor sincronice e inténtelo de nuevo más tarde.");
         }

     },


     /**
      * [registerApplicationRoles Configura los roles de integrante segun el producto]
      * @return {[type]} [description]
      */
     registerApplicationRoles: function() {
         ////////////////////////////
         // Banderas para roles
         ///////////////////////////
         if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CCR") { /// Credito grupal

             this.memberRoles = {
                 ZG04: "", /// Representante
                 ZG06: "" /// Suplente
             };

         } else { /// Credito mujer

             this.memberRoles = {
                 ZG01: "", /// Presidenta
                 ZG02: "", /// Tesorera
                 ZG03: "" /// Secretaria

             };
         };
     },



     saveApprove: function() {
         var oController = this,
             oLoanRequestSerializer, oBtnGropuEnviarCore;

         jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
         oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");

         var createData = new sap.ui.serialize.BP("dataDB", "Customer")
             .getMainModel("CustomerSet", sap.ui.getCore().AppContext.Promotor);

         createData.then(oController.onCreate.bind(oController))
             .then(function(oFinalModel) {
                 oFinalModel.startDate = this.formatJSONDate(oFinalModel.startDate);
                 oFinalModel.firstPaymentDate = this.formatJSONDate(oFinalModel.firstPaymentDate);
                 oFinalModel.expenditureDate = this.formatJSONDate(oFinalModel.expenditureDate);
                 oFinalModel.IsApproved = true; 

                 oLoanRequestSerializer.serialize(oFinalModel).then(function(msg) {
                     oLoanRequestSerializer.relateCustomersToLoan(oFinalModel.loanRequestIdMD, oFinalModel.CustomerSet);

                     //////// Habilitar boton enviar al core
                     this.bAlreadySavedOnPouch = true;
                     oBtnGropuEnviarCore = sap.ui.getCore().byId("btnGropuEnviarCore");
                     oBtnGropuEnviarCore.setEnabled(true);

                     sap.m.MessageToast.show("Regresando a pantalla principal");
                     this.backToTiles();


                 }.bind(this)).catch(function() {
                     sap.m.MessageToast.show("¡Ups! Existe un error en la red, intente más tarde.");

                 });
             });

     },

     determineIfFormIsEnabled: function(oCurrentLoanRequest) {
         var bIsEnabledRevied;
         if (this.sLoanRequestId === "0") {

             this.bIsEnabled = true;
             sap.ui.getCore().AppContext.bIsGroupalFormEnabled = true;
             this.onFormEnable(true);


         } else {
             // Bloquear Form si la oportunidad ya no esta en status de "En proceso"
             if (oCurrentLoanRequest.IsApproved ||
                 oCurrentLoanRequest.GeneralLoanRequestData.StatusId === "E0009" ||
                 oCurrentLoanRequest.GeneralLoanRequestData.StatusId === "E0011" ||
                 oCurrentLoanRequest.GeneralLoanRequestData.StatusId === "E0013" ||
                 oCurrentLoanRequest.GeneralLoanRequestData.StatusId === "E0014" ||
                 oCurrentLoanRequest.GeneralLoanRequestData.StatusId === "E0017" ||
                 this.blockCustomersIncomplete
             ) {

                 this.bIsEnabled = false;
                 this.onFormEnable(false);
                 sap.ui.getCore().AppContext.bIsGroupalFormEnabled = false;

             } else {

                 bIsEnabledRevied = false;
                 /////// Bloquear la oportunidad si se encuentra en Queue de sincronización
                 if (oCurrentLoanRequest.hasOwnProperty("IsEntityInQueue")) {
                     if (oCurrentLoanRequest.IsEntityInQueue === true) {
                         this.bIsEnabled = false;
                         this.onFormEnable(false);
                         sap.ui.getCore().AppContext.bIsGroupalFormEnabled = false;
                         bIsEnabledRevied = true;
                     }
                 }
                 /// De otra forma, dejar la oportunidad habilitada
                 if (!bIsEnabledRevied) {
                     this.bIsEnabled = true;
                     this.onFormEnable(true);
                     sap.ui.getCore().AppContext.bIsGroupalFormEnabled = true;
                 }


             }
         }

     },

     retrieveModel: function(_sModelName) {

         var oTmpModel;

         oTmpModel = this.getView().getModel(_sModelName);
         if (!oTmpModel) {
             oTmpModel = new sap.ui.model.json.JSONModel();
         }
         return oTmpModel;

     },

     retrieveCustomersInLoan: function() {

         var oLoanRequestModel, oLoanMembers, oView, oCustomerInRequest;

         oCustomerInRequest = [];

         oView = this.getView();

         if (sap.ui.getCore().AppContext.bIsCreating) {

             this.AssociatedBPs = 0;

         } else {

             oLoanRequestModel = this.retrieveModel("oLoanRequestModel");
             if (oLoanRequestModel.getProperty("/LinkSet/results")) {

                 oCustomerInRequest = oLoanRequestModel.getProperty("/LinkSet/results").slice();

                 oCustomerInRequest.forEach(function(oCustomer) {


                     if (typeof oCustomer.Customer === "string") {
                         // El customer no se cargo correctamente
                         this.blockCustomersIncomplete = true;
                     }

                     if (oCustomer.GroupLoanData.RejectionCauseId === "") {
                         this.AssociatedBPs = this.AssociatedBPs + 1;
                     }
                     this.oCustomerInRequestArray.push(oCustomer.CustomerIdMD.toUpperCase()); /// Guardamos el indice de los solicitantes que ya existen en la oportunidad
                     this.oCustomerIdsVisual.push(oCustomer.CustomerIdMD.toUpperCase()); //// Agregar tambien al arreglo visual
                     if (oCustomer.CustomerIdCRM.toUpperCase() === "") { /// Si no tiene CustomerIdCRM
                         this.oCustomerIdsVisualCRM.push("0"); //// Agregar tambien al arreglo visual
                     } else {
                         this.oCustomerIdsVisualCRM.push(oCustomer.CustomerIdCRM.toUpperCase()); //// Agregar tambien al arreglo visual
                     }
                     this.aIsCustomerOriginal.push(oCustomer.CustomerIdMD.toUpperCase());
                     if (typeof oCustomer.GroupLoanData.RoleInTheGroupId !== undefined) {
                         if (oCustomer.GroupLoanData.RoleInTheGroupId !== "" && oCustomer.GroupLoanData.RoleInTheGroupId !== "ZG05") {
                             this.memberRoles[oCustomer.GroupLoanData.RoleInTheGroupId] = oCustomer.GroupLoanData.RoleInTheGroupId;
                         }
                     }

                 }.bind(this));

             }

         }

         oLoanMembers = this.retrieveModel("oLoanMembers");
         oLoanMembers.setProperty("/CustomerSet", oCustomerInRequest);
         oView.setModel(oLoanMembers, "oLoanMembers");
         oLoanMembers.refresh(true);

     },

     calculateMembersTableHeader: function() {
         // Poner el número de integrantes
         var oCustomerTable;
         oCustomerTable = sap.ui.getCore().byId("tblListMembers");
         if (oCustomerTable) {

             if (this.AssociatedBPs < 1) {
                 oCustomerTable.setHeaderText(" 0 Integrantes");
             }
             if (this.AssociatedBPs === 1) {
                 oCustomerTable.setHeaderText(" 1 Integrante");
             }

             if (this.AssociatedBPs > 1) {
                 oCustomerTable.setHeaderText(this.AssociatedBPs + " Integrantes");
             }

         }
     },

     disableGroupNameIfEditing: function() {

         setTimeout(function() {
             if (!sap.ui.getCore().AppContext.bIsCreating) {
                 sap.ui.getCore().byId("txtGroupName").setEnabled(false);
             } else {
                 sap.ui.getCore().byId("txtGroupName").setEnabled(true);
             }
         }, 2000);

     },






     sendInformationToCore: function() {

         var oLoanRequestModel;
         var oRequest;
         var oLoanRequestBuffer, oLoanRequestSerializer;
         var oNotification;
         var oLoanRequestSync;

         jQuery.sap.require("js.buffer.loanRequest.LoanRequestBuffer");
         jQuery.sap.require("js.sync.loanRequest.LoanRequestSynchronizer");

         oLoanRequestModel = this.getView().getModel("oLoanRequestModel");

         oRequest = {

             requestMethod: "POST", //::: POST deberia venir del diccionario
             requestUrl: "/LoanRequestSet",
             requestBodyId: oLoanRequestModel.getProperty("/LoanRequestIdMD"),
             requestStatus: "Initial", ///::: Status deberia venir del diccionario
             requestConfirmed: false,
             requestDescription: oLoanRequestModel.getProperty("/GroupRequestData/GroupName"),
             id: oLoanRequestModel.getProperty("/LoanRequestIdMD"),
             productID: "C_GRUPAL_CCR",
             // PouchDB id
             NotificationID: sap.ui.getCore().AppContext.NotificationID /// Guardar NotificationID (Para notificaciones con error de CRM)

         };

         oLoanRequestSync = new sap.ui.sync.LoanRequest("dataDB", "syncDB");
         /////// 11/04/2016 EAMARCE :: Si hay notificationID, agregar la notificación a la lista de notificaciones con error
         if (sap.ui.getCore().AppContext.NotificationID) {

             if (sap.ui.getCore().AppContext.NotificationID !== "") {
                 oNotification = {};
                 oNotification.notificationID = sap.ui.getCore().AppContext.NotificationID;
                 oLoanRequestSync.saveUpdateError(oNotification);
                 sap.ui.getCore().AppContext.NotificationID = "";

             }
         }
         /////// 11/04/2016 EAMARCE :: Si hay notificationID, agregar la notificación a la lista de notificaciones con error

         oLoanRequestBuffer = new sap.ui.buffer.LoanRequest("syncDB");
         oLoanRequestBuffer.postRequest(oRequest);

         jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
         oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");

         oLoanRequestSerializer.updateFlagEntitityInQueue(oLoanRequestModel.getProperty("/LoanRequestIdMD"), true)
             .then(function(sloanRequestIdMD, oLoanRequestSync, result) {

                 /////// Eliminar Business Error
                 oLoanRequestSync.deleteBusinessError({ id: sloanRequestIdMD }).then(
                     function(result) {

                         //// Agregar id de notificación a notificaciones
                         ///  con error para que intente retry automático al iniciar la sincronización
                         this.closeSendCore();
                         sap.m.MessageToast.show("Solicitud preparada para enviar a Integra");
                         this.backToTiles();

                     }.bind(this)
                 );
             }.bind(this, oLoanRequestModel.getProperty("/LoanRequestIdMD"), oLoanRequestSync));


     },

     onGenerateLoanRequestId: function() {
         jQuery.sap.require("js.base.IdentifierBase");

         var oIdentifierBase;
         oIdentifierBase = new sap.ui.mw.IdentifierBase();
         return oIdentifierBase.createId();
     },

     formatJSONDate: function(_oDate) {
         if (_oDate) {
             if (_oDate !== null) {
                 if (typeof _oDate.getTime !== "undefined") {
                     return "/Date(" + _oDate.getTime() + ")/";
                 }
             }
         }
         return _oDate;
     },



     onInit: function() {

         jQuery.sap.require("js.base.NavigatorBase", "js.kapsel.Rest", "js.serialize.GeneralSerialize", "js.helper.Dictionary", "js.serialize.loanRequest.LoanRequestSerialize", "js.serialize.bp.BPSerialize");

         //implementación de la ruta - queryParams
         var oRouter = this.getRouter();
         oRouter.getRoute("groupalApplication").attachMatched(this._onRouteMatched.bind(this), this);

     },
     getRouter: function() {
         return sap.ui.core.UIComponent.getRouterFor(this);
     },
     /**
      * [bindApplications Función usada en el listener de la ruta]
      * @param  {[map]} oEvent   [Map del evento ocurrido en la ruta]
      * @return {[NA]}         [NA]
      */
     _onRouteMatched: function(oEvent) {

         var oArgs, oController, oGeneralSerialize, oDictionary, oParams, oTabGroup1, oTabGroup3;
         var bIsAnnouncement, oLoanRequestSerialize, itbGroupApp;

         bIsAnnouncement = false;
         if (oEvent.getParameter("arguments")["?query"]) {
             if (oEvent.getParameter("arguments")["?query"].hasOwnProperty("announcement")) {
                 bIsAnnouncement = oEvent.getParameter("arguments")["?query"].announcement ? true : false;
             }
         }


         oGeneralSerialize = new sap.ui.serialize.General("dataDB");
         oLoanRequestSerialize = new sap.ui.serialize.LoanRequest("dataDB");
         oDictionary = new sap.ui.helper.Dictionary();

         oController = this;
         oArgs = oEvent.getParameter("arguments");

         oController.sGrupalTypeId = oArgs.grupalTypeID;
         oController.sLoanRequestId = oArgs.loanRequestId;

         //Cambiar el parametro de entrada cuando nos confirme el equipo de odata
         oParams = {
             LoanRequestIdMD: oArgs.loanRequestId
         };

         oGeneralSerialize.getEntityDetail(oDictionary.oDataRequest(oParams).getRequest("LoanRequestSet"), oArgs.loanRequestId).then(oLoanRequestSerialize.getModelReviewed.bind(oLoanRequestSerialize, "LoanRequestSet", oArgs.loanRequestId, bIsAnnouncement, this.getRouter())).then(oController.onInitializeLoanRequest.bind(this));

         itbGroupApp = sap.ui.getCore().byId("itbGroupApp").fireSelect({
             key: 'itfGroupApp1'
         });

         sap.ui.getCore().AppContext.sGrupalTypeID = oArgs.grupalTypeID

         if (sap.ui.getCore().AppContext.sGroupalLoanLastProductId !== sap.ui.getCore().AppContext.sGrupalTypeID) {

             oTabGroup3 = sap.ui.getCore().byId("itfGroupApp3");
             if (oTabGroup3) {
                 oTabGroup3.destroyContent(); // Destruir contenido de 3
             }

             oTabGroup1 = sap.ui.getCore().byId("itfGroupApp1");
             if (oTabGroup1) {
                 sap.ui.getCore().byId("itbGroupApp").setSelectedKey("itfGroupApp1");
             }
         }
     },

     onModifyIntegrant: function(_oEvent) {

         if (this.bIsEnabled) {

             this.detailMember(_oEvent, true);

         }

     },



     /****************************************************************************
     //  EndChange DVH 12-09-2016
     /****************************************************************************/
     navigateToTab: function(sTab) {
         var itbGroupApp;
         itbGroupApp = sap.ui.getCore().byId("itbGroupApp").setSelectedKey(sTab);
         itbGroupApp = sap.ui.getCore().byId("itbGroupApp").fireSelect({
             key: sTab
         });
         return false;

     },


     //se envia información de la oportunidad al core
     save: function() {


         ///// Validaciones de la primera página?
         var oInputBase;
         var oDate, oDtpNciFirstPaymentDate, oTxtNciDateExpenditureDate;
         var oLoanRequestSerializer;

         sap.ui.getCore().AppContext.loader.show("Guardando datos");

         oDate = new Date();

         oDtpNciFirstPaymentDate = sap.ui.getCore().byId("txtGpoFisrtDate");

         if (oDtpNciFirstPaymentDate) {

             if (oDtpNciFirstPaymentDate.getValueState() == sap.ui.core.ValueState.Error || oDtpNciFirstPaymentDate.getValueState() == sap.ui.core.ValueState.None) {

                 sap.m.MessageToast.show("Debe completar La fecha de 'Primer Pago'.");
                 this.closeSendCore();
                 return false;

             }


             if (oDtpNciFirstPaymentDate.getDateValue() !== null) {
                 if (oDtpNciFirstPaymentDate.getDateValue().setHours(0, 0, 0, 0) <= oDate.setHours(0, 0, 0, 0)) {

                     this.closeSendCore();
                     sap.m.MessageToast.show("Debe completar La fecha de 'Primer Pago'.");
                     this.navigateToTab('itfGroupApp3');
                     oDtpNciFirstPaymentDate.setValueState('Error');
                     return false;

                 } else {
                     oDtpNciFirstPaymentDate.setValueState('Success');
                 }
             }


         }

         oTxtNciDateExpenditureDate = sap.ui.getCore().byId("txtGpoDesembolso");

         if (oTxtNciDateExpenditureDate) {

             if (oTxtNciDateExpenditureDate.getValueState() == sap.ui.core.ValueState.Error || oTxtNciDateExpenditureDate.getValueState() == sap.ui.core.ValueState.None) {

                 sap.m.MessageToast.show("Debe completar La fecha de 'Desembolso'.");
                 this.closeSendCore();
                 return false;

             }

             if (oTxtNciDateExpenditureDate.getDateValue() !== null) {
                 if (oTxtNciDateExpenditureDate.getDateValue().setHours(0, 0, 0, 0) <= oDate.setHours(0, 0, 0, 0)) {
                     this.closeSendCore();
                     sap.m.MessageToast.show("Debe completar La fecha de 'Desembolso'.");
                     this.navigateToTab('itfGroupApp3');
                     oTxtNciDateExpenditureDate.setValueState('Error');
                     return false;

                 } else {

                     oTxtNciDateExpenditureDate.setValueState('Success');
                 }
             }

         }

         //////////// Validaciones de fecha

         oInputBase = new sap.ui.mw.InputBase();



         if (this.AssociatedBPs <= 0) {
             this.closeSendCore();
             sap.m.MessageToast.show("La solicitud debe contener al menos 1 solicitante asignado.");
             this.navigateToTab('itfGroupApp2');
             return false;
         }

         if (!oInputBase.validationForForm("txtGroupName", "Input").type) {
             this.closeSendCore();
             sap.m.MessageToast.show("La solicitud requiere un nombre de grupo.");
             this.navigateToTab('itfGroupApp1');
             return false;

         }

         if (!oInputBase.validationForForm("selectGroupDisperserChanel", "Select").type) {
             sap.m.MessageToast.show(oInputBase.validationForForm("selectGroupDisperserChanel", "Select").message);
             this.navigateToTab('itfGroupApp3');
             return false;
         }
         if (!oInputBase.validationForForm("selectGroupDisperser", "Select").type) {

             sap.m.MessageToast.show(oInputBase.validationForForm("selectGroupDisperser", "Select").message);
             this.navigateToTab('itfGroupApp3');
             return false;
         }



         jQuery.sap.require("js.serialize.loanRequest.LoanRequestSerialize");
         oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");

         var oController = this;
         var oBtnGropuEnviarCore;

         var createData = new sap.ui.serialize.BP("dataDB", "Customer")
             .getMainModel("CustomerSet", sap.ui.getCore().AppContext.Promotor);

         createData.then(oController.onCreate.bind(oController))
             .then(function(oFinalModel) {

                 oLoanRequestSerializer.serialize(oFinalModel).then(function(msg) {

                     sap.ui.getCore().AppContext.loader.close();
                     oController.closeSendCore();
                     sap.m.MessageToast.show("Registrado.");

                     sap.ui.getCore().AppContext.oRefreshSyncElements();

                     //////// Habilitar boton enviar al core
                     oController.bAlreadySavedOnPouch = true;
                     oBtnGropuEnviarCore = sap.ui.getCore().byId("btnGropuEnviarCore");
                     oBtnGropuEnviarCore.setEnabled(true);

                 }.bind(this)).catch(function() {

                 });
             });




     },

     mergeDataCustomer: function(oModelFinal, oModelCustomerSet) {

         return new Promise(function(resolve) {

             var idCustomerIdCRM = "",
                 idCustomerIdCRMLinkSet = "";
             for (var rt = 0; rt < oModelFinal.LinkSet.results.length; rt++) {

                 idCustomerIdCRMLinkSet = oModelFinal.LinkSet.results[rt].CustomerIdCRM;
                 for (var ji = 0; ji < oModelCustomerSet.getProperty("/results").length; ji++) {
                     idCustomerIdCRM = oModelCustomerSet.getProperty("/results/" + ji + "/CustomerIdCRM");
                     if (idCustomerIdCRMLinkSet === idCustomerIdCRM) {

                         oModelFinal.LinkSet.results[rt].Customer.AddressSet = oModelCustomerSet.getProperty("/results/" + ji + "/AddressSet")
                         oModelFinal.LinkSet.results[rt].Customer.EmployerSet = oModelCustomerSet.getProperty("/results/" + ji + "/EmployerSet")
                         oModelFinal.LinkSet.results[rt].Customer.ImageSet = oModelCustomerSet.getProperty("/results/" + ji + "/ImageSet")
                         oModelFinal.LinkSet.results[rt].Customer.PhoneSet = oModelCustomerSet.getProperty("/results/" + ji + "/PhoneSet")

                     }
                 }
             }

             resolve(oModelFinal);
         });
     },
     mergeLinkSet: function(oModelFinal) {
         var oController = this;

         return new Promise(function(resolve) {

            var oObjectBase = new sap.ui.mw.ObjectBase();
             /*Cambia el flujo con tiempo*/
             /////// Si esta creando, no enviar los customers que tengan rejection cause

             if (oModelFinal.LinkSet.hasOwnProperty("results")) {

                 var oLoanRequestSerializer, i;
                 oLoanRequestSerializer = new sap.ui.serialize.LoanRequest("dataDB");

                 var oCustomerSerialize;
                 oCustomerSerialize = new sap.ui.serialize.BP("dataDB", "Customer");

                 var aCustomers = [];
                 var aRejectedCustomers = [];

                 for (i = 0; i < oModelFinal.LinkSet.results.length; i++) {

                    if (oModelFinal.LinkSet.results[i].Customer){
                     
                         oModelFinal.LinkSet.results[i].Customer.BpBasicData.BirthdDate = oController.formatJSONDate(oModelFinal.LinkSet.results[i].Customer.BpBasicData.BirthdDate);
                         oModelFinal.LinkSet.results[i].Customer.BpBasicData.RegistrationDate = oController.formatJSONDate(oModelFinal.LinkSet.results[i].Customer.BpBasicData.RegistrationDate);

                         oObjectBase.deletePropertyFromObject(oModelFinal.LinkSet.results[i].Customer.Spouse, "__metadata");
                         oObjectBase.deletePropertyFromObject(oModelFinal.LinkSet.results[i].GroupLoanData, "__metadata");
                         oObjectBase.deletePropertyFromObject(oModelFinal.LinkSet.results[i].IndividualLoanData, "__metadata");
                         oObjectBase.deletePropertyFromObject(oModelFinal.LinkSet.results[i].GeneralLoanData, "__metadata");
                         oObjectBase.deletePropertyFromObject(oModelFinal.LinkSet.results[i], "IsEntityInQueue");
                         oObjectBase.deletePropertyFromObject(oModelFinal.LinkSet.results[i], "__metadata");

                         ////////// Modificación para serializar fechas con formato de modelo

                         if (oController.aIsCustomerOriginal.indexOf(oModelFinal.LinkSet.results[i].CustomerIdMD.toUpperCase()) < 0) { /// Si no es de los originales

                             oModelFinal.LinkSet.results[i].bIsOriginalGW = false;

                             if (oModelFinal.LinkSet.results[i].GroupLoanData.RejectionCauseId === "") {

                                 aCustomers.push(oModelFinal.LinkSet.results[i]);

                             } else {


                                 aRejectedCustomers.push(oModelFinal.LinkSet.results[i].CustomerIdMD.toUpperCase());
                                 oLoanRequestSerializer.deleteLinkSet(oModelFinal.LinkSet.results[i]);
                                 oCustomerSerialize.deleteBPOpportunityOnly(oModelFinal.LinkSet.results[i].CustomerIdMD);

                             }

                         } else { /////// Si es de los originales,

                             if (oModelFinal.LinkSet.results[i].bIsOriginalGW === false) {
                                 /// No es de los originales de GW

                                 if (oModelFinal.LinkSet.results[i].GroupLoanData.RejectionCauseId === "") {
                                     //// No tiene rejection cause
                                     aCustomers.push(oModelFinal.LinkSet.results[i]);
                                 } else {
                                     /// Borrar posible LinkSet
                                     oLoanRequestSerializer.deleteLinkSet(oModelFinal.LinkSet.results[i]);
                                     oCustomerSerialize.deleteBPOpportunityOnly(oModelFinal.LinkSet.results[i].CustomerIdMD);
                                 }
                             } else {
                                 /// Es de los originales de GW
                                 aCustomers.push(oModelFinal.LinkSet.results[i]);
                             }
                         }
                    } else{  
                        sap.ui.getCore().AppContext.loader.close();
                        oController.closeSendCore();
                        sap.m.MessageToast.show("Uno de los solicitantes no fue encontrado. Por favor sincroniza nuevamente");
                        return false;
                    }
                 }
                 oModelFinal.LinkSet = aCustomers;
             }

             /////// Si esta creando, no enviar los customers que tengan rejection cause
             if (oModelFinal.ElectronicSignatureSet) {

                 if (oModelFinal.ElectronicSignatureSet.results) {

                     oModelFinal.ElectronicSignatureSet = oModelFinal.ElectronicSignatureSet.results;
                     if (Object.prototype.toString.call(oModelFinal.ElectronicSignatureSet) === '[object Array]') {

                         ////// Si esta creando

                         ////// Si hay usuarios borrados, eliminar firmas
                         if (aRejectedCustomers.length > 0) {

                             var aFinalSignatures = [];

                             for (i = 0; i < oModelFinal.ElectronicSignatureSet.length; i++) {

                                 if (oController.aIsCustomerOriginal.indexOf(oModelFinal.ElectronicSignatureSet[i].CustomerIdMD.toUpperCase()) < 0) {

                                     if (aRejectedCustomers.indexOf(oModelFinal.ElectronicSignatureSet[i].CustomerIdMD.toUpperCase()) < 0) {
                                         ///////// La firma no pertenece a un customer eliminado

                                         aFinalSignatures.push(oModelFinal.ElectronicSignatureSet[i]);

                                     }

                                 } else {

                                     aFinalSignatures.push(oModelFinal.ElectronicSignatureSet[i]);

                                 }

                             }

                             oModelFinal.ElectronicSignatureSet = aFinalSignatures;
                         }

                         if (oModelFinal.ElectronicSignatureSet.length === 0) {
                             oObjectBase.deletePropertyFromObject(oModelFinal, "ElectronicSignatureSet");

                         }
                     } else {
                         oObjectBase.deletePropertyFromObject(oModelFinal, "ElectronicSignatureSet");
                     }

                 } else {
                     oObjectBase.deletePropertyFromObject(oModelFinal, "ElectronicSignatureSet");
                 }

             }
             if (oModelFinal.LinkGuarantorSet) {
                 oObjectBase.deletePropertyFromObject(oModelFinal, "LinkGuarantor");
             } else {
                 if (oModelFinal.LinkGuarantorSet === null) {
                     oObjectBase.deletePropertyFromObject(oModelFinal, "LinkGuarantor");
                 }
             }
             oObjectBase.deletePropertyFromObject(oModelFinal.GroupRequestData, "__metadata");
             oObjectBase.deletePropertyFromObject(oModelFinal.GroupMeetingPlace, "__metadata");
             oObjectBase.deletePropertyFromObject(oModelFinal, "__metadata");


             oModelFinal.GeneralLoanRequestData.StartDate = oController.formatJSONDate(oModelFinal.GeneralLoanRequestData.StartDate);
             oModelFinal.GeneralLoanRequestData.FirstPaymentDate = oController.formatJSONDate(oModelFinal.GeneralLoanRequestData.FirstPaymentDate);
             oModelFinal.GeneralLoanRequestData.ExpenditureDate = oController.formatJSONDate(oModelFinal.GeneralLoanRequestData.ExpenditureDate);
             resolve(oModelFinal);
         });
     },
     onCreate: function(oModelResultsCustomer) {
         var oController;
         oController = this;

         return new Promise(function(resolve) {


             jQuery.sap.require("js.base.ObjectBase");

             var oModelData, oModel, oModelFinal;

             oModel = oController.getView().getModel("oLoanRequestModel");
             oModel.setProperty("/ProductID", oController.sGrupalTypeId);
             oModelData = oModel.getProperty("/");

             oModelFinal = {};
             oModelFinal = jQuery.extend(true, oModelFinal, oModelData);
             oModelFinal.GroupRequestData.GroupName = oModelFinal.GroupRequestData.GroupName.toUpperCase();


             oController.mergeDataCustomer(oModelFinal, oModelResultsCustomer)
                 .then(oController.mergeLinkSet.bind(oController))
                 .then(resolve);

             //Se adiere los set a linkSet/Customer/
         });


     },


     onValidateAddress: function() {

         var oLoanRequestModel, oMeetingPlace;
         oLoanRequestModel = this.getView().getModel("oLoanRequestModel");
         oMeetingPlace = oLoanRequestModel.getProperty("/groupRequestData/groupMeetingPlace")

         for (var property in oMeetingPlace) {
             if (oMeetingPlace.hasOwnProperty(property)) {
                 if (oMeetingPlace[property] === "") {
                     return false;
                 }
             }
         }

         return true;
     },

     /////// Explorar tabs para deshabilitar o habilitar controles
     onFormEnable: function(_bEnable, itf) {

         var iCounter, oTabs; /// Romper el procesamiento si más de 3 elementos tienen el status
         /// Bandera para deshabilita el llamado en los iconos de rejectionCause
         this.oEnableDelete = _bEnable;

         iCounter = 0;

         /// Deshabilitar botones de la pantalla principal
         sap.ui.getCore().byId("btnGropuGuardar").setEnabled(_bEnable);

         if (this.bAlreadySavedOnPouch) {

             sap.ui.getCore().byId("btnGropuEnviarCore").setEnabled(true);

         } else {


             sap.ui.getCore().byId("btnGropuEnviarCore").setEnabled(false);

         }


         if (itf) { /// Se especifica una forma
             oTabs = [itf];
         } else {
             oTabs = ["itfGroupApp1", "itfGroupApp2", "itfGroupApp3"];
         }

         var oTab;

         for (var j = 0; j < oTabs.length; j++) {
             oTab = sap.ui.getCore().byId(oTabs[j]).getContent();
             iCounter = 0;
             if (oTab.length > 0) {
                 if (oTab[0]._aElements) {
                     if (oTab[0]._aElements.length > 0) {
                         for (var i = 0; i < oTab[0]._aElements.length; i++) {
                             if (oTab[0]._aElements[i].setEnabled) {
                                 /// Detener en caso de que se encuentre en el mismo estado
                                 if (_bEnable === oTab[0]._aElements[i].getEnabled()) {
                                     iCounter = iCounter + 1;
                                     if (iCounter >= 2) {
                                         break;
                                     }
                                 }
                                 //////// Habilitar todos menos combo tipo de producto
                                 if (_bEnable === false || (_bEnable === true && oTab[0]._aElements[i].sId !== "selectNciTipoDeProducto")) {
                                     oTab[0]._aElements[i].setEnabled(_bEnable); /// Disable all components
                                 }
                             }
                         }

                     }
                 }
             }
         }
     },

     toStateApprove: function(_idOportunidad, _processType) {

         var oIdOportunidad = _idOportunidad;
         var processType = _processType;
         var oController = this;

         return function() {

             var oApproveModel, promiseApprove, oController, bdLoader;

             ////////************ Validacion de datos de la pantalla

             var oInputBase, msgValidation;

             var oExpenditureDate, oFirstDate;

             oInputBase = new sap.ui.mw.InputBase();




             /////// Validación de datos de dirección contra modelo

             if (!this.onValidateAddress()) {

                 sap.m.MessageToast.show("Tu Grupo debe tener un lugar de reunión.");
                 this.navigateToTab('itfGroupApp3');
                 return;

             }


             msgValidation = "";

             oFirstDate = sap.ui.getCore().byId("txtGpoFisrtDate");

             if (oFirstDate) {
                 if (oFirstDate.getValue() === "") {

                     oFirstDate.setValueState('Error');
                     sap.m.MessageToast.show("Validar la fecha de primer pago.");
                     this.navigateToTab('itfGroupApp3');
                     return false;

                 } else {

                     oFirstDate.setValueState('Success');
                 }
             }

             oExpenditureDate = sap.ui.getCore().byId("txtGpoDesembolso");

             if (oExpenditureDate) {
                 if (oExpenditureDate.getValue() === "") {

                     oExpenditureDate.setValueState('Error');
                     sap.m.MessageToast.show("Validar la fecha de desembolso.");
                     this.navigateToTab('itfGroupApp3');
                     return false;


                 } else {

                     oExpenditureDate.setValueState('Success');
                 }
             }

             if (!oInputBase.validationForForm("txtGroupName", "Input").type) {
                 sap.m.MessageToast.show("Validar el nombre del grupo.");
                 this.navigateToTab('itfGroupApp1');
                 return false;
             }

             if (!oInputBase.validationForForm("selectGroupDisperserChanel", "Select").type) {
                 sap.m.MessageToast.show(msgValidation = oInputBase.validationForForm("selectGroupDisperserChanel", "Select").message);
                 this.navigateToTab('itfGroupApp1');
                 return false;
             }
             if (!oInputBase.validationForForm("selectGroupDisperser", "Select").type) {

                 sap.m.MessageToast.show(msgValidation = oInputBase.validationForForm("selectGroupDisperser", "Select").message);
                 this.navigateToTab('itfGroupApp1');
                 return false;
             }


             if (sap.ui.getCore().byId('idDataGropForm') !== undefined) {
                 if (!oInputBase.validationForForm("txtNgMultaPorFalta", "Input").type) {
                     sap.m.MessageToast.show("Validar multa por falta");
                     this.navigateToTab('itfGroupApp3');
                     return false;
                 }
                 if (!oInputBase.validationForForm("txtNgMultaPorRetardo", "Input").type) {
                     sap.m.MessageToast.show("Validar multa por retardo");
                     this.navigateToTab('itfGroupApp3');
                     return false;
                 }
                 if (!oInputBase.validationForForm("selectGpoFrecuencia", "Select").type) {

                     sap.m.MessageToast.show(oInputBase.validationForForm("selectGpoFrecuencia", "Select").message);
                     this.navigateToTab('itfGroupApp1');
                     return false;

                 }

                 if (!oInputBase.validationForForm("selectGpoCasaReunion", "Select").type) {

                     sap.m.MessageToast.show(oInputBase.validationForForm("selectGpoCasaReunion", "Select").message);
                     this.navigateToTab('itfGroupApp3');
                     return false;

                 }
                 if (!oInputBase.validationForForm("selectGpoDiaReunion", "Select").type) {
                     sap.m.MessageToast.show(oInputBase.validationForForm("selectGpoDiaReunion", "Select").message);
                     this.navigateToTab('itfGroupApp3');
                     return false;
                 }
                 if (!oInputBase.validationForForm("selectGpoHoraReunion", "Select").type) {
                     sap.m.MessageToast.show(oInputBase.validationForForm("selectGpoHoraReunion", "Select").message);
                     this.navigateToTab('itfGroupApp3');
                     return false;

                 }
             }

             if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CM") {
                 if (!oInputBase.validationForForm("txtNgMultaPorFalta", "Input").type) {
                     sap.m.MessageToast.show("Validar multa por falta");
                     this.navigateToTab('itfGroupApp3');
                     return false;
                 }
                 if (!oInputBase.validationForForm("txtNgMontoMinimoDeAhorro", "Input").type) {
                     sap.m.MessageToast.show("Validar monto minimo de ahorro");
                     this.navigateToTab('itfGroupApp3');
                     return false;
                 }
             }


             if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CCR") {

                 if (this.AssociatedBPs < 8 || this.AssociatedBPs > 20) {
                     /////// Error de limite de solicitantes
                     sap.m.MessageToast.show("El crédito comerciante no puede tener menos de 8 integrantes, ni más de 20.");
                     return false;
                 }
             }

             if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CM") {
                 if (this.AssociatedBPs < 10 || this.AssociatedBPs > 50) {
                     /////// Error de limite de solicitantes
                     sap.m.MessageToast.show("El crédito mujer no puede tener menos de 10 integrantes, ni más de 50.");
                     return false;
                 }
             }
             oController = this;

             //modal cargando datos
             bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudes");
             bdLoader.setText("Aprobando...");
             bdLoader.open();

             if (sap.OData) {
                 sap.OData.removeHttpClient();
             }




             setTimeout(function() {
                 promiseApprove = sap.ui.getCore().AppContext.myRest.read("/OpportunityApproval?loanRequestIdCRM='" + oIdOportunidad + "'&processType='" + processType + "'", true); // servicio - consulta solicitantes sin oportunidad asignada
                 promiseApprove.then(function(response) {
                     if (sap.OData) {
                         sap.OData.applyHttpClient();
                     }
                     if (response.results) {
                         if (response.results.length <= 0) {
                             sap.ui.getCore().AppContext.bSaveApprove = true; /////////// Guardar
                         } else {
                             sap.ui.getCore().AppContext.bSaveApprove = false; /////////// No Guardar
                         }
                     }

                     oApproveModel = new sap.ui.model.json.JSONModel();
                     oApproveModel.setData(response);
                     oController.bindTableApprove(oApproveModel, oController);
                     bdLoader.close();
                 }).catch(function() {
                     if (sap.OData) {
                         sap.OData.applyHttpClient();
                     }
                     sap.m.MessageToast.show("¡Ups! Existe un error en la red, intente más tarde. ");
                     bdLoader.close();

                 });
             }.bind(this), 0);



         };


     },


     bindTableApprove: function(oModel, oController) {
         //Middleware de componentes SAPUI5
         var oListBase, oCurrentController, oActionBase, oDialogAdds, tblApprove;
         //Se declaran objetos de Middleware de componentes SAPUI5
         var oCompoundFilter;
         oActionBase = new sap.ui.mw.ActionBase();
         oListBase = new sap.ui.mw.ListBase();


         oCurrentController = this;

         oDialogAdds = sap.ui.getCore().byId('appDialogApprove');
         oDialogAdds.destroyContent();
         oDialogAdds.destroyButtons();
         //tabla de integrantes
         var tableFields = [
             "Id Cliente",
             "Mensaje"
         ];
         var tableFieldVisibility = [
             true,
             true
         ];
         var tableFieldDemandPopid = [
             false,
             false
         ];
         oDialogAdds.addContent(oListBase.createTable("tblApproved", "", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, null));

         tblApprove = sap.ui.getCore().byId("tblApproved");
         tblApprove.setModel(oModel);
         tblApprove.bindAggregation("items", {
             path: "/results/",
             factory: function(_id, _context) {
                 return oCurrentController.onLoadTableApprove(_context);
             },
             filters: oCompoundFilter
         });

         oDialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "sap-icon://accept", oCurrentController.successApprove, oCurrentController));
         oDialogAdds.open();
     },


     onLoadTableApprove: function(_context) {
         jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
         var oDisplayBase, itemsTemplate;
         oDisplayBase = new sap.ui.mw.DisplayBase();
         itemsTemplate = new sap.m.ColumnListItem({
             type: "Active"
         });
         itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("CustomerIdCRM")));
         itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty("ErrorMessage")));

         return itemsTemplate;
     },

     successApprove: function() {
         var oCurrentDialog = sap.ui.getCore().byId("appDialogApprove");
         //Se destruye el contenido del dialogo y se cierra dialogo
         if (sap.ui.getCore().AppContext.bSaveApprove === true) {
             this.saveApprove();
         }
         oCurrentDialog.destroyContent();
         oCurrentDialog.destroyButtons();
         oCurrentDialog.close();
     },




     onCreditAmountChange: function() {

         var oSelectMontoDeCredito, oTextNgMontoMinimoDeAhorro;
         var oAmount, oAmountCalculation;
         oSelectMontoDeCredito = sap.ui.getCore().byId("selectMontoDeCredito");
         oTextNgMontoMinimoDeAhorro = sap.ui.getCore().byId("txtDetailAhorro");

         if (oSelectMontoDeCredito && oTextNgMontoMinimoDeAhorro) {


             oAmount = oSelectMontoDeCredito.getSelectedKey();

             if (oAmount === "") {

                 oTextNgMontoMinimoDeAhorro.setValue("0.00");

             } else {

                 oAmountCalculation = parseInt(oAmount);
                 oTextNgMontoMinimoDeAhorro.setValue(oAmountCalculation * 0.05);

             }



         }
     },

     onGenerateFiltersAvailableCustomersFilter: function(_sFilter) {

         var oNewFilter;
         this.sFilter = _sFilter;

         oNewFilter = new sap.ui.model.Filter({
             "path": "",
             "test": function(oValue) {


                 if (this.oCustomerIdsVisual.length > 0 || this.oCustomerIdsVisualCRM.length) {

                     if ((($.inArray(oValue.CustomerIdMD.toUpperCase(), this.oCustomerIdsVisual)) < 0) && (($.inArray(oValue.CustomerIdCRM.toUpperCase(), this.oCustomerIdsVisualCRM)) < 0)) {

                         if ((oValue.BpName.FirstName.indexOf(this.sFilter) > -1) || (oValue.BpName.LastName.indexOf(this.sFilter) > -1) || (oValue.BpName.SecondName.indexOf(this.sFilter) > -1) || (oValue.BpName.MiddleName.indexOf(this.sFilter) > -1) || (oValue.CustomerIdCRM.indexOf(this.sFilter) > -1)) {
                             if (oValue.BpMainData.ProductId === sap.ui.getCore().AppContext.sGrupalTypeID) {
                                 return true;
                             } else {
                                 return false;
                             }
                         } else {

                             return false;
                         }

                     } else {
                         return false;
                     }

                     if (oValue.BpMainData.ProductId === sap.ui.getCore().AppContext.sGrupalTypeID) {
                         return true;
                     } else {
                         return false;
                     }

                 } else {

                     if ((oValue.BpName.FirstName.indexOf(this.sFilter) > -1) || (oValue.BpName.LastName.indexOf(this.sFilter) > -1) || (oValue.BpName.SecondName.indexOf(this.sFilter) > -1) || (oValue.BpName.MiddleName.indexOf(this.sFilter) > -1)) {

                         if (oValue.BpMainData.ProductId === sap.ui.getCore().AppContext.sGrupalTypeID) {
                             return true;
                         } else {
                             return false;
                         }

                     } else {
                         return false;
                     }
                     if (oValue.BpMainData.ProductId === sap.ui.getCore().AppContext.sGrupalTypeID) {
                         return true;
                     } else {
                         return false;
                     }

                 }
             }.bind(this)
         });


         return oNewFilter;



     },

     onGenerateFiltersVisual: function() {



         oNewFilter = new sap.ui.model.Filter({
             "path": "",
             "test": function(oValue) {

                 if (oValue.GroupLoanData === undefined || oValue.GroupLoanData.RejectionCauseId !== "") {
                     return false;
                 } else {
                     return true;
                 }


             }
         });


         return oNewFilter;



     },


     onGenerateFiltersAvailableCustomers: function() {


         var oNewFilter;

         oNewFilter = new sap.ui.model.Filter({
             "path": "",
             "test": function(oValue) {

                 if ((this.oCustomerIdsVisual.length > 0) || (this.oCustomerIdsVisualCRM.length > 0)) {

                     if ((($.inArray(oValue.CustomerIdMD.toUpperCase(), this.oCustomerIdsVisual)) < 0) && (($.inArray(oValue.CustomerIdCRM.toUpperCase(), this.oCustomerIdsVisualCRM)) < 0)) {


                         if (oValue.BpMainData.ProductId === sap.ui.getCore().AppContext.sGrupalTypeID) {
                             return true;
                         } else {
                             return false;
                         }




                     } else {
                         return false;
                     }

                     if (oValue.BpMainData.ProductId === sap.ui.getCore().AppContext.sGrupalTypeID) {
                         return true;
                     } else {
                         return false;
                     }

                 } else {
                     if (oValue.BpMainData.ProductId === sap.ui.getCore().AppContext.sGrupalTypeID) {
                         return true;
                     } else {
                         return false;
                     }

                 }
             }.bind(this)
         });


         return oNewFilter;

     },


     onEditCustomerFromLoanRequest: function(oCustomer) {

         //// Modelo que se enviara al final
         var oLoanRequestModel, iPosition, iVisualPosition;

         var oLoanMembers, oCustomerSet, oView, txtDetailIdCliente;


         txtDetailIdCliente = sap.ui.getCore().AppContext.sIdDMClient;
         iVisualPosition = this.oCustomerIdsVisual.indexOf(oCustomer.CustomerIdMD.toUpperCase());
         oView = this.getView();


         if (iVisualPosition >= 0) { /// Efectivamente existe en el arreglo
             /// Modificar miembro en visuales
             oLoanMembers = oView.getModel("oLoanMembers");
             oCustomerSet = oLoanMembers.getProperty("/CustomerSet");
             oCustomerSet[iVisualPosition] = oCustomer;
             oLoanMembers.setProperty("/CustomerSet", oCustomerSet);
             oLoanMembers.refresh(true);

             /// Modificar miembro en modelo final
             iPosition = this.oCustomerInRequestArray.indexOf(oCustomer.CustomerIdMD.toUpperCase());

             if (iPosition >= 0) {
                 oLoanRequestModel = oView.getModel("oLoanRequestModel");
                 oLoanRequestModel.setProperty("/LinkSet/results/" + iPosition, oCustomer);

             }
         }



     },



     onAddCustomerToLoanRequest: function(oCustomer) {

         //// Modelo que se enviara al final
         var oLoanRequestModel, oLoanRequestModelCustomerSet, oPosition, oCustomerTable;

         var oLoanMembers, oCustomerSet, oTblListMembers, oView,

             oView = this.getView();

         txtDetailIdCliente = sap.ui.getCore().AppContext.sIdDMClient;
         this.oCustomerIdsVisual.push(oCustomer.CustomerIdMD.toUpperCase());

         if (oCustomer.CustomerIdCRM.toUpperCase() === "") {
             this.oCustomerIdsVisualCRM.push("0");
         } else {
             this.oCustomerIdsVisualCRM.push(oCustomer.CustomerIdCRM.toUpperCase());
         }


         /// Modelo para la lista que se mostrara
         oLoanMembers = oView.getModel("oLoanMembers");
         oCustomerSet = oLoanMembers.getProperty("/CustomerSet");
         oCustomerSet.push(oCustomer);
         oLoanMembers.setProperty("/CustomerSet", oCustomerSet);
         oLoanMembers.refresh(true);
         /// Refrescar modelo de posibles integrantes
         oTblListMembers = sap.ui.getCore().byId("tblListMembers");
         oTblListMembers.getBindingInfo("items").binding.refresh();

         /// Refrescar select de lista de integrantes
         if (sap.ui.getCore().byId("selectGpoCasaReunion")) {
             var selectIntegrants = sap.ui.getCore().byId("selectGpoCasaReunion");
             selectIntegrants.getBindingInfo("items").binding.refresh();
         }


         //////// Modelo final (el que se enviara en el servicio)
         oLoanRequestModel = oView.getModel("oLoanRequestModel");
         oLoanRequestModelCustomerSet = oLoanRequestModel.getProperty("/LinkSet/results");

         /// Validar si ya existia el ID en el modelo final
         oPosition = $.inArray(oCustomer.CustomerIdMD.toUpperCase(), this.oCustomerInRequestArray);
         if (oPosition < 0) {
             /// Si no existe, agregarlo
             this.oCustomerInRequestArray.push(oCustomer.CustomerIdMD.toUpperCase());
             oLoanRequestModelCustomerSet.push(oCustomer);



         } else {
             /// Si ya existia en el modelo final, reemplazarlo

             oLoanRequestModelCustomerSet[oPosition] = oCustomer;

         }

         this.AssociatedBPs++;


         oCustomerTable = sap.ui.getCore().byId("tblListMembers");
         if (oCustomerTable) {

             oCustomerTable.setHeaderText(this.AssociatedBPs + " Integrantes");

         }



     },
     onDeleteCustomerFromLoanRequest: function(_oCustomer, _sCauseId) {

         var oIndex, sCustomerID, oLoanRequestModel, oLoanRequestModelCustomerSet;
         var oLoanMembers, oCustomerSet, oView;
         oView = this.getView();
         sCustomerID = _oCustomer.CustomerIdMD;
         txtDetailIdCliente = sap.ui.getCore().AppContext.sIdDMClient;

         oIndex = this.oCustomerIdsVisual.indexOf(sCustomerID.toUpperCase());
         this.oCustomerIdsVisual.splice(oIndex, 1);
         this.oCustomerIdsVisualCRM.splice(oIndex, 1);


         oLoanMembers = oView.getModel("oLoanMembers");
         oCustomerSet = oLoanMembers.getProperty("/CustomerSet");
         //// Quitar del modelo que se visualizo en pantalla
         oCustomerSet.splice(oIndex, 1);
         oLoanMembers.setProperty("/CustomerSet", oCustomerSet);
         oLoanMembers.refresh(true);



         //////// Modificar del modelo final (el que se enviara en el servicio)
         oLoanRequestModel = oView.getModel("oLoanRequestModel");
         oLoanRequestModelCustomerSet = oLoanRequestModel.getProperty("/LinkSet/results");

         /// Validar que existe el ID en el modelo final
         oPosition = this.oCustomerInRequestArray.indexOf(sCustomerID.toUpperCase());
         if (oPosition >= 0) {
             /// Reemplazarlo en el modelo final (Agregando causa de rechazo para su borrado)
             _oCustomer.GroupLoanData.RejectionCauseId = _sCauseId;

            ///Validamos si el Customer se rechazó para actualización de datos y es parte de una subsecuencia
            ///Con motivo "Error de Captura"
            if (_sCauseId === "8" &&
                 (_oCustomer.Customer.BpMainData.SourceName === "Subsecuencia" ||
                     _oCustomer.Customer.BpMainData.SourceId === "Z07"))
            {
                 _oCustomer.Customer.BpMainData.StatusId = "E0007";
            }

             oLoanRequestModelCustomerSet[oPosition] = _oCustomer;
             oLoanRequestModel.setProperty("/LinkSet/results/" + oPosition, _oCustomer);
         }

         this.AssociatedBPs--;


         ////////////// realizar desasociación de rol del miembro eliminado


         if (_oCustomer.GroupLoanData.RoleInTheGroupId !== "ZG05") {

             this.memberRoles[_oCustomer.GroupLoanData.RoleInTheGroupId] = "";

         }



         oCustomerTable = sap.ui.getCore().byId("tblListMembers");
         if (oCustomerTable) {

             oCustomerTable.setHeaderText(this.AssociatedBPs + " Integrantes");

         }


     },

     setMainValuesOfModel: function(_mainModel) {
         var oLoanRequestModel, oDate, oDateTomorrow;

         oDate = new Date().setHours(0, 0, 0, 0);
         oDate = new Date(oDate);
         oDateTomorrow = new Date().setHours(0, 0, 0, 0);
         oDateTomorrow = new Date(oDateTomorrow);
         oDateTomorrow.setDate(oDateTomorrow.getDate() + 1);

         //Completa valores iniciales en el modelo
         oLoanRequestModel = _mainModel;
         oLoanRequestModel.setProperty("/LoanRequestIdMD", this.onGenerateLoanRequestId());
         oLoanRequestModel.setProperty("/CollaboratorID", sap.ui.getCore().AppContext.Promotor);
         oLoanRequestModel.setProperty("/GeneralLoanRequestData/StartDate", oDate);
         oLoanRequestModel.setProperty("/GeneralLoanRequestData/FirstPaymentDate", oDateTomorrow);
         oLoanRequestModel.setProperty("/GeneralLoanRequestData/ExpenditureDate", oDateTomorrow);

         oLoanRequestModel.refresh(true);

         return oLoanRequestModel;
     },


     matchDispersionToGroupal: function() {

         sap.ui.getCore().byId("selectDetailCanalDispersion").setSelectedKey(sap.ui.getCore().byId("selectGroupDisperserChanel").getSelectedKey());
         sap.ui.getCore().byId("selectDetailMedioDispersion").setSelectedKey(sap.ui.getCore().byId("selectGroupDisperser").getSelectedKey());


     },

     canalDispersionDetailChange: function() {

         this.onUpdateDispersion("selectDetailCanalDispersion", "selectDetailMedioDispersion");
     },


     canalDispersionChange: function() {

         this.onUpdateDispersion("selectGroupDisperserChanel", "selectGroupDisperser");
     },


     onUpdateDispersion: function(_oCanal, _oMedio, _oDispersionChannelKey) {
         var oView;

         oView = this.getView();
         return new Promise(function(resolve) {

             var oFilterChannel, oDispersionChannel, oDispersionChannelKey, oSelectNgDispersionMedium;
             var oItem;

             oDispersionChannel = sap.ui.getCore().byId(_oCanal);

             if (_oDispersionChannelKey) {

                 oDispersionChannelKey = _oDispersionChannelKey;

             } else {

                 oDispersionChannelKey = oDispersionChannel.getSelectedKey();
             }



             oItem = new sap.ui.core.Item({
                 text: "{MediumDescription}",
                 key: "{MediumID}"
             });

             if (oDispersionChannelKey) { /// Verificar que el valor para el canal a buscar ya exista

                 oFilterChannel = new sap.ui.model.Filter("ChannelID", sap.ui.model.FilterOperator.EQ, oDispersionChannelKey);
                 oSelectNgDispersionMedium = sap.ui.getCore().byId(_oMedio).setModel(oView.getModel("dispersionModel"));
                 oSelectNgDispersionMedium.bindAggregation("items", {
                     path: "/results/",
                     template: oItem,
                     filters: oFilterChannel /////////// Pasar como filtro el ID del Canal
                 });


             }

             resolve("OK");

         }.bind(this));

     },

     onInitializeDispersion: function(_oCanal, _oMedio) {


         return new Promise(function(resolve) {

             var oTmpDispersionModel, oSeen, oToBind, oDispersionChannelsModel, oSelectNciDispersionChannel, oItem, promiseReadDispersion;
             var oItem, oView, sFirstChannel;

             oView = this.getView();

             promiseReadDispersion = sap.ui.getCore().AppContext.myRest.read("/ChannelMediumDispersionSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "'", false); //mock
             promiseReadDispersion
                 .then(function(response) {

                     oTmpDispersionModel = new sap.ui.model.json.JSONModel();
                     oTmpDispersionModel.setData(response);
                     oView.setModel(oTmpDispersionModel, "dispersionModel");

                     oSeen = {};
                     oToBind = [];

                     //// Must verify if data is already present
                     if (oTmpDispersionModel) {

                         if (oTmpDispersionModel.oData.results) {
                             if (oTmpDispersionModel.oData.results.length > 0) {
                                 //////////// Pick distinct channelID only
                                 jQuery.each(oTmpDispersionModel.oData.results, function() {

                                     var sText;
                                     sText = this.ChannelID;

                                     if (!sFirstChannel) {
                                         sFirstChannel = this.ChannelID;
                                     }

                                     if (!oSeen[sText]) {
                                         oSeen[sText] = true;
                                         oToBind.push(this);
                                     }
                                 });
                             }
                         }

                     }

                     oDispersionChannelsModel = new sap.ui.model.json.JSONModel(oToBind);

                     oItem = new sap.ui.core.Item({
                         text: "{ChannelDescription}",
                         key: "{ChannelID}"
                     });

                     oSelectNciDispersionChannel = sap.ui.getCore().byId(_oCanal);


                     oSelectNciDispersionChannel.bindAggregation("items", {
                         path: "/",
                         template: oItem
                     });

                     oSelectNciDispersionChannel.setModel(oDispersionChannelsModel);

                     this.onUpdateDispersion(_oCanal, _oMedio, sFirstChannel).then(
                         function() {

                             resolve("OK");
                         }
                     );

                 }.bind(this)).catch(function() {

                     sap.m.MessageToast.show("¡Ups! Existe un error en la red, intente más tarde.");
                 });


         }.bind(this));



     },
     onMessageWarningDialogPress: function(oEvent) {
         var currentController, oLoanRequestModel;
         currentController = this;

         if (sap.ui.getCore().AppContext.bIsCreating) {
             jQuery.sap.require("sap.m.MessageBox");
             sap.m.MessageBox.warning("¿Estás seguro que deseas salir?", {
                 title: "¡Atención!",
                 actions: ["Salir", "Permanecer"],

                 onClose: function(MessageValue) {

                     if (MessageValue === "Salir") {
                         currentController.backToTiles();
                     } else {
                         sap.ui.getCore().AppContext.Navigation.detail = true;
                     }
                 }
             });

         } else {

             oLoanRequestModel = this.getView().getModel("oLoanRequestModel");

             if (oLoanRequestModel) {

                 if (!oLoanRequestModel.getProperty("/IsEntityInQueue")) {
                     jQuery.sap.require("sap.m.MessageBox");
                     sap.m.MessageBox.warning("¿Estás seguro que deseas salir?", {
                         title: "¡Atención!",
                         actions: ["Salir", "Permanecer"],

                         onClose: function(MessageValue) {

                             if (MessageValue === "Salir") {
                                 currentController.backToTiles();
                                 return;
                             } else {
                                 sap.ui.getCore().AppContext.Navigation.detail = true;
                             }
                         }
                     });

                 }else{
                    currentController.backToTiles();
                 }
             }
         }
     },


     backToTiles: function() {
         window.history.go(-1);


     },

     selectIconTabBarFilter: function(evt) {
         //Middleware de componentes SAPUI5
         var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oListBase;
         //Guarda tab seleccionado
         var currentTabFilter, oCurrentController, oView, option, contentFlag, tableFields, tableFieldVisibility, tableFieldDemandPopid;
         var oIndicatorTabs, oCurrentController;

         var oGrupalTypeID, oLoanMembers;
         var oTxtNciPlazoSolicitado;

         jQuery.sap.require("js.SimpleTypes.TermBase");
         //Se declaran objetos de Middleware de componentes SAPUI5
         oInputBase = new sap.ui.mw.InputBase();
         oActionBase = new sap.ui.mw.ActionBase();
         oDisplayBase = new sap.ui.mw.DisplayBase();
         oLayoutBase = new sap.ui.mw.LayoutBase();
         oListBase = new sap.ui.mw.ListBase();
         //Obtiene Tab actual seleccionado

         oView = this.getView();
         oCurrentController = this;

         currentTabFilter = sap.ui.getCore().byId(evt.getParameter("key"));
         option = currentTabFilter.sId;



         contentFlag = currentTabFilter.getContent().length;


         if (option === "itfGroupApp2") { /// Actualizar cantidad de lista de integrantes

             oLoanMembers = oView.getModel("oLoanMembers");
             if (oLoanMembers) {

                 oLoanMembers.refresh(true);
             }

         }

         if (contentFlag === 0) {

             sap.ui.getCore().AppContext.sGroupalLoanLastProductId = oGrupalTypeID;

             oIndicatorTabs = new sap.m.BusyIndicator({
                 text: "Cargando componentes..."
             });
             currentTabFilter.addContent(oIndicatorTabs);


             setTimeout(function() {
                 switch (option) {

                     case "itfGroupApp1": //TAB FILTER MEDIO DE DISPERSION DEL GRUPO
                         var oForm;


                         oForm = oLayoutBase.createForm("idDispersionForm", true, 1, "Principales");
                         //Agregar elementos a formulario principales

                         oForm.addContent(oDisplayBase.createLabel("", "Id Contrato"));
                         oForm.addContent(oInputBase.createInputText("txtGroupIdContract", "Text", "", "{oLoanRequestModel>/GroupRequestData/ContractID}", true, false));
                         oForm.addContent(oDisplayBase.createLabel("", "Id Grupo(SAP)"));
                         oForm.addContent(oInputBase.createInputText("txtGroupIdSAP", "Text", "", "{oLoanRequestModel>/GroupRequestData/GroupID}", true, false));
                         oForm.addContent(oDisplayBase.createLabel("", "Id Oportunidad"));
                         oForm.addContent(oInputBase.createInputText("txtOportunityIdSAP", "Text", "", "{oLoanRequestModel>/LoanRequestIdCRM}", true, false));
                         oForm.addContent(oDisplayBase.createLabel("", "Nombre del Grupo*"));
                         oForm.addContent(oInputBase.createInputText("txtGroupName", "Text", "", "{oLoanRequestModel>/GroupRequestData/GroupName}", true, true, "^(([0-9A-Za-zÑñ]+)\\s?)*$").setMaxLength(26));
                         oForm.addContent(oDisplayBase.createLabel("", "Ciclo del Grupo"));
                         oForm.addContent(oInputBase.createInputText("txtGroupCiclo", "Text", "", "{oLoanRequestModel>/GeneralLoanRequestData/Cycle}", true, false));
                         oForm.addContent(oDisplayBase.createLabel("", "Estatus de la Oportunidad"));
                         oForm.addContent(oInputBase.createInputText("txtGroupStatusOpt", "Text", "", "{oLoanRequestModel>/GeneralLoanRequestData/StatusText}", true, false));
                         //Canal dispersor
                         oForm.addContent(oDisplayBase.createLabel("", "Canal Dispersor*"));
                         oForm.addContent(oInputBase.createSelect("selectGroupDisperserChanel", undefined, undefined, undefined, oCurrentController.canalDispersionChange, oCurrentController));
                         //Medio dispersión
                         oForm.addContent(oDisplayBase.createLabel("", "Medio de Dispersión del Grupo*"));
                         oForm.addContent(oInputBase.createSelect("selectGroupDisperser"));


                         //se agrega formulario al tab
                         currentTabFilter.destroyContent();
                         currentTabFilter.addContent(oForm);
                         oCurrentController.onInitializeDispersion("selectGroupDisperserChanel", "selectGroupDisperser");


                         ////// Retrieve CustomerSet for LoanRequest
                         oCurrentController.onFormEnable(oCurrentController.bIsEnabled, "itfGroupApp1");

                         break;
                     case "itfGroupApp2": //TAB FILTER LISTA DE INTEGRANTES
                         var oForm, tblMembersForm, oTableIntegrants;
                         var oDatePicker, oDatePickerDesembolso;
                         //Parte principal del tab
                         oForm = oLayoutBase.createForm("idListMembersForm", true, 1, "Lista de Integrantes");
                         oForm.addContent(oActionBase.createButton("", "Nuevo Integrante", "Emphasized", "sap-icon://add", oCurrentController.showApplicantsList, oCurrentController));

                         //Configuracion de la tabla
                         tableFields = ["", "", ""];
                         var tableFieldsWidth = ['60%', 'auto', 'auto'];
                         tableFieldVisibility = [true, true, true];
                         tableFieldDemandPopid = [false, false, false];


                         oLoanMembers = oView.getModel("oLoanMembers");

                         if (oLoanMembers) {
                             if (oLoanMembers.getProperty("/CustomerSet")) {


                                 oTableIntegrants = oListBase.createTable("tblListMembers", oCurrentController.AssociatedBPs + " Integrantes", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, tableFieldsWidth, oCurrentController.onModifyIntegrant, oCurrentController);

                             } else {

                                 oTableIntegrants = oListBase.createTable("tblListMembers", "0 Integrantes", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, tableFieldsWidth, oCurrentController.onModifyIntegrant, oCurrentController);
                             }
                         } else {

                             oTableIntegrants = oListBase.createTable("tblListMembers", "0 Integrantes", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, tableFieldsWidth, oCurrentController.onModifyIntegrant, oCurrentController);
                         }

                         oForm.addContent(oTableIntegrants);
                         tblMembersForm = sap.ui.getCore().byId("tblListMembers");

                         var oVisualFilters = oCurrentController.onGenerateFiltersVisual();

                         tblMembersForm.setModel(oLoanMembers);
                         tblMembersForm.bindAggregation("items", {
                             path: "/CustomerSet",
                             factory: function(_id, _context) {
                                 return oCurrentController.createItemTableIntegrants(_context);
                             },
                             filters: oVisualFilters

                         });

                         //se agrega formulario al tab
                         currentTabFilter.destroyContent();
                         currentTabFilter.addContent(oForm);
                         currentTabFilter.addContent(oTableIntegrants);

                         oCurrentController.onFormEnable(oCurrentController.bIsEnabled, "itfGroupApp2");

                         break;
                     case "itfGroupApp3": //TAB FILTER DATOS DEL GRUPO
                         var oForm, oItemGpoFrecuencia, GpoDiaReunion, oItemGpoDiaReunion, oItemGpoHoraReunion, GpoHoraReunion, oFrequencyModel;
                         var oPatternFuture, oDateTomorrow, oLoanRequestModel, oIdOportunidad, processType;
                         var oSelectNgCasaReunion;

                         var oFloatType;
                         var oTxtNgMultaPorFalta, oTxtNgMultaPorRetardo, oTxtNgMontoMinimoDeAhorro;


                         //Parte principal del tab
                         oLoanRequestModel = oCurrentController.retrieveModel("oLoanRequestModel");
                         oIdOportunidad = oLoanRequestModel.getProperty('/LoanRequestIdCRM');
                         processType = oLoanRequestModel.getProperty('/ProcessType');

                         oForm = oLayoutBase.createForm("idDataGropForm", true, 1, "Datos del Grupo");


                         oForm.addContent(oActionBase.createButton("", "Lugar de Reunión", "Emphasized", "sap-icon://home", oCurrentController.addPlace, oCurrentController));
                         oForm.addContent(oDisplayBase.createLabel("", "Promotor Responsable"));
                         oForm.addContent(oInputBase.createInputText("txtGpoPromoter", "Text", "", "{oLoanRequestModel>/CollaboratorID}", true, false));

                         /////// Ajuste de plazo y frecuencia
                         oItemGpoFrecuencia = new sap.ui.core.Item({
                             key: "{idCRM}",
                             text: "{text}"
                         });

                         if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CM") {
                             oFrequencyModel = new sap.ui.model.json.JSONModel("data-map/catalogos/frecuencia_C_GRUPAL_CM.json");
                         } else {
                             oFrequencyModel = new sap.ui.model.json.JSONModel("data-map/catalogos/frecuencia_C_GRUPAL_CCR.json");
                         }


                         oForm.addContent(oDisplayBase.createLabel("", "Frecuencia*"));
                         oForm.addContent(oInputBase.createSelect("selectGpoFrecuencia", "/frecuencias", oItemGpoFrecuencia, oFrequencyModel).bindProperty("selectedKey", {
                             path: "oLoanRequestModel>/GeneralLoanRequestData/Frequency"
                         }));

                         oForm.addContent(oDisplayBase.createLabel("", "Plazo*"));
                         var oSimpleTypeTerms = new sap.ui.model.SimpleType.Term();
                         oTxtNciPlazoSolicitado = oInputBase.createInputText("txtGpoPlazo", "Text", "0", "", true, false);
                         oTxtNciPlazoSolicitado.bindProperty("value", {
                             path: "oLoanRequestModel>/GeneralLoanRequestData/Term",
                             type: oSimpleTypeTerms
                         });
                         oForm.addContent(oTxtNciPlazoSolicitado);

                         oForm.addContent(oDisplayBase.createLabel("", "Fecha de Primer Pago*"));

                         oDateTomorrow = new Date().setHours(0, 0, 0, 0);

                         oPatternFuture = new sap.ui.model.type.Date({
                             pattern: "dd.MM.yyyy",
                             UTC: true
                         }, {
                             minimum: oDateTomorrow /// is not less or equal, but less
                         });



                         function isValidDate(d) {
                             if (Object.prototype.toString.call(d) !== "[object Date]")
                                 return false;
                             return !isNaN(d.getTime());
                         }

                         oDatePicker = new sap.m.DatePicker("txtGpoFisrtDate", {
                             value: {
                                 path: "oLoanRequestModel>/GeneralLoanRequestData/FirstPaymentDate",
                                 type: oPatternFuture
                             },

                             displayFormat: "dd.MM.yyyy",
                             valueFormat: "yyyy-MM-ddThh:mm:ss",
                             placeholder: "dd.MM.yyyy",


                             change: function(oEvent) {

                                 try {


                                     var oValue;
                                     oValue = oEvent.getSource().getProperty('value');
                                     oValue = oValue.replace("T12:00:00", "").replace(/\-/gi, "/");
                                     if (oValue.toString().match("^((([0-9]){2})(\.)([0-9]){2}(\.)([0-9]){4})$")) {

                                         var sSplited = oValue.split(".");

                                         var dat = new Date(sSplited[2] + "-" + sSplited[1] + "-" + sSplited[0]);
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

                         oDatePicker.attachValidationError(function() {
                             sap.m.MessageToast.show("La fecha de debe ser mayor a la fecha actual.");
                         });





                         oForm.addContent(oDatePicker);


                         oForm.addContent(oDisplayBase.createLabel("", "Fecha de Desembolso"));


                         oDatePickerDesembolso = new sap.m.DatePicker("txtGpoDesembolso", {
                             value: {
                                 path: "oLoanRequestModel>/GeneralLoanRequestData/ExpenditureDate",
                                 type: oPatternFuture
                             },

                             displayFormat: "dd.MM.yyyy",
                             valueFormat: "yyyy-MM-ddThh:mm:ss",
                             placeholder: "dd.MM.yyyy",


                             change: function(oEvent) {

                                 try {


                                     var oValue;
                                     oValue = oEvent.getSource().getProperty('value');
                                     oValue = oValue.replace("T12:00:00", "").replace(/\-/gi, "/");
                                     if (oValue.toString().match("^((([0-9]){2})(\.)([0-9]){2}(\.)([0-9]){4})$")) {

                                         var sSplited = oValue.split(".");

                                         var dat = new Date(sSplited[2] + "-" + sSplited[1] + "-" + sSplited[0]);
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

                         oDatePickerDesembolso.attachValidationError(function(evt) {

                         });

                         oForm.addContent(oDatePickerDesembolso);


                         oForm.addContent(oDisplayBase.createLabel("", "Cliente que presta su casa para la reunión*"));

                         oSelectNgCasaReunion = oInputBase.createSelect("selectGpoCasaReunion").bindProperty("selectedKey", {
                             path: "oLoanRequestModel>/GroupRequestData/MemberIDSharingHouseMD"
                         });

                         oForm.addContent(oSelectNgCasaReunion);

                         oSelectNgCasaReunion.setModel(oView.getModel("oLoanMembers"));
                         oSelectNgCasaReunion.setModel(oView.getModel("oLoanRequestModel"));

                         oSelectNgCasaReunion.bindAggregation("items", {
                             path: "oLoanMembers>/CustomerSet/",
                             factory: function(_id, _context) {

                                 if (_context.getObject().Customer !== undefined) {

                                     if (_context.getObject().Customer.hasOwnProperty("BpName")) {

                                         return new sap.ui.core.Item({
                                             key: _context.getObject().Customer.CustomerIdMD,
                                             text: _context.getObject().Customer.BpName.LastName + " " + _context.getObject().Customer.BpName.SecondName + " " + _context.getObject().Customer.BpName.FirstName + " " + _context.getObject().Customer.BpName.MiddleName
                                         });
                                     }

                                 }


                                 return new sap.ui.core.Item({
                                     key: "",
                                     text: ""
                                 });

                             }


                         });

                         oForm.addContent(oDisplayBase.createLabel("", "Día de Reunión*"));
                         GpoDiaReunion = new sap.ui.model.json.JSONModel("data-map/catalogos/days.json");
                         //Cargamos el catálogo de Tipos de Pagos de Seguros
                         oItemGpoDiaReunion = new sap.ui.core.Item({
                             key: "{idCRM}",
                             text: "{text}"
                         });
                         oForm.addContent(oInputBase.createSelect("selectGpoDiaReunion", "/days", oItemGpoDiaReunion, GpoDiaReunion, null, null).bindProperty("selectedKey", {
                             path: "oLoanRequestModel>/GroupRequestData/MeetingDate"
                         }));
                         oForm.addContent(oDisplayBase.createLabel("", "Horario de Reunión*"));
                         GpoHoraReunion = new sap.ui.model.json.JSONModel("data-map/catalogos/hours.json");
                         //Cargamos el catálogo de Tipos de Pagos de Seguros
                         oItemGpoHoraReunion = new sap.ui.core.Item({
                             key: "{idCRM}",
                             text: "{text}"
                         });
                         // OGG
                         oForm.addContent(oInputBase.createSelect("selectGpoHoraReunion", "/hours", oItemGpoHoraReunion, GpoHoraReunion, null, null).bindProperty("selectedKey", {
                             path: "oLoanRequestModel>/GroupRequestData/MeetingTime"
                         }));


                         oFloatType = new sap.ui.model.type.Float({
                             "groupingEnabled": false,
                             "decimalSeparator": "."
                         });



                         oForm.addContent(oDisplayBase.createLabel("", "Multa por Falta*"));
                         oTxtNgMultaPorFalta = oInputBase.createInputText("txtNgMultaPorFalta", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,6})(\.[0-9]{1,2})?$").setMaxLength(8);
                         oTxtNgMultaPorFalta.bindProperty("value", {
                             path: "oLoanRequestModel>/GroupRequestData/AbsencePenalty",
                             type: oFloatType
                         });
                         oForm.addContent(oTxtNgMultaPorFalta);


                         oForm.addContent(oDisplayBase.createLabel("", "Multa por Retardo*"));
                         oTxtNgMultaPorRetardo = oInputBase.createInputText("txtNgMultaPorRetardo", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,6})(\.[0-9]{1,2})?$").setMaxLength(8);
                         oTxtNgMultaPorRetardo.bindProperty("value", {
                             path: "oLoanRequestModel>/GroupRequestData/DelayPenalty",
                             type: oFloatType
                         });
                         oForm.addContent(oTxtNgMultaPorRetardo);



                         if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CM") {
                             oForm.addContent(oDisplayBase.createLabel("", "Monto Mínimo de Ahorro"));

                             oTxtNgMontoMinimoDeAhorro = oInputBase.createInputText("txtNgMontoMinimoDeAhorro", "Number", "$ 0.00", "", true, true, "^(([0-9]){1,6})(\.[0-9]{1,2})?$").setMaxLength(8);
                             oTxtNgMontoMinimoDeAhorro.bindProperty("value", {
                                 path: "oLoanRequestModel>/GroupRequestData/MinimumSavingsAmount",
                                 type: oFloatType
                             });
                             oForm.addContent(oTxtNgMontoMinimoDeAhorro);


                         }

                         oForm.addContent(oDisplayBase.createLabel("", ""));

                         if (oIdOportunidad !== "") {                             
                                 oForm.addContent(oActionBase.createButton("btnForApprovalGroupal", "Por aprobar", "Emphasized", "sap-icon://accept", oCurrentController.toStateApprove(oIdOportunidad, processType), oCurrentController).setEnabled(true));                             
                         }



                         currentTabFilter.destroyContent();
                         currentTabFilter.addContent(oForm);

                         oCurrentController.onFormEnable(oCurrentController.bIsEnabled, "itfGroupApp3");

                         break;

                 }
             }, 0);
         }
     },

     showApplicantsList: function() {
         var oModel, currentController, bdLoader;
         jQuery.sap.require("js.kapsel.Rest");
         jQuery.sap.require("js.serialize.bp.BPSerialize");
         currentController = this;

         if (sap.ui.getCore().byId("bdLoaderSolicitudes")) {

             bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudes");
             bdLoader.setText("Cargando Solicitantes");

         } else {

             bdLoader = new sap.m.BusyDialog("bdLoaderSolicitudes", {
                 text: 'Espere por favor...',
                 title: 'Cargando'
             });

             bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudes");
             bdLoader.setText("Cargando Solicitantes");

         }

         setTimeout(function() {
             bdLoader.open();
             var customerSerialize = new sap.ui.serialize.BP("dataDB", "Customer");

             customerSerialize.getMainModelWithOutLoan("CustomerSet", sap.ui.getCore().AppContext.Promotor, sap.ui.getCore().AppContext.sGrupalTypeID).then(function(oModel) {

                 currentController.bindTable(oModel, currentController);


                 bdLoader.close();

             }).catch(function(error) {

                 console.log(error);

             });

         }.bind(this), 0);
     },

     onClickReason: function(_sPath) {

         var sPath, oView;
         sPath = _sPath;
         oView = this.getView();

         return function(oEvent, oData) {

             var oLoanMembers, oCustomerIdMD, oCurrentDialog, sCauseId;


             var sPathCause, oItemCause;

             sPathCause = oEvent.getSource().getSelectedItem().getBindingContext().sPath;
             oItemCause = oEvent.getSource().getModel().getProperty(sPathCause);
             sCauseId = oItemCause.causeId;


             oLoanMembers = oView.getModel("oLoanMembers");
             oCustomerIdMD = oLoanMembers.getProperty(sPath);

             //// Anexar la razón al objeto

             this.onDeleteCustomerFromLoanRequest(oCustomerIdMD, sCauseId);
             //Se destruye el contenido del dialogo y se cierra dialogo
             oCurrentDialog = sap.ui.getCore().byId("appDialogRejectReason");
             oCurrentDialog.destroyContent();
             oCurrentDialog.destroyButtons();
             oCurrentDialog.close();


         }.bind(this);

     },
     rejectionReason: function(oEvent) {

         var iCurrentMembers;
         iCurrentMembers = this.AssociatedBPs - 1;

         if (this.oEnableDelete === true) {

             var oInputBase, oActionBase, oListBase;
             var dialogReject, oCurrentController, oRejectReasonListItem, oRejectReasonListModel, sPath;

             oInputBase = new sap.ui.mw.InputBase();
             oActionBase = new sap.ui.mw.ActionBase();
             oListBase = new sap.ui.mw.ListBase();

             oCurrentController = this;

             if (iCurrentMembers <= 0) {
                 sap.m.MessageToast.show("La solicitud debe contener al menos 1 miembro.");
                 return;
             }


             sPath = oEvent.getSource().oPropagatedProperties.oBindingContexts.undefined.sPath;

             setTimeout(function() {
                 dialogReject = sap.ui.getCore().byId('appDialogRejectReason');
                 oRejectReasonListModel = new sap.ui.model.json.JSONModel("data-map/catalogos/rejectionCause.json");
                 oRejectReasonListItem = new sap.m.StandardListItem({
                     title: "{causeName}",
                     type: "Active"
                 });

                 dialogReject.addContent(oInputBase.createSearchField("idSearchReject"));
                 dialogReject.addContent(oListBase.createList("appListRejectReason", "", sap.m.ListMode.SingleSelectMaster, oRejectReasonListModel, "/causes", oRejectReasonListItem, oCurrentController.onClickReason(sPath).bind(oCurrentController), oCurrentController));
                 dialogReject.addButton(oActionBase.createButton("", "Cancelar", "Emphasized", "sap-icon://sys-cancel", oCurrentController.cancelReason, oCurrentController));
                 dialogReject.open();
             }, 0);

         }

     },
     cancelReason: function() {
         var oCurrentDialog = sap.ui.getCore().byId("appDialogRejectReason");
         //Se destruye el contenido del dialogo y se cierra dialogo
         oCurrentDialog.destroyContent();
         oCurrentDialog.destroyButtons();
         oCurrentDialog.close();
     },

     bindTable: function(oModel, oController) {
         //Middleware de componentes SAPUI5
         var oInputBase, oListBase, oCurrentController, oActionBase, tblMembers;
         var tableFields, tableFieldVisibility, tableFieldDemandPopid;
         //Se declaran objetos de Middleware de componentes SAPUI5
         var oCompoundFilter, dialogAdds;
         oActionBase = new sap.ui.mw.ActionBase();
         oInputBase = new sap.ui.mw.InputBase();
         oListBase = new sap.ui.mw.ListBase();


         oCurrentController = this;

         dialogAdds = sap.ui.getCore().byId('appDialogMember');
         dialogAdds.destroyContent();
         dialogAdds.destroyButtons();
         dialogAdds.addContent(oInputBase.createSearchField("idSearchMember", oCurrentController.searchMemberTxt, oCurrentController, "100%"));
         //tabla de integrantes
         tableFields = [
             "Nombre",
             "Fecha de Alta",
             "Id Cliente",
         ];
         tableFieldVisibility = [
             true,
             true,
             true
         ];
         tableFieldDemandPopid = [
             false,
             false,
             true
         ];
         dialogAdds.addContent(oListBase.createTable("tblMembers", "", sap.m.ListMode.SingleSelectMaster, tableFields, tableFieldVisibility, tableFieldDemandPopid, null, oCurrentController.detailMember, oCurrentController));

         tblMembers = sap.ui.getCore().byId("tblMembers");

         oCompoundFilter = oController.onGenerateFiltersAvailableCustomers();
         tblMembers.setModel(oModel);
         tblMembers.bindAggregation("items", {
             path: "/results/",
             factory: function(_id, _context) {
                 return oCurrentController.onLoadTableMembers(_context);
             },
             filters: oCompoundFilter
         });

         //Barra de botones
         dialogAdds.addButton(oActionBase.createButton("", "Cancelar", "Default", "sap-icon://sys-cancel", oCurrentController.cancelSaveMember, oCurrentController));
         dialogAdds.open();
     },
     searchMemberTxt: function(evt) {

         // add filter for search
         var txtSeachFilter, table, binding, oFilter;
         txtSeachFilter = evt.getSource().getValue().toUpperCase();

         // update list binding
         table = sap.ui.getCore().byId("tblMembers");
         binding = table.getBinding("items");
         oFilter = this.onGenerateFiltersAvailableCustomersFilter(txtSeachFilter);
         binding.filter(oFilter);
     },
     cancelSaveMember: function() {
         var oCurrentDialog = sap.ui.getCore().byId("appDialogMember");
         //Se destruye el contenido del dialogo y se cierra dialogo
         oCurrentDialog.destroyContent();
         oCurrentDialog.destroyButtons();
         oCurrentDialog.close();
     },

     modelAttachRequestCompleted: function(_oModel) {


         return new Promise(function(resolve) {

             _oModel.attachRequestCompleted(function() {

                 resolve("OK");

             });


         }.bind(this));


     },
     detailMember: function(oItem, _sIsEditing) {

         var sPath, LastName = '',
             SecondName = '',
             FirstName = '',
             MiddleName = '';
         var oCurrentController, oView;
         var oAmountData, oItemAmount, oSelectMontoDeCredito, oSelectDetailRol;
         var oSelectDetailCanalDispersion, oSelectDetailMedioDispersion, oTxtDetailMontoAutorizado, oTxtDetailAhorro, oTxtDetailSeguro;
         var oLoanRequestModel;
         var oModel;
         var oPromesaMonto;
         var oPromesaInitizalizeDispersion;
         var oCustomer, DetailRol;

         if (!_sIsEditing) {
             _sIsEditing = false;
         }


         //Middleware de componentes SAPUI5
         var oInputBase, oActionBase, oDisplayBase, oLayoutBase;
         //Variables para dialogo.
         var dialogDetail, oForm;

         //Se declaran objetos de Middleware de componentes SAPUI5
         oInputBase = new sap.ui.mw.InputBase();
         oActionBase = new sap.ui.mw.ActionBase();
         oDisplayBase = new sap.ui.mw.DisplayBase();
         oLayoutBase = new sap.ui.mw.LayoutBase();

         oView = this.getView();
         oCurrentController = this;
         /***
           obtenermos el id del ruteo
         ***/

         sPath = oItem.getSource().getSelectedItem().getBindingContext().sPath;
         oModel = oItem.getSource().getSelectedItem().getBindingContext().getModel();
         if (_sIsEditing === true) {
             oItem = oModel.getProperty(sPath);
         } else {
             oCustomer = oModel.getProperty(sPath)
             oItem = {
                 CustomerIdCRM: oCustomer.CustomerIdCRM,
                 LoanRequestIdCRM: this.getView().getModel("oLoanRequestModel").getProperty("/LoanRequestIdCRM"),
                 CustomerIdMD: oCustomer.CustomerIdMD,
                 LoanRequestIdMD: this.getView().getModel("oLoanRequestModel").getProperty("/LoanRequestIdMD"),
                 CollaboratorID: oCustomer.CollaboratorID,
                 GroupLoanData: {
                     RoleInTheGroupId: "",
                     CreditAmount: 0,
                     AuthorizedAmount: 0,
                     RejectionCauseId: ""
                 },
                 GeneralLoanData: {
                     InsuranceAmount: 0,
                     ControlListsResult: 0,
                     RiskLevel: 0,
                     SavingsAmount: 0,
                     DispersionMediumId: "",
                     DispersionChannelId: "",
                     SemaphoreResultFilters: 0
                 },
                 Customer: oModel.getProperty(sPath)
             };
         };
         //setModel, select customer detail
         sap.ui.getCore().setModel(oItem, "oCustomerModelG");


         oForm = sap.ui.getCore().byId("idDetailMemberForm");


         if (oItem.CustomerIdMD === "") {

             oModel.setProperty(sPath + "/CustomerIdMD", this.onGenerateLoanRequestId());

         }


         setTimeout(function() {
             dialogDetail = sap.ui.getCore().byId('appDialogDetailMember');
             //Formulario de dialogo

             if (dialogDetail.getContent().length > 0) {
                 // si ya existe el modal con contenido, lo eliminamos para volverlo a crear
                 dialogDetail.destroyContent();
                 dialogDetail.destroyButtons();
             }
             oForm = oLayoutBase.createForm("idDetailMemberForm", true, 1, "Nuevo Integrante");
             oCurrentController.getRol(sap.ui.getCore().AppContext.sGrupalTypeID, oItem.GroupLoanData.RoleInTheGroupId).then(function(dataRol) {
                 var rolSelect = sap.ui.getCore().byId("selectDetailRol");
                 rolSelect.setModel(dataRol);
                 rolSelect.setSelectedKey(oItem.GroupLoanData.RoleInTheGroupId);
             }.bind(this));



             /*oForm.addContent(oDisplayBase.createLabel("", "Rol*"));

             if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CM") {

                 DetailRol = new sap.ui.model.json.JSONModel("data-map/catalogos/rol_C_GRUPAL_CM.json");

             } else {

                 DetailRol = new sap.ui.model.json.JSONModel("data-map/catalogos/rol_C_GRUPAL_CCR.json");

             }*/
             //Cargamos el catálogo de Tipos de Pagos de Seguros
             var oItemDetailRol = new sap.ui.core.Item({
                 key: "{idCRM}",
                 text: "{text}"
             });



             oSelectDetailRol = oInputBase.createSelect("selectDetailRol", "/rol", oItemDetailRol, null, null, null);

             oForm.addContent(oSelectDetailRol);
             oForm.addContent(oDisplayBase.createLabel("", "Id Cliente"));
             oForm.addContent(oInputBase.createInputText("txtDetailIdCliente", "Text", "00000000", oItem.CustomerIdCRM, true, false));

             //// If the customer doesn't have it, Set Id Cliente DM !!
             if (oItem.CustomerIdMD === "") {
                 sap.ui.getCore().AppContext.sIdDMClient = this.onGenerateLoanRequestId();

             } else {
                 sap.ui.getCore().AppContext.sIdDMClient = oItem.CustomerIdMD.toUpperCase();
             }
             //// If the customer doesn't have it, Set Id Cliente DM !!

             if (oItem.Customer.BpName.LastName) {
                 LastName = oItem.Customer.BpName.LastName.toUpperCase()
             }
             if (oItem.Customer.BpName.SecondName) {
                 SecondName = oItem.Customer.BpName.SecondName.toUpperCase()
             }
             if (oItem.Customer.BpName.FirstName) {
                 FirstName = oItem.Customer.BpName.FirstName.toUpperCase()
             }
             if (oItem.Customer.BpName.MiddleName) {
                 MiddleName = oItem.Customer.BpName.MiddleName.toUpperCase()
             }




             oForm.addContent(oDisplayBase.createLabel("", "Nombre"));
             oForm.addContent(oInputBase.createInputText("txtDetailNombre", "Text", "", FirstName + " " + MiddleName, true, false));
             oForm.addContent(oDisplayBase.createLabel("", "Apellido Paterno"));
             oForm.addContent(oInputBase.createInputText("txtDetailAPaterno", "Text", "", LastName, true, false));
             oForm.addContent(oDisplayBase.createLabel("", "Apellido Materno"));
             oForm.addContent(oInputBase.createInputText("txtDetailAMaterno", "Text", "", SecondName, true, false));
             //////// Mostrar campos de ahorro solo si es crédito mujer




             if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CM") {
                 oForm.addContent(oDisplayBase.createLabel("", "Monto Ahorro"));
                 oTxtDetailAhorro = oInputBase.createInputText("txtDetailAhorro", "Text", "$ 0.00", "", true, false, "^(([0 - 9]) {1, 15})(\.[0-9]{2})?$");
                 oForm.addContent(oTxtDetailAhorro);
             };


             oForm.addContent(oDisplayBase.createLabel("", "Monto Crédito*"));


             if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CM") {
                 oAmountData = new sap.ui.model.json.JSONModel("data-map/catalogos/proposedAmounts_C_CM_1.json");

             }

             if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CCR") {

                 oAmountData = new sap.ui.model.json.JSONModel("data-map/catalogos/proposedAmounts_C_CCR_1.json");
             }

             oAmountData.setSizeLimit(120);

             oItemAmount = new sap.ui.core.Item({
                 key: "{idCRM}",
                 text: "{text}"
             });

             oPromesaMonto = this.modelAttachRequestCompleted(oAmountData);

             oSelectMontoDeCredito = oInputBase.createSelect("selectMontoDeCredito", "/Montos", oItemAmount, oAmountData, null, null);
             oSelectMontoDeCredito.attachChange(this.onCreditAmountChange);
             oSelectMontoDeCredito.attachChange(this.onCreditAmountChange);



             oForm.addContent(oSelectMontoDeCredito);




             oForm.addContent(oDisplayBase.createLabel("", "Monto Seguro - Pago Diferido"));
             oTxtDetailSeguro = oInputBase.createInputText("txtDetailSeguro", "Text", "$ 0.00", "", true, false);
             oForm.addContent(oTxtDetailSeguro);


             oForm.addContent(oDisplayBase.createLabel("", "Canal Dispersor*"));

             oSelectDetailCanalDispersion = oInputBase.createSelect("selectDetailCanalDispersion").attachChange(oCurrentController.canalDispersionDetailChange.bind(oCurrentController));
             oForm.addContent(oSelectDetailCanalDispersion);

             oForm.addContent(oDisplayBase.createLabel("", "Medio de Dispersión*"));

             oSelectDetailMedioDispersion = oInputBase.createSelect("selectDetailMedioDispersion");
             oForm.addContent(oSelectDetailMedioDispersion);

             oForm.addContent(oDisplayBase.createLabel("", "Monto Autorizado"));
             oTxtDetailMontoAutorizado = oInputBase.createInputText("txtDetailMontoAutorizado", "Text", "$ 0.00", "0.00", true, false);
             oForm.addContent(oTxtDetailMontoAutorizado);

             //Agregar Formulario a Dialogo
             dialogDetail.addContent(oForm);
             //Barra de botones


             if (typeof oItem.GroupLoanData.RoleInTheGroupId !== "undefined") {


                 dialogDetail.addButton(oActionBase.createButton("btnGuardarMember", "Guardar", "Emphasized", "sap-icon://save", oCurrentController.saveDetailMember(sPath, _sIsEditing, oItem.GroupLoanData.RoleInTheGroupId).bind(this), oCurrentController));

             } else {

                 dialogDetail.addButton(oActionBase.createButton("btnGuardarMember", "Guardar", "Emphasized", "sap-icon://save", oCurrentController.saveDetailMember(sPath, _sIsEditing, "").bind(this), oCurrentController));
             }

             dialogDetail.addButton(oActionBase.createButton("", "Cancelar", "Default", "sap-icon://sys-cancel", oCurrentController.closeDetailMember, oCurrentController));


             //evento para envio de parametros
             myData = oItem;

             var dialogMember = sap.ui.getCore().byId('appDialogMember');
             dialogMember.close();

             dialogDetail.open();
             dialogDetail.attachAfterOpen(this.onCreditAmountChange);



             oPromesaInitizalizeDispersion = oCurrentController.onInitializeDispersion("selectDetailCanalDispersion", "selectDetailMedioDispersion");
             ////////// Binding de canal y medio de dispersion
             Promise.all([oPromesaMonto, oPromesaInitizalizeDispersion]).then(function(result) {

                 if (_sIsEditing) {

                     oSelectDetailRol.setSelectedKey(oItem.GroupLoanData.RoleInTheGroupId);
                     oSelectDetailCanalDispersion.setSelectedKey(oItem.GeneralLoanData.DispersionChannelId);

                     this.onUpdateDispersion("selectDetailCanalDispersion", "selectDetailMedioDispersion").then(
                         function(result) {

                             oSelectDetailMedioDispersion.setSelectedKey(oItem.GeneralLoanData.DispersionMediumId);
                             oTxtDetailMontoAutorizado.setValue(oItem.GroupLoanData.AuthorizedAmount);
                             oSelectMontoDeCredito.setSelectedKey(oItem.GroupLoanData.CreditAmount);
                             oTxtDetailSeguro.setValue(oItem.GeneralLoanData.InsuranceAmount);


                             if (sap.ui.getCore().AppContext.sGrupalTypeID === "C_GRUPAL_CM") {
                                 oTxtDetailAhorro.setValue(oItem.GeneralLoanData.SavingsAmount);
                             }
                         }.bind(this)
                     );


                 } else {
                     oCurrentController.matchDispersionToGroupal();
                 }



             }.bind(this));




         }.bind(this), 0);
     },
     getRol: function(_grupalType, _currentRol) {
         var sRolModel;
         switch (_grupalType) {
             case "C_GRUPAL_CM":
                 sRolModel = "data-map/catalogos/rol_C_GRUPAL_CM.json";
                 break;
             case "C_GRUPAL_CCR":
                 sRolModel = "data-map/catalogos/rol_C_GRUPAL_CCR.json";
                 break;
         }
         return new Promise(function(resolve) {
             new sap.ui.mw.FileBase()
                 .loadFile(sRolModel)
                 .then(function(oDataRol) {
                     console.log("oDataRol", oDataRol);
                     if (_currentRol !== 'ZG03') {
                         var detailRol = oDataRol.getProperty("/rol")
                         detailRol = _.without(detailRol, _.findWhere(detailRol, {
                             idCRM: 'ZG03'
                         }));
                         oDataRol.setProperty("/rol", detailRol);
                     }
                     resolve(oDataRol);
                 })
         });

     },
     saveDetailMember: function(_sPath, _sIsEditing, _sCurrentRole) {

         var sIsEditing, sCurrenRole;

         sIsEditing = _sIsEditing;
         sCurrenRole = _sCurrentRole;


         return function() {
             // OGG VALIDACIONES GENERALES
             var errorCount, oInputBase, oCurrentDialog, msgValidation,
                 oGroupLoanData, oCustomer;
             var oSelectDetailRol, oTxtDetailMontoAutorizado, oTxtDetailSeguro;
             var sSelectedRole;
             var oAuthorizedAmount, oSelectMontoDeCredito;


             oCustomer = sap.ui.getCore().getModel("oCustomerModelG");


             oCurrentDialog = sap.ui.getCore().byId("appDialogDetailMember");
             oInputBase = new sap.ui.mw.InputBase();

             errorCount = 0;
             msgValidation = "";

             if (!oInputBase.validationForForm("selectMontoDeCredito", "Select").type) {
                 errorCount++;
             }


             if (!oInputBase.validationForForm("selectDetailRol", "Select").type) {
                 msgValidation = oInputBase.validationForForm("selectDetailRol", "Select").message;
             }


             ////// Validaciones de miembros por tipo de credito
             oSelectDetailRol = sap.ui.getCore().byId("selectDetailRol");
             sSelectedRole = oSelectDetailRol.getSelectedKey();


             ///////// Validacion de roles

             if (sIsEditing) {

                 if (sSelectedRole !== sCurrenRole) { /// Si el rol actual es distinto al anterior


                     if (sSelectedRole !== "ZG05") { /// Si el rol es distinto a Integrante (ZG05)

                         if (this.memberRoles[sSelectedRole] !== "") {
                             /// Error, el rol ya fue seleccionado
                             sap.m.MessageToast.show("El rol " + oSelectDetailRol.getSelectedItem().getText() + " ya fue seleccionado, por favor seleccione un rol distinto o cambie las asignaciones de rol.");
                             return;
                         }

                         /// Limpiar el rol anterior

                     }

                     if (sCurrenRole !== "ZG05") {

                         this.memberRoles[sCurrenRole] = "";

                     }

                 }

             } else {

                 if (sSelectedRole !== "ZG05") { /// Si el rol es distinto a Integrante (ZG05)

                     if (this.memberRoles[sSelectedRole] !== "") {
                         /// Error, el rol ya fue seleccionado
                         sap.m.MessageToast.show("El rol " + oSelectDetailRol.getSelectedItem().getText() + " ya fue seleccionado, por favor seleccione un rol distinto o cambie las asignaciones de rol.");
                         return;
                     }

                     /// Limpiar el rol anterior

                 }

             }

             ///////// Validacion de roles

             if (!oInputBase.validationForForm("selectDetailCanalDispersion", "Select").type) {
                 msgValidation = oInputBase.validationForForm("selectDetailCanalDispersion", "Select").message;
             }
             if (!oInputBase.validationForForm("selectDetailMedioDispersion", "Select").type) {
                 msgValidation = oInputBase.validationForForm("selectDetailMedioDispersion", "Select").message;
             }
             if (!oInputBase.validationForForm("selectMontoDeCredito", "Select").type) {
                 msgValidation = oInputBase.validationForForm("selectMontoDeCredito", "Select").message;
             }



             //////////////////////////////////
             dataValidation = false; //ONLY FOR TESTING
             if (errorCount > 0) {
                 sap.m.MessageToast.show("Entrada obligatoria incorrecta");
             } else if (msgValidation !== "") {
                 sap.m.MessageToast.show(msgValidation);
             } else {


                 oSelectDetailRol = sap.ui.getCore().byId("selectDetailRol");
                 oTxtDetailMontoAutorizado = sap.ui.getCore().byId("txtDetailMontoAutorizado");

                 try {
                     oAuthorizedAmount = parseFloat(oTxtDetailMontoAutorizado.getValue());
                     oSelectMontoDeCredito = parseFloat(sap.ui.getCore().byId("selectMontoDeCredito").getSelectedKey());
                 } catch (error) {

                 }

                 oGroupLoanData = {
                     RoleInTheGroupId: oSelectDetailRol.getSelectedKey(),
                     CreditAmount: oSelectMontoDeCredito,
                     AuthorizedAmount: oAuthorizedAmount,
                     RejectionCauseId: "",
                 };




                 oCustomer.GeneralLoanData.DispersionChannelId = sap.ui.getCore().byId("selectDetailCanalDispersion").getSelectedKey();
                 oCustomer.GeneralLoanData.DispersionMediumId = sap.ui.getCore().byId("selectDetailMedioDispersion").getSelectedKey();

                 if (sap.ui.getCore().byId("txtDetailAhorro")) {

                     if (sap.ui.getCore().byId("txtDetailAhorro").getValue() !== "") {


                         try {
                             oCustomer.GeneralLoanData.SavingsAmount = parseFloat(sap.ui.getCore().byId("txtDetailAhorro").getValue());
                         } catch (error) {
                             sap.m.MessageToast.show("El monto de ahorro debe ser númerico.");
                             return false;
                         }

                     } else {
                         oCustomer.GeneralLoanData.SavingsAmount = 0.00;
                     }

                 } else {
                     oCustomer.GeneralLoanData.SavingsAmount = 0.00;
                 }



                 oTxtDetailSeguro = sap.ui.getCore().byId("txtDetailSeguro");

                 if (oTxtDetailSeguro) {

                     if (oTxtDetailSeguro.getValue() !== "") {
                         oCustomer.GeneralLoanData.InsuranceAmount = oTxtDetailSeguro.getValue();

                         try {
                             oCustomer.GeneralLoanData.InsuranceAmount = parseFloat(oTxtDetailSeguro.getValue());
                         } catch (error) {
                             sap.m.MessageToast.show("El monto del seguro debe ser númerico.");
                             return false;
                         }


                     } else {
                         oCustomer.GeneralLoanData.InsuranceAmount = 0.00;
                     }

                 } else {
                     oCustomer.GeneralLoanData.InsuranceAmount = 0.00;
                 }

                 oCustomer.GroupLoanData = oGroupLoanData;



                 if (!sIsEditing) {

                     this.onAddCustomerToLoanRequest(oCustomer);
                 } else {

                     this.onEditCustomerFromLoanRequest(oCustomer);
                 }

                 if (sSelectedRole !== "ZG05") {
                     this.memberRoles[sSelectedRole] = sSelectedRole;
                 }


                 sap.m.MessageToast.show("Datos guardados correctamente");

                 oCurrentDialog.destroyContent();
                 oCurrentDialog.destroyButtons();
                 oCurrentDialog.close();

             }

         };
     },
     updateCustomerSet: function(sPath, data) {

         var oModel;
         oModel = sap.ui.getCore().getModel("oCustomerModelG");
         oModel.setProperty(sPath + "/groupLoanData", data);

         this.oRequetMembers.push(oModel.getProperty("/CustomerIdMD"));

     },
     closeDetailMember: function() {
         var applicantDetailDialog = sap.ui.getCore().byId("appDialogDetailMember");
         applicantDetailDialog.destroyContent();
         applicantDetailDialog.destroyButtons();
         applicantDetailDialog.close();
     },

     showPrivacyNotice: function() {

         var dialogPrivacy, message;
         var oActionBase, oDisplayBase;
         //Se declaran objetos de Middleware de componentes SAPUI5
         oActionBase = new sap.ui.mw.ActionBase();
         oDisplayBase = new sap.ui.mw.DisplayBase();


         dialogPrivacy = sap.ui.getCore().byId("privacyNotice");

         message = oDisplayBase.createText("", "Declara el solicitante bajo protesta de decir verdad que:\n\n - Los datos capturados en la presente solicitud son correctos y se obtuvieron mediante entrevista personal con el Solicitante, autorizando a Banco Compartamos, S.A. Institución de Banca Múltiple, para que los compruebe a su entera satisfacción. \n\n  - Es la persona que se beneficiará en forma directa con los recursos que llegue a obtener en caso de que sea otorgado el Crédito que solicita, toda vez que actúa a nombre y por cuenta propia y no a nombre o por cuenta de un tercero.\n\n - Es de su conocimiento que proporcionar datos y documentos falsos, así como actuar a nombre de terceros sin estar facultado para ello constituye un delito.\n\n - Los recursos del Crédito solicitados en caso de que este sea autorizado, los destinará para fines lícitos. ");

         message.addStyleClass("sapPrivacyFormat");
         dialogPrivacy.addContent(message);
         dialogPrivacy.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", this.closePrivacy, this));

         dialogPrivacy.open();


     },

     closePrivacy: function() {
         var dialogPrivacy;

         dialogPrivacy = sap.ui.getCore().byId("privacyNotice");

         dialogPrivacy.destroyContent();
         dialogPrivacy.destroyButtons();
         dialogPrivacy.close();
     },

     readPDF: function() {

         var dialogPrivacy, message, oActionBase, oDisplayBase;
         //Se declaran objetos de Middleware de componentes SAPUI5
         oActionBase = new sap.ui.mw.ActionBase();
         oDisplayBase = new sap.ui.mw.DisplayBase();


         dialogPrivacy = sap.ui.getCore().byId("privacyNoticePDF");

         message = oDisplayBase.createReaderPDF("../www/js/vendor/pdfjs/web/viewer.html", "sapReaderPDF");

         dialogPrivacy.addStyleClass("dialogStyle");
         message.addStyleClass("sapPrivacyFormat");
         dialogPrivacy.addContent(message);
         dialogPrivacy.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", this.closePrivacyPDF, this));

         dialogPrivacy.open();


     },

     closePrivacyPDF: function() {
         var dialogPrivacy;

         dialogPrivacy = sap.ui.getCore().byId("privacyNoticePDF");

         dialogPrivacy.destroyContent();
         dialogPrivacy.destroyButtons();
         dialogPrivacy.close();
     },


     addPlace: function() {
         //Middleware de componentes SAPUI5
         var oInputBase, oActionBase, oDisplayBase, oLayoutBase, oSelectSuburb, oModelDelegation, oDelegation, oDataDelegation, oSelectDelegation, oModelColonia, oSuburb, oDataColonia;
         //Variables para dialogo.
         var dialogAdds, oForm, oFlex, oCurrentController, oView, GpoPais, oItemGpoPais, GpoEntidad, oItemGpoEntidad, GpoTipoTelefono, oItemGpoTipoTelefono, oItemAppDgDelegation, oItemAppDgSuburb, oLoanRequestModel, oPostalCode;

         //Se declaran objetos de Middleware de componentes SAPUI5
         oInputBase = new sap.ui.mw.InputBase();
         oActionBase = new sap.ui.mw.ActionBase();
         oDisplayBase = new sap.ui.mw.DisplayBase();
         oLayoutBase = new sap.ui.mw.LayoutBase();
         oListBase = new sap.ui.mw.ListBase();

         oView = this.getView();
         oCurrentController = this;

         dialogAdds = sap.ui.getCore().byId('appDialogMeeting');

         dialogAdds.destroyContent();
         dialogAdds.destroyButtons();

         //Formulario de dialogo
         oForm = oLayoutBase.createForm("idDgMeetingForm", true, 1, "");

         oForm.setModel(oView.getModel("oLoanRequestModel"), "oLoanRequestModel");
         oForm.setWidth("100%");
         oForm.setLayout(sap.ui.layout.form.SimpleFormLayout.ResponsiveGridLayout);

         oLoanRequestModel = oView.getModel("oLoanRequestModel");
         oPostalCode = oLoanRequestModel.getProperty("/GroupRequestData/GroupMeetingPlace/PostalCode");
         oFlex = oLayoutBase.createFlexBox();
         if (oPostalCode !== "") {
             oFlex.addItem(oInputBase.createCheckBox("chkBoxPlace", "", false, true, oCurrentController.onSelectAddress, oCurrentController).setSelected(true));
         } else {
             oFlex.addItem(oInputBase.createCheckBox("chkBoxPlace", "", false, true, oCurrentController.onSelectAddress, oCurrentController));
         }
         oFlex.addItem(oDisplayBase.createLabelHTML("", "", "¿El lugar de reunión es el mismo domicilio del cliente que presta su casa?"));
         oForm.addContent(oFlex);
         // OGG
         oForm.addContent(oDisplayBase.createLabel("", "Codigo Postal*"));
         oForm.addContent(oInputBase.createInputText("txtGpoZipCode", "Number", "Ingrese código postal...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/PostalCode}", true, true, "^\\d{5}$").setMaxLength(5));
         oForm.addContent(oActionBase.createButton("", "Buscar", "Default", "sap-icon://search", oCurrentController.getAddressCP, oCurrentController));
         oForm.addContent(oDisplayBase.createLabel("", "Pais*"));
         GpoPais = new sap.ui.model.json.JSONModel("data-map/catalogos/pais.json");
         GpoPais.setSizeLimit(300);
         //Cargamos el catálogo de Tipos de Pagos de Seguros
         oItemGpoPais = new sap.ui.core.Item({
             key: "{idCRM}",
             text: "{text}"
         });

         oForm.addContent(oInputBase.createSelect("selectGpoPais", "/pais", oItemGpoPais, GpoPais, null, null).setSelectedKey("MX").bindProperty("selectedKey", {
             path: "oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/CountryID"
         }));


         GpoEntidad = new sap.ui.model.json.JSONModel("data-map/catalogos/entidadNac.json");
         //Cargamos el catálogo de Tipos de Pagos de Seguros
         oItemGpoEntidad = new sap.ui.core.Item({
             key: "{idCRM}",
             text: "{text}"
         });

         oForm.addContent(oDisplayBase.createLabel("", "Entidad Federativa*"));
         oForm.addContent(oInputBase.createSelect("selectGpoEntidad", "/entidad", oItemGpoEntidad, GpoEntidad, null, null).bindProperty("selectedKey", {
             path: "oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/StateId"
         }));

         oItemAppDgDelegation = new sap.ui.core.Item({
             key: "{TownName}",
             text: "{TownName}"
         });

         oForm.addContent(oDisplayBase.createLabel("", "Delegación o Municipio*"));
         oModelDelegation = new sap.ui.model.json.JSONModel();
         oDelegation = oLoanRequestModel.getProperty("/GroupRequestData/GroupMeetingPlace/TownId");
         if (oDelegation !== "") {
             oDataDelegation = {
                 results: [{
                     TownName: oDelegation
                 }]
             };

             oModelDelegation.setData(oDataDelegation);
         }

         oSelectDelegation = oInputBase.createSelect("selectGpoDelegation", "/results", oItemAppDgDelegation, oModelDelegation);
         oForm.addContent(oSelectDelegation.bindProperty("selectedKey", {
             path: "oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/TownId"
         }));

         oForm.addContent(oDisplayBase.createLabel("", "Ciudad o Localidad*"));

         oForm.addContent(oInputBase.createInputText("txtGpoCiudad", "Text", "Ingrese Ciudad o Localidad...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/City}", true, true, "^[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\,\\.\\-*][\\s[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\.\\,\\-]*]*$").setMaxLength(40));
         oItemAppDgSuburb = new sap.ui.core.Item({
             key: "{SuburbName}",
             text: "{SuburbName}"
         });
         oForm.addContent(oDisplayBase.createLabel("", "Colonia o Barrio*"));
         oModelColonia = new sap.ui.model.json.JSONModel();
         oSuburb = oLoanRequestModel.getProperty("/GroupRequestData/GroupMeetingPlace/Suburb");
         if (oSuburb !== "") {
             oDataColonia = {
                 results: [{
                     SuburbName: oSuburb
                 }]
             };
             oModelColonia.setData(oDataColonia);
         }
         oSelectSuburb = oInputBase.createSelect("selectGpoColonia", "/results", oItemAppDgSuburb, oModelColonia).setAutoAdjustWidth(false);
         oSelectSuburb.setWidth("100%");
         oForm.addContent(oSelectSuburb.bindProperty("selectedKey", {
             path: "oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/Suburb"
         }));
         oForm.addContent(oDisplayBase.createLabel("", "Calle*"));
         oForm.addContent(oInputBase.createInputText("txtGpoCalle", "Text", "Ingrese calle...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/Street}", null, true, "^[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\,\\.\\-*][\\s[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\.\\,\\-]*]*$").setMaxLength(60));
         oForm.addContent(oDisplayBase.createLabel("", "Número Exterior*"));
         oForm.addContent(oInputBase.createInputText("txtGpoNumeroExt", "Text", "Ingrese número exterior...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/OutsideNumber}", null, true, "^[A-Za-z0-9ÑÁÉÍÓÚñáéíóú*][\\s[A-Za-z0-9ÑÁÉÍÓÚñáéíóú]*]*$").setMaxLength(10));
         oForm.addContent(oDisplayBase.createLabel("", "Número Interior*"));
         oForm.addContent(oInputBase.createInputText("txtGpoNumeroInt", "Text", "Ingrese número interior...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/InteriorNumber}", null, true, "^[A-Za-z0-9ÑÁÉÍÓÚñáéíóú*][\\s[A-Za-z0-9ÑÁÉÍÓÚñáéíóú]*]*$").setMaxLength(10));
         oForm.addContent(oDisplayBase.createLabel("", "Entre que calles(Calle 1)"));
         oForm.addContent(oInputBase.createInputText("txtGpoCalle1", "Text", "Ingrese entre que calle 1...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/BetweenStreets1}", null, true, "^[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\,\\.\\-*][\\s[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\,\\.\\-]*]*$").setMaxLength(40));
         oForm.addContent(oDisplayBase.createLabel("", "Entre que calles(Calle 2)"));
         oForm.addContent(oInputBase.createInputText("txtGpoCalle2", "Text", "Ingrese entre que calle 2...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/BetweenStreets2}", null, true, "^[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\,\\.\\-*][\\s[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\,\\.\\-]*]*$").setMaxLength(40));
         oForm.addContent(oDisplayBase.createLabel("", "Referencias de Ubicación*"));
         oForm.addContent(oInputBase.createInputText("txtGpoReferencias", "Text", "Ingrese referencias de ubicación...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/LocationReference}", null, true, "^[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\,\\.\\-*][\\s[A-Za-z0-9ÑÁÉÍÓÚñáéíóú\\,\\.\\-]*]*$").setMaxLength(40));
         oForm.addContent(oDisplayBase.createLabel("", "Teléfono"));
         oForm.addContent(oInputBase.createInputText("txtGpoTelefono", "Text", "Ingrese lada +  teléfono...", "{oLoanRequestModel>/GroupRequestData/GroupMeetingPhone/PhoneNumber}", null, true, "^(([0-9\-]){1,10})$").setMaxLength(10));
         oForm.addContent(oDisplayBase.createLabel("", "Tipo de Teléfono"));
         GpoTipoTelefono = new sap.ui.model.json.JSONModel("data-map/catalogos/phones.json");
         //Cargamos el catálogo de Tipos de Pagos de Seguros
         oItemGpoTipoTelefono = new sap.ui.core.Item({
             key: "{idCRM}",
             text: "{type}"
         });
         oForm.addContent(oInputBase.createSelect("selectGpoTipoTelefono", "/tipo", oItemGpoTipoTelefono, GpoTipoTelefono, null, null).bindProperty("selectedKey", {
             path: "oLoanRequestModel>/GroupRequestData/GroupMeetingPhone/PhoneTypeId"
         }));
         oForm.addContent(oDisplayBase.createLabel("", "Comentarios"));
         var emtpy;
         oForm.addContent(oInputBase.createTextArea("txtAreaGpoComentarios", emtpy, emtpy, emtpy, 40).bindProperty("value", {
             path: "oLoanRequestModel>/GroupRequestData/GroupMeetingPlace/Comments"
         }));

         //Se agrega formulario a dialogo
         dialogAdds.addContent(oForm);

         //Barra de botones
         dialogAdds.addButton(oActionBase.createButton("", "Guardar", "Emphasized", "sap-icon://save", oCurrentController.saveReunion.bind(this), oCurrentController));
         dialogAdds.addButton(oActionBase.createButton("", "Cancelar", "Default", "sap-icon://sys-cancel", oCurrentController.cancelPlaceMeeting, oCurrentController));
         dialogAdds.open();
     },
     cancelPlaceMeeting: function() {
         var oCurrentDialog = sap.ui.getCore().byId("appDialogMeeting");
         //Se destruye el contenido del dialogo y se cierra dialogo
         oCurrentDialog.destroyContent();
         oCurrentDialog.destroyButtons();
         oCurrentDialog.close();
     },
     saveReunion: function() {
         // OGG validaciones generales
         var errorCount, oInputBase, oCurrentDialog, msgValidation;

         oCurrentDialog = sap.ui.getCore().byId("appDialogMeeting");
         oInputBase = new sap.ui.mw.InputBase();


         var oLoanRequestModel = this.retrieveModel("oLoanRequestModel");
         var oMemberHouse = oLoanRequestModel.getProperty("/groupRequestData/memberIDSharingHouseMD");

         if (oLoanRequestModel.getProperty("/groupRequestData/memberIDSharingHouse") === "") {
             oLoanRequestModel.setProperty("/groupRequestData/memberIDSharingHouse", oMemberHouse);
         }

         errorCount = 0;
         msgValidation = "";

         if (!oInputBase.validationForForm("txtGpoZipCode", "Input").type) {
             errorCount++;
         }
         if (!oInputBase.validationForForm("txtGpoCalle", "Input").type) {
             errorCount++;
         }
         if (!oInputBase.validationForForm("txtGpoNumeroExt", "Input").type) {
             errorCount++;
         }
         if (!oInputBase.validationForForm("txtGpoNumeroInt", "Input").type) {
             errorCount++;
         }
         if (!oInputBase.checkStatusValue("txtGpoCalle1", "Input").type) {
             errorCount++;
         }
         if (!oInputBase.checkStatusValue("txtGpoCalle2", "Input").type) {
             errorCount++;
         }
         if (!oInputBase.validationForForm("txtGpoReferencias", "Input").type) {
             errorCount++;
         }
         if (!oInputBase.validationForForm("txtGpoTelefono", "Input").type) {
             errorCount++;
         }
         if (!oInputBase.validationForForm("txtGpoCiudad", "Input").type) {
             errorCount++;
         }

         if (!oInputBase.validationForForm("selectGpoPais", "Select").type) {
             msgValidation = oInputBase.validationForForm("selectGpoPais", "Select").message;
         }
         if (!oInputBase.validationForForm("selectGpoEntidad", "Select").type) {
             msgValidation = oInputBase.validationForForm("selectGpoEntidad", "Select").message;
         }
         if (!oInputBase.validationForForm("selectGpoDelegation", "Select").type) {
             msgValidation = oInputBase.validationForForm("selectGpoDelegation", "Select").message;
         }
         if (!oInputBase.validationForForm("selectGpoColonia", "Select").type) {
             msgValidation = oInputBase.validationForForm("selectGpoColonia", "Select").message;
         }

         if (!oInputBase.validationForForm("selectGpoTipoTelefono", "Select").type) {
             msgValidation = oInputBase.validationForForm("selectGpoTipoTelefono", "Select").message;
         }

         if (errorCount > 0) {
             sap.m.MessageToast.show("Entrada obligatoria incorrecta");
         } else if (msgValidation !== "") {
             sap.m.MessageToast.show(msgValidation);
         } else {
             sap.m.MessageToast.show("Datos guardados correctamente");
             //Se destruye el contenido del dialogo y se cierra dialogo
             oCurrentDialog.destroyContent();
             oCurrentDialog.destroyButtons();
             oCurrentDialog.close();
         }

     },
     sendToCore: function(_sFuncion) {
         var sFuncion;
         sFuncion = _sFuncion;
         return function() {

             //Middleware de componentes SAPUI5
             var oActionBase, oDisplayBase;
             //Variables para dialogo.
             var dialogAdds, oCurrentController;

             //Se declaran objetos de Middleware de componentes SAPUI5

             oActionBase = new sap.ui.mw.ActionBase();
             oDisplayBase = new sap.ui.mw.DisplayBase();

             oCurrentController = this;





             setTimeout(function() {
                 dialogAdds = sap.ui.getCore().byId('appDialogSendCore');
                 //agregar contenido a dialogo
                 if (sFuncion === "SAVE") {

                     dialogAdds.addContent(oDisplayBase.createLabel("", "¿Desea guardar?"));
                     dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.save, oCurrentController));

                 } else {

                     dialogAdds.addContent(oDisplayBase.createLabel("", "¿Desea enviar la información a Integra?"));
                     dialogAdds.addButton(oActionBase.createButton("", "Aceptar", "Emphasized", "", oCurrentController.sendInformationToCore, oCurrentController));

                 }


                 dialogAdds.addButton(oActionBase.createButton("", "Cancelar", "Default", "", oCurrentController.closeSendCore, oCurrentController));
                 dialogAdds.open();
             }, 0);

         };
     },

     closeSendCore: function() {
         sap.ui.getCore().AppContext.loader.close();
         var oCurrentDialog = sap.ui.getCore().byId("appDialogSendCore");
         //Se destruye el contenido del dialogo y se cierra dialogo
         oCurrentDialog.destroyContent();
         oCurrentDialog.destroyButtons();
         oCurrentDialog.close();
     },
     onLoadTableMembers: function(_context) {
         jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");
         var oDisplayBase, itemsTemplate, sDate, LastName = '',
             SecondName = '',
             FirstName = '',
             MiddleName = '';
         oDisplayBase = new sap.ui.mw.DisplayBase();

         if (_context.getProperty(_context.getPath() + "/BpName/LastName")) {
             LastName = _context.getProperty(_context.getPath() + "/BpName/LastName").toUpperCase()
         }
         if (_context.getProperty(_context.getPath() + "/BpName/SecondName")) {
             SecondName = _context.getProperty(_context.getPath() + "/BpName/SecondName").toUpperCase()
         }
         if (_context.getProperty(_context.getPath() + "/BpName/FirstName")) {
             FirstName = _context.getProperty(_context.getPath() + "/BpName/FirstName").toUpperCase()
         }
         if (_context.getProperty(_context.getPath() + "/BpName/MiddleName")) {
             MiddleName = _context.getProperty(_context.getPath() + "/BpName/MiddleName").toUpperCase()
         }

         itemsTemplate = new sap.m.ColumnListItem({
             type: "Active"
         });
         itemsTemplate.addCell(oDisplayBase.createText("", LastName + " " + SecondName + " " + FirstName + " " + MiddleName));

         sDate = _context.getProperty(_context.getPath() + "/BpMainData/RegistrationDate");

         if (sDate !== null && sDate !== "") {
             itemsTemplate.addCell(oDisplayBase.createText("", oDisplayBase.formatDate(_context.getProperty(_context.getPath() + "/BpMainData/RegistrationDate"), "dd.MM.yyyy")));
         } else {

             itemsTemplate.addCell(oDisplayBase.createText("", "No disponible"));

         }

         itemsTemplate.addCell(oDisplayBase.createText("", _context.getProperty(_context.getPath() + "/CustomerIdCRM")));

         return itemsTemplate;
     },

     loadRolCatalog: function() {

         jQuery.sap.require("js.base.FileBase");

         var oFileBase;
         oFileBase = new sap.ui.mw.FileBase();
         oFileBase.loadFile("data-map/catalogos/rol.json")
             .then(function(oResult) {

                 this.oRolDictionary = {};

                 /// Extraer datos del modelo, crear diccionario de roles
                 oResult.getProperty("/rol").forEach(function(oElement) {

                     if (oElement.idCRM !== "") {
                         this.oRolDictionary[oElement.idCRM] = oElement.text;
                     }

                 }.bind(this));


             }.bind(this));

     },

     retrieveRiskLevelDescription: function(_iRiskLevel) {


         switch (_iRiskLevel) {

             case 0:
                 return "";
             case 1:
                 return "Muy Bajo";
             case 2:
                 return "Bajo";
             case 3:
                 return "Medio";
             case 4:
                 return "Alto";
             case 5:
                 return "Muy Alto";
             case -1:
                 return "Error";
             case 99:
                 return "Pendiente de filtros";
             case 100:
                 return "";
             default:
                 return "";

         }
     },

     applySemaphoreStyle: function(_iLight, oSemaphoreIcon) {

         if (_iLight === undefined) {

             oSemaphoreIcon.removeStyleClass('semaphoreLevelRed');
             oSemaphoreIcon.removeStyleClass('semaphoreLevelGreen');
             oSemaphoreIcon.addStyleClass('semaphoreInitial');
             return;
         }

         switch (_iLight) {

             case 0:
                 oSemaphoreIcon.removeStyleClass('semaphoreLevelRed');
                 oSemaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                 oSemaphoreIcon.addStyleClass('semaphoreInitial');
                 return;

             case 1:
                 oSemaphoreIcon.removeStyleClass('semaphoreLevelRed');
                 oSemaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                 oSemaphoreIcon.addStyleClass('semaphoreInitial');
                 return;

             case 2:
                 oSemaphoreIcon.removeStyleClass('semaphoreLevelRed');
                 oSemaphoreIcon.removeStyleClass('semaphoreInitial');
                 oSemaphoreIcon.addStyleClass('semaphoreLevelGreen');
                 return

             case 3:
                 oSemaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                 oSemaphoreIcon.removeStyleClass('semaphoreInitial');
                 oSemaphoreIcon.addStyleClass('semaphoreLevelRed');
                 return

             default:
                 oSemaphoreIcon.removeStyleClass('semaphoreLevelRed');
                 oSemaphoreIcon.removeStyleClass('semaphoreLevelGreen');
                 oSemaphoreIcon.addStyleClass('semaphoreInitial');
                 return;
         }


     },

     retrieveControlList: function(_iControlList) {


         switch (_iControlList) {

             case 0:
                 return "";
             case 1:
                 return "Aprobado";
             case 2:
                 return "Rechazado";
             default:
                 return "";
         }


     },

     createItemTableIntegrants: function(_context) {

         jQuery.sap.require("js.base.DisplayBase", "js.base.ActionBase");

         var oDisplayBase, itemsTemplate, oCurrentController, oListaControl, sLevelRisk;
         var LastName, SecondName, FirstName, MiddleName, sRol, semaphoreIcon;
         var sRolSelect;

         LastName = "";
         SecondName = "";
         FirstName = "";
         MiddleName = "";
         sRol = "";
         oCurrentController = this;
         oDisplayBase = new sap.ui.mw.DisplayBase();

         sRolSelect = _context.getProperty(_context.getPath() + "/GroupLoanData/RoleInTheGroupId");
         sLevelRisk = _context.getProperty(_context.getPath() + "/GeneralLoanData/RiskLevel");

         if (sRolSelect !== "") {
             sRol = this.oRolDictionary.hasOwnProperty(sRolSelect) ? this.oRolDictionary[sRolSelect] : "";
         }

         itemsTemplate = new sap.m.ColumnListItem({});
         itemsTemplate.setType(sap.m.ListType.Active);

         sLevelRisk = this.retrieveRiskLevelDescription(sLevelRisk);

         if (sap.ui.getCore().AppContext.bIsCreating) { /// Si esta creando, lista de control vacia
             oListaControl = "";
         } else {
             oListaControl = _context.getProperty(_context.getPath() + "/GeneralLoanData/ControlListsResult");
             oListaControl = this.retrieveControlList(oListaControl);
         }

         if (_context.getProperty(_context.getPath() + "/Customer/BpName/LastName")) {
             LastName = _context.getProperty(_context.getPath() + "/Customer/BpName/LastName").toUpperCase()
         }
         if (_context.getProperty(_context.getPath() + "/Customer/BpName/SecondName")) {
             SecondName = _context.getProperty(_context.getPath() + "/Customer/BpName/SecondName").toUpperCase()
         }
         if (_context.getProperty(_context.getPath() + "/Customer/BpName/FirstName")) {
             FirstName = _context.getProperty(_context.getPath() + "/Customer/BpName/FirstName").toUpperCase()
         }
         if (_context.getProperty(_context.getPath() + "/Customer/BpName/MiddleName")) {
             MiddleName = _context.getProperty(_context.getPath() + "/Customer/BpName/MiddleName").toUpperCase()
         }

         itemsTemplate.addCell(new sap.m.ObjectHeader({
             title: LastName + " " + SecondName + " " + FirstName + " " + MiddleName,
             attributes: [
                 new sap.m.ObjectAttribute({
                     title: "Rol",
                     text: sRol
                 }), new sap.m.ObjectAttribute({
                     title: "Lista de Control",
                     text: oListaControl
                 }),
                 new sap.m.ObjectAttribute({
                     title: "Nivel de Riesgo",
                     text: sLevelRisk
                 })
             ]
         }));

         itemsTemplate.addCell(oDisplayBase.createIcon("", "sap-icon://employee-rejections", "2.0rem").attachPress(oCurrentController.rejectionReason.bind(oCurrentController)));

         semaphoreIcon = oDisplayBase.createIcon("", "sap-icon://status-error", "2.0rem");

         if (sap.ui.getCore().AppContext.bIsCreating) {

             semaphoreIcon.addStyleClass('semaphoreInitial');

         } else {
             /// Color del semáforo
             semaforo = _context.getProperty(_context.getPath() + "/GeneralLoanData/SemaphoreResultFilters");
             this.applySemaphoreStyle(semaforo, semaphoreIcon);

         }

         itemsTemplate.addCell(semaphoreIcon);

         return itemsTemplate;
     },





     lookupForAdrress: function(_sCustomerIDDM) {
         var oView;
         oView = this.getView();
         return new Promise(function(resolve) {

             try {


                 var i;
                 var oLoanRequestModel;
                 var aCustomers;
                 var oResults;
                 var results;
                 var oFinalResults;
                 var bFound = false;


                 results = [];
                 oResults = {};
                 oFinalResults = {};

                 oLoanRequestModel = oView.getModel("oLoanRequestModel");
                 aCustomers = oLoanRequestModel.getProperty("/LinkSet");




                 if (aCustomers.results) {

                     for (i = 0; i < aCustomers.results.length; i++) {

                         if (aCustomers.results[i].CustomerIdMD === _sCustomerIDDM) {

                             if (aCustomers.results[i].Customer.AddressSet) {

                                 if (aCustomers.results[i].Customer.AddressSet.results) {

                                     if (aCustomers.results[i].Customer.AddressSet.results.length > 0) {

                                         oResults.AddressSet = aCustomers.results[i].Customer.AddressSet;
                                         oResults.PhoneSet = aCustomers.results[i].Customer.PhoneSet;
                                         results.push(oResults);
                                         bFound = true;
                                         break;


                                     }


                                 }


                             }

                         }

                     }



                 }

                 oFinalResults.results = results;
                 oFinalResults.bFound = bFound;

                 resolve(oFinalResults);


             } catch (error) {

                 resolve("Error");
             }



         });

     },

     onSelectAddress: function() {

         var idClienteCasa, oAddressModelClient, chkBoxCP, chkBoxSelected, selectClienteCasa;
         var postalCode, bdLoader;
         var promiseMemory, promiseReadCP, selectDelegation;

         chkBoxCP = sap.ui.getCore().byId("chkBoxPlace");
         chkBoxSelected = chkBoxCP.getSelected();
         selectClienteCasa = sap.ui.getCore().byId("selectGpoCasaReunion");

         if (chkBoxSelected) {
             idClienteCasa = selectClienteCasa.getSelectedKey();

             if (idClienteCasa !== "") {

                 bdLoader = sap.ui.getCore().byId("bdLoaderSolicitudes");
                 bdLoader.setText("Información Cliente...");
                 bdLoader.open();

                 setTimeout(function() {

                     promiseMemory = this.lookupForAdrress(idClienteCasa);

                     promiseReadCP = sap.ui.getCore().AppContext.myRest.read("/CustomerSet", "$filter=CustomerIdMD eq '" + idClienteCasa + "'&$expand=AddressSet,PhoneSet", true);

                     Promise.all([promiseMemory, promiseReadCP])
                         .then(function(response) {

                             var bFound = false;

                             bdLoader.close();
                             oAddressModelClient = new sap.ui.model.json.JSONModel();

                             if (typeof response[0] !== "string") {
                                 if (response[0].bFound) {
                                     bFound = true;
                                     oAddressModelClient.setData(response[0]);
                                 }
                             }

                             if (!bFound) {
                                 oAddressModelClient.setData(response[1]);

                             }

                             postalCode = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/PostalCode");

                             sap.ui.getCore().AppContext.myRest.read("/PostalCodeSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "' and Code eq '" + postalCode + "'", true)
                                 .then(function(oAddressModelClient, postalCodeResult) {

                                     var txtCodePostal, selectCountry, selectCity, selectEntity, selectSuburb, txtStreet, txtInteriorNumber, txtoutsideNumber, txtbetweenStreets1, txtbetweenStreets2, txtlocationReference, txtCity, txtPhone, selectPhone;
                                     var betweenStreets1, betweenStreets2, postalCode, street, interiorNumber, outsideNumber, suburb, locationReference, townId, townName, numberPhone, typePhone;
                                     var countryId, stateName, cityName;

                                     postalCode = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/PostalCode");
                                     countryId = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/CountryID");
                                     stateName = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/StateId");
                                     cityName = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/City");
                                     townId = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/TownId");

                                     if (postalCodeResult.hasOwnProperty("results")) {
                                         if (postalCodeResult.results.length > 0) {

                                             if (postalCodeResult.results[0].hasOwnProperty("TownName")) {
                                                 townName = postalCodeResult.results[0].TownName;
                                             }

                                         }

                                     }

                                     suburb = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/Suburb");
                                     street = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/Street");
                                     outsideNumber = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/OutsideNumber");
                                     interiorNumber = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/InteriorNumber");
                                     betweenStreets1 = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/BetweenStreets1");
                                     betweenStreets2 = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/BetweenStreets2");
                                     locationReference = oAddressModelClient.getProperty("/results/0/AddressSet/results/0/Place/LocationReference");
                                     numberPhone = oAddressModelClient.getProperty("/results/0/PhoneSet/results/0/PhoneNumber");
                                     typePhone = oAddressModelClient.getProperty("/results/0/PhoneSet/results/0/PhoneTypeId");

                                     txtCodePostal = sap.ui.getCore().byId("txtGpoZipCode");
                                     txtCodePostal.setValue(postalCode);
                                     selectCountry = sap.ui.getCore().byId("selectGpoPais");
                                     selectCountry.setSelectedKey(countryId);
                                     selectCountry.setEnabled(false);
                                     selectCity = sap.ui.getCore().byId("selectGpoEntidad");
                                     selectCity.setSelectedKey(stateName);
                                     selectCity.setEnabled(false);



                                     selectDelegation = sap.ui.getCore().byId("selectGpoDelegation");
                                     var oItemDelegation = new sap.ui.core.Item({
                                         key: townName,
                                         text: townName
                                     });
                                     selectDelegation.addItem(oItemDelegation);
                                     selectDelegation.setSelectedKey(townId);
                                     selectDelegation.setEnabled(false);

                                     txtCity = sap.ui.getCore().byId("txtGpoCiudad");
                                     txtCity.setValue(cityName);

                                     selectSuburb = sap.ui.getCore().byId("selectGpoColonia");
                                     var oItemColonia = new sap.ui.core.Item({
                                         key: suburb,
                                         text: suburb
                                     });
                                     selectSuburb.addItem(oItemColonia);
                                     selectSuburb.setSelectedKey(suburb);


                                     txtStreet = sap.ui.getCore().byId("txtGpoCalle");
                                     txtStreet.setValue(street);
                                     txtoutsideNumber = sap.ui.getCore().byId("txtGpoNumeroExt");
                                     txtoutsideNumber.setValue(outsideNumber);
                                     txtInteriorNumber = sap.ui.getCore().byId("txtGpoNumeroInt");
                                     txtInteriorNumber.setValue(interiorNumber);
                                     txtbetweenStreets1 = sap.ui.getCore().byId("txtGpoCalle1");
                                     txtbetweenStreets1.setValue(betweenStreets1);
                                     txtbetweenStreets2 = sap.ui.getCore().byId("txtGpoCalle2");
                                     txtbetweenStreets2.setValue(betweenStreets2);
                                     txtlocationReference = sap.ui.getCore().byId("txtGpoReferencias");
                                     txtlocationReference.setValue(locationReference);
                                     txtPhone = sap.ui.getCore().byId("txtGpoTelefono");
                                     txtPhone.setValue(numberPhone);
                                     selectPhone = sap.ui.getCore().byId("selectGpoTipoTelefono");
                                     selectPhone.setSelectedKey(typePhone);


                                 }.bind(this, oAddressModelClient))



                         }).catch(function() {
                             sap.m.MessageToast.show("Se produjo un error al consultar el detalle de la dirección, por favor intente nuevamente. ");
                             bdLoader.close();
                         });

                 }.bind(this), 0);

             }

         } else {

             sap.ui.getCore().byId("txtGpoZipCode").setValue("");
             selectCountry = sap.ui.getCore().byId("selectGpoPais").setSelectedKey("MX");
             selectCountry.setEnabled(true);
             selectCity = sap.ui.getCore().byId("selectGpoEntidad").setSelectedKey("AGS");
             selectCity.setEnabled(true);
             selectDelegation = sap.ui.getCore().byId("selectGpoDelegation").setSelectedKey("");
             selectDelegation.setEnabled(true);
             sap.ui.getCore().byId("txtGpoCiudad").setValue("");
             sap.ui.getCore().byId("selectGpoColonia").setSelectedKey("");
             sap.ui.getCore().byId("txtGpoCalle").setValue("");
             sap.ui.getCore().byId("txtGpoNumeroExt").setValue("");
             sap.ui.getCore().byId("txtGpoNumeroInt").setValue("");
             sap.ui.getCore().byId("txtGpoCalle1").setValue("");
             sap.ui.getCore().byId("txtGpoCalle2").setValue("");
             sap.ui.getCore().byId("txtGpoReferencias").setValue("");
             sap.ui.getCore().byId("txtGpoTelefono").setValue("");
             sap.ui.getCore().byId("selectGpoTipoTelefono").setSelectedKey("");

         }

     },

     getAddressCP: function() {

         //Variables para obtener valores del servicio de CP
         var countryId, stateId, cityName, promiseReadAddress;
         var selectCountry, selectEntity, selectDelegation, txtCity;
         //objetos InputBase
         var oInputBase = new sap.ui.mw.InputBase();
         var postalCode, oAddressModel;

         if (!oInputBase.validationForForm("txtGpoZipCode", "Input").type) {
             sap.m.MessageToast.show("Entrada incorrecta");
         } else {

             postalCode = sap.ui.getCore().byId("txtGpoZipCode").getValue();
             promiseReadAddress = sap.ui.getCore().AppContext.myRest.read("/PostalCodeSet", "$filter=CollaboratorID eq '" + sap.ui.getCore().AppContext.Promotor + "' and Code eq '" + postalCode + "'", true);
             promiseReadAddress
                 .then(function(response) {

                     oAddressModel = new sap.ui.model.json.JSONModel();
                     oAddressModel.setData(response);


                     countryId = oAddressModel.getProperty("/results/0/CountryId");
                     stateId = oAddressModel.getProperty("/results/0/StateId");
                     cityName = oAddressModel.getProperty("/results/0/City");

                     selectCountry = sap.ui.getCore().byId("selectGpoPais");
                     selectCountry.setSelectedKey(countryId);
                     selectCountry.setEnabled(false);
                     selectEntity = sap.ui.getCore().byId("selectGpoEntidad");
                     selectEntity.setSelectedKey(stateId);
                     selectEntity.setEnabled(false);
                     selectDelegation = sap.ui.getCore().byId("selectGpoDelegation");
                     selectDelegation.setModel(oAddressModel);
                     selectDelegation.setEnabled(false);
                     txtCity = sap.ui.getCore().byId("txtGpoCiudad");
                     txtCity.setValue(cityName);
                     txtCity.setEnabled(false);
                     selectSuburb = sap.ui.getCore().byId("selectGpoColonia");
                     selectSuburb.setModel(oAddressModel);


                 }).catch(function() {
                     sap.m.MessageToast.show("Se produjo un error al consultar el detalle del código postal, por favor intente nuevamente. ");

                 });
         }

     }
 });
