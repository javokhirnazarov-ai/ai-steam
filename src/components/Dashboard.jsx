import React from 'react';

const InterfaceBadge = ({ icon, text, active }) => (
    <span className="interface-badge" style={active ? { borderColor: 'var(--success)', color: 'var(--success)' } : {}}>
        {icon} {text}
    </span>
);

const Dashboard = ({ onSwitch }) => (
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

export default Dashboard;
