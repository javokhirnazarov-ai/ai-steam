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
      "Zo‘r, topshiriqlar q/* ──────────────────────────────────────────────────────────────────────────
   Section / Module config - 5 Modules, 10 Lessons each
────────────────────────────────────────────────────────────────────────── */
const MODULES = [
  { 
    id: 1, 
    title: 'Kirish va STEAM asoslari', 
    icon: '🚀',
    lessons: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `${i + 1}-dars: STEAM dunyosiga sayohat`,
      content: `Ushbu 1-modulning ${i + 1}-darsida biz fan, texnologiya, muhandislik, san'at va matematika integratsiyasini o'rganamiz.`,
      task: `1-modul ${i + 1}-dars bo'yicha topshiriq: STEAM tushunchasining har bir harfi nima anglatishini ovozli tarzda aytib bering.`
    }))
  },
  { 
    id: 2, 
    title: 'Sun’iy intellekt va Kelajak', 
    icon: '🧠',
    lessons: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `${i + 1}-dars: AI qanday fikrlaydi?`,
      content: `2-modul ${i + 1}-dars: Sun'iy intellekt ma'lumotlarni qanday tahlil qilishi va qaror qabul qilishi haqida suhbatlashamiz.`,
      task: `Sun'iy intellekt kundalik hayotimizda qanday yordam berishi mumkinligiga 2 ta misol keltiring.`
    }))
  },
  { 
    id: 3, 
    title: 'Robototexnika va Mexanika', 
    icon: '🤖',
    lessons: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `${i + 1}-dars: Robotlar anatomiyasi`,
      content: `3-modul ${i + 1}-dars: Robotlarning harakatlanishi uchun zarur bo'lgan datchiklar va motorlar haqida ma'lumot.`,
      task: `Bitta robot turini va uning asosiy funksiyasini ayting.`
    }))
  },
  { 
    id: 4, 
    title: 'Dasturlash sirlari', 
    icon: '💻',
    lessons: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `${i + 1}-dars: Algoritmlar nima?`,
      content: `4-modul ${i + 1}-dars: Murakkab muammolarni oddiy qadamlarga bo'lish san'atini o'rganamiz.`,
      task: `Choy damlash algoritmini qadam-baqadam sanab bering.`
    }))
  },
  { 
    id: 5, 
    title: 'Innovatsiyalar va Ijodkorlik', 
    icon: '✨',
    lessons: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `${i + 1}-dars: Creative Thinking`,
      content: `5-modul ${i + 1}-dars: Yangi g'oyalarni qanday generatsiya qilish va ularni amalga oshirish usullari.`,
      task: `Dunyoni o'zgartira oladigan bitta yangi g'oyangizni bayon qiling.`
    }))
  }
];

/* ──────────────────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────────────────── */
export default function VoiceInterface({ onSwitch }) {
  const [view, setView] = useState('hub'); // hub, module, lesson
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('audio'); // audio, tasks
  
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [lastHeard, setLastHeard] = useState('');

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
    await doSpeak(text, { rate: 0.95, pitch: 1.0, volume: 1 });
  }, []);

  const goHub = useCallback(() => {
    setView('hub');
    setSelectedModule(null);
    setSelectedLesson(null);
    setTranscript('');
    say("Asosiy portalga qaytdik. Qaysi modulni o'rganishni xohlaysiz?");
  }, [say]);

  const goModule = useCallback((mod) => {
    setSelectedModule(mod);
    setSelectedLesson(null);
    setView('module');
    setTranscript('');
    say(`${mod.id}-modul tanlandi: ${mod.title}. Ushbu modulda 10 ta dars mavjud. Qaysi darsni boshlaymiz?`);
  }, [say]);

  const goLesson = useCallback((less) => {
    setSelectedLesson(less);
    setView('lesson');
    setActiveTab('audio');
    setTranscript('');
    say(`${less.title}. Hozir ovozli dars qismidamiz. Topshiriqlarni ko'rish uchun "topshiriq" deb ayting.`);
  }, [say]);

  const processCmd = useCallback((raw) => {
    const now = Date.now();
    if (now - cooldownRef.current < 800) return; 

    const cmd = (raw || '').toLowerCase().trim();
    if (!cmd) return;

    console.log('[Voice] CMD:', cmd);
    setLastHeard(cmd);
    const norm = cmd.toLowerCase();

    // Global Commands
    if (norm.includes('orqaga') || norm.includes('menyu') || norm.includes('qayt')) {
      cooldownRef.current = now;
      if (viewRef.current === 'lesson') goModule(selectedModule);
      else if (viewRef.current === 'module') goHub();
      else onSwitch?.('onboarding');
      return;
    }

    // Hub View Commands
    if (viewRef.current === 'hub') {
      const matchMod = norm.match(/(?:modul|bo'lim|bob)\s*([1-5]|bir|ikki|uch|to'rt|besh)/);
      const modMap = { 'bir': 1, 'ikki': 2, 'uch': 3, 'to\'rt': 4, 'besh': 5 };
      let modId = matchMod ? (modMap[matchMod[1]] || parseInt(matchMod[1])) : null;
      
      if (!modId) {
        if (norm.includes('bir')) modId = 1;
        else if (norm.includes('ikki')) modId = 2;
        else if (norm.includes('uch')) modId = 3;
        else if (norm.includes('to\'rt')) modId = 4;
        else if (norm.includes('besh')) modId = 5;
      }

      if (modId && MODULES[modId - 1]) {
        cooldownRef.current = now;
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
          Object.keys(lessMap).forEach(key => { if(norm.includes(key)) lessId = lessMap[key]; });
          for(let i=1; i<=10; i++) { if(norm.includes(i.toString())) lessId = i; }
      }

      if (lessId && selectedModule.lessons[lessId - 1]) {
        cooldownRef.current = now;
        goLesson(selectedModule.lessons[lessId - 1]);
        return;
      }
    }

    // Lesson View Commands
    if (viewRef.current === 'lesson') {
      if (norm.includes('ovoz') || norm.includes('dars') || norm.includes('eshit')) {
        cooldownRef.current = now;
        setActiveTab('audio');
        say(selectedLesson.content);
        return;
      }
      if (norm.includes('topshiriq') || norm.includes('vazifa') || norm.includes('ish')) {
        cooldownRef.current = now;
        setActiveTab('tasks');
        say("Ushbu dars bo'yicha topshiriq: " + selectedLesson.task);
        return;
      }
    }

  }, [goHub, goModule, goLesson, selectedModule, selectedLesson, onSwitch, say]);

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
        if (e.error === 'no-speech') return; // Ignore silent periods
        console.error('SR Error:', e.error);
    };
    rec.onend = () => {
      if (mountedRef.current && totalRestartCount < 50) {
        totalRestartCount++;
        setTimeout(() => { try { rec.start(); } catch(_) {} }, 400); 
      }
    };

    rec.onresult = (e) => {
      let finalStr = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalStr += e.results[i][0].transcript;
      }
      if (finalStr) {
        setTranscript(finalStr);
        processCmd(finalStr);
      }
    };

    try { rec.start(); } catch(_) {}

    setTimeout(() => {
      say("Inclusive STEAM portaliga xush kelibsiz. 5 ta moduldan birini tanlang.");
    }, 1000);

    return () => {
      mountedRef.current = false;
      try { rec.stop(); } catch(_) {}
      window.speechSynthesis.cancel();
    };
  }, [processCmd, say]);

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
      </div>

      <div className="glass-panel" style={{ padding: '40px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
         {activeTab === 'audio' ? (
           <div className="animate-fade-in">
              <div className="voice-wave" style={{ marginBottom: '30px' }}>
                {[...Array(12)].map((_, i) => <div key={i} className="bar" style={{ animationDelay: `${i * 0.1}s`, width: '6px', margin: '0 3px' }}></div>)}
              </div>
              <p style={{ fontSize: '1.4rem', lineHeight: '1.8', maxWidth: '700px' }}>{selectedLesson.content}</p>
              <button onClick={() => say(selectedLesson.content)} style={{ marginTop: '30px', color: 'var(--text-accent)', textDecoration: 'underline' }}>Qayta eshitish</button>
           </div>
         ) : (
           <div className="animate-fade-in">
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎯</div>
              <h3 style={{ fontSize: '1.6rem', marginBottom: '20px' }}>Topshiriq:</h3>
              <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 30px' }}>{selectedLesson.task}</p>
              <div style={{ padding: '15px 30px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '15px', color: 'var(--success)', fontWeight: '500' }}>
                 Javobingizni hozir ovozli bering...
              </div>
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
            <div className={`pulse-dot ${listening ? 'active' : ''}`} style={{ width: 10, height: 10, borderRadius: '50%', background: listening ? 'var(--success)' : '#555' }}></div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{listening ? 'Sizni eshityapman' : 'Mikrofon kutmoqda'}</span>
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

