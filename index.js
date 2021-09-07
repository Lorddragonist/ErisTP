/*Eris descarga la data de Queues abiertos desde Zendesk, 
este RPA maneja Puppeteer como navegador
--path  solo se requiere si descargamos la info en csv
--chalk es para que la consola tenga color y personalización de comunicación con el usuario
--fs y stringify solo para uso con csv, en este momento solo tenemos la aplicación subiendo la data a Google API
*/

//constantes de modulos que se usan

const puppeteer = require("puppeteer");
const path = require("path");
const inquirer = require("inquirer");
const chalk = require("chalk");
const fs = require("fs");
const csvStringify = require("csv-stringify");

const app = {
  name: "Eris",
  version: "1.0.0",
};

/*
╔╗╔╗╔╗░░╔╗░░░░░░░░░░░░░
║║║║║║░░║║░░░░░░░░░░░░░
║║║║║╠══╣║╔══╦══╦╗╔╦══╗
║╚╝╚╝║║═╣║║╔═╣╔╗║╚╝║║═╣
╚╗╔╗╔╣║═╣╚╣╚═╣╚╝║║║║║═╣
░╚╝╚╝╚══╩═╩══╩══╩╩╩╩══╝
*/

//Esta es la función principal que manda llamar las demas funciones sincronas y asincornas

(async () => {

  try {
    console.log(chalk.blue("╔╗╔╗╔╗░░╔╗░░░░░░░░░░░░░░╔╗░░░░╔═══╗░░░░░░"));
    console.log(chalk.blue("║║║║║║░░║║░░░░░░░░░░░░░╔╝╚╗░░░║╔══╝░░░░░░"));
    console.log(chalk.blue("║║║║║╠══╣║╔══╦══╦╗╔╦══╗╚╗╔╬══╗║╚══╦═╦╦══╗"));
    console.log(chalk.blue("║╚╝╚╝║║═╣║║╔═╣╔╗║╚╝║║═╣░║║║╔╗║║╔══╣╔╬╣══╣"));
    console.log(chalk.blue("╚╗╔╗╔╣║═╣╚╣╚═╣╚╝║║║║║═╣░║╚╣╚╝║║╚══╣║║╠══║"));
    console.log(chalk.blue("░╚╝╚╝╚══╩═╩══╩══╩╩╩╩══╝░╚═╩══╝╚═══╩╝╚╩══╝"));
    
    //starloading es para mostrar en la consola lo que está ejecutando
    startLoading("Opening Chromium");

    //En este paso lo que se pretende es reemplazar la ruta de puppeter, es decir si se está ejecutando desde código o desde ejecutable
    //Importante tener el modulo de Chromium-Puppeter en la carpeta donde este el .exe
    let chromiumExecutablePath = puppeteer.executablePath();
    if (typeof process.pkg !== "undefined") {
      chromiumExecutablePath = puppeteer
        .executablePath()
        .replace(
          /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
          path.join(path.dirname(process.execPath), "chromium")
        );
    }

    //Este paso abre nuestro navegador, en headless: true es para que no se muestre el navegador y false para mostrarlo
    browser = await puppeteer.launch({
      headless: false,
      executablePath: chromiumExecutablePath,
      args: ["--use-fake-ui-for-media-stream"],
      slowMo: 0,
    });

    //Aquí declaramos la página donde vamos a ejecutar las acciones
    page = (await browser.pages())[0];
    endLoading();


    //Esta variable-función abe la función que opera la apertura y loggeo en Zendesk
    var logZendesk = await openZendesk();

    //Este bucle es para descargar la información sin cierre indefinido, es por eso que el while es true, para que siempre esté ejecutandose
    while (true) {
      try {
        //Limpiar consola
        console.clear();

        //Esta variable-función llama la función que descarga el JSON y lo guarda como variable
        var dataTable = await downloadTable();

        //En este bucle, si la data sale vacia, llama de nuevo la función
        while (dataTable == "") {
          if (dataTable == "") {
            var dataTable = await downloadTable();
          } else {
            break;
          }
        }
        await reloading();
        //En esta validación llamamos la funcion de subir el JSON a drive
        var converting = await toDrive(dataTable);
        if (converting != true) {
          var converting = await toDrive(dataTable);
        }
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
})();

/*
╔═══╗░░░░░░░░░╔════╗░░░░░░░╔╗░░░░░╔╗░░
║╔═╗║░░░░░░░░░╚══╗═║░░░░░░░║║░░░░░║║░░
║║░║╠══╦══╦═╗░░░╔╝╔╬══╦═╗╔═╝╠══╦══╣║╔╗
║║░║║╔╗║║═╣╔╗╗░╔╝╔╝║║═╣╔╗╣╔╗║║═╣══╣╚╝╝
║╚═╝║╚╝║║═╣║║║╔╝═╚═╣║═╣║║║╚╝║║═╬══║╔╗╗
╚═══╣╔═╩══╩╝╚╝╚════╩══╩╝╚╩══╩══╩══╩╝╚╝
░░░░║║░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░╚╝░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
*/

//Funcion que abre Zendesk para el loggeo de credenciales
async function openZendesk() {
  startLoading("Log area");

  //Te lleva a la pagina de discord que es la que abre Zendesk
  await page.goto("https://discord.com/login", {
    waitUntil: "networkidle0",
  });

  endLoading();

  //Pide al usuario las cedenciales y las almacena como variable
  console.log("Discord Authentication...");
  let credentialsDiscord = await inquirer.prompt([
    {
      name: "username",
      message: "Username:",
    },
    {
      type: "password",
      name: "password",
      message: "Password:",
      mask: "•",
    },
  ]);

 
  //Injecta JavaScript para asignar un id y permitir que Puppeteer escriba sobre esos inputs
  await page.evaluate(() => {
    var inputs = document.getElementsByTagName("input");
    inputs[0].id = "username";
    inputs[1].id = "password";
    var goButton = document.getElementsByTagName("button");
    goButton[1].id = "button";
    return true;
  });

  //Escribe el user y le agrega el dominio de teleperformance.com, importante que no ingrese el usuario con el dominio, ya que aquí lo agrega
  await page.type(
    "#username",
    credentialsDiscord.username + "@teleperformance.com"
  );

  //Aquí va a escribir la contraseña
  await page.type("#password", credentialsDiscord.password);

  //Aquí hace click en el boton de ingresar
  await page.click("#button");

  //Esperamos a que cargue la página
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  //Redirigimos la pagina a Zendesk
  startLoading("Opening Hammer&Chisel");
  //go to the Zendesk page
  await page.goto("https://hammerandchisel.zendesk.com/agent/dashboard", {
    waitUntil: "networkidle0",
  });

  await page.waitForNavigation();

  endLoading();
  //Retornamos True para avisar a la variable que el proceso funcionó
  return true;
}

/*
╔═══╗░░░░░░░░░░╔╗░░░░░░░░╔╗░╔╗░░░╔╗░╔╗░░░░
╚╗╔╗║░░░░░░░░░░║║░░░░░░░░║║╔╝╚╗░░║║░║║░░░░
░║║║╠══╦╗╔╗╔╦═╗║║╔══╦══╦═╝║╚╗╔╬══╣╚═╣║╔══╗
░║║║║╔╗║╚╝╚╝║╔╗╣║║╔╗║╔╗║╔╗║░║║║╔╗║╔╗║║║║═╣
╔╝╚╝║╚╝╠╗╔╗╔╣║║║╚╣╚╝║╔╗║╚╝║░║╚╣╔╗║╚╝║╚╣║═╣
╚═══╩══╝╚╝╚╝╚╝╚╩═╩══╩╝╚╩══╝░╚═╩╝╚╩══╩═╩══╝
*/

//Esta función es la encargada de descargar todo lo que está en Zendesk dentro de las vistas copia
async function downloadTable() {
  startLoading("Downloading data");
  try {

    //inyectamos este código en JavaScript para descargar la data por medio de una variable retornada por consola
    let dataTable = await page.evaluate(async () => {
      console.clear();
      //La variable ids son los id de las vistas ya creadas en Zendesk como copias de las que deja el cliente de esta manera tenemos algunas columnas más añadidas
      // en esta tenemos el nombre de la vista y el id de esta
      var ids = [
        { name: `Cybercrime`, id: 1500023369562 },
        {
          name: `IAR Underage User Reports (COPPA)`,
          id: 1500023370922,
        },
        { name: `Harassment`, id: 1500023371922 },
        { name: `IP Address Posted`, id: 1500023041561 },
        { name: `IAR Dox`, id: 1500023372402 },
        { name: `Escalations from Abuse`, id: 1500023373242 },
        { name: `Unauthorized Streams`, id: 1500027354502 },
        { name: `DMCA / Copyright`, id: 1500027355542 },
        //{ name: `[TP][English] New General Queue [Eris]`, id: 1900001394905 }, esta es la vista de CX pero al tener más de 2K no me ha funcionado :'(
      ];

      var table = [];

      console.log("fetching...");
      //Este bucle es para recoger cada pagina de la tabla que arroja la vista 
      //Tenemos la variable pagina = 1 para que al ser el len mayor a 1k realice la evaluacion en una pagina siguiente hasta que sea menor a 1k
      //Es decir para que pase pagina por pagina recolectando toda la información, no se porque despues de 2k el proceso muere
      for (var queueObj of ids) {
        var mybucle = true;
        while (mybucle) {
          var pagina = 1;

          //Este es el fetch que extrae la data
          var data = await fetch(
            "https://hammerandchisel.zendesk.com/api/v2/views/" +
              queueObj.id +
              "/execute.json?per_page=1000&page=" +
              pagina +
              "&sort_by=created&sort_order=asc&group_by=+&include=via_id&exclude=sla_next_breach_at%2Clast_comment",
            {
              headers: {
                accept: "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en,es-ES;q=0.9,es;q=0.8",
                "content-type": "application/json",
                "if-none-match": 'W/"07020dd5a7fdbc2517140292eb2b12d3"',
                "sec-ch-ua":
                  '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-csrf-token": "YAOAQ5L83qxZjXReN+7ssSQlp8yd3b1n0MtU3iV/qEI=",
                "x-requested-with": "XMLHttpRequest",
                "x-zendesk-lotus-feature": "Ember",
                "x-zendesk-lotus-initial-user-id": "1504925951382",
                "x-zendesk-lotus-initial-user-role": "agent",
                "x-zendesk-lotus-tab-id":
                  "cc8f87f5-6834-44a8-b4a5-4e26b1ddf7c0",
                "x-zendesk-lotus-uuid": "389a0c9d-154a-4294-8173-67918972f132",
                "x-zendesk-lotus-version": "10750",
                "x-zendesk-radar-socket": "byUUSNItcDE9YaN3ANrV",
                "x-zendesk-radar-status": "activated",
              },
              referrer:
                "https://hammerandchisel.zendesk.com/agent/filters/" +
                queueObj.id,
              referrerPolicy: "strict-origin-when-cross-origin",
              body: null,
              method: "GET",
              mode: "cors",
              credentials: "include",
            }
          );

          data = await data.json();
          console.log(queueObj.name);
          console.log(data);
          //Aquí le damos la estructura que buscamos a nuestro objeto el cual retornaremos mas adelante
          for (var i = 0; i < data.rows.length; i++) {
            var row = {
              //Columnas de la data recolectada, tener cuidado con [i][360027588991] que puede variar en algun momento, desconocemos porque este número
              report_type_subcategory: data.rows[i][360027588991],
              ticket_id: data.rows[i].ticket.id,
              subject: data.rows[i].ticket.subject,
              status: data.rows[i].ticket.status,
              creation_date: data.rows[i].created,
              requester_update_date: data.rows[i].requester_updated_at,
              fromQueue: queueObj.name,
            };

            table.push(row);
          }

          console.log("la tabla es de largo : " + data.rows.length);
          //valida si mi info es menor a 1k para ver si es necesario pasar la pagina y seguir extrayendo data
          if (data.rows.length <= 1000) {
            mybucle = false;
          } else {
            pagina++;
          }
        }
      }

      console.log(table);
      return table;
    });

    return dataTable;
  } catch (e) {
    console.log(e);
    return "";
  }
  endLoading();
}

/**
╔════╗░░╔═══╗░░░░░░
║╔╗╔╗║░░║╔═╗║░░░░░░
╚╝║║╠╩═╗║║░╚╬══╦╗╔╗
░░║║║╔╗║║║░╔╣══╣╚╝║
░░║║║╚╝║║╚═╝╠══╠╗╔╝
░░╚╝╚══╝╚═══╩══╝╚╝░
 */
//Esta funcion es si queremos pasar la data a Csv, actualmente solo la tengo por si queremos hacer ese cambio
/*
async function toCsv(dataTable) {
  csvStringify(
    dataTable,
    {
      header: true,
    },
    function (err, output) {
      //______________\\10.151.230.78\Dropbox\New Economy\Discord\Otros\WorkForce\tbDiscordRaw_Queue13160
      fs.writeFile(
        "\\\\10.151.230.78\\Dropbox\\New Economy\\Discord\\Otros\\WorkForce\\tbDiscordRaw_Queue13160\\dataTable.csv",
        output,
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
    }
  );
}

*/

//En esta funcion enviamos nuestro JSON a Drive.
async function toDrive(dataTable) {
  startLoading("Uploading to Drive");
  try {
    dataTable = JSON.stringify(dataTable);
    //Aqui dirigimos la pagina a la API
    await page.goto(
      "https://script.google.com/macros/s/AKfycbwx91vCxtQAAuxtohhmpf9Wu_R19jOzj09cPgMgtNMKmXipgKtqvv4qGhY_kQ_FJp2cuA/exec",
      { waitUntil: "networkidle0" }
    );
    //Esta variable hace la evaluación de subida del JSON por medio de POST
    let upload = await page.evaluate(async (dataTable) => {
      await fetch(
        "https://script.google.com/macros/s/AKfycbwx91vCxtQAAuxtohhmpf9Wu_R19jOzj09cPgMgtNMKmXipgKtqvv4qGhY_kQ_FJp2cuA/exec",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Contect-Type": "application/json",
          },
          body: dataTable,
        }
      );
    }, dataTable);

    //nos devolvemos a Zendesk para seguir con nuestro bucle de descargas
    await page.goto("https://hammerandchisel.zendesk.com/agent/dashboard", {
      waitUntil: "networkidle2",
    });
    return true;
    endLoading();
  } catch (e) {
    console.log(e);
    console.log("Trying Again");
    return false;
  }
}

/*
╔═══╗░░░░░░░░░╔╗░░░░
║╔═╗║░░░░░░░░╔╝╚╗░░░
║╚══╦═╗╔╦══╦═╩╗╔╬══╗
╚══╗║╔╗╬╣╔╗║║═╣║║══╣
║╚═╝║║║║║╚╝║║═╣╚╬══║
╚═══╩╝╚╩╣╔═╩══╩═╩══╝
░░░░░░░░║║░░░░░░░░░░
░░░░░░░░╚╝░░░░░░░░░░
*/

//Esta es la parte de snipets como funciones sincronas para darle mejor visual a la consola

function startLoading(message = "") {
  loadingStartTime = new Date();
  loadingMessage = message;
  const frames = [
    "[>         ] ",
    "[ >        ] ",
    "[  >       ] ",
    "[   >      ] ",
    "[    >     ] ",
    "[     >    ] ",
    "[      >   ] ",
    "[       >  ] ",
    "[        > ] ",
    "[         >] ",
  ];
  let current = 0;
  loadingInterval = setInterval(() => {
    let now = new Date();
    let duration = new Date(now.getTime() - loadingStartTime.getTime());
    process.stdout.write(
      "\r" +
        chalk.blue(
          frames[current++] + loadingMessage + " " + formatDuration(duration)
        )
    );
    current %= frames.length;
  }, 77);
}

function endLoading() {
  let endTime = new Date();
  let duration = new Date(endTime.getTime() - loadingStartTime.getTime());
  clearInterval(loadingInterval);
  process.stdout.write(
    "\r" +
      chalk.blue(
        "[   Done!  ] " + loadingMessage + " " + formatDuration(duration)
      )
  );
  console.log();
}

let countdownInterval;

function startCountdown(nextTime) {
  countdownInterval = setInterval(() => {
    process.stdout.write(
      "\r" + chalk.blue("Next update in " + formatCountdown(nextTime))
    );
  }, 1000);
}

function formatDuration(date) {
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let millis = date.getMilliseconds();

  if (minutes == 0 && seconds == 0) {
    return "0." + len3(millis);
  }
  if (minutes == 0) {
    return seconds + "." + len3(millis);
  }
  return minutes + ":" + len2(seconds) + "." + len3(millis);
}

function formatCountdown(next) {
  let now = new Date();
  let date = new Date(next.getTime() - now.getTime());
  let minutes = date.getMinutes() + "m";
  let seconds = date.getSeconds() + "s";

  if (minutes == "0m") {
    return seconds + "     ";
  }
  return minutes + " " + seconds + "  ";
}

function len2(value) {
  return value < 10 ? "0" + value : value;
}

function len3(value) {
  return value < 10 ? "00" + value : value < 100 ? "0" + value : value;
}

async function reloading() {
  page.reload();
}
