// src/utils/rateLimitHelpers.js

const getLockDuration = (attempts) => {
  if (attempts < 5) return 0;
  const thresholds = [
    { min: 5, max: 5, duration: 5 * 60 * 1000 },
    { min: 6, max: 6, duration: 15 * 60 * 1000 },
    { min: 7, max: 7, duration: 30 * 60 * 1000 },
    { min: 8, max: 8, duration: 60 * 60 * 1000 },
    { min: 9, max: 9, duration: 12 * 60 * 60 * 1000 },
    { min: 10, max: Infinity, duration: 24 * 60 * 60 * 1000 },
  ];
  for (const t of thresholds) {
    if (attempts >= t.min && attempts <= t.max) return t.duration;
  }
  return 24 * 60 * 60 * 1000;
};

const getLockMessage = (attempts, lockedUntil) => {
  if (!lockedUntil) return 'Too many failed attempts. Please try again later.';
  const now = new Date();
  const remaining = lockedUntil - now;
  if (remaining <= 0) return 'Your lock has expired. Please try again.';
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  if (attempts >= 10) {
    return `Account locked for 24 hours. Try again later or contact support. (${timeString} remaining)`;
  }
  return `Too many failed attempts. Try again in ${timeString}.`;
};

const checkUserAccess = (user) => {
  if (user.manuallyBlocked) {
    if (user.manualBlockExpiry && new Date(user.manualBlockExpiry) < new Date()) {
      return { allowed: true, reason: '', blockType: 'none' };
    }
    const expiryMsg = user.manualBlockExpiry
      ? ` until ${new Date(user.manualBlockExpiry).toLocaleString()}`
      : ' (permanent)';
    return {
      allowed: false,
      reason: `Account blocked by admin${expiryMsg}.${user.manualBlockReason ? ` Reason: ${user.manualBlockReason}` : ''}`,
      blockType: 'manual'
    };
  }
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const timeLeft = user.lockedUntil - new Date();
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    return {
      allowed: false,
      reason: `Too many failed attempts. Wait ${timeString} before trying again.`,
      blockType: 'temporary'
    };
  }
  return { allowed: true, reason: '', blockType: 'none' };
};

const formatRemainingTime = (expiryDate) => {
  if (!expiryDate) return 'Never';
  const now = new Date();
  const remaining = expiryDate - now;
  if (remaining <= 0) return 'Expired';
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'less than a minute';
};

const getDurationLabel = (ms) => {
  if (ms === null || ms === undefined) return 'Forever';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
};

const parseDuration = (input) => {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (clean === 'forever' || clean === 'never') return null;
  const match = clean.match(/^(\d+)([smhdw]?)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2] || 'm';
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000, w: 7 * 24 * 60 * 60 * 1000 };
  return value * (multipliers[unit] || multipliers['m']);
};

module.exports = {
  getLockDuration,
  getLockMessage,
  checkUserAccess,
  formatRemainingTime,
  getDurationLabel,
  parseDuration,
};