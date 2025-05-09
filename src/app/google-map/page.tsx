"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { FaRulerHorizontal } from 'react-icons/fa';
import { TfiLocationPin } from "react-icons/tfi";

// Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

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
    const vehicleMarkerRef = useRef<any>(null);
    const distanceInfoWindowRef = useRef<any>(null);
    const startMarkerRef = useRef<any>(null);
    const endMarkerRef = useRef<any>(null);
    const startDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const endDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
                        suppressMarkers: true, // We'll add custom markers
                        polylineOptions: {
                            strokeColor: '#FF6B00', // Orange route line
                            strokeWeight: 5,
                            strokeOpacity: 0.8
                        }
                    });

                    // Initialize autocomplete for input fields
                    initializeAutocomplete();
                }
            } catch (err) {
                console.error('Error initializing Google Maps:', err);
                setError('Failed to load Google Maps. Please check your API key.');
            }
        };

        if (!mapInstanceRef.current) {
            initMap();
        }
    }, []);

    // Initialize autocomplete with debounce
    const initializeAutocomplete = () => {
        const startInput = document.getElementById('start-address') as HTMLInputElement;
        const endInput = document.getElementById('end-address') as HTMLInputElement;

        if (startInput && endInput && window.google) {
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

            // Disable the default autocomplete behavior
            startInput.setAttribute('autocomplete', 'new-password');
            endInput.setAttribute('autocomplete', 'new-password');
        }
    };

    const calculateRoute = async () => {
        if (!startAddress || !endAddress) {
            setError('Please enter both start and end addresses');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Clear previous markers and infowindows
            if (vehicleMarkerRef.current) {
                vehicleMarkerRef.current.setMap(null);
                vehicleMarkerRef.current = null;
            }

            if (distanceInfoWindowRef.current) {
                distanceInfoWindowRef.current.close();
                distanceInfoWindowRef.current = null;
            }

            if (startMarkerRef.current) {
                startMarkerRef.current.setMap(null);
                startMarkerRef.current = null;
            }

            if (endMarkerRef.current) {
                endMarkerRef.current.setMap(null);
                endMarkerRef.current = null;
            }

            const directionsService = new window.google.maps.DirectionsService();

            const result = await directionsService.route({
                origin: startAddress,
                destination: endAddress,
                travelMode: window.google.maps.TravelMode.DRIVING,
            });

            if (directionsRendererRef.current && mapInstanceRef.current) {
                directionsRendererRef.current.setDirections(result);

                // Extract distance and duration
                if (result.routes[0]?.legs[0]) {
                    const leg = result.routes[0].legs[0];
                    const distanceText = leg.distance?.text || null;
                    setDistance(distanceText);
                    setDuration(leg.duration?.text || null);

                    // Create start marker (orange circle)
                    startMarkerRef.current = new window.google.maps.Marker({
                        position: leg.start_location,
                        map: mapInstanceRef.current,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: "#FF6B00",
                            fillOpacity: 1,
                            strokeWeight: 1,
                            strokeColor: "#FFFFFF",
                            scale: 10
                        },
                        zIndex: 10
                    });

                    // Create end marker (orange circle)
                    endMarkerRef.current = new window.google.maps.Marker({
                        position: leg.end_location,
                        map: mapInstanceRef.current,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: "#FF6B00",
                            fillOpacity: 1,
                            strokeWeight: 1,
                            strokeColor: "#FFFFFF",
                            scale: 10
                        },
                        zIndex: 10
                    });

                    // Get the middle point of the route
                    const path = result.routes[0].overview_path;
                    if (path && path.length > 0) {
                        const middleIndex = Math.floor(path.length / 2);
                        const middlePoint = path[middleIndex];

                        // Create school bus marker at the middle of the route
                        vehicleMarkerRef.current = new window.google.maps.Marker({
                            position: middlePoint,
                            map: mapInstanceRef.current,
                            icon: {
                                url: 'https://maps.google.com/mapfiles/ms/icons/bus.png',
                                scaledSize: new window.google.maps.Size(40, 40),
                            },
                            zIndex: 5
                        });

                        // Create standalone distance info window with React Icon HTML
                        const distanceInfoContent = `
                            <div style="display: flex; align-items: center; padding: 8px; background-color: white; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                                <div style="background-color: #6b21a8; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                                    <svg stroke="white" fill="white" stroke-width="0" viewBox="0 0 640 512" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 160v192c0 8.84 7.16 16 16 16h80V144H16c-8.84 0-16 7.16-16 16zm608-16h-80v224h80c8.84 0 16-7.16 16-16V160c0-8.84-7.16-16-16-16zM192 320h256v-96H192v96zm160-248c0-13.25-10.75-24-24-24s-24 10.75-24 24 10.75 24 24 24 24-10.75 24-24zM128 256h32v-80c0-8.84 7.16-16 16-16h48v-41.87c-17.84-8.16-30.52-25.85-30.52-46.13 0-28.28 22.94-51.22 51.22-51.22S296.7 43.72 296.7 72c0 20.29-12.68 37.97-30.52 46.13V160h48c8.84 0 16 7.16 16 16v80h32c8.84 0 16 7.16 16 16v16c0 35.76-23.62 65.69-56 75.93v118.07c0 13.25-10.75 24-24 24h-80c-13.25 0-24-10.75-24-24V363.93c-32.38-10.24-56-40.17-56-75.93v-16c0-8.84 7.16-16 16-16z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <div style="font-weight: bold; font-size: 14px;">Distance: ${distanceText}</div>
                                </div>
                            </div>
                        `;

                        distanceInfoWindowRef.current = new window.google.maps.InfoWindow({
                            content: distanceInfoContent,
                            disableAutoPan: true,
                            pixelOffset: new window.google.maps.Size(0, -5)
                        });

                        // Position the info window directly above the vehicle marker
                        distanceInfoWindowRef.current.setPosition(middlePoint);
                        distanceInfoWindowRef.current.open(mapInstanceRef.current);
                    }
                }
            }
        } catch (err: any) {
            console.error('Error calculating route:', err);
            setError(err.message || 'Failed to calculate route');
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced input handlers
    const handleStartAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStartAddress(value);

        // Clear any existing timer
        if (startDebounceTimerRef.current) {
            clearTimeout(startDebounceTimerRef.current);
        }

        // Set a new timer to update the autocomplete after 300ms of inactivity
        startDebounceTimerRef.current = setTimeout(() => {
            if (startAutocompleteRef.current) {
                // This triggers the autocomplete to update its predictions
                const event = new Event('input', { bubbles: true });
                document.getElementById('start-address')?.dispatchEvent(event);
            }
        }, 300);
    };

    const handleEndAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEndAddress(value);

        // Clear any existing timer
        if (endDebounceTimerRef.current) {
            clearTimeout(endDebounceTimerRef.current);
        }

        // Set a new timer to update the autocomplete after 300ms of inactivity
        endDebounceTimerRef.current = setTimeout(() => {
            if (endAutocompleteRef.current) {
                // This triggers the autocomplete to update its predictions
                const event = new Event('input', { bubbles: true });
                document.getElementById('end-address')?.dispatchEvent(event);
            }
        }, 300);
    };

    // Clean up timers on component unmount
    useEffect(() => {
        return () => {
            if (startDebounceTimerRef.current) {
                clearTimeout(startDebounceTimerRef.current);
            }
            if (endDebounceTimerRef.current) {
                clearTimeout(endDebounceTimerRef.current);
            }
        };
    }, []);

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
                                        <FaRulerHorizontal className="h-5 w-5 text-white" />
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