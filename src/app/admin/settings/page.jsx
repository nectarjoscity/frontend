'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoLocationOutline, IoRefreshOutline, IoTimeOutline } from 'react-icons/io5';
import { getCurrentLocation, setRestaurantLocation, getRestaurantLocation } from '../../../utils/geofencing';
import { getPreOrderSettings, setPreOrderSettings } from '../../../utils/preorder';
import { getLandingPage, setLandingPage } from '../../../utils/landingPage';

export default function SettingsPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  // Geofence settings
  const [geofenceLat, setGeofenceLat] = useState('');
  const [geofenceLon, setGeofenceLon] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState(50);
  const [geofenceSaved, setGeofenceSaved] = useState(false);
  const [geofenceError, setGeofenceError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Pre-order settings
  const [preOrderEnabled, setPreOrderEnabled] = useState(false);
  const [preOrderStartTime, setPreOrderStartTime] = useState('00:00');
  const [preOrderEndTime, setPreOrderEndTime] = useState('23:59');
  const [preOrderDays, setPreOrderDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [preOrderSaved, setPreOrderSaved] = useState(false);
  const [preOrderError, setPreOrderError] = useState('');
  
  // Landing page settings
  const [landingPage, setLandingPageState] = useState('main');
  const [landingPageSaved, setLandingPageSaved] = useState(false);
  const [landingPageError, setLandingPageError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
    
    // Load current table number
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nectarv_table_number') || '';
      setTableNumber(stored);
      
      // Load geofence settings
      const geofence = getRestaurantLocation();
      if (geofence.latitude && geofence.longitude) {
        setGeofenceLat(geofence.latitude.toString());
        setGeofenceLon(geofence.longitude.toString());
        setGeofenceRadius(geofence.radius);
      }
      
      // Load pre-order settings
      const preOrder = getPreOrderSettings();
      setPreOrderEnabled(preOrder.enabled);
      setPreOrderStartTime(preOrder.startTime);
      setPreOrderEndTime(preOrder.endTime);
      setPreOrderDays(preOrder.daysOfWeek);
      
      // Load landing page settings
      const currentLandingPage = getLandingPage();
      setLandingPageState(currentLandingPage);
    }
  }, [router]);

  const handleSave = () => {
    if (!tableNumber.trim()) {
      setError('Table number cannot be empty');
      return;
    }

    const num = parseInt(tableNumber.trim());
    if (isNaN(num) || num < 1 || num > 999) {
      setError('Table number must be between 1 and 999');
      return;
    }

    try {
      localStorage.setItem('nectarv_table_number', tableNumber.trim());
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save table number');
      console.error('Error saving table number:', err);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the table number? Orders will not automatically include a table number.')) {
      localStorage.removeItem('nectarv_table_number');
      setTableNumber('');
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Geofence handlers
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    setGeofenceError('');
    try {
      const location = await getCurrentLocation();
      setGeofenceLat(location.latitude.toFixed(6));
      setGeofenceLon(location.longitude.toFixed(6));
    } catch (err) {
      setGeofenceError('Failed to get location: ' + err.message);
      console.error('Error getting location:', err);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSaveGeofence = () => {
    if (!geofenceLat.trim() || !geofenceLon.trim()) {
      setGeofenceError('Please enter latitude and longitude');
      return;
    }

    const lat = parseFloat(geofenceLat);
    const lon = parseFloat(geofenceLon);
    const radius = parseFloat(geofenceRadius);

    if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
      setGeofenceError('Please enter valid numbers');
      return;
    }

    if (lat < -90 || lat > 90) {
      setGeofenceError('Latitude must be between -90 and 90');
      return;
    }

    if (lon < -180 || lon > 180) {
      setGeofenceError('Longitude must be between -180 and 180');
      return;
    }

    if (radius < 1 || radius > 1000) {
      setGeofenceError('Radius must be between 1 and 1000 meters');
      return;
    }

    try {
      setRestaurantLocation(lat, lon, radius);
      setGeofenceSaved(true);
      setGeofenceError('');
      setTimeout(() => setGeofenceSaved(false), 3000);
    } catch (err) {
      setGeofenceError('Failed to save geofence settings');
      console.error('Error saving geofence:', err);
    }
  };

  const handleClearGeofence = () => {
    if (window.confirm('Are you sure you want to clear the geofence? Tablets will not be restricted by location.')) {
      localStorage.removeItem('restaurant_geofence');
      setGeofenceLat('');
      setGeofenceLon('');
      setGeofenceRadius(50);
      setGeofenceSaved(true);
      setGeofenceError('');
      setTimeout(() => setGeofenceSaved(false), 3000);
    }
  };

  // Pre-order handlers
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleToggleDay = (day) => {
    if (preOrderDays.includes(day)) {
      setPreOrderDays(preOrderDays.filter(d => d !== day));
    } else {
      setPreOrderDays([...preOrderDays, day].sort());
    }
  };

  const handleSavePreOrder = () => {
    if (preOrderDays.length === 0) {
      setPreOrderError('Please select at least one day');
      return;
    }

    try {
      setPreOrderSettings({
        enabled: preOrderEnabled,
        startTime: preOrderStartTime,
        endTime: preOrderEndTime,
        daysOfWeek: preOrderDays
      });
      setPreOrderSaved(true);
      setPreOrderError('');
      setTimeout(() => setPreOrderSaved(false), 3000);
    } catch (err) {
      setPreOrderError('Failed to save pre-order settings');
      console.error('Error saving pre-order settings:', err);
    }
  };

  const handleSaveLandingPage = () => {
    try {
      setLandingPage(landingPage);
      setLandingPageSaved(true);
      setLandingPageError('');
      setTimeout(() => setLandingPageSaved(false), 3000);
    } catch (err) {
      setLandingPageError('Failed to save landing page setting');
      console.error('Error saving landing page:', err);
    }
  };

  return (
    <AdminLayout title="Settings" active="settings" requiredPermission="settings">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tablet Configuration */}
          <div className="rounded-xl p-6 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: colors.amber500, color: '#fff' }}>
                🪑
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Tablet Configuration</h2>
                <p className="text-base" style={{ color: colors.mutedText }}>Configure which table this tablet is assigned to</p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                  Table Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    setError('');
                    setSaved(false);
                  }}
                  placeholder="Enter table number (e.g., 5)"
                  className="w-full px-4 py-3 rounded-lg text-xl"
                  style={{
                    background: colors.background,
                    border: `1px solid ${error ? '#EF4444' : colors.cardBorder}`,
                    color: colors.text,
                  }}
                />
                {error && (
                  <p className="mt-2 text-base flex items-center gap-2" style={{ color: '#EF4444' }}>
                    <IoCloseCircleOutline className="h-5 w-5" />
                    {error}
                  </p>
                )}
                {saved && !error && (
                  <p className="mt-2 text-base flex items-center gap-2" style={{ color: '#10B981' }}>
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    Table number saved successfully!
                  </p>
                )}
                <p className="mt-2 text-sm" style={{ color: colors.mutedText }}>
                  This table number will be automatically included in all dine-in orders placed on this tablet.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 rounded-lg font-semibold text-white"
                  style={{ background: colors.amber500 }}
                >
                  Save Table Number
                </button>
                {tableNumber && (
                  <button
                    onClick={handleClear}
                    className="px-6 py-3 rounded-lg font-semibold"
                    style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.cardBorder}`,
                      color: colors.text,
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {tableNumber && (
              <div className="mt-6 p-4 rounded-lg" style={{ background: theme === 'light' ? '#F0FDF4' : '#1A2E1A', border: `1px solid ${theme === 'light' ? '#BBF7D0' : '#2D4A2D'}` }}>
                <p className="text-base font-medium" style={{ color: theme === 'light' ? '#166534' : '#86EFAC' }}>
                  ✓ Current Configuration: <strong>Table {tableNumber}</strong>
                </p>
                <p className="text-sm mt-1" style={{ color: theme === 'light' ? '#15803D' : '#6EE7B7' }}>
                  All dine-in orders will automatically include "Table {tableNumber}" unless overridden during checkout.
                </p>
              </div>
            )}

            {/* Geofence Settings */}
            <div className="space-y-4 mt-8 pt-8" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
              <div>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                  <IoLocationOutline className="inline h-6 w-6 mr-2" />
                  Restaurant Location (Geofencing)
                </h3>
                <p className="text-sm mb-4" style={{ color: colors.mutedText }}>
                  Set the restaurant's location to prevent tablets from being used outside the premises. Tablets will be blocked if moved beyond the specified radius.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={geofenceLat}
                      onChange={(e) => {
                        setGeofenceLat(e.target.value);
                        setGeofenceError('');
                        setGeofenceSaved(false);
                      }}
                      placeholder="e.g., 6.5244"
                      className="w-full px-4 py-3 rounded-lg text-xl"
                      style={{
                        background: colors.background,
                        border: `1px solid ${geofenceError ? '#EF4444' : colors.cardBorder}`,
                        color: colors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={geofenceLon}
                      onChange={(e) => {
                        setGeofenceLon(e.target.value);
                        setGeofenceError('');
                        setGeofenceSaved(false);
                      }}
                      placeholder="e.g., 3.3792"
                      className="w-full px-4 py-3 rounded-lg text-xl"
                      style={{
                        background: colors.background,
                        border: `1px solid ${geofenceError ? '#EF4444' : colors.cardBorder}`,
                        color: colors.text,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                    Radius (meters)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="5"
                    value={geofenceRadius}
                    onChange={(e) => {
                      setGeofenceRadius(e.target.value);
                      setGeofenceError('');
                      setGeofenceSaved(false);
                    }}
                    placeholder="50"
                    className="w-full px-4 py-3 rounded-lg text-xl"
                    style={{
                      background: colors.background,
                      border: `1px solid ${geofenceError ? '#EF4444' : colors.cardBorder}`,
                      color: colors.text,
                    }}
                  />
                  <p className="text-sm mt-1" style={{ color: colors.mutedText }}>
                    Radius must be between 1 and 1000 meters
                  </p>
                </div>

                {geofenceError && (
                  <p className="text-base flex items-center gap-2" style={{ color: '#EF4444' }}>
                    <IoCloseCircleOutline className="h-5 w-5" />
                    {geofenceError}
                  </p>
                )}
                {geofenceSaved && !geofenceError && (
                  <p className="text-base flex items-center gap-2" style={{ color: '#10B981' }}>
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    Geofence settings saved successfully!
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ background: colors.blue600 || '#2563EB' }}
                  >
                    <IoLocationOutline className="h-5 w-5" />
                    {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                  </button>
                  <button
                    onClick={handleSaveGeofence}
                    className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
                    style={{ background: colors.amber500 }}
                  >
                    Save Geofence
                  </button>
                  {geofenceLat && geofenceLon && (
                    <button
                      onClick={handleClearGeofence}
                      className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                      style={{
                        background: colors.cardBg,
                        border: `1px solid ${colors.cardBorder}`,
                        color: colors.text,
                      }}
                    >
                      Clear Geofence
                    </button>
                  )}
                </div>
              </div>

              {geofenceLat && geofenceLon && (
                <div className="mt-6 p-4 rounded-lg" style={{ background: theme === 'light' ? '#EFF6FF' : '#1E3A5F', border: `1px solid ${theme === 'light' ? '#BFDBFE' : '#3B5F8F'}` }}>
                  <p className="text-base font-medium" style={{ color: theme === 'light' ? '#1E40AF' : '#93C5FD' }}>
                    ✓ Geofence Active
                  </p>
                  <p className="text-sm mt-1" style={{ color: theme === 'light' ? '#1E3A8A' : '#60A5FA' }}>
                    Restaurant Location: {geofenceLat}, {geofenceLon}
                  </p>
                  <p className="text-sm mt-1" style={{ color: theme === 'light' ? '#1E3A8A' : '#60A5FA' }}>
                    Radius: {geofenceRadius} meters (~{Math.round(geofenceRadius * 3.28084)} feet)
                  </p>
                  <p className="text-xs mt-2" style={{ color: theme === 'light' ? '#1E3A8A' : '#60A5FA' }}>
                    Tablets will be blocked if moved outside this area.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pre-Order Settings */}
          <div className="rounded-xl p-6 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: colors.blue600 || '#2563EB', color: '#fff' }}>
                <IoTimeOutline className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Pre-Order Settings</h2>
                <p className="text-base" style={{ color: colors.mutedText }}>Configure when customers can place pre-orders</p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="preOrderEnabled"
                  checked={preOrderEnabled}
                  onChange={(e) => {
                    setPreOrderEnabled(e.target.checked);
                    setPreOrderSaved(false);
                    setPreOrderError('');
                  }}
                  className="w-5 h-5"
                />
                <label htmlFor="preOrderEnabled" className="text-base font-medium" style={{ color: colors.text }}>
                  Enable Pre-Orders
                </label>
              </div>

              {preOrderEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={preOrderStartTime}
                        onChange={(e) => {
                          setPreOrderStartTime(e.target.value);
                          setPreOrderSaved(false);
                          setPreOrderError('');
                        }}
                        className="w-full px-4 py-3 rounded-lg text-xl"
                        style={{
                          background: colors.background,
                          border: `1px solid ${preOrderError ? '#EF4444' : colors.cardBorder}`,
                          color: colors.text,
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                        End Time
                      </label>
                      <input
                        type="time"
                        value={preOrderEndTime}
                        onChange={(e) => {
                          setPreOrderEndTime(e.target.value);
                          setPreOrderSaved(false);
                          setPreOrderError('');
                        }}
                        className="w-full px-4 py-3 rounded-lg text-xl"
                        style={{
                          background: colors.background,
                          border: `1px solid ${preOrderError ? '#EF4444' : colors.cardBorder}`,
                          color: colors.text,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium mb-2" style={{ color: colors.text }}>
                      Available Days
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {dayNames.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => handleToggleDay(index)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            preOrderDays.includes(index) ? 'text-white' : ''
                          }`}
                          style={{
                            background: preOrderDays.includes(index) ? colors.amber500 : colors.cardBg,
                            border: `1px solid ${preOrderDays.includes(index) ? colors.amber500 : colors.cardBorder}`,
                            color: preOrderDays.includes(index) ? '#fff' : colors.text,
                          }}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm mt-2" style={{ color: colors.mutedText }}>
                      Select the days when pre-orders are available
                    </p>
                  </div>

                  {preOrderError && (
                    <p className="text-base flex items-center gap-2" style={{ color: '#EF4444' }}>
                      <IoCloseCircleOutline className="h-5 w-5" />
                      {preOrderError}
                    </p>
                  )}
                  {preOrderSaved && !preOrderError && (
                    <p className="text-base flex items-center gap-2" style={{ color: '#10B981' }}>
                      <IoCheckmarkCircleOutline className="h-5 w-5" />
                      Pre-order settings saved successfully!
                    </p>
                  )}

                  <button
                    onClick={handleSavePreOrder}
                    className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
                    style={{ background: colors.amber500 }}
                  >
                    Save Pre-Order Settings
                  </button>
                </>
              )}

              {preOrderEnabled && (
                <div className="mt-6 p-4 rounded-lg" style={{ background: theme === 'light' ? '#EFF6FF' : '#1E3A5F', border: `1px solid ${theme === 'light' ? '#BFDBFE' : '#3B5F8F'}` }}>
                  <p className="text-base font-medium" style={{ color: theme === 'light' ? '#1E40AF' : '#93C5FD' }}>
                    ✓ Pre-Orders Active
                  </p>
                  <p className="text-sm mt-1" style={{ color: theme === 'light' ? '#1E3A8A' : '#60A5FA' }}>
                    Time: {preOrderStartTime} - {preOrderEndTime}
                  </p>
                  <p className="text-sm mt-1" style={{ color: theme === 'light' ? '#1E3A8A' : '#60A5FA' }}>
                    Days: {preOrderDays.map(d => dayNames[d].slice(0, 3)).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Landing Page Settings */}
          <div className="rounded-xl p-6 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: colors.green500 || '#10B981', color: '#fff' }}>
                🏠
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Landing Page Settings</h2>
                <p className="text-base" style={{ color: colors.mutedText }}>Choose which page visitors see when they visit the root URL</p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-base font-medium mb-3" style={{ color: colors.text }}>
                  Default Landing Page
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setLandingPageState('main');
                      setLandingPageSaved(false);
                      setLandingPageError('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      landingPage === 'main'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      background: landingPage === 'main' 
                        ? (theme === 'light' ? '#F0FDF4' : '#1A2E1A')
                        : colors.cardBg,
                      borderColor: landingPage === 'main' 
                        ? colors.green500 || '#10B981'
                        : colors.cardBorder
                    }}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-lg mb-1" style={{ color: colors.text }}>
                        Main Page
                      </div>
                      <div className="text-sm" style={{ color: colors.mutedText }}>
                        Standard menu browsing and ordering
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setLandingPageState('preorder');
                      setLandingPageSaved(false);
                      setLandingPageError('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      landingPage === 'preorder'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      background: landingPage === 'preorder' 
                        ? (theme === 'light' ? '#FFF7ED' : '#2E1A0A')
                        : colors.cardBg,
                      borderColor: landingPage === 'preorder' 
                        ? colors.amber500 || '#F59E0B'
                        : colors.cardBorder
                    }}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-lg mb-1" style={{ color: colors.text }}>
                        Pre-Order Page
                      </div>
                      <div className="text-sm" style={{ color: colors.mutedText }}>
                        Pre-order for future pickup or delivery
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {landingPageError && (
                <p className="text-base flex items-center gap-2" style={{ color: '#EF4444' }}>
                  <IoCloseCircleOutline className="h-5 w-5" />
                  {landingPageError}
                </p>
              )}
              {landingPageSaved && !landingPageError && (
                <p className="text-base flex items-center gap-2" style={{ color: '#10B981' }}>
                  <IoCheckmarkCircleOutline className="h-5 w-5" />
                  Landing page setting saved successfully!
                </p>
              )}

              <button
                onClick={handleSaveLandingPage}
                className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
                style={{ background: colors.amber500 }}
              >
                Save Landing Page Setting
              </button>

              <div className="mt-4 p-4 rounded-lg" style={{ background: theme === 'light' ? '#EFF6FF' : '#1E3A5F', border: `1px solid ${theme === 'light' ? '#BFDBFE' : '#3B5F8F'}` }}>
                <p className="text-sm font-medium mb-2" style={{ color: theme === 'light' ? '#1E40AF' : '#93C5FD' }}>
                  ℹ️ How it works:
                </p>
                <ul className="text-sm space-y-1" style={{ color: theme === 'light' ? '#1E3A8A' : '#60A5FA' }}>
                  <li>• When set to "Pre-Order Page", visitors to the root URL will be redirected to /preorder</li>
                  <li>• When set to "Main Page", visitors will see the standard menu page</li>
                  <li>• You can switch between them anytime from this settings page</li>
                  <li>• Use this to disable pre-orders by switching back to the main page when the pre-order period ends</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-xl p-6" style={{ background: theme === 'light' ? '#FEF3C7' : '#3A2A1A', border: `1px solid ${theme === 'light' ? '#FDE68A' : '#5C4A2A'}` }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>How it works:</h3>
            <ul className="space-y-2 text-base" style={{ color: colors.mutedText }}>
              <li>• Set the table number for this tablet using the form above</li>
              <li>• The table number is stored locally on this device</li>
              <li>• When customers place dine-in orders, the table number is automatically included</li>
              <li>• Waiters can see the table number in the admin orders page</li>
              <li>• Customers can override the table number during checkout if needed</li>
              <li className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                <strong>Geofencing:</strong> Set the restaurant location to prevent tablets from being used outside the premises. Tablets will be blocked if moved beyond the specified radius.
              </li>
              <li className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                <strong>Pre-Orders:</strong> Enable pre-orders and set the time window when customers can place orders ahead of time. The pre-order page will automatically disable when outside the configured time window.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

