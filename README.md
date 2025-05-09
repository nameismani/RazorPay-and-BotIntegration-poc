# Code for updating subscription details in database 


# Tracking Recurring Payments in Razorpay
When Razorpay processes recurring payments automatically, you need a way to know when these payments happen. Razorpay provides webhooks for this purpose, which notify your application when payment events occur.

Here's how to implement webhook handling for recurring subscription payments:

## 1. Create a Webhook Endpoint  api\webhook\razorpay\route.ts
First, create an API endpoint to receive webhook notifications from Razorpay:

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateSubscriptionInDatabase } from "@/lib/database"; // You'll need to implement this

export async function POST(req: NextRequest) {
  try {
    // Get the webhook payload
    const payload = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse the payload
    const event = JSON.parse(payload);
    const eventType = event.event;

    console.log(`Received Razorpay webhook: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case "subscription.charged":
        // A recurring payment was successfully processed
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;

      case "subscription.payment.failed":
        // A recurring payment attempt failed
        await handleSubscriptionPaymentFailed(event.payload.subscription.entity);
        break;

      case "subscription.cancelled":
        // Subscription was cancelled
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case "subscription.completed":
        // Subscription has completed all scheduled payments
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;

      // Add more event handlers as needed
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Verify the webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );
}

// Handle successful recurring payment
async function handleSubscriptionCharged(subscription: any) {
  try {
    // Extract relevant information
    const subscriptionId = subscription.id;
    const paymentId = subscription.payment_id; // ID of the latest payment
    const paidAt = subscription.charge_at; // Timestamp of the payment
    const status = subscription.status;
    const currentPeriodEnd = subscription.current_end;
    const currentPeriodStart = subscription.current_start;

    console.log(`Processing subscription payment: ${subscriptionId}, payment: ${paymentId}`);

    // Update your database with the new payment information
    await updateSubscriptionInDatabase({
      subscriptionId,
      paymentId,
      paidAt,
      status,
      currentPeriodStart,
      currentPeriodEnd,
    });

    // You might want to send an email notification to the user
    // await sendPaymentSuccessEmail(subscription.notes.userId, subscription);

  } catch (error) {
    console.error("Error handling subscription charged event:", error);
    // Consider implementing retry logic or alerting
  }
}

// Handle failed payment
async function handleSubscriptionPaymentFailed(subscription: any) {
  try {
    // Update subscription status in your database
    await updateSubscriptionInDatabase({
      subscriptionId: subscription.id,
      status: "payment_failed",
      failedAt: new Date().toISOString(),
      failureReason: subscription.failure_reason,
    });

    // Notify the user about the failed payment
    // await sendPaymentFailureEmail(subscription.notes.userId, subscription);

  } catch (error) {
    console.error("Error handling subscription payment failed event:", error);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription: any) {
  try {
    await updateSubscriptionInDatabase({
      subscriptionId: subscription.id,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    });

    // Notify the user or update user permissions
    // await updateUserPermissions(subscription.notes.userId, false);

  } catch (error) {
    console.error("Error handling subscription cancelled event:", error);
  }
}

// Handle subscription completion
async function handleSubscriptionCompleted(subscription: any) {
  try {
    await updateSubscriptionInDatabase({
      subscriptionId: subscription.id,
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    // Notify the user that their subscription has completed
    // await sendSubscriptionCompletedEmail(subscription.notes.userId, subscription);

  } catch (error) {
    console.error("Error handling subscription completed event:", error);
  }
}

## 2. Create a Database Utility Function libs\database.ts
Create a utility function to update your database with subscription information:

// This is a placeholder implementation. Replace with your actual database logic.
export async function updateSubscriptionInDatabase(data: any) {
  console.log("Updating subscription in database:", data);
  
  // Example implementation with a hypothetical database client
  // const db = await getDbClient();
  
  // Update subscription record
  // await db.subscriptions.updateOne(
  //   { subscriptionId: data.subscriptionId },
  //   { $set: data },
  //   { upsert: true }
  // );
  
  // If this is a successful payment, add to payment history
  // if (data.paymentId && data.status === 'active') {
  //   await db.payments.insertOne({
  //     subscriptionId: data.subscriptionId,
  //     paymentId: data.paymentId,
  //     amount: data.amount,
  //     paidAt: data.paidAt,
  //     status: 'successful'
  //   });
  // }
  
  // Return true to indicate success
  return true;
}


## 3. Configure Webhooks in Razorpay Dashboard
1. Log in to your Razorpay Dashboard
2. Go to Settings > Webhooks
3. Click "Add New Webhook"
4. Enter your webhook URL (e.g., https://yourdomain.com/api/webhooks/razorpay )
5. Generate a webhook secret and save it in your environment variables as RAZORPAY_WEBHOOK_SECRET
6. Select the events you want to receive notifications for:
   - subscription.charged
   - subscription.payment.failed
   - subscription.cancelled
   - subscription.completed
   - Any other relevant events

## 4. Testing Webhooks Locally
For local development, you can use a service like ngrok to expose your local server to the internet:

ngrok http 3000

Then use the ngrok URL in your Razorpay webhook settings.

## 5. Manually Checking Payment Status api\subscirpiton\payemnt-history\[id]\route.ts
If you need to manually check a subscription's status (for example, in an admin dashboard), you can create an API endpoint:
``
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

    // Fetch subscription details
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    
    // Fetch payment history for this subscription
    const payments = await razorpay.payments.all({
      subscription_id: subscriptionId
    });

    return NextResponse.json({
      success: true,
      subscription,
      payments: payments.items,
    });
  } catch (error: any) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch payment history",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
``
## 6. Add Payment History to Subscription Details Page  subscirpiton\[id]\page.tsx
Update your subscription details page to show payment history:

// Add this to your existing imports
import { useState } from 'react';

// Add this interface to your existing interfaces
interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: number;
  method: string;
}

// Add this to your component state
const [payments, setPayments] = useState<Payment[]>([]);
const [loadingPayments, setLoadingPayments] = useState(false);

// Add this function to fetch payment history
const fetchPaymentHistory = async () => {
  if (!subscription) return;
  
  setLoadingPayments(true);
  try {
    const response = await fetch(`/api/subscription/payment-history/${subscription.id}`);
    const data = await response.json();
    
    if (response.ok) {
      setPayments(data.payments);
    } else {
      console.error("Failed to fetch payment history:", data.error);
    }
  } catch (err) {
    console.error("Error fetching payment history:", err);
  } finally {
    setLoadingPayments(false);
  }
};

// Call this in useEffect after fetching subscription details
useEffect(() => {
  if (subscription) {
    fetchPaymentHistory();
  }
}, [subscription]);

// Add this section to your JSX to display payment history
// Place it after the subscription details section
{payments.length > 0 && (
  <div className="mt-8">
    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Payment History</h3>
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{payment.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  ₹{(payment.amount / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'captured' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(payment.created_at * 1000).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">
                  {payment.method}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{loadingPayments && (
  <div className="mt-8 flex justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
  </div>
)}

{!loadingPayments && payments.length === 0 && (
  <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-700 rounded-md text-center text-gray-600 dark:text-gray-300">
    No payment history available yet.
  </div>
)}

## Best Practices for Handling Recurring Payments
1. Store User Information in Razorpay Notes : When creating a subscription, include user identifiers in the notes field:

const subscription = await razorpay.subscriptions.create({
  // other fields...
  notes: {
    userId: "user_123",
    email: "user@example.com"
  }
});

1. Implement Retry Logic : If your webhook handler fails, implement a retry mechanism or store failed events for later processing.
2. Keep Local Database in Sync : Always update your local database when receiving webhook events to maintain consistency.
3. Handle Edge Cases : Implement logic for handling subscription pauses, resumptions, and plan changes.
4. Monitor Webhook Failures : Set up monitoring to alert you if webhooks are failing to process.
5. Implement Idempotency : Ensure your webhook handlers are idempotent (can be called multiple times without causing issues) as Razorpay may retry webhook deliveries.
By implementing these patterns, you'll have a robust system for tracking recurring payments in your application, even when they're processed automatically by Razorpay.


 docker build -t razorpay-and-bot .

 docker run -p 3000:3000 --env-file .env razorpay-and-bot

 npm install @googlemaps/js-api-loader

 npm install @types/google.maps --save-dev
 AIzaSyAyJRHph02Uss3sTsIy1JDJ4BDk4ea_N68sTsI

 - Maps JavaScript API
- Directions API
- Places API