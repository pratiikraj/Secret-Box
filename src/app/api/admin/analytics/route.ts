import { getServerSession } from "next-auth";
import { options } from "../../auth/[...nextauth]/options";
import dbConnection from "@/lib/dbConnection";
import User from "@/model/User";
import { NextResponse } from "next/server";

// GET — fetch all registered users (admin only)
export async function GET() {
    try {
        const session = await getServerSession(options);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }
        if (session.user.role !== "admin") {
            return NextResponse.json({ success: false, message: "Forbidden: admin access required" }, { status: 403 });
        }

        await dbConnection();

        const users = await User.find({})
            .select("_id name username email image role isVerify isAcceptingMessages createdAt messages")
            .sort({ createdAt: -1 })
            .lean();

        const usersData = users.map((u) => ({
            _id: u._id.toString(),
            name: u.name,
            username: u.username,
            email: u.email,
            image: u.image,
            role: u.role || "user",
            isVerify: u.isVerify,
            isAcceptingMessages: u.isAcceptingMessages,
            messageCount: u.messages?.length || 0,
            createdAt: u.createdAt?.toISOString(),
        }));

        return NextResponse.json({
            success: true,
            users: usersData,
            totalUsers: usersData.length,
        }, { status: 200 });
    } catch (err) {
        console.error("Error fetching admin analytics:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

// DELETE — delete a user account (admin only)
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(options);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }
        if (session.user.role !== "admin") {
            return NextResponse.json({ success: false, message: "Forbidden: admin access required" }, { status: 403 });
        }

        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
        }

        // Prevent admin from deleting themselves
        if (userId === session.user._id) {
            return NextResponse.json({ success: false, message: "Cannot delete your own admin account" }, { status: 400 });
        }

        await dbConnection();

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Delete user's messages first
        const mongoose = await import("mongoose");
        if (user.messages && user.messages.length > 0) {
            await mongoose.default.model("Message").deleteMany({ _id: { $in: user.messages } });
        }

        await User.findByIdAndDelete(userId);

        return NextResponse.json({
            success: true,
            message: `User @${user.username} deleted successfully`,
        }, { status: 200 });
    } catch (err) {
        console.error("Error deleting user:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
