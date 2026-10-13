export default function DesignSystemPage() {
  return (
    <main className="p-ds-6 space-y-ds-6 max-w-2xl mx-auto">
      <h1 className="text-32">Design System</h1>

      <section className="space-y-ds-3">
        <h2 className="text-20">Colores</h2>
        <div className="flex gap-ds-2 flex-wrap">
          <div className="w-20 h-20 rounded-md bg-primary" />
          <div className="w-20 h-20 rounded-md bg-primary-hover" />
          <div className="w-20 h-20 rounded-md bg-surface border border-border" />
          <div className="w-20 h-20 rounded-md bg-surface-soft" />
          <div className="w-20 h-20 rounded-md bg-success" />
          <div className="w-20 h-20 rounded-md bg-warning" />
          <div className="w-20 h-20 rounded-md bg-danger" />
        </div>
      </section>

      <section className="space-y-ds-3">
        <h2 className="text-20">Botones</h2>
        <div className="flex gap-ds-3 flex-wrap">
          <button className="h-control px-ds-4 rounded-md bg-primary text-surface font-bold">
            Botón primario
          </button>
          <button className="h-control px-ds-4 rounded-md bg-surface border border-border text-primary font-bold">
            Botón secundario
          </button>
          <button
            disabled
            className="h-control px-ds-4 rounded-md bg-disabled text-text-muted font-bold"
          >
            No disponible
          </button>
        </div>
      </section>

      <section className="space-y-ds-3">
        <h2 className="text-20">Tipografía</h2>
        <p className="text-32 font-bold">text-32 bold</p>
        <p className="text-24 font-bold">text-24 bold</p>
        <p className="text-20 font-bold">text-20 bold</p>
        <p className="text-16">text-16 regular</p>
        <p className="text-14 text-text-muted">text-14 muted</p>
      </section>
    </main>
  );
}