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
    // Sentyabr landing sahifasida ovozli buyruqlarni yanada aniqroq eshitish
    if (step === STEPS.INTRO || step === STEPS.RESULT) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'uz-UZ';
            recognition.continuous = true;
            recognition.interimResults = true; // Judiyam muhim: Kutmasdan darhol javob qaytarish uchun
            
            let isActive = true;

            recognition.onresult = (event) => {
                let txt = '';
                for (let i = 0; i < event.results.length; i++) {
                    txt += event.results[i][0].transcript;
                }
                const cmd = txt.toLowerCase().trim();
                setVoiceTranscript(cmd);
                
                if (/boshla|davom|kir|yur|ketdik/.test(cmd)) {
                    if (step === STEPS.INTRO) setStep(STEPS.OPTIONS);
                }
                if (/ovoz|dars/.test(cmd)) {
                    onComplete('voice');
                }
            };
            
            recognition.onstart = () => setIsListeningForCommand(true);
            recognition.onerror = (e) => { 
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    isActive = false;
                    setIsListeningForCommand(false);
                    setVoiceTranscript("Mikrofonga ruxsat yo'q. Brauzerdan ruxsat bering.");
                }
            };
            recognition.onend = () => { 
                if (step === STEPS.INTRO && isActive) {
                    setTimeout(() => { try { recognition.start(); } catch(err) {} }, 300); 
                }
            };
            
            try { recognition.start(); } catch(e) {}
            
            return () => { 
                isActive = false; 
                try { recognition.stop(); } catch(e) {} 
            };
        }
    }
  }, [step, onComplete]);

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
    <div className="onboarding-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', color: '#fff' }}>
      <div style={{ maxWidth: '800px', width: '90%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '60px 40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        
        {step === STEPS.INTRO && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              Inclusive STEAM AI
            </h1>
            <p style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.9)', marginBottom: '50px' }}>
               Barchaga moslashtirilgan ta'lim platformasiga xush kelibsiz.
            </p>

            <div style={{ height: '80px', marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {isListeningForCommand && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <div className="pulse-dot" style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }}></div>
                    <span style={{color: '#fff'}}>Sizni eshityapman...</span>
                  </div>
                  {voiceTranscript && (
                    <p style={{ fontStyle: 'italic', fontWeight: '500', color: '#fff', margin: 0, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>"{voiceTranscript}"</p>
                  )}
                </div>
              )}
            </div>
            <button onClick={startOnboarding} style={{ background: '#fff', color: '#0072ff', border: 'none', padding: '18px 60px', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0, 114, 255, 0.3)', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
               Boshlash 
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {step === STEPS.OPTIONS && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Imkoniyatni tanlang</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '40px', fontSize: '1.1rem' }}>O'zingizga qulay bo'lgan boshqaruv turini tanlang</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div onClick={() => setStep(STEPS.PERMISSION)} style={{ background: 'rgba(255,255,255,0.2)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                 <div style={{ background: '#FF7E7E', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.8rem', boxShadow: '0 5px 15px rgba(255,126,126,0.4)' }}>🧠</div>
                 <h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Aqlli tahlil paneli</h4>
                 <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Holatni aniqlash</p>
              </div>
              <div onClick={() => onComplete('voice')} style={{ background: 'rgba(255,255,255,0.2)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                 <div style={{ background: '#A0A0A0', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.8rem', boxShadow: '0 5px 15px rgba(160,160,160,0.4)' }}>🗣️</div>
                 <h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Ovozli interfeys</h4>
                 <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Gapirib boshqarish</p>
              </div>
              <div onClick={() => onComplete('gesture')} style={{ background: 'rgba(255,255,255,0.2)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                 <div style={{ background: '#FFD700', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.8rem', boxShadow: '0 5px 15px rgba(255,215,0,0.4)' }}>✋</div>
                 <h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Imo-ishora</h4>
                 <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Harakatlar orqali</p>
              </div>
              <div onClick={() => onComplete('audio')} style={{ background: 'rgba(255,255,255,0.2)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                 <div style={{ background: '#5DE2A2', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.8rem', boxShadow: '0 5px 15px rgba(93,226,162,0.4)' }}>🎧</div>
                 <h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Audio / Eshitish</h4>
                 <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Ko'zi ojizlar uchun</p>
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
