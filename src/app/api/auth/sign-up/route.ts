import dbConnection from "@/lib/dbConnection";
import User from "@/model/User";
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/schema/signUpSchema";
import sendEmail from "@/helper/sendOptEmailGmailSMPT";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = signUpSchema.safeParse(body);
        if (!result.success) {
            const errors = result.error.format();
            const errorMessage =
                errors.username?._errors[0] ||
                errors.email?._errors[0] ||
                errors.password?._errors[0] ||
                "Invalid input";
            return NextResponse.json({
                success: false,
                message: errorMessage,
            }, { status: 400 });
        }

        const { username, email, password } = result.data;

        await dbConnection();

        // Check if a verified user already exists with this username
        const existingUserByUsername = await User.findOne({ username, isVerify: true });
        if (existingUserByUsername) {
            return NextResponse.json({
                success: false,
                message: "Username is already taken",
            }, { status: 400 });
        }

        // Check if a user exists with this email
        const existingUserByEmail = await User.findOne({ email });

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verifyCodeExpiry = new Date();
        verifyCodeExpiry.setMinutes(verifyCodeExpiry.getMinutes() + 10);

        if (existingUserByEmail) {
            if (existingUserByEmail.isVerify) {
                return NextResponse.json({
                    success: false,
                    message: "A user with this email already exists",
                }, { status: 400 });
            } else {
                // Update the existing unverified user
                const hashedPassword = await bcrypt.hash(password, 10);
                existingUserByEmail.username = username;
                existingUserByEmail.password = hashedPassword;
                existingUserByEmail.verifyCode = verifyCode;
                existingUserByEmail.verifyCodeExpiry = verifyCodeExpiry;
                await existingUserByEmail.save();
            }
        } else {
            // Create a new user
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                username,
                email,
                password: hashedPassword,
                verifyCode,
                verifyCodeExpiry,
                isVerify: false,
                isAcceptingMessages: true,
                image: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
                messages: [],
            });
        }

        // Send verification email
        const emailResponse = await sendEmail(email, username, verifyCode);
        if (!emailResponse.success) {
            return NextResponse.json({
                success: false,
                message: "Error sending verification email",
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "User registered successfully. Please verify your email.",
        }, { status: 201 });
    } catch (err) {
        console.error("Error in sign-up route:", err);
        return NextResponse.json({
            success: false,
            message: "Error registering user",
        }, { status: 500 });
    }
}
