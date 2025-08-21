# Browser Service Integration

This document describes the integration of `@capacitor/browser` in the ZapArounds project, which provides in-app browser functionality for both native mobile apps and web environments.

## Overview

The browser service allows you to open external URLs in an in-app browser on mobile devices, providing a seamless user experience while maintaining the app context. On web environments, it falls back to opening links in new tabs.

## Features

- **Native Mobile Support**: Uses `@capacitor/browser` for iOS/Android
- **Web Fallback**: Automatically falls back to `window.open` for web browsers
- **Customizable UI**: Configurable colors and presentation styles
- **Error Handling**: Comprehensive error handling with fallbacks
- **Event Listening**: Browser event subscription capabilities

## Installation

The plugin has been installed and configured:

```bash
npm install @capacitor/browser
npx cap sync
```

## Usage

### Basic Usage with Hook

```tsx
import { useBrowser } from '@/hooks/useBrowser';

function MyComponent() {
  const { openBrowser, openExternal, closeBrowser } = useBrowser();

  const handleOpenLink = async () => {
    try {
      await openBrowser({
        url: 'https://example.com',
        presentationStyle: 'fullscreen',
        toolbarColor: '#1d1d1e',
        navigationBarColor: '#1d1d1e',
        navigationBarDividerColor: '#62626a',
      });
    } catch (error) {
      console.error('Failed to open browser:', error);
    }
  };

  return (
    <button onClick={handleOpenLink}>
      Open Link
    </button>
  );
}
```

### Using the Service Directly

```tsx
import { browserService } from '@/services/browserService';

// Open in in-app browser
await browserService.openBrowser({
  url: 'https://example.com',
  presentationStyle: 'fullscreen',
});

// Open in external browser
await browserService.openExternal('https://example.com');

// Close current browser
await browserService.closeBrowser();
```

### Pre-built Components

#### ExternalLink Component

```tsx
import { ExternalLink } from '@/components/ui/external-link';

<ExternalLink 
  href="https://example.com"
  variant="outline"
  size="sm"
>
  Visit Website
</ExternalLink>
```

#### ExternalTextLink Component

```tsx
import { ExternalTextLink } from '@/components/ui/external-link';

<ExternalTextLink href="https://example.com">
  Learn More
</ExternalTextLink>
```

## Configuration Options

### BrowserOptions Interface

```typescript
interface BrowserOptions {
  url: string;                                    // Required: URL to open
  presentationStyle?: 'fullscreen' | 'popover';   // Presentation mode
  toolbarColor?: string;                          // Toolbar color (hex)
  navigationBarColor?: string;                    // Navigation bar color (hex)
  navigationBarDividerColor?: string;             // Divider color (hex)
}
```

### Presentation Styles

- **fullscreen**: Opens browser in fullscreen mode (default)
- **popover**: Opens browser in a popover (iOS only)

### Color Customization

Colors can be customized using hex values. Default colors use your brand palette:

- **Toolbar**: `#1d1d1e` (Accent 1)
- **Navigation Bar**: `#1d1d1e` (Accent 1)  
- **Divider**: `#62626a` (Accent 2)

## Browser Events

The service automatically handles browser events:

```tsx
const { addListener } = useBrowser();

useEffect(() => {
  const listener = addListener('browserFinished', () => {
    console.log('Browser closed');
  });

  return () => listener.remove();
}, []);
```

Available events:
- `browserFinished`: Browser was closed
- `browserPageLoaded`: New page loaded in browser

## Error Handling

The service includes comprehensive error handling:

```tsx
const { openBrowser, error, clearError } = useBrowser();

const handleOpen = async () => {
  const result = await openBrowser({ url: 'https://example.com' });
  
  if (result.type === 'error') {
    console.error('Browser error:', result.error);
    // Handle error appropriately
  }
};
```

## Testing

A test page is available at `/en/browser-test` (or your language prefix) to test all browser functionality:

- URL input and configuration
- Custom color picker
- Different presentation styles
- Pre-configured examples
- Environment detection

## Migration from window.open

To migrate existing `window.open` calls:

### Before
```tsx
<button onClick={() => window.open('https://example.com', '_blank')}>
  Open Link
</button>
```

### After
```tsx
import { ExternalLink } from '@/components/ui/external-link';

<ExternalLink href="https://example.com">
  Open Link
</ExternalLink>
```

Or with custom handling:

```tsx
import { useBrowser } from '@/hooks/useBrowser';

function MyComponent() {
  const { openBrowser } = useBrowser();
  
  const handleClick = async () => {
    try {
      await openBrowser({
        url: 'https://example.com',
        presentationStyle: 'fullscreen',
      });
    } catch (error) {
      // Fallback to window.open
      window.open('https://example.com', '_blank');
    }
  };

  return <button onClick={handleClick}>Open Link</button>;
}
```

## Best Practices

1. **Always use the service**: Instead of `window.open`, use the browser service for consistent behavior
2. **Handle errors gracefully**: Implement fallbacks for web environments
3. **Use appropriate presentation styles**: Use `fullscreen` for content, `popover` for quick actions
4. **Customize colors**: Use your brand colors for a consistent look
5. **Test on both platforms**: Ensure functionality works on both mobile and web

## Troubleshooting

### Common Issues

1. **Plugin not working on iOS**: Ensure `npx cap sync` was run after installation
2. **Colors not applying**: Color customization only works on iOS
3. **Browser not opening**: Check if running in Capacitor environment
4. **Web fallback issues**: Verify `window.open` is available

### Debug Mode

Enable debug logging by checking the console for browser service messages.

## Platform Support

- **iOS**: Full support with SFSafariViewController
- **Android**: Full support with CustomTabs
- **Web**: Fallback to `window.open`

## Dependencies

- `@capacitor/browser`: Core browser functionality
- `@capacitor/core`: Capacitor core functionality
- React hooks for easy integration
- TypeScript interfaces for type safety
