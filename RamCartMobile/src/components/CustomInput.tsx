import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../utils/constants';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  isPassword = false,
  iconName,
  style,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={COLORS.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
