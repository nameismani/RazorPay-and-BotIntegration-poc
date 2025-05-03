"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
    id: string;
    interval: string,
    item: {
        id: string;
        name: string;
        amount: number;
        description?: string;
    }
}

interface Subscription {
    id: string;
    plan_id: string;
    plan_name?: string;
    status: string;
    current_end: number;
    short_url?: string;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
}

const SubscriptionPage = () => {
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([]);

    // Fetch available plans on component mount
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch('/api/subscription/plans');
                const data = await response.json();

                if (response.ok) {
                    setPlans(data.plans);
                } else {
                    setError(data.error || 'Failed to fetch plans');
                }
            } catch (err) {
                setError('Error fetching plans');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const fetchActiveSubscriptions = async () => {
            try {
                const response = await fetch('/api/subscription/active');
                const data = await response.json();

                if (response.ok) {
                    setActiveSubscriptions(data.subscriptions);
                }
            } catch (err) {
                console.error('Error fetching active subscriptions:', err);
            }
        };

        fetchPlans();
        fetchActiveSubscriptions();
    }, []);

    // Function to check if user is already subscribed to a plan
    const isAlreadySubscribed = (planId: string) => {
        return activeSubscriptions.some(
            subscription => subscription.plan_id === planId &&
                (subscription.status === 'active' || subscription.status === 'authenticated')
        );
    };

    const handleSubscribe = async (planId: string) => {
        try {
            const response = await fetch('/api/subscription/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planId }),
            });

            const data = await response.json();

            if (response.ok) {
                // Initialize Razorpay checkout
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    subscription_id: data.subscriptionId,
                    name: "Your Company Name",
                    description: "Subscription Payment",
                    image: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
                    handler: async function (response: RazorpayResponse) {
                        // Verify the payment
                        const verifyResponse = await fetch('/api/subscription/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySubscriptionId: response.razorpay_subscription_id,
                                razorpaySignature: response.razorpay_signature,
                            }),
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.isOk) {
                            alert('Subscription successful!');
                            // Refresh active subscriptions
                            const subsResponse = await fetch('/api/subscription/active');
                            const subsData = await subsResponse.json();
                            if (subsResponse.ok) {
                                setActiveSubscriptions(subsData.subscriptions);
                            }
                        } else {
                            alert('Subscription verification failed');
                        }
                    },
                    prefill: {
                        name: "Customer Name",
                        email: "mm2529025@gmail.com",
                        contact: "+919999999999"
                    },
                    // theme: {
                    //     color: "#F37254"
                    // }
                };

                const razorpay = (window as any).Razorpay;
                const paymentObject = new razorpay(options);
                paymentObject.open();
                paymentObject.on("payment.failed", async function (response: any) {
                    alert("payment failed")
                });
            } else {
                alert(data.error || 'Failed to create subscription');
            }
        } catch (err) {
            console.error('Error creating subscription:', err);
            alert('Error creating subscription');
        }
    };

    const handleCancelSubscription = async (subscriptionId: string, e: React.MouseEvent) => {
        // Prevent row click event from triggering
        e.stopPropagation();

        if (!confirm('Are you sure you want to cancel this subscription?')) {
            return;
        }

        try {
            const response = await fetch('/api/subscription/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subscriptionId }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Subscription cancelled successfully');
                // Update the active subscriptions list
                setActiveSubscriptions(activeSubscriptions.filter(
                    sub => sub.id !== subscriptionId
                ));
            } else {
                alert(data.error || 'Failed to cancel subscription');
            }
        } catch (err) {
            console.error('Error cancelling subscription:', err);
            alert('Error cancelling subscription');
        }
    };

    const navigateToSubscriptionDetails = (subscriptionId: string) => {
        router.push(`/subscription/${subscriptionId}`);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading plans...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-center my-8 text-gray-800 dark:text-white">Subscription Plans</h1>

                {/* Available Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {plans.map((plan) => {
                        const subscribed = isAlreadySubscribed(plan.id);

                        return (
                            <div key={plan.item.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{plan.item.name}</h2>
                                    <div className="flex items-baseline mb-4">
                                        <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{Number(plan.item.amount) / 100}</span>
                                        <span className="ml-1 text-gray-500 dark:text-gray-400">/{plan.interval}</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 mb-6">{plan.item.description || 'No description available'}</p>

                                    {subscribed ? (
                                        <div className="w-full">
                                            <button
                                                disabled
                                                className="w-full py-2 px-4 bg-gray-400 text-white font-medium rounded-md shadow-sm cursor-not-allowed"
                                            >
                                                Already Subscribed
                                            </button>
                                            <p className="text-xs text-center mt-2 text-green-600 dark:text-green-400">
                                                You have an active subscription
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe(plan.id)}
                                            className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                        >
                                            Subscribe Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Active Subscriptions */}
                {activeSubscriptions.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">Your Active Subscriptions</h2>
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Next Billing</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {activeSubscriptions.map((subscription) => (
                                            <tr
                                                key={subscription.id}
                                                onClick={() => navigateToSubscriptionDetails(subscription.id)}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{subscription.plan_name || 'Unknown Plan'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${subscription.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        }`}>
                                                        {subscription.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {new Date(subscription.current_end * 1000).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={(e) => handleCancelSubscription(subscription.id, e)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionPage;