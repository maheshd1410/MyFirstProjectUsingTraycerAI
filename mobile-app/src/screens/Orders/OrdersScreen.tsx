import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Card } from '../../components';
import { useAppTheme } from '../../theme';

export const OrdersScreen: React.FC = () => {
  const theme = useAppTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['bottom']}
    >
      <Header title="Orders" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.md,
        }}
      >
        <Card
          elevation={2}
          padding="lg"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
          }}
        >
          <Text
            style={[
              theme.typography.headlineMedium,
              { color: theme.colors.onSurface, marginBottom: theme.spacing.md },
            ]}
          >
            Orders Screen
          </Text>
          <Text
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.onSurfaceVariant, textAlign: 'center' },
            ]}
          >
            Your order history will appear here
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};
