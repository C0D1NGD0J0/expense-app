export type IEmailOptions = {
  subject: string;
  to: string;
  data: unknown;
  emailType: string;
};

export type RateLimitOptions = {
  window: number;
  limit: number;
};

export interface ServiceResponse<T = any> {
  success: boolean;
  msg?: string;
  data?: T;
}

export type ICacheResponse<T = any> = {
  success: boolean;
  data?: T | null;
  error?: string;
};
