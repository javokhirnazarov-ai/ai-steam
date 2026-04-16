import React, { useEffect, useRef, useState } from 'react';


const GestureInterface = ({ onSwitch }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [debugMsg, setDebugMsg] = useState('Neyron tarmoq yuklanmoqda... (Kutib turing)');
  const [rawWords, setRawWords] = useState([]);
  const [logicalSentence, setLogicalSentence] = useState("");
  const [recentWord, setRecentWord] = useState("");
  const [view, setView] = useState('translator'); // 'translator', 'modules', 'module1', 'module2'
  const [history, setHistory] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [debugData, setDebugData] = useState({ word: 'Yo\'q', xDiff: 0, yDiff: 0 });
  const [isTranslating, setIsTranslating] = useState(false);

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
      title: "1-Modul: Sun'iy intellekt va STEAM",
      themes: [
        { id: "1.1", name: "Sun'iy intellektga kirish" },
        { id: "1.2", name: "STEAM ta'limi asoslari" },
        { id: "1.3", name: "Algoritmlar va mantiq" },
        { id: "1.4", name: "Neyron tarmoqlar qanday ishlaydi?" },
        { id: "1.5", name: "Kelajak texnologiyalari" }
      ]
    },
    2: {
      title: "2-Modul: Robototexnika va Muhandislik",
      themes: [
        { id: "2.1", name: "Elektronika asoslari" },
        { id: "2.2", name: "Datchiklar va sensorlar" },
        { id: "2.3", name: "Robotlarni modellashtirish" },
        { id: "2.4", name: "Blokli dasturlash" },
        { id: "2.5", name: "Aqlli uy tizimlari" }
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
        try { await handsObj.send({ image: videoRef.current }); } catch (e) {}
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
        console.log('Hand detected', results.multiHandLandmarks.length);
        for (const landmarks of results.multiHandLandmarks) {
          if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
            window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
            window.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
          }
          
          const isThumbOpen = Math.abs(landmarks[4].x - landmarks[2].x) > 0.08 || landmarks[4].y < landmarks[2].y - 0.05;
          const isIndexOpen = landmarks[8].y < landmarks[6].y + 0.05; 
          const isMiddleOpen = landmarks[12].y < landmarks[10].y + 0.05;
          const isRingOpen = landmarks[16].y < landmarks[14].y + 0.05;
          const isPinkyOpen = landmarks[20].y < landmarks[18].y + 0.05;

          // 5 barmoq ochiq (Modullar)
          if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen && isThumbOpen) {
            detectedWord = "Modullar";
          } 
          // ✊ Musht (Orqaga qaytish)
          else if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Orqaga";
          }
          // ☝️ Bir barmoq (1-Modul) - Index ochiq, qolgan 3 tasi yopiq, bosh barmoq muhim emas
          else if (isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Bir";
          }
          // ✌️ Ikki barmoq (2-Modul) - Index va O'rta ochiq, qolgan 2 tasi yopiq
          else if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Ikki";
          }
          else if (isThumbOpen && !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Ajoyib";
          }
        }
      }
      canvasCtx.restore();

      // Update Debug Info
      setDebugData({ word: detectedWord, xDiff: 0, yDiff: 0 });

      if (detectedWord !== "Ishora kutilmoqda...") {
         if (lastGestureRef.current === detectedWord) {
             gestureCountRef.current += 1;
             const requiredCount = (detectedWord === "Orqaga" || detectedWord === "Bir" || detectedWord === "Ikki") ? 6 : 12; 
             if (gestureCountRef.current === requiredCount) { 
                setRecentWord(detectedWord);
                
                if (detectedWord === "Modullar") {
                  if (view !== 'modules') navigateTo('modules');
                } else if (detectedWord === "Orqaga") {
                  goBack();
                } else if (detectedWord === "Bir" && view === 'modules') {
                  navigateTo('module1');
                } else if (detectedWord === "Ikki" && view === 'modules') {
                  navigateTo('module2');
                }

                if (view === 'translator') {
                  sentenceRef.current.push(detectedWord);
                  if (sentenceRef.current.length > 5) sentenceRef.current.shift();
                  const currentRaw = [...sentenceRef.current];
                  setRawWords(currentRaw);
                  generateLogicalSentence(currentRaw);
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
              <button 
                className="interface-card" 
                style={{ background: 'rgba(58, 134, 255, 0.1)', border: '2px solid var(--primary)', height: '200px' }}
                onClick={() => navigateTo('module1')}
              >
                <span style={{ fontSize: '3rem' }}>🤖</span>
                <h3>1-Modul</h3>
                <p>AI va STEAM</p>
              </button>
              <button 
                className="interface-card" 
                style={{ background: 'rgba(255, 186, 8, 0.1)', border: '2px solid #FFBA08', height: '200px' }}
                onClick={() => navigateTo('module2')}
              >
                <span style={{ fontSize: '3rem' }}>⚙️</span>
                <h3>2-Modul</h3>
                <p>Robototexnika</p>
              </button>
            </div>
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
               <button className="back-btn" onClick={goBack}>👈 Orqaga</button>
            </div>
          </div>
        );

      case 'module1':
      case 'module2':
        const modId = view === 'module1' ? 1 : 2;
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
                    <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '10px' }}>📺 Videodars</button>
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
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(108, 99, 255, 0.3)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <div style={{ background: 'rgba(108, 99, 255, 0.1)', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #6C63FF' }}>
                 <div style={{ fontSize: '0.85rem', color: '#6C63FF', fontWeight: 'bold', marginBottom: '8px' }}>
                    NLP MANTIQIY GAP TARJIMONI:
                 </div>
                 <div style={{ color: '#fff', fontSize: '1.2rem', lineHeight: '1.5', minHeight: '30px' }}>
                   {logicalSentence || "Tarjima uchun ishora qiling, yoki barcha barmoqlarni ochib \"Modullar\"ga o'ting..."}
                 </div>
               </div>
               <button className="btn-primary" onClick={clearText} style={{ alignSelf: 'flex-start', background: 'var(--surface-color)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Tozalash</button>
            </div>
          ) : (
            renderView()
          )}
        </div>

        {view === 'translator' && (
          <div className="side-panel">
            <h2 className="panel-title">👋 Ishoralar ro'yxati</h2>
            <div className="course-list" style={{ gap: '8px' }}>
              <div className="course-item">
                <span>👋 <b style={{marginLeft: '10px'}}>Ochiq kaft</b> - Modullarni ochish</span>
              </div>
              <div className="course-item">
                <span>✊ <b style={{marginLeft: '10px'}}>Musht (Fist)</b> - Orqaga qaytish</span>
              </div>
              <div className="course-item">
                <span>☝️ <b style={{marginLeft: '10px'}}>Ko'rsatkich</b> - "Bir" so'zi / Tanlash</span>
              </div>
              <div className="course-item">
                <span>👍 <b style={{marginLeft: '10px'}}>Klass (Bosh barmoq)</b> - "Ajoyib"</span>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', fontSize: '0.8rem' }}>
               <p><b>Eslatma:</b> Orqaga qaytish uchun qo'lingizdagi barcha barmoqlarni yopib musht qiling.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestureInterface;
