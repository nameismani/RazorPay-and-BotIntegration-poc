import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const subscriptionId = params.id;

        if (!subscriptionId) {
            return NextResponse.json(
                { error: "Subscription ID is required" },
                { status: 400 }
            );
        }

        // Fetch subscription details from Razorpay
        const subscription: any = await razorpay.subscriptions.fetch(subscriptionId);

        // If the subscription has a plan_id, fetch the plan details
        if (subscription.plan_id) {
            try {
                const plan = await razorpay.plans.fetch(subscription.plan_id);
                subscription.plan_name = plan.item.name;
            } catch (planError) {
                console.error("Error fetching plan details:", planError);
                // Continue even if plan details can't be fetched
            }
        }

        return NextResponse.json({
            success: true,
            subscription,
        });
    } catch (error: any) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch subscription details",
                details: error.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}