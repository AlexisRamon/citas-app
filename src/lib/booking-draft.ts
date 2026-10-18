// Borrador de la reserva en curso. Vive en sessionStorage (solo esta pestaña)
// para no pasar nombre ni correo por la URL.

export type BookingDraft = {
  holdId: string;
  tenantId: string;
  date: string;
  time: string;
  email: string;
  name: string;
  expiresAt: number;
};

const STORAGE_KEY = "citas:booking-draft";

export function readDraftRaw(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseDraft(raw: string | null): BookingDraft | null {
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<BookingDraft>;

    if (
      typeof value.holdId === "string" &&
      typeof value.tenantId === "string" &&
      typeof value.date === "string" &&
      typeof value.time === "string" &&
      typeof value.email === "string" &&
      typeof value.name === "string" &&
      typeof value.expiresAt === "number"
    ) {
      return value as BookingDraft;
    }
  } catch {
    return null;
  }

  return null;
}

/** Devuelve false si el navegador no permite guardar el borrador. */
export function saveDraft(draft: BookingDraft): boolean {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento disponible: no hay nada que limpiar.
  }
}

export function subscribeToDraft(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
