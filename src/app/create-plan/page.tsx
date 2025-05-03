"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const CreatePlanPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        interval: 'month',
        intervalCount: '1'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/subscription/create-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    amount: parseFloat(formData.amount),
                    interval: formData.interval,
                    intervalCount: parseInt(formData.intervalCount)
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to create plan');
            }

            setSuccess(`Plan "${data.plan.item.name}" created successfully with ID: ${data.plan.id}`);

            // Reset form after successful creation
            setFormData({
                name: '',
                description: '',
                amount: '',
                interval: 'month',
                intervalCount: '1'
            });

            // Optionally redirect to plans page after a delay
            // setTimeout(() => router.push('/subscription'), 2000);
        } catch (err: any) {
            setError(err.message || 'An error occurred while creating the plan');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Create Subscription Plan</h1>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Plan Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g. Basic Monthly Plan"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Describe the features of this plan"
                        />
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount (INR) *
                        </label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                required
                                min="1"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                className="block w-full pl-8 pr-12 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                                placeholder="99.00"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Enter the amount in INR (will be converted to paise)
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="interval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Billing Interval *
                            </label>
                            <select
                                id="interval"
                                name="interval"
                                required
                                value={formData.interval}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="day">Daily</option>
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                                <option value="year">Yearly</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="intervalCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Interval Count *
                            </label>
                            <input
                                type="number"
                                id="intervalCount"
                                name="intervalCount"
                                required
                                min="1"
                                max="365"
                                value={formData.intervalCount}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                                placeholder="1"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                How many intervals between billings (e.g., 3 for quarterly if interval is month)
                            </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? 'Creating Plan...' : 'Create Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePlanPage;