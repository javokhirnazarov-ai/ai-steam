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
  const ones = ['', 'bir', 'ikki', 'uch', 'to‘rt', 'besh', 'olti', 'yetti', 'sakkiz', 'to‘qqiz'];
  const tens = ['', 'o‘n', 'yigirma', 'o‘ttiz', 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', 'to‘qson'];

  const convertNum = (n) => {
    let num = parseInt(n);
    if (isNaN(num)) return n;
    if (num === 0) return 'nol';
    if (num < 10) return ones[num];
    if (num < 100) return (tens[Math.floor(num / 10)] + ' ' + ones[num % 10]).trim();
    if (num === 100) return 'yuz';
    return n;
  };

  return text
    .replace(/AI/g, "sun'iy intellekt")
    .replace(/STEAM/g, "stiy-em")
    .replace(/(\d+)-modul/g, (m, p1) => convertNum(p1) + "inchi modul")
    .replace(/(\d+)-dars/g, (m, p1) => convertNum(p1) + "inchi dars")
    .replace(/(\d+)-bob/g, (m, p1) => convertNum(p1) + "inchi bob")
    .replace(/\d+/g, (m) => convertNum(m))
    .replace(/'/g, "’")
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

  if (typeof options.onStart === 'function') u.onstart = options.onStart;
  if (typeof options.onEnd === 'function') {
    u.onend = options.onEnd;
    u.onerror = options.onEnd;
  }

  if (typeof options.onStart === 'function') options.onStart();
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
      "Zo‘r, topshiriqlar qismiga keldik. Keling, vazifalarni bajaramiz."
    ],
    task: [
      "Uchinchi bobga kirdik. Endi bilimingizni sinab ko‘rish vaqti keldi.",
      "Zo‘r, topshiriqlar qismiga keldik. Keling, vazifalarni bajaramiz."
    ]
  };
  return variants[sectionKey] || [];
}

/* ──────────────────────────────────────────────────────────────────────────
   Section / Module config - 5 Modules
────────────────────────────────────────────────────────────────────────── */
const MODULES = [
  {
    id: 1,
    title: 'Nutq',
    icon: '🗣️',
    lessons: [
      {
        id: 1,
        title: '1-dars: NUTQIY VA NONUTQIY TOVUSHLAR. OVOZLARGA TAQLID',
        content: "1-modul 1-dars: Biz nutqimizni rivojlantiramiz va yangi so'zlarni o'rganamiz.",
        task: "O'zingiz haqingizda 3 ta gap aytib bering.",
        video: '/videodarslar/1.1.o.mp4'
      },
      {
        id: 2,
        title: '2-dars: Lug‘at boyligini oshirish',
        content: "1-modul 2-dars: Lug'at boyligimizni oshiramiz.",
        task: "Yangi o'rgangan so'zlaringizdan foydalanib gap tuzing.",
        video: '/videodarslar/1.2.mp4'
      },
      ...Array.from({ length: 8 }, (_, i) => ({
        id: i + 3,
        title: `${i + 3}-dars: Nutq madaniyati`,
        content: `1-modul ${i + 3}-dars: Biz nutqimizni rivojlantiramiz va yangi so'zlarni o'rganamiz.`,
        task: `O'zingiz haqingizda 3 ta gap aytib bering.`
      }))
    ]
  },
  {
    id: 2,
    title: 'Matematika',
    icon: '📐',
    lessons: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `${i + 1}-dars: Shakllar va sanoq`,
      content: `2-modul ${i + 1}-dars: Matematik tushunchalar va shakllarni o'rganamiz.`,
      task: `Birdan o'ngacha sanab bering.`
    }))
  },
  {
    id: 3,
    title: 'Mayda motorika',
    icon: '🧩',
    lessons: [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `${i + 1}-dars: Ranglar olami`,
        content: `3-modul ${i + 1}-dars: Chizish va ijodkorlik sirlari.`,
        task: `Sevimli rangingizni ayting.`
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        title: `${i + 11}-dars: Sahna va rollar`,
        content: `3-modul ${i + 11}-dars: Dramatizatsiya va muloqotni o'rganamiz.`,
        task: `Biron bir ertak qahramonining ismini ayting.`
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 21,
        title: `${i + 21}-dars: Tabiat sirlari`,
        content: `3-modul ${i + 21}-dars: Atrof-muhit va tabiatdagi o'zgarishlar.`,
        task: `Hozir qaysi fasl ekanligini ayting.`
      }))
    ]
  }
];

/* ──────────────────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────────────────── */
export default function VoiceInterface({ onSwitch }) {
  const [view, setView] = useState('hub'); // hub, module, lesson
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('audio'); // audio, tasks, video

  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [lastHeard, setLastHeard] = useState('');

  const viewRef = useRef('hub');
  const cooldownRef = useRef(0);
  const recRef = useRef(null);
  const mountedRef = useRef(true);
  const welcomeAudioRef = useRef(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const say = useCallback(async (text) => {
    await doSpeak(text, {
      rate: 0.95,
      pitch: 1.0,
      volume: 1,
      onStart: () => { speakingRef.current = true; },
      onEnd: () => { speakingRef.current = false; }
    });
  }, []);

  const goHub = useCallback(() => {
    setView('hub');
    setSelectedModule(null);
    setSelectedLesson(null);
    setTranscript('');
  }, []);

  const goModule = useCallback((mod) => {
    if (welcomeAudioRef.current) {
      try { welcomeAudioRef.current.pause(); } catch (e) { }
    }
    setSelectedModule(mod);
    setSelectedLesson(null);
    setView('module');
    setTranscript('');
    say(`${mod.id}-modul: ${mod.title}. Endi bir darsni tanlang. Masalan, birinchi dars, ikkinchi dars yoki uchinchi dars.`);
  }, [say]);

  const goLesson = useCallback((less) => {
    if (welcomeAudioRef.current) {
      try { welcomeAudioRef.current.pause(); } catch (e) { }
    }
    setSelectedLesson(less);
    setView('lesson');
    setTranscript('');
    const lessonName = less.title.replace(/^[0-9]+-dars:\s*/i, '');
    if (less.video) {
      setActiveTab('video');
      say(`${less.id}-dars ochildi. ${lessonName}. Videodars yuklanmoqda.`);
    } else {
      setActiveTab('audio');
      say(`${less.id}-dars ochildi. ${lessonName}. Hozir ovozli dars qismidamiz. Topshiriqlarni ko'rish uchun "topshiriq" deb ayting.`);
    }
  }, [say]);

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const lastProcessedRef = useRef({ norm: '', time: 0 });

  const processCmd = useCallback((raw) => {
    const now = Date.now();
    if (now - cooldownRef.current < 800) return;

    const cmd = (raw || '').toLowerCase().trim();
    if (!cmd) return;

    const norm = cmd.toLowerCase();
    if (lastProcessedRef.current.norm === norm && now - lastProcessedRef.current.time < 2500) {
      return;
    }

    console.log('[Voice] CMD:', cmd);
    setLastHeard(cmd);

    const isBackCmd = norm.includes('orqaga') || norm.includes('menyu') || norm.includes('qayt');
    if (speakingRef.current && !isBackCmd) {
      return;
    }

    // Ignore lesson commands while a video is actively playing, but still allow back navigation
    if (viewRef.current === 'lesson' && activeTabRef.current === 'video') {
      if (isBackCmd) {
        cooldownRef.current = now;
        lastProcessedRef.current = { norm, time: now };
        goModule(selectedModule);
      }
      return;
    }

    if (isBackCmd) {
      cooldownRef.current = now;
      lastProcessedRef.current = { norm, time: now };
      if (viewRef.current === 'lesson') goModule(selectedModule);
      else if (viewRef.current === 'module') goHub();
      else onSwitch?.('onboarding');
      return;
    }

    // Hub View Commands
    if (viewRef.current === 'hub') {
      let modId = null;
      if (norm.includes('bir') || norm.includes('1')) modId = 1;
      else if (norm.includes('ikki') || norm.includes('2')) modId = 2;
      else if (norm.includes('uch') || norm.includes('3')) modId = 3;

      if (modId && MODULES[modId - 1]) {
        cooldownRef.current = now;
        lastProcessedRef.current = { norm, time: now };
        goModule(MODULES[modId - 1]);
        return;
      }
    }

    // Module View Commands
    if (viewRef.current === 'module') {
      const matchLess = norm.match(/(?:dars|mashq)\s*([1-9]|10|bir|ikki|uch|to'rt|besh|olti|yetti|sakkiz|to'qqiz|o'n)/);
      const lessMap = { 'bir': 1, 'ikki': 2, 'uch': 3, 'to\'rt': 4, 'besh': 5, 'olti': 6, 'yetti': 7, 'sakkiz': 8, 'to\'qqiz': 9, 'o\'n': 10 };
      let lessId = matchLess ? (lessMap[matchLess[1]] || parseInt(matchLess[1])) : null;

      if (!lessId) {
        // fallback search
        Object.keys(lessMap).forEach(key => { if (norm.includes(key)) lessId = lessMap[key]; });
        for (let i = 1; i <= 10; i++) { if (norm.includes(i.toString())) lessId = i; }
      }

      if (lessId && selectedModule.lessons[lessId - 1]) {
        cooldownRef.current = now;
        lastProcessedRef.current = { norm, time: now };
        goLesson(selectedModule.lessons[lessId - 1]);
        return;
      }
    }

    // Lesson View Commands
    if (viewRef.current === 'lesson') {
      if (norm.includes('ovoz') || norm.includes('dars') || norm.includes('eshit')) {
        cooldownRef.current = now;
        lastProcessedRef.current = { norm, time: now };
        setActiveTab('audio');
        say(selectedLesson.content);
        return;
      }
      if (norm.includes('topshiriq') || norm.includes('vazifa') || norm.includes('ish')) {
        cooldownRef.current = now;
        lastProcessedRef.current = { norm, time: now };
        setActiveTab('tasks');
        say("Ushbu dars bo'yicha topshiriq: " + selectedLesson.task);
        return;
      }
      if (norm.includes('video') || norm.includes('ko\'rish') || norm.includes('ekran')) {
        if (selectedLesson.video) {
          cooldownRef.current = now;
          lastProcessedRef.current = { norm, time: now };
          setActiveTab('video');
          say("Videodars yuklanmoqda.");
          return;
        } else {
          say("Ushbu dars uchun video darslik mavjud emas.");
        }
      }
    }

  }, [goHub, goModule, goLesson, selectedModule, selectedLesson, onSwitch, say]);

  const processCmdRef = useRef(processCmd);
  useEffect(() => {
    processCmdRef.current = processCmd;
  }, [processCmd]);

  // Recognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setErrMsg("Brauzerda ovozli boshqaruv mavjud emas.");
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'uz-UZ';
    rec.continuous = true;
    rec.interimResults = true;

    let totalRestartCount = 0;

    rec.onstart = () => setListening(true);
    rec.onerror = (e) => {
      if (e.error === 'no-speech') return;
      setListening(false);
      if (e.error === 'not-allowed') {
        setErrMsg("Mikrofon o'chiq. Brauzerda ruxsat berib, 'Yoqish'ni bosing.");
      }
      console.error('SR Error:', e.error);
    };
    rec.onend = () => {
      if (mountedRef.current && totalRestartCount < 50) {
        totalRestartCount++;
        setTimeout(() => { try { rec.start(); } catch (_) { } }, 400);
      }
    };

    rec.onresult = (e) => {
      let finalStr = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalStr += e.results[i][0].transcript;
      }
      if (finalStr) {
        setTranscript(finalStr);
        processCmdRef.current(finalStr);
      }
    };

    const startRecognition = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (mountedRef.current) {
          try { rec.start(); } catch (e) { console.error("Rec start error:", e); }
        }
      } catch (err) {
        console.warn("Microphone permission denied:", err);
        if (mountedRef.current) {
          setErrMsg("Mikrofon o'chiq. Brauzerda ruxsat berib, 'Yoqish'ni bosing.");
        }
      }
    };

    setTimeout(() => {
      startRecognition();
    }, 500);

    return () => {
      try { rec.stop(); } catch (_) { }
    };
  }, []);

  useEffect(() => {
    if (view === 'hub') {
      const audio = new Audio('/voice/asosiy_menu.wav');
      welcomeAudioRef.current = audio;
      const playTimeout = setTimeout(() => {
        audio.play().catch(err => {
          console.warn("Audio play failed, falling back to TTS:", err);
          say("Inclusive STEAM portaliga xush kelibsiz. 3 ta moduldan birini tanlang.");
        });
      }, 500);

      return () => {
        clearTimeout(playTimeout);
        audio.pause();
        welcomeAudioRef.current = null;
      };
    } else {
      if (welcomeAudioRef.current) {
        welcomeAudioRef.current.pause();
        welcomeAudioRef.current = null;
      }
    }
  }, [view, say]);

  /* ──────────────────────────────────────────────────────────────────────────
     Views
  ────────────────────────────────────────────────────────────────────────── */

  const HubView = () => (
    <div className="animate-fade-in">
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Ovozli darslar portali</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>O'rganish uchun modulni tanlang yoki "N-modul" deb ayting</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {MODULES.map(m => (
          <div key={m.id} onClick={() => goModule(m)} className="feat-card" style={{ cursor: 'pointer', padding: '30px' }}>
            <span style={{ fontSize: '3rem', marginBottom: '15px' }}>{m.icon}</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{m.id}-modul</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.title}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const ModuleView = () => (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={goHub} className="back-btn">⬅ Orqaga</button>
        <h2 style={{ fontSize: '2rem' }}>{selectedModule.icon} {selectedModule.title}</h2>
      </div>

      <div className="course-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {selectedModule.lessons.map(l => (
          <div key={l.id} onClick={() => goLesson(l)} className="course-item" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '10px 15px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--text-accent)', borderRadius: '12px', fontWeight: 'bold' }}>{l.id}</div>
              <span>{l.title}</span>
            </div>
            <span style={{ opacity: 0.4 }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );

  const LessonView = () => (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => goModule(selectedModule)} className="back-btn">⬅ Modulga qaytish</button>
        <h2 style={{ fontSize: '1.8rem' }}>{selectedLesson.title}</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
        <button
          onClick={() => setActiveTab('audio')}
          style={{ flex: 1, padding: '20px', borderRadius: '18px', background: activeTab === 'audio' ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-card)', border: activeTab === 'audio' ? '1px solid var(--text-accent)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}
        >
          🎙️ Ovozli dars
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{ flex: 1, padding: '20px', borderRadius: '18px', background: activeTab === 'tasks' ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-card)', border: activeTab === 'tasks' ? '1px solid var(--text-accent)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}
        >
          📝 Topshiriqlar
        </button>
        {selectedLesson.video && (
          <button
            onClick={() => setActiveTab('video')}
            style={{ flex: 1, padding: '20px', borderRadius: '18px', background: activeTab === 'video' ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-card)', border: activeTab === 'video' ? '1px solid var(--text-accent)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            📺 Videodars
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '40px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        {activeTab === 'audio' && (
          <div className="animate-fade-in">
            <div className="voice-wave" style={{ marginBottom: '30px' }}>
              {[...Array(12)].map((_, i) => <div key={i} className="bar" style={{ animationDelay: `${i * 0.1}s`, width: '6px', margin: '0 3px' }}></div>)}
            </div>
            <p style={{ fontSize: '1.4rem', lineHeight: '1.8', maxWidth: '700px' }}>{selectedLesson.content}</p>
            <button onClick={() => say(selectedLesson.content)} style={{ marginTop: '30px', color: 'var(--text-accent)', textDecoration: 'underline' }}>Qayta eshitish</button>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="animate-fade-in">
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎯</div>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '20px' }}>Topshiriq:</h3>
            <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 30px' }}>{selectedLesson.task}</p>
            <div style={{ padding: '15px 30px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '15px', color: 'var(--success)', fontWeight: '500' }}>
              Javobingizni hozir ovozli bering...
            </div>
          </div>
        )}

        {activeTab === 'video' && selectedLesson.video && (
          <div className="animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              src={selectedLesson.video}
              controls
              autoPlay
              style={{ width: '100%', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            ></video>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-wrapper animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header className="header">
        <div>
          <h1 className="title text-gradient">Inclusive STEAM</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={async () => {
                setErrMsg("");
                try {
                  await navigator.mediaDevices.getUserMedia({ audio: true });
                  recRef.current?.start();
                } catch (e) {
                  setErrMsg("Brauzer mikrofonga ruxsat bermadi. Iltimos, manzil satridagi 'Qulf' (🔒) belgisini bosing va ruxsat bering.");
                }
              }}
              className={`pulse-dot ${listening ? 'active' : ''}`}
              style={{ padding: 0, width: 14, height: 14, borderRadius: '50%', background: listening ? 'var(--success)' : 'var(--error)', cursor: 'pointer', border: 'none', boxShadow: listening ? '0 0 15px var(--success)' : 'none' }}
              title={listening ? "Eshityapman" : "Mikrofonni yoqish uchun bosing"}
            ></button>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: listening ? '600' : '400' }}>
              {listening ? 'Sizni eshityapman...' : 'Mikrofon o\'chiq (Yoqish uchun bosing)'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          {lastHeard && (
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '8px 15px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-accent)' }}>
              🎙️ "{lastHeard}"
            </div>
          )}
          <button className="back-btn" onClick={() => onSwitch?.('onboarding')}>Chiqish</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '20px 0' }}>
        {view === 'hub' && <HubView />}
        {view === 'module' && <ModuleView />}
        {view === 'lesson' && <LessonView />}
      </main>

      {errMsg && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--error)', color: '#fff', padding: '10px 20px', borderRadius: '10px' }}>
          {errMsg}
        </div>
      )}
    </div>
  );
}
