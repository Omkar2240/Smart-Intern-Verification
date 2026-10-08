import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

export interface SelectedLocationResult {
  fullAddress: string;
  country: string;
  state: string;
  city: string;
  exactAddress: string;
  lat: number;
  lng: number;
  postcode?: string;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (result: SelectedLocationResult) => void;
  initialLocation?: string;
}

// Popular countries with code & flag
const POPULAR_COUNTRIES = [
  { name: 'India', code: 'in', flag: '🇮🇳' },
  { name: 'United States', code: 'us', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'gb', flag: '🇬🇧' },
  { name: 'Canada', code: 'ca', flag: '🇨🇦' },
  { name: 'Germany', code: 'de', flag: '🇩🇪' },
  { name: 'United Arab Emirates', code: 'ae', flag: '🇦🇪' },
  { name: 'Singapore', code: 'sg', flag: '🇸🇬' },
  { name: 'Australia', code: 'au', flag: '🇦🇺' },
  { name: 'Japan', code: 'jp', flag: '🇯🇵' },
  { name: 'Netherlands', code: 'nl', flag: '🇳🇱' },
];

// Indian states & UTs
const INDIAN_STATES = [
  'Maharashtra',
  'Karnataka',
  'Telangana',
  'Tamil Nadu',
  'Delhi',
  'Haryana',
  'Uttar Pradesh',
  'Gujarat',
  'West Bengal',
  'Kerala',
  'Andhra Pradesh',
  'Madhya Pradesh',
  'Rajasthan',
  'Punjab',
  'Chandigarh',
  'Odisha',
  'Goa',
  'Assam',
  'Bihar',
  'Jharkhand',
  'Uttarakhand',
];

// Popular IT / corporate cities in major Indian states
const POPULAR_CITIES: Record<string, string[]> = {
  Maharashtra: ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai', 'Aurangabad'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'],
  Telangana: ['Hyderabad', 'Secunderabad', 'Warangal'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  Delhi: ['New Delhi', 'Central Delhi', 'South Delhi', 'North Delhi'],
  Haryana: ['Gurugram', 'Faridabad', 'Panchkula', 'Panipat', 'Ambala'],
  'Uttar Pradesh': ['Noida', 'Greater Noida', 'Lucknow', 'Kanpur', 'Ghaziabad', 'Varanasi'],
  Gujarat: ['Ahmedabad', 'Gandhinagar', 'Surat', 'Vadodara', 'Rajkot'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
  Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kottayam'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'],
};

// Calculate OpenStreetMap Slippy Map tile URL for visual preview
function getOsmTileUrl(lat: number, lon: number, zoom: number = 15): string {
  try {
    const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, zoom)
    );
    return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  } catch {
    return '';
  }
}

export default function LocationPickerModal({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
}: LocationPickerModalProps) {
  // Stepper: 1 = Country, 2 = State, 3 = City, 4 = Exact Location & Map Preview
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; code: string; flag: string }>(
    POPULAR_COUNTRIES[0] // India by default
  );
  const [countrySearch, setCountrySearch] = useState('');

  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [stateSearch, setStateSearch] = useState('');

  const [selectedCity, setSelectedCity] = useState('Pune');
  const [citySearch, setCitySearch] = useState('');

  // Step 4: Exact Landmark / Office search
  const [exactQuery, setExactQuery] = useState('');
  const [exactResults, setExactResults] = useState<any[]>([]);
  const [searchingExact, setSearchingExact] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  // GPS auto-detect state
  const [detectingGps, setDetectingGps] = useState(false);

  // Reset or initialize on open
  useEffect(() => {
    if (visible) {
      if (initialLocation && initialLocation.includes(',')) {
        // Keep current selections if already set
      } else {
        // default to India -> Maharashtra -> Pune
        setSelectedCountry(POPULAR_COUNTRIES[0]);
        setSelectedState('Maharashtra');
        setSelectedCity('Pune');
      }
    }
  }, [visible, initialLocation]);

  // Search exact location using OpenStreetMap Nominatim API
  const handleSearchExactLocation = async (customQuery?: string) => {
    const query = customQuery !== undefined ? customQuery : exactQuery;
    if (!query.trim()) {
      return;
    }

    setSearchingExact(true);
    try {
      const fullSearchTerm = `${query.trim()}, ${selectedCity}, ${selectedState}, ${selectedCountry.name}`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        fullSearchTerm
      )}&countrycodes=${selectedCountry.code}&format=json&addressdetails=1&limit=8`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SmartInternVerification/1.0 (academic-verification-app)',
        },
      });

      if (!response.ok) {
        throw new Error('OpenStreetMap service unavailable');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setExactResults(data);
        // Pre-select the best match
        setSelectedResult(data[0]);
      } else {
        // Fallback: search just the query + city
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          `${query.trim()}, ${selectedCity}`
        )}&countrycodes=${selectedCountry.code}&format=json&addressdetails=1&limit=6`;
        const fbRes = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'SmartInternVerification/1.0',
          },
        });
        const fbData = await fbRes.json();
        if (Array.isArray(fbData) && fbData.length > 0) {
          setExactResults(fbData);
          setSelectedResult(fbData[0]);
        } else {
          setExactResults([]);
          Alert.alert(
            'No Matches Found',
            `Could not locate "${query}" in ${selectedCity}. You can also type the landmark or office park name and confirm.`
          );
        }
      }
    } catch (e: any) {
      Alert.alert('Map API Notice', 'OpenStreetMap search timed out. You can manually enter the address.');
    } finally {
      setSearchingExact(false);
    }
  };

  // Reverse geocode via GPS
  const handleAutoDetectGps = async () => {
    setDetectingGps(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            await reverseGeocodeAndSelect(lat, lng);
            setDetectingGps(false);
          },
          (err) => {
            setDetectingGps(false);
            Alert.alert('GPS Notice', 'Could not access GPS location. Please choose Country, State, and City manually.');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setDetectingGps(false);
        Alert.alert('GPS Unavailable', 'GPS location is not supported on this platform. Please select manually.');
      }
    } catch (e: any) {
      setDetectingGps(false);
      Alert.alert('GPS Notice', 'Location detection could not be completed.');
    }
  };

  const reverseGeocodeAndSelect = async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SmartInternVerification/1.0' },
      });
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const cName = addr.country || 'India';
        const sName = addr.state || 'Maharashtra';
        const cityName = addr.city || addr.town || addr.suburb || 'Pune';

        const matchedCountry = POPULAR_COUNTRIES.find(
          (c) => c.name.toLowerCase() === cName.toLowerCase()
        ) || { name: cName, code: addr.country_code || 'in', flag: '🌐' };

        setSelectedCountry(matchedCountry);
        setSelectedState(sName);
        setSelectedCity(cityName);
        setExactQuery(addr.road || addr.suburb || data.name || '');
        setSelectedResult(data);
        setCurrentStep(4);
      }
    } catch (e) {
      // fallback
    }
  };

  // Confirm selection
  const handleConfirmLocation = () => {
    if (selectedResult) {
      const lat = parseFloat(selectedResult.lat);
      const lng = parseFloat(selectedResult.lon);
      const addr = selectedResult.address || {};
      const postcode = addr.postcode || '';

      // Format clean, professional workplace address
      const buildingOrRoad =
        selectedResult.name ||
        addr.building ||
        addr.office ||
        addr.commercial ||
        addr.road ||
        exactQuery.trim() ||
        'Office Workplace';

      const fullAddress = `${buildingOrRoad}, ${selectedCity}, ${selectedState} ${postcode}, ${selectedCountry.name}`.replace(
        /\s+,/g,
        ','
      );

      onSelectLocation({
        fullAddress,
        country: selectedCountry.name,
        state: selectedState,
        city: selectedCity,
        exactAddress: buildingOrRoad,
        lat,
        lng,
        postcode,
      });
      onClose();
    } else if (exactQuery.trim()) {
      // Manual address entered by student
      const manualFull = `${exactQuery.trim()}, ${selectedCity}, ${selectedState}, ${selectedCountry.name}`;
      onSelectLocation({
        fullAddress: manualFull,
        country: selectedCountry.name,
        state: selectedState,
        city: selectedCity,
        exactAddress: exactQuery.trim(),
        lat: 18.5204, // Default fallback
        lng: 73.8567,
      });
      onClose();
    } else {
      Alert.alert('Selection Required', 'Please choose or search an exact office building or landmark.');
    }
  };

  // Filtered lists
  const filteredCountries = POPULAR_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredStates = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const currentCities =
    POPULAR_CITIES[selectedState] || ['City Center', 'Tech Hub', 'Industrial Area', 'Downtown'];
  const filteredCities = currentCities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.osmBadge}>
                  <Feather name="map" size={12} color="#059669" />
                  <Text style={styles.osmBadgeText}>Free OpenStreetMap API</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>Select Office Workplace</Text>
              <Text style={styles.headerSub}>
                Country ➔ State ➔ City ➔ Exact Landmark / Tech Park
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={26} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Stepper Navigation */}
          <View style={styles.stepperContainer}>
            {[
              { step: 1, label: selectedCountry.name ? selectedCountry.name.split(' ')[0] : 'Country' },
              { step: 2, label: selectedState ? selectedState.split(' ')[0] : 'State' },
              { step: 3, label: selectedCity ? selectedCity.split(' ')[0] : 'City' },
              { step: 4, label: 'Exact Pin' },
            ].map((item, idx) => {
              const isActive = currentStep === item.step;
              const isPast = currentStep > item.step;
              return (
                <React.Fragment key={item.step}>
                  <TouchableOpacity
                    style={[
                      styles.stepTab,
                      isActive && styles.stepTabActive,
                      isPast && styles.stepTabPast,
                    ]}
                    onPress={() => setCurrentStep(item.step as any)}
                  >
                    <View
                      style={[
                        styles.stepBadge,
                        isActive && styles.stepBadgeActive,
                        isPast && styles.stepBadgePast,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepBadgeText,
                          isActive && styles.stepBadgeTextActive,
                          isPast && styles.stepBadgeTextPast,
                        ]}
                      >
                        {isPast ? '✓' : item.step}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isActive && styles.stepLabelActive,
                        isPast && styles.stepLabelPast,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                  {idx < 3 && <View style={styles.stepDivider} />}
                </React.Fragment>
              );
            })}
          </View>

          {/* Quick Auto-Detect GPS Button */}
          <View style={styles.gpsBanner}>
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleAutoDetectGps}
              disabled={detectingGps}
            >
              {detectingGps ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
              ) : (
                <MaterialIcons name="my-location" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.gpsBtnText}>
                {detectingGps ? 'Detecting via OpenStreetMap...' : 'Auto-detect Current Office Location (GPS)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Step 1: Country Picker */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionHeading}>Step 1: Choose Country</Text>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search country..."
                  placeholderTextColor="#9CA3AF"
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                />
              </View>

              <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                {filteredCountries.map((c) => {
                  const isSelected = selectedCountry.name === c.name;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.listItem, isSelected && styles.listItemSelected]}
                      onPress={() => {
                        setSelectedCountry(c);
                        setCurrentStep(2);
                      }}
                    >
                      <Text style={styles.countryFlag}>{c.flag}</Text>
                      <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
                        {c.name}
                      </Text>
                      {isSelected && <Feather name="check" size={18} color="#D97706" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Step 2: State Picker */}
          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.sectionHeading}>
                  Step 2: Choose State / Province ({selectedCountry.name})
                </Text>
              </View>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search state..."
                  placeholderTextColor="#9CA3AF"
                  value={stateSearch}
                  onChangeText={setStateSearch}
                />
              </View>

              <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                {selectedCountry.code === 'in' ? (
                  filteredStates.map((s) => {
                    const isSelected = selectedState === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.listItem, isSelected && styles.listItemSelected]}
                        onPress={() => {
                          setSelectedState(s);
                          // Default first city of this state
                          if (POPULAR_CITIES[s] && POPULAR_CITIES[s].length > 0) {
                            setSelectedCity(POPULAR_CITIES[s][0]);
                          }
                          setCurrentStep(3);
                        }}
                      >
                        <MaterialIcons name="location-city" size={18} color="#6B7280" style={{ marginRight: 10 }} />
                        <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
                          {s}
                        </Text>
                        {isSelected && <Feather name="check" size={18} color="#D97706" />}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 13, color: '#4B5563', marginBottom: 12 }}>
                      Enter state / province name for {selectedCountry.name}:
                    </Text>
                    <TextInput
                      style={styles.textInputFull}
                      placeholder="e.g. California, Ontario, Bavaria"
                      placeholderTextColor="#9CA3AF"
                      value={selectedState}
                      onChangeText={setSelectedState}
                    />
                    <TouchableOpacity
                      style={styles.continueBtn}
                      onPress={() => setCurrentStep(3)}
                    >
                      <Text style={styles.continueBtnText}>Continue to City ➔</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Step 3: City Picker */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.sectionHeading}>
                  Step 3: Choose City ({selectedState}, {selectedCountry.name})
                </Text>
              </View>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search or enter city..."
                  placeholderTextColor="#9CA3AF"
                  value={citySearch}
                  onChangeText={(val) => {
                    setCitySearch(val);
                    if (val.trim()) {
                      setSelectedCity(val.trim());
                    }
                  }}
                />
              </View>

              <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                {filteredCities.map((c) => {
                  const isSelected = selectedCity.toLowerCase() === c.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.listItem, isSelected && styles.listItemSelected]}
                      onPress={() => {
                        setSelectedCity(c);
                        setCurrentStep(4);
                      }}
                    >
                      <Ionicons name="business-outline" size={18} color="#6B7280" style={{ marginRight: 10 }} />
                      <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
                        {c}
                      </Text>
                      {isSelected && <Feather name="check" size={18} color="#D97706" />}
                    </TouchableOpacity>
                  );
                })}

                {citySearch.trim().length > 0 && !filteredCities.includes(citySearch.trim()) && (
                  <TouchableOpacity
                    style={[styles.listItem, { backgroundColor: '#FEF3C7' }]}
                    onPress={() => {
                      setSelectedCity(citySearch.trim());
                      setCurrentStep(4);
                    }}
                  >
                    <Feather name="plus-circle" size={18} color="#D97706" style={{ marginRight: 10 }} />
                    <Text style={[styles.listItemText, { color: '#B45309', fontWeight: '700' }]}>
                      Use custom city: "{citySearch.trim()}"
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => setCurrentStep(4)}
              >
                <Text style={styles.continueBtnText}>
                  Continue with "{selectedCity}" ➔
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Exact Location & Map Pin */}
          {currentStep === 4 && (
            <View style={styles.stepContent}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.sectionHeading}>
                  Step 4: Exact Office Landmark / IT Park
                </Text>
              </View>

              <Text style={styles.stepHelperText}>
                Scope: <Text style={{ fontWeight: '700', color: '#1F2937' }}>{selectedCity}, {selectedState}, {selectedCountry.name}</Text>
              </Text>

              {/* Exact Search Bar */}
              <View style={styles.exactSearchRow}>
                <View style={[styles.searchBox, { flex: 1, marginBottom: 0 }]}>
                  <Feather name="map-pin" size={16} color="#D97706" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="e.g. EON IT Park, Hinjawadi Phase 2, DLF..."
                    placeholderTextColor="#9CA3AF"
                    value={exactQuery}
                    onChangeText={setExactQuery}
                    onSubmitEditing={() => handleSearchExactLocation()}
                  />
                  {exactQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setExactQuery('')}>
                      <Feather name="x" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.searchActionBtn}
                  onPress={() => handleSearchExactLocation()}
                  disabled={searchingExact}
                >
                  {searchingExact ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="search" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                {/* Visual Map Preview if a result is selected */}
                {selectedResult && (
                  <View style={styles.mapPreviewCard}>
                    <View style={styles.mapImageContainer}>
                      {/* OSM Tile image */}
                      <Image
                        source={{
                          uri: getOsmTileUrl(
                            parseFloat(selectedResult.lat),
                            parseFloat(selectedResult.lon),
                            15
                          ),
                        }}
                        style={styles.mapTileImage}
                        resizeMode="cover"
                      />
                      {/* Overlay Map Pin */}
                      <View style={styles.pinCenterOverlay}>
                        <View style={styles.pinPulseEffect} />
                        <Ionicons name="location-sharp" size={36} color="#DC2626" />
                      </View>

                      {/* Map Tag */}
                      <View style={styles.mapTag}>
                        <Text style={styles.mapTagText}>OpenStreetMap View</Text>
                      </View>
                    </View>

                    {/* Coordinates & Verified Details */}
                    <View style={styles.mapDetailsBox}>
                      <View style={styles.coordsRow}>
                        <Ionicons name="compass-outline" size={14} color="#059669" />
                        <Text style={styles.coordsText}>
                          Lat: {parseFloat(selectedResult.lat).toFixed(5)} • Lng:{' '}
                          {parseFloat(selectedResult.lon).toFixed(5)}
                        </Text>
                      </View>

                      <Text style={styles.selectedLocationTitle} numberOfLines={2}>
                        {selectedResult.name || selectedResult.display_name.split(',')[0]}
                      </Text>
                      <Text style={styles.selectedLocationAddress} numberOfLines={3}>
                        {selectedResult.display_name}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Suggestions List from OpenStreetMap */}
                {exactResults.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.resultsHeader}>
                      Matching Landmarks / Tech Parks ({exactResults.length}):
                    </Text>
                    {exactResults.map((item, index) => {
                      const isChosen = selectedResult?.place_id === item.place_id;
                      return (
                        <TouchableOpacity
                          key={item.place_id || index}
                          style={[styles.resultItem, isChosen && styles.resultItemActive]}
                          onPress={() => setSelectedResult(item)}
                        >
                          <Ionicons
                            name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={isChosen ? '#D97706' : '#9CA3AF'}
                            style={{ marginRight: 10, marginTop: 2 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.resultName, isChosen && styles.resultNameActive]}>
                              {item.name || item.display_name.split(',')[0]}
                            </Text>
                            <Text style={styles.resultAddress} numberOfLines={2}>
                              {item.display_name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Quick Landmarks Presets for Selected City */}
                {exactResults.length === 0 && !selectedResult && (
                  <View style={styles.presetsCard}>
                    <Text style={styles.presetsTitle}>
                      Popular IT & Corporate Hubs in {selectedCity}:
                    </Text>
                    <View style={styles.presetChipsRow}>
                      {[
                        `Tech Park, ${selectedCity}`,
                        `Cyber City, ${selectedCity}`,
                        `MIDC Industrial Area, ${selectedCity}`,
                        `Business Bay, ${selectedCity}`,
                        `World Trade Center, ${selectedCity}`,
                      ].map((preset) => (
                        <TouchableOpacity
                          key={preset}
                          style={styles.presetChip}
                          onPress={() => {
                            setExactQuery(preset.split(',')[0]);
                            handleSearchExactLocation(preset.split(',')[0]);
                          }}
                        >
                          <Feather name="navigation" size={12} color="#4B5563" style={{ marginRight: 4 }} />
                          <Text style={styles.presetChipText}>{preset.split(',')[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Confirm Button */}
              <TouchableOpacity
                style={styles.confirmLocationBtn}
                onPress={handleConfirmLocation}
                activeOpacity={0.85}
              >
                <Feather name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmLocationBtnText}>Confirm Office Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    minHeight: 560,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  osmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  osmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  stepTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  stepTabPast: {},
  stepBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#D97706',
  },
  stepBadgePast: {
    backgroundColor: '#059669',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepBadgeTextActive: {
    color: '#FFFFFF',
  },
  stepBadgeTextPast: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepLabelActive: {
    color: '#B45309',
    fontWeight: '800',
  },
  stepLabelPast: {
    color: '#059669',
  },
  stepDivider: {
    width: 8,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  gpsBanner: {
    marginBottom: 10,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepHelperText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
  },
  listScroll: {
    flex: 1,
    maxHeight: 320,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  listItemSelected: {
    backgroundColor: '#FEF3C7',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  listItemTextSelected: {
    color: '#B45309',
    fontWeight: '800',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  textInputFull: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 12,
  },
  continueBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  exactSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchActionBtn: {
    backgroundColor: '#D97706',
    width: 44,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  mapTileImage: {
    width: '100%',
    height: '100%',
  },
  pinCenterOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -32 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulseEffect: {
    position: 'absolute',
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(220, 38, 38, 0.35)',
  },
  mapTag: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  mapDetailsBox: {
    padding: 12,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  selectedLocationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  selectedLocationAddress: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  resultsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  resultItemActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  resultName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  resultNameActive: {
    color: '#B45309',
  },
  resultAddress: {
    fontSize: 11,
    color: '#64748B',
  },
  presetsCard: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  confirmLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  confirmLocationBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
