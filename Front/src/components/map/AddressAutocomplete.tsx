import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, Navigation, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CACHE_KEY = 'address_search_cache';
const HISTORY_KEY = 'address_search_history';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

export default function AddressAutocomplete({ 
  id, 
  value, 
  onChange, 
  onSelect, 
  placeholder,
  referencePoint
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      if (value.length === 0 && recentSearches.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      searchAddress(value);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      if (history) {
        const parsed = JSON.parse(history);
        setRecentSearches(parsed.slice(0, 5));
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const saveToHistory = (suggestion) => {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      let searches = history ? JSON.parse(history) : [];
      
      searches = searches.filter(s => s.display_name !== suggestion.display_name);
      searches.unshift({
        ...suggestion,
        searchedAt: Date.now()
      });
      
      searches = searches.slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(searches));
      setRecentSearches(searches.slice(0, 5));
    } catch (error) {
      console.error("Erro ao salvar histórico:", error);
    }
  };

  const getCachedResults = (query) => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return null;
      
      const parsed = JSON.parse(cache);
      const cached = parsed[query.toLowerCase()];
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  const setCachedResults = (query, data) => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      const parsed = cache ? JSON.parse(cache) : {};
      
      parsed[query.toLowerCase()] = {
        data: data,
        timestamp: Date.now()
      };
      
      const keys = Object.keys(parsed);
      if (keys.length > 50) {
        const oldest = keys.reduce((a, b) => 
          parsed[a].timestamp < parsed[b].timestamp ? a : b
        );
        delete parsed[oldest];
      }
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const estimateBikeTime = (distanceKm) => {
    const avgSpeedKmh = 15;
    const timeHours = distanceKm / avgSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    
    if (timeMinutes < 60) {
      return `~${timeMinutes} min`;
    } else {
      const hours = Math.floor(timeMinutes / 60);
      const mins = timeMinutes % 60;
      return `~${hours}h ${mins}min`;
    }
  };

  const validateCEP = (text) => {
    const cepRegex = /\b\d{5}-?\d{3}\b/;
    return cepRegex.test(text);
  };

  const searchAddress = async (query) => {
    setIsLoading(true);
    
    const cached = getCachedResults(query);
    if (cached) {
      setSuggestions(cached);
      setShowSuggestions(true);
      setIsLoading(false);
      return;
    }
    
    try {
      const isCEP = validateCEP(query);
      const searchQuery = isCEP ? query.replace('-', '') : query;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(searchQuery)}` +
        `&countrycodes=br` +
        `&limit=10` +
        `&addressdetails=1` +
        `&accept-language=pt-BR` +
        (isCEP ? '&postalcode=' + searchQuery : '')
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const enrichedSuggestions = data.map(item => {
          const suggestion = {
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            address: item.address || {},
            type: item.type,
            importance: item.importance
          };

          if (referencePoint) {
            const distance = calculateDistance(
              referencePoint.lat,
              referencePoint.lon,
              suggestion.lat,
              suggestion.lon
            );
            suggestion.distance = distance;
            suggestion.bikeTime = estimateBikeTime(distance);
          }

          return suggestion;
        });

        if (referencePoint) {
          enrichedSuggestions.sort((a, b) => a.distance - b.distance);
        } else {
          enrichedSuggestions.sort((a, b) => b.importance - a.importance);
        }

        setCachedResults(query, enrichedSuggestions);
        setSuggestions(enrichedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error searching address:", error);
      setSuggestions([]);
    }

    setIsLoading(false);
  };

  const handleSelect = (suggestion) => {
    onChange(suggestion.display_name);
    onSelect(suggestion);
    saveToHistory(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const formatMainAddress = (suggestion) => {
    const addr = suggestion.address;
    const parts = [];
    
    if (addr.road) parts.push(addr.road);
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.suburb) parts.push(addr.suburb);
    if (addr.city || addr.town || addr.village) {
      parts.push(addr.city || addr.town || addr.village);
    }
    
    return parts.slice(0, 2).join(", ") || suggestion.display_name.split(",")[0];
  };

  const formatSecondaryAddress = (suggestion) => {
    const addr = suggestion.address;
    const parts = [];
    
    if (addr.suburb && !formatMainAddress(suggestion).includes(addr.suburb)) {
      parts.push(addr.suburb);
    }
    if (addr.city || addr.town) {
      parts.push(addr.city || addr.town);
    }
    if (addr.state) {
      parts.push(addr.state);
    }
    
    return parts.join(", ");
  };

  const displayResults = value.length === 0 ? recentSearches : suggestions;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.length === 0 && recentSearches.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pr-10"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && displayResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-emerald-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
          {value.length === 0 && recentSearches.length > 0 && (
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                <Clock className="w-3 h-3" />
                Buscas Recentes
              </div>
            </div>
          )}
          
          {displayResults.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="p-4 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  value.length === 0 ? 'bg-blue-100' : 'bg-emerald-100'
                }`}>
                  {value.length === 0 ? (
                    <Clock className="w-4 h-4 text-blue-600" />
                  ) : (
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 mb-1 text-sm">
                    {formatMainAddress(suggestion)}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {formatSecondaryAddress(suggestion)}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {suggestion.distance !== undefined && (
                      <>
                        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                          <Navigation className="w-3 h-3 mr-1" />
                          {suggestion.distance.toFixed(1)} km
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700">
                          🚴 {suggestion.bikeTime}
                        </Badge>
                      </>
                    )}
                    {suggestion.type && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && displayResults.length === 0 && !isLoading && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4">
          <p className="text-sm text-gray-500 text-center">
            {validateCEP(value) 
              ? "CEP não encontrado. Verifique o código."
              : "Nenhum resultado encontrado. Tente outro endereço ou CEP."}
          </p>
        </div>
      )}
    </div>
  );
}
