import nodemailer from "nodemailer";
import {renderToStaticMarkup} from "react-dom/server";
import React from "react";
import NewPasswordTemplate from "../templates/NewPasswordTemplate";

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendNewPassword = async (username: string, newPassword: string, to: string) => {

    try {
        const htmlContent = renderToStaticMarkup(
            React.createElement(NewPasswordTemplate, {
                name: username, newPassword: newPassword
            })
        );

        const mailOptions = {
            from: `Maintenance Knowledge Base`,
            to: to,
            subject: `📩 New Password`,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error("Error while sending new password to the user email");
    }
}