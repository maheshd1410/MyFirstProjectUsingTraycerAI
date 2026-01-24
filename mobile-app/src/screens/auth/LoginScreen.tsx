import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../components/input/TextInput';
import { Button } from '../../components/button/Button';
import { theme } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { FadeIn } from '../../animations/FadeIn';
import { 
  getInputAccessibilityLabel, 
  getAccessibilityHint,
  ensureTouchTarget 
} from '../../utils/accessibility';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const touchTargetStyle = ensureTouchTarget(44);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Mock successful login - in real app, call API and navigate based on response
        Alert.alert('Success', 'Login successful!');
        // Navigation handled by parent (App.tsx should switch to authenticated stack)
      } catch (error) {
        Alert.alert('Login Failed', 'An error occurred while logging in');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Login screen"
      accessibilityRole="none"
    >
      <View style={styles.header}>
        <Text 
          style={styles.title}
          accessibilityRole="header"
        >
          Welcome Back
        </Text>
        <Text style={styles.subtitle}>Login to your Ladoo Business account</Text>
      </View>

      <FadeIn duration={300}>
        <View style={styles.form}>
          <TextInput
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
            editable={!loading}
            required
            accessibilityHint={getAccessibilityHint('enter your email address')}
            accessibilityLabel={getInputAccessibilityLabel('Email', true)}
          />
          {formik.touched.email && formik.errors.email && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {formik.errors.email}
            </Text>
          )}

          <TextInput
            label="Password"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            editable={!loading}
            required
            accessibilityHint={getAccessibilityHint('enter your password')}
            accessibilityLabel={getInputAccessibilityLabel('Password', true)}
          />
          {formik.touched.password && formik.errors.password && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {formik.errors.password}
            </Text>
          )}

          <Button
            label={loading ? 'Logging in...' : 'Login'}
            onPress={() => formik.handleSubmit()}
            disabled={!formik.isValid || loading}
            fullWidth
            accessibilityLabel={loading ? 'Logging in, please wait' : 'Login button'}
            accessibilityHint={loading ? '' : getAccessibilityHint('login to your account')}
          />
        </View>
      </FadeIn>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Register')} 
          disabled={loading}
          style={touchTargetStyle}
          accessibilityRole="link"
          accessibilityLabel="Sign up for a new account"
          accessibilityHint={getAccessibilityHint('create a new account')}
        >
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        disabled={loading} 
        style={[styles.forgotPassword, touchTargetStyle]}
        onPress={() => navigation.navigate('ForgotPassword')}
        accessibilityRole="link"
        accessibilityLabel="Forgot password"
        accessibilityHint={getAccessibilityHint('reset your password')}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing['3xl'],
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  form: {
    marginBottom: theme.spacing['2xl'],
  },
  errorBanner: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textLight,
  },
  footerLink: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
  },
});
