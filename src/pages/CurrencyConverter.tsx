import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { GB, US, EU, JP, AU, CA, CH, CN, IN, BR, RU, ZA } from 'country-flag-icons/react/3x2';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';

interface ExchangeRate {
  [key: string]: number;
}

interface CurrencyInfo {
  code: string;
  flag: React.ComponentType<{ className?: string }>;
  name: string;
  value: string;
  label: string;
  locale: string;
}

const CurrencyConverter = () => {
  const { t, i18n } = useTranslation('currency');
  const language = i18n.language;
  const locale = language === 'en' ? 'en_US' : language === 'fr' ? 'fr_FR' : 'es_ES';
  
  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate>({});
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  const currencies: CurrencyInfo[] = [
    { code: 'USD', flag: US, name: t('currencies.USD'), value: 'USD', label: `USD - ${t('currencies.USD')}`, locale: 'en-US' },
    { code: 'EUR', flag: EU, name: t('currencies.EUR'), value: 'EUR', label: `EUR - ${t('currencies.EUR')}`, locale: 'de-DE' },
    { code: 'GBP', flag: GB, name: t('currencies.GBP'), value: 'GBP', label: `GBP - ${t('currencies.GBP')}`, locale: 'en-GB' },
    { code: 'JPY', flag: JP, name: t('currencies.JPY'), value: 'JPY', label: `JPY - ${t('currencies.JPY')}`, locale: 'ja-JP' },
    { code: 'AUD', flag: AU, name: t('currencies.AUD'), value: 'AUD', label: `AUD - ${t('currencies.AUD')}`, locale: 'en-AU' },
    { code: 'CAD', flag: CA, name: t('currencies.CAD'), value: 'CAD', label: `CAD - ${t('currencies.CAD')}`, locale: 'en-CA' },
    { code: 'CHF', flag: CH, name: t('currencies.CHF'), value: 'CHF', label: `CHF - ${t('currencies.CHF')}`, locale: 'de-CH' },
    { code: 'CNY', flag: CN, name: t('currencies.CNY'), value: 'CNY', label: `CNY - ${t('currencies.CNY')}`, locale: 'zh-CN' },
    { code: 'INR', flag: IN, name: t('currencies.INR'), value: 'INR', label: `INR - ${t('currencies.INR')}`, locale: 'en-IN' },
    { code: 'BRL', flag: BR, name: t('currencies.BRL'), value: 'BRL', label: `BRL - ${t('currencies.BRL')}`, locale: 'pt-BR' },
    { code: 'RUB', flag: RU, name: t('currencies.RUB'), value: 'RUB', label: `RUB - ${t('currencies.RUB')}`, locale: 'ru-RU' },
    { code: 'ZAR', flag: ZA, name: t('currencies.ZAR'), value: 'ZAR', label: `ZAR - ${t('currencies.ZAR')}`, locale: 'en-ZA' },
  ];

  const quickAmounts = [1, 5, 10, 50, 100, 500, 1000, 5000];

  useEffect(() => {
    fetchExchangeRates();
    // Update rates every 5 minutes
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    setUpdateInterval(interval);

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  const fetchExchangeRates = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data = await response.json();
      if (data.result === 'success') {
        setExchangeRates(data.rates);
        setLastUpdated(new Date().toLocaleString());
      } else {
        throw new Error('Invalid response from exchange rate API');
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setError(t('error.fetchRates'));
    }
    setIsLoading(false);
  };

  const handleConvert = () => {
    if (!amount || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return;
    
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    const result = (parseFloat(amount) / fromRate) * toRate;
    setConvertedAmount(result);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Format currency amount with proper locale
  const formatAmount = (amount: number, currency: string) => {
    const currencyInfo = currencies.find(c => c.code === currency);
    const formatter = new Intl.NumberFormat(currencyInfo?.locale || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  const getCurrencyInfo = (code: string) => {
    return currencies.find(c => c.code === code) || currencies[0];
  };

  const customStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '48px',
      borderRadius: '0.5rem',
      borderColor: '#D1D5DB',
      '&:hover': {
        borderColor: '#2563EB'
      }
    }),
    option: (base: any, state: { isSelected: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected ? '#EFF6FF' : 'white',
      color: state.isSelected ? '#1E40AF' : '#374151',
      '&:hover': {
        backgroundColor: '#EFF6FF',
        color: '#1E40AF'
      },
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem'
    }),
    singleValue: (base: any) => ({
      ...base,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    })
  };

  const formatOptionLabel = ({ value, label, flag }: CurrencyInfo) => (
    <div className="flex items-center gap-2">
      <div className="w-6 h-4">
        {React.createElement(flag, {
          className: 'w-full h-full object-contain'
        })}
      </div>
      <span>{label}</span>
    </div>
  );

  const handleQuickAmount = (amount: number) => {
    setAmount(amount.toString());
    handleConvert();
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ZapAround Currency Converter",
    "description": t('subtitle'),
    "url": `https://zaparound.com/${language}/currency-converter`,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEO
        title={t('title')}
        description={t('subtitle')}
        keywords="currency converter, exchange rates, USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, BRL, RUB, ZAR, real-time exchange rates, travel currency, foreign exchange, forex, currency calculator, money converter, international travel, zaparound currency, travel planning currency"
        url={`/${language}/currency-converter`}
        locale={locale}
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('subtitle')}
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2" aria-live="polite">
                {t('lastUpdated')}: {lastUpdated}
              </p>
            )}
          </header>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" aria-hidden="true" />
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}

          <main className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleConvert(); }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="w-full sm:flex-1 space-y-4">
                  <label htmlFor="amount" className="block text-sm font-bold text-gray-700">
                    {t('amount')}
                  </label>
                  <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                    placeholder={t('amount')}
                    min="0"
                    step="0.01"
                    aria-label={t('amount')}
                  />
                </div>

                <div className="w-full sm:flex-1 space-y-4">
                  <label htmlFor="fromCurrency" className="block text-sm font-bold text-gray-700">
                    {t('from')}
                  </label>
                  <Select
                    inputId="fromCurrency"
                    value={currencies.find(c => c.code === fromCurrency)}
                    onChange={(option) => setFromCurrency(option?.code || 'USD')}
                    options={currencies}
                    formatOptionLabel={formatOptionLabel}
                    styles={{
                      ...customStyles,
                      singleValue: (base: any) => ({
                        ...base,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold'
                      })
                    }}
                    isSearchable
                    placeholder={t('from')}
                    aria-label={t('from')}
                  />
                </div>

                <button
                  type="button"
                  onClick={swapCurrencies}
                  className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors -mb-9 self-center"
                  title={t('swap')}
                  aria-label={t('swap')}
                >
                  <ArrowDownUp className="w-6 h-6 text-blue-600" aria-hidden="true" />
                </button>

                <div className="w-full sm:flex-1 space-y-4">
                  <label htmlFor="toCurrency" className="block text-sm font-bold text-gray-700">
                    {t('to')}
                  </label>
                  <Select
                    inputId="toCurrency"
                    value={currencies.find(c => c.code === toCurrency)}
                    onChange={(option) => setToCurrency(option?.code || 'EUR')}
                    options={currencies}
                    formatOptionLabel={formatOptionLabel}
                    styles={{
                      ...customStyles,
                      singleValue: (base: any) => ({
                        ...base,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold'
                      })
                    }}
                    isSearchable
                    placeholder={t('to')}
                    aria-label={t('to')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap font-bold"
                  aria-label={t('convert')}
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    t('convert')
                  )}
                </button>
              </div>
            </form>

            {convertedAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-4 sm:p-6 bg-blue-50 rounded-xl"
                role="region"
                aria-label="Conversion Result"
              >
                <div className="text-center space-y-2">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6" aria-hidden="true">
                        {React.createElement(getCurrencyInfo(fromCurrency).flag, {
                          className: 'w-full h-full object-contain'
                        })}
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {formatAmount(parseFloat(amount), fromCurrency)}
                      </p>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900" aria-hidden="true">=</span>
                    <div className="flex items-center gap-2">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {formatAmount(convertedAmount, toCurrency)}
                      </p>
                      <div className="w-8 h-6" aria-hidden="true">
                        {React.createElement(getCurrencyInfo(toCurrency).flag, {
                          className: 'w-full h-full object-contain'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-bold">1 {fromCurrency} = {(exchangeRates[toCurrency] / exchangeRates[fromCurrency]).toFixed(6)} {toCurrency}</p>
                    <p className="font-bold">1 {toCurrency} = {(exchangeRates[fromCurrency] / exchangeRates[toCurrency]).toFixed(5)} {fromCurrency}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2" aria-live="polite">
                    {t('lastUpdated')}: {lastUpdated}
                  </p>
                </div>
              </motion.div>
            )}

            <section aria-labelledby="quick-amounts-heading" className="mt-8">
              <h2 id="quick-amounts-heading" className="text-lg font-bold text-gray-900 mb-4">{t('quickAmounts')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {quickAmounts.map((amount) => {
                  const convertedValue = amount * (exchangeRates[toCurrency] / exchangeRates[fromCurrency]);
                  return (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
                      aria-label={`Convert ${formatAmount(amount, fromCurrency)} to ${formatAmount(convertedValue, toCurrency)}`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-5 h-4 sm:w-6 sm:h-4" aria-hidden="true">
                          {React.createElement(getCurrencyInfo(fromCurrency).flag, {
                            className: 'w-full h-full object-contain'
                          })}
                        </div>
                        <span className="font-bold text-sm sm:text-base">{formatAmount(amount, fromCurrency)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-4 sm:w-6 sm:h-4" aria-hidden="true">
                          {React.createElement(getCurrencyInfo(toCurrency).flag, {
                            className: 'w-full h-full object-contain'
                          })}
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-gray-600">
                          {formatAmount(convertedValue, toCurrency)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <footer className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                {t('disclaimer')}
              </p>
            </footer>
          </main>
        </motion.div>
      </div>
    </>
  );
};

export default CurrencyConverter; 