import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};