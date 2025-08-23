import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { Currency } from '../subtrip-types';

export const formatDateWithCapitalMonth = (date: Date) => {
  const formatted = format(date, "dd MMM yyyy", { locale: fr });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const findCurrencyByValue = (currencies: Currency[], value: string): Currency | undefined => {
  return currencies.find(c => c.value === value);
};

export const getCurrencySymbol = (currencies: Currency[], currencyCode: string): string => {
  const currency = findCurrencyByValue(currencies, currencyCode);
  return currency?.symbol || '$';
};

// Maps country codes to currencies (simplified version)
export const countryCurrencyMap: { [key: string]: { code: string, symbol: string } } = {
  'US': { code: 'USD', symbol: '$' },
  'GB': { code: 'GBP', symbol: '£' },
  'EU': { code: 'EUR', symbol: '€' },
  'CA': { code: 'CAD', symbol: '$' },
  'AU': { code: 'AUD', symbol: '$' },
  'JP': { code: 'JPY', symbol: '¥' },
  'CN': { code: 'CNY', symbol: '¥' },
  'CH': { code: 'CHF', symbol: '$' },
  'IN': { code: 'INR', symbol: '₹' },
  'BR': { code: 'BRL', symbol: '$' },
};

export const getCountryCurrency = (countryCode: string | undefined): { code: string, symbol: string } => {
  if (!countryCode || !countryCurrencyMap[countryCode]) {
    return { code: 'USD', symbol: '$' };
  }
  return countryCurrencyMap[countryCode];
};

export const getAnimationText = (zapAnimationType: 'ZAPTRIP' | 'ZAPOUT' | 'ZAPROAD') => {
  switch (zapAnimationType) {
    case 'ZAPTRIP':
      return {
        prefix: "Let's go for a",
        main: "ZAPTRIP"
      };
    case 'ZAPOUT':
      return {
        prefix: "Let's go for a",
        main: "ZAPOUT"
      };
    case 'ZAPROAD':
      return {
        prefix: "Let's go for a",
        main: "ZAPROAD"
      };
  }
};

export const fetchLocationImage = async (locationName: string) => {
  try {
    // First get location details from OpenAI to generate a good description
    const response = await fetch('/api/location-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location: locationName }),
    });
    
    const locationDetails = await response.json();

    // Then fetch a relevant image from Unsplash
    const imageResponse = await fetch('/api/unsplash-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: locationName }),
    });
    
    const imageData = await imageResponse.json();
    return { locationDetails, imageUrl: imageData.url };
  } catch (error) {
    console.error('Error fetching location data:', error);
    return null;
  }
};

export const getCurrentLocation = async (): Promise<{ name: string; coordinates: [number, number] } | null> => {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=place`
            );
            const data = await response.json();
            if (data.features && data.features[0]) {
              const locationName = data.features[0].place_name;
              resolve({
                name: locationName,
                coordinates: [position.coords.latitude, position.coords.longitude]
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation is not supported"));
    }
  });
}; 