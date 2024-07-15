import { Resend } from 'resend';

export const sendEmail = async (email, code, apiKey) => {
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'SaltyNote <noreply@email.saltynote.com>',
    to: email,
    subject: '[SaltyNote] - Your Verification Code',
    html: '<p>Hello,</p> <p>Your email verification code is <strong>' + code + '</strong>.</p> <p>Note:<i>This code will expire in 10 minutes.</i></p>'
  });
};
