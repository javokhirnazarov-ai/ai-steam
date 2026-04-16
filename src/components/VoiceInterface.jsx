import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ──────────────────────────────────────────────────────────────────────────
   TTS helper — tabiiyroq o‘zbekcha ovoz
────────────────────────────────────────────────────────────────────────── */
let currentVoices = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  currentVoices = voices;
  return voices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
  loadVoices();
}

function pickBestVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = currentVoices.length ? currentVoices : loadVoices();

  // Cross-browser priority list for Human/AI sound
  return (
    // 1. Microsoft Edge Premium (Sabina Neural)
    voices.find(v => v.name.includes('Sabina') && v.name.includes('Online')) ||
    // 2. Google Chrome Premium (Uzbek Online)
    voices.find(v => v.lang.startsWith('uz') && v.name.includes('Google') && v.name.includes('Online')) ||
    // 3. Any Neural/Natural Uzbek (System/Cloud)
    voices.find(v => v.lang.startsWith('uz') && (v.name.includes('Neural') || v.name.includes('Natural'))) ||
    // 4. Google Turkish Neural (Chrome Fallback - sounds more human than local Uzbek robot)
    voices.find(v => v.lang.startsWith('tr') && v.name.includes('Google') && v.name.includes('Neural')) ||
    // 5. Any Google Uzbek/Turkish
    voices.find(v => (v.lang.startsWith('uz') || v.lang.startsWith('tr')) && v.name.includes('Google')) ||
    // 6. Last resort: Any Uzbek
    voices.find(v => v.lang.startsWith('uz')) ||
    null
  );
}

function normalizeForSpeech(text = '') {
  return text
    .replace(/AI/g, "sun'iy intellekt")
    .replace(/STEAM/g, "stiy-em")
    .replace(/'/g, "’") // Help AI engines with Uzbek apostrophe
    .replace(/O'/g, "O‘")
    .replace(/G'/g, "G‘")
    .replace(/\s+/g, ' ')
    .trim();
}

async function doSpeak(text, options = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(normalizeForSpeech(text));
  const best = pickBestVoice();
  
  if (best) {
    u.voice = best;
    // If it's Turkish, it reads Uzbek phonetically (much softer)
    if (!best.lang.startsWith('uz')) u.lang = best.lang;
  } else {
    u.lang = 'uz-UZ';
  }

  u.rate = options.rate ?? 0.88;
  u.pitch = options.pitch ?? 0.96;
  u.volume = 1.0;

  window.speechSynthesis.speak(u);
}

/* ──────────────────────────────────────────────────────────────────────────
   Tabiiyroq matn generatorlari
────────────────────────────────────────────────────────────────────────── */
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getSectionGreeting(sectionKey) {
  const variants = {
    mikro: [
      "Birinchi bobga xush kelibsiz. Bu yerda robototexnika va sun’iy intellektni sodda va qiziqarli tarzda o‘rganamiz. Tayyormisiz?",
      "Zo‘r, birinchi bobni ochdik. Endi robotlar qanday ishlashi va sun’iy intellekt nimalarga qodirligini birga ko‘rib chiqamiz.",
      "Birinchi bobdamiz. Bu qismda siz robototexnika hamda sun’iy intellekt haqida tushunarli misollar bilan tanishasiz."
    ],
    lab: [
      "Virtual laboratoriyaga xush kelibsiz. Bu yerda tajribalarni xavfsiz tarzda sinab ko‘rishingiz mumkin.",
      "Ikkinchi bob ochildi. Endi laboratoriya usulida, lekin xavfsiz va qulay muhitda ishlaymiz.",
      "Yaxshi, virtual laboratoriyaga o‘tdik. Keling, tajribalarni birma-bir ko‘rib chiqamiz."
    ],
    task: [
      "Uchinchi bobga kirdik. Endi bilimingizni sinab ko‘rish vaqti keldi.",
      "Zo‘r, topshiriqlar qismidamiz. Savollarga bemalol javob berishingiz mumkin.",
      "Endi amaliy qismga o‘tdik. Bu yerda o‘rganganlaringizni sinab ko‘rasiz."
    ],
    hub: [
      "Darslar oynasiga qaytdik. Kerakli bobni ayting yoki ekrandan tanlang.",
      "Asosiy bo‘limga qaytdik. Birinchi, ikkinchi yoki uchinchi bobni tanlashingiz mumkin.",
      "Bosh sahifadamiz. Qaysi bobni ochamiz?"
    ]
  };

  return randomPick(variants[sectionKey] || variants.hub);
}

/* ──────────────────────────────────────────────────────────────────────────
   Section config
────────────────────────────────────────────────────────────────────────── */
const SECTIONS = {
  mikro: {
    title: '📖 Birinchi Bob — Mikro kurslar',
    color: '#7B61FF',
    border: '1px solid #7B61FF',
    bg: 'linear-gradient(135deg, rgba(123,97,255,.13) 0%, #0000 100%)',
    data: [
      {
        id: 'robot',
        icon: '🤖',
        h: 'Robototexnika',
        p: "Bu darsda robotlar qanday harakat qilishi, sensorlar nima vazifa bajarishi va motorlar qanday ishlashini sodda misollar orqali bilib olasiz."
      },
      {
        id: 'ai',
        icon: '🧠',
        h: "Sun’iy intellekt",
        p: "Bu qismda sun’iy intellekt yuzni qanday taniydi, ovozni qanday tushunadi va inson bilan qanday muloqot qilishini o‘rganasiz."
      }
    ],
    body: (data) => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        {data.map(c => (
          <div key={c.h} style={{ background: 'rgba(123,97,255,.1)', padding: 28, borderRadius: 18, borderLeft: '5px solid #7B61FF' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 12 }}>{c.icon} {c.h}</h2>
            <p style={{ opacity: .85, lineHeight: 1.75 }}>{c.p}</p>
          </div>
        ))}
      </div>
    ),
  },

  lab: {
    title: '⚡ Ikkinchi Bob — Virtual laboratoriya',
    color: '#00D2FF',
    border: '1px solid #00D2FF',
    bg: 'linear-gradient(135deg, rgba(0,210,255,.13) 0%, #0000 100%)',
    data: {
      h: 'Elektr zanjiri tajribasi',
      p: 'Bu yerda xavfsiz virtual tajribalarni sinab ko‘rasiz. Hozir elektr zanjirlariga oid interaktiv mashqlar tayyorlanmoqda.'
    },
    body: (data) => (
      <div style={{ textAlign: 'center', marginTop: 60 }}>
        <div style={{ fontSize: '6rem', marginBottom: 20, display: 'inline-block', animation: 'pulse 2s infinite' }}>🔋</div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 16 }}>{data.h}</h2>
        <p style={{ opacity: .75, fontSize: '1.1rem', lineHeight: 1.7 }}>{data.p}</p>
      </div>
    ),
  },

  task: {
    title: '🎯 Uchinchi Bob — Topshiriqlar',
    color: '#00E676',
    border: '1px solid #00E676',
    bg: 'linear-gradient(135deg, rgba(0,230,118,.13) 0%, #0000 100%)',
    data: {
      h: 'Ovozli topshiriq №1',
      q: '“Nega quyosh panellari elektr energiyasi hosil qiladi?”',
      p: 'Javobingizni ovoz orqali aytishingiz mumkin.'
    },
    body: (data) => (
      <div style={{ marginTop: 24 }}>
        <div style={{ background: 'rgba(0,230,118,.08)', padding: 40, borderRadius: 20, border: '1px dashed #00E676' }}>
          <h2 style={{ marginBottom: 20, fontSize: '1.4rem' }}>{data.h}</h2>
          <p style={{ fontSize: '1.7rem', fontWeight: 500, lineHeight: 1.5 }}>{data.q}</p>
          <p style={{ color: 'rgba(255,255,255,.55)', marginTop: 20 }}>{data.p}</p>
        </div>
      </div>
    ),
  },
};

/* ──────────────────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────────────────── */
export default function VoiceInterface({ onSwitch }) {
  const [view, setView] = useState('hub');
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const viewRef = useRef('hub');
  const cooldownRef = useRef(0);
  const recRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const say = useCallback(async (text) => {
    await doSpeak(text, { rate: 0.92, pitch: 0.96, volume: 1 });
  }, []);

  const goTo = useCallback((section) => {
    setView(section);
    viewRef.current = section;
    setTranscript('');
    try { recRef.current?.stop(); } catch (e) { }
    say(getSectionGreeting(section));
  }, [say]);

  const goHub = useCallback(() => {
    setView('hub');
    viewRef.current = 'hub';
    setTranscript('');
    try { recRef.current?.stop(); } catch (e) { }
    say(getSectionGreeting('hub'));
  }, [say]);

  const [lastHeard, setLastHeard] = useState('');

  const processCmd = useCallback((raw) => {
    const now = Date.now();
    if (now - cooldownRef.current < 600) return; 

    const cmd = (raw || '').toLowerCase().trim();
    if (!cmd) return;

    console.log('[Voice] Processing:', cmd);
    setLastHeard(cmd); // Show on screen for user debugging

    const normalized = cmd.toLowerCase();
    
    // Simplest possible matching for 'Back'
    if (normalized.includes('orqaga') || 
        normalized.includes('stop') || 
        normalized.includes('qayt') || 
        normalized.includes('menyu') ||
        normalized.includes('chiqish')) {
      
      console.warn('[Voice] SUCCESS: Back matched');
      window.speechSynthesis.cancel();
      cooldownRef.current = now;
      
      if (viewRef.current !== 'hub') {
        say("Xo‘p, darslar oynasiga qaytamiz");
        goHub();
      } else {
        say("Xo‘p, portalni yopaman");
        onSwitch?.('onboarding');
      }
      setTranscript(''); 
      return;
    }

    if (viewRef.current === 'hub') {
      if (normalized.includes('bir') || normalized.includes('mikro')) {
        cooldownRef.current = now;
        goTo('mikro');
        setTranscript('');
        return;
      }
      if (normalized.includes('ikki') || normalized.includes('lab')) {
        cooldownRef.current = now;
        goTo('lab');
        setTranscript('');
        return;
      }
      if (normalized.includes('uch') || normalized.includes('vazifa') || normalized.includes('topshiriq')) {
        cooldownRef.current = now;
        goTo('task');
        setTranscript('');
        return;
      }
    }

    // Sub-items
    if (viewRef.current === 'mikro') {
      if (normalized.includes('robot')) {
        cooldownRef.current = now;
        say(SECTIONS.mikro.data[0].p);
        setTranscript('');
        return;
      }
      if (normalized.includes('intel') || normalized.includes('ai')) {
        cooldownRef.current = now;
        say(SECTIONS.mikro.data[1].p);
        setTranscript('');
        return;
      }
    }

    if (viewRef.current === 'lab') {
      if (normalized.includes('elektr') || normalized.includes('zanjir') || normalized.includes('tajriba')) {
        cooldownRef.current = now;
        say(SECTIONS.lab.data.p);
        setTranscript('');
        return;
      }
    }

    if (viewRef.current === 'task') {
      if (normalized.includes('panell') || normalized.includes('quyosh') || normalized.includes('vazifa')) {
        cooldownRef.current = now;
        say("Ushbu topshiriq quyosh panellari haqida. O'ylaymanki, siz buni ajoyib tarzda bajarasiz!");
        setTranscript('');
        return;
      }
    }
  }, [goHub, goTo, onSwitch, say]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      setErrMsg("Bu brauzerda ovozli boshqaruv ishlamayapti. Google Chrome orqali urinib ko‘ring.");
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'uz-UZ';
    rec.continuous = true;
    rec.interimResults = true;

    let isActive = true;

    rec.onstart = () => {
      if (mountedRef.current) setListening(true);
    };

    rec.onerror = (e) => {
      console.error('[Voice] error:', e.error);

      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        isActive = false;
        if (mountedRef.current) {
          setListening(false);
          setErrMsg("Mikrofonga ruxsat berilmagan. Brauzerda mikrofon ruxsatini yoqing.");
        }
      }
    };

    rec.onend = () => {
      if (!mountedRef.current) return;

      if (isActive) {
        setTimeout(() => {
          try { rec.start(); } catch (_) { }
        }, 250);
      } else {
        setListening(false);
      }
    };

    rec.onresult = (e) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interimTranscript += e.results[i][0].transcript;
        }
      }

      const currentText = (finalTranscript || interimTranscript).trim();
      if (currentText) {
        setTranscript(currentText);
        processCmd(currentText);
      }
    };

    const startMic = () => {
      try { 
        rec.start(); 
        setListening(true);
      } catch (err) {
        console.warn('[Voice] Start attempt ignored:', err.message);
      }
    };

    startMic();

    setTimeout(() => {
      say("Ovozli darslar portaliga xush kelibsiz. Birinchi, ikkinchi yoki uchinchi bobni aytishingiz mumkin.");
    }, 700);

    return () => {
      isActive = false;
      rec.onend = null;
      try { rec.stop(); } catch (_) { }
      window.speechSynthesis?.cancel();
    };
  }, [processCmd, say]);

  const restartMic = () => {
    setErrMsg("");
    if (recRef.current) {
      try {
        recRef.current.stop();
        setTimeout(() => recRef.current.start(), 300);
      } catch (e) {
        try { recRef.current.start(); } catch (err) {}
      }
    }
  };

  const HubView = () => (
    <div className="animate-fade-in" style={{ padding: 20 }}>
      <h1 style={{ color: '#00D2FF', marginBottom: 8, fontSize: '2rem' }}>📚 Darslar oynasi</h1>
      <p style={{ opacity: .65, marginBottom: 36 }}>
        Bob nomini ayting yoki kartochkalardan birini tanlang:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {[
          { key: 'mikro', icon: '📖', label: 'Birinchi bob', sub: 'Mikro kurslar' },
          { key: 'lab', icon: '⚡', label: 'Ikkinchi bob', sub: 'Virtual laboratoriya' },
          { key: 'task', icon: '🎯', label: 'Uchinchi bob', sub: 'Topshiriqlar' },
        ].map(({ key, icon, label, sub }) => (
          <button
            key={key}
            onClick={() => goTo(key)}
            style={{
              background: 'rgba(255,255,255,.03)',
              border: '2px solid rgba(255,255,255,.1)',
              borderRadius: 22,
              padding: '40px 20px',
              cursor: 'pointer',
              textAlign: 'center',
              color: '#fff',
              transition: 'all .25s',
              fontSize: '1rem'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00D2FF';
              e.currentTarget.style.background = 'rgba(0,210,255,.07)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)';
              e.currentTarget.style.background = 'rgba(255,255,255,.03)';
            }}
          >
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: 14 }}>{icon}</span>
            <strong style={{ fontSize: '1.05rem' }}>{label}</strong>
            <p style={{ opacity: .58, marginTop: 6, fontSize: '.85rem' }}>{sub}</p>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: 20, background: 'rgba(0,0,0,.35)', borderRadius: 14, textAlign: 'center' }}>
        <p style={{ fontSize: '1.15rem', fontStyle: 'italic', color: '#00D2FF' }}>
          {transcript ? `"${transcript}"` : '"Masalan: birinchi bob, ikkinchi bob..."'}
        </p>
      </div>
      {/* Speech Feedback Bubble */}
      {lastHeard && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 210, 255, 0.9)',
          color: '#000',
          padding: '8px 20px',
          borderRadius: '25px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          boxShadow: '0 5px 20px rgba(0,0,0,0.4)',
          zIndex: 10001,
          animation: 'slideInUp 0.3s ease-out'
        }}>
          🎙️ Eshitildi: "{lastHeard}"
        </div>
      )}
    </div>
  );

  const SectionView = () => {
    const s = SECTIONS[view];
    return (
      <div
        className="animate-fade-in"
        style={{ padding: 40, borderRadius: 28, border: s.border, background: s.bg, minHeight: 460 }}
      >
        <h1 style={{ color: s.color, marginBottom: 8, fontSize: '1.8rem' }}>{s.title}</h1>
        <p style={{ opacity: .58, fontSize: '.95rem' }}>
          Ortga qaytish uchun “Orqaga” deng yoki tugmani bosing.
        </p>

        {s.body(s.data)}

        <div style={{ marginTop: 32, padding: 16, background: 'rgba(0,0,0,.35)', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontStyle: 'italic', color: s.color, fontSize: '1.1rem' }}>
            {transcript ? `"${transcript}"` : '"Buyruq kutilyapti..."'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <header className="header" style={{ paddingBottom: 18 }}>
        <div>
          <h1 className="title text-gradient">Inclusive AI Portal</h1>
          <p className="text-secondary">Ovozli boshqaruv platformasi</p>
        </div>

        <div className="flex-center" style={{ gap: 14 }}>
          <span
            className="interface-badge"
            style={{
              borderColor: listening ? '#00D2FF' : '#555',
              color: listening ? '#00D2FF' : '#999',
              background: listening ? 'rgba(0,210,255,.1)' : 'rgba(255,255,255,.03)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {listening ? (
              <>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#00D2FF',
                    display: 'inline-block',
                    animation: 'pulse 1.2s infinite'
                  }}
                />
                🎙️ Eshitib turibman
              </>
            ) : '🔇 Kutish rejimi'}
          </span>

          <button 
             className="back-btn" 
             style={{ padding: '8px 12px', borderColor: 'rgba(255,255,255,0.2)' }}
             onClick={restartMic}
             title="Mikrofonni qayta yoqish"
          >
            🔄 Qayta yoqish
          </button>

          {view !== 'hub' && (
            <button className="back-btn" onClick={goHub}>⬅ Orqaga</button>
          )}

          <button className="back-btn" onClick={() => onSwitch?.('onboarding')}>
            Chiqish
          </button>
        </div>
      </header>

      {errMsg && (
        <div
          style={{
            background: 'rgba(255,60,60,.12)',
            border: '1px solid #f55',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
            color: '#f88'
          }}
        >
          ⚠️ {errMsg}
        </div>
      )}

      <div className="content-section" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="main-panel">
          {view === 'hub' ? <HubView /> : <SectionView />}
        </div>

        <div className="side-panel">
          <h3 className="panel-title">Audio qo‘llanma</h3>
          <div className="course-list">
            <div className="course-item">
              <p>📍 <b>Hozir:</b> {view === 'hub' ? 'Darslar oynasi' : SECTIONS[view]?.title}</p>
            </div>

            <div className="course-item">
              <p style={{ lineHeight: 1.8 }}>
                🎤 <b>Ovozli buyruqlar:</b><br />
                “Birinchi bob” — 1-bobni ochadi<br />
                “Ikkinchi bob” — 2-bobni ochadi<br />
                “Uchinchi bob” — 3-bobni ochadi<br />
                “Orqaga” — oldingi sahifaga qaytaradi
              </p>
            </div>

            <div className="course-item" style={{ background: 'rgba(123,97,255,.1)', fontSize: '.85rem', lineHeight: 1.7 }}>
              ℹ️ Har bir bob ochilganda tizim sizga tabiiyroq ovoz bilan qisqacha yo‘l-yo‘riq beradi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
