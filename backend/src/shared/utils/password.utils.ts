import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

export const passwordUtils = {
  /**
   * Hash a password
   * @param password - The plain text password to hash
   * @returns Promise<string> - The hashed password
   */
  hashPassword: async (password: string): Promise<string> => {
    return bcryptjs.hash(password, SALT_ROUNDS);
  },

  /**
   * Compare a plain text password with a hashed password
   * @param password - The plain text password to compare
   * @param hashedPassword - The hashed password to compare against
   * @returns Promise<boolean> - True if passwords match, false otherwise
   */
  comparePassword: async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcryptjs.compare(password, hashedPassword);
  },
};
