
const fromCurrencySelect = document.getElementById("fromCurrency");
const toCurrencySelect = document.getElementById("toCurrency");
const currencyForm = document.getElementById("currencyForm");
const resultDiv = document.getElementById("result");
const ratesDiv = document.getElementById("rates");

let liveRates = null;
let fluctuations = null;
let darkMode = true;

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    document.querySelector('.converter').classList.toggle('light-mode');
    document.querySelector('input').classList.toggle('light-mode');
    document.querySelector('select').classList.toggle('light-mode');
    document.querySelector('button').classList.toggle('light-mode');
    document.getElementById('switchButton').classList.toggle('light-mode');
    document.getElementById('toggleTheme').classList.toggle('light-mode');

    darkMode = !darkMode;
}

var myHeaders = new Headers();
myHeaders.append("apikey", "u9Q3gYxUSll0QGbtTM1LOlCj7LXdpilJ");

var requestOptions = {
    method: 'GET',
    redirect: 'follow',
    headers: myHeaders
};

document.getElementById('toggleTheme').addEventListener('click', toggleTheme);

function fetchLiveRates() {

    return fetch("https://api.apilayer.com/currency_data/live?source=USD&currencies=EUR%2CBRL%2CGBP%2CJPY", requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                liveRates = data.quotes;
            } else {
                console.error('Erro ao buscar cotações ao vivo:', data.error);
            }
        })
        .catch(error => console.error('Erro ao buscar cotações ao vivo:', error));
}



function fetchCurrencyChange() {
    const currentDate = new Date();
    const previousDate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));

    const formatDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    return fetch(`https://api.apilayer.com/currency_data/change?start_date=${formatDate(previousDate)}&end_date=${formatDate(currentDate)}&currencies=EUR,BRL,GBP,JPY&source=USD`, requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fluctuations = data.quotes;
            } else {
                console.error('Erro ao buscar variações:', data.error);
            }
        })
        .catch(error => console.error('Erro ao buscar variações:', error));
}


function updateRatesDisplay() {
    if (liveRates && fluctuations) {
        ratesDiv.classList.remove('animated');
        ratesDiv.innerHTML = '';

        const currencies = ['USDEUR', 'USDBRL', 'USDGBP', 'USDJPY'];
        currencies.forEach(currency => {
            const changePct = fluctuations[currency].change_pct.toFixed(2);
            const rate = liveRates[currency].toFixed(2);
            const changeClass = changePct >= 0 ? 'positive' : 'negative';
            const sign = changePct >= 0 ? '+' : '';

            ratesDiv.innerHTML += `
                <div class="rate-line">
                    <span class="fi fi-${currency.substring(3, 5).toLowerCase()}"></span>
                    <span class="change-pct ${changeClass}">${sign}${changePct}%</span>
                    <span>$${rate}</span>
                </div>
                <div class="separator"></div>
            `;
        });
        ratesDiv.classList.add('animated');
    }
}




function populateSelects(symbols) {
    for (let code in symbols) {
        let option = document.createElement("option");
        option.text = code + " - " + symbols[code];
        option.value = code;

        fromCurrencySelect.appendChild(option.cloneNode(true));
        toCurrencySelect.appendChild(option.cloneNode(true));
    }
}

document.getElementById('switchButton').addEventListener('click', function () {
    const fromCurrencyValue = fromCurrencySelect.value;
    const toCurrencyValue = toCurrencySelect.value;

    fromCurrencySelect.value = toCurrencyValue;
    toCurrencySelect.value = fromCurrencyValue;
});


function savePreferredCurrencies() {
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    localStorage.setItem("preferredFromCurrency", fromCurrency);
    localStorage.setItem("preferredToCurrency", toCurrency);
}


function loadPreferredCurrencies() {
    const preferredFromCurrency = localStorage.getItem("preferredFromCurrency");
    const preferredToCurrency = localStorage.getItem("preferredToCurrency");

    if (preferredFromCurrency && preferredToCurrency) {
        fromCurrencySelect.value = preferredFromCurrency;
        toCurrencySelect.value = preferredToCurrency;
    }
}


currencyForm.addEventListener("submit", function(event) {
    convertCurrency(event);
    savePreferredCurrencies();
});


document.addEventListener('DOMContentLoaded', function() {
    Promise.all([fetchLiveRates(), fetchCurrencyChange()]).then(() => {
        updateRatesDisplay();
    });
    var amountInput = document.getElementById('amount');
    var largeBox = amountInput.closest('.large-select-box');

   
    amountInput.addEventListener('focus', function() {
        largeBox.classList.add('large-box-focus');
    });

   
    amountInput.addEventListener('blur', function() {
        largeBox.classList.remove('large-box-focus');
    });
    loadPreferredCurrencies();
});

function convertCurrency(event) {
    event.preventDefault();

    let fromCurrency = fromCurrencySelect.value;
    let toCurrency = toCurrencySelect.value;
    let amount = document.getElementById("amount").value;

    let currentDate = new Date();
    let formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

    var myHeaders = new Headers();
    myHeaders.append("apikey", "u9Q3gYxUSll0QGbtTM1LOlCj7LXdpilJ");

    var requestOptions = {
        method: 'GET',
        redirect: 'follow',
        headers: myHeaders
    };

    fetch(`https://api.apilayer.com/fixer/convert?to=${toCurrency}&from=${fromCurrency}&amount=${amount}&date=${formattedDate}`, requestOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const conversionResult = data.result;

                return fetch(`https://api.apilayer.com/fixer/fluctuation?start_date=${formattedDate}&end_date=${formattedDate}&base=${fromCurrency}&symbols=${toCurrency}`, requestOptions)
                    .then(response => response.json())
                    .then(fluctuationData => {
                        if (fluctuationData.success) {
                            document.getElementById("convertedAmount").textContent = `$ ${conversionResult.toFixed(2)}`;
                        } else {
                            resultDiv.innerHTML = fluctuationData.error && fluctuationData.error.info ? `Error: ${fluctuationData.error.info}` : "Erro ao obter a flutuação. Tente novamente.";
                        }
                    })
            } else {
                resultDiv.innerHTML = data.error && data.error.info ? `Error: ${data.error.info}` : "Erro ao converter. Tente novamente.";
            }
        })
        .catch(error => {
            console.log('error', error);
            resultDiv.innerHTML = "Erro ao obter os dados. Tente novamente.";
        });
}



currencyForm.addEventListener("submit", convertCurrency);


populateSelects({
    "AED": "UAE Dirham",
    "AFN": "Afghani",
    "ALL": "Lek",
    "AMD": "Dram",
    "ANG": "Neth. Antillean Guilder",
    "AOA": "Kwanza",
    "ARS": "Arg. Peso",
    "AUD": "Aussie Dollar",
    "AWG": "Aruban Florin",
    "AZN": "Azeri Manat",
    "BAM": "Bosnia-H. Mark",
    "BBD": "Bajan Dollar",
    "BDT": "Taka",
    "BGN": "Bulg. Lev",
    "BHD": "Bahr. Dinar",
    "BIF": "Burundi Franc",
    "BMD": "Bermud. Dollar",
    "BND": "Brunei Dollar",
    "BOB": "Boliviano",
    "BRL": "Brazil Real",
    "BSD": "Baham. Dollar",
    "BTC": "Bitcoin",
    "BTN": "Ngultrum",
    "BWP": "Pula",
    "BYN": "Belarus Ruble",
    "BYR": "Belarus Ruble (old)",
    "BZD": "Belize Dollar",
    "CAD": "Can. Dollar",
    "CDF": "Congo Franc",
    "CHF": "Swiss Franc",
    "CLF": "Chilean UF",
    "CLP": "Chile Peso",
    "CNY": "Yuan",
    "COP": "Colomb. Peso",
    "CRC": "Colón",
    "CUC": "Cuban Convert. Peso",
    "CUP": "Cuban Peso",
    "CVE": "Cabo Verde Escudo",
    "CZK": "Czech Koruna",
    "DJF": "Djibouti Franc",
    "DKK": "Danish Krone",
    "DOP": "Dom. Peso",
    "DZD": "Alger. Dinar",
    "EGP": "Egypt Pound",
    "ERN": "Nakfa",
    "ETB": "Birr",
    "EUR": "Euro",
    "FJD": "Fiji Dollar",
    "FKP": "Falkland Pound",
    "GBP": "Pound Sterling",
    "GEL": "Georg. Lari",
    "GGP": "Guernsey Pound",
    "GHS": "Ghana Cedi",
    "GIP": "Gib. Pound",
    "GMD": "Dalasi",
    "GNF": "Guinea Franc",
    "GTQ": "Quetzal",
    "GYD": "Guyana Dollar",
    "HKD": "HK Dollar",
    "HNL": "Lempira",
    "HRK": "Kuna",
    "HTG": "Gourde",
    "HUF": "Forint",
    "IDR": "Rupiah",
    "ILS": "New Sheqel",
    "IMP": "Manx pound",
    "INR": "Rupee",
    "IQD": "Iraqi Dinar",
    "IRR": "Rial",
    "ISK": "Iceland Krona",
    "JEP": "Jersey Pound",
    "JMD": "Jam. Dollar",
    "JOD": "Jordan Dinar",
    "JPY": "Yen",
    "KES": "K. Shilling",
    "KGS": "Som",
    "KHR": "Riel",
    "KMF": "Comoros Franc",
    "KPW": "North Korea Won",
    "KRW": "South Korea Won",
    "KWD": "Kuwait Dinar",
    "KYD": "Cayman Dollar",
    "KZT": "Tenge",
    "LAK": "Kip",
    "LBP": "Leb. Pound",
    "LKR": "Lanka Rupee",
    "LRD": "Liberia Dollar",
    "LSL": "Loti",
    "LTL": "Litas",
    "LVL": "Lats",
    "LYD": "Libya Dinar",
    "MAD": "Morocco Dirham",
    "MDL": "Moldova Leu",
    "MGA": "Ariary",
    "MKD": "Denar",
    "MMK": "Kyat",
    "MNT": "Tugrik",
    "MOP": "Pataca",
    "MRO": "Ouguiya",
    "MUR": "Maurit. Rupee",
    "MVR": "Rufiyaa",
    "MWK": "Malawi Kwacha",
    "MXN": "Mex. Peso",
    "MYR": "Ringgit",
    "MZN": "Metical",
    "NAD": "Namib. Dollar",
    "NGN": "Naira",
    "NIO": "Córdoba",
    "NOK": "Norw. Krone",
    "NPR": "Nepal Rupee",
    "NZD": "NZ Dollar",
    "OMR": "Omani Rial",
    "PAB": "Balboa",
    "PEN": "Sol",
    "PGK": "Kina",
    "PHP": "Phil. Peso",
    "PKR": "Pak. Rupee",
    "PLN": "Zloty",
    "PYG": "Guaraní",
    "QAR": "Qatari Rial",
    "RON": "Roman. Leu",
    "RSD": "Serbian Dinar",
    "RUB": "Rublo",
    "RWF": "Rwand. Franc",
    "SAR": "Saudi Riyal",
    "SBD": "Solomon Dollar",
    "SCR": "Sey. Rupee",
    "SDG": "Sudan Pound",
    "SEK": "Swed. Krona",
    "SGD": "Sing. Dollar",
    "SHP": "St Helena Pound",
    "SLL": "Leone",
    "SOS": "Somali Shilling",
    "SRD": "Suriname Dollar",
    "SSP": "S. Sudan Pound",
    "STD": "Dobra",
    "SVC": "El Salv. Colón",
    "SYP": "Syria Pound",
    "SZL": "Lilangeni",
    "THB": "Baht",
    "TJS": "Somoni",
    "TMT": "Turkm. Manat",
    "TND": "Tun. Dinar",
    "TOP": "Paʻanga",
    "TRY": "Turkish Lira",
    "TTD": "Trin. & Tob. Dollar",
    "TWD": "Taiwan Dollar",
    "TZS": "Tanz. Shilling",
    "UAH": "Hryvnia",
    "UGX": "Uganda Shilling",
    "USD": "US Dollar",
    "UYU": "Uru. Peso",
    "UZS": "Uzbek Som",
    "VEF": "Bolívar",
    "VND": "Dong",
    "VUV": "Vatu",
    "WST": "Tala",
    "XAF": "CFA Franc BEAC",
    "XCD": "E. Caribbean Dollar",
    "XOF": "CFA Franc BCEAO",
    "XPF": "CFP Franc",
    "YER": "Yemeni Rial",
    "ZAR": "S. Afr. Rand",
    "ZMW": "Zambian Kwacha",
    "ZWL": "Zim. Dollar",
});


fetchLiveRates();