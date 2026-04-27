/**
 * Runlytics — app.js
 * Founder runway calculator
 */

'use strict';

// ── Constants ────────────────────────────────────────────────

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS_PER_MONTH = 30.44;
const MAX_RUNWAY_MONTHS = 120;

const STATE = {
  IDLE:   'idle',
  SAFE:   'safe',
  WARN:   'warn',
  DANGER: 'danger',
};

const INSIGHTS = {
  [STATE.SAFE]: {
    healthy: 'Most Series A investors want to see at least 18 months post-close. You\'re in a position to raise from strength, not desperation — a rare and valuable thing.',
    good:    'Start the fundraise now. It takes 3–6 months on average. If you wait until 6 months left, you\'ll negotiate from fear.',
  },
  [STATE.WARN]: {
    caution: 'This is the danger zone that kills companies slowly — not with a bang but with optimism. Start cutting costs this week.',
    warning: 'Forget the pitch deck. Call your best existing customers. Find one that will pay upfront for 6 months of service. That\'s your bridge.',
  },
  [STATE.DANGER]: {
    critical: 'Make two lists: the three biggest cost lines you can cut today, and the five people most likely to wire you money this week. Work those lists, nothing else.',
  },
};

// ── DOM References ───────────────────────────────────────────

const dom = {
  cash:         document.getElementById('cash'),
  burn:         document.getElementById('burn'),
  rev:          document.getElementById('rev'),
  growth:       document.getElementById('growth'),
  liveDot:      document.getElementById('liveDot'),
  resultPanel:  document.getElementById('resultPanel'),
  statusWord:   document.getElementById('statusWord'),
  bigNumber:    document.getElementById('bigNumber'),
  emptyState:   document.getElementById('emptyState'),
  resultDesc:   document.getElementById('resultDesc'),
  dangerBanner: document.getElementById('dangerBanner'),
  dangerMsg:    document.getElementById('dangerMsg'),
  safeBanner:   document.getElementById('safeBanner'),
  safeMsg:      document.getElementById('safeMsg'),
  resultGrid:   document.getElementById('resultGrid'),
  statDate:     document.getElementById('statDate'),
  statDays:     document.getElementById('statDays'),
  statBurn:     document.getElementById('statBurn'),
  trackFill:    document.getElementById('trackFill'),
  insightPanel: document.getElementById('insightPanel'),
  insightText:  document.getElementById('insightText'),
};

// ── Formatters ───────────────────────────────────────────────

/**
 * Format a dollar amount into a compact string.
 * @param {number} n
 * @returns {string}
 */
function formatCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

/**
 * Format a future date as "Mon 'YY".
 * @param {Date} date
 * @returns {string}
 */
function formatZeroDate(date) {
  return `${MONTH_NAMES[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`;
}

// ── Runway Calculation ───────────────────────────────────────

/**
 * Calculate runway in months with a flat burn rate.
 * @param {number} cash
 * @param {number} netBurn
 * @returns {number}
 */
function calcRunwayFlat(cash, netBurn) {
  return cash / netBurn;
}

/**
 * Calculate runway in months where revenue grows monthly,
 * reducing burn iteratively.
 * @param {number} cash
 * @param {number} netBurn
 * @param {number} monthlyGrowthPct  e.g. 5 for 5%
 * @returns {number}
 */
function calcRunwayWithGrowth(cash, netBurn, monthlyGrowthPct) {
  let remaining = cash;
  let currentBurn = netBurn;
  let months = 0;

  while (remaining > 0 && months < MAX_RUNWAY_MONTHS) {
    remaining   -= currentBurn;
    months      += 1;
    currentBurn  = Math.max(0, currentBurn - currentBurn * (monthlyGrowthPct / 100));
  }

  return remaining > 0 ? MAX_RUNWAY_MONTHS : months;
}

// ── State Classifier ─────────────────────────────────────────

/**
 * Derive the runway state and copy from a months value.
 * @param {number} months
 * @returns {{ state: string, cssClass: string, word: string, desc: string, insight: string, safeMsg?: string, dangerMsg?: string }}
 */
function classify(months) {
  if (months >= 6) {
    return {
      state:     STATE.SAFE,
      cssClass:  'is-safe',
      word:      'Positive',
      desc:      'At least 6 months of runway. You have room to act deliberately.',
      insight:   INSIGHTS[STATE.SAFE].healthy,
      safeMsg:   'You have 6+ months of runway. Use this window to build, grow revenue, and make the next move before pressure compounds.',
    };
  }

  if (false && months >= 12) {
    return {
      state:    STATE.SAFE,
      cssClass: 'is-safe',
      word:     'Good',
      desc:     'A year of runway. Enough to raise, not enough to relax.',
      insight:  INSIGHTS[STATE.SAFE].good,
      safeMsg:  'Solid position — but the clock is ticking. Start investor conversations before you feel the pressure.',
    };
  }

  if (false && months >= 6) {
    return {
      state:    STATE.WARN,
      cssClass: 'is-warn',
      word:     'Caution',
      desc:     'Under 12 months. The clock is now the loudest thing in the room.',
      insight:  INSIGHTS[STATE.WARN].caution,
    };
  }

  if (months >= 3) {
    return {
      state:    STATE.WARN,
      cssClass: 'is-warn',
      word:     'Warning',
      desc:     'Under 6 months. Every week you delay is a week you can\'t recover.',
      insight:  INSIGHTS[STATE.WARN].warning,
    };
  }

  return {
    state:    STATE.DANGER,
    cssClass: 'is-danger',
    word:     'Critical',
    desc:     'Under 3 months. This is a crisis — everything else is noise.',
    insight:  INSIGHTS[STATE.DANGER].critical,
  };
}

// ── UI Helpers ───────────────────────────────────────────────

/** Remove all state classes from the result panel. */
function clearPanelState() {
  dom.resultPanel.classList.remove('is-safe', 'is-warn', 'is-danger');
}

/** Set the big runway number display. */
function setBigNumber(months) {
  const display = months >= MAX_RUNWAY_MONTHS ? '24+' : months.toFixed(1);
  dom.bigNumber.innerHTML = `${display}<span class="big-unit">mo</span>`;
}

/** Show/hide the result grid and populate its cells. */
function setStats(months, netBurn) {
  const days    = Math.round(months * DAYS_PER_MONTH);
  const zeroDate = new Date();
  zeroDate.setMonth(zeroDate.getMonth() + Math.floor(months));

  dom.statDate.textContent = formatZeroDate(zeroDate);
  dom.statDays.textContent = days.toLocaleString();
  dom.statBurn.textContent = formatCurrency(netBurn);

  dom.resultGrid.hidden = false;
}

/** Update the progress track bar. */
function setTrack(months, color) {
  const pct = Math.min((months / 24) * 100, 100);
  dom.trackFill.style.width      = `${pct}%`;
  dom.trackFill.style.background = color;
}

/** Reset UI to idle/empty state. */
function renderIdle() {
  clearPanelState();
  dom.liveDot.classList.remove('is-active');
  dom.statusWord.textContent = 'Waiting';

  dom.bigNumber.innerHTML = '<span class="big-number-placeholder">—</span>';
  dom.emptyState.hidden   = false;
  dom.emptyState.textContent = 'Type your numbers above.';

  dom.resultDesc.hidden   = true;
  dom.dangerBanner.hidden = true;
  dom.safeBanner.hidden   = true;
  dom.resultGrid.hidden   = true;
  dom.insightPanel.hidden = true;

  dom.trackFill.style.width      = '0%';
  dom.trackFill.style.background = 'var(--color-muted)';
}

/** Render the profitable / default-alive state. */
function renderProfitable() {
  clearPanelState();
  dom.resultPanel.classList.add('is-safe');
  dom.liveDot.classList.add('is-active');
  dom.statusWord.textContent = 'Profitable';

  dom.bigNumber.innerHTML = `&#x221e;<span class="big-unit">mo</span>`;
  dom.emptyState.hidden   = false;
  dom.emptyState.textContent = 'Revenue exceeds burn. Default alive.';

  dom.resultDesc.hidden   = true;
  dom.dangerBanner.hidden = true;

  dom.safeMsg.textContent  = 'Revenue is outpacing burn — you have positive unit economics. This is the position every founder wants to be in.';
  dom.safeBanner.hidden    = false;

  dom.resultGrid.hidden   = true;
  dom.insightPanel.hidden = true;

  setTrack(24, 'var(--color-safe)');
}

/** Render a calculated runway result. */
function renderResult(months, netBurn) {
  const info = classify(months);

  clearPanelState();
  dom.resultPanel.classList.add(info.cssClass);
  dom.liveDot.classList.add('is-active');
  dom.statusWord.textContent = info.word;

  setBigNumber(months);
  dom.emptyState.hidden = true;

  dom.resultDesc.textContent = info.desc;
  dom.resultDesc.hidden      = false;

  // Banners — show only the relevant one
  if (info.dangerMsg || info.state === STATE.DANGER) {
    const days = Math.round(months * DAYS_PER_MONTH);
    dom.dangerMsg.textContent = `You have ${days} days before you hit zero. Stop all non-essential spending now. Call your investors today — not tomorrow.`;
    dom.dangerBanner.hidden = false;
    dom.safeBanner.hidden   = true;
  } else if (info.safeMsg) {
    dom.safeMsg.textContent = info.safeMsg;
    dom.safeBanner.hidden   = false;
    dom.dangerBanner.hidden = true;
  } else {
    dom.dangerBanner.hidden = true;
    dom.safeBanner.hidden   = true;
  }

  setStats(months, netBurn);

  // Track color
  const trackColors = {
    [STATE.SAFE]:   'var(--color-safe)',
    [STATE.WARN]:   'var(--color-warn)',
    [STATE.DANGER]: 'var(--color-danger)',
  };
  setTrack(months, trackColors[info.state]);

  // Insight
  dom.insightText.textContent = info.insight;
  dom.insightText.className   = 'insight-text';
  if (info.state === STATE.DANGER) dom.insightText.classList.add('is-danger');
  if (info.state === STATE.SAFE)   dom.insightText.classList.add('is-safe');
  dom.insightPanel.hidden = false;
}

// ── Main Calculate Function ──────────────────────────────────

function calculate() {
  const cash   = parseFloat(dom.cash.value)   || 0;
  const burn   = parseFloat(dom.burn.value)   || 0;
  const rev    = parseFloat(dom.rev.value)    || 0;
  const growth = parseFloat(dom.growth.value) || 0;

  // Not enough data yet
  if (!cash || !burn) {
    renderIdle();
    return;
  }

  const netBurn = Math.max(burn - rev, 0);

  // Revenue covers burn entirely
  if (netBurn === 0) {
    renderProfitable();
    return;
  }

  const months = growth > 0
    ? calcRunwayWithGrowth(cash, netBurn, growth)
    : calcRunwayFlat(cash, netBurn);

  renderResult(months, netBurn);
}

// ── Event Listeners ──────────────────────────────────────────

['cash', 'burn', 'rev', 'growth'].forEach((id) => {
  document.getElementById(id).addEventListener('input', calculate);
});

// ── Init ─────────────────────────────────────────────────────

renderIdle();
