import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import ejs from "ejs";

interface IMailer {
  sendmail: (
    options: CustomMailOption,
    mailType: string,
    emailData: any
  ) => Promise<void | null>;
}

interface CustomMailOption extends Mail.Options {
  data: any;
  emailType: string;
}

export default class MailerService implements IMailer {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.buildMailTransporter()!;
  }

  public async sendmail(options: CustomMailOption) {
    const year = new Date().getFullYear();
    const emailData = options.data;
    try {
      const res = await this.getEmailTemplate(emailData, options.emailType);
      this.transporter.sendMail({
        subject: options.subject,
        to: options.to,
        from: process.env.APP_EMAIL_ADDRESS,
        html: await ejs.renderFile(
          `${__dirname}/templates/shared/html/layout.ejs`,
          {
            appName: process.env.APP_NAME,
            content: res?.html,
            year,
          }
        ),
        text: await ejs.renderFile(
          `${__dirname}/templates/shared/text/layout.ejs`,
          {
            appName: process.env.APP_NAME,
            content: res?.text,
            year,
          }
        ),
      });
    } catch (error) {
      throw error;
    }
  }

  private buildMailTransporter() {
    return nodemailer.createTransport({
      auth: {
        user: process.env.MAILTRAP_SMTP_USERNAME,
        pass: process.env.MAILTRAP_SMTP_PASSWORD,
      },
      host: "smtp.mailtrap.io",
      port: process.env.EMAIL_PROVIDER_PORT,
    } as nodemailer.TransportOptions);
  }

  private async getEmailTemplate(emailData: any, emailType: string) {
    const year = new Date().getFullYear();
    let result;

    emailData = {
      ...emailData,
      year,
    };

    switch (emailType) {
      case "USER_REGISTRATION":
        result = await this.buildTemplate("registration", emailData);
        break;
      case "FORGOT_PASSWORD":
        result = await this.buildTemplate("forgotPassword", emailData);
        break;
      case "RESET_PASSWORD_SUCCESS":
        result = await this.buildTemplate("resetPassword", emailData);
        break;
    }

    return result;
  }

  private async buildTemplate(filename: string, data: any) {
    //filename must match directory name and files names of the email you sending
    //e.g. forgotPassword/forgotPassword.ejs
    let text = await ejs.renderFile(
      __dirname + `/templates/${filename}/${filename}.text.ejs`,
      data
    );
    let html = await ejs.renderFile(
      __dirname + `/templates/${filename}/${filename}.ejs`,
      data
    );
    return { html, text };
  }
}
