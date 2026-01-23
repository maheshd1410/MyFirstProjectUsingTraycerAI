import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme';

export const ProfileScreen: React.FC = () => {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.text, fontSize: theme.typography.fontSizes.xl },
          ]}
        >
          Profile
        </Text>
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.textLight,
              fontSize: theme.typography.fontSizes.base,
            },
          ]}
        >
          Profile features are paused for Phase 3. This placeholder keeps navigation intact while business logic remains disabled.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
