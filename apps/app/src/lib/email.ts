import { Resend } from "resend";
import { env } from "~/env/server";

const resend = new Resend(env.RESEND_API_KEY);

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const { data, error } = await resend.emails.send({
    from: "Thoughtbase <noreply@thoughtbase.app>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
