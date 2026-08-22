// src/components/admin/tabs/CouponsTab.jsx
import React from 'react';

export const CouponsTab = ({
  coupons,
  couponLoading,
  couponCode,
  setCouponCode,
  couponDiscountType,
  setCouponDiscountType,
  couponDiscountValue,
  setCouponDiscountValue,
  couponMinPurchase,
  setCouponMinPurchase,
  couponMaxDiscount,
  setCouponMaxDiscount,
  couponExpiryDate,
  setCouponExpiryDate,
  couponUsageLimit,
  setCouponUsageLimit,
  couponActive,
  setCouponActive,
  couponDescription,
  setCouponDescription,
  couponPlanType,
  setCouponPlanType,
  editingCouponId,
  couponResult,
  handleSaveCoupon,
  handleDeleteCoupon,
  editCoupon,
  resetCouponForm,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  // Common input style
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
    borderRadius: 6,
    fontSize: 14,
    background: cardBg,
    color: textColor,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: textColor,
    fontWeight: 500,
    padding: '6px 0'
  };

  return (
    <div style={{ padding: '16px 20px', maxWidth: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>🏷️ Coupons</h3>

      {/* ===== FORM – RESPONSIVE GRID ===== */}
      <div className="coupon-form-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 12, 
        marginBottom: 20 
      }}>
        <input
          placeholder="Code (e.g. ELITE20)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          style={inputStyle}
        />
        <select
          value={couponDiscountType}
          onChange={(e) => setCouponDiscountType(e.target.value)}
          style={inputStyle}
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        <input
          type="number"
          placeholder="Discount Value"
          value={couponDiscountValue}
          onChange={(e) => setCouponDiscountValue(e.target.value)}
          style={inputStyle}
        />
        <select
          value={couponPlanType}
          onChange={(e) => setCouponPlanType(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All Plans</option>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input
          type="number"
          placeholder="Min Purchase (₦)"
          value={couponMinPurchase}
          onChange={(e) => setCouponMinPurchase(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Max Discount (₦)"
          value={couponMaxDiscount}
          onChange={(e) => setCouponMaxDiscount(e.target.value)}
          style={inputStyle}
        />
        <input
          type="datetime-local"
          value={couponExpiryDate}
          onChange={(e) => setCouponExpiryDate(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Usage Limit"
          value={couponUsageLimit}
          onChange={(e) => setCouponUsageLimit(parseInt(e.target.value) || 0)}
          style={inputStyle}
        />
        <input
          placeholder="Description"
          value={couponDescription}
          onChange={(e) => setCouponDescription(e.target.value)}
          style={inputStyle}
        />
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={couponActive}
            onChange={(e) => setCouponActive(e.target.checked)}
          /> 
          Active
        </label>
      </div>

      {/* ===== BUTTONS ===== */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={handleSaveCoupon}
          disabled={couponLoading}
          style={{
            background: '#1e3c72',
            color: 'white',
            padding: '10px 24px',
            border: 'none',
            borderRadius: 6,
            cursor: couponLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            opacity: couponLoading ? 0.6 : 1
          }}
        >
          {editingCouponId ? 'Update Coupon' : 'Add Coupon'}
        </button>
        {editingCouponId && (
          <button
            onClick={resetCouponForm}
            style={{
              background: '#6c757d',
              color: 'white',
              padding: '10px 24px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {couponResult && (
        <p style={{ marginBottom: 16, color: couponResult.includes('✅') ? '#2e7d32' : '#dc3545', fontSize: 14 }}>
          {couponResult}
        </p>
      )}

      {/* ===== COUPON LIST – RESPONSIVE ===== */}
      {couponLoading ? (
        <p style={{ color: secondaryText }}>Loading coupons...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coupons.length === 0 ? (
            <p style={{ color: secondaryText }}>No coupons created yet.</p>
          ) : (
            coupons.map((c) => (
              <div
                key={c._id}
                className="coupon-item"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: darkMode ? '#2d2d3d' : '#f8f9fa',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: `1px solid ${darkMode ? '#444' : '#eee'}`,
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, flex: 1 }}>
                  <strong style={{ color: headingColor, fontSize: 15 }}>{c.code}</strong>
                  <span style={{ color: textColor, fontSize: 13 }}>
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `₦${c.discountValue}`}
                  </span>
                  <span style={{ color: c.active ? '#2e7d32' : '#dc3545', fontSize: 13 }}>
                    {c.active ? '✅' : '❌'}
                  </span>
                  <span style={{ color: secondaryText, fontSize: 12 }}>
                    Used: {c.usedCount}/{c.usageLimit}
                  </span>
                  <span style={{
                    background: '#e8f5e9',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    color: '#1e3c72',
                    fontWeight: 600
                  }}>
                    {c.planType === 'all' ? 'All' : c.planType}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => editCoupon(c)}
                    style={{
                      background: '#ffc107',
                      color: '#333',
                      padding: '4px 12px',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCoupon(c._id)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      padding: '4px 12px',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== RESPONSIVE MEDIA QUERY ===== */}
      <style>{`
        @media (max-width: 600px) {
          .coupon-form-grid {
            grid-template-columns: 1fr !important;
          }
          .coupon-item {
            flex-direction: column;
            align-items: stretch !important;
          }
          .coupon-item > div:first-child {
            flex-wrap: wrap;
            justify-content: center;
            gap: 4px;
          }
          .coupon-item > div:last-child {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};