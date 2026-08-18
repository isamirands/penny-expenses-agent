/**
 * Google Apps Script — backend para "Pastel Finance".
 *
 * PASOS
 * 1. Crea una hoja de cálculo en Google Sheets con una pestaña llamada "Expenses".
 * 2. Fila 1 (encabezados, en este orden):
 *    ID | User ID | Fecha | Método de pago | Categoría | Moneda | Descripción | Monto | Monto Reembolsable | Created At | Updated At
 * 3. Extensiones > Apps Script, pega este archivo completo.
 * 4. Cambia SHARED_TOKEN por un texto secreto largo y aleatorio.
 * 5. Implementar > Nueva implementación > Aplicación web:
 *      Ejecutar como: Yo
 *      Quién tiene acceso: Cualquier usuario
 * 6. Copia la URL /exec y guárdala junto con el token en la app.
 */

var SHARED_TOKEN = "CAMBIA-ESTE-TOKEN";
var SHEET_NAME = "Expenses";

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

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow([
      "ID", "User ID", "Fecha", "Método de pago", "Categoría", "Moneda",
      "Descripción", "Monto", "Monto Reembolsable", "Created At", "Updated At",
    ]);
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

function rowToObject(row) {
  return {
    id: String(row[0]),
    userId: String(row[1]),
    date: iso(row[2]),
    paymentMethod: String(row[3]),
    category: String(row[4]),
    currency: String(row[5]),
    description: String(row[6]),
    amount: Number(row[7]) || 0,
    reimbursableAmount: Number(row[8]) || 0,
    createdAt: String(row[9]),
    updatedAt: String(row[10]),
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
  if (!exp.category) return "Categoría requerida.";
  if (!exp.currency) return "Moneda requerida.";
  if (!(Number(exp.amount) >= 0)) return "El monto debe ser mayor o igual a 0.";
  if (!(Number(exp.reimbursableAmount) >= 0)) return "El monto reembolsable debe ser mayor o igual a 0.";
  if (Number(exp.reimbursableAmount) > Number(exp.amount))
    return "El monto reembolsable no puede superar el monto total.";
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
  sheet().appendRow([
    id, userId, exp.date, exp.paymentMethod, exp.category, exp.currency,
    exp.description || "", Number(exp.amount), Number(exp.reimbursableAmount), now, now,
  ]);
  return {
    ok: true,
    data: {
      id: id, userId: userId, date: exp.date, paymentMethod: exp.paymentMethod,
      category: exp.category, currency: exp.currency, description: exp.description || "",
      amount: Number(exp.amount), reimbursableAmount: Number(exp.reimbursableAmount),
      createdAt: now, updatedAt: now,
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
  sheet().getRange(found.index, 1, 1, 11).setValues([[
    id, userId, exp.date, exp.paymentMethod, exp.category, exp.currency,
    exp.description || "", Number(exp.amount), Number(exp.reimbursableAmount),
    String(found.row[9]) || now, now,
  ]]);
  return {
    ok: true,
    data: {
      id: id, userId: userId, date: exp.date, paymentMethod: exp.paymentMethod,
      category: exp.category, currency: exp.currency, description: exp.description || "",
      amount: Number(exp.amount), reimbursableAmount: Number(exp.reimbursableAmount),
      createdAt: String(found.row[9]) || now, updatedAt: now,
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

/** Ejecuta esta función una vez desde el editor para generar datos de ejemplo. */
function seedDemoData() {
  var userId = "usuario@example.com"; // cámbialo por tu email
  var sh = sheet();
  var now = new Date();
  var cats = ["Alimentación", "Transporte", "Vivienda", "Entretenimiento", "Compras", "Salud", "Viajes", "Servicios", "Educación", "Otros"];
  var methods = ["Tarjeta de crédito", "Tarjeta de débito", "Efectivo", "Transferencia", "Otro"];
  var currencies = ["PEN", "PEN", "PEN", "USD", "USD", "EUR"];
  var descs = ["Almuerzo", "Taxi", "Alquiler", "Cine", "Zapatillas", "Farmacia", "Vuelo", "Internet", "Curso online", "Varios"];

  var counter = 0;
  var rows = [];
  for (var m = 0; m <= now.getMonth(); m++) {
    var n = 4 + Math.floor(Math.random() * 4);
    for (var k = 0; k < n; k++) {
      counter++;
      var day = 1 + Math.floor(Math.random() * (m === now.getMonth() ? now.getDate() : 28));
      var date = Utilities.formatDate(new Date(now.getFullYear(), m, day), Session.getScriptTimeZone(), "yyyy-MM-dd");
      var ci = Math.floor(Math.random() * cats.length);
      var amount = Math.round((20 + Math.random() * 480) * 100) / 100;
      var reimb = Math.random() < 0.3 ? Math.round(amount * 0.5 * 100) / 100 : 0;
      var ts = stamp();
      rows.push(["EXP-" + String(counter).padStart(5, "0"), userId, date, methods[Math.floor(Math.random() * methods.length)],
        cats[ci], currencies[Math.floor(Math.random() * currencies.length)], descs[ci], amount, reimb, ts, ts]);
    }
  }
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 11).setValues(rows);
}
