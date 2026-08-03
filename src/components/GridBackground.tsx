// Фон в духе "инструмента для данных": ровная тонкая сетка на весь вьюпорт
// плюс лёгкая виньетка по краям для глубины. Строго фон — ничего не движется,
// ничего не отвлекает от таблицы.
export default function GridBackground() {
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 -z-20 bg-background" />
      <div aria-hidden="true" className="site-grid fixed inset-0 -z-20" />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, transparent 60%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </>
  );
}
