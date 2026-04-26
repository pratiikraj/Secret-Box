import nodemailer from "nodemailer";
import { renderAsync } from "@react-email/render";
import EmailTemplate from "../../emails/LinkEmailTemplate";
import { apiResponse } from "@/types/apiResponse";

const sendEmail = async (
  to: string,
  username: string,
  resetLink: string
): Promise<apiResponse> => {
  try {
    const html = await renderAsync(
      EmailTemplate({ username, resetLink })
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Secret Box" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Reset Your Password | Secret Box",
      html,
    });

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (err) {
    console.error("Error sending reset email:", err);
    return {
      success: false,
      message: "Failed to send reset email",
    };
  }
};

export default sendEmail;
