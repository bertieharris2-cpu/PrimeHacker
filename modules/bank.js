/**
 * PRIMENET Banking System
 * Manages wallet, run earnings, accounts, and transaction ledger
 * Persists to localStorage for cross-session continuity
 */

const Bank = (() => {
  let state = {
    walletBalance: 0,
    runEarnings: 0,
    accounts: [],
    currentAccountId: null,
    ledger: []
  };

  // One bank (wallet, accounts, ledger) per codename, so students sharing a computer don't share a wallet.
  const agent = window.Primenet && window.Primenet.getAgent();
  const STORAGE_KEY = 'PRIMENET_BANK_V1' + (agent && agent.codename ? '_' + agent.codename : '');

  // --- Utilities ---
  function formatGBP(n) {
    return '£' + Math.floor(n).toLocaleString('en-GB');
  }

  function seedDefaultAccounts() {
    const names = {
      L1: [
        'Rivercross Utilities',
        'Northwick Transit',
        'Sentinel Finance',
        'Haven Council'
      ],
      L2: [
        'Ember Freight',
        'Crystal Holdings',
        'Vault Secure',
        'Pinnacle Corp'
      ],
      L3: [
        'Helix Dynamics',
        'Nexus Global',
        'Kronos Finance',
        'Atlas Prime'
      ]
    };

    const balanceRanges = {
      L1: [200000, 900000],
      L2: [2000000, 9000000],
      L3: [20000000, 90000000]
    };

    const accounts = [];
    Object.keys(names).forEach(tier => {
      names[tier].forEach(name => {
        const id = `ACCT-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
        const [min, max] = balanceRanges[tier];
        const balance = Math.floor(Math.random() * (max - min + 1)) + min;
        accounts.push({
          id,
          name,
          tier,
          balance,
          created: Date.now()
        });
      });
    });
    return accounts;
  }

  // Calculate withdrawal amount based on difficulty and lock index (1-4)
  function getWithdrawalAmount(diff, lockIndex) {
    const bands = {
      L1: [
        { min: 1000, max: 2500 },   // lock 1
        { min: 2000, max: 4000 },   // lock 2
        { min: 3500, max: 6000 },   // lock 3
        { min: 5000, max: 9000 }    // lock 4
      ],
      L2: [
        { min: 10000, max: 25000 },
        { min: 20000, max: 40000 },
        { min: 35000, max: 60000 },
        { min: 50000, max: 90000 }
      ],
      L3: [
        { min: 100000, max: 250000 },
        { min: 200000, max: 400000 },
        { min: 350000, max: 600000 },
        { min: 500000, max: 900000 }
      ]
    };

    const band = bands[diff][lockIndex - 1];
    return Math.floor(Math.random() * (band.max - band.min + 1)) + band.min;
  }

  // --- Core Methods ---
  function initialize() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        state = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load bank state:', e);
        state.accounts = seedDefaultAccounts();
      }
    } else {
      state.accounts = seedDefaultAccounts();
    }
    // A wallet saved without any bank accounts (e.g. only a shop purchase) gets fresh ones
    if (!Array.isArray(state.accounts) || !state.accounts.length) state.accounts = seedDefaultAccounts();
    if (!Array.isArray(state.ledger)) state.ledger = [];
    if (typeof state.runEarnings !== 'number') state.runEarnings = 0;
    if (typeof state.walletBalance !== 'number') state.walletBalance = 0;
    save();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getRandomAccountForTier(tier) {
    const candidates = state.accounts.filter(a => a.tier === tier);
    return candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)] 
      : null;
  }

  function selectAccountForRun(diff) {
    const account = getRandomAccountForTier(diff);
    if (account) {
      state.currentAccountId = account.id;
      save();
    }
    return account;
  }

  // The mission's named bank, if it's in this tier (see Primenet.mission())
  function selectAccountByName(diff, name) {
    const account = state.accounts.find(a => a.tier === diff && a.name === name);
    if (!account) return selectAccountForRun(diff);
    state.currentAccountId = account.id;
    save();
    return account;
  }

  function getCurrentAccount() {
    if (!state.currentAccountId) return null;
    return state.accounts.find(a => a.id === state.currentAccountId);
  }

  function withdrawForLock(diff, lockIndex) {
    const amount = getWithdrawalAmount(diff, lockIndex);
    
    if (!state.currentAccountId) {
      selectAccountForRun(diff);
    }

    const account = getCurrentAccount();
    if (!account) return 0;

    // Withdraw but clamp so account can't go below 0
    const withdrawn = Math.min(amount, account.balance);
    account.balance -= withdrawn;
    state.runEarnings += withdrawn;

    state.ledger.push({
      ts: Date.now(),
      type: 'withdraw',
      module: 'prime_hack',
      diff,
      lockIndex,
      amount: withdrawn,
      accountId: account.id
    });

    save();
    return withdrawn;
  }

  // Extra money for this run, e.g. the Blueprint quiz's intel bonus
  function addRunBonus(amount, note) {
    amount = Math.max(0, Math.floor(amount));
    if (!amount) return 0;
    state.runEarnings += amount;
    state.ledger.push({ ts: Date.now(), type: 'bonus', module: 'prime_hack', note: note || '', amount });
    save();
    return amount;
  }

  function bankRun(diff) {
    if (state.runEarnings <= 0) return 0;

    state.walletBalance += state.runEarnings;
    const banked = state.runEarnings;
    state.runEarnings = 0;
    state.currentAccountId = null; // reset for next run

    state.ledger.push({
      ts: Date.now(),
      type: 'bank',
      module: 'prime_hack',
      diff,
      amountBanked: banked
    });

    save();
    return banked;
  }

  // --- Getters ---
  function getState() {
    return { ...state };
  }

  function getWalletBalance() {
    return state.walletBalance;
  }

  function getRunEarnings() {
    return state.runEarnings;
  }

  function getAccountById(id) {
    return state.accounts.find(a => a.id === id);
  }

  // Load straight away: Prime Hack picks the target bank while the page is still loading,
  // and waiting for DOMContentLoaded used to wipe that choice.
  initialize();

  // --- Public API ---
  return {
    initialize,
    save,
    formatGBP,
    getRandomAccountForTier,
    selectAccountForRun,
    selectAccountByName,
    getCurrentAccount,
    withdrawForLock,
    bankRun,
    addRunBonus,
    getState,
    getWalletBalance,
    getRunEarnings,
    getAccountById
  };
})();

// Expose globally
window.Bank = Bank;
