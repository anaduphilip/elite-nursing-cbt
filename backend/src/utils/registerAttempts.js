// src/utils/registerAttempts.js
const { getLockDuration } = require('./rateLimitHelpers');

const attemptsMap = new Map();

const getEntry = (key) => {
  const entry = attemptsMap.get(key) || { attempts: 0, lockedUntil: null };
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    entry.attempts = 0;
    entry.lockedUntil = null;
  }
  return entry;
};

const isLocked = (key) => {
  const entry = getEntry(key);
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { locked: true, remaining: entry.lockedUntil - Date.now(), attempts: entry.attempts };
  }
  return { locked: false, attempts: entry.attempts };
};

const incrementAttempts = (key) => {
  const entry = getEntry(key);
  entry.attempts += 1;
  const attempts = entry.attempts;
  const duration = getLockDuration(attempts);
  if (duration > 0) {
    entry.lockedUntil = new Date(Date.now() + duration);
  } else {
    entry.lockedUntil = null;
  }
  attemptsMap.set(key, entry);
  return { attempts, lockedUntil: entry.lockedUntil };
};

const getRegistrationLimitInfo = (email, ip) => {
  const emailKey = `email:${email.toLowerCase()}`;
  const ipKey = `ip:${ip}`;
  const emailStatus = isLocked(emailKey);
  const ipStatus = isLocked(ipKey);

  if (emailStatus.locked || ipStatus.locked) {
    const remaining = emailStatus.locked ? emailStatus.remaining : ipStatus.remaining;
    const seconds = Math.floor(remaining / 1000);
    return {
      blocked: true,
      remainingSeconds: seconds,
      emailAttempts: emailStatus.attempts || 0,
      ipAttempts: ipStatus.attempts || 0,
    };
  }

  const emailAttempts = emailStatus.attempts || 0;
  const ipAttempts = ipStatus.attempts || 0;
  const emailRemaining = Math.max(0, 5 - emailAttempts);
  const ipRemaining = Math.max(0, 5 - ipAttempts);

  return {
    blocked: false,
    emailAttempts,
    ipAttempts,
    emailRemaining,
    ipRemaining,
  };
};

const incrementRegistrationAttempts = (email, ip) => {
  const emailKey = `email:${email.toLowerCase()}`;
  const ipKey = `ip:${ip}`;
  incrementAttempts(emailKey);
  incrementAttempts(ipKey);
};

const resetRegistrationAttempts = (email, ip) => {
  const emailKey = `email:${email.toLowerCase()}`;
  const ipKey = `ip:${ip}`;
  attemptsMap.delete(emailKey);
  attemptsMap.delete(ipKey);
};

const resetEmailAttempts = (email) => {
  const emailKey = `email:${email.toLowerCase()}`;
  attemptsMap.delete(emailKey);
};

const resetIpAttempts = (ip) => {
  const ipKey = `ip:${ip}`;
  attemptsMap.delete(ipKey);
};

module.exports = {
  getRegistrationLimitInfo,
  incrementRegistrationAttempts,
  resetRegistrationAttempts,
  resetEmailAttempts,
  resetIpAttempts,
  attemptsMap,
};