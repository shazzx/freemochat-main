import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, TreePine, Trash2, Droplets, CloudRain, MapPin, Briefcase, Globe, ArrowRight, Loader2 } from 'lucide-react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { axiosClient } from '@/api/axiosClient';

// Interfaces
interface MapData {
  type: 'clustered' | 'individual';
  data: any[];
}

interface GlobalMapCounts {
  totalPosts: number;
  totalElements: number;
  categories: {
    plantation: { posts: number; totalTrees: number };
    garbage_collection: { posts: number; totalBins: number };
    water_ponds: { posts: number; totalPonds: number };
    rain_water: { posts: number; totalHarvesters: number };
  };
}

interface SearchResult {
  city: string;
  country: string;
  displayName: string;
  elementCount: number;
  projectCount: number;
  center: {
    latitude: number;
    longitude: number;
  };
}

interface SelectedElement {
  _id: string;
  postId: {
    _id: string;
    postType: string;
    projectDetails?: {
      name: string;
      description: string;
      owner?: string;
    };
    user?: string;
    username?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
  };
  plantationData?: any;
  garbageCollectionData?: any;
  waterPondsData?: any;
  rainWaterData?: any;
  media?: any[];
  updateHistory?: Array<{
    updateDate: string;
    media: any[];
    notes: string;
  }>;
  createdAt?: string;
}

interface GlobalEnvironmentalMapProps {
  visible?: boolean;
  onClose?: () => void;
  googleMapsApiKey?: string;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Google Maps configuration
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};


// Helper Functions
const getCategoryConfig = (category: string) => {
  const baseConfig = {
    plantation: { icon: TreePine, color: '#4CAF50', name: 'Trees', singular: 'Tree' },
    garbage_collection: { icon: Trash2, color: '#FF9800', name: 'Bins', singular: 'Bin' },
    water_ponds: { icon: Droplets, color: '#2196F3', name: 'Ponds', singular: 'Pond' },
    rain_water: { icon: CloudRain, color: '#00BCD4', name: 'Harvesters', singular: 'Harvester' },
    all: { icon: MapPin, color: '#666', name: 'All Elements', singular: 'Element' }
  };
  return baseConfig[category] || baseConfig.all;
};

// Custom marker icons for Google Maps
const createCustomMarkerIcon = (postType: string, count?: number): string => {
  const config = getCategoryConfig(postType);
  const isCluster = count && count > 1;
  const size = isCluster ? 50 : 30;
  
  const getIconPath = (category: string): string => {
    const paths = {
      plantation: 'M12 2l3.09 6.26L22 9l-5 4.87L18.18 21 12 17.77 5.82 21 7 13.87 2 9l6.91-1.74L12 2z',
      garbage_collection: 'M3 6h18v2H3V6zm2 3v9c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9H5zm3 2h2v7H8v-7zm4 0h2v7h-2v-7z',
      water_ponds: 'M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-8 8h16v2H4v-2zm2 3h12v6H6v-6z',
      rain_water: 'M6 14c0-3.31 2.69-6 6-6s6 2.69 6 6h2c0-4.42-3.58-8-8-8s-8 3.58-8 8h2z',
      all: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
    };
    return paths[category] || paths.all;
  };

  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${config.color}" stroke="white" stroke-width="2"/>
      <svg width="${size*0.4}" height="${size*0.4}" x="${size*0.3}" y="${size*0.3}" viewBox="0 0 24 24" fill="white">
        <path d="${getIconPath(postType)}" />
      </svg>
      ${isCluster ? `
        <circle cx="${size*0.8}" cy="${size*0.2}" r="8" fill="white" stroke="${config.color}" stroke-width="1"/>
        <text x="${size*0.8}" y="${size*0.2}" text-anchor="middle" dy="0.3em" font-size="10" font-weight="bold" fill="${config.color}">${count}</text>
      ` : ''}
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgIcon)))}`;
};

// Fallback Map Component
const FallbackMap: React.FC<{
  currentRegion: MapRegion;
  mapData: MapData | null;
  onMarkerClick: (element: any, isCluster?: boolean) => void;
  selectedConfig: any;
}> = ({ currentRegion, mapData, onMarkerClick, selectedConfig }) => {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-gray-300"></div>
          ))}
        </div>
      </div>
      
      {/* Fallback markers */}
      {mapData?.data?.map((element, index) => {
        const config = getCategoryConfig(element.postType || element.postId?.postType);
        const IconComponent = config.icon;
        
        return (
          <div
            key={`fallback-marker-${index}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
            style={{
              left: `${20 + (index % 8) * 10}%`,
              top: `${20 + Math.floor(index / 8) * 15}%`
            }}
            onClick={() => onMarkerClick(element, element.count > 1)}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
              style={{ backgroundColor: config.color }}
            >
              <IconComponent className="w-4 h-4 text-white" />
            </div>
            {element.count && element.count > 1 && (
              <div className="absolute -bottom-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                {element.count}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Center indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      </div>
      
      {/* Fallback message */}
      <div className="absolute top-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">Using fallback map - Google Maps unavailable</span>
        </div>
      </div>
    </div>
  );
};

// Element Details Modal
const ElementDetailsModal: React.FC<{
  visible: boolean;
  element: SelectedElement | null;
  isLoading: boolean;
  onClose: () => void;
}> = ({ visible, element, isLoading, onClose }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Element Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : element ? (
            <div>
              <h3 className="font-medium mb-2">{element.postId?.projectDetails?.name || 'Environmental Project'}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {element.location?.address || `${element.location?.city}, ${element.location?.country}`}
              </p>
              {element.createdAt && (
                <p className="text-xs text-gray-500">Created: {new Date(element.createdAt).toLocaleDateString()}</p>
              )}
            </div>
          ) : (
            <p>No element data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
const GlobalEnvironmentalMap: React.FC<GlobalEnvironmentalMapProps> = ({ 
  visible = true, 
  onClose,
  googleMapsApiKey = 'AIzaSyDEz0n0ST4J3KYECJDx_-hTtnejV2A0-to'
}) => {
  // State - keeping your original state structure
  const [currentRegion, setCurrentRegion] = useState<MapRegion>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapZoom, setMapZoom] = useState(10);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'plantation' | 'garbage_collection' | 'water_ponds' | 'rain_water'>('plantation');
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [globalCounts, setGlobalCounts] = useState<GlobalMapCounts | null>({
    totalPosts: 0,
    totalElements: 0,
    categories: {
      plantation: { posts: 0, totalTrees: 0 },
      garbage_collection: { posts: 0, totalBins: 0 },
      water_ponds: { posts: 0, totalPonds: 0 },
      rain_water: { posts: 0, totalHarvesters: 0 }
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Modal states
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [showElementModal, setShowElementModal] = useState(false);
  const [activeMarker, setActiveMarker] = useState<any>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [isLoadingElementDetails, setIsLoadingElementDetails] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
  const dataFetchTimeoutRef = useRef<NodeJS.Timeout>(null);
  const lastFetchedBoundsRef = useRef<string>('');
  const mapRef = useRef<google.maps.Map>(null);

  // API Functions - keeping your original implementations
  const fetchGlobalCounts = useCallback(async () => {
    const defaultCounts = {
      totalPosts: 0,
      totalElements: 0,
      categories: {
        plantation: { posts: 0, totalTrees: 0 },
        garbage_collection: { posts: 0, totalBins: 0 },
        water_ponds: { posts: 0, totalPonds: 0 },
        rain_water: { posts: 0, totalHarvesters: 0 }
      }
    };

    try {
      console.log('Fetching global element counts...');
      const { data, status } = await axiosClient.get('/posts/global-map/counts');

      if (status === 200) {
        console.log('Global element counts received:', data);
        setGlobalCounts({ 
          ...defaultCounts, 
          ...data, 
          categories: { ...defaultCounts.categories, ...data?.categories } 
        });
      } else {
        throw new Error(`API returned status: ${status}`);
      }
    } catch (error) {
      console.error('Error fetching global counts:', error);
      setGlobalCounts(defaultCounts);
    }
  }, []);

  const fetchMapData = useCallback(async () => {
    if (!currentRegion) return;

    const boundsString = `${currentRegion.latitude}_${currentRegion.longitude}_${currentRegion.latitudeDelta}_${currentRegion.longitudeDelta}_${selectedCategory}`;

    if (lastFetchedBoundsRef.current === boundsString && mapData) {
      return;
    }

    setIsLoadingData(true);
    try {
      const bounds = {
        northEast: {
          latitude: currentRegion.latitude + currentRegion.latitudeDelta / 2,
          longitude: currentRegion.longitude + currentRegion.longitudeDelta / 2,
        },
        southWest: {
          latitude: currentRegion.latitude - currentRegion.latitudeDelta / 2,
          longitude: currentRegion.longitude - currentRegion.longitudeDelta / 2,
        },
      };

      const params = {
        bounds,
        category: selectedCategory,
        clustering: true,
        limit: 500,
        clusterRadius: 50
      };

      console.log('Fetching individual elements for map:', params);
      const { data, status } = await axiosClient.get('/posts/global-map/data', { params });

      // if (status === 200) {
        console.log('Individual elements received:', data);
        setMapData(data);
        lastFetchedBoundsRef.current = boundsString;
      // } else {
        // throw new Error(`API returned status: ${status}`);
      // }
    } catch (error) {
      console.error('Error fetching map data:', error);
      setMapData({ type: 'clustered', data: [] });
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          console.log('No environmental elements found for this region');
        } else if (error.message.includes('5')) {
          alert('Server Error: Unable to load environmental data. Please try again later.');
        } else {
          alert('Network Error: Please check your internet connection.');
        }
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [currentRegion, selectedCategory, mapData]);

  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 2) return;

    setSearchLoading(true);
    try {
      console.log('Searching environmental elements for:', searchQuery);
      const params = {
        query: searchQuery,
        category: selectedCategory,
        limit: 20
      };

      const { data, status } = await axiosClient.get('/posts/global-map/search', { params });

      if (status === 200) {
        console.log('Element search results received:', data);
        setSearchResults(data.results || []);
        setShowSearchResults(true);
      } else {
        throw new Error(`API returned status: ${status}`);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  const fetchElementDetails = useCallback(async (elementId: string) => {
    setIsLoadingElementDetails(true);
    try {
      console.log('Fetching element details for:', elementId);
      const { data, status } = await axiosClient.get(`/posts/environmental-contributions/${elementId}`);

      if (status === 200) {
        console.log('Element details received:', data);
        setSelectedElement(data);
        setShowElementModal(true);
      } else {
        throw new Error(`API returned status: ${status}`);
      }
    } catch (error) {
      console.error('Error fetching element details:', error);
      alert('Error: Unable to load element details. Please try again.');
    } finally {
      setIsLoadingElementDetails(false);
    }
  }, []);

  // Event Handlers
  const handleMarkerClick = useCallback((element: any, isCluster: boolean = false) => {
    if (isCluster && element.count > 1) {
      // Zoom in on cluster
      const newCenter = { lat: element.center.latitude, lng: element.center.longitude };
      const newZoom = Math.min(mapZoom + 3, 18);
      setMapCenter(newCenter);
      setMapZoom(newZoom);
      
      // Update region for API calls
      setCurrentRegion({
        latitude: element.center.latitude,
        longitude: element.center.longitude,
        latitudeDelta: Math.max(currentRegion.latitudeDelta / 3, 0.01),
        longitudeDelta: Math.max(currentRegion.longitudeDelta / 3, 0.01),
      });
    } else {
      // Show info window for individual element
      const elementToShow = isCluster ? element.elements[0] : element;
      setActiveMarker(elementToShow);
      setShowInfoWindow(true);
      console.log('Showing info window for element:', elementToShow);
    }
  }, [mapZoom, currentRegion]);

  const handleViewMore = useCallback(() => {
    if (activeMarker) {
      setShowInfoWindow(false);
      fetchElementDetails(activeMarker._id);
    }
  }, [activeMarker, fetchElementDetails]);

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    const newCenter = { lat: result.center.latitude, lng: result.center.longitude };
    setMapCenter(newCenter);
    setMapZoom(12);
    
    setCurrentRegion({
      latitude: result.center.latitude,
      longitude: result.center.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
    
    setShowSearchResults(false);
    setSearchQuery('');
  }, []);

  const handleMapIdle = useCallback(() => {
    if (mapRef.current && !isInitialLoad) {
      const bounds = mapRef.current.getBounds();
      const center = mapRef.current.getCenter();
      
      if (bounds && center) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        const newRegion = {
          latitude: center.lat(),
          longitude: center.lng(),
          latitudeDelta: ne.lat() - sw.lat(),
          longitudeDelta: ne.lng() - sw.lng(),
        };

        const latDiff = Math.abs(newRegion.latitude - currentRegion.latitude);
        const lngDiff = Math.abs(newRegion.longitude - currentRegion.longitude);
        const deltaLatDiff = Math.abs(newRegion.latitudeDelta - currentRegion.latitudeDelta);
        const deltaLngDiff = Math.abs(newRegion.longitudeDelta - currentRegion.longitudeDelta);

        const significantChange = latDiff > 0.001 || lngDiff > 0.001 || deltaLatDiff > 0.01 || deltaLngDiff > 0.01;

        if (significantChange) {
          setCurrentRegion(newRegion);
        }
      }
    }
  }, [currentRegion, isInitialLoad]);

  // Helper Functions
  const getCurrentCategoryTotals = () => {
    if (!globalCounts) return { posts: 0, elements: 0, label: 'Elements' };

    switch (selectedCategory) {
      case 'plantation':
        return {
          posts: globalCounts.categories.plantation.posts,
          elements: globalCounts.categories.plantation.totalTrees,
          label: 'Trees'
        };
      case 'garbage_collection':
        return {
          posts: globalCounts.categories.garbage_collection.posts,
          elements: globalCounts.categories.garbage_collection.totalBins,
          label: 'Bins'
        };
      case 'water_ponds':
        return {
          posts: globalCounts.categories.water_ponds.posts,
          elements: globalCounts.categories.water_ponds.totalPonds,
          label: 'Ponds'
        };
      case 'rain_water':
        return {
          posts: globalCounts.categories.rain_water.posts,
          elements: globalCounts.categories.rain_water.totalHarvesters,
          label: 'Harvesters'
        };
      default:
        return {
          posts: globalCounts.totalPosts,
          elements: globalCounts.totalElements,
          label: 'Elements'
        };
    }
  };

  const getElementSpecificData = (element: any) => {
    if (element.plantationData) {
      return {
        type: 'Tree',
        details: [
          { label: 'Species', value: element.plantationData.species || 'Unknown' },
          { label: 'Type', value: element.plantationData.type || 'Unknown' },
          { label: 'Height', value: element.plantationData.estimatedHeight ? `${element.plantationData.estimatedHeight}m` : 'Unknown' },
          { label: 'Status', value: element.plantationData.isActive ? 'Active' : 'Inactive' }
        ]
      };
    } else if (element.garbageCollectionData) {
      return {
        type: 'Bin',
        details: [
          { label: 'Type', value: element.garbageCollectionData.type || 'Unknown' },
          { label: 'Capacity', value: element.garbageCollectionData.capacity || 'Unknown' },
          { label: 'Material', value: element.garbageCollectionData.material || 'Unknown' }
        ]
      };
    } else if (element.waterPondsData) {
      return {
        type: 'Pond',
        details: [
          { label: 'Type', value: element.waterPondsData.type || 'Unknown' },
          { label: 'Purpose', value: element.waterPondsData.purpose || 'Unknown' },
          { label: 'Capacity', value: element.waterPondsData.capacity || 'Unknown' },
          { label: 'Depth', value: element.waterPondsData.estimatedDepth ? `${element.waterPondsData.estimatedDepth}m` : 'Unknown' }
        ]
      };
    } else if (element.rainWaterData) {
      return {
        type: 'Harvester',
        details: [
          { label: 'Type', value: element.rainWaterData.type || 'Unknown' },
          { label: 'Capacity', value: element.rainWaterData.capacity || 'Unknown' },
          { label: 'Storage', value: element.rainWaterData.storageMethod || 'Unknown' },
          { label: 'Volume', value: element.rainWaterData.estimatedVolume ? `${element.rainWaterData.estimatedVolume}L` : 'Unknown' }
        ]
      };
    }
    return null;
  };

  const renderMarkers = () => {
    if (!mapData?.data || mapData.data.length === 0 || !isMapLoaded) return null;

    try {
      if (mapData.type === 'clustered') {
        return mapData.data.map((cluster, index) => (
          <Marker
            key={`cluster-${cluster.postType}-${index}`}
            position={{ lat: cluster.center.latitude, lng: cluster.center.longitude }}
            icon={
              window.google ? {
                url: createCustomMarkerIcon(cluster.postType, cluster.count),
                scaledSize: new window.google.maps.Size(50, 50),
                anchor: new window.google.maps.Point(25, 25),
              } : undefined
            }
            onClick={() => handleMarkerClick(cluster, true)}
          />
        ));
      } else {
        return mapData.data.map((element, index) => (
          <Marker
            key={`element-${element._id || index}`}
            position={{ lat: element.location.latitude, lng: element.location.longitude }}
            icon={
              window.google ? {
                url: createCustomMarkerIcon(element.postType),
                scaledSize: new window.google.maps.Size(30, 30),
                anchor: new window.google.maps.Point(15, 15),
              } : undefined
            }
            onClick={() => handleMarkerClick(element, false)}
          />
        ));
      }
    } catch (error) {
      console.error('Error rendering markers:', error);
      return null;
    }
  };

  // Effects
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        if ('geolocation' in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true
            });
          });
          
          const newRegion = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          };
          
          setCurrentRegion(newRegion);
          setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    if (visible) {
      getCurrentLocation();
      fetchGlobalCounts();
    }
  }, [visible, fetchGlobalCounts]);

  useEffect(() => {
    if (visible && isInitialLoad) {
      setIsInitialLoad(false);
      fetchMapData();
    }
  }, [visible, currentRegion, selectedCategory, isInitialLoad, fetchMapData]);

  useEffect(() => {
    if (!isInitialLoad && visible) {
      if (dataFetchTimeoutRef.current) {
        clearTimeout(dataFetchTimeoutRef.current);
      }

      const boundsString = `${currentRegion.latitude}_${currentRegion.longitude}_${currentRegion.latitudeDelta}_${currentRegion.longitudeDelta}_${selectedCategory}`;

      if (lastFetchedBoundsRef.current !== boundsString) {
        dataFetchTimeoutRef.current = setTimeout(() => {
          fetchMapData();
        }, 800);
      }
    }

    return () => {
      if (dataFetchTimeoutRef.current) {
        clearTimeout(dataFetchTimeoutRef.current);
      }
    };
  }, [currentRegion, selectedCategory, visible, isInitialLoad, fetchMapData]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedCategory, handleSearch]);

  if (!visible) return null;

  const currentTotals = getCurrentCategoryTotals();
  const selectedConfig = getCategoryConfig(selectedCategory);

  if (!googleMapsApiKey) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Google Maps API Key Required</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please add your Google Maps API key to use the map:
            </p>
            <div className="space-y-2 text-left">
              <div className="bg-gray-100 rounded p-3">
                <p className="text-xs text-gray-600 mb-1">Environment Variable:</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded block">
                  REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
                </code>
              </div>
              <div className="bg-gray-100 rounded p-3">
                <p className="text-xs text-gray-600 mb-1">Or pass as prop:</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded block">
                  googleMapsApiKey="your_key"
                </code>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800 mb-2">
                <strong>Need an API key?</strong> Get one from the{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Google Cloud Console
                </a>
              </p>
              <p className="text-xs text-blue-700">
                Make sure to enable: <strong>Maps JavaScript API</strong> and <strong>Places API</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      {onClose && (
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold text-gray-900">Global Environmental Map</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Search Container */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search cities, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
            />
            {searchLoading && (
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            )}
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-50">
              {searchResults.map((result, index) => (
                <button
                  key={`search-${index}`}
                  onClick={() => handleSearchResultSelect(result)}
                  className="flex items-center w-full p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left"
                >
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{result.displayName}</div>
                    <div className="text-sm text-gray-500">
                      {result.elementCount} elements in {result.projectCount} projects
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {(['plantation', 'water_ponds', 'rain_water', 'garbage_collection', 'all'] as const).map((category) => {
            const config = getCategoryConfig(category);
            const isSelected = selectedCategory === category;
            const IconComponent = config.icon;

            let elementCount = 0;
            if (globalCounts) {
              switch (category) {
                case 'plantation':
                  elementCount = globalCounts.categories.plantation.totalTrees;
                  break;
                case 'garbage_collection':
                  elementCount = globalCounts.categories.garbage_collection.totalBins;
                  break;
                case 'water_ponds':
                  elementCount = globalCounts.categories.water_ponds.totalPonds;
                  break;
                case 'rain_water':
                  elementCount = globalCounts.categories.rain_water.totalHarvesters;
                  break;
                case 'all':
                  elementCount = globalCounts.totalElements;
                  break;
              }
            }

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  isSelected 
                    ? 'text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={isSelected ? { backgroundColor: config.color } : {}}
              >
                <IconComponent className="w-4 h-4" />
                <span className="font-medium">{config.name}</span>
                <span className="text-xs opacity-75">
                  {elementCount.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {mapLoadError ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center p-8 max-w-md">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Map Loading Error</h3>
              <p className="text-sm text-gray-500 mb-4">{mapLoadError}</p>
              <div className="space-y-2 text-left text-xs text-gray-600">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="font-medium text-yellow-800 mb-2">Common solutions:</p>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Check if your API key is valid</li>
                    <li>• Enable "Maps JavaScript API" in Google Cloud Console</li>
                    <li>• Enable "Places API" in Google Cloud Console</li>
                    <li>• Set up billing in Google Cloud Console</li>
                    <li>• Check domain restrictions on your API key</li>
                    <li>• Ensure API key has no IP/referrer restrictions for localhost</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 space-x-2">
                <button 
                  onClick={() => {
                    setMapLoadError(null);
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Retry
                </button>
                <button 
                  onClick={() => setMapLoadError(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Use Fallback Map
                </button>
              </div>
            </div>
          </div>
        ) : (
          <LoadScript 
            googleMapsApiKey={'AIzaSyDEz0n0ST4J3KYECJDx_-hTtnejV2A0-to'}
            // libraries={libraries}
            onLoad={() => {
              console.log('Google Maps loaded successfully');
              setIsMapLoaded(true);
              setMapLoadError(null);
            }}
            onError={(error) => {
              console.error('Google Maps load error:', error);
              setMapLoadError(
                'Failed to load Google Maps. Please check your API key and internet connection.'
              );
              setIsMapLoaded(false);
            }}
            loadingElement={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-600">Loading Google Maps...</p>
                </div>
              </div>
            }
          >
            {isMapLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                options={mapOptions}
                onLoad={(map) => {
                  mapRef.current = map;
                  console.log('Map instance loaded');
                }}
                onError={(error) => {
                  console.error('Google Map component error:', error);
                  setMapLoadError('Map rendering error occurred');
                }}
                onIdle={handleMapIdle}
                onClick={() => setShowInfoWindow(false)}
              >
                {renderMarkers()}
                
                {/* Info Window */}
                {showInfoWindow && activeMarker && (
                  <InfoWindow
                    position={{ 
                      lat: activeMarker.location.latitude, 
                      lng: activeMarker.location.longitude 
                    }}
                    onCloseClick={() => setShowInfoWindow(false)}
                  >
                    <div className="p-2 max-w-xs">
                      <div className="flex items-center space-x-2 mb-2">
                        {(() => {
                          const config = getCategoryConfig(activeMarker.postType);
                          const IconComponent = config.icon;
                          return <IconComponent className="w-5 h-5" style={{ color: config.color }} />;
                        })()}
                        <h3 className="font-semibold text-sm">
                          {activeMarker.projectDetails?.name || activeMarker.postId?.projectDetails?.name || 'Environmental Project'}
                        </h3>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">
                        {activeMarker.location.address || `${activeMarker.location.city}, ${activeMarker.location.country}`}
                      </p>

                      {getElementSpecificData(activeMarker) && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            {getElementSpecificData(activeMarker)?.type} Details
                          </p>
                          {getElementSpecificData(activeMarker)?.details.slice(0, 2).map((detail, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-gray-600">{detail.label}:</span>
                              <span className="font-medium">{detail.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button 
                        onClick={handleViewMore}
                        className="w-full text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 transition-colors"
                      >
                        View More Details
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <FallbackMap
                currentRegion={currentRegion}
                mapData={mapData}
                onMarkerClick={handleMarkerClick}
                selectedConfig={selectedConfig}
              />
            )}
          </LoadScript>
        )}

        {/* Loading Indicator */}
        {isLoadingData && (
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-md flex items-center space-x-2 z-10">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: selectedConfig.color }} />
            <span className="text-sm font-medium" style={{ color: selectedConfig.color }}>
              Loading {selectedConfig.name.toLowerCase()}...
            </span>
          </div>
        )}

        {/* Element Details Modal */}
        <ElementDetailsModal
          visible={showElementModal}
          element={selectedElement}
          isLoading={isLoadingElementDetails}
          onClose={() => setShowElementModal(false)}
        />

        {/* Stats Card */}
        {globalCounts && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
            <div className="flex justify-around text-center">
              <div className="flex flex-col items-center">
                {(() => {
                  const IconComponent = selectedConfig.icon;
                  return <IconComponent className="w-6 h-6 mb-1" style={{ color: selectedConfig.color }} />;
                })()}
                <div className="font-bold text-lg">{currentTotals.elements.toLocaleString()}</div>
                <div className="text-xs text-gray-600">{currentTotals.label}</div>
              </div>
              <div className="flex flex-col items-center">
                <Briefcase className="w-6 h-6 mb-1 text-gray-600" />
                <div className="font-bold text-lg">{currentTotals.posts.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Projects</div>
              </div>
              <div className="flex flex-col items-center">
                <Globe className="w-6 h-6 mb-1 text-blue-600" />
                <div className="font-bold text-lg">{selectedCategory === 'all' ? 'Global' : 'Filtered'}</div>
                <div className="text-xs text-gray-600">View</div>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {mapData && mapData.data.length === 0 && !isLoadingData && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 rounded-lg p-6 text-center max-w-sm">
            {(() => {
              const IconComponent = selectedConfig.icon;
              return <IconComponent className="w-12 h-12 mx-auto mb-3 text-gray-400" />;
            })()}
            <h3 className="font-medium text-gray-700 mb-2">
              No {selectedConfig.name.toLowerCase()} found in this area
            </h3>
            <p className="text-sm text-gray-500">
              Try zooming out or changing the category filter to see more environmental elements
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalEnvironmentalMap;