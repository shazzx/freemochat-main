import { useEffect, useState, createContext } from "react";

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null
});


export const GoogleMapsProvider: React.FC<{ children: React.ReactNode; apiKey: string }> = ({ children, apiKey }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      // Script is already loading, wait for it
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      setLoadError(null);
    };

    script.onerror = () => {
      setLoadError('Failed to load Google Maps');
      setIsLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};