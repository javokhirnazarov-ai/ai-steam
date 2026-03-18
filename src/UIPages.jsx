import React, { useState, useEffect, useRef } from 'react';

// --- SHARED COMPONENTS ---
const InterfaceBadge = ({ icon, text, active }) => (
    <span className="interface-badge" style={active ? { borderColor: 'var(--success)', color: 'var(--success)' } : {}}>
        {icon} {text}
    </span>
);

// --- 1. SMART ONBOARDING ---
export const SmartOnboarding = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        if (step === 2) {
            setAnalyzing(true);
            const interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            setAnalyzing(false);
                            setStep(3);
                        }, 500);
                        return 100;
                    }
                    return p + 2;
                });
            }, 50);

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                }).catch(err => console.log("Camera blocked", err));
            }
            return () => clearInterval(interval);
        }
    }, [step]);

    return (
        <div className="onboarding-container flex-center">
            <div className="bg-orb orb-1"></div>
            <div className="bg-orb orb-2"></div>

            <div className="onboarding-card glass-panel animate-fade-in">
                {step === 1 && (
                    <div className="intro-step text-center">
                        <h1 className="text-gradient">Inclusive STEAM AI</h1>
                        <p className="subtitle">Siz uchun eng qulay ta'lim interfeysini aniqlaymiz</p>
                        <div className="feature-list">
                            <div className="feat-card">
                                <span>🤖 Smart Onboarding</span>
                            </div>
                        </div>
                        <button className="btn-primary" onClick={() => setStep(2)}>Boshlash</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="analysis-step text-center">
                        <div className="video-container">
                            <video ref={videoRef} autoPlay playsInline className="scanner-video" />
                            <div className="scanner-overlay"></div>
                        </div>
                        <h2 className="pulse-text">Interfeys tahlil qilinmoqda...</h2>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="hint">Kamera va mikrofoningiz orqali ehtiyojlaringizni o'rganyapman</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="result-step animate-fade-in">
                        <h2 className="text-center">Tavsiya etilgan interfeys</h2>
                        <div className="recommended-badge">
                            <div className="badge-icon">🎙️</div>
                            <div className="badge-info">
                                <h4>Ovozli boshqaruv</h4>
                                <span>Siz uchun eng qulay muloqot usuli</span>
                            </div>
                        </div>
                        <div className="interface-grid">
                            <button className="interface-card recommended-highlight" onClick={() => onComplete('voice')}>
                                <span className="emoji">🎙️</span><span>Ovozli</span>
                            </button>
                            <button className="interface-card" onClick={() => onComplete('gesture')}>
                                <span className="emoji">🖐️</span><span>Imo-ishora</span>
                            </button>
                            <button className="interface-card" onClick={() => onComplete('audio')}>
                                <span className="emoji">🎧</span><span>Audio</span>
                            </button>
                            <button className="interface-card" onClick={() => onComplete('standard')}>
                                <span className="emoji">🖱️</span><span>Standart</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 2. DASHBOARD (Standard) ---
export const Dashboard = ({ onSwitch }) => (
    <div className="dashboard-wrapper animate-fade-in">
        <header className="header">
            <div>
                <h1 className="title text-gradient">Asosiy panel</h1>
                <p className="text-secondary">Standart boshqaruv interfeysi</p>
            </div>
            <div className="flex-center" style={{ gap: '16px' }}>
                <InterfaceBadge icon="🖱️" text="Standart" />
                <button className="back-btn" onClick={() => onSwitch('onboarding')}>Qayta sozlash</button>
            </div>
        </header>
        <div className="stats-grid">
            {[{ l: "O'zlashtirish", v: "78%" }, { l: "Darslar", v: "12/24" }, { l: "Vaqt", v: "14s" }, { l: "Test", v: "Kutilmoqda" }].map((s, i) => (
                <div key={i} className="stat-card">
                    <span className="stat-label">{s.l}</span>
                    <span className="stat-value">{s.v}</span>
                </div>
            ))}
        </div>
        <div className="content-section">
            <div className="main-panel">
                <h2 className="panel-title">Mening kurslarim</h2>
                <div className="course-list">
                    {["Sun'iy Intelekt", "Robototexnika", "Dasturlash"].map(c => (
                        <div key={c} className="course-item">
                            <div className="course-info"><h4>{c}</h4><p>Modul 1: Kirish</p></div>
                            <div className="progress-circle"><div className="progress-inner">50%</div></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="side-panel">
                <h2 className="panel-title">Haftalik maqsad</h2>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '16px' }}>
                    <div className="progress-circle" style={{ width: '120px', height: '120px' }}>
                        <span style={{ fontSize: '2rem' }}>3/5</span>
                    </div>
                    <button className="btn-primary" style={{ width: '100%' }}>Davom etish</button>
                </div>
            </div>
        </div>
    </div>
);

// --- 3. VOICE & AUDIO INTERFACE (Consolidated) ---
export const AdaptiveInterface = ({ onSwitch, mode = 'voice' }) => {
    const [listening, setListening] = useState(false);
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'uz-UZ';
            window.speechSynthesis.speak(msg);
        }
    };

    useEffect(() => {
        speak(mode === 'voice' ? "Ovozli portalga xush kelibsiz" : "Audio portal rasmida tinglang");
        return () => window.speechSynthesis.cancel();
    }, [mode]);

    return (
        <div className="dashboard-wrapper animate-fade-in" style={mode === 'audio' ? { background: '#000' } : {}}>
            <header className="header">
                <h1 className="title" style={mode === 'audio' ? { color: '#ffb300' } : {}}>{mode === 'voice' ? 'Ovozli Portal' : 'Audio Interfeys'}</h1>
                <button className="back-btn" onClick={() => onSwitch('onboarding')}>Chiqish</button>
            </header>
            <div className="main-panel" style={{ textAlign: 'center', padding: '100px 0' }}>
                <div onClick={() => setListening(!listening)} style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(123, 97, 255, 0.1)', border: '4px solid var(--accent-primary)', margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '4rem' }}>{listening ? '🎤' : '🎙️'}</span>
                </div>
                <h2>{listening ? "Eshitmoqdaman..." : "Boshlash uchun bosing"}</h2>
                <div className="audio-btn-list" style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className="audio-btn" onFocus={() => speak("Birinchi dars")}>1. Birinchi darsni boshlash</button>
                    <button className="audio-btn" onFocus={() => speak("Ikkinchi dars")}>2. Ikkinchi darsga o'tish</button>
                </div>
            </div>
        </div>
    );
};

// --- 4. GESTURE INTERFACE ---
export const GestureInterface = ({ onSwitch }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    return (
        <div className="dashboard-wrapper animate-fade-in">
            <header className="header">
                <h1 className="title text-gradient">Imo-ishora interfeysi</h1>
                <button className="back-btn" onClick={() => onSwitch('onboarding')}>Chiqish</button>
            </header>
            <div className="content-section">
                <div className="main-panel">
                    <div className="camera-feed">
                        <video ref={videoRef} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="tracking-overlay"></div>
                    </div>
                    <h3>👋 Qo'l harakati bilan boshqaring</h3>
                    <p>Yuqoriga harakat - Keyingi dars, Pastga - Orqaga</p>
                </div>
            </div>
        </div>
    );
};
