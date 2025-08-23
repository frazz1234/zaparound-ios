import { getCookie, setCookie, deleteCookie } from '../cookieManager';

const setConsent = (consent: any) => {
  document.documentElement.setAttribute('data-cookie-consent', JSON.stringify(consent));
};

describe('cookieManager', () => {
  beforeEach(() => {
    // reset cookies
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    setConsent({ necessary: true, functional: true, analytics: true, marketing: true, hasInteracted: true });
  });

  it('sets, gets and deletes a cookie respecting defaults', () => {
    setCookie('theme', 'dark');
    expect(getCookie('theme')).toBe('dark');
    deleteCookie('theme');
    expect(getCookie('theme')).toBeNull();
  });

  it('blocks analytics cookie when consent is off (non-GA)', () => {
    setConsent({ necessary: true, functional: true, analytics: false, marketing: true, hasInteracted: true });
    setCookie('plausible_session', '1');
    expect(getCookie('plausible_session')).toBeNull();
  });

  it('allows GA cookies regardless of analytics consent', () => {
    setConsent({ necessary: true, functional: true, analytics: false, marketing: false, hasInteracted: true });
    setCookie('_ga_ABC', '1');
    expect(getCookie('_ga_ABC')).toBe('1');
  });
});


