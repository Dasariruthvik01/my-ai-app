export const COPY_VARIANT: 'private-access' | 'operating-role' = 'private-access';

export const headerCopy = {
  'private-access': {
    eyebrow: 'PRIVATE GYM ACCESS',
    title: 'CHOOSE YOUR ROLE',
    subtitle: 'One gym. One role. Your private experience begins here.',
  },
  'operating-role': {
    eyebrow: '01 ONBOARDING & LOGIN',
    title: 'CHOOSE OPERATING ROLE & SIGN IN',
    subtitle: 'Select your operational profile to authenticate into Gympoint OS. Inbuilt single sign-on, biometric passkeys, and tenant permissions are verified automatically.',
  },
};

export const cardCopy = {
  owner: {
    title: 'OWNER',
    body: 'Create your gym, invite staff, and lead every part of the operation.',
    button: 'Create your gym',
  },
  trainer: {
    title: 'TRAINER',
    body: 'Join with an owner\'s code, guide your roster, and manage today\'s sessions.',
    button: 'Use owner code',
  },
  client: {
    title: 'CLIENT',
    body: 'Join your gym to check in, follow workouts, and book what\'s next.',
    button: 'Use gym code',
  },
};
