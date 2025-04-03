import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Console } from "console";

const generatedSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string
) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET as string;

  const sig = crypto
    .createHmac("sha256", keySecret)
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest("hex");
  return sig;
};

export async function POST(request: NextRequest) {
  const { orderId, razorpayPaymentId, razorpaySignature } =
    await request.json();
  console.log(orderId, razorpayPaymentId, razorpaySignature, "asdfdsf");
  const signature = generatedSignature(orderId, razorpayPaymentId);
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${razorpayPaymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
    }
  );
  const data = await response.json();
  if (signature !== razorpaySignature) {
    return NextResponse.json(
      { message: "payment verification failed", isOk: false, data },
      { status: 400 }
    );
  }

  console.log(data, "payment verification details");
  // Probably some database calls here to update order or add premium status to user
  return NextResponse.json(
    { message: "payment verified successfully", isOk: true, data },
    { status: 200 }
  );
}
