# Animation Components

This directory contains reusable animation components built with `react-native-reanimated` for smooth 60fps animations.

## Components

### FadeIn

Fades in content from opacity 0 to 1.

**Usage:**
```typescript
import { FadeIn } from '../animations';

<FadeIn duration={250} delay={100}>
  <Text>This text will fade in</Text>
</FadeIn>
```

**Props:**
- `duration` (optional): Animation duration in ms (default: 250)
- `delay` (optional): Delay before animation starts in ms (default: 0)
- `style` (optional): Additional styles to apply

### SlideIn

Slides in content from a specified direction with fade effect.

**Usage:**
```typescript
import { SlideIn } from '../animations';

<SlideIn direction="up" distance={50} duration={250}>
  <View>This will slide up and fade in</View>
</SlideIn>
```

**Props:**
- `direction` (optional): 'up' | 'down' | 'left' | 'right' (default: 'up')
- `duration` (optional): Animation duration in ms (default: 250)
- `delay` (optional): Delay before animation starts in ms (default: 0)
- `distance` (optional): Distance to slide in px (default: 50)
- `style` (optional): Additional styles to apply

### ListItemAnimation

Combines FadeIn and SlideIn with staggered delay based on index for list items.

**Usage:**
```typescript
import { ListItemAnimation } from '../animations';

<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <ListItemAnimation index={index}>
      <ProductCard product={item} />
    </ListItemAnimation>
  )}
/>
```

**Props:**
- `index` (required): Item index for calculating stagger delay
- `style` (optional): Additional styles to apply

## Performance Considerations

- All animations are capped at 300ms to maintain responsiveness
- Animations run on the UI thread using Reanimated for 60fps performance
- Graceful fallback: If animation fails, content renders without animation
- Staggered animations use index * 50ms with max 300ms cap

## Combining Animations

You can nest animations for complex effects:

```typescript
<FadeIn duration={300}>
  <SlideIn direction="left" duration={300}>
    <Text>Fades in while sliding from left</Text>
  </SlideIn>
</FadeIn>
```

## When to Use vs Not Use

**Use animations for:**
- Screen transitions
- List item appearance
- Modal/dialog entry
- Success states
- Attention-grabbing elements

**Avoid animations for:**
- Critical actions (immediate feedback needed)
- Frequently updating content (performance impact)
- Large lists (only use ListItemAnimation with windowing)
- Accessibility mode (respect reduced motion preferences)

## Accessibility

All animations automatically respect the device's "Reduce Motion" accessibility setting (future enhancement).
