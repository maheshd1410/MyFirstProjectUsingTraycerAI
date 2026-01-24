import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '../../state/auth.context';
import { TextInput } from '../../components/input/TextInput';
import { Button } from '../../components/button/Button';
import { Header } from '../../components/header/Header';
import { useAppTheme } from '../../theme';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { state, updateUser } = useAuthContext();
  const user = state.user;

  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      updateUser({ name: name.trim() });
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Edit Profile" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError('');
            }}
            placeholder="Enter your full name"
            editable={!isSaving}
          />
          {nameError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {nameError}
            </Text>
          ) : null}

          <View style={styles.disabledSection}>
            <Text style={[styles.disabledLabel, { color: theme.colors.onSurfaceVariant }]}>
              Email
            </Text>
            <View
              style={[
                styles.disabledInput,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Text style={[styles.disabledText, { color: theme.colors.onSurfaceVariant }]}>
                {user?.email}
              </Text>
            </View>
            <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
              Email cannot be changed
            </Text>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <Button
            label={isSaving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={isSaving || !name.trim()}
            variant="filled"
            fullWidth
          />

          <Button
            label="Cancel"
            onPress={handleCancel}
            disabled={isSaving}
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  formSection: {
    marginBottom: 24,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  disabledSection: {
    marginTop: 16,
  },
  disabledLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  disabledInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  disabledText: {
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonSection: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
