# Accessibility Guide

This document outlines the accessibility features and best practices for the Ladoo E-commerce mobile app.

## Overview

The app follows WCAG 2.1 Level AA guidelines and platform-specific accessibility standards (iOS VoiceOver, Android TalkBack).

## Key Accessibility Features

### 1. Screen Reader Support

All interactive elements have descriptive labels and hints:

- **Buttons**: Include action description and state (loading, disabled)
- **Form Inputs**: Include label, required status, and validation errors
- **Product Cards**: Include name, price, rating, and stock status
- **Cart Items**: Include product name, quantity, and subtotal

### 2. Touch Target Sizing

All interactive elements meet minimum touch target requirements:

- Minimum size: **44x44 points**
- Applied using `ensureTouchTarget()` utility
- Ensures comfortable interaction for all users

### 3. Text Scaling

The app supports Dynamic Type (iOS) and Font Scaling (Android):

- Text scales up to 200% without layout breaking
- Use relative font sizes
- Test with maximum text size settings

### 4. Color Contrast

All text meets WCAG AA contrast ratios:

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 against background

## Testing with Screen Readers

### iOS VoiceOver

1. Enable: Settings → Accessibility → VoiceOver
2. Navigate: Swipe right/left
3. Activate: Double tap
4. Test checklist:
   - All buttons announce their purpose
   - Form fields announce label and state
   - Errors are announced immediately
   - Focus order is logical

### Android TalkBack

1. Enable: Settings → Accessibility → TalkBack
2. Navigate: Swipe right/left
3. Activate: Double tap
4. Test checklist:
   - All interactive elements are focusable
   - Content descriptions are meaningful
   - Live regions announce updates
   - Navigation is logical

## Accessibility Checklist for New Components

When creating or updating components:

- [ ] All interactive elements have `accessibilityLabel`
- [ ] Buttons have `accessibilityRole="button"`
- [ ] Links have `accessibilityRole="link"`
- [ ] Form inputs have `accessibilityLabel` with validation state
- [ ] Touch targets are minimum 44x44
- [ ] Focus order is logical
- [ ] Error messages are announced to screen readers
- [ ] Loading states are announced
- [ ] Dynamic content updates use `accessibilityLiveRegion`
- [ ] Images have meaningful descriptions or are marked decorative
- [ ] Modals trap focus and announce title

## Utility Functions

### ensureTouchTarget(size?)

Ensures minimum touch target size:

```typescript
import { ensureTouchTarget } from '../utils/accessibility';

<Pressable style={[styles.button, ensureTouchTarget(44)]}>
  <Text>Button</Text>
</Pressable>
```

### getButtonAccessibilityLabel(label, state?)

Generates accessible button labels:

```typescript
import { getButtonAccessibilityLabel } from '../utils/accessibility';

<Button
  accessibilityLabel={getButtonAccessibilityLabel('Add to Cart', loading ? 'loading' : undefined)}
/>
```

### getInputAccessibilityLabel(label, required?, error?)

Generates accessible input labels:

```typescript
import { getInputAccessibilityLabel } from '../utils/accessibility';

<TextInput
  accessibilityLabel={getInputAccessibilityLabel('Email', true, emailError)}
/>
```

### formatPriceForScreenReader(price)

Formats prices for screen readers:

```typescript
import { formatPriceForScreenReader } from '../utils/accessibility';

<Text accessibilityLabel={formatPriceForScreenReader(299.99)}>
  ₹299.99
</Text>
```

## Common Accessibility Patterns

### Form Validation

```typescript
<TextInput
  label="Email"
  accessibilityLabel={getInputAccessibilityLabel('Email', true, errors.email)}
  accessibilityHint="Enter your email address"
  error={errors.email}
/>
{errors.email && (
  <Text
    accessibilityLiveRegion="polite"
    accessibilityLabel={`Error: ${errors.email}`}
  >
    {errors.email}
  </Text>
)}
```

### Product Card

```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel={formatProductForScreenReader(product)}
  accessibilityHint={getAccessibilityHint('view product details')}
  style={ensureTouchTarget(44)}
>
  <ProductCard product={product} />
</Pressable>
```

### Cart Item

```typescript
<View accessibilityLabel={formatCartItemForScreenReader(item)}>
  <Text>{item.productName}</Text>
  <Text>Qty: {item.quantity}</Text>
  <Text>₹{item.price}</Text>
</View>
```

### Loading States

```typescript
<Button
  accessibilityLabel={getButtonAccessibilityLabel('Submit', loading ? 'loading' : undefined)}
  accessibilityHint={getAccessibilityHint('submit form')}
  disabled={loading}
>
  {loading ? 'Loading...' : 'Submit'}
</Button>
```

### Live Regions (Dynamic Updates)

```typescript
<Text
  accessibilityLiveRegion="polite"
  accessibilityLabel={`Total: ${formatPriceForScreenReader(total)}`}
>
  Total: ₹{total.toFixed(2)}
</Text>
```

## Platform-Specific Considerations

### iOS

- Use `accessibilityLabel` for custom descriptions
- Use `accessibilityHint` for action descriptions
- Use `accessibilityTraits` for element types
- Support Dynamic Type

### Android

- Use `accessibleLabel` for content descriptions
- Use `accessibilityRole` for element semantics
- Use `importantForAccessibility` for focus control
- Support font scaling

## Testing Tools

- **iOS**: Accessibility Inspector in Xcode
- **Android**: Accessibility Scanner app
- **Manual**: Test with actual screen readers
- **Automated**: @testing-library/react-native with accessibility queries

## Resources

- [Apple Accessibility Guidelines](https://developer.apple.com/accessibility/)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
