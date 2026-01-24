import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../../state/auth.context';
import { useAppTheme } from '../../theme';
import { Header } from '../../components/header/Header';
import { Card } from '../../components/card/Card';
import { Button } from '../../components/button/Button';

export const ProfileScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { state, logout } = useAuthContext();
  const user = state.user;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as any }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Profile" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.onPrimary }]}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
            {user?.name}
          </Text>
        </View>

        {/* User Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
              Email
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
              {user?.email}
            </Text>
          </View>

          {user?.id && (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                User ID
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                {user.id}
              </Text>
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonsSection}>
          <Button
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile' as any)}
            variant="filled"
            fullWidth
          />

          <Button
            label="Logout"
            onPress={handleLogout}
            variant="outlined"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonsSection: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
