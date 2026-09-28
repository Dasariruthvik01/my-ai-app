import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../theme/tokens';

interface GlassPanelProps {
  title: string;
  body: string;
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ title, body, children }) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={Platform.OS === 'web' ? 20 : 50} style={StyleSheet.absoluteFill} tint="dark" />
      <LinearGradient
        colors={[tokens.colors.glassStart, tokens.colors.glassEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '78%', // ≈ 78% of card width
    borderRadius: 50, // ≈ 50 radius
    overflow: 'hidden',
    alignSelf: 'center',
    // web specific backdrop filter is handled by expo-blur, but we can add a fallback if needed.
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
    } as any),
  },
  content: {
    padding: 24, // ≈ 24 px padding
    alignItems: 'center',
  },
  title: {
    fontFamily: tokens.fonts.heading,
    color: tokens.colors.textPrimary,
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase', // Forced caps per prompt
  },
  body: {
    fontFamily: tokens.fonts.body,
    color: tokens.colors.textPrimary,
    fontSize: 14,
    lineHeight: 19.6, // ~1.4 line-height
    textAlign: 'center',
    marginBottom: 20,
    // max 3 lines at reference width handled mostly by layout, but can restrict if needed.
    // The prompt says "max 3 lines at reference width", so it's a visual guideline, not strictly numberOfLines={3} 
    // since text scaling should allow more lines to avoid clipping.
  },
});
