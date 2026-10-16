export const COLOR_PALETTE = [
  { name: "Verde", primary: "#28685c", hover: "#1c5147" },
  { name: "Azul", primary: "#1e5a8a", hover: "#164566" },
  { name: "Índigo", primary: "#3b3b8f", hover: "#2a2a6b" },
  { name: "Vino", primary: "#7a2d3b", hover: "#5c2029" },
  { name: "Terracota", primary: "#a05236", hover: "#7a3d28" },
  { name: "Mostaza", primary: "#8b651e", hover: "#6b4d15" },
  { name: "Gris", primary: "#4a5568", hover: "#2d3748" },
  { name: "Teal", primary: "#0f766e", hover: "#0b5750" },
] as const;

export type PaletteColor = (typeof COLOR_PALETTE)[number];

export function findPaletteColor(
  primary: string | null | undefined,
): PaletteColor | undefined {
  if (!primary) return undefined;
  return COLOR_PALETTE.find(
    (color) => color.primary.toLowerCase() === primary.toLowerCase(),
  );
}