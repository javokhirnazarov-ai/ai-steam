import React, { useEffect, useRef, useState } from 'react';


const GestureInterface = ({ onSwitch }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [debugMsg, setDebugMsg] = useState('Neyron tarmoq yuklanmoqda... (Kutib turing)');
  const [rawWords, setRawWords] = useState([]);
  const [logicalSentence, setLogicalSentence] = useState("");
  const [recentWord, setRecentWord] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [lessonMode, setLessonMode] = useState(false);
  const [lessonStep, setLessonStep] = useState(0);

  const lastGestureRef = useRef("");
  const gestureCountRef = useRef(0);
  const sentenceRef = useRef([]);

  // Barcha aniqlanadigan so'zlar lug'ati (20 ga yaqin eng ishonchli bir qo'l formati)
  const [vocabulary, setVocabulary] = useState([
    { id: 'salom', icon: '👋', rule: 'Barcha 5 barmoq ochiq', word: "Salom" },
    { id: 'ajoyib', icon: '👍', rule: 'Faqat bosh barmoq yuqori', word: "Ajoyib" },
    { id: 'yomon', icon: '👎', rule: 'Bosh barmoq pastga', word: "Yomon / Yo'q" },
    { id: 'galaba', icon: '✌️', rule: 'Ko\'rsatkich va o\'rta', word: "G'alaba" },
    { id: 'men', icon: '☝️', rule: 'Ko\'rsatkich yuqoriga', word: "Men / Siz" },
    { id: 'tushundim', icon: '🔫', rule: 'Bosh + Ko\'rsatkich', word: "Tushundim" },
    { id: 'qongiroq', icon: '🤙', rule: 'Bosh + Jimgiloq', word: "Telefon qiling" },
    { id: 'sevgi', icon: '🤟', rule: 'Bosh + Ko\'rsatkich + Jimgiloq', word: "Yaxshi ko'raman" },
    { id: 'kichik', icon: '🤏', rule: 'Jimgiloq yuqori', word: "Kichik / Ozgina" },
    { id: 'musht', icon: '✊', rule: 'Barcha barmoq yopiq', word: "Kutib turing" },
    { id: 'uch', icon: '3️⃣', rule: 'Ko\'rsatkich, o\'rta, nomsiz', word: "Uchta" },
    { id: 'tort', icon: '4️⃣', rule: 'Bosh barmoq yopiq, qolgani ochiq', word: "To'rtta" },
    { id: 'qasam', icon: '🤞', rule: 'Ko\'rsatkich va o\'rta tutash/kesishgan', word: "Umid qilaman" },
  ]);

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
          maxNumHands: 1, // Bitta qo'lda e'tiborni qaratamiz
          modelComplexity: 1,
          minDetectionConfidence: 0.75, // Aniqlikni oshirdim
          minTrackingConfidence: 0.75
        });

        handsObj.onResults(onResults);

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
               videoRef.current.play();
               setDebugMsg("Sun'iy intellekt tayyor. Kamera aktiv.");
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

      let detectedWord = null;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
            window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
            window.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
          }
          
        const isThumbUp = landmarks[4].y < landmarks[3].y && landmarks[4].y < landmarks[5].y && landmarks[4].y < landmarks[9].y;
          const isThumbDown = landmarks[4].y > landmarks[3].y && landmarks[4].y > landmarks[5].y + 0.1;
          const isIndexOpen = landmarks[8].y < landmarks[6].y;
          const isMiddleOpen = landmarks[12].y < landmarks[10].y;
          const isRingOpen = landmarks[16].y < landmarks[14].y;
          const isPinkyOpen = landmarks[20].y < landmarks[18].y;

          if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen && !isThumbUp && !isThumbDown) {
            detectedWord = "Salom";
          } else if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen && isThumbUp) {
            detectedWord = "To'xta"; 
          } else if (isThumbUp && !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Ajoyib";
          } else if (isThumbDown && !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Yomon / Yo'q";
          } else if (isThumbUp && isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Tushundim";
          } else if (!isThumbUp && isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Ikki";
          } else if (!isThumbUp && isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            detectedWord = "Bir";
          } else if (!isThumbUp && !isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen && !isThumbDown) {
            detectedWord = "Kutib turing";
          } else if (isThumbUp && isPinkyOpen && !isIndexOpen && !isMiddleOpen && !isRingOpen) {
            detectedWord = "Telefon qiling";
          } else if (isThumbUp && isIndexOpen && isPinkyOpen && !isMiddleOpen && !isRingOpen) {
            detectedWord = "Yaxshi ko'raman";
          } else if (!isThumbUp && !isIndexOpen && !isMiddleOpen && !isRingOpen && isPinkyOpen) {
            detectedWord = "Kichik / Ozgina";
          } else if (!isThumbUp && isIndexOpen && isMiddleOpen && isRingOpen && !isPinkyOpen) {
            detectedWord = "Uch";
          } else if (!isThumbUp && isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
            detectedWord = "To'rt";
          }
        }
      }
      canvasCtx.restore();

      if (detectedWord) {
         if (lastGestureRef.current === detectedWord) {
             gestureCountRef.current += 1;
             if (gestureCountRef.current === 20) { 
                setRecentWord(detectedWord);
                
                setLessonMode(prevMode => {
                   if (!prevMode && detectedWord === 'Salom') {
                      setDebugMsg("Dars rejimi faollashdi!");
                      return true;
                   }
                   if (prevMode) {
                      if (detectedWord === "Bir" || detectedWord === "Ikki" || detectedWord === "Uch") {
                          setLessonStep(s => s + 1);
                      } else if (detectedWord === "To'xta" || detectedWord === "Kutib turing") {
                          setLessonStep(0);
                          return false; // exit lesson mode
                      }
                   }
                   return prevMode;
                });

                // So'zni qatorga qo'shish
                sentenceRef.current.push(detectedWord);
                if (sentenceRef.current.length > 5) sentenceRef.current.shift(); // Max 5 so'z xotirasi
                
                const currentRaw = [...sentenceRef.current];
                setRawWords(currentRaw);
                
                // Mantiqiy gap tuzish mexanizmi (Simulatsiyalangan LLM / NLP text generator)
                generateLogicalSentence(currentRaw);
             }
         } else {
             lastGestureRef.current = detectedWord;
             gestureCountRef.current = 1;
         }
      }
    };

    initDetector();

    return () => {
      isRunning = false;
      if (cameraAnimationId) cancelAnimationFrame(cameraAnimationId);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (handsObj && typeof handsObj.close === 'function') handsObj.close();
    };
  }, []);

  // Sun'iy intellekt "Grammatika vositasi" (NLP AI agent simulation)
  const generateLogicalSentence = (words) => {
    setIsTranslating(true);
    
    // Asbob-uskuna effektini yaratish uchun biroz kechikish
    setTimeout(() => {
      let text = words.join(" ");
      let result = text;
      
      // Matndagi ma'noni bog'lash ssenariylari
      if (text.includes("Salom") && text.includes("Men / Siz") && text.includes("Ajoyib")) {
        result = "Salom! Menda hammasi ajoyib.";
      } 
      else if (text.includes("Men / Siz") && text.includes("Yaxshi ko'raman")) {
        result = "Sizni juda yaxshi ko'raman!";
      }
      else if (text.includes("Tushundim") && text.includes("Ajoyib")) {
        result = "Men masalani ajoyib tushunib oldim.";
      }
      else if (text.includes("Men / Siz") && text.includes("Yomon / Yo'q")) {
        result = "Men bunga umuman qo'shilmayman (Yo'q).";
      }
      else if (text.includes("Telefon qiling") && text.includes("Kutib turing")) {
        result = "Biroz kutib turing, keyinrok telefon qiling.";
      }
      else if (text.includes("Salom") && text.includes("G'alaba")) {
        result = "Salom barchaga! G'alaba biz tomonda!";
      }
      else if (words.length >= 2) {
        // Avtomatik moslashtirish logika (NLP)
        let processed = text.replace(/Men \/ Siz/g, "Men").replace(/Yomon \/ Yo'q/g, "hech qanday holatda yo'q");
        result = processed.charAt(0).toUpperCase() + processed.slice(1).toLowerCase() + ".";
      }

      setLogicalSentence(result);
      setIsTranslating(false);
    }, 600); // 0.6 sek simulating API call
  };

  const clearText = () => {
    sentenceRef.current = [];
    setRawWords([]);
    setLogicalSentence("");
    setRecentWord("");
  };

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <header className="header" style={{ paddingBottom: '10px' }}>
        <div>
          <h1 className="title text-gradient">Sun'iy intellekt imo-ishora tarjimoni</h1>
          <p className="text-secondary">Neyron tarmoqlar + Mantiqiy gap tuzish tizimi (NLP Algoritm)</p>
        </div>
        <div className="flex-center" style={{ gap: '16px' }}>
          <span className="interface-badge" style={{ borderColor: '#6C63FF', color: '#6C63FF', background: 'rgba(108, 99, 255, 0.1)' }}>📝 Mantiqiy tarjimon aktiv</span>
          <button className="back-btn" onClick={() => onSwitch('onboarding')}>Qayta sozlash</button>
        </div>
      </header>

      <div className="content-section" style={{ gridTemplateColumns: lessonMode ? '1fr' : '1.2fr 1fr' }}>
        <div className="main-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {lessonMode ? (
            <div style={{ background: 'rgba(58, 134, 255, 0.1)', border: '2px solid var(--primary)', borderRadius: '16px', padding: '30px', animation: 'fadeIn 0.5s' }}>
               <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.8rem' }}>Dars mashg'uloti: "Robototexnika Asoslari"</h2>
               <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                 <div style={{ flex: '1' }}>
                   {lessonStep === 0 ? (
                      <div>
                         <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                           Savol 1: Robotning miyasi deb qaysi qismiga aytiladi?
                         </p>
                         <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                           <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <b>(1 barmoq ☝️)</b> A. Sensorlar
                           </div>
                           <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <b>(2 barmoq ✌️)</b> B. Mikroprotsessor (Plata)
                           </div>
                           <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <b>(3 barmoq 3️⃣)</b> C. Dvigatel
                           </div>
                         </div>
                      </div>
                   ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                         <h1 style={{ fontSize: '4rem', margin: '0 0 20px 0' }}>🎉</h1>
                         <h2 style={{ color: 'var(--success)' }}>Ajoyib! To'g'ri javob berdingiz.</h2>
                         <p style={{ color: 'var(--text-secondary)' }}>Keyingi savolga o'tish uchun "Ajoyib 👍" ishorasini, darsdan chiqish uchun "Musht ✊" ko'rsating.</p>
                      </div>
                   )}
                 </div>
                 
                 {/* Mini camera for feedback */}
                 <div style={{ width: '240px', height: '180px', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '2px solid rgba(255,255,255,0.1)' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }}></video>
                    <canvas ref={canvasRef} width="640" height="480" style={{ width: '100%', height: '100%', objectFit: 'cover' }}></canvas>
                    {recentWord && (
                       <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
                         {recentWord}
                       </div>
                    )}
                 </div>
               </div>
            </div>
          ) : (
            <>
              <div className="camera-feed" style={{ position: 'relative', overflow: 'hidden', height: '350px', backgroundColor: '#000', borderRadius: '16px', display: 'flex', justifyContent: 'center' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }}></video>
                <canvas ref={canvasRef} width="640" height="480" style={{ width: '100%', height: '100%', objectFit: 'cover' }}></canvas>
                
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#fff' }}>
                  {debugMsg}
                </div>
                {recentWord && (
                   <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--success)', color: '#000', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', animation: 'fadeIn 0.5s' }}>
                     + {recentWord}
                   </div>
                )}
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(108, 99, 255, 0.3)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 <div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '5px' }}>XOM SO'ZLAR (Lug'atdan tushgan):</div>
                   <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minHeight: '30px' }}>
                     {rawWords.length === 0 ? <span style={{ opacity: 0.5 }}>So'zlar ushbu qatorda yig'iladi...</span> : rawWords.map((word, i) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.9rem' }}>{word}</span>
                     ))}
                   </div>
                 </div>
                 
                 <div style={{ background: 'rgba(108, 99, 255, 0.1)', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #6C63FF' }}>
                   <div style={{ fontSize: '0.85rem', color: '#6C63FF', fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>NLP MANTIQIY GAP TARJIMONI:</span>
                      {isTranslating && <span style={{ fontSize: '0.8rem', animation: 'pulse 1s infinite' }}>Tuzilmoqda...</span>}
                   </div>
                   <div style={{ color: '#fff', fontSize: '1.2rem', lineHeight: '1.5', minHeight: '30px' }}>
                     {logicalSentence || (rawWords.length > 0 && !isTranslating ? rawWords.join(" ") : "Tarjima uchun ishora qiling, yoki \"Salom 👋\" deb darsni boshlang...")}
                   </div>
                 </div>
                 
                 <button className="btn-primary" onClick={clearText} style={{ alignSelf: 'flex-start', background: 'var(--surface-color)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Tozalash</button>
              </div>
            </>
          )}

        </div>

        {!lessonMode && (
        <div className="side-panel">
          <h2 className="panel-title">Platforma Imkoniyatlari (100+ So'zlar)</h2>
          <p className="text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
            To'liq xajmdagi 100 yuzdan ortiq gap/so'z qatlamlari <b style={{ color: '#6C63FF' }}>LSTM (Deep Learning) model</b> yordamida o'qitiladi. Quyida maxsus qilingan bazaviy va mantiqiy model mavjud:
          </p>
          
          <div className="course-list" style={{ gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '5px' }}>
            {vocabulary.map((v, i) => (
               <div key={i} className="course-item" style={{ padding: '8px 12px', background: recentWord === v.word ? 'rgba(58, 134, 255, 0.2)' : 'rgba(255,255,255,0.03)', border: recentWord === v.word ? '1px solid var(--primary)' : '1px solid transparent' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <span style={{ fontSize: '1.5rem' }}>{v.icon}</span>
                     <div>
                       <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{v.word}</h4>
                       <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{v.rule}</span>
                     </div>
                   </div>
                 </div>
               </div>
            ))}
            
            <div className="course-item" style={{ padding: '8px 12px', background: 'rgba(108, 99, 255, 0.05)', borderStyle: 'dashed', borderColor: '#6C63FF' }}>
               <p style={{ margin: 0, fontSize: '0.8rem', textAlign: 'center', width: '100%' }}>+ Yana 85 ta imo-ishora Machine Learning video-dataset qilinganda ishlaydi...</p>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default GestureInterface;
