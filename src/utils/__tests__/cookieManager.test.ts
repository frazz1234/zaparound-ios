import { getCookie, setCookie, deleteCookie } from '../cookieManager';

describe('cookieManager', () => {
  beforeEach(() => {
    // reset cookies
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  it('sets, gets and deletes a cookie (all cookies now allowed)', () => {
    setCookie('theme', 'dark');
    expect(getCookie('theme')).toBe('dark');
    deleteCookie('theme');
    expect(getCookie('theme')).toBeNull();
  });

  it('allows all cookies regardless of type (consent is automatic)', () => {
    setCookie('plausible_session', '1');
    expect(getCookie('plausible_session')).toBe('1');
    
    setCookie('marketing_cookie', '1');
    expect(getCookie('marketing_cookie')).toBe('1');
    
    setCookie('functional_cookie', '1');
    expect(getCookie('functional_cookie')).toBe('1');
  });

  it('allows GA cookies (consent is automatic)', () => {
    setCookie('_ga_ABC', '1');
    expect(getCookie('_ga_ABC')).toBe('1');
  });
});


