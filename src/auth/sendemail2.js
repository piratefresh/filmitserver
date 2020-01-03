"use strict";
import { google } from "googleapis";
import nodemailer from "nodemailer";

const OAuth2 = google.auth.OAuth2;
/**
 * Sends an email with the paramaters and content of it.
 *
 * @name send
 * @function
 * @param {Object} params - Parameters of the email.
 * @param {String} content - HTML body of the email.
 * @param {Function} cb - Callback argument.
 */
exports.send = (params, cb) => {
  const oauth2Client = new OAuth2(
    config.nodemailer.auth.clientId || process.env.GOOGLE_CLIENT_ID, // ClientID
    config.nodemailer.auth.clientSecret || process.env.GOOGLE_CLIENT_SECRET, // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
  );
  const GMAIL_SCOPES = [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/gmail.send"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES
  });

  console.info(`authUrl: ${url}`);

  oauth2Client.setCredentials({
    refresh_token:
      config.nodemailer.auth.refreshToken || process.env.GOOGLE_REFRESH_TOKEN
  });
  const accessToken = async () => {
    const token = await oauth2Client.refreshAccessToken();

    console.log(token.credentials.access_token);
    return oauth2Client.getAccessToken();
  };
  if (!params.from || !params.to || !params.subject) {
    return cb({ err: "Missing data." });
  }

  let mailOptions = params;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      type: "OAuth2",
      user: config.nodemailer.auth.user || process.env.GOOGLE_EMAIL,
      clientId: config.nodemailer.auth.clientId || process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        config.nodemailer.auth.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
      refreshToken:
        config.nodemailer.auth.refreshToken || process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken
    }
  });

  transporter.sendMail(mailOptions, (err, info, resp) => {
    return cb(err, info);
  });
};
