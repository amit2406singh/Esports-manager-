import React from 'react';

export default function Dashboard({ counts, liveMatches, navigateTo, activePlayer, setActivePlayer, allPlayers }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Hero Banner */}
      <div className="glow-card" style={{
        background: 'linear-gradient(135deg, rgba(21, 15, 46, 0.9) 0%, rgba(5, 5, 8, 0.95) 100%)',
        padding: '40px',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid rgba(143, 59, 250, 0.3)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }} className="neon-text-purple">
            AI ESPORTS MANAGER
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginTop: '8px', maxWidth: '600px' }}>
            Organize tournaments, analyze player gameplay for anomalous cheat patterns, simulate matches, and use Groq AI-driven insights to coach your squad.
          </p>
          <div style={{ display: 'flex', gap: '15px', marginTop: '24px' }}>
            <button className="glow-button" style={{ padding: '12px 24px' }} onClick={() => navigateTo('tournaments')}>
              Create Tournament
            </button>
            <button className="glow-button-secondary" style={{ padding: '12px 24px' }} onClick={() => navigateTo('coach')}>
              Consult AI Coach
            </button>
          </div>
        </div>
        
        {/* Active Player Quick Selector */}
        <div className="glow-card-cyan" style={{ padding: '20px', minWidth: '280px', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Active Profile
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
            <div style={{ fontSize: '2rem' }}>🎮</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{activePlayer?.username}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                MMR: <strong style={{ color: '#fff' }}>{activePlayer?.skills?.MMR}</strong> | {activePlayer?.role}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Primary Title:</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px', color: 'var(--color-secondary)' }}>
              {activePlayer?.game || 'Valorant'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Counts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px'
      }}>
        {[
          { label: 'Tournaments', val: counts.tournaments, icon: '🏆', color: 'var(--color-primary)' },
          { label: 'Active Teams', val: counts.teams, icon: '🛡️', color: 'var(--color-secondary)' },
          { label: 'Registered Players', val: counts.users, icon: '👥', color: 'var(--color-success)' },
          { label: 'Matches Simulated', val: counts.matches, icon: '⚡', color: 'var(--color-warning)' },
          { label: 'Prize Claims', val: counts.prizes, icon: '💰', color: '#ff6b6b' },
          activePlayer?.role === 'team' && { label: 'Combined Prize Pool', val: `$${(counts.total_prize_pool || 0).toLocaleString()}`, icon: '💵', color: 'var(--color-primary)' }
        ].filter(Boolean).map((item, idx) => (
          <div key={idx} className="glow-card" style={{ padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{item.val}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{item.label}</div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '4px',
              backgroundColor: item.color
            }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', flexWrap: 'wrap' }}>
        {/* Live Matches Dashboard */}
        <div className="glow-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="live-dot" /> Live Match Spectating
            </h3>
            {liveMatches.length > 0 && (
              <span className="live-badge">
                <span className="live-dot" /> {liveMatches.length} ACTIVE
              </span>
            )}
          </div>

          {liveMatches.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              color: 'var(--color-text-muted)'
            }}>
              No matches are currently active. Go to the <strong>Tournaments</strong> tab, start a tournament, and trigger a match simulation!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {liveMatches.map((m) => (
                <div key={m.id} className="glow-card-cyan" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 600 }}>MATCH {m.id.substring(0, 4).toUpperCase()}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{m.team1?.name}</strong>
                      <span style={{ color: 'var(--color-text-muted)' }}>vs</span>
                      <strong style={{ fontSize: '1.1rem' }}>{m.team2?.name}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      background: 'rgba(0,0,0,0.4)',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      color: 'var(--color-secondary)'
                    }}>
                      {m.score1} - {m.score2}
                    </div>
                    <button className="glow-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => navigateTo('matches', m.id)}>
                      Spectate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI System Status & Cheat Alerts */}
        <div className="glow-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>AI Agent Sentinel</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
              background: 'rgba(0, 242, 254, 0.05)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Skill Matchmaker</span>
                <span style={{ color: 'var(--color-secondary)' }}>ONLINE</span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Continuous skill-rating (MMR) calculations and parity handicapping suggestions running.
              </p>
            </div>

            <div style={{
              background: 'rgba(143, 59, 250, 0.05)',
              border: '1px solid rgba(143, 59, 250, 0.2)',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Anti-Cheat Monitor</span>
                <span style={{ color: 'var(--color-primary)' }}>ACTIVE</span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Auditing user click telemetry logs. Flags are raised automatically for aim-snaps or reaction speeds &lt; 80ms.
              </p>
            </div>

            <div style={{
              background: 'rgba(0, 230, 118, 0.05)',
              border: '1px solid rgba(0, 230, 118, 0.2)',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>AI Coach Agent</span>
                <span style={{ color: 'var(--color-success)' }}>READY</span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Strategic coaching assistant loaded with individual player gameplay profile indexes.
              </p>
            </div>
          </div>

          {/* Quick Notice */}
          <div style={{
            background: 'rgba(255, 179, 0, 0.1)',
            border: '1px dashed rgba(255, 179, 0, 0.4)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: 'var(--color-warning)',
            textAlign: 'center'
          }}>
            ⚠️ <strong>TIP:</strong> Toggle player identity to audit different skill matrices or request customized coaching feedback.
          </div>
        </div>
      </div>
    </div>
  );
}
