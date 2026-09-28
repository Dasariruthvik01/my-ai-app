import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  AccessibilityInfo
} from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens } from '../../theme/tokens';
import { roleApi } from '../../services/roleApi';

interface CodeModalProps {
  visible: boolean;
  role: 'owner' | 'trainer' | 'client';
  onClose: () => void;
  onSuccess: () => void;
}

const CODE_LENGTH = 6;

export const CodeModal: React.FC<CodeModalProps> = ({ visible, role, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const title = role === 'trainer' ? 'ENTER TRAINER CODE' : 'ENTER GYM CODE';
  const helper = role === 'trainer' 
    ? 'Your gym owner issues trainer invite codes.' 
    : 'Your trainer or gym owner has your invite code.';

  const handleSubmit = async () => {
    if (code.length !== CODE_LENGTH) {
      setError('Please enter a 6-digit code.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await roleApi.claimRole({ role, code });
      setIsSubmitting(false);
      onSuccess();
    } catch (err: any) {
      setIsSubmitting(false);
      let errorMessage = 'An unexpected error occurred.';
      if (err.status === 404 || err.status === 401) {
        errorMessage = "That code isn't valid.";
      } else if (err.status === 410) {
        errorMessage = 'This code has expired. Ask for a new one.';
      } else if (err.status === 429) {
        errorMessage = 'Too many attempts. Try again later.';
      } else if (err.status === 500) {
        errorMessage = "Couldn't reach the server. Try again.";
      }
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setCode('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={handleClose}
      accessibilityViewIsModal
      hardwareAccelerated
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={handleClose} 
          accessible={false} 
        />
        
        <View style={styles.modalContent} accessibilityRole="dialog" aria-modal>
          {/* Using fallback solid color since BlurView with transparent background can be tricky inside Modals without a backdrop, but the prompt says dark glass surface */}
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.inner}>
            <View style={styles.iconCircle} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.helper}>{helper}</Text>
            
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError(null);
              }}
              maxLength={CODE_LENGTH}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              autoCorrect={false}
              editable={!isSubmitting}
              accessibilityLabel="6 digit invite code"
              textAlign="center"
            />
            
            {error && (
              <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                {error}
              </Text>
            )}
            
            <View style={styles.actions}>
              <Pressable
                style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Verify and Continue"
              >
                {isSubmitting ? (
                  <ActivityIndicator color={tokens.colors.pillText} />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                )}
              </Pressable>
              
              <Pressable
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderColor: 'rgba(138, 78, 44, 0.3)', // Burnt orange border at low alpha
    borderWidth: 1,
  },
  inner: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.amber,
    marginBottom: 16,
  },
  title: {
    fontFamily: tokens.fonts.heading,
    color: tokens.colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  helper: {
    fontFamily: tokens.fonts.body,
    color: tokens.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fonts.heading, // monospaced/pixel
    fontSize: 24,
    letterSpacing: 8,
    marginBottom: 16,
  },
  inputError: {
    borderColor: tokens.colors.error,
  },
  errorText: {
    color: tokens.colors.error,
    fontFamily: tokens.fonts.body,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: tokens.colors.pillBg,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: tokens.colors.pillText,
    fontFamily: tokens.fonts.body,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.fonts.body,
    fontSize: 16,
  },
});
