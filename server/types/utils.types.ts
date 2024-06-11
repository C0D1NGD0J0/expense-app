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
