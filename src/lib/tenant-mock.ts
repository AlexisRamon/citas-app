export const MOCK_TENANT = {
  slug: "dr-guzman",
  name: "Dr. Guzmán",
  initials: "DG",
  specialty: "Medicina general",
  officeName: "Consultorio Alameda",
  city: "Tepic",
  address: "Calle Hidalgo 120, Tepic",
  addressLines: ["Calle Hidalgo 120", "Tepic, Nayarit"],
  phone: "311 123 4567",
  photo: "/tenants/dr-guzman/consultorio.svg",
  defaultStatus: "abierto" as const,
} as const;