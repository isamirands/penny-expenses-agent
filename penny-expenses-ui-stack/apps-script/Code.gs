/**
 * Google Apps Script — backend para "Pastel Finance".
 *
 * PASOS
 * 1. Crea una hoja de cálculo en Google Sheets con una pestaña llamada "Expenses".
 * 2. Fila 1 (encabezados, en este orden):
 *    ID | User ID | Fecha | Método de pago | ID Categoría | Moneda | Descripción |
 *    Monto | Reembolsable | Created At | Updated At | Monto PEN
 *    Las pestañas "Presupuestos", "Categorias" e "IngresosFijos" se crean y
 *    siembran solas la primera vez que se usan (ver presupuestosSheet(),
 *    categoriasSheet(), ingresosFijosSheet()).
 * 3. Extensiones > Apps Script, pega este archivo completo.
 * 4. Cambia SHARED_TOKEN por un texto secreto largo y aleatorio.
 * 5. Implementar > Nueva implementación > Aplicación web:
 *      Ejecutar como: Yo
 *      Quién tiene acceso: Cualquier usuario
 * 6. Copia la URL /exec y guárdala junto con el token en la app.
 *
 * MIGRACIÓN DE ESQUEMA (una sola vez, sobre datos existentes)
 * Si ya tenías una pestaña "Expenses" con el esquema viejo (Categoría en texto
 * libre, Monto Reembolsable numérico, sin Monto PEN), duplica el spreadsheet
 * como respaldo y corre migrateToBudgetSchema_v2() una vez desde el editor.
 */

var SHARED_TOKEN = "CAMBIA-ESTE-TOKEN";
var SHEET_NAME = "Expenses";
var PRESUPUESTOS_SHEET_NAME = "Presupuestos";
var CATEGORIAS_SHEET_NAME = "Categorias";
var INGRESOS_FIJOS_SHEET_NAME = "IngresosFijos";
var USD_TO_PEN_RATE = 3.4;

var EXPENSES_HEADERS = [
  "ID", "User ID", "Fecha", "Método de pago", "ID Categoría", "Moneda",
  "Descripción", "Monto", "Reembolsable", "Created At", "Updated At", "Monto PEN",
];

var PRESUPUESTOS_SEED = [
  ["GASTO_VARIABLE", "Gasto variable", 30],
  ["GASTO_FIJO", "Gasto fijo", 50],
  ["AHORRO_INVERSION", "Ahorro e inversión", 20],
];

var CATEGORIAS_SEED = [
  ["Ocio", "GASTO_VARIABLE"],
  ["Belleza", "GASTO_VARIABLE"],
  ["Comidas", "GASTO_VARIABLE"],
  ["Viajes", "GASTO_VARIABLE"],
  ["Compras", "GASTO_VARIABLE"],
  ["Salud", "GASTO_VARIABLE"],
  ["Regalos", "GASTO_VARIABLE"],
  ["Víveres", "GASTO_VARIABLE"],
  ["Otros", "GASTO_VARIABLE"],
  ["Transporte", "GASTO_FIJO"],
  ["Suscripciones", "GASTO_FIJO"],
  ["Junta", "GASTO_FIJO"],
  ["Menu", "GASTO_FIJO"],
  ["Cuenta de ahorros", "AHORRO_INVERSION"],
  ["Divisas", "AHORRO_INVERSION"],
  ["Wardaditos", "AHORRO_INVERSION"],
  ["S&P", "AHORRO_INVERSION"],
];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.token !== SHARED_TOKEN) {
      return json({ ok: false, code: "forbidden", error: "Token inválido." });
    }
    var userId = String(body.userId || "").toLowerCase().trim();
    if (!userId) return json({ ok: false, code: "forbidden", error: "Usuario requerido." });

    switch (body.action) {
      case "list":
        return json({ ok: true, data: listExpenses(userId) });
      case "create":
        return json(createExpense(userId, body.expense));
      case "update":
        return json(updateExpense(userId, body.id, body.expense));
      case "delete":
        return json(deleteExpense(userId, body.id));
      case "listPresupuestos":
        return json({ ok: true, data: listPresupuestos() });
      case "updatePresupuesto":
        return json(updatePresupuesto(body.id, body.porcentaje));
      case "listCategorias":
        return json({ ok: true, data: listCategorias() });
      case "listIngresosFijos":
        return json({ ok: true, data: listIngresosFijos() });
      case "createIngresoFijo":
        return json(createIngresoFijo(body.ingresoFijo));
      default:
        return json({ ok: false, code: "unknown", error: "Acción no soportada." });
    }
  } catch (err) {
    return json({ ok: false, code: "unknown", error: String(err) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function slugify(name) {
  var s = String(name).toUpperCase();
  s = s
    .replace(/[ÁÀÄÂ]/g, "A")
    .replace(/[ÉÈËÊ]/g, "E")
    .replace(/[ÍÌÏÎ]/g, "I")
    .replace(/[ÓÒÖÔ]/g, "O")
    .replace(/[ÚÙÜÛ]/g, "U")
    .replace(/Ñ/g, "N");
  return s.replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(EXPENSES_HEADERS);
  }
  return sh;
}

function presupuestosSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PRESUPUESTOS_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(PRESUPUESTOS_SHEET_NAME);
    sh.appendRow(["ID", "Nombre", "Porcentaje"]);
    PRESUPUESTOS_SEED.forEach(function (p) {
      sh.appendRow(p);
    });
  }
  return sh;
}

function categoriasSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CATEGORIAS_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CATEGORIAS_SHEET_NAME);
    sh.appendRow(["ID", "Nombre", "ID Presupuesto"]);
    CATEGORIAS_SEED.forEach(function (c) {
      sh.appendRow([slugify(c[0]), c[0], c[1]]);
    });
  }
  return sh;
}

function ingresosFijosSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(INGRESOS_FIJOS_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(INGRESOS_FIJOS_SHEET_NAME);
    sh.appendRow(["ID", "Nombre", "Monto"]);
  }
  return sh;
}

function iso(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return String(value).slice(0, 10);
}

function stamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

/** REGLA DE PERIODO: solo el mes calendario actual es editable. Se calcula dinámicamente. */
function isCurrentMonth(dateStr) {
  var parts = String(dateStr).slice(0, 10).split("-");
  var now = new Date();
  return Number(parts[0]) === now.getFullYear() && Number(parts[1]) === now.getMonth() + 1;
}

function computeMontoPen(amount, currency) {
  var amt = Number(amount) || 0;
  if (String(currency).toUpperCase() === "USD") return Math.round(amt * USD_TO_PEN_RATE * 100) / 100;
  return amt;
}

function categoriaExists(id) {
  var values = categoriasSheet().getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return true;
  }
  return false;
}

function rowToObject(row) {
  return {
    id: String(row[0]),
    userId: String(row[1]),
    date: iso(row[2]),
    paymentMethod: String(row[3]),
    categoriaId: String(row[4]),
    currency: String(row[5]),
    description: String(row[6]),
    amount: Number(row[7]) || 0,
    reembolsable: row[8] === true || String(row[8]).toUpperCase() === "TRUE",
    createdAt: String(row[9]),
    updatedAt: String(row[10]),
    montoPen: Number(row[11]) || 0,
  };
}

function listExpenses(userId) {
  var values = sheet().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    if (!values[i][0]) continue;
    if (String(values[i][1]).toLowerCase().trim() !== userId) continue; // filtro server-side
    out.push(rowToObject(values[i]));
  }
  return out;
}

function findRow(userId, id) {
  var values = sheet().getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      if (String(values[i][1]).toLowerCase().trim() !== userId) return { index: -2 };
      return { index: i + 1, row: values[i] };
    }
  }
  return { index: -1 };
}

function validate(exp) {
  if (!exp) return "Datos incompletos.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(exp.date))) return "Fecha inválida.";
  if (!exp.paymentMethod) return "Método de pago requerido.";
  if (!exp.categoriaId) return "Categoría requerida.";
  if (!categoriaExists(exp.categoriaId)) return "Categoría inválida.";
  if (!exp.currency) return "Moneda requerida.";
  if (!(Number(exp.amount) >= 0)) return "El monto debe ser mayor o igual a 0.";
  if (typeof exp.reembolsable !== "boolean") return "Reembolsable debe ser verdadero o falso.";
  return null;
}

function nextId() {
  var values = sheet().getDataRange().getValues();
  var max = 0;
  for (var i = 1; i < values.length; i++) {
    var m = /^EXP-(\d+)$/.exec(String(values[i][0]));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return "EXP-" + String(max + 1).padStart(5, "0");
}

function createExpense(userId, exp) {
  var err = validate(exp);
  if (err) return { ok: false, code: "forbidden", error: err };
  if (!isCurrentMonth(exp.date))
    return { ok: false, code: "forbidden", error: "Solo puedes registrar gastos del mes actual." };

  var now = stamp();
  var id = nextId();
  var montoPen = computeMontoPen(exp.amount, exp.currency);
  sheet().appendRow([
    id, userId, exp.date, exp.paymentMethod, exp.categoriaId, exp.currency,
    exp.description || "", Number(exp.amount), Boolean(exp.reembolsable), now, now, montoPen,
  ]);
  return {
    ok: true,
    data: {
      id: id, userId: userId, date: exp.date, paymentMethod: exp.paymentMethod,
      categoriaId: exp.categoriaId, currency: exp.currency, description: exp.description || "",
      amount: Number(exp.amount), reembolsable: Boolean(exp.reembolsable),
      createdAt: now, updatedAt: now, montoPen: montoPen,
    },
  };
}

function updateExpense(userId, id, exp) {
  var err = validate(exp);
  if (err) return { ok: false, code: "forbidden", error: err };

  var found = findRow(userId, id);
  if (found.index === -1) return { ok: false, code: "forbidden", error: "Gasto no encontrado." };
  if (found.index === -2) return { ok: false, code: "forbidden", error: "Gasto no encontrado." };

  // El gasto guardado Y la nueva fecha deben pertenecer al mes actual.
  if (!isCurrentMonth(iso(found.row[2])) || !isCurrentMonth(exp.date))
    return { ok: false, code: "forbidden", error: "Este gasto pertenece a un periodo cerrado y es solo de lectura." };

  var now = stamp();
  var montoPen = computeMontoPen(exp.amount, exp.currency);
  sheet().getRange(found.index, 1, 1, 12).setValues([[
    id, userId, exp.date, exp.paymentMethod, exp.categoriaId, exp.currency,
    exp.description || "", Number(exp.amount), Boolean(exp.reembolsable),
    String(found.row[9]) || now, now, montoPen,
  ]]);
  return {
    ok: true,
    data: {
      id: id, userId: userId, date: exp.date, paymentMethod: exp.paymentMethod,
      categoriaId: exp.categoriaId, currency: exp.currency, description: exp.description || "",
      amount: Number(exp.amount), reembolsable: Boolean(exp.reembolsable),
      createdAt: String(found.row[9]) || now, updatedAt: now, montoPen: montoPen,
    },
  };
}

function deleteExpense(userId, id) {
  var found = findRow(userId, id);
  if (found.index < 0) return { ok: false, code: "forbidden", error: "Gasto no encontrado." };
  if (!isCurrentMonth(iso(found.row[2])))
    return { ok: false, code: "forbidden", error: "Este gasto pertenece a un periodo cerrado y es solo de lectura." };
  sheet().deleteRow(found.index);
  return { ok: true, data: { id: id } };
}

function listPresupuestos() {
  var values = presupuestosSheet().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    if (!values[i][0]) continue;
    out.push({ id: String(values[i][0]), nombre: String(values[i][1]), porcentaje: Number(values[i][2]) || 0 });
  }
  return out;
}

function updatePresupuesto(id, porcentaje) {
  if (!(Number(porcentaje) >= 0)) return { ok: false, code: "forbidden", error: "El porcentaje debe ser mayor o igual a 0." };
  var sh = presupuestosSheet();
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sh.getRange(i + 1, 3).setValue(Number(porcentaje));
      return { ok: true, data: { id: String(id), nombre: String(values[i][1]), porcentaje: Number(porcentaje) } };
    }
  }
  return { ok: false, code: "forbidden", error: "Presupuesto no encontrado." };
}

function listCategorias() {
  var values = categoriasSheet().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    if (!values[i][0]) continue;
    out.push({ id: String(values[i][0]), nombre: String(values[i][1]), presupuestoId: String(values[i][2]) });
  }
  return out;
}

function listIngresosFijos() {
  var values = ingresosFijosSheet().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    if (!values[i][0]) continue;
    out.push({ id: String(values[i][0]), nombre: String(values[i][1]), monto: Number(values[i][2]) || 0 });
  }
  return out;
}

function nextIngresoFijoId() {
  var values = ingresosFijosSheet().getDataRange().getValues();
  var max = 0;
  for (var i = 1; i < values.length; i++) {
    var m = /^ING-(\d+)$/.exec(String(values[i][0]));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return "ING-" + String(max + 1).padStart(5, "0");
}

function createIngresoFijo(input) {
  if (!input || !input.nombre) return { ok: false, code: "forbidden", error: "Nombre requerido." };
  if (!(Number(input.monto) >= 0)) return { ok: false, code: "forbidden", error: "El monto debe ser mayor o igual a 0." };
  var id = nextIngresoFijoId();
  ingresosFijosSheet().appendRow([id, input.nombre, Number(input.monto)]);
  return { ok: true, data: { id: id, nombre: input.nombre, monto: Number(input.monto) } };
}

/**
 * Migración única: convierte la pestaña "Expenses" del esquema viejo
 * (Categoría en texto libre, Monto Reembolsable numérico, sin Monto PEN) al
 * esquema nuevo (ID Categoría, Reembolsable booleano, Monto PEN). Ejecutar UNA
 * SOLA VEZ, manualmente, desde el editor de Apps Script — no se invoca desde
 * doPost. Antes de correrla: Archivo > Hacer una copia del spreadsheet, y
 * validar primero contra esa copia.
 */
function migrateToBudgetSchema_v2() {
  presupuestosSheet();
  categoriasSheet();
  ingresosFijosSheet();

  var categorias = listCategorias();
  var otros = categorias.filter(function (c) {
    return c.nombre === "Otros";
  })[0];
  var lookup = {};
  categorias.forEach(function (c) {
    lookup[c.nombre.trim().toLowerCase()] = c.id;
  });

  var sh = sheet();
  var values = sh.getDataRange().getValues();
  var fallbackCount = 0;
  var migratedCount = 0;
  var newRows = [EXPENSES_HEADERS];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;

    var categoriaNombre = String(row[4]).trim().toLowerCase();
    var categoriaId = lookup[categoriaNombre];
    if (!categoriaId) {
      categoriaId = otros.id;
      fallbackCount++;
    }

    var moneda = String(row[5]);
    var monto = Number(row[7]) || 0;
    var reembolsable = Number(row[8]) > 0;
    var montoPen = computeMontoPen(monto, moneda);

    newRows.push([
      row[0], row[1], row[2], row[3], categoriaId, moneda,
      row[6], monto, reembolsable, row[9], row[10], montoPen,
    ]);
    migratedCount++;
  }

  sh.clearContents();
  sh.getRange(1, 1, newRows.length, EXPENSES_HEADERS.length).setValues(newRows);

  Logger.log("Migración completa: " + migratedCount + " filas migradas, " + fallbackCount + " cayeron a 'Otros'.");
}

/**
 * Corrección puntual: filas escritas por el bot ANTES del fix que normaliza
 * "SOL" -> "PEN" (ver app.py) quedaron con "SOL" literal en la columna
 * Moneda — incluso tras migrateToBudgetSchema_v2(), que copia esa columna
 * tal cual. "SOL" no es un valor válido de Currency en el dashboard (rompe
 * el símbolo "S/" y separa esas filas como una moneda aparte en Insights).
 * Idempotente y segura de correr más de una vez — solo toca la columna F
 * donde el valor sea "sol" (sin importar mayúsculas/minúsculas).
 */
function normalizeSolToPen_v1() {
  var sh = sheet();
  var values = sh.getDataRange().getValues();
  var fixed = 0;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][5]).trim().toUpperCase() === "SOL") {
      sh.getRange(i + 1, 6).setValue("PEN");
      fixed++;
    }
  }
  Logger.log("Filas corregidas (SOL -> PEN): " + fixed);
}

/** Ejecuta esta función una vez desde el editor para generar datos de ejemplo. */
function seedDemoData() {
  var userId = "usuario@example.com"; // cámbialo por tu email
  var sh = sheet();
  var now = new Date();
  var categorias = listCategorias();
  var methods = ["Visa Oro", "IO", "Débito"];
  var currencies = ["PEN", "PEN", "PEN", "USD", "USD"];

  var counter = 0;
  var rows = [];
  for (var m = 0; m <= now.getMonth(); m++) {
    var n = 4 + Math.floor(Math.random() * 4);
    for (var k = 0; k < n; k++) {
      counter++;
      var day = 1 + Math.floor(Math.random() * (m === now.getMonth() ? now.getDate() : 28));
      var date = Utilities.formatDate(new Date(now.getFullYear(), m, day), Session.getScriptTimeZone(), "yyyy-MM-dd");
      var cat = categorias[Math.floor(Math.random() * categorias.length)];
      var currency = currencies[Math.floor(Math.random() * currencies.length)];
      var amount = Math.round((20 + Math.random() * 480) * 100) / 100;
      var reembolsable = Math.random() < 0.3;
      var ts = stamp();
      rows.push([
        "EXP-" + String(counter).padStart(5, "0"), userId, date,
        methods[Math.floor(Math.random() * methods.length)],
        cat.id, currency, cat.nombre, amount, reembolsable, ts, ts,
        computeMontoPen(amount, currency),
      ]);
    }
  }
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, EXPENSES_HEADERS.length).setValues(rows);
}
