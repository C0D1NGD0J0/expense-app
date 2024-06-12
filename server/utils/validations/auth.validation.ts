import { db } from '@/db';
import { z } from 'zod';

const isValidDate = (dateString: string | undefined): boolean => {
  if (dateString === undefined) {
    return true;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const isEmailInSystem = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return !!user; // Returns true if user exists, otherwise false
};

const prisma = db.getClient();

export const UserSignUpSchema = z.object({
  dob: z.string().optional().refine(isValidDate, {
    message: 'Invalid date format',
  }),
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .refine(
      async (email) => {
        const isUsed = await isEmailInSystem(email);
        return !isUsed;
      },
      { message: 'Email is alreadyin use.' }
    ),
  lastName: z.string().min(2, { message: 'Last name cannot be empty' }),
  firstName: z.string().min(2, { message: 'First name cannot be empty' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(10, { message: 'Password cannot be longer than 10 characters' })
    .regex(/[A-Z]/, {
      message: 'Password must contain at least one uppercase letter',
    })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  location: z.string().optional(),
  avatar: z.string().url({ message: 'Avatar must be a valid URL' }).optional(),
});

export const AccountActivationSchema = z.object({
  token: z
    .string()
    .length(64, { message: 'Token must be a 64-character hexadecimal string' })
    .regex(/^[a-f0-9]{64}$/, { message: 'Invalid token format' })
    .refine(
      async (token) => {
        const user = await prisma.user.findFirst({
          where: {
            activationToken: token,
          },
        });
        return !!user;
      },
      { message: 'Invalid or expired token.' }
    ),
});

export const LoginSchema = z.object({
  email: z.string().min(1, { message: 'Email field is required.' }).email({ message: 'Invalid email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .refine(
      async (email) => {
        const isUsed = await isEmailInSystem(email);
        return !isUsed;
      },
      { message: 'No record found with provided email.' }
    ),
});

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(10, { message: 'Password cannot be longer than 10 characters' })
    .regex(/[A-Z]/, {
      message: 'Password must contain at least one uppercase letter',
    })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  token: z
    .string()
    .length(64, { message: 'Token must be a 64-character hexadecimal string' })
    .regex(/^[a-f0-9]{64}$/, { message: 'Invalid token format' }),
});
