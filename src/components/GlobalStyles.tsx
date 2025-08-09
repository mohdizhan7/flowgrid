"use client";
export default function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      .ani-fade { animation: fadeIn .4s ease-out both; }
      .ani-up { animation: fadeInUp .5s ease-out both; }
    `}</style>
  );
}
