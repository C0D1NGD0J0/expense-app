import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

import { createLogger } from '@utils/helper';
import Mailer from '../mailer';
import { IEmailOptions } from '@/interfaces';

export default class EmailWorker {
  mailer: Mailer;
  logger: Logger;

  constructor() {
    this.mailer = new Mailer();
    this.logger = createLogger('EmailWorker');
  }

  send = async (job: Job, done: DoneCallback): Promise<void> => {
    try {
      job.progress(0);
      const { data } = job;
      const result = await this.sendmail(data);
      if (result) {
        job.progress(100);
        done(null, job.data);
      }
      job.progress(100);
      done(new Error('Unable to send email presently.'), null);
    } catch (error) {
      this.logger.error(error);
      done(error as Error, null);
    }
  };

  private sendmail = async (data: IEmailOptions): Promise<boolean> => {
    try {
      await this.mailer.sendmail(data);
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  };
}
