sap.ui.jsfragment("js.fragments.signature.PreventionNotice", {

    createContent: function(oController) {
        "use strict";
        jQuery.sap.require("js.base.InputBase", "js.base.DisplayBase", "js.base.LayoutBase", "js.base.ActionBase", "js.base.PopupBase");
        var oDialog, oText;
        var oInputBase = new sap.ui.mw.InputBase(),
            oLayoutBase = new sap.ui.mw.LayoutBase(),
            oActionBase = new sap.ui.mw.ActionBase(),
            oDisplayBase = new sap.ui.mw.DisplayBase();

        oDialog = new sap.ui.mw.PopupBase().createDialog("idDialogPreventionNotice", "Aviso de Privacidad", "Message", "sap-icon://message-information");

        //formulario
        // oText = oDisplayBase.createText("", "Declara el solicitante bajo protesta de decir verdad que:\n\n - Los datos capturados en la presente solicitud son correctos y se obtuvieron mediante entrevista personal con el Solicitante, autorizando a Banco Compartamos, S.A. Institución de Banca Múltiple, para que los compruebe a su entera satisfacción. \n\n  - Es la persona que se beneficiará en forma directa con los recursos que llegue a obtener en caso de que sea otorgado el Crédito que solicita, toda vez que actúa a nombre y por cuenta propia y no a nombre o por cuenta de un tercero.\n\n - Es de su conocimiento que proporcionar datos y documentos falsos, así como actuar a nombre de terceros sin estar facultado para ello constituye un delito.\n\n - Los recursos del Crédito solicitados en caso de que este sea autorizado, los destinará para fines lícitos. ");

        oText = oDisplayBase.createText("", "Banco Compartamos Institución de Banca Múltiple, con domicilio en Insurgentes Sur, Núm. 1458 piso 11, Colonia Actipan, Delegación Benito Juárez, C.P. 03230, México, Ciudad de México., utilizará sus datos personales y financieros recabados para: Identificarlo como prospecto y prestarle los servicios que hayan sido solicitados. Para mayor información acerca del tratamiento y de los derechos que puede hacer valer, usted puede acceder al Aviso de Privacidad Integral para Prospecto a Cliente a través de la siguiente página:\n\n http://www.compartamos.com.mx");

        oDialog.addContent(oText);

        //botones
        oDialog.addButton(oActionBase.createButton("btnAceptarPrivacyNotice", "Aceptar", "Emphasized", "", oController.closePreventionNoticeDialog, oController));

        return oDialog;
    }

});
