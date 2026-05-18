import React, { useEffect, useRef, useState } from 'react';


const GestureInterface = ({ onSwitch }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [debugMsg, setDebugMsg] = useState('Neyron tarmoq yuklanmoqda... (Kutib turing)');
  const [rawWords, setRawWords] = useState([]);
  const [logicalSentence, setLogicalSentence] = useState("");
  const [recentWord, setRecentWord] = useState("");
  const [view, setView] = useState('translator'); // 'translator', 'modules', 'module1', 'module2', 'module3'
  const [history, setHistory] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [debugData, setDebugData] = useState({ word: 'Yo\'q', xDiff: 0, yDiff: 0 });
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const lastGestureRef = useRef("");
  const gestureCountRef = useRef(0);
  const sentenceRef = useRef([]);

  const navigateTo = (newView) => {
    setHistory(prev => [...prev, view]);
    setView(newView);
    setActiveTheme(null);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = [...history];
      const last = prev.pop();
      setHistory(prev);
      setView(last);
      setActiveTheme(null);
    } else {
      setView('translator');
    }
  };

  const modulesData = {
    1: {
      title: "1-Modul: Til va nutq markazi",
      icon: "🗣️",
      themes: [
        { id: "1.1", name: "O harfi", video: "/videodarslar/1.1.i.mp4" },
        { id: "1.2", name: "Lug‘at boyligini oshirish", video: "/videodarslar/1.2.mp4" },
        { id: "1.3", name: "Nutqning grammatik qurilishi" },
        { id: "1.4", name: "Bog‘lanishli nutqni rivojlantirish" },
        { id: "1.5", name: "O‘qishga tayyorgarlik" }
      ]
    },
    2: {
      title: "2-Modul: Qurish-yasash va matematika",
      icon: "📐",
      themes: [
        { id: "2.1", name: "Geometrik shakllar" },
        { id: "2.2", name: "Son va sanoq" },
        { id: "2.3", name: "Konstruktsiyalash asoslari" },
        { id: "2.4", name: "O‘lchash va miqdor" },
        { id: "2.5", name: "Fazo va vaqt tushunchasi" }
      ]
    },
    3: {
      title: "3-Modul: Mayda motorika",
      icon: "🧩",
      themes: [
        { id: "3.1", name: "Rasm chizish texnikasi" },
        { id: "3.2", name: "Loy va plastilin bilan ishlash" },
        { id: "3.3", name: "Applikatsiya va qirqish" },
        { id: "3.4", name: "Ranglar uyg‘unligi" },
        { id: "3.5", name: "Musiqa va ijodkorlik" },
        { id: "3.6", name: "Dramatizatsiya va sahna" },
        { id: "3.7", name: "Kasblarni o‘rganamiz" },
        { id: "3.8", name: "Muloqot madaniyati" },
        { id: "3.9", name: "Xalq ertaklari talqini" },
        { id: "3.10", name: "Ijtimoiy rollar" },
        { id: "3.11", name: "Atrof-muhitni o‘rganish" },
        { id: "3.12", name: "Tabiatdagi tajribalar" },
        { id: "3.13", name: "O‘simliklar dunyosi" },
        { id: "3.14", name: "Jonivorlar olami" },
        { id: "3.15", name: "Ekologik madaniyat" }
      ]
    }
  };

  useEffect(() => {
    let stream = null;
    let cameraAnimationId = null;
    let isRunning = true;
    let handsObj = null;

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(); return;
        }
        const script = document.createElement('script');
        script.src = src; script.crossOrigin = "anonymous";
        script.onload = () => resolve(); script.onerror = () => reject(new Error(src));
        document.body.appendChild(script);
      });
    };

    const initDetector = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

        const { Hands, HAND_CONNECTIONS } = window;

        handsObj = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        handsObj.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handsObj.onResults(onResults);

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setDebugMsg("Kamera faol. Ishora qiling.");
              processVideoFrame();
            };
          }
        }
      } catch (err) {
        setDebugMsg("Xatolik: " + err.message);
      }
    };

    const processVideoFrame = async () => {
      if (!isRunning || !handsObj) return;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try { await handsObj.send({ image: videoRef.current }); } catch (e) { }
      }
      cameraAnimationId = requestAnimationFrame(processVideoFrame);
    };

    const onResults = (results) => {
      if (!canvasRef.current || !videoRef.current) return;
      const canvasCtx = canvasRef.current.getContext('2d');
      const cvs = canvasRef.current;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, cvs.width, cvs.height);
      canvasCtx.translate(cvs.width, 0); canvasCtx.scale(-1, 1);
      canvasCtx.drawImage(results.image, 0, 0, cvs.width, cvs.height);

      let detectedWord = "Ishora kutilmoqda...";
      let xDiff = 0;
      let yDiff = 0;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
            window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
            window.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
          }

          const isThumbOpen = landmarks[4].y < landmarks[3].y - 0.01;
          const isIndexOpen = landmarks[8].y < landmarks[6].y;
          const isMiddleOpen = landmarks[12].y < landmarks[10].y;
          const isRingOpen = landmarks[16].y < landmarks[14].y;
          const isPinkyOpen = landmarks[20].y < landmarks[18].y;

          const fingerCount = [isIndexOpen, isMiddleOpen, isRingOpen, isPinkyOpen, isThumbOpen].filter(Boolean).length;

          if (fingerCount === 5) {
            detectedWord = "Modullar";
          } else if (fingerCount === 4) {
            detectedWord = "To'rt";
          } else if (fingerCount === 3) {
            detectedWord = "Uch";
          } else if (fingerCount === 2) {
            detectedWord = "Ikki";
          } else if (fingerCount === 1) {
            if (isThumbOpen) detectedWord = "Ajoyib";
            else detectedWord = "Bir";
          } else if (fingerCount === 0) {
            detectedWord = "Orqaga";
          }
        }
      }
      canvasCtx.restore();

      setDebugData({ word: detectedWord, xDiff: 0, yDiff: 0 });

      if (detectedWord !== "Ishora kutilmoqda...") {
        if (lastGestureRef.current === detectedWord) {
          gestureCountRef.current += 1;
          const requiredCount = 5;
          if (gestureCountRef.current === requiredCount) {
            setRecentWord(detectedWord);

            if (detectedWord === "Modullar") {
              if (view === 'translator') navigateTo('modules');
              else if (view === 'modules') navigateTo('module3');
            } else if (detectedWord === "Orqaga") {
              goBack();
            } else if (view === 'modules') {
              if (detectedWord === "Bir") navigateTo('module1');
              else if (detectedWord === "Ikki") navigateTo('module2');
              else if (detectedWord === "Uch") navigateTo('module3');
            }

            if (view === 'translator') {
              sentenceRef.current.push(detectedWord);
              if (sentenceRef.current.length > 5) sentenceRef.current.shift();
              setRawWords([...sentenceRef.current]);
              generateLogicalSentence([...sentenceRef.current]);
            }
          }
        } else {
          lastGestureRef.current = detectedWord;
          gestureCountRef.current = 1;
        }
      } else {
        lastGestureRef.current = "";
        gestureCountRef.current = 0;
      }
    };

    initDetector();

    return () => {
      isRunning = false;
      if (cameraAnimationId) cancelAnimationFrame(cameraAnimationId);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (handsObj && typeof handsObj.close === 'function') handsObj.close();
    };
  }, [view, history]);

  const generateLogicalSentence = (words) => {
    setIsTranslating(true);
    setTimeout(() => {
      let text = words.join(" ");
      let result = text;
      if (words.length >= 2) {
        result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() + ".";
      }
      setLogicalSentence(result);
      setIsTranslating(false);
    }, 600);
  };

  const clearText = () => {
    sentenceRef.current = [];
    setRawWords([]);
    setLogicalSentence("");
    setRecentWord("");
  };

  const renderView = () => {
    switch (view) {
      case 'modules':
        return (
          <div className="modules-selection animate-fade-in" style={{ width: '100%' }}>
            <h2 className="panel-title">📚 O'quv Modullari</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '30px' }}>
              {Object.keys(modulesData).map(key => {
                const mod = modulesData[key];
                const colors = ['rgba(58, 134, 255, 0.1)', 'rgba(255, 186, 8, 0.1)', 'rgba(16, 185, 129, 0.1)', 'rgba(239, 68, 68, 0.1)', 'rgba(167, 139, 250, 0.1)'];
                const borders = ['var(--primary)', '#FFBA08', '#10B981', '#EF4444', '#A78BFA'];
                return (
                  <button
                    key={key}
                    className="interface-card"
                    style={{ background: colors[parseInt(key) - 1], border: `2px solid ${borders[parseInt(key) - 1]}`, height: '180px' }}
                    onClick={() => navigateTo('module' + key)}
                  >
                    <span style={{ fontSize: '2.5rem' }}>{mod.icon}</span>
                    <h3>{key}-Modul</h3>
                    <p style={{ fontSize: '0.8rem' }}>{mod.title.split(': ')[1]}</p>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <button className="back-btn" onClick={goBack}>👈 Orqaga</button>
            </div>
          </div>
        );

      case 'module1':
      case 'module2':
      case 'module3':
        const modId = parseInt(view.replace('module', ''));
        const currentMod = modulesData[modId];
        return (
          <div className="module-detail animate-fade-in" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 className="panel-title" style={{ margin: 0 }}>{currentMod.title}</h2>
              <button className="back-btn" onClick={goBack}>👈 Orqaga qaytish</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {currentMod.themes.map((theme, index) => (
                <div key={index} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>{theme.id}. {theme.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Tayyor ✅</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '10px' }}
                      onClick={() => {
                        if (theme.video) {
                          setActiveVideo(theme.video);
                        } else {
                          alert("Ushbu dars uchun video darslik hozircha yuklanmagan.");
                        }
                      }}
                    >
                      📺 Videodars
                    </button>
                    <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '10px' }}>📝 Testlar</button>
                    <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '10px' }}>📁 Topshiriqlar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-wrapper animate-fade-in" style={{ position: 'relative' }}>
      <header className="header" style={{ paddingBottom: '10px' }}>
        <div>
          <h1 className="title text-gradient">Inclusive STEAM AI</h1>
          <p className="text-secondary">Imo-ishora: 👋 - Menyu | ✊ - Orqaga</p>
        </div>
        <div className="flex-center" style={{ gap: '16px' }}>
          <button className="back-btn" onClick={() => onSwitch('onboarding')}>Chiqish</button>
        </div>
      </header>

      {/* Persistent Camera Feed (PIP mode if not in translator) */}
      <div
        className="camera-container"
        style={view === 'translator' ? {
          position: 'relative',
          height: '350px',
          background: '#000',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '20px'
        } : {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '240px',
          height: '180px',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          border: '2px solid var(--primary)',
          zIndex: 1000,
          animation: 'slideInUp 0.3s ease-out'
        }}
      >
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }}></video>
        <canvas ref={canvasRef} width="640" height="480" style={{ width: '100%', height: '100%', objectFit: 'cover' }}></canvas>

        <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '10px', fontSize: '0.65rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: debugData.word !== 'Ishora kutilmoqda...' ? 'var(--success)' : '#fff' }}>{debugData.word}</span>
        </div>

        {recentWord && (
          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'var(--success)', color: '#000', padding: '2px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>
            + {recentWord}
          </div>
        )}
      </div>

      <div className="content-section" style={{ gridTemplateColumns: view === 'translator' ? '1.2fr 1fr' : '1fr' }}>
        <div className="main-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          {view === 'translator' ? (
            <div style={{ background: 'rgba(255, 255, 255, 0.07)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(135, 126, 255, 0.4)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ background: 'rgba(108, 99, 255, 0.15)', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #877eff' }}>
                <div style={{ fontSize: '0.9rem', color: '#a5a0ff', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '0.5px' }}>
                  NLP MANTIQIY GAP TARJIMONI:
                </div>
                <div style={{ color: '#fff', fontSize: '1.4rem', lineHeight: '1.5', minHeight: '40px', fontWeight: '500' }}>
                  {logicalSentence || "Tarjima uchun ishora qiling, yoki barcha barmoqlarni ochib \"Modullar\"ga o'ting..."}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" onClick={clearText} style={{ flex: 1, background: 'var(--surface-color)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Tozalash</button>
                <button className="btn-primary" onClick={() => navigateTo('modules')} style={{ flex: 2, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 'bold' }}>📚 Modullarga o'tish</button>
              </div>
            </div>
          ) : (
            renderView()
          )}
        </div>

        {view === 'translator' && (
          <div className="side-panel" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '25px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 className="panel-title" style={{ marginBottom: '20px' }}>👋 Ishoralar ro'yxati</h2>
            <div className="course-list" style={{ gap: '12px' }}>
              <div className="course-item" style={{ background: 'rgba(255,255,255,0.08)', padding: '15px', borderRadius: '15px' }}>
                <span>👋 <b style={{ marginLeft: '10px' }}>Ochiq kaft</b> - Modullarni ochish</span>
              </div>
              <div className="course-item" style={{ background: 'rgba(255,255,255,0.08)', padding: '15px', borderRadius: '15px' }}>
                <span>✊ <b style={{ marginLeft: '10px' }}>Musht (Fist)</b> - Orqaga qaytish</span>
              </div>
              <div className="course-item" style={{ background: 'rgba(255,255,255,0.08)', padding: '15px', borderRadius: '15px' }}>
                <span>☝️ <b style={{ marginLeft: '10px' }}>Ko'rsatkich</b> - "Bir" so'zi / Tanlash</span>
              </div>
              <div className="course-item" style={{ background: 'rgba(255,255,255,0.08)', padding: '15px', borderRadius: '15px' }}>
                <span>👍 <b style={{ marginLeft: '10px' }}>Klass (Bosh barmoq)</b> - "Ajoyib"</span>
              </div>
            </div>

            <div style={{ marginTop: '25px', padding: '18px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '15px', fontSize: '0.85rem', color: '#bae6fd' }}>
              <p><b>Eslatma:</b> Orqaga qaytish uchun qo'lingizdagi barcha barmoqlarni yopib musht qiling.</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="video-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => setActiveVideo(null)}
            style={{ position: 'absolute', top: '30px', left: '30px', padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 'bold', zIndex: 10001, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Chiqish
          </button>

          <div style={{ width: '95vw', height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              src={activeVideo}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '15px',
                boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
                objectFit: 'contain'
              }}
            ></video>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestureInterface;
