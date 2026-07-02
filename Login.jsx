import React, { useState } from 'react';

export default function Login({ onLogin, onTeamLogin, onCreateUser, onCreateTeam, error, clearError }) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [loginType, setLoginType] = useState('player'); // 'player' or 'team'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginTeamName, setLoginTeamName] = useState('');
  const [loginTeamPassword, setLoginTeamPassword] = useState('');

  // Register State
  const [regType, setRegType] = useState('player'); // 'player' or 'team'
  
  // Player Register credentials
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGame, setRegGame] = useState('BGMI');
  const [regRole, setRegRole] = useState('player');
  
  // Team Register credentials
  const [regTeamName, setRegTeamName] = useState('');
  const [regTeamPassword, setRegTeamPassword] = useState('');
  const [regCaptainName, setRegCaptainName] = useState('');
  const [regCaptainPassword, setRegCaptainPassword] = useState('');
  const [regTeamGame, setRegTeamGame] = useState('BGMI');

  // Loading logs
  const [isRegisteringLoading, setIsRegisteringLoading] = useState(false);
  const [loaderLogs, setLoaderLogs] = useState([]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    clearError();
    if (loginType === 'player') {
      onLogin(loginUsername, loginPassword);
    } else {
      onTeamLogin(loginTeamName, loginTeamPassword);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    clearError();

    if (regType === 'player') {
      if (!regUsername.trim() || !regPassword.trim()) return;
      
      setIsRegisteringLoading(true);
      setLoaderLogs([
        `📡 Dialing game coordinator database for ${regGame}...`,
        `🔍 Accessing gamer handle telemetry for "${regUsername}"...`
      ]);

      setTimeout(() => {
        setLoaderLogs(prev => [...prev, `📊 Extracting combat MMR & Win Rate metrics...`]);
      }, 600);

      setTimeout(() => {
        setLoaderLogs(prev => [...prev, `🏆 Auditing match achievements & precision ratings...`]);
      }, 1200);

      setTimeout(() => {
        setLoaderLogs(prev => [...prev, `🤖 AI Telemetry mapping complete! Deploying player card...`]);
      }, 1800);

      setTimeout(() => {
        onCreateUser({
          username: regUsername,
          password: regPassword,
          game: regGame,
          role: regRole
        }).then((success) => {
          setIsRegisteringLoading(false);
          if (success) {
            setIsRegistering(false);
            setRegUsername('');
            setRegPassword('');
          }
        });
      }, 2400);

    } else {
      if (!regTeamName.trim() || !regTeamPassword.trim() || !regCaptainName.trim() || !regCaptainPassword.trim()) return;
      
      setIsRegisteringLoading(true);
      setLoaderLogs([
        `📡 Contacting esports registrar...`,
        `🛡️ Initializing team name registry for "${regTeamName}"...`
      ]);

      setTimeout(() => {
        setLoaderLogs(prev => [...prev, `🔍 Querying captain Gamer ID "${regCaptainName}" stats on ${regTeamGame}...`]);
      }, 600);

      setTimeout(() => {
        setLoaderLogs(prev => [...prev, `📊 Crawling captain telemetry and deploying profile card...`]);
      }, 1200);

      setTimeout(() => {
        setLoaderLogs(prev => [...prev, `🚀 Binding captain to team roster & finalizing credentials...`]);
      }, 1800);

      setTimeout(() => {
        onCreateTeam({
          teamName: regTeamName,
          teamPassword: regTeamPassword,
          captainName: regCaptainName,
          captainPassword: regCaptainPassword,
          game: regTeamGame,
          logo: "🛡️"
        }).then((success) => {
          setIsRegisteringLoading(false);
          if (success) {
            setIsRegistering(false);
            setRegTeamName('');
            setRegTeamPassword('');
            setRegCaptainName('');
            setRegCaptainPassword('');
          }
        });
      }, 2400);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--color-bg-deep)'
    }}>
      <div className="glow-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '40px',
        borderRadius: '2px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
        textAlign: 'center'
      }}>
        
        {/* Game Title Logo */}
        <div style={{
          fontSize: '2.4rem',
          color: '#ffffff',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '5px'
        }}>
          ROSTER<span style={{ color: 'var(--color-primary)' }}> // </span>LOCK
        </div>
        <p style={{ color: 'var(--color-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '30px', fontWeight: 700 }}>
          Esports Operations Terminal
        </p>

        {/* Global Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.12)',
            border: '1px solid var(--color-danger)',
            color: '#ff5252',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'left',
            boxShadow: '0 0 10px rgba(255, 23, 68, 0.2)'
          }}>
            ⚠️ <strong>Authentication Error:</strong> {error}
          </div>
        )}

        {isRegisteringLoading ? (
          /* Scraper Logging Screen */
          <div style={{ padding: '20px 0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }} className="neon-text-cyan">
              Querying Esports Telemetry Node
            </h3>
            <div style={{
              background: '#090a10',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'var(--color-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minHeight: '140px',
              border: '1px solid rgba(0, 242, 254, 0.15)'
            }}>
              {loaderLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '15px' }}>
              Crawl synchronization in progress... Please standby.
            </p>
          </div>
        ) : isRegistering ? (
          /* REGISTRATION SCREEN */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.25rem', textAlign: 'center' }} className="neon-text-cyan">
              Deploy Esports Identity
            </h3>

            {/* Register Tab Selector */}
            <div style={{ display: 'flex', background: '#090a10', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '5px' }}>
              <button 
                type="button"
                onClick={() => { setRegType('player'); clearError(); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  background: regType === 'player' ? 'var(--color-primary-glow)' : 'transparent',
                  border: regType === 'player' ? '1px solid var(--color-primary)' : '1px solid transparent',
                  color: regType === 'player' ? '#fff' : 'var(--color-text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer'
                }}
              >
                Competitor
              </button>
              <button 
                type="button"
                onClick={() => { setRegType('team'); clearError(); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  background: regType === 'team' ? 'var(--color-primary-glow)' : 'transparent',
                  border: regType === 'team' ? '1px solid var(--color-primary)' : '1px solid transparent',
                  color: regType === 'team' ? '#fff' : 'var(--color-text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer'
                }}
              >
                Team Handle
              </button>
            </div>

            {regType === 'player' ? (
              /* Player signup fields */
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Gamer ID / Game Tag</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. MortaL#123, Faker#SKT, CS_Pro"
                    value={regUsername} 
                    onChange={e => setRegUsername(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Account Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={regPassword} 
                    onChange={e => setRegPassword(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Primary Esports Title</label>
                  <select 
                    value={regGame} 
                    onChange={e => setRegGame(e.target.value)}
                    style={{
                      padding: '10px',
                      background: '#121420',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem',
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
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Competitive Category</label>
                  <select 
                    value={regRole} 
                    onChange={e => setRegRole(e.target.value)}
                    style={{
                      padding: '10px',
                      background: '#121420',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="player">Active Competitor (Player)</option>
                    <option value="coach">Tactical Consultant (Coach)</option>
                  </select>
                </div>
              </>
            ) : (
              /* Team signup fields */
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Team Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rage Esports, Team Soul"
                    value={regTeamName} 
                    onChange={e => setRegTeamName(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Team Code (Password)</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={regTeamPassword} 
                    onChange={e => setRegTeamPassword(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Captain's Gamer ID</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Scout#BGMI, Mortal#123"
                    value={regCaptainName} 
                    onChange={e => setRegCaptainName(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Captain's Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={regCaptainPassword} 
                    onChange={e => setRegCaptainPassword(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Primary Esports Title</label>
                  <select 
                    value={regTeamGame} 
                    onChange={e => setRegTeamGame(e.target.value)}
                    style={{
                      padding: '10px',
                      background: '#121420',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem',
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
              </>
            )}

            <button className="glow-button" type="submit" style={{ padding: '12px', marginTop: '10px' }}>
              🚀 Sync Stats & Deploy {regType === 'player' ? 'Profile' : 'Team'}
            </button>
            
            <button 
              className="glow-button-secondary" 
              type="button" 
              style={{ padding: '10px' }}
              onClick={() => {
                setIsRegistering(false);
                clearError();
              }}
            >
              Sign In to Existing Account
            </button>
          </form>
        ) : (
          /* LOGIN SCREEN */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.25rem', textAlign: 'center' }} className="neon-text-cyan">
              Esports Launcher Sign In
            </h3>
            
            {/* Login Tab Selector */}
            <div style={{ display: 'flex', background: '#090a10', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                type="button"
                onClick={() => { setLoginType('player'); clearError(); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  background: loginType === 'player' ? 'var(--color-primary-glow)' : 'transparent',
                  border: loginType === 'player' ? '1px solid var(--color-primary)' : '1px solid transparent',
                  color: loginType === 'player' ? '#fff' : 'var(--color-text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer'
                }}
              >
                Competitor
              </button>
              <button 
                type="button"
                onClick={() => { setLoginType('team'); clearError(); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  background: loginType === 'team' ? 'var(--color-primary-glow)' : 'transparent',
                  border: loginType === 'team' ? '1px solid var(--color-primary)' : '1px solid transparent',
                  color: loginType === 'team' ? '#fff' : 'var(--color-text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer'
                }}
              >
                Team Handle
              </button>
            </div>

            {loginType === 'player' ? (
              /* Player Inputs */
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Gamer ID (Username)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. ApexPredator or MortaL#123"
                    value={loginUsername} 
                    onChange={e => setLoginUsername(e.target.value)}
                    style={{
                      padding: '12px',
                      background: '#121420',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)}
                    style={{
                      padding: '12px',
                      background: '#121420',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </>
            ) : (
              /* Team Inputs */
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Team Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Team Nova or Aether Esports"
                    value={loginTeamName} 
                    onChange={e => setLoginTeamName(e.target.value)}
                    style={{
                      padding: '12px',
                      background: '#121420',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Team Code (Password)</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={loginTeamPassword} 
                    onChange={e => setLoginTeamPassword(e.target.value)}
                    style={{
                      padding: '12px',
                      background: '#121420',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </>
            )}

            <button className="glow-button" type="submit" style={{ padding: '12px', marginTop: '10px' }}>
              🔑 Authenticate and Enter Launcher
            </button>
            
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Don't have a synchronized card profile?
              </span>
              <button 
                className="glow-button-secondary" 
                type="button" 
                style={{ padding: '10px' }}
                onClick={() => {
                  setIsRegistering(true);
                  clearError();
                }}
              >
                Register & Fetch Game ID Stats
              </button>
            </div>

            {/* Quick Demo Help Alert */}
            <div style={{
              background: 'rgba(255,179,0,0.05)',
              border: '1px dashed rgba(255,179,0,0.3)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              color: 'var(--color-warning)',
              textAlign: 'center'
            }}>
              💡 <strong>Seed Tip:</strong> You can log in using Player <strong>ApexPredator</strong> or Team <strong>Team Nova</strong> with password <strong>password123</strong>.
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
