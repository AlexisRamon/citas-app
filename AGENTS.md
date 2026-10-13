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

## Componentes (12 total)
Button, Badge, Input, PhoneInput, OTPInput, Alert, AppointmentCard, CalendarCell, TenantIdentity, QRCard, BottomNav, PageHeader.

Ver `src/app/design-system/page.tsx` para el catálogo visual.

## Rutas
- `/[tenant]/*` → paciente (multi-tenant, branding dinámico por CSS vars)
- `/doctor/*` → panel del doctor (protegido)
- `/admin/*` → Super Admin (protegido)
- `/design-system` → catálogo visual

## Auth
- Supabase Auth Phone OTP para pacientes
- Supabase Auth Email/Password para doctores y admin
- RLS con `tenant_id` en cada tabla
- Vista pública `public_busy_slots` (solo fechas/horas, sin datos de paciente)
- Holds temporales de 5–10 min al entrar a OTP

## Referencias
- `docs/design-system.md` → design system completo desde Figma
- Figma: [pega aquí el link de tu archivo de Figma]