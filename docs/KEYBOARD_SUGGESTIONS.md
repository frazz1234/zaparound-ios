# ZapAround Keyboard Suggestions

This document explains how to use the native keyboard suggestions feature in ZapAround iOS app, which provides a better user experience for authentication forms.

## Overview

The keyboard suggestions feature integrates with iOS native keyboard functionality to:
- Provide intelligent autocomplete for email and password fields
- Suggest ZapAround domain-specific credentials
- Enable smooth keyboard navigation between form fields
- Optimize keyboard behavior for mobile devices

## Features

### 1. Native Keyboard Integration
- Uses Capacitor's Keyboard API for native iOS keyboard behavior
- Automatically configures keyboard resize and scroll behavior
- Disables accessory bar for cleaner authentication UI

### 2. Smart Autocomplete
- **Email fields**: Suggest previously used email addresses and ZapAround domain emails
- **Password fields**: Suggest saved passwords for zaparound.com
- **Name fields**: Proper capitalization and autocorrect settings
- **Location fields**: Optimized for location input

### 3. Enhanced Form Navigation
- Tab/Enter key navigation between fields
- Automatic focus management
- Smooth keyboard transitions

## Implementation

### Components

#### ZapAroundInput
A specialized input component that automatically includes proper attributes:

```tsx
import { ZapAroundInput } from "@/components/ui/zaparound-input";

<ZapAroundInput
  zaparoundType="email"
  autoFocusNext={true}
  placeholder="Enter your email"
  // ... other props
/>
```

#### Available Types
- `email`: For email addresses with ZapAround domain suggestions
- `password`: For password fields with secure input
- `name`: For first/last names with proper capitalization
- `location`: For location inputs
- `generic`: For other input types

### Hooks

#### useKeyboardSuggestions
Basic keyboard management hook:

```tsx
import { useKeyboardSuggestions } from '@/hooks/useKeyboardSuggestions';

const { hideKeyboard, showKeyboard } = useKeyboardSuggestions({
  enableAccessoryBar: false,
  onKeyboardShow: (height) => console.log('Keyboard shown:', height),
  onKeyboardHide: () => console.log('Keyboard hidden')
});
```

#### useZapAroundKeyboardSuggestions
Advanced hook with ZapAround-specific features:

```tsx
import { useZapAroundKeyboardSuggestions } from '@/hooks/useZapAroundKeyboardSuggestions';

const { 
  setupFormField, 
  focusNextField, 
  formRef 
} = useZapAroundKeyboardSuggestions({
  enableDomainSuggestions: true
});
```

## Configuration

### Capacitor Config
The keyboard plugin is configured in `capacitor.config.ts`:

```typescript
plugins: {
  Keyboard: {
    resize: 'body',
    style: 'DEFAULT',
    resizeOnFullScreen: true
  }
}
```

### Settings
- **resize**: Set to 'body' for optimal form handling
- **style**: Uses device default appearance
- **resizeOnFullScreen**: Enables keyboard resize in fullscreen mode

## Usage Examples

### Login Form
```tsx
<ZapAroundInput
  zaparoundType="email"
  autoFocusNext={true}
  placeholder="Email address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Signup Form
```tsx
<ZapAroundInput
  zaparoundType="password"
  autoFocusNext={true}
  placeholder="Create password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
```

### Name Fields
```tsx
<ZapAroundInput
  zaparoundType="name"
  autoFocusNext={true}
  placeholder="First name"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
/>
```

## Benefits

1. **Better UX**: Native iOS keyboard behavior feels natural
2. **Faster Input**: Smart suggestions reduce typing
3. **Domain Awareness**: ZapAround-specific credential suggestions
4. **Accessibility**: Proper autocomplete attributes for screen readers
5. **Mobile Optimized**: Keyboard behavior optimized for mobile devices

## Browser Compatibility

- **iOS**: Full native keyboard integration
- **Android**: Basic keyboard functionality
- **Web**: Standard HTML5 autocomplete behavior

## Troubleshooting

### Common Issues

1. **Keyboard not showing suggestions**
   - Ensure `zaparoundType` is set correctly
   - Check that `autoFocusNext` is enabled for navigation
   - Verify Capacitor Keyboard plugin is installed

2. **Form navigation not working**
   - Ensure `autoFocusNext={true}` is set on inputs
   - Check that form fields are properly ordered
   - Verify keyboard event listeners are active

3. **Autocomplete not working**
   - Check browser/device autocomplete settings
   - Ensure proper `name` attributes are set
   - Verify `autocomplete` attributes are correct

### Debug Mode
Enable console logging to debug keyboard behavior:

```tsx
useKeyboardSuggestions({
  onKeyboardShow: (height) => console.log('Keyboard shown:', height),
  onKeyboardHide: () => console.log('Keyboard hidden')
});
```

## Best Practices

1. **Always use ZapAroundInput** for authentication forms
2. **Set appropriate zaparoundType** for each field
3. **Enable autoFocusNext** for better navigation
4. **Test on real devices** for best results
5. **Handle keyboard events** gracefully in your components

## Future Enhancements

- Biometric authentication integration
- Advanced password strength indicators
- Multi-language keyboard support
- Custom keyboard themes
- Enhanced accessibility features
