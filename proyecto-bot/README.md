# Bot de Gastos — Office School

Bot de WhatsApp para registro de gastos en efectivo en tiempo real.
El equipo manda mensajes simples, el bot los guarda y manda un reporte diario por correo.

## Cómo funciona

```
Equipo → WhatsApp → Bot → gastos.json → Correo a Sol (8pm)
```

1. Alguien del equipo manda: `$200 papelería`
2. El bot confirma con ✅ y guarda: fecha, hora, quién, concepto, monto
3. A las 8pm el bot manda a Sol un correo con la tabla del día

## Instalación

### Requisitos
- Node.js 18+
- Google Chrome instalado en `C:\Program Files\Google\Chrome\Application\chrome.exe`
- PM2 (`npm install -g pm2`)
- Número de WhatsApp dedicado para el bot

### Pasos

```bash
# 1. Instalar dependencias (sin bajar Chrome de puppeteer, ya lo tenemos)
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus datos reales

# 3. Arrancar el bot
node index.js
# Escanea el QR con el número de WhatsApp del bot

# 4. Para que corra en segundo plano con PM2
pm2 start index.js --name office-bot
pm2 save
```

## Comandos de WhatsApp

| Mensaje | Acción |
|---|---|
| `$200 papelería` | Registra gasto de $200 en papelería |
| `350 lunch proveedores` | Registra gasto de $350 |
| `gasté 80 en uber` | Registra gasto de $80 |
| `resumen` | Muestra todos los gastos del día |
| `reporte` | Envía el correo a Sol de inmediato |
| `ayuda` | Muestra los comandos disponibles |

## Estructura de archivos

```
proyecto-bot/
├── index.js          ← Código principal del bot
├── package.json      ← Dependencias
├── .env.example      ← Plantilla de configuración
├── .env              ← Configuración real (NO subir a GitHub)
├── gastos.json       ← Base de datos de gastos (se crea sola)
└── session/          ← Sesión de WhatsApp (se crea sola)
```

## Variables de entorno (.env)

| Variable | Descripción |
|---|---|
| `GMAIL_USER` | Gmail del bot que manda el correo |
| `GMAIL_PASS` | Contraseña de aplicación Gmail (16 caracteres) |
| `SOL_EMAIL` | Correo de Sol donde llega el reporte |
| `HORA_REPORTE` | Hora del reporte en formato 24h (default: 20) |

## Cómo obtener la contraseña de aplicación Gmail

1. Entra a la cuenta Gmail del bot
2. Ve a **Gestionar tu cuenta de Google → Seguridad**
3. Activa **Verificación en 2 pasos**
4. Busca **Contraseñas de aplicaciones**
5. Crea una nueva → copia los 16 caracteres que te da

## Gestión con PM2

```bash
pm2 status              # Ver si está corriendo
pm2 logs office-bot     # Ver logs en tiempo real
pm2 restart office-bot  # Reiniciar el bot
pm2 stop office-bot     # Detener el bot
```

## Autor

Nestor Aguilar · [nespadron.github.io](https://nespadron.github.io)
