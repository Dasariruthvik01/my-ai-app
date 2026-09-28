import { useEffect } from 'react';

// This is a stub for the actual auth/session context.
// For now, it assumes the user is authenticated but has no role.
export function useRoleGuard() {
  useEffect(() => {
    // In a real implementation:
    // const { session, role } = useAuth();
    // if (!session) {
    //   router.replace('/sign-in');
    // } else if (role) {
    //   router.replace(`/${role}-home`);
    // }
  }, []);
}
