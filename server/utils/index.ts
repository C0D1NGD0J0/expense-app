import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";

export const hashGenerator = (): string => {
  const token = crypto.randomBytes(10).toString("hex");
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const jwtGenerator = (
  userId: string,
  secret = process.env.JWT_SECRET as string,
  opts: SignOptions
) => {
  return `Bearer ${jwt.sign({ id: userId }, secret, opts)}`;
};

export const excludeProperties = <T extends Record<string, any>>(
  obj: T,
  excludedProps: Set<keyof T>
): Partial<T> => {
  const newObj: Partial<T> = {};

  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!excludedProps.has(key)) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        newObj[key] = excludeProperties(
          obj[key],
          new Set(excludedProps)
        ) as T[typeof key];
      } else {
        newObj[key] = obj[key] as T[typeof key];
      }
    }
  }

  return newObj;
};
