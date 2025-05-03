"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface SubscriptionDetails {
    id: string;
    plan_id: string;
    plan_name?: string;
    status: string;
    current_end: number;
    current_start: number;
    charge_at: number;
    payment_method: string;
    total_count: number;
    paid_count: number;
    remaining_count: number;
    short_url: string;
    notes: Record<string, string>;
    [key: string]: any;
}

const SubscriptionDetailsPage = () => {
    const params = useParams();
    const router = useRouter();
    const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubscriptionDetails = async () => {
            try {
                const response = await fetch(`/api/subscription/${params.id}`);
                const data = await response.json();

                if (response.ok) {
                    setSubscription(data.subscription);
                } else {
                    setError(data.error || 'Failed to fetch subscription details');
                }
            } catch (err) {
                setError('Error fetching subscription details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchSubscriptionDetails();
        }
    }, [params.id]);

    const handleCancelSubscription = async () => {
        if (!subscription) return;

        if (!confirm('Are you sure you want to cancel this subscription?')) {
            return;
        }

        try {
            const response = await fetch('/api/subscription/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subscriptionId: subscription.id }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Subscription cancelled successfully');
                // Refresh the subscription details
                router.refresh();
            } else {
                alert(data.error || 'Failed to cancel subscription');
            }
        } catch (err) {
            console.error('Error cancelling subscription:', err);
            alert('Error cancelling subscription');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading subscription details...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
                <p className="mb-4">{error}</p>
                <Link href="/subscription" className="text-blue-500 hover:underline">
                    Back to Subscriptions
                </Link>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="mb-4">Subscription not found</p>
                <Link href="/subscription" className="text-blue-500 hover:underline">
                    Back to Subscriptions
                </Link>
            </div>
        );
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Subscription Details</h1>
                    <Link href="/subscription" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        Back to Subscriptions
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden mb-8">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{subscription.plan_name || 'Subscription'}</h2>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${subscription.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                {subscription.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Subscription Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Subscription ID</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{subscription.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Plan ID</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{subscription.plan_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                                        <p className="font-medium text-gray-800 dark:text-white capitalize">{subscription.payment_method}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{formatDate(subscription.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Billing Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Period</p>
                                        <p className="font-medium text-gray-800 dark:text-white">
                                            {formatDate(subscription.current_start)} - {formatDate(subscription.current_end)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Next Charge</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{formatDate(subscription.charge_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Billing Cycles</p>
                                        <p className="font-medium text-gray-800 dark:text-white">
                                            {subscription.paid_count} of {subscription.total_count} completed
                                            {subscription.remaining_count > 0 && ` (${subscription.remaining_count} remaining)`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {subscription.notes && Object.keys(subscription.notes).length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Information</h3>
                                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-md">
                                    {Object.entries(subscription.notes).map(([key, value]) => (
                                        <div key={key} className="flex">
                                            <span className="font-medium text-gray-600 dark:text-gray-300 mr-2">{key}:</span>
                                            <span className="text-gray-800 dark:text-white">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleCancelSubscription}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionDetailsPage;