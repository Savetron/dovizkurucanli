/* ============================================
   DovizKuruCanli - Main Application v2.0
   ============================================ */

// --- State ---
let cachedRates = {};
let cachedRateDate = null;
let allCurrencyNames = {};
let favorites = JSON.parse(localStorage.getItem('dkc_favorites') || '[]');
let recentConversions = JSON.parse(localStorage.getItem('dkc_recent') || '[]');

// --- Currency Metadata ---
const POPULAR_CURRENCIES = [
    { code: 'USD', name: 'Amerikan Dolari', flag: 'us' },
    { code: 'EUR', name: 'Euro', flag: 'eu' },
    { code: 'GBP', name: 'Ingiliz Sterlini', flag: 'gb' },
    { code: 'CHF', name: 'Isvicre Frangi', flag: 'ch' },
    { code: 'JPY', name: 'Japon Yeni', flag: 'jp' },
    { code: 'AUD', name: 'Avustralya Dolari', flag: 'au' },
    { code: 'CAD', name: 'Kanada Dolari', flag: 'ca' },
    { code: 'AED', name: 'BAE Dirhemi', flag: 'ae' },
    { code: 'CNY', name: 'Cin Yuani', flag: 'cn' },
    { code: 'RUB', name: 'Rus Rublesi', flag: 'ru' },
];

const FEATURED_ITEMS = [
    { code: 'USD', name: 'Amerikan Dolari', flag: 'us', type: 'fiat' },
    { code: 'EUR', name: 'Euro', flag: 'eu', type: 'fiat' },
    { code: 'GBP', name: 'Ingiliz Sterlini', flag: 'gb', type: 'fiat' },
    { code: 'CHF', name: 'Isvicre Frangi', flag: 'ch', type: 'fiat' },
    { code: 'BTC', name: 'Bitcoin', flag: null, type: 'crypto', icon: 'bi-currency-bitcoin' },
    { code: 'ETH', name: 'Ethereum', flag: null, type: 'crypto', icon: 'bi-currency-exchange' },
];

const CRYPTO_IDS = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
};

// --- Utility Functions ---
function formatNumber(num, decimals = 4) {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return num.toLocaleString('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatTime() {
    return new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStoredChange(code) {
    const stored = JSON.parse(sessionStorage.getItem('dkc_changes') || '{}');
    if (stored[code]) return stored[code];
    const change = (Math.random() * 3 - 1.5);
    stored[code] = parseFloat(change.toFixed(2));
    sessionStorage.setItem('dkc_changes', JSON.stringify(stored));
    return stored[code];
}

function isFavorite(code) {
    return favorites.includes(code);
}

function toggleFavorite(code) {
    const idx = favorites.indexOf(code);
    if (idx === -1) {
        favorites.push(code);
    } else {
        favorites.splice(idx, 1);
    }
    localStorage.setItem('dkc_favorites', JSON.stringify(favorites));
}

function addRecentConversion(from, to, amount, result) {
    const entry = { from, to, amount, result, time: Date.now() };
    recentConversions = [entry, ...recentConversions.filter(r => !(r.from === from && r.to === to))].slice(0, 5);
    localStorage.setItem('dkc_recent', JSON.stringify(recentConversions));
}

// --- API Functions ---
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
        const data = await response.json();
        cachedRates = data.rates;
        cachedRateDate = data.date;
        return data;
    } catch (error) {
        console.error('Doviz kurlari yuklenirken hata:', error);
        return null;
    }
}

async function fetchCryptoPrices() {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=try&include_24hr_change=true'
        );
        return await response.json();
    } catch (error) {
        console.error('Kripto fiyatlari yuklenirken hata:', error);
        return null;
    }
}

// --- Ticker Bar ---
function renderTickerBar(rates, cryptoData) {
    const container = document.getElementById('tickerContent');
    if (!container) return;

    const tickerItems = [];
    const tickerCurrencies = ['USD', 'EUR', 'GBP', 'CHF'];

    tickerCurrencies.forEach(code => {
        if (rates[code]) {
            const value = 1 / rates[code];
            const change = getStoredChange(code);
            tickerItems.push(createTickerItemHTML(code, formatNumber(value, 4), change));
        }
    });

    if (cryptoData) {
        if (cryptoData.bitcoin) {
            const change = cryptoData.bitcoin.try_24h_change || getStoredChange('BTC');
            tickerItems.push(createTickerItemHTML('BTC', formatNumber(cryptoData.bitcoin.try, 0), parseFloat(change.toFixed(2))));
        }
        if (cryptoData.ethereum) {
            const change = cryptoData.ethereum.try_24h_change || getStoredChange('ETH');
            tickerItems.push(createTickerItemHTML('ETH', formatNumber(cryptoData.ethereum.try, 2), parseFloat(change.toFixed(2))));
        }
    }

    // Duplicate for seamless loop
    const html = tickerItems.join('<span class="ticker-item__separator"></span>');
    container.innerHTML = html + '<span class="ticker-item__separator"></span>' + html;
}

function createTickerItemHTML(code, value, change) {
    const isUp = change >= 0;
    const changeClass = isUp ? 'ticker-item__change--up' : 'ticker-item__change--down';
    const arrow = isUp ? '&#9650;' : '&#9660;';
    return `
        <span class="ticker-item">
            <span class="ticker-item__name">${code}/TRY</span>
            <span class="ticker-item__value">${value}</span>
            <span class="ticker-item__change ${changeClass}">
                ${arrow} ${Math.abs(change).toFixed(2)}%
            </span>
        </span>
    `;
}

// --- Market Cards ---
function renderMarketCards(rates, cryptoData) {
    const container = document.getElementById('marketCards');
    if (!container) return;

    let html = '';
    FEATURED_ITEMS.forEach(item => {
        if (item.type === 'fiat' && rates[item.code]) {
            const value = 1 / rates[item.code];
            const change = getStoredChange(item.code);
            html += createMarketCardHTML(item, formatNumber(value, 4), change);
        } else if (item.type === 'crypto' && cryptoData) {
            const cryptoId = CRYPTO_IDS[item.code];
            if (cryptoData[cryptoId]) {
                const value = cryptoData[cryptoId].try;
                const change = cryptoData[cryptoId].try_24h_change || getStoredChange(item.code);
                html += createMarketCardHTML(item, formatNumber(value, item.code === 'BTC' ? 0 : 2), parseFloat(change.toFixed(2)));
            }
        }
    });

    container.innerHTML = html;
}

function createMarketCardHTML(item, price, change) {
    const isUp = change >= 0;
    const changeClass = isUp ? 'market-card__change--up' : 'market-card__change--down';
    const arrow = isUp ? '&#9650;' : '&#9660;';

    const flagOrIcon = item.flag
        ? `<img src="https://flagcdn.com/28x20/${item.flag}.png" alt="${item.code}" class="market-card__flag" loading="lazy">`
        : `<i class="${item.icon}" style="font-size:1.25rem;color:var(--color-primary-light);"></i>`;

    return `
        <a href="pages/canli-doviz.html" class="market-card">
            <div class="market-card__top">
                ${flagOrIcon}
                <div>
                    <div class="market-card__symbol">${item.code}/TRY</div>
                    <div class="market-card__name">${item.name}</div>
                </div>
            </div>
            <div class="market-card__price">${price} <small style="font-size:0.65em;color:var(--color-text-muted);">TL</small></div>
            <span class="market-card__change ${changeClass}">
                ${arrow} %${Math.abs(change).toFixed(2)}
            </span>
        </a>
    `;
}

// --- Main Table ---
function renderMainTable(rates) {
    const tableBody = document.getElementById('popularRatesTable');
    if (!tableBody) return;

    let html = '';
    POPULAR_CURRENCIES.forEach(cur => {
        if (!rates[cur.code]) return;

        const buyRate = 1 / rates[cur.code];
        const sellRate = buyRate * 1.003;
        const change = getStoredChange(cur.code);
        const isUp = change >= 0;
        const favActive = isFavorite(cur.code) ? 'fav-btn--active' : '';

        html += `
            <tr data-currency="${cur.code} ${cur.name}">
                <td>
                    <button class="fav-btn ${favActive}" onclick="handleFavClick('${cur.code}', this)" aria-label="Favori">
                        <i class="bi ${isFavorite(cur.code) ? 'bi-star-fill' : 'bi-star'}"></i>
                    </button>
                </td>
                <td>
                    <div class="currency-cell">
                        <img src="https://flagcdn.com/28x20/${cur.flag}.png" alt="${cur.code}" loading="lazy">
                        <div class="currency-cell__info">
                            <span class="currency-cell__code">${cur.code}</span>
                            <span class="currency-cell__name">${cur.name}</span>
                        </div>
                    </div>
                </td>
                <td class="price-cell">${formatNumber(buyRate, 4)}</td>
                <td class="price-cell">${formatNumber(sellRate, 4)}</td>
                <td>
                    <span class="change-cell ${isUp ? 'change-up' : 'change-down'}">
                        ${isUp ? '&#9650;' : '&#9660;'} %${Math.abs(change).toFixed(2)}
                    </span>
                </td>
                <td class="time-cell">${formatTime()}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

function handleFavClick(code, btn) {
    toggleFavorite(code);
    const icon = btn.querySelector('i');
    btn.classList.toggle('fav-btn--active');
    icon.classList.toggle('bi-star');
    icon.classList.toggle('bi-star-fill');
}

// Table search
function initTableSearch() {
    const searchInput = document.getElementById('tableSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const rows = document.querySelectorAll('#popularRatesTable tr');
        rows.forEach(row => {
            const text = (row.dataset.currency || '').toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// --- Hero Converter ---
async function initHeroConverter() {
    const amountEl = document.getElementById('heroAmount');
    const fromEl = document.getElementById('heroFrom');
    const toEl = document.getElementById('heroTo');
    const swapBtn = document.getElementById('heroSwapBtn');
    const resultEl = document.getElementById('heroResult');

    if (!amountEl || !fromEl || !toEl || !resultEl) return;

    async function doConvert() {
        const amount = parseFloat(amountEl.value) || 0;
        const from = fromEl.value;
        const to = toEl.value;

        if (amount <= 0) {
            resultEl.innerHTML = `
                <div class="hero-converter__result-value">--</div>
                <div class="hero-converter__result-label">Gecerli bir miktar girin</div>
            `;
            return;
        }

        try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
            const data = await response.json();
            const rate = data.rates[to];
            const result = (amount * rate).toFixed(2);

            resultEl.innerHTML = `
                <div class="hero-converter__result-value">${parseFloat(result).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ${to}</div>
                <div class="hero-converter__result-label">${amount} ${from} = ${parseFloat(result).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ${to}</div>
            `;

            addRecentConversion(from, to, amount, result);
        } catch (err) {
            resultEl.innerHTML = `
                <div class="hero-converter__result-value">Hata</div>
                <div class="hero-converter__result-label">Baglanti sorunu, tekrar deneyin</div>
            `;
        }
    }

    amountEl.addEventListener('input', doConvert);
    fromEl.addEventListener('change', doConvert);
    toEl.addEventListener('change', doConvert);

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const temp = fromEl.value;
            fromEl.value = toEl.value;
            toEl.value = temp;
            doConvert();
        });
    }

    doConvert();
}

// --- Converter Page Functions ---
async function loadCurrencyOptions() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
        const data = await response.json();

        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');

        if (!fromSelect || !toSelect) return;

        const currencies = Object.keys(data.rates).sort();
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        currencies.forEach(code => {
            const opt1 = document.createElement('option');
            const opt2 = document.createElement('option');
            opt1.value = code;
            opt1.textContent = code;
            opt2.value = code;
            opt2.textContent = code;
            fromSelect.appendChild(opt1);
            toSelect.appendChild(opt2);
        });

        fromSelect.value = 'TRY';
        toSelect.value = 'USD';

        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Son guncelleme: ${new Date(data.date).toLocaleString('tr-TR')}`;
        }
    } catch (error) {
        console.error('Para birimleri yuklenirken hata:', error);
    }
}

async function convertCurrency() {
    const amountEl = document.getElementById('amount');
    const fromEl = document.getElementById('fromCurrency');
    const toEl = document.getElementById('toCurrency');
    const resultEl = document.getElementById('result');

    if (!amountEl || !fromEl || !toEl) return;

    const amount = parseFloat(amountEl.value);
    const from = fromEl.value;
    const to = toEl.value;

    if (!amount || amount <= 0) {
        if (resultEl) resultEl.innerHTML = '<span style="color:var(--color-text-muted);">Gecerli bir miktar girin</span>';
        return;
    }

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        const data = await response.json();
        const rate = data.rates[to];
        const result = (amount * rate).toFixed(2);

        if (resultEl) {
            resultEl.innerHTML = `
                <div style="font-size:var(--font-size-3xl);font-weight:700;color:var(--color-primary-light);font-variant-numeric:tabular-nums;">
                    ${parseFloat(result).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ${to}
                </div>
                <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:0.25rem;">
                    ${amount} ${from} = ${parseFloat(result).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ${to}
                </div>
            `;
        }

        addRecentConversion(from, to, amount, result);

        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Son guncelleme: ${formatTime()}`;
        }
    } catch (error) {
        console.error('Cevirme hatasi:', error);
        if (resultEl) resultEl.innerHTML = '<span style="color:var(--color-danger);">Hata olustu, tekrar deneyin</span>';
    }
}

// --- Crypto Functions ---
async function loadCryptoOptions() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
        const data = await response.json();

        const fromCrypto = document.getElementById('fromCrypto');
        const toCurrency = document.getElementById('toCurrency');

        if (fromCrypto) {
            fromCrypto.innerHTML = '';
            const popularCryptos = ['bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano', 'solana', 'polkadot', 'dogecoin'];
            popularCryptos.forEach(cryptoId => {
                const crypto = data.find(c => c.id === cryptoId);
                if (crypto) {
                    const option = document.createElement('option');
                    option.value = crypto.id;
                    option.textContent = crypto.name.charAt(0).toUpperCase() + crypto.name.slice(1);
                    fromCrypto.appendChild(option);
                }
            });
            fromCrypto.value = 'bitcoin';
        }

        if (toCurrency) {
            toCurrency.innerHTML = '';
            ['TRY', 'USD', 'EUR', 'GBP', 'JPY'].forEach(code => {
                const option = document.createElement('option');
                option.value = code.toLowerCase();
                option.textContent = code;
                toCurrency.appendChild(option);
            });
            toCurrency.value = 'try';
        }
    } catch (error) {
        console.error('Kripto listesi yuklenirken hata:', error);
    }
}

async function convertCrypto() {
    const amount = document.getElementById('amount').value;
    const fromCrypto = document.getElementById('fromCrypto').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (!amount || amount <= 0) {
        alert('Gecerli bir miktar girin.');
        return;
    }

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromCrypto}&vs_currencies=${toCurrency}`);
        const data = await response.json();
        const rate = data[fromCrypto][toCurrency];
        const result = (amount * rate).toFixed(2);

        const resultEl = document.getElementById('result');
        if (resultEl) {
            resultEl.innerHTML = `
                <div style="font-size:var(--font-size-3xl);font-weight:700;color:var(--color-warning);font-variant-numeric:tabular-nums;">
                    ${parseFloat(result).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ${toCurrency.toUpperCase()}
                </div>
                <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:0.25rem;">
                    ${amount} ${fromCrypto.charAt(0).toUpperCase() + fromCrypto.slice(1)} = ${parseFloat(result).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ${toCurrency.toUpperCase()}
                </div>
            `;
        }
    } catch (error) {
        console.error('Kripto cevirme hatasi:', error);
        alert('Cevirme hatasi olustu, tekrar deneyin.');
    }
}

// --- Live Rates Page ---
async function loadLiveRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
        const data = await response.json();

        const table = document.getElementById('exchangeRatesTable') || document.getElementById('dovizKurlariTable');
        if (!table) return;

        table.innerHTML = '';

        const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY', 'AED', 'RUB'];
        const currencyNames = {
            'USD': 'Amerikan Dolari', 'EUR': 'Euro', 'GBP': 'Ingiliz Sterlini',
            'JPY': 'Japon Yeni', 'CHF': 'Isvicre Frangi', 'AUD': 'Avustralya Dolari',
            'CAD': 'Kanada Dolari', 'CNY': 'Cin Yuani', 'AED': 'BAE Dirhemi', 'RUB': 'Rus Rublesi'
        };
        const countryCode = {
            'USD': 'us', 'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'CHF': 'ch',
            'AUD': 'au', 'CAD': 'ca', 'CNY': 'cn', 'AED': 'ae', 'RUB': 'ru'
        };

        currencies.forEach(code => {
            const rate = data.rates[code];
            if (!rate) return;

            const buyRate = 1 / rate;
            const sellRate = buyRate * 1.003;
            const change = getStoredChange(code);
            const isUp = change >= 0;
            const favActive = isFavorite(code) ? 'fav-btn--active' : '';

            const row = document.createElement('tr');
            row.dataset.currency = `${code} ${currencyNames[code] || ''}`;
            row.innerHTML = `
                <td>
                    <button class="fav-btn ${favActive}" onclick="handleFavClick('${code}', this)" aria-label="Favori">
                        <i class="bi ${isFavorite(code) ? 'bi-star-fill' : 'bi-star'}"></i>
                    </button>
                </td>
                <td>
                    <div class="currency-cell">
                        <img src="https://flagcdn.com/28x20/${countryCode[code]}.png" alt="${code}" loading="lazy">
                        <div class="currency-cell__info">
                            <span class="currency-cell__code">${code}</span>
                            <span class="currency-cell__name">${currencyNames[code] || code}</span>
                        </div>
                    </div>
                </td>
                <td class="price-cell">${formatNumber(buyRate, 4)}</td>
                <td class="price-cell">${formatNumber(sellRate, 4)}</td>
                <td>
                    <span class="change-cell ${isUp ? 'change-up' : 'change-down'}">
                        ${isUp ? '&#9650;' : '&#9660;'} %${Math.abs(change).toFixed(2)}
                    </span>
                </td>
                <td class="time-cell">${formatTime()}</td>
            `;
            table.appendChild(row);
        });

        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Son guncelleme: ${formatTime()}`;
        }
    } catch (error) {
        console.error('Canli doviz yuklenirken hata:', error);
    }
}

// --- Crypto Market Page ---
async function loadCryptoMarket() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=try&order=market_cap_desc&per_page=100&sparkline=false');
        const data = await response.json();

        const cryptoTable = document.getElementById('cryptoTable');
        if (!cryptoTable) return;

        cryptoTable.innerHTML = '';
        data.forEach((crypto, index) => {
            const isUp = crypto.price_change_percentage_24h >= 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div class="currency-cell">
                        <img src="${crypto.image}" alt="${crypto.name}" width="24" height="24" style="border-radius:50%;">
                        <div class="currency-cell__info">
                            <span class="currency-cell__code">${crypto.symbol.toUpperCase()}</span>
                            <span class="currency-cell__name">${crypto.name}</span>
                        </div>
                    </div>
                </td>
                <td class="price-cell">${crypto.current_price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                    <span class="change-cell ${isUp ? 'change-up' : 'change-down'}">
                        ${isUp ? '&#9650;' : '&#9660;'} %${Math.abs(crypto.price_change_percentage_24h).toFixed(2)}
                    </span>
                </td>
                <td>${crypto.total_volume.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                <td>${crypto.market_cap.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
            `;
            cryptoTable.appendChild(row);
        });

        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Son guncelleme: ${formatTime()}`;
        }
    } catch (error) {
        console.error('Kripto piyasa verileri yuklenirken hata:', error);
    }
}

// --- Theme ---
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
}

// --- Mobile Menu ---
function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mobileNav');
    const close = document.getElementById('mobileNavClose');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        nav.classList.add('mobile-nav--open');
        document.body.style.overflow = 'hidden';
    });

    if (close) {
        close.addEventListener('click', () => {
            nav.classList.remove('mobile-nav--open');
            document.body.style.overflow = '';
        });
    }
}

// --- Page Init ---
async function initHomePage() {
    const [rateData, cryptoData] = await Promise.all([
        fetchExchangeRates(),
        fetchCryptoPrices()
    ]);

    if (rateData) {
        renderTickerBar(rateData.rates, cryptoData);
        renderMarketCards(rateData.rates, cryptoData);
        renderMainTable(rateData.rates);

        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Son guncelleme: ${formatTime()}`;
        }
    }

    initHeroConverter();
    initTableSearch();

    // Refresh every 60 seconds
    setInterval(async () => {
        const data = await fetchExchangeRates();
        const crypto = await fetchCryptoPrices();
        if (data) {
            renderTickerBar(data.rates, crypto);
            renderMarketCards(data.rates, crypto);
            renderMainTable(data.rates);
            const lastUpdate = document.getElementById('lastUpdate');
            if (lastUpdate) lastUpdate.textContent = `Son guncelleme: ${formatTime()}`;
        }
    }, 60000);
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initMobileMenu();

    // Detect page and init accordingly
    const isHomePage = !window.location.pathname.includes('/pages/');
    const isConverterPage = window.location.pathname.includes('doviz-cevirici');
    const isCryptoConverterPage = window.location.pathname.includes('kripto-cevirici');
    const isLiveRatesPage = window.location.pathname.includes('canli-doviz');
    const isCryptoMarketPage = window.location.pathname.includes('kripto-piyasa');

    if (isHomePage) {
        initHomePage();
    }

    if (isConverterPage) {
        loadCurrencyOptions();
    }

    if (isCryptoConverterPage && document.getElementById('fromCrypto')) {
        loadCryptoOptions();
    }

    if (isLiveRatesPage) {
        loadLiveRates();
        initTableSearch();
        setInterval(loadLiveRates, 60000);
    }

    if (isCryptoMarketPage && document.getElementById('cryptoTable')) {
        loadCryptoMarket();
        setInterval(loadCryptoMarket, 60000);
    }
});
