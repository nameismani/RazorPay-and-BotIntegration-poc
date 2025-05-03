import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// "plan": {
//     "id": "plan_QQLPEg2Xqdx5uG",
//         "entity": "plan",
//             "interval": 7,
//                 "period": "daily",
//                     "item": {
//         "id": "item_QQLPEfD5XvgFFe",
//             "active": true,
//                 "name": "Daily sub check",
//                     "description": "af",
//                         "amount": 10000,
//                             "unit_amount": 10000,
//                                 "currency": "INR",
//                                     "type": "plan",
//                                         "unit": null,
//                                             "tax_inclusive": false,
//                                                 "hsn_code": null,
//                                                     "sac_code": null,
//                                                         "tax_rate": null,
//                                                             "tax_id": null,
//                                                                 "tax_group_id": null,
//                                                                     "created_at": 1746250880,
//                                                                         "updated_at": 1746250880
//     },
//     "notes": {
//         "created_by": "api",
//             "created_at": "2025-05-03T05:41:19.045Z",
//                 "is_test_plan": "false"
//     },
//     "created_at": 1746250880
// },

export async function POST(req: NextRequest) {
    try {
        const {
            name,
            description,
            amount,
            interval,
            intervalCount,
            isTestPlan = false
        } = await req.json();

        // Validate required fields
        if (!name || !amount) {
            return NextResponse.json(
                { error: "Name and amount are required" },
                { status: 400 }
            );
        }

        // According to Razorpay docs, period must be one of: daily, weekly, monthly, yearly
        // Let's map our interval values to these accepted values
        const periodMap: Record<string, string> = {
            'day': 'daily',
            'week': 'weekly',
            'month': 'monthly',
            'year': 'yearly'
        };

        const period = periodMap[interval] || 'monthly';

        // Create the plan in Razorpay
        const planConfig = {
            period: isTestPlan ? 'daily' : period,
            interval: isTestPlan ? 1 : (intervalCount || 1),
            item: {
                name: isTestPlan ? `TEST: ${name}` : name,
                description: isTestPlan
                    ? `Test plan - ${description || "Short duration for testing"}`
                    : (description || ""),
                amount: Math.round(isTestPlan ? 1 * 100 : amount * 100), // Convert to paise
                currency: "INR",
            },
            notes: {
                created_by: "api",
                created_at: new Date().toISOString(),
                is_test_plan: isTestPlan ? "true" : "false"
            },
        };

        console.log("Creating plan with config:", JSON.stringify(planConfig, null, 2));

        const plan = await razorpay.plans.create(planConfig as any);

        return NextResponse.json({
            success: true,
            plan,
            message: `Plan created successfully${isTestPlan ? ' (Test Plan)' : ''}`,
        });
    } catch (error: any) {
        console.error("Error creating plan:", error);
        return NextResponse.json(
            {
                error: "Failed to create plan",
                details: error.message || "Unknown error",
                fullError: error
            },
            { status: 500 }
        );
    }
}