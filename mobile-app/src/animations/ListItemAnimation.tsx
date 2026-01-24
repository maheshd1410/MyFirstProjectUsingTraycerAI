import React from 'react';
import { View } from 'react-native';
import { FadeIn } from './FadeIn';
import { SlideIn } from './SlideIn';

export interface ListItemAnimationProps {
  children: React.ReactNode;
  index: number;
  style?: any;
}

export const ListItemAnimation: React.FC<ListItemAnimationProps> = ({
  children,
  index,
  style,
}) => {
  // Calculate delay with max cap at 300ms
  const delay = Math.min(index * 50, 300);

  try {
    return (
      <FadeIn duration={250} delay={delay} style={style}>
        <SlideIn direction="up" distance={20} duration={250} delay={delay}>
          {children}
        </SlideIn>
      </FadeIn>
    );
  } catch (error) {
    console.warn('ListItemAnimation failed, rendering without animation:', error);
    return <View style={style}>{children}</View>;
  }
};
