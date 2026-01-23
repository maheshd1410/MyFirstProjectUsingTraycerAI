import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';

interface HeaderProps {
  title: string;
  leftAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({ title, leftAction, rightAction }) => {
  const theme = useAppTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          backgroundColor: theme.colors.primary,
        }}
      >
        {/* Left Action */}
        <View style={{ width: 40 }}>
          {leftAction && (
            <Pressable
              onPress={leftAction.onPress}
              style={({ pressed }) => ({
                opacity: pressed ? theme.opacity.pressed : 1,
                padding: theme.spacing.sm,
              })}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              {leftAction.icon}
            </Pressable>
          )}
        </View>

        {/* Title */}
        <Text
          style={[
            theme.typography.titleLarge,
            {
              color: theme.colors.onPrimary,
              flex: 1,
              textAlign: 'center',
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Right Action */}
        <View style={{ width: 40 }}>
          {rightAction && (
            <Pressable
              onPress={rightAction.onPress}
              style={({ pressed }) => ({
                opacity: pressed ? theme.opacity.pressed : 1,
                padding: theme.spacing.sm,
              })}
              accessible
              accessibilityRole="button"
            >
              {rightAction.icon}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
