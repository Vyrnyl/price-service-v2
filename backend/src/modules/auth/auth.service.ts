import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../../utils/AppError';
import { userRepository } from '../user/user.repository';
import type { LoginInput } from './auth.schema';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

export const authService = {
  login: async (input: LoginInput) => {
    const user = await userRepository.findByEmail(input.email);
    
    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is inactive', 403);
    }

    if (user.role !== 'ADMIN' && user.role !== 'OFFICER') {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '1h' },
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      accessToken: token,
    };
  },
};
