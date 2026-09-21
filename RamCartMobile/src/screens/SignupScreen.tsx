import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthNavigationProp } from '../navigation/types';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { promptGoogleAuth } from '../services/googleAuth';
import { COLORS, SPACING } from '../utils/constants';

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  const { signup, loginWithGoogle } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!username.trim()) {
      newErrors.username = 'Full Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    setApiError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signup(username, email, password);
      if (!result.success) {
        setApiError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setApiError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setApiError(null);
    setGoogleLoading(true);

    try {
      const googleResult = await promptGoogleAuth();
      if (googleResult.success && googleResult.user) {
        const syncResult = await loginWithGoogle(
          googleResult.user.email,
          googleResult.user.name,
          googleResult.user.id
        );

        if (!syncResult.success) {
          setApiError(syncResult.error || 'Failed to sync Google account with backend.');
        }
      } else if (googleResult.error && !googleResult.error.includes('canceled')) {
        setApiError(googleResult.error);
      }
    } catch (err: any) {
      setApiError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Create Account 🚀</Text>
          <Text style={styles.subText}>Join RamCart to discover exclusive deals</Text>
        </View>

        {apiError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{apiError}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <CustomInput
            label="Full Name"
            placeholder="e.g. John Doe"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (apiError) setApiError(null);
            }}
            iconName="person-outline"
            error={errors.username}
          />

          <CustomInput
            label="Email Address"
            placeholder="e.g. john@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (apiError) setApiError(null);
            }}
            keyboardType="email-address"
            iconName="mail-outline"
            error={errors.email}
          />

          <CustomInput
            label="Password"
            placeholder="enter your password (min 6 chars)"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (apiError) setApiError(null);
            }}
            isPassword
            iconName="lock-closed-outline"
            error={errors.password}
          />

          <CustomInput
            label="Confirm Password"
            placeholder="confirm your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (apiError) setApiError(null);
            }}
            isPassword
            iconName="lock-closed-outline"
            error={errors.confirmPassword}
          />

          <CustomButton
            title={loading ? 'Creating Account...' : 'Create Account'}
            onPress={handleSignup}
            loading={loading}
            style={styles.submitButton}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.disabledGoogleButton]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#db4437" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Connecting Google...' : 'Sign Up with Google'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: SPACING.lg,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  disabledGoogleButton: {
    opacity: 0.6,
  },
  googleIcon: {
    marginRight: SPACING.sm,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
