import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const generateSignature = (
    razorpaySubscriptionId: string,
    razorpayPaymentId: string
) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET as string;

    const sig = crypto
        .createHmac("sha256", keySecret)
        .update(razorpayPaymentId + "|" + razorpaySubscriptionId)
        .digest("hex");
    return sig;
};

export async function POST(request: NextRequest) {
    const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } =
        await request.json();

    if (!razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature) {
        return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
        );
    }

    try {
        // Verify the signature
        const expectedSignature = generateSignature(
            razorpaySubscriptionId,
            razorpayPaymentId
        );

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json(
                { message: "Invalid signature", isOk: false },
                { status: 400 }
            );
        }

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(razorpayPaymentId);

        // In a real application, you would update your database to record the subscription
        // For example: await db.subscriptions.create({ userId: 'user_123', subscriptionId: razorpaySubscriptionId, ... })

        return NextResponse.json(
            {
                message: "Subscription verified successfully",
                isOk: true,
                payment,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error verifying subscription:", error);
        return NextResponse.json(
            { error: "Failed to verify subscription", isOk: false },
            { status: 500 }
        );
    }
}