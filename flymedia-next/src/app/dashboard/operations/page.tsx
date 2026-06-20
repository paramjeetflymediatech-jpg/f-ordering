'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  MonitorPlay,
  Truck,
  Plus,
  ArrowRight,
  ChevronLeft,
  Settings,
  ShieldAlert,
  MapPin,
  Printer,
  Table,
  Cpu,
  Clock,
  CreditCard,
  Trash2,
  Edit,
  CheckCircle,
  X,
  FileText,
  Calendar,
  QrCode,
  Map,
  Globe,
} from 'lucide-react';

export default function AdvanceSetupPage() {
  const { data: session } = useSession();

  // Active view: 'dashboard' | 'delivery-zones' | 'delivery-rules' | 'rule-form' | 'locations' | 'location-form' | 'order-types' | 'surcharges' | 'printers'
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'delivery-zones' | 'delivery-rules' | 'rule-form' | 'locations' | 'location-form' | 'order-types' | 'surcharges' | 'printers'>('dashboard');

  // Printers & IOT Devices State
  const [printers, setPrinters] = useState<any[]>([
    { id: 'p1', seq: 1, name: 'WARNERS: ONLINE ORDER', location: 'Warners Bay', ip: 'http://10.0.0.22:80', type: 'Printer', status: 'active' },
    { id: 'p2', seq: 2, name: 'WW - POS PRINTER', location: 'Warners Bay', ip: '—', type: 'Printer', status: 'active' },
  ]);

  const [otherDevices, setOtherDevices] = useState<any[]>([
    { id: 'd1', seq: 1, name: 'DRINKS', type: 'POS Printer', location: 'Warners Bay', description: 'DRINKS', lastUpdate: '29/07/26 @ 02:45 PM', status: 'active' },
    { id: 'd2', seq: 2, name: 'DESSERTS', type: 'POS Printer', location: 'Warners Bay', description: 'DESSERTS', lastUpdate: '29/07/26 @ 02:45 PM', status: 'active' },
    { id: 'd3', seq: 3, name: 'SIDES', type: 'POS Printer', location: 'Warners Bay', description: 'SIDES', lastUpdate: '29/07/26 @ 02:44 PM', status: 'active' },
    { id: 'd4', seq: 4, name: 'MAINS', type: 'POS Printer', location: 'Warners Bay', description: 'MAINS', lastUpdate: '29/07/26 @ 02:44 PM', status: 'active' },
    { id: 'd5', seq: 5, name: 'ENTREE', type: 'POS Printer', location: 'Warners Bay', description: 'ENTREE', lastUpdate: '29/07/26 @ 02:44 PM', status: 'active' },
  ]);

  // Printers filter state
  const [deviceFilterName, setDeviceFilterName] = useState('');
  const [deviceFilterType, setDeviceFilterType] = useState('');
  const [deviceFilterLocation, setDeviceFilterLocation] = useState('');
  const [deviceFilterDesc, setDeviceFilterDesc] = useState('');

  // Add Printer/Device Form Modals
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [showAddOtherDeviceModal, setShowAddOtherDeviceModal] = useState(false);

  // Form fields
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterIp, setNewPrinterIp] = useState('');
  const [newPrinterLocation, setNewPrinterLocation] = useState('Warners Bay');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('POS Printer');
  const [newDeviceDesc, setNewDeviceDesc] = useState('');


  // Zones & Rules state
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  // Locations state
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locLoading, setLocLoading] = useState(false);

  // Location Form state
  const [locName, setLocName] = useState('');
  const [locPhone, setLocPhone] = useState('');
  const [locEmail, setLocEmail] = useState('');
  const [locStreet, setLocStreet] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locZipCode, setLocZipCode] = useState('');
  const [locSuburb, setLocSuburb] = useState('');
  const [locCountry, setLocCountry] = useState('Australia');
  const [locState, setLocState] = useState('');
  const [locOnlineStore, setLocOnlineStore] = useState(true);
  const [locCategory, setLocCategory] = useState('Restaurants');

  // Order types config state
  const [channelsConfig, setChannelsConfig] = useState<any>({
    POS: [
      { name: 'Take Away', methods: 'EFTPOS,Cash,Others', active: true, isDefault: true, extraCharges: 0, prepTime: 15 },
      { name: 'Dine-In', methods: 'EFTPOS,Cash,Others', active: true, isDefault: false, extraCharges: 0, prepTime: 20 },
      { name: 'Bar Tabs', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 0 },
      { name: 'Delivery', methods: 'Cash,EFTPOS,Bank Transfer', active: true, isDefault: false, extraCharges: 0, prepTime: 30 },
      { name: 'Walk-In', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 10 },
      { name: 'Phone Order', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 15 },
      { name: 'Pickup', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 15 },
      { name: 'Eat at Truck', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 15 },
      { name: 'Catering', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 120 },
      { name: 'ThirdParty', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 20 },
      { name: 'Event Booking', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 240 },
    ],
    Online: [
      { name: 'Take Away', methods: 'EFTPOS,Cash,Others', active: true, isDefault: true, extraCharges: 0, prepTime: 15 },
      { name: 'Delivery', methods: 'Cash,EFTPOS,Bank Transfer', active: true, isDefault: false, extraCharges: 0, prepTime: 30 },
      { name: 'Pickup', methods: 'Cash,EFTPOS,Bank Transfer', active: true, isDefault: false, extraCharges: 0, prepTime: 15 },
      { name: 'Catering', methods: 'Cash,EFTPOS,Bank Transfer', active: false, isDefault: false, extraCharges: 0, prepTime: 120 },
    ],
    App: [
      { name: 'Take Away', methods: 'EFTPOS,Cash,Others', active: true, isDefault: true, extraCharges: 0, prepTime: 15 },
      { name: 'Dine-In', methods: 'EFTPOS,Cash,Others', active: false, isDefault: false, extraCharges: 0, prepTime: 20 },
      { name: 'Delivery', methods: 'Cash,EFTPOS,Bank Transfer', active: true, isDefault: false, extraCharges: 0, prepTime: 30 },
      { name: 'Pickup', methods: 'Cash,EFTPOS,Bank Transfer', active: true, isDefault: false, extraCharges: 0, prepTime: 15 },
    ]
  });
  const [selectedChannel, setSelectedChannel] = useState<'POS' | 'Online' | 'App'>('POS');

  // Surcharges state
  const [surcharges, setSurcharges] = useState<any[]>([
    { mode: 'Cash', percentage: 0, amount: 0 },
    { mode: 'EFTPOS', percentage: 0, amount: 0 },
    { mode: 'Bank Transfer', percentage: 0, amount: 0 },
    { mode: 'Paytm', percentage: 0, amount: 0 },
    { mode: 'Cheque', percentage: 0, amount: 0 },
    { mode: 'Others', percentage: 0, amount: 0 },
    { mode: 'Pay at Counter', percentage: 0, amount: 0 },
    { mode: 'Cash on Delivery', percentage: 0, amount: 0 },
    { mode: 'Loyalty Points', percentage: 0, amount: 0 },
    { mode: 'Online Payment', percentage: 0, amount: 0 },
  ]);

  // Zone Form states
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState<'RADIAL DISTANCE' | 'ZIPCODE'>('ZIPCODE');
  const [zoneCountry, setZoneCountry] = useState('Australia');
  const [zoneDistance, setZoneDistance] = useState('');
  const [zoneState, setZoneState] = useState('');
  const [zoneCity, setZoneCity] = useState('');
  const [zoneZip, setZoneZip] = useState('');
  const [zoneLocality, setZoneLocality] = useState('');
  const [showZoneModal, setShowZoneModal] = useState(false);

  // Rule Form states
  const [ruleName, setRuleName] = useState('');
  const [ruleSequence, setRuleSequence] = useState('1');
  const [ruleCharge, setRuleCharge] = useState('0');
  const [ruleCurrency, setRuleCurrency] = useState('AUD');
  const [ruleEstDelivery, setRuleEstDelivery] = useState('30');
  const [ruleEstDeliveryUnit, setRuleEstDeliveryUnit] = useState('Minute');
  const [ruleMinOrderVal, setRuleMinOrderVal] = useState('0');
  const [ruleFreeAbove, setRuleFreeAbove] = useState('999999999');
  const [ruleStartDate, setRuleStartDate] = useState('2026-06-20');
  const [ruleEndDate, setRuleEndDate] = useState('9999-12-31');
  const [ruleProvider, setRuleProvider] = useState('Self Managed');
  const [ruleChargeByItem, setRuleChargeByItem] = useState(false);
  const [ruleDescription, setRuleDescription] = useState('');

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      setLocLoading(true);
      const res = await fetch('/api/dashboard/locations');
      const data = await res.json();
      if (data.success) {
        setLocations(data.locations || []);
      } else {
        triggerAlert(data.error || 'Failed to load locations.', true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLocLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/delivery-zones');
      const data = await res.json();
      if (data.success) {
        setZones(data.zones || []);
        
        // Seed default zones if completely empty
        if (data.zones?.length === 0) {
          await seedDefaultZones();
        }
      } else {
        triggerAlert(data.error || 'Failed to load zones.', true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    fetchLocations();
    // Load local storage states for order types, surcharges, and printers
    if (typeof window !== 'undefined') {
      const savedChannels = localStorage.getItem('channelsConfig');
      if (savedChannels) {
        try { setChannelsConfig(JSON.parse(savedChannels)); } catch(e){}
      }
      const savedSurcharges = localStorage.getItem('surchargesConfig');
      if (savedSurcharges) {
        try { setSurcharges(JSON.parse(savedSurcharges)); } catch(e){}
      }
      const savedPrinters = localStorage.getItem('printersConfig');
      if (savedPrinters) {
        try { setPrinters(JSON.parse(savedPrinters)); } catch(e){}
      }
      const savedOtherDevices = localStorage.getItem('otherDevicesConfig');
      if (savedOtherDevices) {
        try { setOtherDevices(JSON.parse(savedOtherDevices)); } catch(e){}
      }
    }
  }, []);

  const triggerAlert = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const seedDefaultZones = async () => {
    // List of standard mock zones to seed
    const defaults = [
      { name: '12 km zone', type: 'RADIAL DISTANCE', distance: 12, zip: '' },
      { name: '5 km zone', type: 'RADIAL DISTANCE', distance: 5, zip: '' },
      { name: 'Zipcode 2306', type: 'ZIPCODE', distance: null, zip: '2306', state: 'NSW', city: 'Sydney' },
      { name: 'Zipcode 2290', type: 'ZIPCODE', distance: null, zip: '2290', state: 'NSW', city: 'Sydney' },
      { name: 'Zipcode 2289', type: 'ZIPCODE', distance: null, zip: '2289', state: 'NSW', city: 'Sydney' },
    ];

    try {
      for (const d of defaults) {
        await fetch('/api/dashboard/delivery-zones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'zone',
            name: d.name,
            zoneType: d.type,
            distance: d.distance,
            zip: d.zip,
            state: d.state || '',
            city: d.city || '',
          }),
        });
      }
      // Re-fetch
      const res = await fetch('/api/dashboard/delivery-zones');
      const data = await res.json();
      if (data.success) {
        setZones(data.zones || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Zone
  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    try {
      const res = await fetch('/api/dashboard/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'zone',
          name: zoneName,
          zoneType,
          country: zoneCountry,
          distance: zoneDistance || null,
          state: zoneState || null,
          city: zoneCity || null,
          zip: zoneZip || null,
          locality: zoneLocality || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowZoneModal(false);
        clearZoneForm();
        triggerAlert('Zone added successfully.');
        await fetchZones();
      } else {
        triggerAlert(data.error || 'Failed to add zone.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle zone active status
  const handleToggleZoneStatus = async (zone: any) => {
    try {
      const res = await fetch('/api/dashboard/delivery-zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'zone',
          id: zone.id,
          isActive: !zone.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Zone status updated.');
        await fetchZones();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Zone
  const handleDeleteZone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone and all its shipping rules?')) return;
    try {
      const res = await fetch(`/api/dashboard/delivery-zones?id=${id}&type=zone`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Zone deleted.');
        await fetchZones();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add/Edit Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !selectedZone) return;

    try {
      const isEdit = !!selectedRule;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch('/api/dashboard/delivery-zones', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rule',
          id: isEdit ? selectedRule.id : undefined,
          zoneId: selectedZone.id,
          name: ruleName,
          sequence: ruleSequence,
          charge: ruleCharge,
          estimatedDelivery: ruleEstDelivery,
          minOrderValue: ruleMinOrderVal,
          freeFreeDeliveryAbove: ruleFreeAbove,
          startDate: ruleStartDate,
          endDate: ruleEndDate,
          provider: ruleProvider,
          chargeByItem: ruleChargeByItem,
          description: ruleDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert(isEdit ? 'Rule updated successfully.' : 'Rule created successfully.');
        clearRuleForm();
        setSelectedRule(null);
        setActiveSubView('delivery-rules');
        // Refresh zones state
        const refreshRes = await fetch('/api/dashboard/delivery-zones');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setZones(refreshData.zones || []);
          const updatedZone = refreshData.zones.find((z: any) => z.id === selectedZone.id);
          setSelectedZone(updatedZone);
        }
      } else {
        triggerAlert(data.error || 'Failed to save rule.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Rule
  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery rule?')) return;
    try {
      const res = await fetch(`/api/dashboard/delivery-zones?id=${id}&type=rule`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Rule deleted.');
        // Refresh
        const refreshRes = await fetch('/api/dashboard/delivery-zones');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setZones(refreshData.zones || []);
          const updatedZone = refreshData.zones.find((z: any) => z.id === selectedZone.id);
          setSelectedZone(updatedZone);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearZoneForm = () => {
    setZoneName('');
    setZoneType('ZIPCODE');
    setZoneCountry('Australia');
    setZoneDistance('');
    setZoneState('');
    setZoneCity('');
    setZoneZip('');
    setZoneLocality('');
  };

  const clearRuleForm = () => {
    setRuleName('');
    setRuleSequence('1');
    setRuleCharge('0');
    setRuleCurrency('AUD');
    setRuleEstDelivery('30');
    setRuleEstDeliveryUnit('Minute');
    setRuleMinOrderVal('0');
    setRuleFreeAbove('999999999');
    setRuleStartDate('2026-06-20');
    setRuleEndDate('9999-12-31');
    setRuleProvider('Self Managed');
    setRuleChargeByItem(false);
    setRuleDescription('');
  };

  const handleEditRuleClick = (rule: any) => {
    setSelectedRule(rule);
    setRuleName(rule.name);
    setRuleSequence(rule.sequence?.toString() || '1');
    setRuleCharge(rule.charge?.toString() || '0');
    setRuleEstDelivery(rule.estimated_delivery?.toString() || '30');
    setRuleMinOrderVal(rule.min_order_value?.toString() || '0');
    setRuleFreeAbove(rule.free_delivery_above?.toString() || '999999999');
    setRuleStartDate(rule.start_date);
    setRuleEndDate(rule.end_date);
    setRuleProvider(rule.provider || 'Self Managed');
    setRuleChargeByItem(rule.charge_by_item || false);
    setRuleDescription(rule.description || '');
    setActiveSubView('rule-form');
  };

  // Location handlers
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locStreet.trim() || !locPhone.trim()) return;

    try {
      const isEdit = !!selectedLocation;
      const method = isEdit ? 'PUT' : 'POST';
      const bodyPayload = {
        id: isEdit ? selectedLocation.id : undefined,
        name: locName,
        phone: locPhone,
        email: locEmail,
        address: locStreet,
        city: locCity,
        state: locState,
        zip_code: locZipCode,
        country: locCountry,
        category: locCategory,
        description: locSuburb, // use description to hold suburb
      };

      const res = await fetch('/api/dashboard/locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert(isEdit ? 'Location updated successfully.' : 'Location created successfully.');
        clearLocationForm();
        setSelectedLocation(null);
        setActiveSubView('locations');
        await fetchLocations();
      } else {
        triggerAlert(data.error || 'Failed to save location.', true);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to save location.', true);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      const res = await fetch(`/api/dashboard/locations?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Location deleted.');
        await fetchLocations();
      } else {
        triggerAlert(data.error || 'Failed to delete location.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditLocationClick = (loc: any) => {
    setSelectedLocation(loc);
    setLocName(loc.name || '');
    setLocPhone(loc.phone || '');
    setLocEmail(loc.email || '');
    setLocStreet(loc.address || '');
    setLocCity(loc.city || '');
    setLocZipCode(loc.zip_code || '');
    setLocSuburb(loc.description || ''); // using description as Suburb
    setLocCountry(loc.country || 'Australia');
    setLocState(loc.state || '');
    setLocCategory(loc.category || 'Restaurants');
    setLocOnlineStore(true);
    setActiveSubView('location-form');
  };

  const clearLocationForm = () => {
    setLocName('');
    setLocPhone('');
    setLocEmail('');
    setLocStreet('');
    setLocCity('');
    setLocZipCode('');
    setLocSuburb('');
    setLocCountry('Australia');
    setLocState('');
    setLocCategory('Restaurants');
    setLocOnlineStore(true);
  };

  // Order types handlers
  const handleSaveOrderTypes = () => {
    localStorage.setItem('channelsConfig', JSON.stringify(channelsConfig));
    triggerAlert('Order and Payment types updated successfully.');
  };

  const handleSaveSurcharges = () => {
    localStorage.setItem('surchargesConfig', JSON.stringify(surcharges));
    triggerAlert('Payment surcharges updated successfully.');
  };

  const handleToggleOrderTypeActive = (index: number) => {
    const updated = { ...channelsConfig };
    updated[selectedChannel][index].active = !updated[selectedChannel][index].active;
    setChannelsConfig(updated);
  };

  const handleSetDefaultOrderType = (index: number) => {
    const updated = { ...channelsConfig };
    updated[selectedChannel] = updated[selectedChannel].map((item: any, idx: number) => ({
      ...item,
      isDefault: idx === index
    }));
    setChannelsConfig(updated);
  };

  const handleSurchargeChange = (index: number, field: 'percentage' | 'amount', value: string) => {
    const updated = [...surcharges];
    updated[index][field] = parseFloat(value) || 0;
    setSurcharges(updated);
  };

  // Add IOT Printer Device
  const handleAddPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrinterName.trim()) return;

    const newPrinter = {
      id: 'p_' + Date.now(),
      seq: printers.length + 1,
      name: newPrinterName,
      location: newPrinterLocation,
      ip: newPrinterIp || '—',
      type: 'Printer',
      status: 'active'
    };

    const updated = [...printers, newPrinter];
    setPrinters(updated);
    localStorage.setItem('printersConfig', JSON.stringify(updated));
    setShowAddPrinterModal(false);
    setNewPrinterName('');
    setNewPrinterIp('');
    triggerAlert('IOT Printer Device added successfully.');
  };

  const handleDeletePrinter = (id: string) => {
    if (!confirm('Are you sure you want to delete this printer?')) return;
    const updated = printers.filter(p => p.id !== id).map((p, idx) => ({ ...p, seq: idx + 1 }));
    setPrinters(updated);
    localStorage.setItem('printersConfig', JSON.stringify(updated));
    triggerAlert('Printer deleted.');
  };

  // Add Other Device (POS print categories)
  const handleAddOtherDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    const newDev = {
      id: 'd_' + Date.now(),
      seq: otherDevices.length + 1,
      name: newDeviceName.toUpperCase(),
      type: newDeviceType,
      location: 'Warners Bay',
      description: (newDeviceDesc || newDeviceName).toUpperCase(),
      lastUpdate: new Date().toLocaleString(),
      status: 'active'
    };

    const updated = [...otherDevices, newDev];
    setOtherDevices(updated);
    localStorage.setItem('otherDevicesConfig', JSON.stringify(updated));
    setShowAddOtherDeviceModal(false);
    setNewDeviceName('');
    setNewDeviceDesc('');
    triggerAlert('Other POS Device added successfully.');
  };

  const handleDeleteOtherDevice = (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    const updated = otherDevices.filter(d => d.id !== id).map((d, idx) => ({ ...d, seq: idx + 1 }));
    setOtherDevices(updated);
    localStorage.setItem('otherDevicesConfig', JSON.stringify(updated));
    triggerAlert('Device deleted.');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full relative text-slate-200">
      
      {/* TOAST ALERTS */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-3 shadow-xl animate-slide-in">
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-bold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-red-500 text-white px-4 py-3 shadow-xl animate-slide-in">
          <X className="h-5 w-5" />
          <span className="text-xs font-bold">{errorMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MonitorPlay className="h-6 w-6 text-orange-500 animate-pulse" />
            Advance Operation Setup
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure system rules, payment method constraints, local printing nodes, delivery radius, and timing exclusions.
          </p>
        </div>
        {activeSubView !== 'dashboard' && (
          <button
            onClick={() => {
              if (activeSubView === 'rule-form') {
                setActiveSubView('delivery-rules');
              } else if (activeSubView === 'delivery-rules') {
                setActiveSubView('delivery-zones');
              } else if (activeSubView === 'location-form') {
                setActiveSubView('locations');
              } else {
                setActiveSubView('dashboard');
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
      </div>

      {/* 1. MAIN ADVANCE SETUP DASHBOARD VIEW */}
      {activeSubView === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Card: Order Types */}
          <div 
            onClick={() => setActiveSubView('order-types')}
            className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-105 transition">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Manage Order Types
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-orange-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Here you can configure your Order Type and their payment method for different Sales Channel.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Delivery Zones */}
          <div 
            onClick={() => setActiveSubView('delivery-zones')}
            className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 group-hover:scale-105 transition">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Manage Delivery Zone
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-sky-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Manage business delivery Zones and their rules. Setup radial limits or specific postal codes.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Payment Surcharge */}
          <div 
            onClick={() => setActiveSubView('surcharges')}
            className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Payment Surcharge
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-amber-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Add surcharge criteria according to payment method. Configure credit card processing fees.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Locations */}
          <div 
            onClick={() => setActiveSubView('locations')}
            className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Manage Locations
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-emerald-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Configure store locations, geofencing parameters, and local currency formats.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Printers */}
          <div 
            onClick={() => setActiveSubView('printers')}
            className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-105 transition">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Manage Printers
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-purple-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  View and manage kitchen receipt, label, and packaging printer devices.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Printer Assignments */}
          <div className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-500 group-hover:scale-105 transition">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Product Printer Assignment
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-fuchsia-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Assign Printer Category to Product or its variant in bulk using CSV spreadsheets.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Seating Arrangements */}
          <div className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 group-hover:scale-105 transition">
                <Table className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Seating Arrangement
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-teal-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  View and manage Seating Layouts, restaurant tables, and dining floor grids.
                </p>
              </div>
            </div>
          </div>

          {/* Card: IOT Devices */}
          <div 
            onClick={() => setActiveSubView('printers')}
            className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:scale-105 transition">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Manage IOT Device
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-cyan-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Manage different IoT devices (e.g. Printer nodes, Kitchen Display screens, EFTPOS).
                </p>
              </div>
            </div>
          </div>

          {/* Card: Timing Groups */}
          <div className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 group-hover:scale-105 transition">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Timing Groups
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-pink-500" />
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Set store hours with timing groups for regular schedules and holiday exceptions.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. MANAGE DELIVERY ZONES VIEW */}
      {activeSubView === 'delivery-zones' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Manage Delivery Zones</h2>
              <p className="text-xs text-slate-500 mt-1">Configure active radius distance or specific postal zipcodes to enable delivery ordering channels.</p>
            </div>
            
            <button
              onClick={() => {
                clearZoneForm();
                setShowZoneModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow-lg shadow-orange-950/20"
            >
              <Plus className="h-4 w-4" />
              Add Zone
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4 text-center">Active</th>
                  <th className="p-4">Zone Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Country</th>
                  <th className="p-4 text-center">Distance (km)</th>
                  <th className="p-4">State</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Zipcode</th>
                  <th className="p-4">Rules</th>
                  <th className="p-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-400">Loading delivery zones...</td>
                  </tr>
                ) : zones.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-600 font-bold">No delivery zones configured yet.</td>
                  </tr>
                ) : (
                  zones.map((zone) => (
                    <tr key={zone.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={zone.is_active}
                          onChange={() => handleToggleZoneStatus(zone)}
                          className="h-4 w-4 accent-orange-500 cursor-pointer rounded border-slate-800 bg-slate-950"
                        />
                      </td>
                      <td className="p-4 font-bold text-white">{zone.name}</td>
                      <td className="p-4 font-semibold text-slate-400">{zone.type}</td>
                      <td className="p-4">{zone.country}</td>
                      <td className="p-4 text-center font-bold">{zone.distance !== null ? `${zone.distance} km` : '—'}</td>
                      <td className="p-4">{zone.state || '—'}</td>
                      <td className="p-4">{zone.city || '—'}</td>
                      <td className="p-4 font-mono font-bold text-orange-400">{zone.zip || '—'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setSelectedZone(zone);
                            setActiveSubView('delivery-rules');
                          }}
                          className="rounded-lg bg-orange-600/10 border border-orange-500/20 text-[#f59e0b] hover:bg-orange-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide transition flex items-center gap-1"
                        >
                          <Truck className="h-3 w-3" />
                          Rules ({zone.rules?.length || 0})
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MANAGE SHIPPING DETAILS RULES VIEW */}
      {activeSubView === 'delivery-rules' && selectedZone && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Manage Shipping Details Zone: {selectedZone.name}</h2>
              <p className="text-xs text-slate-500 mt-1">Configure shipping rates, delivery sequence, minimum checkout amounts, and lead times.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearRuleForm();
                  setSelectedRule(null);
                  setActiveSubView('rule-form');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow"
              >
                <Plus className="h-4 w-4" />
                Create Rule
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Rule Name</th>
                  <th className="p-4 text-center">Sequence</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4 text-right">Min Order Amt</th>
                  <th className="p-4 text-right">Free Delivery limit</th>
                  <th className="p-4 text-right">Charge</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedZone.rules || selectedZone.rules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500 font-bold">
                      No delivery rules attached to this zone yet. Click "Create Rule" to add one.
                    </td>
                  </tr>
                ) : (
                  selectedZone.rules.map((rule: any) => (
                    <tr key={rule.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                      <td className="p-4 font-bold text-white">{rule.name}</td>
                      <td className="p-4 text-center font-semibold">{rule.sequence}</td>
                      <td className="p-4 max-w-[200px] truncate text-slate-400" title={rule.description || ''}>
                        {rule.description || '—'}
                      </td>
                      <td className="p-4 font-semibold text-slate-400">{rule.provider}</td>
                      <td className="p-4 text-right font-bold text-white">${parseFloat(rule.min_order_value).toFixed(2)}</td>
                      <td className="p-4 text-right text-slate-500">
                        {parseFloat(rule.free_delivery_above) >= 999999 ? 'No Free Delivery' : `$${parseFloat(rule.free_delivery_above).toFixed(2)}`}
                      </td>
                      <td className="p-4 text-right font-black text-[#f59e0b]">${parseFloat(rule.charge).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditRuleClick(rule)}
                            className="rounded-lg bg-slate-900 p-2 text-slate-400 hover:text-white border border-slate-800"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CONFIGURE SHIPPING DETAILS RULE FORM VIEW */}
      {activeSubView === 'rule-form' && selectedZone && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">
              {selectedRule ? 'Edit Shipping details rule' : 'Configure Shipping details rule'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure parameters for delivery calculations linked to: {selectedZone.name}</p>
          </div>

          <form onSubmit={handleSaveRule} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="text-slate-400 font-bold block mb-2">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Delivery 12 km"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-2">Sequence *</label>
                <input
                  type="number"
                  required
                  value={ruleSequence}
                  onChange={(e) => setRuleSequence(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-2">Delivery Charge Fee *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ruleCharge}
                    onChange={(e) => setRuleCharge(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-2">Currency</label>
                  <select
                    value={ruleCurrency}
                    onChange={(e) => setRuleCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-400 outline-none focus:border-orange-500 transition"
                  >
                    <option value="AUD">AUD ($)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-2">Estimated Lead Time *</label>
                  <input
                    type="number"
                    required
                    value={ruleEstDelivery}
                    onChange={(e) => setRuleEstDelivery(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-2">Estimated Unit</label>
                  <select
                    value={ruleEstDeliveryUnit}
                    onChange={(e) => setRuleEstDeliveryUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-400 outline-none focus:border-orange-500 transition"
                  >
                    <option value="Minute">Minute</option>
                    <option value="Hour">Hour</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-2">Min order value to accept order</label>
                <input
                  type="number"
                  step="0.01"
                  value={ruleMinOrderVal}
                  onChange={(e) => setRuleMinOrderVal(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-2">Free Delivery over and above of</label>
                <input
                  type="number"
                  step="0.01"
                  value={ruleFreeAbove}
                  onChange={(e) => setRuleFreeAbove(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={ruleStartDate}
                    onChange={(e) => setRuleStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    value={ruleEndDate}
                    onChange={(e) => setRuleEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-2">Provider details &rarr; Provider *</label>
                <select
                  value={ruleProvider}
                  onChange={(e) => setRuleProvider(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-400 outline-none focus:border-orange-500 transition"
                  required
                >
                  <option value="Self Managed">Self Managed (In-House Driver)</option>
                  <option value="DoorDash Drive">DoorDash Drive Logistics</option>
                  <option value="Uber Direct">Uber Direct Delivery</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="charge-by-item"
                  checked={ruleChargeByItem}
                  onChange={(e) => setRuleChargeByItem(e.target.checked)}
                  className="h-4 w-4 accent-orange-500 cursor-pointer rounded border-slate-800 bg-slate-950"
                />
                <label htmlFor="charge-by-item" className="text-slate-300 font-bold cursor-pointer">
                  Charge delivery fee per individual item in order basket
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-400 font-bold block mb-2">Rule description</label>
                <textarea
                  placeholder="Standard delivery details or shipping warnings..."
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white h-20 outline-none resize-none focus:border-orange-500 transition"
                />
              </div>

            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  clearRuleForm();
                  setSelectedRule(null);
                  setActiveSubView('delivery-rules');
                }}
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 py-3 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition"
              >
                {selectedRule ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2b. MANAGE LOCATIONS VIEW */}
      {activeSubView === 'locations' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Manage Locations</h2>
              <p className="text-xs text-slate-500 mt-1">View and manage store locations, operational parameters, and QR check-in codes.</p>
            </div>
            
            <button
              onClick={() => {
                clearLocationForm();
                setSelectedLocation(null);
                setActiveSubView('location-form');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4 text-center">Sr. no.</th>
                  <th className="p-4">Location Name</th>
                  <th className="p-4">Loc Id</th>
                  <th className="p-4">Location Type</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Checkin Code</th>
                  <th className="p-4">Phone no.</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Country</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-400">Loading locations...</td>
                  </tr>
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-600 font-bold">No locations configured yet.</td>
                  </tr>
                ) : (
                  locations.map((loc, idx) => (
                    <tr key={loc.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                      <td className="p-4 text-center font-semibold text-slate-500">{idx + 1}</td>
                      <td className="p-4 font-bold text-white">{loc.name}</td>
                      <td className="p-4 font-mono text-[10px] text-slate-400">{loc.id.substring(0, 8)}</td>
                      <td className="p-4 text-slate-400">{loc.category || 'Restaurants'}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Open
                        </span>
                      </td>
                      <td className="p-4 text-center flex justify-center">
                        <div className="p-1.5 bg-white rounded-lg inline-block border border-slate-800 shadow cursor-pointer hover:scale-105 transition" title="Click to view QR code">
                          <QrCode className="h-5 w-5 text-slate-950" />
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-400">{loc.phone}</td>
                      <td className="p-4">{loc.city || '—'}</td>
                      <td className="p-4 uppercase font-bold text-orange-400">{loc.country ? loc.country.substring(0, 2) : '—'}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditLocationClick(loc)}
                            className="rounded-lg bg-slate-900 p-2 text-slate-400 hover:text-white border border-slate-800"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLocation(loc.id)}
                            className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2c. ADD / EDIT LOCATION FORM VIEW */}
      {activeSubView === 'location-form' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">
                {selectedLocation ? 'Edit location' : 'Add New location'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configure physical coordinates, mapping parameters, and operational information.</p>
            </div>
            
            <button
              onClick={handleSaveLocation}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow"
            >
              <CheckCircle className="h-4 w-4" />
              {selectedLocation ? 'Save Changes' : 'Add Location'}
            </button>
          </div>

          <form onSubmit={handleSaveLocation} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
            {/* Left Column (Illustrated Hanging Closed/Open Sign & Configs) */}
            <div className="lg:col-span-4 space-y-6 flex flex-col items-center">
              
              {/* Hanging Illustrated Sign Board */}
              <div className="relative w-full max-w-[240px] aspect-square rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 p-6 flex flex-col justify-center items-center shadow-2xl group overflow-hidden">
                {/* Hanging Ropes */}
                <div className="absolute top-0 left-12 w-0.5 h-6 bg-slate-700 origin-top rotate-[15deg]"></div>
                <div className="absolute top-0 right-12 w-0.5 h-6 bg-slate-700 origin-top -rotate-[15deg]"></div>
                
                {/* Sign Plate */}
                <div className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-orange-500/40 bg-slate-900 flex flex-col items-center justify-center p-4 relative shadow-lg group-hover:scale-105 transition duration-300">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-700"></div>
                  
                  {locOnlineStore ? (
                    <>
                      <div className="text-center font-black tracking-widest text-emerald-500 text-base uppercase animate-pulse">OPEN</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">ONLINE STORE ACTIVE</div>
                    </>
                  ) : (
                    <>
                      <div className="text-center font-black tracking-widest text-red-500 text-base uppercase">CLOSED</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">OFFLINE</div>
                    </>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="online-store-toggle"
                    checked={locOnlineStore}
                    onChange={(e) => setLocOnlineStore(e.target.checked)}
                    className="h-4 w-4 accent-orange-500 cursor-pointer rounded border-slate-800 bg-slate-950"
                  />
                  <label htmlFor="online-store-toggle" className="text-slate-300 font-bold cursor-pointer">
                    Online Store Active
                  </label>
                </div>
              </div>

              {/* Location Type Option */}
              <div className="w-full max-w-[240px]">
                <label className="text-slate-400 font-bold block mb-2">Location Type *</label>
                <select
                  value={locCategory}
                  onChange={(e) => setLocCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-400 outline-none focus:border-orange-500 transition"
                  required
                >
                  <option value="Restaurants">Restaurants</option>
                  <option value="Retail Store">Retail Store</option>
                  <option value="Warehouse">Warehouse / Kitchen Node</option>
                  <option value="Express Outlet">Express Outlet</option>
                </select>
              </div>
            </div>

            {/* Right Column (Input Fields & Map Mockup) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1.5">Location Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warners Bay"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1.5">Phone no. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +61 249480092"
                    value={locPhone}
                    onChange={(e) => setLocPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1.5">E-mail</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@tgpwb.com.au"
                    value={locEmail}
                    onChange={(e) => setLocEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1.5">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 52 King Street"
                    value={locStreet}
                    onChange={(e) => setLocStreet(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1.5">Suburb / Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. Warners Bay"
                    value={locSuburb}
                    onChange={(e) => setLocSuburb(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1.5">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Sydney"
                      value={locCity}
                      onChange={(e) => setLocCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1.5">Zipcode</label>
                    <input
                      type="text"
                      placeholder="e.g. 2306"
                      value={locZipCode}
                      onChange={(e) => setLocZipCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1.5">State</label>
                    <select
                      value={locState}
                      onChange={(e) => setLocState(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-400 outline-none"
                    >
                      <option value="">===Select===</option>
                      <option value="NSW">New South Wales (NSW)</option>
                      <option value="VIC">Victoria (VIC)</option>
                      <option value="QLD">Queensland (QLD)</option>
                      <option value="WA">Western Australia (WA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1.5">Country</label>
                    <select
                      value={locCountry}
                      onChange={(e) => setLocCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-400 outline-none"
                    >
                      <option value="Australia">Australia</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="New Zealand">New Zealand</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Map Mockup Component */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-orange-500" />
                    <span className="font-bold text-white text-xs">Coordinates Mapping</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerAlert("Located location coordinates successfully.")}
                    className="rounded-lg bg-orange-600/15 border border-orange-500/20 text-[#f59e0b] hover:bg-orange-500/25 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition"
                  >
                    Locate Address on Map
                  </button>
                </div>

                {/* Simulated Google Map View */}
                <div className="relative w-full h-44 rounded-lg bg-slate-900 border border-slate-850 overflow-hidden flex items-center justify-center">
                  {/* Grid Lines styling */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
                  
                  {/* Sat/Map button */}
                  <div className="absolute top-2 left-2 flex gap-1 rounded-md bg-slate-950/80 p-0.5 border border-slate-800 z-10 text-[9px] font-bold text-slate-400">
                    <span className="px-2 py-0.5 bg-orange-600 text-white rounded">Map</span>
                    <span className="px-2 py-0.5">Satellite</span>
                  </div>

                  {/* Marker Pin */}
                  <div className="relative z-10 flex flex-col items-center animate-bounce">
                    <MapPin className="h-8 w-8 text-sky-500 fill-sky-500/20" />
                    <div className="h-1.5 w-4 bg-slate-950/60 rounded-full blur-[1px] -mt-0.5"></div>
                  </div>

                  {/* Map labels */}
                  <div className="absolute bottom-2 left-2 z-10 text-[9px] text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                    Lat: -37.798689, Lng: 144.973873
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 2d. MAINTAIN ORDER AND PAYMENT TYPES VIEW */}
      {activeSubView === 'order-types' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Maintain Order and Payment Types</h2>
              <p className="text-xs text-slate-500 mt-1">Configure active channels, payment associations, processing fees, and order preparation times.</p>
            </div>
            
            <button
              onClick={handleSaveOrderTypes}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow"
            >
              <CheckCircle className="h-4 w-4" />
              Update Configuration
            </button>
          </div>

          <div className="space-y-6 text-xs">
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-950/50 p-4 border border-slate-800 rounded-xl justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-400">Select Sales Channel</span>
                <select
                  value={selectedChannel}
                  onChange={(e: any) => setSelectedChannel(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500 transition"
                >
                  <option value="POS">Point of Sale (POS)</option>
                  <option value="Online">Online Web Store</option>
                  <option value="App">Mobile iOS/Android App</option>
                </select>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                Store context: Warners Bay (2532)
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-850">
              {channelsConfig[selectedChannel]?.map((type: any, index: number) => (
                <div key={type.name} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-slate-900/10 transition gap-4">
                  {/* Left: Checkbox + Info */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={type.active}
                      onChange={() => handleToggleOrderTypeActive(index)}
                      className="h-4.5 w-4.5 accent-orange-500 cursor-pointer rounded border-slate-800 bg-slate-950"
                    />
                    <div>
                      <span className="font-extrabold text-white text-xs">{type.name}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">({type.methods})</span>
                    </div>
                  </div>

                  {/* Middle: Custom Controls */}
                  {type.active && (
                    <div className="flex flex-wrap items-center gap-4 text-[11px]">
                      <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/80 rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-500 font-bold">Extra:</span>
                        <input
                          type="number"
                          value={type.extraCharges}
                          onChange={(e) => {
                            const updated = { ...channelsConfig };
                            updated[selectedChannel][index].extraCharges = parseFloat(e.target.value) || 0;
                            setChannelsConfig(updated);
                          }}
                          className="w-12 bg-transparent text-center text-white border-b border-slate-700 outline-none text-xs"
                          placeholder="0"
                        />
                        <span className="text-slate-500 font-bold">%</span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/80 rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-500 font-bold">Prep:</span>
                        <input
                          type="number"
                          value={type.prepTime}
                          onChange={(e) => {
                            const updated = { ...channelsConfig };
                            updated[selectedChannel][index].prepTime = parseInt(e.target.value) || 0;
                            setChannelsConfig(updated);
                          }}
                          className="w-12 bg-transparent text-center text-white border-b border-slate-700 outline-none text-xs"
                          placeholder="0"
                        />
                        <span className="text-slate-500 font-bold">min</span>
                      </div>
                    </div>
                  )}

                  {/* Right: Default switch */}
                  <div className="flex items-center gap-2 justify-end">
                    {type.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-orange-500 border border-orange-500/20 shadow-sm">
                        Default Channel
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultOrderType(index)}
                        disabled={!type.active}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase transition ${
                          type.active
                            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            : 'border-slate-850 text-slate-700 cursor-not-allowed'
                        }`}
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2e. PAYMENT SURCHARGES VIEW */}
      {activeSubView === 'surcharges' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Payment Surcharge</h2>
              <p className="text-xs text-slate-500 mt-1">Define percentage-based processing rates and fixed transaction fees applied at order checkout.</p>
            </div>
            
            <button
              onClick={handleSaveSurcharges}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow"
            >
              <CheckCircle className="h-4 w-4" />
              Save Surcharges
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4 text-center">Percentage (%)</th>
                  <th className="p-4 text-center">Fixed Amount ($)</th>
                  <th className="p-4 text-right">Preview Status</th>
                </tr>
              </thead>
              <tbody>
                {surcharges.map((s, idx) => (
                  <tr key={s.mode} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                    <td className="p-4 font-bold text-white">{s.mode}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center rounded-lg bg-slate-950 border border-slate-850 px-2.5 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={s.percentage || ''}
                          onChange={(e) => handleSurchargeChange(idx, 'percentage', e.target.value)}
                          className="w-16 text-center bg-transparent border-none outline-none font-bold text-orange-400 text-xs"
                          placeholder="0.00"
                        />
                        <span className="text-[10px] text-slate-500 font-semibold">%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center rounded-lg bg-slate-950 border border-slate-850 px-2.5 py-1">
                        <span className="text-[10px] text-slate-500 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={s.amount || ''}
                          onChange={(e) => handleSurchargeChange(idx, 'amount', e.target.value)}
                          className="w-16 text-center bg-transparent border-none outline-none font-bold text-orange-400 text-xs"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {(s.percentage > 0 || s.amount > 0) ? (
                        <span className="text-[10px] font-extrabold text-[#f59e0b] uppercase bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                          +{s.percentage > 0 ? `${s.percentage}%` : ''} {s.amount > 0 ? `+$${s.amount.toFixed(2)}` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                          No Fees Applied
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2f. MANAGE PRINTERS & IOT DEVICES VIEW */}
      {activeSubView === 'printers' && (
        <div className="space-y-8 animate-fade-in text-xs">
          
          {/* Main Printers Table Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">Manage Printers</h2>
                <p className="text-xs text-slate-500 mt-1">Configure physical thermal receipt printers, labeling machines, and printing nodes.</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setNewPrinterName('');
                    setNewPrinterIp('');
                    setShowAddPrinterModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow"
                >
                  <Plus className="h-4 w-4" />
                  Add IOT device
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                    <th className="p-4">Seq.</th>
                    <th className="p-4">Device Name</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Public ip: Port</th>
                    <th className="p-4">Device type Id</th>
                    <th className="p-4 text-center">List of APIs</th>
                    <th className="p-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {printers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-650 font-bold">No printer devices configured.</td>
                    </tr>
                  ) : (
                    printers.map((p) => (
                      <tr key={p.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                        <td className="p-4 font-semibold text-slate-500">{p.seq}</td>
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {p.name}
                        </td>
                        <td className="p-4 text-slate-400">{p.location}</td>
                        <td className="p-4 font-mono">{p.ip}</td>
                        <td className="p-4 font-semibold text-slate-500">{p.type}</td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => triggerAlert(`API list for ${p.name}: GET /api/pos/print, POST /api/pos/print-job`)}
                            className="rounded-lg bg-orange-600/10 border border-orange-500/20 text-[#f59e0b] hover:bg-orange-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide transition"
                          >
                            API List
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePrinter(p.id)}
                            className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Other Devices Table Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">Other Devices</h2>
                <p className="text-xs text-slate-500 mt-1">Configure kitchen display nodes, POS terminal channels, and print-routing categories.</p>
              </div>
              
              <button
                onClick={() => {
                  setNewDeviceName('');
                  setNewDeviceDesc('');
                  setShowAddOtherDeviceModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow"
              >
                <Plus className="h-4 w-4" />
                Add Other Device
              </button>
            </div>

            {/* Filter Inputs block */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Search Device Name</label>
                <input
                  type="text"
                  placeholder="e.g. DRINKS"
                  value={deviceFilterName}
                  onChange={(e) => setDeviceFilterName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Search Device Type</label>
                <input
                  type="text"
                  placeholder="e.g. POS Printer"
                  value={deviceFilterType}
                  onChange={(e) => setDeviceFilterType(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Search Location Name</label>
                <input
                  type="text"
                  placeholder="e.g. Warners Bay"
                  value={deviceFilterLocation}
                  onChange={(e) => setDeviceFilterLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Search Description</label>
                <input
                  type="text"
                  placeholder="e.g. DRINKS printer"
                  value={deviceFilterDesc}
                  onChange={(e) => setDeviceFilterDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                    <th className="p-4">Seq</th>
                    <th className="p-4">Device Name</th>
                    <th className="p-4">Device Type</th>
                    <th className="p-4">Location Name</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Last Update</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {otherDevices
                    .filter(d => 
                      d.name.toLowerCase().includes(deviceFilterName.toLowerCase()) &&
                      d.type.toLowerCase().includes(deviceFilterType.toLowerCase()) &&
                      d.location.toLowerCase().includes(deviceFilterLocation.toLowerCase()) &&
                      d.description.toLowerCase().includes(deviceFilterDesc.toLowerCase())
                    )
                    .length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-650 font-bold">No matching devices found.</td>
                      </tr>
                    ) : (
                      otherDevices
                        .filter(d => 
                          d.name.toLowerCase().includes(deviceFilterName.toLowerCase()) &&
                          d.type.toLowerCase().includes(deviceFilterType.toLowerCase()) &&
                          d.location.toLowerCase().includes(deviceFilterLocation.toLowerCase()) &&
                          d.description.toLowerCase().includes(deviceFilterDesc.toLowerCase())
                        )
                        .map((d) => (
                          <tr key={d.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                            <td className="p-4 font-semibold text-slate-500">{d.seq}</td>
                            <td className="p-4 font-bold text-white flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                              {d.name}
                            </td>
                            <td className="p-4 font-semibold text-slate-400">{d.type}</td>
                            <td className="p-4">{d.location}</td>
                            <td className="p-4 text-slate-400">{d.description}</td>
                            <td className="p-4 font-mono text-[10px] text-slate-500">{d.lastUpdate}</td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => triggerAlert('Printer status verified successfully.')}
                                  className="rounded-lg bg-slate-900 p-2 text-slate-400 hover:text-white border border-slate-800"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOtherDevice(d.id)}
                                  className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Printer Modal Dialog */}
          {showAddPrinterModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-white">Add IOT Printer Device</h3>
                  <button type="button" onClick={() => setShowAddPrinterModal(false)} className="text-slate-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleAddPrinter} className="mt-4 space-y-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Device Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WW - KITCHEN PRINTER"
                      value={newPrinterName}
                      onChange={(e) => setNewPrinterName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">IP Address : Port</label>
                    <input
                      type="text"
                      placeholder="e.g. http://10.0.0.30:80"
                      value={newPrinterIp}
                      onChange={(e) => setNewPrinterIp(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Location</label>
                    <input
                      type="text"
                      readOnly
                      value={newPrinterLocation}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition">
                    Register Printer Node
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Add Other Device Modal Dialog */}
          {showAddOtherDeviceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-white">Add Other POS Device</h3>
                  <button type="button" onClick={() => setShowAddOtherDeviceModal(false)} className="text-slate-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleAddOtherDevice} className="mt-4 space-y-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Device Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BAR / KITCHEN"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Device Type</label>
                    <select
                      value={newDeviceType}
                      onChange={(e) => setNewDeviceType(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 outline-none"
                    >
                      <option value="POS Printer">POS Printer Node</option>
                      <option value="Kitchen Display System">Kitchen Display System (KDS)</option>
                      <option value="EFTPOS Terminal">EFTPOS Card Terminal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Bar printer node"
                      value={newDeviceDesc}
                      onChange={(e) => setNewDeviceDesc(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition">
                    Register POS Print Node
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. ADD ZONE DIALOG MODAL */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Create Shipping Zone</h3>
              <button
                onClick={() => setShowZoneModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddZone} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radial distance 10km"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Zone Type *</label>
                  <select
                    value={zoneType}
                    onChange={(e: any) => setZoneType(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-400 outline-none focus:border-orange-500 transition"
                  >
                    <option value="ZIPCODE">ZIPCODE</option>
                    <option value="RADIAL DISTANCE">RADIAL DISTANCE</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Country</label>
                  <input
                    type="text"
                    value={zoneCountry}
                    onChange={(e) => setZoneCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {zoneType === 'RADIAL DISTANCE' ? (
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Distance (km) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10"
                    value={zoneDistance}
                    onChange={(e) => setZoneDistance(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Zipcode *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2306"
                      value={zoneZip}
                      onChange={(e) => setZoneZip(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">State</label>
                    <input
                      type="text"
                      placeholder="e.g. NSW"
                      value={zoneState}
                      onChange={(e) => setZoneState(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Sydney"
                      value={zoneCity}
                      onChange={(e) => setZoneCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Locality</label>
                    <input
                      type="text"
                      placeholder="e.g. Warners Bay"
                      value={zoneLocality}
                      onChange={(e) => setZoneLocality(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-6 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition"
              >
                Create shipping zone
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
