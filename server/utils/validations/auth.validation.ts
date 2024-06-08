import { z } from "zod";

export const UserSignUpSchema = z.object({
  dob: z.string().optional(),
  email: z.string().email({ message: "Invalid email format" }),
  lastName: z.string().min(2, { message: "Last name cannot be empty" }),
  firstName: z.string().min(2, { message: "First name cannot be empty" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(10, { message: "Password cannot be longer than 10 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  location: z.string().optional(),
  avatar: z.string().url({ message: "Avatar must be a valid URL" }).optional(),
});

export const AccountActivationSchema = z.object({
  token: z
    .string()
    .length(64, { message: "Token must be a 64-character hexadecimal string" })
    .regex(/^[a-f0-9]{64}$/, { message: "Invalid token format" }),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email field can't be blank." })
    .email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(10, { message: "Password cannot be longer than 10 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  token: z
    .string()
    .length(64, { message: "Token must be a 64-character hexadecimal string" })
    .regex(/^[a-f0-9]{64}$/, { message: "Invalid token format" }),
});
