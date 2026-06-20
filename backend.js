(function () {
    const STORAGE_KEY = 'aurus_saas_state';

    const defaultState = {
        generatedLinks: [],
        transactions: [],
    };

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...defaultState };
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return { ...defaultState };
            return {
                generatedLinks: Array.isArray(parsed.generatedLinks) ? parsed.generatedLinks : [],
                transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            };
        } catch (error) {
            console.warn('Aurus backend state reset due to parse error.', error);
            localStorage.removeItem(STORAGE_KEY);
            return { ...defaultState };
        }
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('aurusStateChanged', { detail: getState() }));
    }

    function getState() {
        return loadState();
    }

    function getGeneratedLinks(limit = 8) {
        const state = loadState();
        return [...state.generatedLinks].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    }

    function getRecentTransactions(limit = 8) {
        const state = loadState();
        return [...state.transactions]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    function recordGeneratedLink(payload) {
        const state = loadState();
        state.generatedLinks.unshift({
            id: payload.id,
            url: payload.url,
            product: payload.product,
            tier: payload.tier,
            price: Number(payload.price),
            status: 'Ready',
            createdAt: payload.createdAt || Date.now(),
        });
        if (state.generatedLinks.length > 24) {
            state.generatedLinks = state.generatedLinks.slice(0, 24);
        }
        saveState(state);
        return state.generatedLinks[0];
    }

    function recordTransaction(payload) {
        const state = loadState();
        state.transactions.unshift({
            id: payload.id || `tx-${Date.now().toString(36)}`,
            signature: payload.signature,
            amount: Number(payload.amount),
            tier: payload.tier,
            product: payload.product || payload.tier,
            status: payload.status,
            timestamp: payload.timestamp || Date.now(),
        });
        if (state.transactions.length > 32) {
            state.transactions = state.transactions.slice(0, 32);
        }
        saveState(state);
        return state.transactions[0];
    }

    function getTotalRevenue() {
        const state = loadState();
        return state.transactions
            .filter((tx) => tx.status === 'Success')
            .reduce((sum, tx) => sum + tx.amount, 0);
    }

    function getActiveSubscribers() {
        const state = loadState();
        const uniqueTiers = new Set(
            state.transactions
                .filter((tx) => tx.status === 'Success')
                .map((tx) => tx.tier || tx.product),
        );
        return Math.max(uniqueTiers.size, state.transactions.filter((tx) => tx.status === 'Success').length);
    }

    function getChurnRate() {
        const state = loadState();
        const all = state.transactions.filter((tx) => tx.status === 'Success' || tx.status === 'Failed').length;
        if (!all) return 4.3;
        const failed = state.transactions.filter((tx) => tx.status === 'Failed').length;
        const rate = (failed / all) * 12 + 4;
        return Math.min(28, Math.max(4, rate));
    }

    function getStatusCounts() {
        const state = loadState();
        return state.transactions.reduce(
            (acc, tx) => {
                acc[tx.status] = (acc[tx.status] || 0) + 1;
                return acc;
            },
            { Success: 0, Pending: 0, Failed: 0 },
        );
    }

    function getMockRevenueHistory() {
        const state = loadState();
        const base = [2.2, 2.5, 3.1, 3.4, 3.9, 4.7, 5.3];
        const total = getTotalRevenue();
        return base.map((value, index) => value + total * 0.12 * index);
    }

    function initState() {
        const state = loadState();
        saveState(state);
    }

    // ============================================================
    // SMART NATURAL LANGUAGE PARSER FOR SUBSCRIPTION EXTRACTION
    // ============================================================
    function parseSubscriptionPrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            return { price: 0.01, currency: 'SOL', interval: 'month', plan: 'Basic Plan' };
        }

        const result = {
            price: 0.01,
            currency: 'SOL',
            interval: 'month',
            plan: 'Basic Plan',
        };

        // Extract plan name (first capitalized words before numbers)
        const planMatch = prompt.match(/^([A-Z][a-zA-Z\s]+?)(?=\d|for|per|at|subscription)/i);
        if (planMatch) {
            result.plan = planMatch[1].trim();
        }

        // Extract price and currency
        const priceMatch = prompt.match(/\$?(\d+(?:\.\d{1,8})?)\s*(SOL|USD|dollars?|eth)?/i);
        if (priceMatch) {
            result.price = parseFloat(priceMatch[1]);
            if (priceMatch[2]) {
                result.currency = priceMatch[2].toUpperCase().startsWith('D') ? 'USD' : priceMatch[2].toUpperCase();
            }
        }

        // Extract interval (week/month/year)
        const intervalMatch = prompt.match(/\b(weekly|week|w|monthly|month|m|yearly|year|y|annual)\b/i);
        if (intervalMatch) {
            const interval = intervalMatch[1].toLowerCase();
            if (interval.includes('week') || interval === 'w') result.interval = 'week';
            else if (interval.includes('year') || interval === 'y' || interval === 'annual') result.interval = 'year';
            else result.interval = 'month';
        }

        return result;
    }

    window.AurusBackend = {
        getState,
        getGeneratedLinks,
        getRecentTransactions,
        getTotalRevenue,
        getActiveSubscribers,
        getChurnRate,
        getStatusCounts,
        getMockRevenueHistory,
        recordGeneratedLink,
        recordTransaction,
        initState,
        parseSubscriptionPrompt,
    };

    initState();
})();