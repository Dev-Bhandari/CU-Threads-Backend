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

const mailer = (user, emailToken, emailType) => {
    const verifyEmailUrl = `${FRONTEND_ENDPOINT}/verify-email?emailToken=${emailToken}`;

    const verifyEmailBody = {
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
                    <p style="font-size: 16px; color: #000;">Hi ${user.username},</p>
                    <p style="font-size: 16px; color: #000;">
                        You have created an account with the ${user.email}. <br />Please
                        click on the button given below to confirm your account.
                    </p>
                    <a
                        href="${verifyEmailUrl}"
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
                    <p style="font-size: 16px; color: #000;">
                        lf clicking the button doesn't seem to work, you can copy and
                        paste the following link into your browser.
                    </p>
                    <a href="${verifyEmailUrl}">${verifyEmailUrl}</a>
                    <p style="font-size: 16px; margin-top: 50px; color: #000;">
                        Thanks,
                        <br />
                        CU Threads
                    </p>
                </div>
            </body>
        </html>
        `,
    };

    const forgotPasswordUrl = `${FRONTEND_ENDPOINT}/forgot-password?emailToken=${emailToken}`;

    const forgotPasswordBody = {
        from: "CU Threads <cuthreadsofficial@gmail.com>",
        to: user.email,
        subject: "Password Reset Request for CU Threads",
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
                    <p style="font-size: 16px; color: #000;">Hi ${user.username},</p>
                    <p style="font-size: 16px; color: #000;">
                        Your CU Threads password can be reset by clicking the button below. <br />
                        If you did not request a new password, please ignore this email.
                    </p>
                    <a
                        href="${forgotPasswordUrl}"
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
                        >Reset Password</a
                    >
                    <p style="font-size: 16px; margin-top: 50px; color: #000;">
                        Thanks,
                        <br />
                        CU Threads
                    </p>
                </div>
            </body>
        </html>
        `,
    };

    if (emailType == "verifyEmail") transporter.sendMail(verifyEmailBody);
    else if (emailType == "forgotPassword") {
        console.log("Email send");
        transporter.sendMail(forgotPasswordBody);
        console.log("Done");
    }
};

export { mailer };
