import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { hashPassword, comparePassword } from '../utils/crypto';
import { SignupData, LoginData } from '../types';

export class AuthService {
  async signup(data: SignupData) {
    const { name, email, password, role } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with auto-verification (no email required)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        emailVerified: true, // Auto-verify users
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }

  // Email verification removed - users are auto-verified during signup

  async login(data: LoginData) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Email verification is disabled - users are auto-verified

    // Generate JWT token
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };

    const token = (jwt as any).sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }
}