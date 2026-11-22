import React, { useEffect, useState } from 'react';

const URL = 'https://twqgoiothjzptdipeksa.supabase.co/rest/v1/rpc/steam_statistics';
const KEY = 'sb_publishable_ZTuFqChj7mfCwdnr7p7qtQ_mfDvDNov';
let visitRequest;

function browserId() {
  try {
    const saved = localStorage.getItem('steam-statistics-id');
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem('steam-statistics-id', id);
    return id;
  } catch { return crypto.randomUUID(); }
}

async function request(id) {
  const response = await fetch(URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ visitor_id: id }),
  });
  if (!response.ok) throw new Error('Statistika yuklanmadi');
  return response.json();
}

// A shared promise prevents React Strict Mode from counting the same page load twice.
export function recordVisit() {
  if (!visitRequest) visitRequest = request(browserId()).catch(() => null);
  return visitRequest;
}

export default function Statistics({ onClose }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    recordVisit().then(data => { if (active) { setStats(data); setError(!data); } });
    return () => { active = false; };
  }, []);

  const days = Math.max(1, Math.floor((Date.now() - Date.UTC(2026, 2, 19)) / 86400000) + 1);
  const number = value => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 1 }).format(value);
  return <main className="statistics-page">
    <section className="statistics-card" aria-labelledby="stats-title">
      <button className="stats-back" onClick={onClose}>← Orqaga</button>
      <p className="stats-eyebrow">INCLUSIVE STEAM AI</p>
      <h1 id="stats-title">Platforma statistikasi</h1>
      <p className="stats-intro">19-mart 2026-yildan buyon platformamiz bilan birga</p>
      {error ? <p role="alert">Statistikani yuklab bo‘lmadi. Iltimos, keyinroq qayta urinib ko‘ring.</p> : !stats ? <p role="status">Ma’lumotlar yuklanmoqda...</p> : <>
        <div className="stats-grid">
          <div><span>👥</span><strong>{number(679 + Number(stats.visitors))}</strong><p>Jami tashrif buyuruvchilar</p></div>
          <div><span>📈</span><strong>{number((679 + Number(stats.visitors)) / days)}</strong><p>Kunlik o‘rtacha tashrif buyuruvchi</p></div>
          <div><span>👁</span><strong>{number(1358 + Number(stats.views))}</strong><p>Jami sahifa ochilishlari</p></div>
        </div>
        <p className="stats-note">Hisoblagich ishga tushishidan oldin 679 ta tashrif buyuruvchi va 1 358 ta sahifa ochilishi boshlang‘ich qiymat sifatida kiritilgan. Keyingi tashriflar brauzer bo‘yicha hisoblanadi; bir odam turli qurilmalarda alohida sanalishi mumkin.</p>
      </>}
    </section>
  </main>;
}
