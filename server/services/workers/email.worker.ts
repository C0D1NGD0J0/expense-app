import { DoneCallback, Job } from "bull";
import Logger from "bunyan";

import { createLogger } from "@utils/helper";
import Mailer from "../mailer";

export default class EmailWorker {
  mailer: Mailer;
  logger: Logger;

  constructor() {
    this.mailer = new Mailer();
    this.logger = createLogger("EmailWorker");
  }

  sendAuthMail = async (job: Job, done: DoneCallback): Promise<void> => {
    try {
      job.progress(0);
      const { data } = job;
      await this.mailer.sendmail(data);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      this.logger.error(error);
      done(error as Error, null);
    }
  };
}
