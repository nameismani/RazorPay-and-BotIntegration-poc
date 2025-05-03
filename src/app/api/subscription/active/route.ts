import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(req: NextRequest) {
    try {
        // In a real application, you would get the user ID from the session
        // and fetch only subscriptions for that user
        const userId = "user_123"; // Replace with actual user ID from your auth system

        // Fetch subscriptions from Razorpay
        const subscriptions = await razorpay.subscriptions.all({
            // You can add filters here if needed
            // count: 10,
        });

        // In a real application, you would filter subscriptions by user ID
        // Here we're just returning all subscriptions for demo purposes
        // You would typically join this data with your own database records

        return NextResponse.json({
            subscriptions: subscriptions.items,
        });
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscriptions" },
            { status: 500 }
        );
    }
}