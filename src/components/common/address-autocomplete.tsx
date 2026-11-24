"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, LocateFixed, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export interface LocationSelectData {
  address: string;
  latitude: number;
  longitude: number;
  province?: string;
}

interface AddressAutocompleteProps {
  value: string;
  latitude?: number;
  longitude?: number;
  province?: string;
  onChange: (value: string) => void;
  onSelectLocation?: (location: LocationSelectData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

interface PhotonFeature {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

function formatPhotonAddress(props: PhotonFeature["properties"]): string {
  const parts: string[] = [];
  if (props.name) parts.push(props.name);

  if (props.housenumber && props.street) {
    const streetAddress = `${props.housenumber} ${props.street}`;
    if (!props.name || !props.name.includes(props.street)) {
      parts.push(streetAddress);
    }
  } else if (props.street) {
    if (!props.name || !props.name.includes(props.street)) {
      parts.push(props.street);
    }
  }

  if (props.district && !parts.includes(props.district)) {
    parts.push(props.district);
  }

  const city = props.city || props.state;
  if (city && !parts.includes(city)) {
    parts.push(city);
  }

  if (props.country && !parts.includes(props.country)) {
    parts.push(props.country);
  }

  return parts.filter(Boolean).join(", ");
}

export function AddressAutocomplete({
  value,
  latitude,
  longitude,
  province,
  onChange,
  onSelectLocation,
  placeholder = "Nhập địa chỉ cửa hàng (số nhà, đường, phường/xã)...",
  className = "",
  disabled = false,
  required = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = async (query: string) => {
    const q = query.trim();
    if (!q || q.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Free OpenStreetMap Photon API (Vietnam bbox approx: 102.14,8.18,109.46,23.39)
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&bbox=102.14,8.18,109.46,23.39`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        const features: PhotonFeature[] = data.features || [];
        setSuggestions(features);
        setIsOpen(features.length > 0);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    onChange(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchAddress(text);
    }, 500);
  };

  const handleSelectSuggestion = (item: PhotonFeature) => {
    const formatted = formatPhotonAddress(item.properties);
    const [lon, lat] = item.geometry.coordinates;
    const detectedProvince = item.properties.city || item.properties.state || "";

    setInputValue(formatted);
    onChange(formatted);
    setIsOpen(false);
    setSuggestions([]);

    if (onSelectLocation) {
      onSelectLocation({
        address: formatted,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lon.toFixed(6)),
        province: detectedProvince,
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));

        try {
          const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
          let addressFound = "";
          let detectedProvince = "";

          if (res.ok) {
            const data = await res.json();
            const firstFeature: PhotonFeature | undefined = data.features?.[0];
            if (firstFeature) {
              addressFound = formatPhotonAddress(firstFeature.properties);
              detectedProvince = firstFeature.properties.city || firstFeature.properties.state || "";
            }
          }

          const finalAddress = addressFound || inputValue || `Tọa độ: ${lat}, ${lon}`;
          setInputValue(finalAddress);
          onChange(finalAddress);

          if (onSelectLocation) {
            onSelectLocation({
              address: finalAddress,
              latitude: lat,
              longitude: lon,
              province: detectedProvince,
            });
          }

          toast.success("Đã lấy vị trí hiện tại thành công!");
        } catch {
          if (onSelectLocation) {
            onSelectLocation({
              address: inputValue,
              latitude: lat,
              longitude: lon,
            });
          }
          toast.success("Đã ghi nhận tọa độ GPS!");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Vui lòng cấp quyền truy cập vị trí trên trình duyệt để tự động lấy tọa độ.");
        } else {
          toast.error("Không thể xác định vị trí hiện tại. Vui lòng nhập địa chỉ cụ thể.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="w-full pl-9 pr-32 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={() => {
                setInputValue("");
                onChange("");
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Xóa địa chỉ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={disabled || isLocating}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 rounded-md border border-blue-200 dark:border-blue-800 transition-colors whitespace-nowrap"
            title="Lấy vị trí GPS hiện tại của bạn"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lấy...</span>
              </>
            ) : (
              <>
                <LocateFixed className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Vị trí hiện tại</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dropdown gợi ý địa chỉ */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-4 text-xs text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
              Đang tìm kiếm địa chỉ...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-3 px-4 text-xs text-gray-500 text-center">
              Không tìm thấy gợi ý địa chỉ phù hợp
            </div>
          ) : (
            suggestions.map((item, index) => {
              const fullAddress = formatPhotonAddress(item.properties);
              const districtOrCity = [
                item.properties.district,
                item.properties.city || item.properties.state,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <button
                  key={`${item.geometry.coordinates.join(",")}-${index}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.properties.name || item.properties.street || fullAddress}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {districtOrCity || fullAddress}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
