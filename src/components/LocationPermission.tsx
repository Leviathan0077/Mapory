import React, { useState, useEffect } from "react";
import { MapPin, Navigation, AlertCircle, CheckCircle } from "lucide-react";
import type { Location } from "../types";

interface LocationPermissionProps {
  onLocationGranted: (location: Location) => void;
  onLocationDenied: () => void;
  isVisible: boolean;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onLocationGranted,
  onLocationDenied,
  isVisible,
}) => {
  const [status, setStatus] = useState<
    "idle" | "requesting" | "granted" | "denied" | "error" | "manual"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [manualLocation, setManualLocation] = useState<string>("");

  useEffect(() => {
    // Reset status when component becomes visible
    if (isVisible && status !== "idle") {
      setStatus("idle");
      setErrorMessage("");
      setCurrentLocation(null);
    }
  }, [isVisible]);

  const requestLocationPermission = async () => {
    // Prevent multiple simultaneous requests
    if (status === "requesting") {
      return;
    }

    setStatus("requesting");
    setErrorMessage("");

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported by this browser.");
      return;
    }

    // Check if we're on HTTPS
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      setStatus("error");
      setErrorMessage(
        "Location access requires HTTPS. Please use a secure connection."
      );
      return;
    }

    console.log("Requesting location permission...");
    console.log("Protocol:", location.protocol);
    console.log("Hostname:", location.hostname);

    // Check current permission state
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        console.log("Current permission state:", permission.state);
        if (permission.state === "denied") {
          setStatus("error");
          setErrorMessage(
            "Location access is blocked in your browser settings. Please enable location permissions for this site."
          );
          return;
        }
      } catch (permError) {
        console.log("Could not check permission state:", permError);
      }
    }

    // Additional check: Test if we can actually get location
    console.log("Testing geolocation availability...");
    if (!navigator.geolocation.getCurrentPosition) {
      setStatus("error");
      setErrorMessage("Geolocation API is not available on this device.");
      return;
    }

    try {
      // Try multiple geolocation strategies for better browser compatibility
      let position: GeolocationPosition;

      try {
        // First attempt: Lower accuracy, longer timeout (most compatible)
        position = await Promise.race([
          new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000,
            });
          }),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error("Location request timed out")),
              20000
            );
          }),
        ]);
      } catch (firstError) {
        console.log(
          "First geolocation attempt failed, trying alternative approach..."
        );
        // Second attempt: High accuracy with shorter timeout
        position = await Promise.race([
          new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          }),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error("Location request timed out")),
              15000
            );
          }),
        ]);
      }

      const { latitude, longitude } = position.coords;

      // Get address information using reverse geocoding
      const address = await getAddressFromCoordinates(latitude, longitude);

      const location: Location = {
        latitude,
        longitude,
        address: address.address,
        city: address.city,
        country: address.country,
      };

      setCurrentLocation(location);
      setStatus("granted");
      // Don't automatically call onLocationGranted - let user confirm
    } catch (error: any) {
      console.error("Location error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      setStatus("error");

      switch (error.code) {
        case error.PERMISSION_DENIED:
          setErrorMessage(
            "Location access was denied. This might be because:\n• Location services are disabled on your device\n• GPS/Location is turned off\n• Browser location settings are restricted\n• You previously denied permission and need to reset it\n\nTo fix this:\n1. Click the lock icon in the address bar and set Location to 'Allow'\n2. Check your device location settings\n3. Try refreshing the page\n4. Or use the manual location option below"
          );
          break;
        case error.POSITION_UNAVAILABLE:
          setErrorMessage(
            "Location information is unavailable. Please check your GPS settings and ensure location services are enabled on your device. You can also try the manual location option below."
          );
          break;
        case error.TIMEOUT:
          setErrorMessage(
            "Location request timed out. Please try again or use the manual location option below."
          );
          break;
        default:
          setErrorMessage(
            "An error occurred while getting your location. Please check your device location settings and try again, or use the manual location option below."
          );
          break;
      }
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const data = await response.json();

      return {
        address:
          data.localityInfo?.administrative?.[0]?.name ||
          data.localityInfo?.informative?.[0]?.name ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: data.city || data.locality || "Unknown City",
        country: data.countryName || "Unknown Country",
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return {
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: "Unknown City",
        country: "Unknown Country",
      };
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    requestLocationPermission();
  };

  const handleDeny = () => {
    setStatus("denied");
    onLocationDenied();
  };

  const handleManualLocation = () => {
    setStatus("manual");
  };

  const handleManualLocationSubmit = () => {
    if (manualLocation.trim()) {
      // For now, just use a default location and let user set it manually on the map
      const location: Location = {
        latitude: 0,
        longitude: 0,
        address: manualLocation,
        city: "Unknown",
        country: "Unknown",
      };
      onLocationGranted(location);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="location-permission-overlay">
      <div className="location-permission-card">
        <div className="location-permission-header">
          <div className="location-icon">
            {status === "granted" ? (
              <CheckCircle size={32} className="success-icon" />
            ) : status === "error" || status === "denied" ? (
              <AlertCircle size={32} className="error-icon" />
            ) : (
              <MapPin size={32} className="primary-icon" />
            )}
          </div>
          <h2>Location Access</h2>
        </div>

        <div className="location-permission-content">
          {status === "idle" && (
            <div className="permission-message">
              <p>
                We'd like to access your location to make it easier to add
                memories at your current position.
              </p>
              <div className="permission-benefits">
                <div className="benefit-item">
                  <Navigation size={16} />
                  <span>Automatically set your current location</span>
                </div>
                <div className="benefit-item">
                  <MapPin size={16} />
                  <span>No need to manually click on the map</span>
                </div>
              </div>
            </div>
          )}

          {status === "requesting" && (
            <div className="permission-message">
              <div className="loading-spinner"></div>
              <p>Getting your current location...</p>
            </div>
          )}

          {status === "granted" && currentLocation && (
            <div className="permission-message success">
              <p>Location found successfully!</p>
              <div className="location-details">
                <p>
                  <strong>Address:</strong> {currentLocation.address}
                </p>
                <p>
                  <strong>City:</strong> {currentLocation.city}
                </p>
                <p>
                  <strong>Country:</strong> {currentLocation.country}
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="permission-message error">
              <p>{errorMessage}</p>
              <div className="error-suggestions">
                <p>You can still add memories by:</p>
                <ul>
                  <li>Clicking on the map to set a location manually</li>
                  <li>
                    Enabling location permissions in your browser settings
                  </li>
                  <li>Checking your GPS/network connection</li>
                </ul>
              </div>
            </div>
          )}

          {status === "denied" && (
            <div className="permission-message">
              <p>
                Location access was denied. You can still add memories by
                clicking on the map to set a location manually.
              </p>
            </div>
          )}

          {status === "manual" && (
            <div className="permission-message">
              <p>Enter your location manually:</p>
              <input
                type="text"
                placeholder="e.g., New York, NY or Central Park, Manhattan"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                className="manual-location-input"
              />
            </div>
          )}
        </div>

        <div className="location-permission-actions">
          {status === "idle" && (
            <>
              <button
                onClick={requestLocationPermission}
                className="btn btn-primary"
              >
                <MapPin size={16} />
                Allow Location Access
              </button>
              <button onClick={handleDeny} className="btn btn-secondary">
                Use Map Instead
              </button>
            </>
          )}

          {status === "requesting" && (
            <button disabled className="btn btn-primary">
              <div className="loading-spinner small"></div>
              Getting Location...
            </button>
          )}

          {status === "granted" && (
            <button
              onClick={() => onLocationGranted(currentLocation!)}
              className="btn btn-primary"
            >
              <CheckCircle size={16} />
              Use This Location
            </button>
          )}

          {status === "error" && (
            <>
              <button onClick={handleRetry} className="btn btn-primary">
                <MapPin size={16} />
                Try Again
              </button>
              <button
                onClick={handleManualLocation}
                className="btn btn-secondary"
              >
                Enter Location Manually
              </button>
              <button onClick={handleDeny} className="btn btn-secondary">
                Use Map Instead
              </button>
            </>
          )}

          {status === "manual" && (
            <>
              <button
                onClick={handleManualLocationSubmit}
                className="btn btn-primary"
              >
                <MapPin size={16} />
                Use This Location
              </button>
              <button onClick={handleDeny} className="btn btn-secondary">
                Use Map Instead
              </button>
            </>
          )}

          {status === "denied" && (
            <button onClick={handleDeny} className="btn btn-primary">
              <MapPin size={16} />
              Continue with Map
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPermission;
