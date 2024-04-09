import nodemailer from "nodemailer";
import {
    FRONTEND_ENDPOINT,
    EMAIL_USER,
    EMAIL_PASSWORD,
} from "../config/server.config.js";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

const mailer = async (user, emailToken) => {
    const url = `https://${FRONTEND_ENDPOINT}/verify-email?emailToken=${emailToken}`;

    await transporter.sendMail({
        from: "CU Threads <cuthreadsofficial@gmail.com>",
        to: user.email,
        subject: "Confirm Email",
        html: `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Email Verification</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px">
                <div style="max-width: 600px; margin: 0 auto">
                    <p style="font-size: 16px">Hi ${user.username}:</p>
                    <p style="font-size: 16px">
                        You have created an account with the ${user.email}. <br />Please
                        click on the button given below to confirm your account.
                    </p>
                    <a
                        href="${url}"
                        style="
                            display: inline-block;
                            background-color: #007bff;
                            color: #fff;
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                            font-size: 16px;
                            margin: 30px 10px;
                        "
                        >Verify Email</a
                    >
                    <p style="font-size: 16px">
                        lf clicking the button doesn't seem to work, you can copy and
                        paste the following link into your browser.
                        <br />
                        <a href="${url}">${url}</a>
                    </p>
                    <p style="font-size: 16px; margin-top: 50px">
                        Thanks,
                        <br />
                        CU Threads
                    </p>
                </div>
            </body>
        </html>
        `,
    });
};

export { mailer };
