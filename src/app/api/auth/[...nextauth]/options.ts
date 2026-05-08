import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import dbConnection from "@/lib/dbConnection";
import UserModel from "@/model/User";

export const options: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                identifier: { label: "Username or Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials): Promise<User | null> {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Please provide all required fields");
                }

                await dbConnection();

                const user = await UserModel.findOne({
                    $or: [
                        { email: credentials.identifier },
                        { username: credentials.identifier },
                    ],
                });

                if (!user) {
                    throw new Error("No user found with this email or username");
                }

                if (!user.isVerify) {
                    throw new Error("Please verify your account before logging in");
                }

                // OTP bypass: after email verification, the user is signed in with password "otp-bypass"
                if (credentials.password === "otp-bypass") {
                    // Only allow OTP bypass if the user has an active OTP session
                    if (user.otpSession && user.otpSessionExpiry && user.otpSessionExpiry > new Date()) {
                        // Clear the OTP session after use
                        await UserModel.findByIdAndUpdate(user._id, {
                            otpSession: false,
                            otpSessionExpiry: undefined,
                        });
                        return user as unknown as User;
                    }
                    throw new Error("Invalid OTP session");
                }

                if (!user.password) {
                    throw new Error("Please sign in with Google or GitHub");
                }

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordCorrect) {
                    throw new Error("Incorrect password");
                }

                return user as unknown as User;
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google" || account?.provider === "github") {
                await dbConnection();

                const existingUser = await UserModel.findOne({ email: user.email });

                if (existingUser) {
                    // Link the OAuth account if not already linked
                    if (account.provider === "google" && !existingUser.googleId) {
                        existingUser.googleId = account.providerAccountId;
                        await existingUser.save();
                    }
                    if (account.provider === "github" && !existingUser.githubId) {
                        existingUser.githubId = account.providerAccountId;
                        await existingUser.save();
                    }
                    return true;
                }

                // Create a new user for OAuth sign-in
                const username = (user.email?.split("@")[0] || "user") + "_" + Date.now().toString(36);
                await UserModel.create({
                    name: user.name || "New User",
                    username,
                    email: user.email,
                    isVerify: true,
                    isAcceptingMessages: true,
                    image: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=random`,
                    googleId: account.provider === "google" ? account.providerAccountId : undefined,
                    githubId: account.provider === "github" ? account.providerAccountId : undefined,
                });

                return true;
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                // For OAuth providers, look up the user from DB to get _id and custom fields
                if (account?.provider === "google" || account?.provider === "github") {
                    await dbConnection();
                    const dbUser = await UserModel.findOne({ email: user.email });
                    if (dbUser) {
                        token._id = dbUser._id?.toString();
                        token.name = dbUser.name;
                        token.username = dbUser.username;
                        token.email = dbUser.email;
                        token.isVerify = dbUser.isVerify;
                        token.isAcceptingMessages = dbUser.isAcceptingMessages;
                        token.image = dbUser.image;
                        token.role = dbUser.role;
                    }
                } else {
                    token._id = user._id?.toString();
                    token.name = user.name;
                    token.username = user.username;
                    token.email = user.email;
                    token.isVerify = user.isVerify;
                    token.isAcceptingMessages = user.isAcceptingMessages;
                    token.image = user.image;
                    token.role = user.role;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user._id = token._id as string;
                session.user.name = token.name as string;
                session.user.username = token.username as string;
                session.user.email = token.email as string;
                session.user.isVerify = token.isVerify as boolean;
                session.user.isAcceptingMessages = token.isAcceptingMessages as boolean;
                session.user.image = token.image as string;
                session.user.role = token.role as 'admin' | 'user';
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin-signup",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
