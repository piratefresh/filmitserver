import { google } from "googleapis";
import nodemailer from "nodemailer";

const oAuth2 = google.auth.OAuth2;

// sends emails from a gmail account.
// See this guide: https://medium.com/@nickroach_50526/sending-emails-with-node-js-using-smtp-gmail-and-oauth2-316fe9c790a1
export async function sendEmail(toEmail, subject, message) {
  const oauth2Client = new oAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const accessToken = await oauth2Client.getAccessToken();

  const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "oAuth2",
      user: "magnussithnilsen@gmail.com",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken
    }
  });

  const mailOptions = {
    from: `CreateIt | Admin`,
    to: toEmail,
    subject: subject,
    generateTextFromHtml: true,
    html: message
  };

  smtpTransport.sendMail(mailOptions, (err, res) => {
    console.log("\n\x1b[36mSending Email\x1b[0m");
    err ? console.log(err) : console.log(res);

    smtpTransport.close();
  });
}
