import React, { useState, useEffect, useRef } from 'react';


const STEPS = {
  INTRO: 'intro',
  OPTIONS: 'options',
  PERMISSION: 'permission',
  TESTING: 'testing',
  RESULT: 'result'
};

const SmartOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(STEPS.INTRO);
  const [testProgress, setTestProgress] = useState(0);
  const [testStage, setTestStage] = useState('');
  const [recommended, setRecommended] = useState('');
  const [isListeningForCommand, setIsListeningForCommand] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [micStatusError, setMicStatusError] = useState('');
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const startOnboarding = () => setStep(STEPS.OPTIONS);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStep(STEPS.TESTING);
      runTests();
    } catch (err) {
      setStep(STEPS.TESTING);
      runTests();
    }
  };

  useEffect(() => {
    if (step === STEPS.INTRO || step === STEPS.RESULT) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'uz-UZ';
            recognition.continuous = true;
            recognition.interimResults = true;
            
            let isActive = true;
            let isRunning = false;

            let audioContext = null;
            let analyser = null;
            let source = null;
            let animationFrameId = null;

            const startVolumeAnalyzer = (stream) => {
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContextClass) return;
                    
                    audioContext = new AudioContextClass();
                    analyser = audioContext.createAnalyser();
                    source = audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyser.fftSize = 256;
                    
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    
                    let silentFrames = 0;
                    let soundDetected = false;
                    
                    const checkVolume = () => {
                        if (!isActive) return;
                        analyser.getByteFrequencyData(dataArray);
                        
                        let sum = 0;
                        for (let i = 0; i < bufferLength; i++) {
                            sum += dataArray[i];
                        }
                        const average = sum / bufferLength;
                        
                        if (average < 1.5) {
                            silentFrames++;
                            if (silentFrames > 150 && !soundDetected) {
                                setMicStatusError("Mikrofoningizdan audio signal kelmayapti (mutlaqo jimjitlik). Iltimos, Windows sozlamalaridan mikrofon ovozi balandligini tekshiring yoki mikrofondagi jismoniy o'chirgichni yoqing!");
                            }
                        } else {
                            silentFrames = 0;
                            soundDetected = true;
                            setMicStatusError(""); // Clear error as sound is being received!
                        }
                        
                        animationFrameId = requestAnimationFrame(checkVolume);
                    };
                    
                    checkVolume();
                } catch(err) {
                    console.warn("Volume analyzer error:", err);
                }
            };

            const safeStart = async () => {
                if (isRunning || !isActive) return;
                try {
                    const constraints = {
                        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
                    };
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    
                    // List all available microphones to let the user choose
                    try {
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        const mics = devices.filter(d => d.kind === 'audioinput' && d.label);
                        setAudioDevices(mics);
                    } catch(e) {
                        console.warn("Device enumeration failed:", e);
                    }

                    // Start live audio volume diagnostics
                    startVolumeAnalyzer(stream);

                    if (isActive && !isRunning) {
                        try {
                            recognition.start();
                        } catch(e) {
                            console.warn("SpeechRecognition start error:", e);
                        }
                    }
                } catch(err) {
                    console.warn("Microphone access denied:", err);
                    if (isActive) {
                        setIsListeningForCommand(false);
                        setMicStatusError("Mikrofonga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan ruxsat bering.");
                    }
                }
            };

            recognition.onstart = () => {
                setIsListeningForCommand(true);
                isRunning = true;
                setMicStatusError("");
            };
            
            recognition.onerror = (e) => { 
                console.error("SpeechRecognition error:", e.error);
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    isRunning = false;
                    setIsListeningForCommand(false);
                    setMicStatusError("Mikrofon bloklangan yoki ekranga bosilmagan. Faollash uchun ekranning istalgan joyiga bosing.");
                } else if (e.error === 'network') {
                    isRunning = false;
                    setIsListeningForCommand(false);
                    setMicStatusError("Internet aloqasi yo'q. Google Chrome ovoz tahlili uchun faol internet kerak!");
                } else if (e.error === 'no-speech') {
                    // Ignored
                } else {
                    isRunning = false;
                    setMicStatusError(`Ovoz tahlilida xatolik: ${e.error}`);
                }
            };
            
            recognition.onend = () => { 
                isRunning = false;
                if (step === STEPS.INTRO && isActive) {
                    setTimeout(() => { safeStart(); }, 400); 
                }
            };

            recognition.onresult = (event) => {
                let txt = '';
                for (let i = 0; i < event.results.length; i++) {
                    txt += event.results[i][0].transcript;
                }
                
                const cmd = txt.toLowerCase().trim();
                if (cmd) {
                    setVoiceTranscript(txt); // Reflect the exact spoken text live on the screen!
                    console.log("Onboarding speech heard live:", cmd);
                    
                    if (/boshla|bosla|bo'shla|bo‘shla|start|kir|yur|ketdik|ovoz|dars/.test(cmd)) {
                        console.log("Command matched! Transitioning to VoiceInterface...");
                        onComplete('voice');
                    }
                }
            };
            
            // Try to start immediately on mount
            safeStart();

            // Bypasses browser user-interaction rules. Starts mic as soon as the user clicks anywhere!
            const handleGlobalClick = () => {
                if (isActive && !isRunning) {
                    console.log("User clicked screen. Force-starting microphone...");
                    safeStart();
                }
            };
            window.addEventListener('click', handleGlobalClick);
            
            return () => { 
                isActive = false; 
                window.removeEventListener('click', handleGlobalClick);
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                if (audioContext) {
                    try { audioContext.close(); } catch(e) {}
                }
                try { recognition.stop(); } catch(e) {} 
            };
        } else {
            setMicStatusError("Sizning brauzeringiz ovoz boshqaruvini qo'llab-quvvatlamaydi. Iltimos Google Chrome yoki Microsoft Edge ishlating.");
        }
    }
  }, [step, onComplete, selectedDeviceId]);

  const runTests = () => {
    const stages = ["Ovozli tahlil...", "Imo-ishora tahlili...", "Natijani kutish..."];
    let progress = 0;
    stages.forEach((s, i) => {
      setTimeout(() => { setTestStage(s); }, i * 2000);
      const interval = setInterval(() => {
        setTestProgress(p => p < 100 ? p + 1 : 100);
      }, 60);
      setTimeout(() => clearInterval(interval), (i+1) * 2000);
    });
    setTimeout(() => { setRecommended('audio'); setStep(STEPS.RESULT); }, 6000);
  };

  return (
    <div className="onboarding-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #061730 0%, #1c3d5e 100%)', color: '#fff' }}>
      <div style={{ maxWidth: '800px', width: '90%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '60px 40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        
        {step === STEPS.INTRO && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              Inclusive STEAM AI
            </h1>
            <p style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.9)', marginBottom: '50px' }}>
               Barchaga moslashtirilgan ta'lim platformasiga xush kelibsiz.
            </p>

            <button 
              onClick={async () => {
                try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch(e) {}
                startOnboarding();
              }} 
              style={{ background: '#fff', color: '#0072ff', border: 'none', padding: '18px 60px', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0, 114, 255, 0.3)', transition: 'transform 0.3s' }} 
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} 
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
               Boshlash 
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </button>

            {/* Spoken text displayed right below the button */}
            <div style={{ marginTop: '40px', minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              {micStatusError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px 20px', borderRadius: '15px', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.95rem', maxWidth: '450px', margin: '10px auto', textShadow: 'none', lineHeight: '1.4' }}>
                  ⚠️ {micStatusError}
                </div>
              )}

              {/* Microphone device selector dropdown */}
              {audioDevices.length > 1 && (
                <div style={{ margin: '15px auto 25px', background: 'rgba(255, 255, 255, 0.08)', padding: '15px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px', boxShadown: '0 8px 32px rgba(0,0,0,0.2)' }}>
                  <label htmlFor="mic-select" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    🎤 Telegramdagi to'g'ri mikrofonni tanlang:
                  </label>
                  <select 
                    id="mic-select"
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      setIsListeningForCommand(false);
                      setVoiceTranscript('');
                      setMicStatusError('');
                    }}
                    style={{ background: '#1c3d5e', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 15px', borderRadius: '12px', fontSize: '0.95rem', cursor: 'pointer', outline: 'none', width: '100%', fontWeight: '500', transition: 'all 0.3s' }}
                  >
                    <option value="">Standart Mikrofon</option>
                    {audioDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Mikrofon (${d.deviceId.slice(0, 5)})`}</option>
                    ))}
                  </select>
                </div>
              )}

              {isListeningForCommand && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>
                  <div className="pulse-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981', animation: 'pulse 1.5s infinite' }}></div>
                  <span>Mikrofon yoniq (Eshityapman...)</span>
                </div>
              )}
              {voiceTranscript ? (
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px 25px', borderRadius: '15px', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px' }}>Eshitilgan ovozli buyruq:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10B981' }}>"{voiceTranscript}"</span>
                </div>
              ) : (
                isListeningForCommand && !micStatusError && (
                  <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>"Boshlash" deb ayting...</span>
                )
              )}
            </div>
          </div>
        )}

        {step === STEPS.OPTIONS && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Imkoniyatni tanlang</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '40px', fontSize: '1.1rem' }}>O'zingizga qulay bo'lgan boshqaruv turini tanlang</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div onClick={() => onComplete('gesture')} style={{ background: 'rgba(255,255,255,0.2)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                 <div style={{ background: '#FFD700', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.8rem', boxShadow: '0 5px 15px rgba(255,215,0,0.4)' }}>✋</div>
                 <h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Imo-ishora</h4>
                 <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Harakatlar orqali</p>
              </div>
              <div onClick={() => onComplete('voice')} style={{ background: 'rgba(255,255,255,0.2)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                 <div style={{ background: '#A0A0A0', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.8rem', boxShadow: '0 5px 15px rgba(160,160,160,0.4)' }}>🗣️</div>
                 <h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Ovozli interfeys</h4>
                 <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Gapirib boshqarish</p>
              </div>
            </div>
            <button onClick={() => setStep(STEPS.INTRO)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '12px 30px', borderRadius: '15px', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Orqaga qaytish</button>
          </div>
        )}

        {step === STEPS.PERMISSION && (
          <div className="animate-fade-in" style={{ padding: '40px 0' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Ruxsatlarni olish</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>Tahlil qilishimiz uchun kamera va mikrofonga ruxsat bering.</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button onClick={requestPermissions} style={{ background: '#7B61FF', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '15px', fontSize: '1.1rem', cursor: 'pointer' }}>Ruxsat berish</button>
              <button onClick={() => { setStep(STEPS.TESTING); runTests(); }} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '15px', fontSize: '1.1rem', cursor: 'pointer' }}>O'tkazib yuborish</button>
            </div>
          </div>
        )}

        {step === STEPS.TESTING && (
          <div className="animate-fade-in" style={{ padding: '40px 0' }}>
            <div style={{ width: '300px', height: '220px', margin: '0 auto 30px', borderRadius: '20px', overflow: 'hidden', background: '#000', border: '2px solid #7B61FF' }}>
               <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>{testStage}</h3>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
               <div style={{ width: `${testProgress}%`, height: '100%', background: '#7B61FF', transition: 'width 0.1s' }}></div>
            </div>
          </div>
        )}

        {step === STEPS.RESULT && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Tahlil tayyor! 🎉</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>Siz uchun tanlangan eng qulay interfeys:</p>
            
            <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '30px', borderRadius: '25px', border: '1px solid #00D2FF', display: 'flex', alignItems: 'center', gap: '20px', margin: '0 auto 50px', textAlign: 'left' }}>
               <div style={{ fontSize: '3rem' }}>🎧</div>
               <div>
                  <h4 style={{ fontSize: '1.3rem', color: '#00D2FF' }}>Audio Interfeys</h4>
                  <p style={{ opacity: 0.6 }}>Ovoz va eshitish orqali boshqarish tizimi.</p>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <button onClick={() => onComplete('gesture')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '20px', borderRadius: '20px', cursor: 'pointer' }}>✋ Imo-ishora</button>
              <button onClick={() => onComplete('voice')} style={{ background: 'rgba(255,255,255,0.03)', border: '2px solid #00D2FF', color: '#fff', padding: '20px', borderRadius: '20px', cursor: 'pointer' }}>🎙️ Audio Portal</button>
              <button onClick={() => onComplete('standard')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '20px', borderRadius: '20px', cursor: 'pointer' }}>🖱️ Standart</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SmartOnboarding;
