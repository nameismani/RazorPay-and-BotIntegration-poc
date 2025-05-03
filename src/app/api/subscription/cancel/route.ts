import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { subscriptionId } = await req.json();

        if (!subscriptionId) {
            return NextResponse.json(
                { error: "Subscription ID is required" },
                { status: 400 }
            );
        }

        // In a real application, you would verify that the user owns this subscription
        // before allowing them to cancel it

        // Cancel the subscription in Razorpay
        // const cancelledSubscription = await razorpay.subscriptions.cancel(subscriptionId, {
        //     cancel_at_cycle_end: 1, // Set to 0 to cancel immediately, 1 to cancel at the end of the current billing cycle
        // });
        const cancelledSubscription = await razorpay.subscriptions.cancel(subscriptionId, false);
        // Use true to cancel at cycle end, false to cancel immediately

        // In a real application, you would update your database to reflect the cancellation
        // For example: await db.subscriptions.update({ id: subscriptionId, status: 'cancelled' })

        return NextResponse.json({
            message: "Subscription cancelled successfully",
            subscription: cancelledSubscription,
        });
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return NextResponse.json(
            { error: "Failed to cancel subscription" },
            { status: 500 }
        );
    }
}