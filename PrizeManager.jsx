import React, { useState, useEffect } from 'react';

export default function PrizeManager({ prizes, claimPrize }) {
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [region, setRegion] = useState('US');
  const [wallet, setWallet] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset receipt when selecting a different prize
    setReceipt(null);
  }, [selectedPrize?.id]);

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    if (!selectedPrize || isSubmitting) return;

    setIsSubmitting(true);
    
    claimPrize(selectedPrize.id, region, wallet)
      .then(data => {
        setReceipt(data.receipt);
        setIsSubmitting(false);
        // Update local prize status
        setSelectedPrize(prev => ({ ...prev, status: 'claimed' }));
      })
      .catch(err => {
        console.error("Claim payout failed:", err);
        setIsSubmitting(false);
      });
  };

  const getTaxRate = (reg) => {
    switch (reg) {
      case 'US': return 0.30;
      case 'EU': return 0.20;
      case 'IN': return 0.15;
      default: return 0.10;
    }
  };

  const originalAmount = selectedPrize ? selectedPrize.amount : 0;
  const taxRate = getTaxRate(region);
  const taxDeducted = Math.round(originalAmount * taxRate * 100) / 100;
  const netPayout = Math.round((originalAmount - taxDeducted) * 100) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.8rem' }} className="neon-text-cyan">Prize Claims & Tax Manager</h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Calculate local withholding taxes, submit payout routes, and process automated esports earnings claims.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '30px', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Left Panel: List of earnings */}
        <div className="glow-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            Earned Prize Pools ({prizes.length})
          </h3>
          
          {prizes.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
              No prizes have been unlocked yet. Host a tournament and complete all bracket matchups to generate winner certificates.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {prizes.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPrize(p)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: selectedPrize?.id === p.id ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: selectedPrize?.id === p.id ? '1px solid var(--color-secondary)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: p.place === 1 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                      {p.place === 1 ? '🥇 Champion' : '🥈 Runner Up'}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: p.status === 'claimed' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,23,68,0.15)',
                      color: p.status === 'claimed' ? 'var(--color-success)' : '#ff5252',
                      fontWeight: 'bold'
                    }}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                  <strong style={{ display: 'block', fontSize: '1rem', marginTop: '6px' }}>{p.team_name}</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    <span>Tournament Payout</span>
                    <strong style={{ color: '#fff' }}>${p.amount}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Tax calculator and claims */}
        <div>
          {selectedPrize ? (
            <div className="glow-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }} className="neon-text-cyan">
                Tax withholding & Claim Panel
              </h3>

              {receipt ? (
                /* Payment Success Invoice details */
                <div style={{
                  background: 'rgba(0, 230, 118, 0.05)',
                  border: '1px solid var(--color-success)',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
                  <h4 style={{ color: 'var(--color-success)', margin: '0 0 10px 0', fontSize: '1.2rem' }}>Payout Disbursed Successfully!</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
                    Your funds have been deposited in the routing node. See receipt specs below.
                  </p>

                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div>TRANSACTION: CLAIM-{receipt.prize_id.substring(0,8).toUpperCase()}</div>
                    <div>STATUS: COMPLETED (PAID)</div>
                    <hr style={{ border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GROSS AWARD:</span> <span>${receipt.original_amount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff6b6b' }}>
                      <span>TAX RETAINED ({receipt.tax_rate_percent}%):</span> <span>-${receipt.tax_deducted.toFixed(2)}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-success)' }}>
                      <span>NET AMOUNT SENT:</span> <span>${receipt.payout.toFixed(2)}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '20px', fontStyle: 'italic' }}>
                    Stripe transaction pipeline completed. Funds will settle within 2 business days.
                  </p>
                </div>
              ) : selectedPrize.status === 'claimed' ? (
                /* Already claimed state */
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  🔒 This certificate has already been processed and claimed. Thank you for participating!
                </div>
              ) : (
                /* Claim form */
                <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Financial calculation breakdown */}
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '20px',
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    fontSize: '0.9rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Gross Prize Pool:</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>${originalAmount}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Select Tax Residency:</span>
                      <select 
                        value={region} 
                        onChange={e => setRegion(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          background: '#121420',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          color: '#fff',
                          marginTop: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="US">US (30% Federal Retainage)</option>
                        <option value="EU">EU (20% Regional Levy)</option>
                        <option value="IN">India (15% TDS Retainage)</option>
                        <option value="ROW">Rest of World (10% Retainage)</option>
                      </select>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', color: '#ff6b6b' }}>
                      <span>Estimated Tax Withheld:</span>
                      <div style={{ fontWeight: 'bold', marginTop: '2px' }}>-${taxDeducted}</div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', color: 'var(--color-success)' }}>
                      <span>Net Payout Amount:</span>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: '2px' }}>${netPayout}</div>
                    </div>
                  </div>

                  {/* Payment routing fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Stripe Account ID / Crypto Wallet Address</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. acct_1H0x... or 0x71C... or bank IBAN"
                      value={wallet} 
                      onChange={e => setWallet(e.target.value)}
                      style={{
                        padding: '10px',
                        background: '#121420',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.85rem'
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      Your payout will be automatically routed through Stripe checkout APIs.
                    </span>
                  </div>

                  {/* Submission triggers */}
                  <button className="glow-button" type="submit" style={{ padding: '12px', marginTop: '10px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Routing transaction...' : '💰 Confirm and Disburse Net Payout'}
                  </button>

                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '15px'
                  }}>
                    🛡️ Payouts are compliant with international esports tax regulations. A 1099-MISC/W-8BEN copy is generated automatically.
                  </div>

                </form>
              )}

            </div>
          ) : (
            <div className="glow-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              💸 Select an earned certificate from the ledger to compute withholding calculations and disburse payouts.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
