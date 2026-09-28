import React from 'react';
import { Pressable, Text, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import { tokens } from '../../theme/tokens';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const PillButton: React.FC<PillButtonProps> = ({ label, onPress, disabled }) => {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered, focused }) => [
        styles.button,
        pressed && styles.buttonPressed,
        pressed && reduceMotion && { transform: [] }, // disable scale
        hovered && styles.buttonHovered,
        focused && styles.buttonFocused,
        disabled && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: tokens.colors.pillBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24, // High radius for pill shape
    minWidth: 48,
    minHeight: 48, // 48x48 min touch target
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonHovered: Platform.select({
    web: {
      // Basic hover effect for web without layout shift
      backgroundColor: '#f0f0f0',
    } as any,
    default: {},
  }),
  buttonFocused: Platform.select({
    web: {
      outlineStyle: 'solid',
      outlineWidth: 2,
      outlineColor: tokens.colors.burntOrange,
      outlineOffset: 2,
    } as any,
    default: {},
  }),
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    color: tokens.colors.pillText,
    fontFamily: tokens.fonts.body,
    fontSize: 14,
    fontWeight: '600',
  },
});
