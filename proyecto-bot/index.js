// ─────────────────────────────────────────────────────────────────────────────
// BOT DE GASTOS — OFFICE SCHOOL
// Autor: Nestor Aguilar · nespadron.github.io
//
// Qué hace:
//   1. Escucha mensajes de WhatsApp del equipo de trabajo
//   2. Detecta montos y conceptos de gasto en lenguaje natural
//   3. Los guarda en gastos.json con fecha, hora y quién lo mandó
//   4. Todos los días a la hora configurada manda un reporte por correo a Sol
//
// Para arrancar: node index.js
// Con PM2:       pm2 start index.js --name office-bot
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

try { process.stdout._handle.setBlocking(true); } catch (_) {}
try { process.stderr._handle.setBlocking(true); } catch (_) {}

// ── CONFIG ───────────────────────────────────────────────────────────────────
// Todas las variables sensibles vienen del archivo .env (nunca del código)
const GASTOS_FILE  = path.join(__dirname, 'gastos.json');
const GMAIL_USER   = process.env.GMAIL_USER;   // Cuenta que manda el correo
const GMAIL_PASS   = process.env.GMAIL_PASS;   // Contraseña de aplicación Gmail
const SOL_EMAIL    = process.env.SOL_EMAIL;    // Correo donde llega el reporte
const HORA_REPORTE = parseInt(process.env.HORA_REPORTE || '20', 10); // 20 = 8pm

if (!GMAIL_USER || !GMAIL_PASS || !SOL_EMAIL) {
  console.error('❌ Falta configuración en .env — revisa GMAIL_USER, GMAIL_PASS y SOL_EMAIL');
  process.exit(1);
}

// ── MANEJO DE GASTOS ─────────────────────────────────────────────────────────

// Lee todos los gastos guardados. Si el archivo no existe devuelve array vacío.
function loadGastos() {
  try { return JSON.parse(fs.readFileSync(GASTOS_FILE, 'utf8')); }
  catch { return []; }
}

// Agrega un gasto nuevo al archivo JSON
function saveGasto(gasto) {
  const gastos = loadGastos();
  gastos.push(gasto);
  fs.writeFileSync(GASTOS_FILE, JSON.stringify(gastos, null, 2), 'utf8');
}

// Fecha de hoy en formato YYYY-MM-DD, zona horaria CDMX
function fechaHoy() {
  return new Date().toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).split('/').reverse().join('-');
}

// Hora actual en formato HH:MM, zona horaria CDMX
function horaAhora() {
  return new Date().toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── PARSER DE GASTOS ─────────────────────────────────────────────────────────
// Extrae monto y concepto de un mensaje de texto libre.
// Ejemplos que entiende:
//   "200 papelería"
//   "$350 lunch de proveedores"
//   "gasté 80 en uber"
//   "300" (solo monto, concepto queda como "Sin concepto")
function parseGasto(texto) {
  const match = texto.match(/\$?(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const monto = parseFloat(match[1]);
  if (monto <= 0) return null;

  // Quita el número y palabras comunes para quedarse solo con el concepto
  const concepto = texto
    .replace(match[0], '')
    .replace(/\b(gasté|gaste|gasto|en|de|para|por)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Sin concepto';

  return { monto, concepto };
}

// ── REPORTE DIARIO ────────────────────────────────────────────────────────────

// Filtra los gastos de una fecha específica
function getGastosHoy(fecha) {
  return loadGastos().filter(g => g.fecha === fecha);
}

// Genera el cuerpo HTML del correo que recibe Sol
function generarHTMLReporte(fecha, gastos) {
  const total = gastos.reduce((s, g) => s + g.monto, 0);

  const filas = gastos.map(g =>
    `<tr>
      <td style="padding:8px 12px">${g.hora}</td>
      <td style="padding:8px 12px">${g.quien}</td>
      <td style="padding:8px 12px">${g.concepto}</td>
      <td style="padding:8px 12px;text-align:right"><b>$${g.monto.toFixed(2)}</b></td>
    </tr>`
  ).join('');

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#1a1a2e">📊 Gastos del día — ${fecha}</h2>
    <table width="100%" style="border-collapse:collapse;border:1px solid #ddd">
      <thead>
        <tr style="background:#1a1a2e;color:#fff">
          <th style="padding:10px 12px;text-align:left">Hora</th>
          <th style="padding:10px 12px;text-align:left">Quién</th>
          <th style="padding:10px 12px;text-align:left">Concepto</th>
          <th style="padding:10px 12px;text-align:right">Monto</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr style="background:#e8f5e9;font-weight:bold">
          <td colspan="3" style="padding:10px 12px">Total del día</td>
          <td style="padding:10px 12px;text-align:right">$${total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="color:#888;font-size:12px;margin-top:16px">
      ${gastos.length} registro${gastos.length !== 1 ? 's' : ''} · Office School · Bot automático
    </p>
  </div>`;
}

// Envía el reporte por correo a Sol
async function enviarReporte(fecha) {
  const gastos = getGastosHoy(fecha);

  // Si no hubo gastos ese día, no se envía nada
  if (gastos.length === 0) {
    console.log(`[email] Sin gastos para ${fecha} — no se envía reporte.`);
    return;
  }

  const total = gastos.reduce((s, g) => s + g.monto, 0);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });

  await transporter.sendMail({
    from: `"Bot Office School" <${GMAIL_USER}>`,
    to: SOL_EMAIL,
    subject: `Gastos ${fecha} — $${total.toFixed(2)} MXN (${gastos.length} registros)`,
    html: generarHTMLReporte(fecha, gastos),
  });

  console.log(`[email] ✅ Reporte enviado a Sol: ${gastos.length} gastos, $${total.toFixed(2)}`);
}

// ── CLIENTE WHATSAPP ──────────────────────────────────────────────────────────
// Usa Chrome instalado en la máquina para mantener la sesión de WhatsApp Web
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, 'session') }),
  puppeteer: {
    headless: true, // Corre sin ventana visible
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

// Muestra el QR en la terminal para vincular el número de WhatsApp del bot
client.on('qr', (qr) => {
  console.log('\n📱 Escanea este QR con el número de Office School:\n');
  qrcode.generate(qr, { small: true });
  console.log('\nWhatsApp → ⋮ → Dispositivos vinculados → Vincular dispositivo\n');
});

let botStartTime = 0;

client.on('ready', async () => {
  console.log(`✅ Bot Office School listo — ${new Date().toLocaleTimeString()}`);
  botStartTime = Math.floor(Date.now() / 1000);

  // Programa el reporte diario automático (por defecto 8:00 PM hora CDMX)
  cron.schedule(`0 ${HORA_REPORTE} * * *`, () => {
    enviarReporte(fechaHoy()).catch(console.error);
  }, { timezone: 'America/Mexico_City' });

  console.log(`[cron] Reporte diario programado a las ${HORA_REPORTE}:00 hora CDMX`);
});

// ── MANEJO DE MENSAJES ────────────────────────────────────────────────────────
client.on('message', async (msg) => {
  // Ignora mensajes anteriores al arranque del bot
  if (msg.timestamp < botStartTime) return;
  const body = msg.body?.trim();
  if (!body) return;

  // Obtiene el nombre del contacto que mandó el mensaje
  const contact = await msg.getContact();
  const quien = contact.pushname || contact.name || msg.from.replace('@c.us', '');

  // ── Comando: ver resumen del día ──
  if (/^(resumen|total|cuanto|cuánto)$/i.test(body)) {
    const gastos = getGastosHoy(fechaHoy());
    if (gastos.length === 0) {
      await msg.reply('📭 Sin gastos registrados hoy.');
      return;
    }
    const total = gastos.reduce((s, g) => s + g.monto, 0);
    const lista = gastos.map(g => `• ${g.hora} *${g.quien}*: $${g.monto} — ${g.concepto}`).join('\n');
    await msg.reply(`📊 *Gastos de hoy (${fechaHoy()})*\n\n${lista}\n\n*Total: $${total.toFixed(2)}*`);
    return;
  }

  // ── Comando: forzar envío del reporte (útil si no quieren esperar la hora) ──
  if (/^(reporte|enviar reporte)$/i.test(body)) {
    await msg.reply('📧 Enviando reporte a Sol...');
    try {
      await enviarReporte(fechaHoy());
      await msg.reply('✅ Reporte enviado.');
    } catch (e) {
      await msg.reply(`❌ Error al enviar: ${e.message}`);
    }
    return;
  }

  // ── Comando: ayuda ──
  if (/^(ayuda|help|\?)$/i.test(body)) {
    await msg.reply(
      '💡 *Bot Gastos — Office School*\n\n' +
      'Para registrar un gasto escribe el monto y concepto:\n' +
      '• _$200 papelería_\n' +
      '• _350 lunch de proveedores_\n' +
      '• _gasté 80 en uber_\n\n' +
      '*Comandos:*\n' +
      '• *resumen* → gastos del día\n' +
      '• *reporte* → envía correo a Sol ahora\n' +
      '• *ayuda* → este mensaje'
    );
    return;
  }

  // ── Registro de gasto ──
  const gasto = parseGasto(body);
  if (!gasto) {
    await msg.reply(
      '❓ No entendí el monto.\n\n' +
      'Ejemplo: _"$200 papelería"_ o _"150 uber"_\n' +
      'Escribe *ayuda* para ver las opciones.'
    );
    return;
  }

  // Guarda el gasto y confirma al remitente
  saveGasto({
    fecha: fechaHoy(),
    hora: horaAhora(),
    quien,
    concepto: gasto.concepto,
    monto: gasto.monto,
  });

  await msg.reply(
    `✅ *Registrado*\n` +
    `💸 $${gasto.monto.toFixed(2)} — ${gasto.concepto}\n` +
    `👤 ${quien} · ${horaAhora()}`
  );
});

// Reconecta automáticamente si pierde conexión
client.on('disconnected', (reason) => {
  console.log(`Desconectado: ${reason}. Reconectando en 15s...`);
  setTimeout(() => client.initialize(), 15000);
});

async function shutdown() {
  try { await client.destroy(); } catch (_) {}
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Limpia archivos de bloqueo de Chrome que quedan si el proceso se cierra mal
const SESSION_DIR = path.join(__dirname, 'session', 'session');
['SingletonLock', 'SingletonSocket', 'SingletonCookie'].forEach(f => {
  try { fs.unlinkSync(path.join(SESSION_DIR, f)); } catch (_) {}
});

console.log('🚀 Iniciando Bot Office School...');
client.initialize();
