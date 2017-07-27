(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.serialize.General");
    jQuery.sap.require("sap.ui.base.Object");
    jQuery.sap.require("js.db.Pouch");
    jQuery.sap.require("js.helper.Dictionary");
    jQuery.sap.require("js.helper.Entity");
    jQuery.sap.require("js.base.DisplayBase");
    jQuery.sap.require("js.db.Pouch");

    sap.ui.base.Object.extend('sap.ui.serialize.General', {
        constructor: function(_dataDB) {
            var oSchemaDB;

            jQuery.sap.require("js.helper.Schema");

            oSchemaDB = new sap.ui.helper.Schema();
            this.dataDB = new sap.ui.db.Pouch(_dataDB);
            this.dataDB.setSchema(oSchemaDB.getDataDBSchema());
        }
    });

    /**
     * [upsertCustomer Validación del solicitante en serialize, si existe lo actualiza, si no lo inserta]
     * @param  {[JSON]} _oCustomer  [Solicitante en formato json]
     * @return {[NA]}               [NA]
     */
    sap.ui.serialize.General.prototype.getEntityDetail = function(_entity, _id) {
        var current = this;
        return new Promise(function(resolve, reject) {
            current.searchInPouch(_entity, _id).then(
                function(result) {
                    current.searchInLocalStore(_entity, _id, result)
                        .then(resolve).catch(reject)
                })
        });

    };

    sap.ui.serialize.General.prototype.searchInLocalStore = function(_entity, _id, _pouchCollection) {

        var aPouchEntityCollection;

        //aPouchEntityCollection = eval("_pouchCollection." + _entity.pouch.entitySet);
        return new Promise(function(resolve, reject) {
            try {
                if (_pouchCollection.hasOwnProperty("results")) {
                    if (_pouchCollection.results.length > 0) {
                        resolve(_pouchCollection);
                    }
                }
                sap.ui.getCore().AppContext.myRest.read(_entity.odata.name, _entity.odata.get.filterDetail, true).then(function(oModel) {
                    resolve(oModel);
                });


            } catch (ex) {
                reject("error");
            }
        });


    }

    sap.ui.serialize.General.prototype.searchInPouch = function(_entity, _id) {
        return new Promise(function(resolve, reject) {
            try {
                this.dataDB.getById(_entity.pouch.entityName, _id).then(function(_entity, _id, resp) {
                    if (resp.hasOwnProperty(_entity.pouch.entitySet)) {


                        var oEntitySetResults;
                        var sProperty;
                        oEntitySetResults = {};

                        for (sProperty in resp) {
                            if (resp.hasOwnProperty(sProperty)) {
                                   oEntitySetResults[sProperty] = resp[sProperty];
                            }
                        }

                        oEntitySetResults.results = resp[_entity.pouch.entitySet] ;
                        resolve(oEntitySetResults);


                    }


                }.bind(this, _entity, _id));
            } catch (e) {
                reject(e);
            }
        }.bind(this));
    }

    /**
     * [getEmptyModel Obtener un modelo con los atributos vacíos de cierta entidad]
     * @param  {[String]} _oType [Entidad deseada de odata]
     * @return {[resolve]}        [Modelo vacío]
     */

    sap.ui.serialize.General.prototype.getEmptyModel = function(_oType) {
        var aStructureModel, oModel, entity;
        entity = new sap.ui.helper.Entity();

        aStructureModel = eval("entity.get" + _oType+"()");

        return new Promise(function(resolve, reject) {
            try {
                oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(aStructureModel);
                resolve(oModel);
            } catch (ex) {
                reject(ex);
            }


        })

    }


})();
