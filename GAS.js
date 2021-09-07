
//Estas dos funciones van en nuestra API de Google Apps Script
//doGet es solo para que retorne una visual donde postear el JSON de recepción
function doGet(respuesta) { }

//doPost es para recibir el JSON
function doPost(respuesta) {

  //Aqui va el libro y la tab donde se guarda la info, cambiar a consideración en caso de no lograr transferencia de ownership
  var book = SpreadsheetApp.openById('1eFRePeDf8UiLBgZ9jYEEQ38cVcHAmFBU0875EML3koE');
  var sheet = book.getSheetByName('DataBase');

  console.log("recibiendo respuesta");

  try {
    //nuestro JSON llega en un objeto que tenemos que parsear y sacarlo con la ruta .postData.contents
    var registros = JSON.parse(respuesta.postData.contents);

    var table = [];

    //Este paso es para convertir el JSON en Array ya que Array es más fácil de manejar en Sheets y más rápido que en JSON
    for (registro of registros) {

      sheet.getRange("A2").setValue("hasta aquí voy bien - entrando al registro");

      var creationDate = parseDate(registro.creation_date);
      var requesterDate = parseDate(registro.requester_update_date);

      sheet.getRange("A2").setValue("hasta aquí voy bien - actualizando fecha");

      var row = [registro.report_type_subcategory,
      registro.ticket_id,
      registro.subject,
      registro.status,
        creationDate,
        requesterDate
      ]

      table.push(row);
    }

    //Aquí dejamos como valores en el Sheets el Array que vino del JSON
    //más adelante si lo desean para optimizar pueden hacer que index.js arroje directamente un array dentro del JSON que va al POST
    sheet.getRange("A2").setValue("hasta aquí voy bien - tabla creada");

    sheet.getRange(2, 1, sheet.getMaxRows()-1, sheet.getMaxColumns()).clearContent();
    sheet.getRange("A2").setValue("hasta aquí voy bien - info borrada");
    sheet.getRange(2, 1, table.length, table[0].length).setValues(table);

  } catch (err) {
    var book = SpreadsheetApp.openById('1eFRePeDf8UiLBgZ9jYEEQ38cVcHAmFBU0875EML3koE');
    var sheet = book.getSheetByName('DataBase');
    sheet.getRange("A3").setValue(err);
  }

}


function parseDate(fecha) {

//fecha = '2021-07-18T01:57:09Z';

  fecha = fecha.toString();

  fecha = new Date(fecha);

  fecha = Utilities.formatDate(fecha, 'GMT-5', 'MM/dd/yyyy HH:mm:ss');

  return fecha;

}





