import EmailWorker from '@/services/workers/email.worker';
import { IEmailOptions } from '@/interfaces/utils.interface';
import { BaseQueue } from '..';
import { AUTH_EMAIL_JOB, RESET_PASSWORD_JOB } from '@/utils';

class EmailQueue extends BaseQueue {
  constructor() {
    super('Emails');
    this.processQueueJobs(AUTH_EMAIL_JOB, 10, new EmailWorker().send);
    this.processQueueJobs(RESET_PASSWORD_JOB, 5, new EmailWorker().send);
  }

  addMailToJobQueue(qname: string, data: IEmailOptions) {
    this.addJobToQueue(qname, data);
  }
}

export const emailQueue: EmailQueue = new EmailQueue();
