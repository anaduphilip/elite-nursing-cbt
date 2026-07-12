// src/components/admin/tabs/LimitedOfferTab.jsx
import React from 'react';

export const LimitedOfferTab = ({ 
  limitedOffer, 
  setLimitedOffer, 
  limitedOfferLoading, 
  limitedOfferResult, 
  handleSaveLimitedOffer,
  headingColor,
  secondaryText,
  textColor,
  cardBg,
  darkMode
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>🔥 Limited Time Offer</h3>
      <p style={{ color: secondaryText, marginBottom: 16 }}>
        Create a limited-time discount offer that appears on the Home page and Premium page with a live countdown timer.
        The discount will automatically apply to all premium plan purchases.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, color: textColor, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={limitedOffer.enabled}
            onChange={(e) => setLimitedOffer({ ...limitedOffer, enabled: e.target.checked })}
            style={{ width: 20, height: 20, cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 'bold' }}>Enable Limited Time Offer</span>
        </label>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px 24px',
        marginBottom: 20,
        opacity: limitedOffer.enabled ? 1 : 0.6
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>
            Discount Percentage (%)
          </label>
          <input
            type="number"
            placeholder="e.g., 20"
            value={limitedOffer.discountPercent}
            onChange={(e) => setLimitedOffer({ ...limitedOffer, discountPercent: parseFloat(e.target.value) || 0 })}
            min="0"
            max="100"
            disabled={!limitedOffer.enabled}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              border: '1px solid #ccc', 
              borderRadius: 8, 
              fontSize: 14, 
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: darkMode ? 'white' : '#333',
              boxSizing: 'border-box',
              opacity: limitedOffer.enabled ? 1 : 0.6
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>
            Target Audience
          </label>
          <select
            value={limitedOffer.targetAudience}
            onChange={(e) => setLimitedOffer({ ...limitedOffer, targetAudience: e.target.value })}
            disabled={!limitedOffer.enabled}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              border: '1px solid #ccc', 
              borderRadius: 8, 
              fontSize: 14, 
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: darkMode ? 'white' : '#333',
              boxSizing: 'border-box',
              opacity: limitedOffer.enabled ? 1 : 0.6
            }}
          >
            <option value="all">All Users</option>
            <option value="free">Free Users Only</option>
            <option value="premium">Premium Users Only</option>
          </select>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px 24px',
        marginBottom: 20,
        opacity: limitedOffer.enabled ? 1 : 0.6
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            value={limitedOffer.startDate}
            onChange={(e) => setLimitedOffer({ ...limitedOffer, startDate: e.target.value })}
            disabled={!limitedOffer.enabled}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              border: '1px solid #ccc', 
              borderRadius: 8, 
              fontSize: 14, 
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: darkMode ? 'white' : '#333',
              boxSizing: 'border-box',
              opacity: limitedOffer.enabled ? 1 : 0.6
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>
            End Date & Time
          </label>
          <input
            type="datetime-local"
            value={limitedOffer.endDate}
            onChange={(e) => setLimitedOffer({ ...limitedOffer, endDate: e.target.value })}
            disabled={!limitedOffer.enabled}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              border: '1px solid #ccc', 
              borderRadius: 8, 
              fontSize: 14, 
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: darkMode ? 'white' : '#333',
              boxSizing: 'border-box',
              opacity: limitedOffer.enabled ? 1 : 0.6
            }}
          />
        </div>
      </div>

      <div style={{ 
        marginBottom: 20,
        opacity: limitedOffer.enabled ? 1 : 0.6
      }}>
        <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>
          Banner Message
        </label>
        <input
          type="text"
          placeholder="e.g., 🔥 Limited Time: 20% off all plans!"
          value={limitedOffer.message}
          onChange={(e) => setLimitedOffer({ ...limitedOffer, message: e.target.value })}
          disabled={!limitedOffer.enabled}
          style={{ 
            width: '100%', 
            padding: '10px 14px', 
            border: '1px solid #ccc', 
            borderRadius: 8, 
            fontSize: 14, 
            background: darkMode ? '#1a1a2e' : '#f8f9fa',
            color: darkMode ? 'white' : '#333',
            boxSizing: 'border-box',
            opacity: limitedOffer.enabled ? 1 : 0.6
          }}
        />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px 24px',
        marginBottom: 20,
        opacity: limitedOffer.enabled ? 1 : 0.6
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>
            Button Text
          </label>
          <input
            type="text"
            placeholder="e.g., Claim Offer"
            value={limitedOffer.buttonText}
            onChange={(e) => setLimitedOffer({ ...limitedOffer, buttonText: e.target.value })}
            disabled={!limitedOffer.enabled}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              border: '1px solid #ccc', 
              borderRadius: 8, 
              fontSize: 14, 
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: darkMode ? 'white' : '#333',
              boxSizing: 'border-box',
              opacity: limitedOffer.enabled ? 1 : 0.6
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>
            Button Link
          </label>
          <input
            type="text"
            placeholder="/get-premium"
            value={limitedOffer.buttonLink}
            onChange={(e) => setLimitedOffer({ ...limitedOffer, buttonLink: e.target.value })}
            disabled={!limitedOffer.enabled}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              border: '1px solid #ccc', 
              borderRadius: 8, 
              fontSize: 14, 
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: darkMode ? 'white' : '#333',
              boxSizing: 'border-box',
              opacity: limitedOffer.enabled ? 1 : 0.6
            }}
          />
        </div>
      </div>

      {/* Preview Section */}
      <div style={{ 
        background: darkMode ? '#1a1a2e' : '#f0f7f4', 
        padding: 20, 
        borderRadius: 12, 
        marginBottom: 20,
        border: `2px solid ${limitedOffer.enabled ? '#ff9800' : '#ccc'}`
      }}>
        <h4 style={{ color: headingColor, marginBottom: 12 }}>Preview</h4>
        {limitedOffer.enabled && limitedOffer.discountPercent > 0 ? (
          <div>
            <div style={{ 
              background: darkMode ? '#2d2d3d' : '#fff3e0', 
              padding: '12px 16px', 
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <span style={{ color: '#ff9800', fontWeight: 'bold' }}>
                  🔥 {limitedOffer.message || `${limitedOffer.discountPercent}% OFF`}
                </span>
                <div style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>
                  ⏰ Offer ends when timer reaches zero
                </div>
              </div>
              <span style={{ 
                background: '#ff9800', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: 20, 
                fontSize: 12, 
                fontWeight: 'bold' 
              }}>
                {limitedOffer.discountPercent}% OFF
              </span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <span style={{ textDecoration: 'line-through', color: secondaryText }}>₦2000</span>
                <span style={{ color: '#e65100', fontWeight: 'bold', marginLeft: 8 }}>
                  ₦{(2000 * (1 - limitedOffer.discountPercent / 100)).toFixed(0)}
                </span>
                <span style={{ fontSize: 12, color: '#ff9800', marginLeft: 8 }}>({limitedOffer.discountPercent}% off)</span>
              </div>
              <div style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold' }}>
                ⏰ 01d 12h 30m 45s
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: secondaryText, fontStyle: 'italic' }}>
            {limitedOffer.enabled ? 'Enter a discount percentage to see preview' : 'Enable the offer to see preview'}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={handleSaveLimitedOffer}
          disabled={limitedOfferLoading}
          style={{ 
            background: '#ff9800', 
            color: 'white', 
            padding: '12px 32px', 
            border: 'none', 
            borderRadius: 8, 
            cursor: limitedOfferLoading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            fontSize: 16,
            opacity: limitedOfferLoading ? 0.7 : 1
          }}
        >
          {limitedOfferLoading ? 'Saving...' : '💾 Save Limited Offer'}
        </button>
      </div>

      {limitedOfferResult && (
        <p style={{ 
          marginTop: 16, 
          padding: 12, 
          borderRadius: 8,
          background: limitedOfferResult.includes('✅') ? '#e8f5e9' : '#ffebee',
          color: limitedOfferResult.includes('✅') ? '#2e7d32' : '#c62828'
        }}>
          {limitedOfferResult}
        </p>
      )}
    </div>
  );
};