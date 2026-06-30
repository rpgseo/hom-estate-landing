# HOM.ESTATE Landing Page - Coliving Delicias Zaragoza
Landing page para el coliving de HOM.ESTATE en Zaragoza, con integración de **Retell AI** (voice agent), Airtable, Google Calendar, Stripe y Resend.

## 🚀 Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   │   ├── AvailabilityCalendar.tsx
│   │   └── BookingForm.tsx
│   ├── data/
│   │   └── coliving.ts          (Datos del coliving y habitaciones)
│   ├── layouts/
│   │   └── Layout.astro         (Layout principal, con widget de Retell)
│   ├── lib/
│   │   ├── airtable.ts          (Integración con Airtable para leads)
│   │   ├── google-calendar.ts   (Integración con Google Calendar para disponibilidad)
│   │   └── resend.ts            (Integración con Resend para emails)
│   └── pages/
│       ├── api/
│       │   ├── retell/          (Endpoints para Retell: info, disponibilidad, lead)
│       │   ├── stripe/          (Endpoints para Stripe)
│       │   ├── availability.ts
│       │   ├── leads.ts
│       │   └── debug.ts
│       └── index.astro
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## ⚙️ Configuración (Variables de Entorno)

Crea un archivo `.env` en la raíz del proyecto y configura las variables según `.env.example`:

### Google Calendar
- `GOOGLE_SERVICE_ACCOUNT_JSON`: JSON de la cuenta de servicio de Google
- `GOOGLE_CALENDAR_ID`: ID del calendario de Google

### Airtable
- `AIRTABLE_API_KEY`: API Key de Airtable
- `AIRTABLE_BASE_ID`: ID de la base de datos de Airtable

### Resend
- `RESEND_API_KEY`: API Key de Resend
- `NOTIFY_EMAIL`: Email para recibir notificaciones de leads

### Stripe
- `STRIPE_SECRET_KEY`: Secret Key de Stripe
- `STRIPE_WEBHOOK_SECRET`: Secret del webhook de Stripe
- `INTERNAL_API_TOKEN`: Token para endpoints internos

### Retell AI
- `RETELL_API_KEY`: API Key de Retell (backend)
- `PUBLIC_RETELL_AGENT_ID`: ID del agente de Retell (público, widget)
- `PUBLIC_RETELL_PUBLIC_KEY`: Public Key de Retell (widget)

## 📞 Conectar Retell a tus sistemas (Airtable, n8n, Google Calendar)

### 1. Conectar Retell a tus endpoints de API
En el **dashboard de Retell**, configura las **funciones/tools** del agente para llamar a tus endpoints:

- **Obtener información del coliving**: `GET /api/retell/info`
- **Ver disponibilidad**: `GET /api/retell/availability?checkin=YYYY-MM-DD&months=N`
- **Crear lead**: `POST /api/retell/lead` (con los datos del usuario)

### 2. Conectar a n8n
Para automatizar flujos más complejos, usa **webhooks de Retell**:
1. Crea un webhook en n8n
2. Configura el webhook en Retell (dashboard → Webhooks) para eventos como `call_ended`, `lead_created`
3. n8n puede procesar estos eventos y conectar a otros servicios (Slack, Notion, etc.)

### 3. Airtable
Los endpoints `/api/retell/lead` ya guardan los leads en Airtable usando la librería `lib/airtable.ts`.

## 📚 Recursos de Retell
- [Documentación oficial de Retell](https://docs.retellai.com/)
- [Retell MCP Server](https://www.retellai.com/blog/retell-mcp-server) (para gestionar agentes desde IA)
- [Widget de Retell](https://docs.retellai.com/deploy/chat-widget)
