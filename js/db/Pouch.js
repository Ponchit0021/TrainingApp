(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.db.Pouch");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.db.Pouch', {
        constructor: function(_dbName) {
            this.oDB = new PouchDB(_dbName, {auto_compaction : true});


        },
    });

    /**
     * Se debe automatizar esta función utilizando mockserver
     */
    sap.ui.db.Pouch.prototype.setSchema = function(_oSchema) {
        this.oDB.setSchema(_oSchema);

    };


    /**
     * [get - obtiene todos los objetos de tipo especificado]
     * @param  {[type]}   type        [tipo de entidad]
     * @return {[Promise]}
     */
    sap.ui.db.Pouch.prototype.get = function(type) {
        return this.oDB.rel.find(type);
        /*.then(function(result) {
                    console.log(result);
                    fn(result, oController);
                });*/
    };


    /**
     * [post - guarda un objeto de un tipo en particular]
     * @param  {[type]}   type        [tipo de entidad]
     * @param  {[type]}   data        [objeto con sus respectivas propiedades]
     * @return {[Promise]}
     */
    sap.ui.db.Pouch.prototype.post = function(type, data) {
        console.log("**** POUCH - POST ****");
        return this.oDB.rel.save(type, data);

        /*.then(function(result) {
            console.log(result);
            fn(result, oController);
        }).catch(function(err) {
            console.log(err);
        });*/
    };
    /**
     * [delete - elimina el objeto especificado]
     * @param  {[type]} type [tipo de entidad]
     * @param  {[type]} id   [id del objeto]
     * @param  {[type]} rev  [revision del objeto]
     * @return {[Promise]}
     */
    sap.ui.db.Pouch.prototype.delete = function(type, id, rev) {
        console.log("**** POUCH - DELETE ****")
        return this.oDB.rel.del(type, {
            id: id,
            rev: rev
        });
    };
    /**
     * [getById - busca un objeto del tipo y id especificado]
     * @param  {[type]} type [tipo de entidad]
     * @param  {[type]} id   [id del objeto]
     * @return {[type]}      [description]
     * @return {[Promise]}
     */
    sap.ui.db.Pouch.prototype.getById = function(type, id) {
        //console.log("**** POUCH - GETBYID ****")
        //this.setSchema();
        return this.oDB.rel.find(type, id);
        /*.then(function(result) {
            console.log(result);
            //fn(result, oController);
        });
        */
    };

    /**
     * [getByProperty - realiza busqueda por la(s) propiedad(es) definidas en el filtro]
     * @param  {[type]} _indexes [lista de propiedades de busqueda]
     * @param  {[type]} _filters [lista de filtros aplicados a las propiedades]
     * @return {[type]}          [resultado de la busqueda]
     */
    sap.ui.db.Pouch.prototype.getByProperty = function(_indexes, _filters) {
        PouchDB.debug.enable('pouchdb:find');
        var oController = this;
        return this.oDB.createIndex({
                index: {
                    fields: _indexes
                }
            })
            .catch(log)
            .then(log)
            .then(function() {
                return oController.oDB.find({
                        selector: _filters
                    })
                    .then();
            });

        function log(response) {
            console.log(response);
            return response;
        }
    };


    /**
     * [update - actualiza las propiedades de un objeto]
     * @param  {[type]} type [tipo de entidad]
     * @param  {[type]} id   [id del objeto]
     * @param  {[type]} rev  [revision del objeto]
     * @return {[type]}      [NOTA: Falta probar al actualizar]
     */
    sap.ui.db.Pouch.prototype.update = function(type, id, data) {

        console.log("**** POUCH - UPDATE ****");

        return this.oDB.rel.find(type, id).then(
        
            function(type, data, result) {
               var TypeArraySet = result[type + "Set"];
                if (TypeArraySet) { /// Verificar si "type"Set existe, p ej: result.CustomerSet

                    if (TypeArraySet.length > 0) { /// Verificar que tenga registros
                        /// Si tiene registros proceder a hacer el update
                        data.id = TypeArraySet[0].id;
                        data.rev = TypeArraySet[0].rev;
                        return this.oDB.rel.save(type, data);
                    }
                };
                return new Promise(function(resolve) {
                    resolve("No se encontraron datos para actualizar");
                });
            }.bind(this, type, data)
        );


    };

})();
