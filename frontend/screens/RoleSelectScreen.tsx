import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { useFonts } from 'expo-font';
import { tokens } from '../theme/tokens';
import { headerCopy, cardCopy, COPY_VARIANT } from '../constants/roleSelectCopy';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { RoleCard } from '../components/role-select/RoleCard';
import { RoleCarousel } from '../components/role-select/RoleCarousel';
import { CodeModal } from '../components/role-select/CodeModal';

export const RoleSelectScreen: React.FC = () => {
  useRoleGuard();

  const [fontsLoaded] = useFonts({
    Silkscreen: require('@expo-google-fonts/silkscreen/Silkscreen_400Regular.ttf'), // Assumes @expo-google-fonts setup or similar fallback
  });

  const { width } = useWindowDimensions();
  const isDesktop = width > tokens.breakpoints.desktop;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'trainer' | 'client' | null>(null);

  const copy = headerCopy[COPY_VARIANT];

  const handleRolePress = (role: 'owner' | 'trainer' | 'client') => {
    if (role === 'owner') {
      console.log('Navigating to OwnerRegistrationStub');
    } else {
      setSelectedRole(role);
      setModalVisible(true);
    }
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    console.log('Role claimed successfully, session refresh triggered.');
  };

  // Determine card widths based on layout
  let cardWidth = 0;
  let gap = 0;
  
  if (isDesktop) {
    // 3 cards side by side, gap ≈ 5% of card width
    // Let's say max content width is 1200
    const contentWidth = Math.min(width - 48, 1200); // 24px padding on sides
    // 3 * cardWidth + 2 * gap = contentWidth
    // gap = 0.05 * cardWidth
    // 3 * cardWidth + 0.1 * cardWidth = contentWidth => 3.1 * cardWidth = contentWidth
    cardWidth = contentWidth / 3.1;
    gap = cardWidth * 0.05;
  } else {
    // Tablet and phone: phone ≈ 78% of viewport width, tablet ≈ 40-45%
    if (width > 600) {
      // Tablet
      cardWidth = width * 0.42; 
    } else {
      // Phone
      cardWidth = width * 0.78;
    }
    gap = 16;
  }

  const cards = [
    <RoleCard
      key="owner"
      role="owner"
      title={cardCopy.owner.title}
      body={cardCopy.owner.body}
      buttonLabel={cardCopy.owner.button}
      onPress={() => handleRolePress('owner')}
      width={cardWidth}
    />,
    <RoleCard
      key="trainer"
      role="trainer"
      title={cardCopy.trainer.title}
      body={cardCopy.trainer.body}
      buttonLabel={cardCopy.trainer.button}
      onPress={() => handleRolePress('trainer')}
      width={cardWidth}
    />,
    <RoleCard
      key="client"
      role="client"
      title={cardCopy.client.title}
      body={cardCopy.client.body}
      buttonLabel={cardCopy.client.button}
      onPress={() => handleRolePress('client')}
      width={cardWidth}
    />
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={isDesktop ? styles.desktopScroll : styles.mobileScroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          {/* Silkscreen font fallback to sans-serif if not loaded */}
          <Text style={[styles.title, { fontFamily: fontsLoaded ? tokens.fonts.heading : 'sans-serif' }]}>
            {copy.title}
          </Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        {isDesktop ? (
          <View style={[styles.desktopRow, { gap }]}>
            {cards}
          </View>
        ) : (
          <RoleCarousel cardWidth={cardWidth} gap={gap}>
            {cards}
          </RoleCarousel>
        )}
      </ScrollView>

      {selectedRole && (
        <CodeModal
          visible={modalVisible}
          role={selectedRole}
          onClose={() => setModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.pageBackground,
  },
  desktopScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  mobileScroll: {
    flexGrow: 1,
    paddingTop: 48,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 48,
    maxWidth: 600,
    alignSelf: 'center',
  },
  eyebrow: {
    fontFamily: tokens.fonts.body,
    color: tokens.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    color: tokens.colors.textPrimary,
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase', // Forced caps
  },
  subtitle: {
    fontFamily: tokens.fonts.body,
    color: tokens.colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  desktopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
