import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { planId } = await req.json();

        if (!planId) {
            return NextResponse.json(
                { error: "Plan ID is required" },
                { status: 400 }
            );
        }

        // In a real application, you would get the customer ID from your database
        // For this example, we'll create a new customer or use a test customer ID
        const customerId = "cust_sample123"; // Replace with actual customer ID logic

        // Create a subscription
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 0,
            quantity: 1,
            total_count: 12, // Number of billing cycles (optional)
            // customer_id: customerId, // Uncomment if you're using customer ID
            notes: {
                userId: "user_123", // Replace with actual user ID from your system
            },
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            status: subscription.status,
        });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
            { error: "Failed to create subscription" },
            { status: 500 }
        );
    }
}