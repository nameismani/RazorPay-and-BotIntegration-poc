import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// import nodemailer from "nodemailer";
// captaring details through webhook
// {
//   entity: 'event',
//   account_id: 'acc_QE9X6LEaAW5GXC',
//   event: 'payment.authorized',
//   contains: [ 'payment' ],
//   payload: { payment: { entity: [Object] } },
//   created_at: 1743596690
// } asdfdsf webhook
//  POST /api/webhook/razorpay 200 in 748ms
// {
//   entity: 'event',
//   account_id: 'acc_QE9X6LEaAW5GXC',
//   event: 'payment.captured',
//   contains: [ 'payment' ],
//   payload: { payment: { entity: [Object] } },
//   created_at: 1743596691
// } asdfdsf webhook

// respjnse of payload eneityty object
// {
//   id: 'pay_QEBlQuyBFNc2pz',
//   entity: 'payment',
//   amount: 6000,
//   currency: 'INR',
//   status: 'captured',
//   order_id: 'order_QEBlMvuibTjAKF',
//   invoice_id: null,
//   international: false,
//   method: 'netbanking',
//   amount_refunded: 0,
//   refund_status: null,
//   captured: true,
//   description: null,
//   card_id: null,
//   bank: 'CNRB',
//   wallet: null,
//   vpa: null,
//   email: 'void@razorpay.com',
//   contact: '+919566195492',
//   notes: { productId: '1743596839929' },
//   fee: 142,
//   tax: 22,
//   error_code: null,
//   error_description: null,
//   error_source: null,
//   error_step: null,
//   error_reason: null,
//   acquirer_data: { bank_transaction_id: '4593706' },
//   created_at: 1743596844,
//   reward: null,
//   base_amount: 6000
// } asdfdsf webhook
// Response for failed payment
// {
//   amount: 4000,
//   amount_due: 4000,
//   amount_paid: 0,
//   attempts: 0,
//   created_at: 1743596945,
//   currency: 'INR',
//   entity: 'order',
//   id: 'order_QEBnE3IyjgviXf',
//   notes: { productId: '1743596945433' },
//   offer_id: null,
//   receipt: 'receipt_1743596945433',
//   status: 'created'
// } rzp_test_CgomCwv3NgvMfi CobK90FEHfxriPQBao19qtuE asdfdsf
//  POST /api/intitatePayment 200 in 285ms
// {
//   entity: 'event',
//   account_id: 'acc_QE9X6LEaAW5GXC',
//   event: 'payment.failed',
//   contains: [ 'payment' ],
//   payload: { payment: { entity: [Object] } },
//   created_at: 1743596952
// } {
//   id: 'pay_QEBnHlwgf7oljf',
//   entity: 'payment',
//   amount: 4000,
//   currency: 'INR',
//   status: 'failed',
//   order_id: 'order_QEBnE3IyjgviXf',
//   invoice_id: null,
//   international: false,
//   method: 'netbanking',
//   amount_refunded: 0,
//   refund_status: null,
//   captured: false,
//   description: null,
//   card_id: null,
//   bank: 'CNRB',
//   wallet: null,
//   vpa: null,
//   email: 'void@razorpay.com',
//   contact: '+919566195492',
//   notes: { productId: '1743596945433' },
//   fee: null,
//   tax: null,
//   error_code: 'BAD_REQUEST_ERROR',
//   error_description: "Your payment didn't go through as it was declined by the bank. Try another payment method or contact your bank.",
//   error_source: 'bank',
//   error_step: 'payment_authorization',
//   error_reason: 'payment_failed',
//   acquirer_data: { bank_transaction_id: null },
//   created_at: 1743596949
// } asdfdsf webhook

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log(event, event.payload.payment.entity, "asdfdsf webhook");
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      //       if (order) {
      //         // Send email only after payment is confirmed
      //         const transporter = nodemailer.createTransport({
      //           host: "sandbox.smtp.mailtrap.io",
      //           port: 2525,
      //           auth: {
      //             user: process.env.MAILTRAP_USER,
      //             pass: process.env.MAILTRAP_PASS,
      //           },
      //         });

      //         await transporter.sendMail({
      //           from: '"ImageKit Shop" <noreply@imagekitshop.com>',
      //           to: order.userId.email,
      //           subject: "Payment Confirmation - ImageKit Shop",
      //           text: `
      // Thank you for your purchase!

      // Order Details:
      // - Order ID: ${order._id.toString().slice(-6)}
      // - Product: ${order.productId.name}
      // - Version: ${order.variant.type}
      // - License: ${order.variant.license}
      // - Price: $${order.amount.toFixed(2)}

      // Your image is now available in your orders page.
      // Thank you for shopping with ImageKit Shop!
      //           `.trim(),
      //         });
      //       }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
