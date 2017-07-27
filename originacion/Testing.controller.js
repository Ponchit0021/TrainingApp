 sap.ui.controller("originacion.Testing", {


     /**
      * Called when a controller is instantiated and its View controls (if available) are already created.
      * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
      * @memberOf originacion.Testing
      */
     onInit: function() {
         console.log("Testing");
         jQuery.sap.require("js.db.Pouch");
         jQuery.sap.require("js.helper.Dictionary");
         var pouchDB = new sap.ui.db.Pouch("TestingDB");
         var dictionary = new sap.ui.helper.Dictionary();
         console.log(dictionary);


         console.log(pouchDB);

     },

     /**
      * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
      * (NOT before the first rendering! onInit() is used for that one!).
      * @memberOf originacion.Testing
      */
     //  onBeforeRendering: function() {
     //
     //  },

     /**
      * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
      * This hook is the same one that SAPUI5 controls get after being rendered.
      * @memberOf originacion.Testing
      */
     //  onAfterRendering: function() {
     //
     //  },

     /**
      * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
      * @memberOf originacion.Documents
      */
     //  onExit: function() {
     //
     //  }
     //  
     backToTiles: function() {
         window.history.go(-1);
     }

 });
