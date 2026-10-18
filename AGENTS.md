# AGENTS.md · citas-app

> **Fuente de verdad del proyecto.** Léelo antes de responder.

## Stack
- Next.js 16 (App Router) + Turbopack
- React 19, TypeScript 5
- Tailwind CSS v4 (SIN `tailwind.config.ts`)
- lucide-react
- Fuente: Lato (400, 700) vía `next/font/google`, variable `--font-lato`
- Idioma: es-MX

## Reglas críticas
1. Tailwind v4 → config en `globals.css` con `@theme` y `@utility`. NO crear `tailwind.config.ts`.
2. Spacing SIEMPRE con tokens `ds-*` (`p-ds-4`, `gap-ds-3`). NUNCA el spacing nativo (`p-4`, `gap-3`).
3. `border` en v4 usa `currentColor` → siempre acompañar con `border-border`.
4. NO inventar tokens de sombra (Figma no las tiene).
5. NO hardcodear hex. Siempre tokens.
6. Estados hover/focus/error/danger aún NO definidos en Figma → preguntar antes de inventar.
7. Íconos con `lucide-react`.
8. Accesibilidad: contraste AA, targets táctiles 44px+, estado nunca solo por color.

## Design system
Archivo: `src/app/globals.css`.

Tokens dinámicos por tenant (se sobrescriben en runtime):
- `--color-primary: #28685c`
- `--color-primary-hover: #1c5147`

El resto de tokens son estáticos. Ver `src/app/globals.css` para valores exactos.

## Componentes (`src/components/ui/`)
Button, Badge, Input, PhoneInput (sin uso por ahora), OTPInput, Alert, AppointmentCard, CalendarCell, TenantIdentity, QRCard, BottomNav, PageHeader, BottomSheet, SidebarNav.

Ver `src/app/design-system/page.tsx` para el catálogo visual.

## Rutas
- `/` → landing mínima
- `/[tenant]/*` → paciente (multi-tenant, branding dinámico por CSS vars desde `[tenant]/layout.tsx`)
  - `/[tenant]` splash · `/home` · `/agendar` (fecha) · `/agendar/horario` · `/agendar/otp` · `/agendar/otp/codigo` · `/agendar/confirmar` · `/mi-cita`
- `/doctor/login` → login del doctor (público)
- `/doctor/*` → panel del doctor, grupo `(panel)` protegido por `src/proxy.ts`: `/doctor` (Hoy), `/doctor/configuracion`, `/doctor/qr`, `/doctor/disponibilidad` y `/doctor/citas` (placeholders)
- `/admin/*` → Super Admin (pendiente)
- `/design-system` → catálogo visual

Patrón de pantallas: `page.tsx` (Server: `getTenantBySlug` + `notFound()`) + `XxxClient.tsx` (Client, recibe `tenant`).

## Auth
- Supabase Auth Email OTP (código de 6 dígitos vía Resend) para pacientes
- Supabase Auth Email/Password para doctores y admin
- RLS con `tenant_id` en cada tabla
- Vista pública `public_busy_slots` (solo fechas/horas, sin datos de paciente)
- Holds temporales de 10 min al enviar el código (`status='pending'`, `hold_expires_at`)
- Zona horaria: todas las horas de slots se interpretan en `CLINIC_TIME_ZONE` (`src/lib/clinic-time.ts`), nunca en la del dispositivo. Slots definidos en `src/lib/slots.ts`; helpers de reserva en `src/lib/booking.ts`.

## Referencias
- Figma: https://www.figma.com/design/EOIZZUXVpWYqysHgqNW7tm/