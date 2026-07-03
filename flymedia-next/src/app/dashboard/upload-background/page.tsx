"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UploadCloud, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, X, Loader2, Maximize2, Trash2, Palette } from 'lucide-react';

const PRESET_COLORS = [
  { hex: '#F9F6F0', name: 'Cream' },
  { hex: '#2A0E07', name: 'Charcoal Brown' },
  { hex: '#0F172A', name: 'Deep Slate' },
  { hex: '#000000', name: 'Pure Black' },
  { hex: '#1E1B4B', name: 'Indigo' },
  { hex: '#111827', name: 'Slate Gray' },
];

export default function UploadBackgroundPage() {
  const router = useRouter();
  
  // Tab control: 'image' or 'color'
  const [uploadMode, setUploadMode] = useState<'image' | 'color'>('image');
  
  // Image Upload States
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  
  // Solid Color States
  const [bgColorValue, setBgColorValue] = useState<string>('#F9F6F0');

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [targetScreen, setTargetScreen] = useState<string>('Dashboard');
  const [isDragging, setIsDragging] = useState(false);
  const [backgroundsList, setBackgroundsList] = useState<any[]>([]);
  const [fetchingList, setFetchingList] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const fetchBackgrounds = async () => {
    try {
      const res = await fetch('/api/dashboard/upload-background');
      const data = await res.json();
      if (data.success && data.list) {
        setBackgroundsList(data.list);
      }
    } catch (e) {
      console.error('Failed to fetch backgrounds list', e);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        const url = URL.createObjectURL(droppedFile);
        setPreview(url);
        setError(null);
      } else {
        setError('Please drop a valid image file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview('');
    }
    setError(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMode === 'image' && !file) {
      setError('Please select or drag an image file to upload.');
      return;
    }
    setUploading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const formData = new FormData();
      formData.append('targetScreen', targetScreen);
      
      if (uploadMode === 'image' && file) {
        formData.append('background', file);
      } else if (uploadMode === 'color') {
        formData.append('bgColor', bgColorValue);
      }

      const res = await fetch('/api/dashboard/upload-background', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save background');
      
      setSuccessMessage(`Background successfully updated for ${targetScreen}!`);
      fetchBackgrounds();
      handleRemoveFile();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setUploading(false);
    }
  };

  // Delete background element (image, color or both)
  const handleDeleteSetting = async (screenKey: string, type: 'image' | 'color' | 'all') => {
    if (!confirm(`Are you sure you want to clear the custom ${type === 'all' ? 'settings' : type} background for ${screenKey}?`)) {
      return;
    }
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/dashboard/upload-background?targetScreen=${screenKey}&type=${type}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove background setting');
      
      setSuccessMessage(`${screenKey} custom ${type} cleared successfully.`);
      fetchBackgrounds();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to clear background setting');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-slate-950 overflow-y-auto px-4 py-16 sm:px-6 lg:px-8 gap-8">
      {/* Dynamic Background Mesh Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Floating Back Navigation Button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="self-start lg:ml-6 z-20 mb-2"
      >
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-700/50 hover:bg-slate-800 transition duration-300 backdrop-blur-md shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Main Grid Wrapper */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Upload Form / Settings Controller */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", damping: 20 }}
          className="relative lg:col-span-7 w-full rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 backdrop-blur-2xl shadow-2xl shadow-violet-500/5"
        >
          {/* Glow Header Accent Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 mb-2">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Store Backgrounds
              </h1>
              <p className="text-sm text-slate-400">
                Apply custom images or solid colors to your store pages
              </p>
            </div>

            {/* Feedback Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 shadow-lg shadow-red-500/5"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Action failed</p>
                    <p className="text-xs text-red-400/90 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 shadow-lg shadow-emerald-500/5"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Success!</p>
                    <p className="text-xs text-emerald-400/90 mt-1">{successMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode Tab Switcher — Beautiful Sliding Pill */}
            <div className="relative flex items-center gap-1 p-1.5 rounded-2xl border border-slate-800/80 bg-slate-950/90 backdrop-blur-sm shadow-inner">
              {/* Sliding Background Pill */}
              {(['image', 'color'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setUploadMode(mode)}
                  className="relative flex-1 flex items-center justify-center gap-2.5 py-3.5 z-10 cursor-pointer"
                >
                  {uploadMode === mode && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/25"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${
                        uploadMode === mode
                          ? 'bg-white/15 text-white'
                          : 'bg-slate-800/80 text-slate-500 group-hover:text-slate-300'
                      }`}
                    >
                      {mode === 'image' ? (
                        <ImageIcon className="h-3.5 w-3.5" />
                      ) : (
                        <Palette className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-widest transition-colors duration-300 ${
                        uploadMode === mode ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {mode === 'image' ? 'Image' : 'Color'}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Screen Dropdown Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Target Screen / Page
                </label>
                <div className="relative">
                  <select
                    value={targetScreen}
                    onChange={(e) => setTargetScreen(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3.5 text-sm font-medium text-slate-200 outline-none transition duration-300 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 cursor-pointer shadow-inner animate-none"
                  >
                    <option value="Dashboard" className="bg-slate-950 text-slate-200">Admin Dashboard</option>
                    <option value="Login" className="bg-slate-950 text-slate-200">Admin/Business Login</option>
                    <option value="Menu" className="bg-slate-950 text-slate-200">Customer Menu / Order Page</option>
                    <option value="CustomerLogin" className="bg-slate-950 text-slate-200">Customer Login Page</option>
                    <option value="Register" className="bg-slate-950 text-slate-200">Business Registration Page</option>
                    <option value="CustomerRegister" className="bg-slate-950 text-slate-200">Customer Signup Page</option>
                    <option value="Book" className="bg-slate-950 text-slate-200">Table Reservation Page</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mode-specific content */}
              <AnimatePresence mode="wait">
                {uploadMode === 'image' ? (
                  <motion.div
                    key="image-picker"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Upload Image File
                    </label>
                    {!preview ? (
                      <motion.label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`group relative flex flex-col items-center justify-center w-full min-h-[220px] rounded-3xl border-2 border-dashed transition duration-305 cursor-pointer ${
                          isDragging
                            ? 'border-violet-500 bg-violet-500/10 scale-[1.01] shadow-lg shadow-violet-500/5'
                            : 'border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 hover:border-violet-500/40'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-violet-400 group-hover:border-violet-500/20 group-hover:bg-violet-500/5 transition duration-300 shadow-md">
                            <UploadCloud className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              Click to upload <span className="text-slate-400 font-normal">or drag & drop</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1.5">
                              High resolution PNG, JPG, or WEBP (Max 10MB)
                            </p>
                          </div>
                        </div>
                      </motion.label>
                    ) : (
                      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-inner">
                        <div className="relative pt-[52%] w-full rounded-2xl overflow-hidden border border-slate-900 shadow-lg group">
                          <img
                            src={preview}
                            alt="Background Preview"
                            className="absolute inset-0 w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600/90 text-white hover:bg-red-500 shadow-lg hover:scale-110 transition duration-300"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 px-1.5">
                          <div className="flex items-center gap-2 text-slate-400 min-w-0">
                            <ImageIcon className="h-4 w-4 shrink-0 text-violet-400" />
                            <span className="text-xs font-medium truncate max-w-[280px]">
                              {file?.name || "Uploaded Image"}
                            </span>
                            {file && (
                              <span className="text-[10px] text-slate-600 shrink-0">
                                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-xs font-semibold text-slate-500 hover:text-red-400 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="color-picker"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Choose Color Value
                      </label>
                      <div className="flex gap-4 items-center bg-slate-950/80 border border-slate-800 p-4 rounded-3xl">
                        {/* Interactive Color Circle Box */}
                        <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-slate-700/60 shrink-0 cursor-pointer shadow-lg">
                          <input
                            type="color"
                            value={bgColorValue}
                            onChange={(e) => setBgColorValue(e.target.value)}
                            className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer border-none p-0 outline-none"
                          />
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={bgColorValue}
                            onChange={(e) => setBgColorValue(e.target.value)}
                            className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder-slate-600 font-mono tracking-wide"
                            placeholder="#FFFFFF"
                          />
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hex Color Picker</p>
                        </div>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Color Presets</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setBgColorValue(preset.hex)}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-slate-700 hover:bg-slate-950 transition duration-300 group"
                          >
                            <span 
                              className="h-8 w-8 rounded-xl border border-slate-800 group-hover:scale-105 transition-transform" 
                              style={{ backgroundColor: preset.hex }} 
                            />
                            <span className="text-[9px] text-slate-400 font-semibold truncate w-full text-center">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Glowing Gradient Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={uploading || (uploadMode === 'image' && !file)}
                className="relative w-full group overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white transition-all shadow-lg hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-violet-500/10 cursor-pointer"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="flex items-center justify-center gap-2">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Applying Settings...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5" />
                      Save & Apply Background
                    </>
                  )}
                </span>
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Right Side: Active Backgrounds List (5 Cols on large screen) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", damping: 20 }}
          className="relative lg:col-span-5 w-full rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 backdrop-blur-2xl shadow-2xl shadow-violet-500/5"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-violet-400" />
                Active Backgrounds
              </h2>
              <span className="text-[10px] bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-slate-350 font-bold uppercase tracking-wider">
                {backgroundsList.length} Active
              </span>
            </div>

            {fetchingList ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-violet-450" />
                <span className="text-xs">Fetching active backgrounds...</span>
              </div>
            ) : backgroundsList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No custom background settings applied yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[490px] overflow-y-auto pr-1 scrollbar-thin">
                {backgroundsList.map((bg) => (
                  <div 
                    key={bg.key}
                    className="flex flex-col gap-3 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-slate-800/60 hover:bg-slate-950/80 p-4 transition duration-300 group"
                  >
                    {/* Header: Label name */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200 truncate">{bg.label}</h3>
                        <p className="text-[9px] text-slate-500 font-medium">Target: {bg.key}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSetting(bg.key, 'all')}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg border border-transparent hover:border-red-500/10 transition"
                        title="Clear all background settings"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Image details if exists */}
                    {bg.url && (
                      <div className="flex items-center gap-3 rounded-xl bg-slate-950/80 border border-slate-900 p-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedImageUrl(bg.url)}
                          className="relative h-10 w-16 rounded-lg overflow-hidden border border-slate-800 shrink-0 shadow cursor-zoom-in hover:ring-1 hover:ring-violet-500/50 flex items-center justify-center bg-slate-900"
                        >
                          <img src={bg.url} alt={bg.label} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="h-3 w-3 text-white" />
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 font-bold truncate">Custom Image</p>
                          <p className="text-[9px] text-slate-500 truncate mt-0.5">{bg.url.split('/').pop()}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSetting(bg.key, 'image')}
                          className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider shrink-0 transition"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}

                    {/* Color details if exists */}
                    {bg.color && (
                      <div className="flex items-center gap-3 rounded-xl bg-slate-950/80 border border-slate-900 p-2 text-xs">
                        <span 
                          className="h-10 w-16 rounded-lg border border-slate-800 shrink-0 shadow block" 
                          style={{ backgroundColor: bg.color }} 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 font-bold">Solid Color</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{bg.color}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSetting(bg.key, 'color')}
                          className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider shrink-0 transition"
                        >
                          Clear Color
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Lightbox / Full Image Modal */}
      <AnimatePresence>
        {selectedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImageUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[85vh] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-2xl p-2 flex items-center justify-center"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedImageUrl(null)}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800 transition shadow-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Full Image */}
              <img
                src={selectedImageUrl}
                alt="Full Background Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
