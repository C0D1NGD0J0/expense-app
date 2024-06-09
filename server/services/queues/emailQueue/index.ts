import EmailWorker from "@/services/workers/email.worker";
import { IEmailOptions } from "@/types/utils.types";
import { BaseQueue } from "..";

class EmailQueue extends BaseQueue {
  constructor() {
    super("Emails");
    this.processQueueJobs("AUTH_EMAIL_JOB", 5, new EmailWorker().sendAuthMail);
  }

  addMailToJobQueue(qname: string, data: IEmailOptions) {
    this.addJobToQueue(qname, data);
  }
}

export const emailQueue: EmailQueue = new EmailQueue();
