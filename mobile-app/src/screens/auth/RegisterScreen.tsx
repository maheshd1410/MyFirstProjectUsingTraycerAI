import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../hooks';
import { Input, Button } from '../../components';
import { theme } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const validationSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phoneNumber: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, isLoading, error: authError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    'weak' | 'medium' | 'strong' | null
  >(null);

  const calculatePasswordStrength = (password: string) => {
    if (password.length < 8) return 'weak';
    if (password.length < 12 || !/[^a-zA-Z0-9]/.test(password)) return 'medium';
    return 'strong';
  };

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await register({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          password: values.password,
          role: 'CUSTOMER',
        }).unwrap();
      } catch (err) {
        // Error is handled by Redux
      }
    },
  });

  const handlePasswordChange = (text: string) => {
    formik.handleChange('password')(text);
    if (text) {
      setPasswordStrength(calculatePasswordStrength(text) as any);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'strong':
        return theme.colors.success;
      default:
        return theme.colors.border;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Ladoo Business today</Text>
      </View>

      <View style={styles.form}>
        {authError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}

        <Input
          label="First Name"
          placeholder="Enter your first name"
          autoCapitalize="words"
          value={formik.values.firstName}
          onChangeText={formik.handleChange('firstName')}
          onBlur={formik.handleBlur('firstName')}
          error={formik.touched.firstName ? formik.errors.firstName : undefined}
          editable={!isLoading}
        />

        <Input
          label="Last Name"
          placeholder="Enter your last name"
          autoCapitalize="words"
          value={formik.values.lastName}
          onChangeText={formik.handleChange('lastName')}
          onBlur={formik.handleBlur('lastName')}
          error={formik.touched.lastName ? formik.errors.lastName : undefined}
          editable={!isLoading}
        />

        <Input
          label="Email"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formik.values.email}
          onChangeText={formik.handleChange('email')}
          onBlur={formik.handleBlur('email')}
          error={formik.touched.email ? formik.errors.email : undefined}
          editable={!isLoading}
        />

        <Input
          label="Phone Number"
          placeholder="Enter 10-digit phone number"
          keyboardType="phone-pad"
          value={formik.values.phoneNumber}
          onChangeText={formik.handleChange('phoneNumber')}
          onBlur={formik.handleBlur('phoneNumber')}
          error={formik.touched.phoneNumber ? formik.errors.phoneNumber : undefined}
          editable={!isLoading}
        />

        <View>
          <Input
            label="Password"
            placeholder="Enter a strong password"
            secureTextEntry={!showPassword}
            value={formik.values.password}
            onChangeText={handlePasswordChange}
            onBlur={formik.handleBlur('password')}
            error={formik.touched.password ? formik.errors.password : undefined}
            onRightIconPress={() => setShowPassword(!showPassword)}
            editable={!isLoading}
          />
          {passwordStrength && (
            <View style={styles.strengthIndicator}>
              <View
                style={[
                  styles.strengthBar,
                  { backgroundColor: getStrengthColor() },
                ]}
              />
              <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                Password strength: {passwordStrength}
              </Text>
            </View>
          )}
        </View>

        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          secureTextEntry={!showConfirmPassword}
          value={formik.values.confirmPassword}
          onChangeText={formik.handleChange('confirmPassword')}
          onBlur={formik.handleBlur('confirmPassword')}
          error={
            formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined
          }
          onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          editable={!isLoading}
        />

        <Button
          title={isLoading ? 'Creating account...' : 'Sign Up'}
          onPress={() => formik.handleSubmit()}
          loading={isLoading}
          disabled={!formik.isValid || isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
          <Text style={styles.footerLink}>Login</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing['2xl'],
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
  strengthIndicator: {
    marginBottom: theme.spacing.md,
  },
  strengthBar: {
    height: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xs,
  },
  strengthText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
});
