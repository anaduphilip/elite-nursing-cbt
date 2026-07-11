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
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>🏷️ Coupons</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <input placeholder="Code (e.g. ELITE20)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <select value={couponDiscountType} onChange={(e) => setCouponDiscountType(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }}>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        <input type="number" placeholder="Discount Value" value={couponDiscountValue} onChange={(e) => setCouponDiscountValue(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <select value={couponPlanType} onChange={(e) => setCouponPlanType(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }}>
          <option value="all">All Plans</option>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input type="number" placeholder="Min Purchase (₦)" value={couponMinPurchase} onChange={(e) => setCouponMinPurchase(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <input type="number" placeholder="Max Discount (₦)" value={couponMaxDiscount} onChange={(e) => setCouponMaxDiscount(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <input type="datetime-local" value={couponExpiryDate} onChange={(e) => setCouponExpiryDate(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <input type="number" placeholder="Usage Limit" value={couponUsageLimit} onChange={(e) => setCouponUsageLimit(parseInt(e.target.value))} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <input placeholder="Description" value={couponDescription} onChange={(e) => setCouponDescription(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={couponActive} onChange={(e) => setCouponActive(e.target.checked)} /> Active
        </label>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={handleSaveCoupon} disabled={couponLoading} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>{editingCouponId ? 'Update' : 'Add'}</button>
        {editingCouponId && <button onClick={resetCouponForm} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>}
      </div>
      {couponResult && <p style={{ marginBottom: 16, color: couponResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{couponResult}</p>}
      {couponLoading ? <p>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {coupons.map(c => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: '12px 16px', borderRadius: 8, border: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
              <div><strong>{c.code}</strong> - {c.discountType === 'percentage' ? `${c.discountValue}%` : `₦${c.discountValue}`} {c.active ? '✅' : '❌'} <span style={{ color: secondaryText, fontSize: 12 }}>Used: {c.usedCount}/{c.usageLimit}</span> <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: 12, fontSize: 11, color: '#1e3c72', marginLeft: 6 }}>{c.planType === 'all' ? 'All' : c.planType}</span></div>
              <div>
                <button onClick={() => editCoupon(c)} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Edit</button>
                <button onClick={() => handleDeleteCoupon(c._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};