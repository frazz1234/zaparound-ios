# Security Headers Configuration for Production

This document provides the necessary HTTP security headers that should be configured at the web server level (Apache, Nginx, Cloudflare, etc.) for optimal security and SEO.

## Required HTTP Security Headers

### 1. X-Frame-Options
```
X-Frame-Options: DENY
```
**Purpose**: Prevents the site from being embedded in iframes, protecting against clickjacking attacks.

### 2. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
**Purpose**: Prevents browsers from MIME-sniffing a response away from the declared content-type.

### 3. X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
**Purpose**: Enables XSS filtering in browsers that support it.

### 4. Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
**Purpose**: Controls how much referrer information is included with requests.

### 5. Permissions-Policy
```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```
**Purpose**: Controls which browser features can be used.

### 6. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
**Purpose**: Forces HTTPS connections and prevents protocol downgrade attacks.

### 7. Content-Security-Policy (Enhanced)
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://www.googletagmanager.com 
    https://www.google-analytics.com 
    https://js.hcaptcha.com 
    https://hcaptcha.com
    https://api.mapbox.com
    https://events.mapbox.com
    https://*.emrldtp.com
    https://emrldtp.com
    https://www.google.com
    https://www.gstatic.com
    https://va.vercel-scripts.com; 
  style-src 'self' 'unsafe-inline' 
    https://fonts.googleapis.com 
    https://api.mapbox.com; 
  font-src 'self' 
    https://fonts.gstatic.com; 
  img-src 'self' data: blob: https:; 
  connect-src 'self' https: wss: 
    https://ynvnzmkpifwteyuxondc.supabase.co
    https://api.mapbox.com
    https://events.mapbox.com
    https://open.er-api.com
    https://www.google.com
    https://www.gstatic.com
    https://*.emrldtp.com
    https://emrldtp.com
    https://va.vercel-scripts.com; 
  frame-src 'self' 
    https://hcaptcha.com 
    https://*.hcaptcha.com
    https://www.google.com; 
  worker-src 'self' blob:;
  object-src 'none'; 
  base-uri 'self'; 
  form-action 'self';
```

## Implementation Examples

### Nginx Configuration
```nginx
server {
    # ... other configuration

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # CSP Header (single line)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.hcaptcha.com https://hcaptcha.com https://api.mapbox.com https://events.mapbox.com https://*.emrldtp.com https://emrldtp.com https://www.google.com https://www.gstatic.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss: https://ynvnzmkpifwteyuxondc.supabase.co https://api.mapbox.com https://events.mapbox.com https://open.er-api.com https://www.google.com https://www.gstatic.com https://*.emrldtp.com https://emrldtp.com https://va.vercel-scripts.com; frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://www.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';" always;

    # ... rest of configuration
}
```

### Apache Configuration (.htaccess)
```apache
# Security Headers
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

# Content Security Policy
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.hcaptcha.com https://hcaptcha.com https://api.mapbox.com https://events.mapbox.com https://*.emrldtp.com https://emrldtp.com https://www.google.com https://www.gstatic.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss: https://ynvnzmkpifwteyuxondc.supabase.co https://api.mapbox.com https://events.mapbox.com https://open.er-api.com https://www.google.com https://www.gstatic.com https://*.emrldtp.com https://emrldtp.com https://va.vercel-scripts.com; frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://www.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';"
```

### Cloudflare Configuration
If using Cloudflare, these headers can be set in the dashboard under:
**Security** > **Page Rules** or **Transform Rules** > **HTTP Response Header Modification**

### Vercel Configuration (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.hcaptcha.com https://hcaptcha.com https://api.mapbox.com https://events.mapbox.com https://*.emrldtp.com https://emrldtp.com https://www.google.com https://www.gstatic.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss: https://ynvnzmkpifwteyuxondc.supabase.co https://api.mapbox.com https://events.mapbox.com https://open.er-api.com https://www.google.com https://www.gstatic.com https://*.emrldtp.com https://emrldtp.com https://va.vercel-scripts.com; frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://www.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';"
        }
      ]
    }
  ]
}
```

## SEO Benefits of Security Headers

1. **Trust Signals**: Search engines favor secure websites
2. **User Safety**: Protects users from attacks, improving user experience
3. **HTTPS Ranking Factor**: HSTS ensures HTTPS usage
4. **Site Integrity**: Prevents malicious content injection
5. **Performance**: CSP can improve loading performance

## Testing Security Headers

Use these tools to verify your security headers are properly configured:

1. **Security Headers**: https://securityheaders.com/
2. **Mozilla Observatory**: https://observatory.mozilla.org/
3. **CSP Evaluator**: https://csp-evaluator.withgoogle.com/

## Important Notes

- **Never set security headers via meta tags** - they must be HTTP headers
- Test thoroughly after implementing CSP to ensure all functionality works
- Adjust CSP based on your specific third-party integrations
- Consider using CSP in report-only mode first for testing
- Update headers when adding new third-party services

## Current Status

✅ **Development**: Security headers are configured in Vite dev server
⚠️ **Production**: Requires web server configuration (see examples above)

The meta tag approach has been removed from the SEO component to prevent console errors. All security headers must be configured at the HTTP server level for production deployment.
