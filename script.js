let rates = {};
let allCurrencies = [];
let popularCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'aed', 'chf', 'cad', 'aud', 'nzd', 'sgd'];

// API'den tüm para birimlerini çek
async function fetchAllCurrencies() {
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json');
        const data = await response.json();
        allCurrencies = Object.keys(data);
        updateCurrencySelects();
    } catch (error) {
        console.error('Para birimleri yüklenirken hata oluştu:', error);
    }
}

// API'den kurları çek
async function fetchRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
        const data = await response.json();
        
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];
        const dovizKurlariTable = document.getElementById('dovizKurlariTable');
        const lastUpdate = document.getElementById('lastUpdate');
        
        // Ülke kodları
        const countryCodes = {
            'USD': 'us',
            'EUR': 'eu',
            'GBP': 'gb',
            'JPY': 'jp',
            'CHF': 'ch',
            'AUD': 'au',
            'CAD': 'ca'
        };
        
        if (dovizKurlariTable) {
            dovizKurlariTable.innerHTML = '';
            popularCurrencies.forEach(currency => {
                const rate = 1 / data.rates[currency];
                const change = calculateChange(currency, rate);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <img src="https://flagcdn.com/24x18/${countryCodes[currency]}.png"
                             width="24"
                             height="18"
                             class="me-2"
                             alt="${currency}">
                        ${currency}
                    </td>
                    <td>${rate.toFixed(4)}</td>
                    <td>${(rate * 1.001).toFixed(4)}</td>
                    <td class="${change >= 0 ? 'text-success' : 'text-danger'}">
                        ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                    </td>
                `;
                dovizKurlariTable.appendChild(row);
            });
        }
        
        if (lastUpdate) {
            lastUpdate.textContent = `Son Güncelleme: ${new Date().toLocaleTimeString('tr-TR')}`;
        }
    } catch (error) {
        console.error('Döviz kurları yüklenirken hata:', error);
    }
}

// Para birimi seçeneklerini güncelle
function updateCurrencySelects() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    // Mevcut seçenekleri temizle
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Para birimlerini alfabetik sırayla ekle
    allCurrencies.sort().forEach(currency => {
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');
        
        option1.value = currency;
        option2.value = currency;
        
        // Para birimi adını formatla
        const currencyName = formatCurrencyName(currency);
        option1.textContent = `${currency.toUpperCase()} - ${currencyName}`;
        option2.textContent = `${currency.toUpperCase()} - ${currencyName}`;
        
        // Varsayılan seçenekleri ayarla
        if (currency === 'try') {
            option1.selected = true;
        }
        if (currency === 'usd') {
            option2.selected = true;
        }
        
        fromSelect.appendChild(option1);
        toSelect.appendChild(option2);
    });
}

// Para birimi adını formatla
function formatCurrencyName(currency) {
    const currencyNames = {
        'try': 'Türk Lirası',
        'usd': 'Amerikan Doları',
        'eur': 'Euro',
        'gbp': 'İngiliz Sterlini',
        'jpy': 'Japon Yeni',
        'aed': 'Birleşik Arap Emirlikleri Dirhemi',
        'chf': 'İsviçre Frangı',
        'cad': 'Kanada Doları',
        'aud': 'Avustralya Doları',
        'nzd': 'Yeni Zelanda Doları',
        'sgd': 'Singapur Doları',
        'btc': 'Bitcoin',
        'eth': 'Ethereum',
        'bnb': 'Binance Coin',
        'xrp': 'Ripple',
    };
    
    return currencyNames[currency] || currency.toUpperCase() + ' Para Birimi';
}

// Son güncelleme zamanını göster
function updateLastUpdateTime(date) {
    const dateElement = document.getElementById('lastUpdate');
    if (dateElement) {
        const updateDate = new Date(date);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        dateElement.textContent = `Son Güncelleme: ${updateDate.toLocaleDateString('tr-TR', options)}`;
    }
}

// Para birimi çevirme işlemi
function convertCurrency() {
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (fromCurrency === toCurrency) {
        document.getElementById('result').innerHTML = `${amount.toFixed(2)} ${fromCurrency.toUpperCase()}`;
        return;
    }

    let result;
    if (fromCurrency === 'try') {
        result = amount * rates[toCurrency];
    } else if (toCurrency === 'try') {
        result = amount / rates[fromCurrency];
    } else {
        result = (amount / rates[fromCurrency]) * rates[toCurrency];
    }

    document.getElementById('result').innerHTML = `${amount.toFixed(2)} ${fromCurrency.toUpperCase()} = ${result.toFixed(2)} ${toCurrency.toUpperCase()}`;
}

// Popüler kurlar tablosunu güncelle
function updatePopularRatesTable() {
    const tableBody = document.getElementById('popularRatesTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    popularCurrencies.forEach(currency => {
        const rate = rates[currency];
        const currencyName = formatCurrencyName(currency);
        
        // Rastgele değişim yüzdesi (gerçek API'de bu veri olacak)
        const change = (Math.random() * 2 - 1).toFixed(2);
        const changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${currency.toUpperCase()}</strong>
                <br>
                <small class="text-muted">${currencyName}</small>
            </td>
            <td>${rate.toFixed(4)}</td>
            <td>${(rate * 1.001).toFixed(4)}</td>
            <td class="${changeClass}">
                <i class="bi bi-arrow-${change > 0 ? 'up' : 'down'}"></i>
                ${Math.abs(change)}%
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Döviz çevirici fonksiyonları
async function loadCurrencyOptions() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
        const data = await response.json();
        
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        
        // Para birimlerini alfabetik sıraya göre sırala
        const currencies = Object.keys(data.rates).sort();
        
        // Select elementlerini temizle
        fromCurrency.innerHTML = '';
        toCurrency.innerHTML = '';
        
        // Para birimlerini ekle
        currencies.forEach(currency => {
            const option1 = document.createElement('option');
            const option2 = document.createElement('option');
            
            option1.value = currency;
            option1.textContent = currency;
            
            option2.value = currency;
            option2.textContent = currency;
            
            fromCurrency.appendChild(option1);
            toCurrency.appendChild(option2);
        });
        
        // Varsayılan değerleri ayarla
        fromCurrency.value = 'TRY';
        toCurrency.value = 'USD';
        
        // Son güncelleme zamanını göster
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            const date = new Date(data.date);
            lastUpdate.textContent = `Son Güncelleme: ${date.toLocaleString('tr-TR')}`;
        }
        
    } catch (error) {
        console.error('Para birimleri yüklenirken hata oluştu:', error);
    }
}

async function convertCurrency() {
    const amount = document.getElementById('amount').value;
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    if (!amount || amount <= 0) {
        alert('Lütfen geçerli bir miktar giriniz.');
        return;
    }
    
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await response.json();
        
        const rate = data.rates[toCurrency];
        const result = (amount * rate).toFixed(2);
        
        const resultElement = document.getElementById('result');
        if (resultElement) {
            resultElement.innerHTML = `
                <div class="alert alert-success">
                    ${amount} ${fromCurrency} = <strong>${result} ${toCurrency}</strong>
                </div>
            `;
        }
    } catch (error) {
        console.error('Döviz çevirme işlemi sırasında hata oluştu:', error);
        alert('Döviz çevirme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
    }
}

// Kripto para çevirici fonksiyonları
async function loadCryptoOptions() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
        const data = await response.json();
        
        const fromCrypto = document.getElementById('fromCrypto');
        const toCurrency = document.getElementById('toCurrency');
        
        if (fromCrypto) {
            // Kripto para listesini temizle
            fromCrypto.innerHTML = '';
            
            // En popüler kripto paraları ekle
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
            
            // Varsayılan değeri ayarla
            fromCrypto.value = 'bitcoin';
        }
        
        if (toCurrency) {
            // Para birimi listesini temizle
            toCurrency.innerHTML = '';
            
            // Para birimlerini ekle
            const currencies = ['TRY', 'USD', 'EUR', 'GBP', 'JPY'];
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.toLowerCase();
                option.textContent = currency;
                toCurrency.appendChild(option);
            });
            
            // Varsayılan değeri ayarla
            toCurrency.value = 'try';
        }
        
    } catch (error) {
        console.error('Kripto para listesi yüklenirken hata oluştu:', error);
    }
}

async function convertCrypto() {
    const amount = document.getElementById('amount').value;
    const fromCrypto = document.getElementById('fromCrypto').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    if (!amount || amount <= 0) {
        alert('Lütfen geçerli bir miktar giriniz.');
        return;
    }
    
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromCrypto}&vs_currencies=${toCurrency}`);
        const data = await response.json();
        
        const rate = data[fromCrypto][toCurrency];
        const result = (amount * rate).toFixed(2);
        
        const resultElement = document.getElementById('result');
        if (resultElement) {
            resultElement.innerHTML = `
                <div class="alert alert-warning">
                    ${amount} ${fromCrypto.charAt(0).toUpperCase() + fromCrypto.slice(1)} = <strong>${result} ${toCurrency.toUpperCase()}</strong>
                </div>
            `;
        }
    } catch (error) {
        console.error('Kripto para çevirme işlemi sırasında hata oluştu:', error);
        alert('Kripto para çevirme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
    }
}

// Canlı döviz fonksiyonları
let rateChart = null;

async function loadLiveRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
        const data = await response.json();
        
        // Tabloyu temizle
        const table = document.getElementById('exchangeRatesTable');
        if (!table) return; // Tablo bulunamazsa fonksiyondan çık
        
        table.innerHTML = '';
        
        // Popüler para birimleri
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY', 'AED', 'RUB'];
        
        // Her para birimi için tablo satırı oluştur
        popularCurrencies.forEach(currency => {
            const rate = data.rates[currency];
            if (rate) {
                const row = document.createElement('tr');
                const change = ((Math.random() * 2) - 1).toFixed(2); // Örnek değişim yüzdesi
                const changeClass = parseFloat(change) >= 0 ? 'text-success' : 'text-danger';
                const changeIcon = parseFloat(change) >= 0 ? '↑' : '↓';
                
                // Para birimi adını belirle
                const currencyNames = {
                    'USD': 'Amerikan Doları',
                    'EUR': 'Euro',
                    'GBP': 'İngiliz Sterlini',
                    'JPY': 'Japon Yeni',
                    'CHF': 'İsviçre Frangı',
                    'AUD': 'Avustralya Doları',
                    'CAD': 'Kanada Doları',
                    'CNY': 'Çin Yuanı',
                    'AED': 'BAE Dirhemi',
                    'RUB': 'Rus Rublesi'
                };

                // Ülke kodunu belirle
                const countryCode = {
                    'USD': 'us',
                    'EUR': 'eu',
                    'GBP': 'gb',
                    'JPY': 'jp',
                    'CHF': 'ch',
                    'AUD': 'au',
                    'CAD': 'ca',
                    'CNY': 'cn',
                    'AED': 'ae',
                    'RUB': 'ru'
                };
                
                row.innerHTML = `
                    <td>
                        <img src="https://flagcdn.com/24x18/${countryCode[currency]}.png"
                             width="24"
                             height="18"
                             class="me-2"
                             alt="${currency}">
                        <strong>${currency}</strong>
                        <br>
                        <small class="text-muted">${currencyNames[currency]}</small>
                    </td>
                    <td>
                        <strong>${(1/rate).toFixed(4)}</strong>
                        <small class="text-muted">₺</small>
                    </td>
                    <td class="${changeClass}">
                        ${changeIcon} ${Math.abs(change)}%
                    </td>
                    <td>
                        <small>${new Date().toLocaleTimeString('tr-TR')}</small>
                    </td>
                `;
                
                table.appendChild(row);
            }
        });
        
        // Son güncelleme zamanını güncelle
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Son Güncelleme: ${new Date().toLocaleString('tr-TR')}`;
        }
        
    } catch (error) {
        console.error('Döviz kurları yüklenirken hata:', error);
    }
}

async function updateChart() {
    const currency = document.getElementById('chartCurrency').value;
    const period = document.getElementById('chartPeriod').value;
    
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/timeseries?base=TRY&symbols=${currency}`);
        const data = await response.json();
        
        const dates = Object.keys(data.rates).slice(-period);
        const rates = dates.map(date => data.rates[date][currency]);
        
        if (rateChart) {
            rateChart.destroy();
        }
        
        const ctx = document.getElementById('rateChart').getContext('2d');
        rateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => new Date(date).toLocaleDateString('tr-TR')),
                datasets: [{
                    label: `${currency}/TRY`,
                    data: rates,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${currency}/TRY Döviz Kuru Grafiği`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Grafik güncellenirken hata oluştu:', error);
    }
}

// Kripto piyasa fonksiyonları
async function loadCryptoMarket() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=try&order=market_cap_desc&per_page=100&sparkline=false');
        const data = await response.json();
        
        const cryptoTable = document.getElementById('cryptoTable');
        
        if (cryptoTable) {
            // Tabloyu temizle
            cryptoTable.innerHTML = '';
            
            // Kripto paraları ekle
            data.forEach((crypto, index) => {
                const row = document.createElement('tr');
                const priceChangeClass = crypto.price_change_percentage_24h >= 0 ? 'text-success' : 'text-danger';
                const priceChangeIcon = crypto.price_change_percentage_24h >= 0 ? '↑' : '↓';
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>
                        <img src="${crypto.image}" alt="${crypto.name}" width="24" height="24" class="me-2">
                        ${crypto.name}
                    </td>
                    <td>${crypto.current_price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="${priceChangeClass}">
                        ${priceChangeIcon} ${Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                    </td>
                    <td>${crypto.total_volume.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                    <td>${crypto.market_cap.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                `;
                cryptoTable.appendChild(row);
            });
        }
        
        // Son güncelleme zamanını göster
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Son Güncelleme: ${new Date().toLocaleString('tr-TR')}`;
        }
        
    } catch (error) {
        console.error('Kripto piyasa verileri yüklenirken hata oluştu:', error);
    }
}

// Değişim yüzdesini hesapla (örnek değer)
function calculateChange(currency, currentRate) {
    // Gerçek değişim hesaplaması için önceki değerleri saklamak gerekir
    // Şimdilik rastgele bir değer döndürüyoruz
    return (Math.random() * 2 - 1); // -1 ile 1 arasında rastgele bir değer
}

// Tema değiştirme fonksiyonu
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return; // Tema butonu bulunamazsa fonksiyondan çık
    
    const icon = themeToggle.querySelector('i');
    
    // Kayıtlı temayı kontrol et
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Tema değiştirme butonu tıklama olayı
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

// Tema ikonunu güncelle
function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (!icon) return; // İkon bulunamazsa fonksiyondan çık
    
    if (theme === 'dark') {
        icon.classList.remove('bi-moon-stars');
        icon.classList.add('bi-sun');
    } else {
        icon.classList.remove('bi-sun');
        icon.classList.add('bi-moon-stars');
    }
}

// Popüler kurları yükle
async function loadPopularRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
        const data = await response.json();
        
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF'];
        const popularRatesTable = document.getElementById('popularRatesTable');
        
        if (popularRatesTable) {
            let html = '';
            popularCurrencies.forEach(currency => {
                const rate = 1 / data.rates[currency]; // TRY cinsinden kur hesaplama
                const change = ((Math.random() * 2) - 1).toFixed(2); // Örnek değişim yüzdesi
                const changeClass = parseFloat(change) >= 0 ? 'text-success' : 'text-danger';
                const changeIcon = parseFloat(change) >= 0 ? '↑' : '↓';
                
                html += `
                    <tr>
                        <td>
                            <img src="https://flagcdn.com/24x18/${currency.toLowerCase() === 'usd' ? 'us' : 
                                                         currency.toLowerCase() === 'eur' ? 'eu' : 
                                                         currency.toLowerCase() === 'gbp' ? 'gb' : 
                                                         currency.toLowerCase() === 'jpy' ? 'jp' : 'ch'}.png"
                                 width="24"
                                 height="18"
                                 class="me-2"
                                 alt="${currency}">
                            <strong>${currency}</strong>
                        </td>
                        <td>${rate.toFixed(4)} ₺</td>
                        <td class="${changeClass}">
                            ${changeIcon} ${Math.abs(change)}%
                        </td>
                    </tr>
                `;
            });
            popularRatesTable.innerHTML = html;
            
            // Son güncelleme zamanını güncelle
            const lastUpdate = document.getElementById('lastUpdate');
            if (lastUpdate) {
                lastUpdate.textContent = `Son Güncelleme: ${new Date().toLocaleTimeString('tr-TR')}`;
            }
        }
    } catch (error) {
        console.error('Popüler kurlar yüklenirken hata:', error);
    }
}

// Kripto para verilerini çek
async function fetchCryptoRates() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,ripple,cardano,solana,polkadot,dogecoin,avalanche-2,polygon&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        
        const popularCryptoTable = document.getElementById('popularCryptoTable');
        if (popularCryptoTable) {
            popularCryptoTable.innerHTML = '';
            
            Object.entries(data).forEach(([crypto, info]) => {
                const row = document.createElement('tr');
                const change = info.usd_24h_change;
                const changeClass = change >= 0 ? 'text-success' : 'text-danger';
                
                row.innerHTML = `
                    <td>
                        <strong>${formatCryptoName(crypto)}</strong>
                        <br>
                        <small class="text-muted">${crypto.toUpperCase()}</small>
                    </td>
                    <td>$${info.usd.toLocaleString()}</td>
                    <td class="${changeClass}">
                        ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                    </td>
                `;
                popularCryptoTable.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Kripto para verileri yüklenirken hata:', error);
    }
}

// Kripto para adını formatla
function formatCryptoName(crypto) {
    const cryptoNames = {
        'bitcoin': 'Bitcoin',
        'ethereum': 'Ethereum',
        'binancecoin': 'Binance Coin',
        'ripple': 'Ripple',
        'cardano': 'Cardano',
        'solana': 'Solana',
        'polkadot': 'Polkadot',
        'dogecoin': 'Dogecoin',
        'avalanche-2': 'Avalanche',
        'polygon': 'Polygon'
    };
    return cryptoNames[crypto] || crypto.charAt(0).toUpperCase() + crypto.slice(1);
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // Döviz kurlarını yükle
    fetchRates();
    
    // Her 1 dakikada bir kurları güncelle
    setInterval(fetchRates, 60000);

    // Canlı döviz sayfasındaki kurları yükle
    loadLiveRates();
    setInterval(loadLiveRates, 300000); // Her 5 dakikada bir güncelle

    // Para birimi seçeneklerini yükle
    loadCurrencyOptions();

    // Kripto çevirici sayfasındaysa
    if (document.getElementById('fromCrypto')) {
        loadCryptoOptions();
    }
    
    // Kripto piyasa sayfasındaysa
    if (document.getElementById('cryptoTable')) {
        loadCryptoMarket();
        // Her 1 dakikada bir güncelle
        setInterval(loadCryptoMarket, 60 * 1000);
    }

    // Popüler kurları yükle ve her 1 dakikada bir güncelle
    loadPopularRates();
    setInterval(loadPopularRates, 60000);

    // Kripto para verilerini çek
    fetchCryptoRates();
    // Her 5 dakikada bir güncelle
    setInterval(fetchCryptoRates, 300000);
});

// Input değişikliklerinde otomatik çeviri
document.getElementById('amount').addEventListener('input', convertCurrency);
document.getElementById('fromCurrency').addEventListener('change', convertCurrency);
document.getElementById('toCurrency').addEventListener('change', convertCurrency); 