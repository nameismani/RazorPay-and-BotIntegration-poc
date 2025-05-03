import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(req: NextRequest) {
    try {
        // Fetch plans from Razorpay
        const plans = await razorpay.plans.all();
        console.log(plans, "plans")
        return NextResponse.json({
            plans: plans.items,
        });
    } catch (error) {
        console.error("Error fetching plans:", error);
        return NextResponse.json(
            { error: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}