"use client";

import { useState } from "react";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ amount, description, currency: "INR" });
    try {
      const data: any = await fetch("/api/intitatePayment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      }).then((res) => res.json());
      console.log(
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        data,
        "asdfdsf key id"
      );
      const paymentData = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: data?.orderId,
        name: "Test payment",
        // amount: amount,
        // currency: "INR",
        description: description,
        image:
          "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",

        handler: async function (response: any) {
          // console.log(response, "asdfdsf");
          const res = await fetch("/api/verifyPayment", {
            method: "POST",
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const data = await res.json();
          console.log(data);
          if (data.isOk) {
            alert("Payment successful");
            setSubmitted(true);
          } else {
            alert("Payment failed");
          }
        },
        // theme: {
        //   color: "#3399cc",
        // },
      };
      console.log(paymentData, "asdfdsf payment data");
      const payment = new (window as any).Razorpay(paymentData);
      payment.open();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        {!submitted ? (
          <>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              Amount Details
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Amount (INR)
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    step="0.01"
                    min="0"
                    required
                    className="block w-full pl-8 pr-12 py-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 p-1"
                  placeholder="What is this payment for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transform transition hover:scale-105"
              >
                Submit Payment
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600 dark:text-green-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Payment Submitted!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Amount: ₹{Number(amount).toLocaleString("en-IN")}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Another Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
