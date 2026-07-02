import React, { useState, useEffect } from 'react';

export default function PlayerAnalytics({ activePlayer }) {
  const [cheatReport, setCheatReport] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [simulateCheat, setSimulateCheat] = useState(false);

  useEffect(() => {
    // Reset report when player changes
    setCheatReport(null);
  }, [activePlayer?.id]);

  if (!activePlayer) {
    return (
      <div className="glow-card" style={{ padding: '40px', textAlign: 'center' }}>
        No active profile loaded. Go back to Dashboard and switch player identities.
      </div>
    );
  }

  const triggerCheatCheck = () => {
    setIsAuditing(true);
    setCheatReport(null);
    
    fetch('http://127.0.0.1:8000/api/analytics/cheat-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: activePlayer.id,
        simulate_cheating: simulateCheat
      })
    })
      .then(res => res.json())
      .then(data => {
        setCheatReport(data);
        setIsAuditing(false);
        // Sync cheat rating to skill object locally
        activePlayer.skills.cheat_risk = data.risk_score;
      })
      .catch(err => {
        console.error("Anti-Cheat Audit error:", err);
        setIsAuditing(false);
      });
  };

  // RADAR CHART CALCULATION
  const skills = activePlayer.skills || {};
  const maxValues = { MMR: 3000, win_rate: 1.0, precision: 100, positioning: 100, teamwork: 100, sportsmanship: 100 };
  const skillKeys = ['MMR', 'win_rate', 'precision', 'positioning', 'teamwork', 'sportsmanship'];
  const labels = ['MMR', 'Win Rate', 'Precision', 'Positioning', 'Teamwork', 'Sportsmanship'];

  // Center (150, 150), Radius 90
  const cx = 150;
  const cy = 150;
  const r = 90;

  const getCoordinates = (index, value, maxVal) => {
    const angle = (Math.PI * 2 / 6) * index - Math.PI / 2;
    const factor = Math.min(1, Math.max(0, value / maxVal));
    const distance = r * factor;
    const x = cx + distance * Math.cos(angle);
    const y = cy + distance * Math.sin(angle);
    return { x, y };
  };

  // Generate web background grid paths
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridLevels.map(level => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
      const x = cx + (r * level) * Math.cos(angle);
      const y = cy + (r * level) * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  });

  // Calculate player skills overlay polygon
  const playerPoints = skillKeys.map((key, index) => {
    const val = skills[key] || 0;
    const maxVal = maxValues[key];
    const coords = getCoordinates(index, val, maxVal);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  // Get labels coordinates
  const labelPositions = skillKeys.map((key, index) => {
    const angle = (Math.PI * 2 / 6) * index - Math.PI / 2;
    const offset = 22; // offset label outside chart
    const x = cx + (r + offset) * Math.cos(angle);
    const y = cy + (r + offset) * Math.sin(angle);
    return { x, y, label: labels[index] };
  });

  // Badge list mapping
  const badgeLabels = {
    badge_first_win: { title: "First Blood", desc: "First tournament match win recorded.", icon: "🩸", color: "#ff5252" },
    badge_sportsman: { title: "Good Game", desc: "Maintained sportsmanship score > 90.", icon: "🤝", color: "#00e676" },
    badge_sharpshooter: { title: "Sharpshooter", desc: "Logged average precision over 90%.", icon: "🎯", color: "#00f2fe" },
    badge_mvp: { title: "MVP Core", desc: "Awarded Tournament Most Valuable Player.", icon: "👑", color: "#ffb300" },
    badge_guru: { title: "Tactical Guru", desc: "Senior strategist and AI coach advisor.", icon: "🧠", color: "#8f3bfa" }
  };

  const getRiskColor = (score) => {
    if (score > 70) return 'var(--color-danger)';
    if (score > 30) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.8rem' }} className="neon-text-cyan">Player Analytics & Sentinel</h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Inspect detailed skill radar topologies, monitor cheat risk scores, and check achievement indices.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '30px', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Left Column: Skill topologies */}
        <div className="glow-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', color: 'var(--color-secondary)', width: '100%' }}>
            Skill Profile Topology
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 20px 0', width: '100%' }}>
            Multi-dimensional capability plot normalized against highest bracket rating thresholds.
          </p>

          {/* SVG Radar Chart */}
          <div style={{ position: 'relative', width: '300px', height: '300px' }}>
            <svg width="300" height="300" style={{ overflow: 'visible' }}>
              {/* Outer circle glow ring */}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(143, 59, 250, 0.05)" strokeWidth="6" />

              {/* Grid meshes */}
              {gridPaths.map((path, idx) => (
                <polygon 
                  key={idx} 
                  points={path} 
                  fill="none" 
                  stroke="rgba(255,255,255,0.06)" 
                  strokeWidth="1" 
                />
              ))}

              {/* Axes lines */}
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
                return (
                  <line 
                    key={i} 
                    x1={cx} 
                    y1={cy} 
                    x2={cx + r * Math.cos(angle)} 
                    y2={cy + r * Math.sin(angle)} 
                    stroke="rgba(255,255,255,0.06)" 
                    strokeWidth="1" 
                  />
                );
              })}

              {/* Player Overlay polygon */}
              <polygon 
                points={playerPoints} 
                fill="rgba(143, 59, 250, 0.25)" 
                stroke="var(--color-primary)" 
                strokeWidth="2" 
                style={{ filter: 'drop-shadow(0 0 6px rgba(143, 59, 250, 0.6))' }}
              />

              {/* Dots at vertices */}
              {skillKeys.map((key, index) => {
                const val = skills[key] || 0;
                const maxVal = maxValues[key];
                const coords = getCoordinates(index, val, maxVal);
                return (
                  <circle 
                    key={index} 
                    cx={coords.x} 
                    cy={coords.y} 
                    r="4" 
                    fill="var(--color-secondary)" 
                  />
                );
              })}

              {/* Text labels */}
              {labelPositions.map((pos, index) => {
                // Adjust text anchors based on location
                let textAnchor = 'middle';
                if (pos.x < cx - 10) textAnchor = 'end';
                else if (pos.x > cx + 10) textAnchor = 'start';
                
                let dy = '0.35em';
                if (pos.y < cy - 10) dy = '-0.1em';
                else if (pos.y > cy + 10) dy = '1em';

                return (
                  <text 
                    key={index} 
                    x={pos.x} 
                    y={pos.y} 
                    fill="var(--color-text-muted)" 
                    fontSize="10" 
                    fontWeight="600"
                    textAnchor={textAnchor}
                    dy={dy}
                  >
                    {pos.label}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Numeric Skills readout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            width: '100%',
            marginTop: '25px',
            background: 'rgba(0,0,0,0.2)',
            padding: '15px',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>MMR Rank:</span> <strong>{skills.MMR}</strong>
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Win Rate:</span> <strong>{Math.round((skills.win_rate || 0.5) * 100)}%</strong>
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Precision:</span> <strong>{skills.precision}%</strong>
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Sportsmanship:</span> <strong style={{ color: 'var(--color-success)' }}>{skills.sportsmanship}/100</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Achievements & Anti Cheat Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Achievements badge showcase */}
          <div className="glow-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.15rem' }}>Achievement Badge Shelf</h3>
            {activePlayer.achievements?.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>
                No badges earned yet. Compete in tournaments and maintain solid sportsmanship ratings to unlock awards.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activePlayer.achievements.map(bId => {
                  const bInfo = badgeLabels[bId] || { title: bId, desc: "Unlocked award.", icon: "🏅", color: "#ccc" };
                  return (
                    <div key={bId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '10px 15px',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${bInfo.color}`
                    }}>
                      <div style={{ fontSize: '1.8rem' }}>{bInfo.icon}</div>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{bInfo.title}</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{bInfo.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Sentinel Anti-Cheat Console */}
          <div className="glow-card-cyan" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', color: 'var(--color-secondary)' }}>AI Anti-Cheat Monitor</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
              Inspect telemetry signals for anomalous input distributions, aim locking, or frame-perfect macro injections.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Simulation switch */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 15px',
                borderRadius: '8px'
              }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>Inject Suspicious Play Logs</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Inject simulated frame snaps and 40ms reactions.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={simulateCheat} 
                  onChange={e => setSimulateCheat(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {/* Audit Button */}
              <button 
                className="glow-button" 
                style={{ padding: '10px 20px', fontSize: '0.9rem' }} 
                onClick={triggerCheatCheck}
                disabled={isAuditing}
              >
                {isAuditing ? 'Auditing Telemetry Signals...' : '🔍 Perform AI Game Log Audit'}
              </button>

              {/* Cheat Report Display */}
              {cheatReport && (
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${getRiskColor(cheatReport.risk_score)}`,
                  padding: '15px',
                  borderRadius: '8px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Risk Assessment Index:</span>
                    <strong style={{
                      color: getRiskColor(cheatReport.risk_score),
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem'
                    }}>
                      {cheatReport.risk_score}% RISK
                    </strong>
                  </div>

                  <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                    <span>Anomaly Signature: </span>
                    <strong style={{ color: cheatReport.cheat_detected ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {cheatReport.cheat_type}
                    </strong>
                  </div>

                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: '1.4',
                    background: 'rgba(255,255,255,0.01)',
                    padding: '8px 10px',
                    borderRadius: '4px'
                  }}>
                    {cheatReport.explanation}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
