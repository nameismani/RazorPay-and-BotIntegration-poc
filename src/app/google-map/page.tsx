"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

// Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Define types for Google Maps
declare global {
    interface Window {
        google: any;
    }
}

const GoogleMapPage = () => {
    const [startAddress, setStartAddress] = useState('');
    const [endAddress, setEndAddress] = useState('');
    const [distance, setDistance] = useState<string | null>(null);
    const [duration, setDuration] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const startAutocompleteRef = useRef<any>(null);
    const endAutocompleteRef = useRef<any>(null);

    // Initialize Google Maps
    useEffect(() => {
        const initMap = async () => {
            try {
                const loader = new Loader({
                    apiKey: GOOGLE_MAPS_API_KEY,
                    version: "weekly",
                    libraries: ["places"]
                });

                await loader.load();

                if (mapRef.current && !mapInstanceRef.current) {
                    // Create map instance
                    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                        center: { lat: 13.0827, lng: 80.2707 }, // Chennai coordinates as default
                        zoom: 12,
                        mapTypeControl: true,
                        streetViewControl: false,
                        fullscreenControl: true,
                    });

                    // Create directions renderer
                    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
                        map: mapInstanceRef.current,
                        suppressMarkers: false,
                        polylineOptions: {
                            strokeColor: '#FF6B00', // Orange route line
                            strokeWeight: 5,
                            strokeOpacity: 0.8
                        }
                    });

                    // Initialize autocomplete for input fields
                    const startInput = document.getElementById('start-address') as HTMLInputElement;
                    const endInput = document.getElementById('end-address') as HTMLInputElement;

                    if (startInput && endInput) {
                        // Create autocomplete instances
                        startAutocompleteRef.current = new window.google.maps.places.Autocomplete(startInput, {
                            fields: ['formatted_address', 'geometry', 'name'],
                            types: ['geocode', 'establishment']
                        });

                        endAutocompleteRef.current = new window.google.maps.places.Autocomplete(endInput, {
                            fields: ['formatted_address', 'geometry', 'name'],
                            types: ['geocode', 'establishment']
                        });

                        // Add place_changed event listeners
                        startAutocompleteRef.current.addListener('place_changed', () => {
                            const place = startAutocompleteRef.current.getPlace();
                            if (place && place.formatted_address) {
                                setStartAddress(place.formatted_address);
                            }
                        });

                        endAutocompleteRef.current.addListener('place_changed', () => {
                            const place = endAutocompleteRef.current.getPlace();
                            if (place && place.formatted_address) {
                                setEndAddress(place.formatted_address);
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Error initializing Google Maps:', err);
                setError('Failed to load Google Maps. Please check your API key.');
            }
        };

        initMap();
    }, []);

    const calculateRoute = async () => {
        if (!startAddress || !endAddress) {
            setError('Please enter both start and end addresses');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const directionsService = new window.google.maps.DirectionsService();

            const result = await directionsService.route({
                origin: startAddress,
                destination: endAddress,
                travelMode: window.google.maps.TravelMode.DRIVING,
            });

            if (directionsRendererRef.current) {
                directionsRendererRef.current.setDirections(result);

                // Extract distance and duration
                if (result.routes[0]?.legs[0]) {
                    setDistance(result.routes[0].legs[0].distance?.text || null);
                    setDuration(result.routes[0].legs[0].duration?.text || null);
                }
            }
        } catch (err: any) {
            console.error('Error calculating route:', err);
            setError(err.message || 'Failed to calculate route');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle manual input changes
    const handleStartAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartAddress(e.target.value);
    };

    const handleEndAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndAddress(e.target.value);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-center my-6 text-gray-800">Route Planner</h1>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="start-address" className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Address
                                </label>
                                <input
                                    id="start-address"
                                    type="text"
                                    value={startAddress}
                                    onChange={handleStartAddressChange}
                                    placeholder="Enter start address"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="end-address" className="block text-sm font-medium text-gray-700 mb-1">
                                    Destination Address
                                </label>
                                <input
                                    id="end-address"
                                    type="text"
                                    value={endAddress}
                                    onChange={handleEndAddressChange}
                                    placeholder="Enter destination address"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={calculateRoute}
                                disabled={isLoading}
                                className={`px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isLoading ? 'Calculating...' : 'Show Route'}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                                {error}
                            </div>
                        )}

                        {distance && (
                            <div className="mt-4 p-4 bg-purple-100 rounded-lg flex items-center justify-center">
                                <div className="flex items-center">
                                    <div className="bg-purple-800 rounded-full p-2 mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-medium">Distance: </span>
                                        <span className="text-lg font-bold">{distance}</span>
                                        {duration && (
                                            <span className="ml-4 text-gray-600">
                                                (Approx. {duration})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Container */}
                <div
                    ref={mapRef}
                    className="w-full h-[500px] rounded-xl shadow-lg overflow-hidden"
                ></div>
            </div>
        </div>
    );
};

export default GoogleMapPage;