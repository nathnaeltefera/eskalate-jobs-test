import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { generateSecureToken, hashPassword, comparePassword } from '../utils/crypto';
import { sendVerificationEmail } from '../utils/email';
import { SignupData, LoginData, JwtPayload } from '../types';

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

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    // Generate verification token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, token);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }

  async verifyEmail(token: string) {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new Error('Invalid or malformed token');
    }

    if (verificationToken.used) {
      throw new Error('Token has already been used');
    }

    if (verificationToken.user.emailVerified) {
      return {
        message: 'Email has already been verified and no further action is required',
        user: {
          id: verificationToken.user.id,
          email: verificationToken.user.email,
          emailVerified: true,
        },
      };
    }

    if (new Date() > verificationToken.expiresAt) {
      // Token expired, generate new one
      const newToken = generateSecureToken();
      const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.emailVerificationToken.create({
        data: {
          userId: verificationToken.userId,
          token: newToken,
          expiresAt: newExpiresAt,
        },
      });

      // Send new verification email
      await sendVerificationEmail(verificationToken.user.email, newToken);

      throw new Error('Token has expired. A new verification email has been sent.');
    }

    // Mark token as used and verify user
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
    ]);

    return {
      message: 'Email verified successfully',
      user: {
        id: verificationToken.user.id,
        email: verificationToken.user.email,
        emailVerified: true,
      },
    };
  }

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

    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }

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