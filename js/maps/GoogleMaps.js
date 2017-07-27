(function() {
    "use strict";
    jQuery.sap.declare("sap.ui.mw.GoogleMaps");
    jQuery.sap.require("sap.ui.base.Object");

    sap.ui.base.Object.extend('sap.ui.mw.GoogleMaps', {});

    //Atributos de la clase
    sap.ui.mw.GoogleMaps.prototype.idContentMap = "";
    sap.ui.mw.GoogleMaps.prototype.zipCode = "";
    sap.ui.mw.GoogleMaps.prototype.country = "";
    sap.ui.mw.GoogleMaps.prototype.latitude = "";
    sap.ui.mw.GoogleMaps.prototype.longitude = "";
    sap.ui.mw.GoogleMaps.prototype.geocoder = "";
    sap.ui.mw.GoogleMaps.prototype.map = "";
    sap.ui.mw.GoogleMaps.prototype.markers = [];
    sap.ui.mw.GoogleMaps.prototype.status = "";
    //Metodos de la clase
    sap.ui.mw.GoogleMaps.prototype.initializeMaps = function() {
        var currentThis;

        if (typeof google === 'undefined') {
            sap.m.MessageToast.show("Sin conexión");
        } else {
            var mapCanvas, mapOptions;

            mapCanvas = document.getElementById(this.idContentMap);
            mapOptions = {
                zoom: 4,
                center: new google.maps.LatLng(19.470837, -99.122776),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            //this.markers = ["initialize"];
            this.geocoder = new google.maps.Geocoder();
            this.map = new google.maps.Map(mapCanvas, mapOptions);

            currentThis = this;
            this.map.addListener('click', function(e) {
                                var i, arrayLength;
                                //Borrar Marcador anterior
                                arrayLength = currentThis.markers.length;
                                for (i = 0; i < arrayLength; i++) {

                                    currentThis.markers[i].setMap(null);
                                }

                                //Posicion de marcador nuevo
                                var marker = new google.maps.Marker({
                                    position: e.latLng,
                                    map: currentThis.map
                                });
                                currentThis.map.panTo(e.latLng);
                                currentThis.markers.push(marker);

                                currentThis.latitude = e.latLng.lat();
                                currentThis.longitude = e.latLng.lng();
                            }
            );

            this.geocoder.geocode({
                componentRestrictions: {
                    country: 'MX',
                    postalCode: this.zipCode
                }
            }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {

                    currentThis.map.setCenter(results[0].geometry.location);
                    currentThis.map.setZoom(16);

                    var marker = new google.maps.Marker({
                        map: currentThis.map,
                        position: results[0].geometry.location
                    });

                    currentThis.markers.push(marker);

                    currentThis.status = true;

                } else {
                    sap.m.MessageToast.show("No se encontró código postal");
                    //window.alert('Geocode was not successful for the following reason: ' + status);
                    currentThis.status = false;
                }
            });

        }
    };
})();
