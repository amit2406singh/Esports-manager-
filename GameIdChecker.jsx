import React, { useState } from 'react';

export default function GameIdChecker() {
  const [game, setGame] = useState('BGMI');
  const [gameId, setGameId] = useState('');
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [consoleTicks, setConsoleTicks] = useState([]);

  const handleLookup = (e) => {
    e.preventDefault();
    if (!gameId.trim()) return;

    setIsLoading(true);
    setProfile(null);
    setConsoleTicks(["[1] Connecting to game coordinator server...", "[2] Syncing matches telemetry logs..."]);

    // Fun console logs sequence
    setTimeout(() => {
      setConsoleTicks(prev => [...prev, "[3] Extracting APM & shot-recoil matrices..."]);
    }, 800);
    setTimeout(() => {
      setConsoleTicks(prev => [...prev, "[4] Dispatching packet parameters to Llama 3..."]);
    }, 1600);

    fetch('http://127.0.0.1:8000/api/game-id/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, game_id: gameId })
    })
      .then(res => res.json())
      .then(data => {
        setTimeout(() => {
          setProfile(data);
          setIsLoading(false);
        }, 2200);
      })
      .catch(err => {
        console.error("Game ID lookup failed:", err);
        setIsLoading(false);
      });
  };

  const getGameEmoji = (g) => {
    switch (g) {
      case 'Valorant': case 'Counter Strike 2': case 'BGMI': case 'Free Fire': return '🔫';
      case 'League of Legends': case 'Dota 2': return '🧙‍♂️';
      case 'Tekken 8': case 'Street Fighter 6': return '🥊';
      case 'Overwatch 2': return '🤖';
      case 'Rocket League': return '🏎️';
      case 'FIFA 26': return '⚽';
      default: return '🎮';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.8rem' }} className="neon-text-cyan">Gamer ID Telemetry Checker</h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Fetch detailed rankings, playstyle archetypes, and AI scouts reviews for any gaming identity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Search Panel */}
        <div className="glow-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.15rem', color: 'var(--color-secondary)' }}>Profile Search Console</h3>
          
          <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Game Title</label>
              <select 
                value={game} 
                onChange={e => setGame(e.target.value)}
                style={{
                  padding: '10px',
                  background: '#121420',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="BGMI">BGMI (Battlegrounds Mobile India)</option>
                <option value="Free Fire">Garena Free Fire</option>
                <option value="Valorant">Valorant</option>
                <option value="League of Legends">League of Legends</option>
                <option value="Counter Strike 2">Counter Strike 2</option>
                <option value="Dota 2">Dota 2</option>
                <option value="Tekken 8">Tekken 8</option>
                <option value="Street Fighter 6">Street Fighter 6</option>
                <option value="Overwatch 2">Overwatch 2</option>
                <option value="Apex Legends">Apex Legends</option>
                <option value="Fortnite">Fortnite</option>
                <option value="Rocket League">Rocket League</option>
                <option value="FIFA 26">FIFA 26</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Gamer ID / Tag</label>
              <input 
                type="text" 
                required
                placeholder="e.g. MortaL#123 or Faker#SKT"
                value={gameId}
                onChange={e => setGameId(e.target.value)}
                style={{
                  padding: '10px',
                  background: '#121420',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button className="glow-button" type="submit" style={{ padding: '10px', marginTop: '5px' }} disabled={isLoading}>
              {isLoading ? 'Scanning Server...' : '🔍 Retrieve Gaming Credentials'}
            </button>
          </form>

          {/* Console logger during load */}
          {isLoading && (
            <div style={{
              background: '#090a10',
              padding: '15px',
              borderRadius: '8px',
              marginTop: '20px',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              color: 'var(--color-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {consoleTicks.map((tick, idx) => (
                <div key={idx}>{tick}</div>
              ))}
            </div>
          )}
        </div>

        {/* Results Details Display */}
        <div>
          {profile ? (
            <div className="glow-card" style={{ padding: '24px' }}>
              {/* Profile Title Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '2.2rem' }}>{getGameEmoji(game)}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{gameId}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: 600 }}>
                      {game.toUpperCase()} COMPETITOR
                    </span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(143, 59, 250, 0.15)',
                  border: '1px solid var(--color-primary)',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.5px'
                }}>
                  🏆 {profile.rank}
                </div>
              </div>

              {/* Stats Grid Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '15px',
                marginBottom: '25px'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderBottom: '2px solid var(--color-secondary)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ladder Matches</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '4px', fontFamily: 'var(--font-display)' }}>{profile.matches}</div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderBottom: '2px solid var(--color-success)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Win Rate</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '4px', color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>
                    {Math.round(profile.win_rate * 100)}%
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderBottom: '2px solid var(--color-warning)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{profile.kd_label}</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '4px', fontFamily: 'var(--font-display)' }}>{profile.kd_ratio}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderBottom: '2px solid #ff1744' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{profile.accuracy_label}</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '4px', fontFamily: 'var(--font-display)' }}>{profile.accuracy}%</div>
                </div>
              </div>

              {/* Playstyle Tag card */}
              <div style={{
                background: 'rgba(0, 242, 254, 0.05)',
                border: '1px solid rgba(0, 242, 254, 0.15)',
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '25px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tactical Playstyle Signature:</span>
                  <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--color-secondary)', marginTop: '2px' }}>{profile.playstyle}</strong>
                </div>
                <span style={{ fontSize: '1.5rem' }}>🎯</span>
              </div>

              {/* AI Scouting Report Box */}
              <div className="glow-card" style={{ padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  🕵️‍♂️ AI Tactical Scouting Report
                </h4>
                <div style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: '#e2e8f0',
                  background: 'rgba(255,255,255,0.01)',
                  padding: '12px',
                  borderRadius: '6px'
                }}>
                  {profile.ai_analysis.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i} style={{ color: 'var(--color-secondary)' }}>{chunk}</strong> : chunk)}
                </div>
              </div>

            </div>
          ) : (
            <div className="glow-card" style={{ padding: '80px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              📡 Input gamer ID details and select active esports title to retrieve real-time coordinator statistics, playstyle tags, and AI telemetry reports.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
