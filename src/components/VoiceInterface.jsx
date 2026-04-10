import React, { useState, useEffect, useRef } from 'react';

/* ─── TTS helper ────────────────────────────────────────────────────────── */
function doSpeak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'uz-UZ';
  u.rate = 0.92;
  u.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const best =
    voices.find(v => v.lang.startsWith('uz')) ||
    voices.find(v => v.lang.startsWith('tr')) ||
    voices.find(v => v.lang.startsWith('ru'));
  if (best) u.voice = best;
  window.speechSynthesis.speak(u);
}

/* ─── Section config ─────────────────────────────────────────────────────── */
const SECTIONS = {
  mikro: {
    title: '📖 Birinchi Bob — Mikro Kurslar',
    color: '#7B61FF',
    border: '1px solid #7B61FF',
    bg: 'linear-gradient(135deg,rgba(123,97,255,.13) 0%,#0000 100%)',
    greet: "Birinchi bobga kirdingiz. Bu yerda robototexnika va sun'iy intellekt darslari mavjud!",
    body: (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginTop:24 }}>
        {[
          { icon:'🤖', h:'Robototexnika', p:"Robotlar qanday harakat qiladi? Sensorlar va motorlar bilan qanday ishlaydi? Bu darsda batafsil bilib olasiz." },
          { icon:'🧠', h:"Sun'iy Intellekt", p:"AI qanday qilib yuzlarni taniydi va inson bilan qanday gaplashadi? Sirlarni birga o'rganamiz." },
        ].map(c => (
          <div key={c.h} style={{ background:'rgba(123,97,255,.1)', padding:28, borderRadius:18, borderLeft:'5px solid #7B61FF' }}>
            <h2 style={{ fontSize:'1.4rem', marginBottom:12 }}>{c.icon} {c.h}</h2>
            <p style={{ opacity:.8, lineHeight:1.7 }}>{c.p}</p>
          </div>
        ))}
      </div>
    ),
  },
  lab: {
    title: '⚡ Ikkinchi Bob — Virtual Laboratoriya',
    color: '#00D2FF',
    border: '1px solid #00D2FF',
    bg: 'linear-gradient(135deg,rgba(0,210,255,.13) 0%,#0000 100%)',
    greet: 'Ikkinchi bobga kirdingiz. Virtual laboratoriyaga xush kelibsiz!',
    body: (
      <div style={{ textAlign:'center', marginTop:60 }}>
        <div style={{ fontSize:'6rem', marginBottom:20, display:'inline-block', animation:'pulse 2s infinite' }}>🔋</div>
        <h2 style={{ fontSize:'1.8rem', marginBottom:16 }}>Elektr Zanjiri Tajribasi</h2>
        <p style={{ opacity:.7, fontSize:'1.1rem' }}>Bu yerda xavfsiz virtual tajribalar o'tkazib ko'rasiz. Hozircha elektr zanjirlari tajribasi ustida ish ketyapti.</p>
      </div>
    ),
  },
  task: {
    title: '🎯 Uchinchi Bob — Topshiriqlar',
    color: '#00E676',
    border: '1px solid #00E676',
    bg: 'linear-gradient(135deg,rgba(0,230,118,.13) 0%,#0000 100%)',
    greet: "Uchinchi bobga kirdingiz. Bu yerda olgan bilimlaringizni sinab ko'rasiz!",
    body: (
      <div style={{ marginTop:24 }}>
        <div style={{ background:'rgba(0,230,118,.08)', padding:40, borderRadius:20, border:'1px dashed #00E676' }}>
          <h2 style={{ marginBottom:20, fontSize:'1.4rem' }}>Ovozli topshiriq #1:</h2>
          <p style={{ fontSize:'1.7rem', fontWeight:500, lineHeight:1.5 }}>"Nega quyosh panellari elektr chiqaradi?"</p>
          <p style={{ color:'rgba(255,255,255,.5)', marginTop:20 }}>Javobingizni ovoz orqali bering...</p>
        </div>
      </div>
    ),
  },
};

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function VoiceInterface({ onSwitch }) {
  const [view, setView]             = useState('hub');
  const [transcript, setTranscript] = useState('');
  const [listening, setListening]   = useState(false);
  const [errMsg, setErrMsg]         = useState('');

  /* Keep a ref to the CURRENT view so speech handler is never stale */
  const viewRef      = useRef('hub');
  const cooldownRef  = useRef(0);
  const recRef       = useRef(null);

  /* Sync ref when state changes */
  useEffect(() => { viewRef.current = view; }, [view]);

  /* Navigate helper */
  const goTo = (section) => {
    setView(section);
    viewRef.current = section;
    setTranscript('');
    try { if (recRef.current) recRef.current.stop(); } catch(e) {}
    doSpeak(SECTIONS[section].greet);
  };

  const goHub = () => {
    setView('hub');
    viewRef.current = 'hub';
    setTranscript('');
    try { if (recRef.current) recRef.current.stop(); } catch(e) {}
    doSpeak("Darslar oynasiga qaytdik. Birinchi, ikkinchi yoki uchinchi bob deng.");
  };

  /* Voice command processor – uses viewRef so always fresh */
  const processCmd = (raw) => {
    const now = Date.now();
    if (now - cooldownRef.current < 2000) return; // 2 s debounce
    const cmd = raw.toLowerCase().trim();
    if (!cmd) return;
    console.log('[Voice] cmd:', cmd, '| view:', viewRef.current);

    // Orqaga
    if (/orqaga|chiqish|qayt/.test(cmd)) {
      cooldownRef.current = now;
      if (viewRef.current !== 'hub') goHub();
      else onSwitch('onboarding');
      return;
    }
    // Navigate only from hub
    if (viewRef.current === 'hub') {
      if (/birinchi|1-bo|1 bo|bir |1-chi|1 chi|1chi|mikro/i.test(cmd)) {
        cooldownRef.current = now;
        goTo('mikro');
      } else if (/ikkinchi|2-bo|2 bo|ikki|2-chi|2 chi|2chi|lab/i.test(cmd)) {
        cooldownRef.current = now;
        goTo('lab');
      } else if (/uchinchi|3-bo|3 bo|uch|3-chi|3 chi|3chi|topshiriq/i.test(cmd)) {
        cooldownRef.current = now;
        goTo('task');
      }
    }
  };

  /* Setup speech recognition ONCE */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setErrMsg("Bu brauzer ovozni qo'llab-quvvatlamaydi. Google Chrome ishlatishga harakat qiling.");
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    rec.lang           = 'uz-UZ';
    rec.continuous     = true;
    rec.interimResults = true;

    let isActive = true;
    rec.onstart  = () => setListening(true);
    rec.onerror  = (e) => {
      console.error('[Voice] error:', e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        isActive = false;
        setListening(false);
        setErrMsg("Mikrofonga ruxsat yo'q. Brauzer manzil satrida mikrofon belgisini bosib ruxsat bering.");
      }
    };
    rec.onend    = () => {
      // Always restart – keep the mic hot without flickering UI
      if (isActive) {
        setTimeout(() => {
          try { rec.start(); } catch (_) {}
        }, 200);
      } else {
        setListening(false);
      }
    };
    rec.onresult = (e) => {
      let txt = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTranscript(txt);
      processCmd(txt);   // <-- always current because processCmd reads viewRef
    };

    // Start immediately
    try { rec.start(); } catch (_) {}

    // Welcome
    setTimeout(() => doSpeak("Ovozli darslar portaliga xush kelibsiz! Birinchi, ikkinchi yoki uchinchi bob deng."), 700);

    return () => {
      rec.onend = null;
      try { rec.stop(); } catch (_) {}
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Hub view ─────────────────────────────────────────────────────────── */
  const HubView = () => (
    <div className="animate-fade-in" style={{ padding:20 }}>
      <h1 style={{ color:'#00D2FF', marginBottom:8, fontSize:'2rem' }}>📚 Darslar Oynasi</h1>
      <p style={{ opacity:.6, marginBottom:36 }}>Bob nomini mikrofonga ayting yoki kartochkani bosing:</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
        {[
          { key:'mikro', icon:'📖', label:'Birinchi Bob', sub:'Mikro Kurslar' },
          { key:'lab',   icon:'⚡', label:'Ikkinchi Bob', sub:'Virtual Lab' },
          { key:'task',  icon:'🎯', label:'Uchinchi Bob', sub:'Topshiriqlar' },
        ].map(({ key, icon, label, sub }) => (
          <button key={key} onClick={() => goTo(key)}
            style={{ background:'rgba(255,255,255,.03)', border:'2px solid rgba(255,255,255,.1)',
              borderRadius:22, padding:'40px 20px', cursor:'pointer', textAlign:'center',
              color:'#fff', transition:'all .25s', fontSize:'1rem' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#00D2FF'; e.currentTarget.style.background='rgba(0,210,255,.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.1)'; e.currentTarget.style.background='rgba(255,255,255,.03)'; }}>
            <span style={{ fontSize:'3.5rem', display:'block', marginBottom:14 }}>{icon}</span>
            <strong style={{ fontSize:'1.05rem' }}>{label}</strong>
            <p style={{ opacity:.55, marginTop:6, fontSize:'.85rem' }}>{sub}</p>
          </button>
        ))}
      </div>

      <div style={{ marginTop:32, padding:20, background:'rgba(0,0,0,.35)', borderRadius:14, textAlign:'center' }}>
        <p style={{ fontSize:'1.2rem', fontStyle:'italic', color:'#00D2FF' }}>
          {transcript ? `"${transcript}"` : '"Birinchi, ikkinchi yoki uchinchi bob..."'}
        </p>
      </div>
    </div>
  );

  /* ── Section view ─────────────────────────────────────────────────────── */
  const SectionView = () => {
    const s = SECTIONS[view];
    return (
      <div className="animate-fade-in"
        style={{ padding:40, borderRadius:28, border:s.border, background:s.bg, minHeight:460 }}>
        <h1 style={{ color:s.color, marginBottom:8, fontSize:'1.8rem' }}>{s.title}</h1>
        <p style={{ opacity:.5, fontSize:'.9rem' }}>Orqaga qaytish uchun "Orqaga" deng yoki tugmani bosing.</p>
        {s.body}
        <div style={{ marginTop:32, padding:16, background:'rgba(0,0,0,.35)', borderRadius:12, textAlign:'center' }}>
          <p style={{ fontStyle:'italic', color:s.color, fontSize:'1.1rem' }}>
            {transcript ? `"${transcript}"` : '"Buyruq bering..."'}
          </p>
        </div>
      </div>
    );
  };

  /* ── Layout ───────────────────────────────────────────────────────────── */
  return (
    <div className="dashboard-wrapper animate-fade-in">
      {/* Header */}
      <header className="header" style={{ paddingBottom:18 }}>
        <div>
          <h1 className="title text-gradient">Inclusive AI Portal</h1>
          <p className="text-secondary">Audio-ovozli boshqaruv platformasi</p>
        </div>
        <div className="flex-center" style={{ gap:14 }}>
          <span className="interface-badge"
            style={{ borderColor: listening ? '#00D2FF' : '#555',
              color: listening ? '#00D2FF' : '#999',
              background: listening ? 'rgba(0,210,255,.1)' : 'rgba(255,255,255,.03)',
              display:'flex', alignItems:'center', gap:8 }}>
            {listening
              ? <><span style={{ width:8, height:8, borderRadius:'50%', background:'#00D2FF', display:'inline-block', animation:'pulse 1.2s infinite' }} />🎙️ Eshityapman</>
              : '🔇 Kutishda'}
          </span>
          {view !== 'hub' && (
            <button className="back-btn" onClick={goHub}>⬅ Orqaga</button>
          )}
          <button className="back-btn" onClick={() => onSwitch('onboarding')}>Chiqish</button>
        </div>
      </header>

      {/* Error */}
      {errMsg && (
        <div style={{ background:'rgba(255,60,60,.12)', border:'1px solid #f55', borderRadius:12,
          padding:'16px 20px', marginBottom:20, color:'#f88' }}>
          ⚠️ {errMsg}
        </div>
      )}

      {/* Content */}
      <div className="content-section" style={{ gridTemplateColumns:'1fr 280px' }}>
        <div className="main-panel">
          {view === 'hub' ? <HubView /> : <SectionView />}
        </div>

        {/* Sidebar */}
        <div className="side-panel">
          <h3 className="panel-title">Audio Qo'llanma</h3>
          <div className="course-list">
            <div className="course-item">
              <p>📍 <b>Hozir:</b> {view === 'hub' ? 'Darslar Oynasi' : SECTIONS[view]?.title}</p>
            </div>
            <div className="course-item">
              <p style={{ lineHeight:1.8 }}>
                🎤 <b>Ovozli buyruqlar:</b><br />
                "Birinchi bob" — 1-bobga kirish<br />
                "Ikkinchi bob" — 2-bobga kirish<br />
                "Uchinchi bob" — 3-bobga kirish<br />
                "Orqaga" — oldingi sahifaga
              </p>
            </div>
            <div className="course-item" style={{ background:'rgba(123,97,255,.1)', fontSize:'.85rem' }}>
              ℹ️ Har bir bobga kirganingizda tizim sizga ovoz orqali ma'lumot beradi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
