export type ClaimRoleRequest = {
  role: 'owner' | 'trainer' | 'client';
  code: string;
};

export type ClaimRoleResponse = {
  success: boolean;
  message?: string;
};

export const roleApi = {
  claimRole: async (req: ClaimRoleRequest): Promise<ClaimRoleResponse> => {
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulated configurable responses based on code entered
        switch (req.code) {
          case '000404':
            reject({ status: 404, message: 'Invalid code.' });
            break;
          case '000401':
            reject({ status: 401, message: 'Incorrect code.' });
            break;
          case '000410':
            reject({ status: 410, message: 'This code has expired.' });
            break;
          case '000429':
            reject({ status: 429, message: 'Too many attempts. Try again later.' });
            break;
          case '000500':
            reject({ status: 500, message: 'Network error.' });
            break;
          default:
            resolve({ success: true });
        }
      }, 1000);
    });
  },
};
