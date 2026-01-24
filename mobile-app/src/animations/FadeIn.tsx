import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: any;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = 250,
  delay = 0,
  style,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Graceful fallback if animation fails
  try {
    return (
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    );
  } catch (error) {
    console.warn('FadeIn animation failed, rendering without animation:', error);
    return <View style={style}>{children}</View>;
  }
};
