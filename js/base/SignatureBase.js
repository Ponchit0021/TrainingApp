/*---------------------------------------------------------------------*
 * Project        : Compartamos - AO
 * Created by     : Diego Valencia
 * Creation date  : 15/12/2015
 * Description    : Modulo para digitalizar firma
 * Name           : SignatureBase
 *----------------------------------------------------------------------*/
(function() {
  "use strict";
  jQuery.sap.declare("sap.ui.mw.SignatureBase");
  jQuery.sap.require("sap.ui.base.Object");

  sap.ui.base.Object.extend('sap.ui.mw.SignatureBase', {});
  // Atributos de la clase
  sap.ui.mw.SignatureBase.prototype._id = "";
  sap.ui.mw.SignatureBase.prototype.canvas = "";
  sap.ui.mw.SignatureBase.prototype.context = "";
  sap.ui.mw.SignatureBase.prototype.disableSave = "";
  sap.ui.mw.SignatureBase.prototype.pixels = "";
  sap.ui.mw.SignatureBase.prototype.cpixels = "";
  sap.ui.mw.SignatureBase.prototype.xyLast = "";
  sap.ui.mw.SignatureBase.prototype.xyAddLast = "";
  sap.ui.mw.SignatureBase.prototype.calculate = "";
  sap.ui.mw.SignatureBase.prototype.empty = "";
  var contadorPrueba = 0;

  sap.ui.mw.SignatureBase.prototype.signatureCapture = function() {
    contadorPrueba++;
   
    // Variables
    var currentThis;
    currentThis = this;

    getMeasures();

    function getMeasures() {
      console.log("tomando las medias");
      currentThis.canvas = document.getElementById(currentThis._id);
      currentThis.context = currentThis.canvas.getContext("2d");
      currentThis.disableSave = true;
      currentThis.pixels = [];
      currentThis.cpixels = [];
      currentThis.xyLast = {};
      currentThis.xyAddLast = {};
      currentThis.calculate = false;

      // Canvas size
      currentThis.canvas.width = document.body.clientWidth;
      currentThis.canvas.height = document.body.clientHeight;
      currentThis.context.fillStyle = "#fff";
     
      currentThis.context.lineWidth = 1.0;
      currentThis.context.lineCap = "round";
      currentThis.context.fillRect(0, 0, currentThis.canvas.width,
                                   currentThis.canvas.height);
    }
    // { //_canvas
    function remove_event_listeners() {

      currentThis.canvas.removeEventListener('mousemove', on_mousemove, false);
      currentThis.canvas.removeEventListener('mouseup', on_mouseup, false);
      currentThis.canvas.removeEventListener('touchmove', on_mousemove, false);
      currentThis.canvas.removeEventListener('touchend', on_mouseup, false);

      document.body.removeEventListener('mouseup', on_mouseup, false);
      document.body.removeEventListener('touchend', on_mouseup, false);
    }

    function get_coords(e) {
      var x, y;
      var bbox = currentThis.canvas.getBoundingClientRect();

      if (e.changedTouches && e.changedTouches[0]) {
        var clientx = e.changedTouches[0].clientX;
        var clienty = e.changedTouches[0].clientY;

        x = clientx * (currentThis.canvas.width / (bbox.width + bbox.left));
        y = clienty * (currentThis.canvas.height / (bbox.height + bbox.top));
       
       
      }

   

      return {x : x, y : y};
    }

    function on_mousedown(e) {
     
      e.preventDefault();
      e.stopPropagation();

      currentThis.canvas.addEventListener('mouseup', on_mouseup, false);
      currentThis.canvas.addEventListener('mousemove', on_mousemove, false);
      currentThis.canvas.addEventListener('touchend', on_mouseup, false);
      currentThis.canvas.addEventListener('touchmove', on_mousemove, false);
      document.body.addEventListener('mouseup', on_mouseup, false);
      document.body.addEventListener('touchend', on_mouseup, false);

      currentThis.empty = false;
      var xy = get_coords(e);
      currentThis.context.beginPath();
      currentThis.pixels.push('moveStart');
      currentThis.context.moveTo(xy.x, xy.y);
      currentThis.pixels.push(xy.x, xy.y);
      currentThis.xyLast = xy;
    }

    function on_mousemove(e, finish) {
      e.preventDefault();
      e.stopPropagation();

      var xy = get_coords(e);
      var xyAdd = {
        x : (currentThis.xyLast.x + xy.x) / 2,
        y : (currentThis.xyLast.y + xy.y) / 2
      };

      if (currentThis.calculate) {
        var xLast =
            (currentThis.xyAddLast.x + currentThis.xyLast.x + xyAdd.x) / 3;
        var yLast =
            (currentThis.xyAddLast.y + currentThis.xyLast.y + xyAdd.y) / 3;
        currentThis.pixels.push(xLast, yLast);
      } else {
        currentThis.calculate = true;
      }

      currentThis.context.quadraticCurveTo(
          currentThis.xyLast.x, currentThis.xyLast.y, xyAdd.x, xyAdd.y);
      currentThis.pixels.push(xyAdd.x, xyAdd.y);
      currentThis.context.stroke();
      currentThis.context.beginPath();
      currentThis.context.moveTo(xyAdd.x, xyAdd.y);
      currentThis.xyAddLast = xyAdd;
      currentThis.xyLast = xy;
    }

    function on_mouseup(e) {
      remove_event_listeners();
      currentThis.disableSave = false;
      currentThis.context.stroke();
      currentThis.pixels.push('e');
      currentThis.calculate = false;
    }

    this.canvas.addEventListener('touchstart', on_mousedown, false);
    this.canvas.addEventListener('mousedown', on_mousedown, false);
    screen.lockOrientation('portrait');

  };
  sap.ui.mw.SignatureBase.prototype.signatureClear = function() {
    var canvas = document.getElementById(this._id);
    var context = this.canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };
  sap.ui.mw.SignatureBase.prototype.signatureSave = function() {
    // save canvas image as data url (png format by default)
    var canvas = document.getElementById(this._id);
   
    var base64;

    base64 =
        [ canvas.toDataURL(), canvas.toDataURL("image/jpeg", 0.8), this._id ];

    // Regresa arreglo con imagen en PNG y JPEG
    return base64;
  };
})();
