import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export interface SlideInProps {
  children: React.ReactNode;
  direction?: SlideDirection;
  duration?: number;
  delay?: number;
  distance?: number;
  style?: any;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  duration = 250,
  delay = 0,
  distance = 50,
  style,
}) => {
  const translateX = useSharedValue(
    direction === 'left' ? -distance : direction === 'right' ? distance : 0
  );
  const translateY = useSharedValue(
    direction === 'up' ? distance : direction === 'down' ? -distance : 0
  );
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      translateX.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, translateX, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
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
    console.warn('SlideIn animation failed, rendering without animation:', error);
    return <View style={style}>{children}</View>;
  }
};
