import nodemailer from "nodemailer";
import { renderAsync } from "@react-email/render";
import EmailTemplate from "../../emails/OtpEmailTemplate";
import { apiResponse } from "@/types/apiResponse";

const sendEmail = async (
  to: string,
  username: string,
  otp: string
): Promise<apiResponse> => {
  try {
    const html = await renderAsync(
      EmailTemplate({ username, otp })
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
      subject: "Verify your email | Secret Box",
      html,
    });

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (err) {
    console.error("Error sending email:", err);
    return {
      success: false,
      message: "Failed to send email",
    };
  }
};

export default sendEmail;
