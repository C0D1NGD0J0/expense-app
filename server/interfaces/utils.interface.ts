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

export interface ServiceResponse<T = unknown> {
  success: boolean;
  msg?: string;
  data?: T;
}
