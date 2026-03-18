import React, { useState, useEffect, useRef } from 'react';


const STEPS = {
  INTRO: 'intro',
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

  const startOnboarding = () => setStep(STEPS.PERMISSION);

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
            recognition.continuous = true; // Uzluksiz eshitish
            recognition.onresult = (event) => {
                const cmd = event.results[event.results.length - 1][0].transcript.toLowerCase();
                setVoiceTranscript(cmd);
                console.log("Onboarding Voice CMD:", cmd);
                
                if (cmd.includes('boshla')) {
                    if (step === STEPS.INTRO) startOnboarding();
                    if (cmd.includes('ovoz') || cmd.includes('dars')) {
                       onComplete('voice'); // To'g'ridan-to'g'ri ovozli portal/darsga o'tish
                    }
                }
            };
            recognition.onstart = () => setIsListeningForCommand(true);
            recognition.onerror = () => { setIsListeningForCommand(false); if (step === STEPS.INTRO) setTimeout(() => { try { recognition.start(); } catch(e) {} }, 1000); };
            recognition.onend = () => { setIsListeningForCommand(false); if (step === STEPS.INTRO) setTimeout(() => { try { recognition.start(); } catch(e) {} }, 500); };
            try { recognition.start(); } catch(e) {}
            return () => { recognition.onend = null; recognition.onerror = null; recognition.stop(); };
        }
    }
  }, [step]);

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
    <div className="onboarding-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff' }}>
      <div style={{ maxWidth: '800px', width: '90%', background: 'rgba(255,255,255,0.02)', padding: '60px 40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        
        {step === STEPS.INTRO && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '15px' }}>
              <span style={{ color: '#7B61FF' }}>Inclusive</span> STEAM AI
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>
               Barchaga moslashtirilgan ta'lim platformasiga xush kelibsiz.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '50px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ background: '#FF7E7E', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.5rem' }}>🧠</div>
                 <h4 style={{ fontSize: '1.1rem' }}>Aqlli tahlil paneli</h4>
                 <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Holatni aniqlash</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ background: '#A0A0A0', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.5rem' }}>🗣️</div>
                 <h4 style={{ fontSize: '1.1rem' }}>Ovozli interfeys</h4>
                 <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Gapirib boshqarish</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ background: '#FFD700', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.5rem' }}>✋</div>
                 <h4 style={{ fontSize: '1.1rem' }}>Imo-ishora</h4>
                 <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Harakatlar orqali</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ background: '#5DE2A2', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.5rem' }}>🎧</div>
                 <h4 style={{ fontSize: '1.1rem' }}>Audio / Eshitish</h4>
                 <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Ko'zi ojizlar uchun</p>
              </div>
            </div>

            {isListeningForCommand && (
              <div className="voice-indicator animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7B61FF', fontWeight: 'bold' }}>
                  <div className="pulse-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#7B61FF', animation: 'pulse 1.5s infinite' }}></div>
                  <span>Sizni eshityapman...</span>
                </div>
                {voiceTranscript && (
                  <p style={{ fontStyle: 'italic', opacity: 0.8, color: 'var(--accent-secondary)' }}>"{voiceTranscript}"</p>
                )}
              </div>
            )}
            <button onClick={startOnboarding} style={{ background: 'linear-gradient(90deg, #7B61FF 0%, #00D2FF 100%)', color: '#fff', border: 'none', padding: '18px 60px', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 auto', boxShadow: '0 10px 30px rgba(123, 97, 255, 0.3)' }}>
               Boshlash 
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </button>
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
