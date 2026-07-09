'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Eye, EyeOff, Save, CheckCircle, XCircle, Loader2, ExternalLink, AlertTriangle, Info } from 'lucide-react';

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isStripeEnabled, setIsStripeEnabled] = useState(false);
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const [hasSecretKey, setHasSecretKey] = useState(false);
  const [hasWebhookSecret, setHasWebhookSecret] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // UPI Payments configuration states
  const [isUpiEnabled, setIsUpiEnabled] = useState(false);
  const [upiVpa, setUpiVpa] = useState('');
  const [upiQrImage, setUpiQrImage] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/payment-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setIsStripeEnabled(data.config.is_stripe_enabled ?? false);
          setPublishableKey(data.config.stripe_publishable_key || '');
          setHasSecretKey(data.config.has_secret_key ?? false);
          setHasWebhookSecret(data.config.has_webhook_secret ?? false);
          setIsUpiEnabled(data.config.is_upi_enabled ?? false);
          setUpiVpa(data.config.upi_vpa || '');
          setUpiQrImage(data.config.upi_qr_image || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'upi-qr');

    try {
      const res = await fetch('/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setUpiQrImage(data.url);
        setSuccessMsg('UPI QR Scanner uploaded successfully! Remember to save changes.');
      } else {
        setErrorMsg(data.error || 'Failed to upload QR scanner.');
      }
    } catch (err) {
      setErrorMsg('Network error uploading file.');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const body: any = {
      is_stripe_enabled: isStripeEnabled,
      stripe_publishable_key: publishableKey,
      is_upi_enabled: isUpiEnabled,
      upi_vpa: upiVpa,
      upi_qr_image: upiQrImage,
    };
    if (secretKey) body.stripe_secret_key = secretKey;
    if (webhookSecret) body.stripe_webhook_secret = webhookSecret;

    try {
      const res = await fetch('/api/dashboard/payment-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Payment configuration saved successfully!');
        if (secretKey) {
          setHasSecretKey(true);
          setSecretKey('');
        }
        if (webhookSecret) {
          setHasWebhookSecret(true);
          setWebhookSecret('');
        }
      } else {
        setErrorMsg(data.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#635BFF] to-[#7C73FF] flex items-center justify-center shadow-lg shadow-[#635BFF]/30">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-white">Payment Settings</h1>
          <p className="text-xs text-slate-400">Configure Stripe for online card payments</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-400">
          <p className="text-blue-300 font-semibold">Direct Charge Model</p>
          <p>Payments go directly into your Stripe account. Customers can pay by card at online checkout. Get your keys at{' '}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300 inline-flex items-center gap-1"
            >
              dashboard.stripe.com <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Enable Stripe Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-[#1e293b]/60 bg-[#0c101b] p-4">
          <div>
            <p className="text-sm font-bold text-white">Enable Stripe Payments</p>
            <p className="text-xs text-slate-400 mt-0.5">Allow customers to pay by card at checkout</p>
          </div>
          <button
            type="button"
            onClick={() => setIsStripeEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isStripeEnabled ? 'bg-[#635BFF]' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isStripeEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isStripeEnabled && (
          <>
            {/* Publishable Key */}
            <div className="rounded-xl border border-[#1e293b]/60 bg-[#0c101b] p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Stripe API Keys</h3>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Publishable Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={publishableKey}
                  onChange={(e) => setPublishableKey(e.target.value)}
                  placeholder="pk_live_... or pk_test_..."
                  className="w-full rounded-lg border border-[#1e293b] bg-[#060b14] px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#635BFF] transition font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Safe to include in frontend code. Starts with <code className="text-slate-400">pk_</code></p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Secret Key {!hasSecretKey && <span className="text-red-400">*</span>}
                  {hasSecretKey && (
                    <span className="ml-2 text-[10px] text-emerald-400 normal-case font-normal">✓ Key saved</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder={hasSecretKey ? 'Enter new key to replace existing...' : 'sk_live_... or sk_test_...'}
                    className="w-full rounded-lg border border-[#1e293b] bg-[#060b14] px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-600 outline-none focus:border-[#635BFF] transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-start gap-1.5 mt-1">
                  <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-400/80">Never share. Starts with <code className="text-amber-300">sk_</code>. Stored securely on the server.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Webhook Secret (optional)
                  {hasWebhookSecret && (
                    <span className="ml-2 text-[10px] text-emerald-400 normal-case font-normal">✓ Secret saved</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder={hasWebhookSecret ? 'Enter new secret to replace...' : 'whsec_...'}
                    className="w-full rounded-lg border border-[#1e293b] bg-[#060b14] px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-600 outline-none focus:border-[#635BFF] transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  For automatic payment status updates. Webhook URL: <code className="text-slate-400">/api/public/stripe/webhook</code>
                </p>
              </div>
            </div>

            {/* Test Card Reference */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-400">Test Card Numbers</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div><code className=" font-mono">4242 4242 4242 4242</code> — Success</div>
                <div><code className=" font-mono">4000 0000 0000 0002</code> — Declined</div>
                <div><code className=" font-mono">4000 0025 0000 3155</code> — 3D Secure</div>
                <div className="text-slate-500">Any future date & CVC</div>
              </div>
            </div>
          </>
        )}

        {/* UPI Payments Section */}
        <div className="rounded-xl border border-[#1e293b]/60 bg-[#0c101b] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Enable UPI Payments</p>
              <p className="text-xs text-slate-400 mt-0.5">Accept direct mobile payments via UPI QR Code / Intent</p>
            </div>
            <button
              type="button"
              onClick={() => setIsUpiEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isUpiEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isUpiEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isUpiEnabled && (
            <div className="pt-2 animate-in fade-in duration-200 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Merchant UPI ID (VPA) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="e.g. merchant@upi, pay@okhdfcbank"
                  required={isUpiEnabled}
                  className="w-full rounded-lg border border-[#1e293b] bg-[#060b14] px-3 py-2.5 text-sm text-white placeholder-slate-650 outline-none focus:border-amber-500 transition font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Used to generate dynamic QR codes and intent-pay URI links at checkout.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/40 space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Static QR Code Scanner Image (Optional)
                </label>

                {upiQrImage ? (
                  <div className="relative w-44 h-44 rounded-xl border border-slate-800 bg-[#060b14] overflow-hidden flex items-center justify-center group shadow-md">
                    <img
                      src={upiQrImage}
                      alt="Uploaded Scanner"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setUpiQrImage('')}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-red-400 transition"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-800 bg-[#060b14] cursor-pointer hover:border-amber-500 hover:bg-[#060b14]/80 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      {uploadingQr ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-amber-500 mb-2" />
                          <p className="text-xs font-semibold text-slate-400">Uploading scanner...</p>
                        </>
                      ) : (
                        <>
                          <Info className="h-6 w-6 text-slate-500 mb-2" />
                          <p className="text-xs font-semibold text-slate-400">Click to upload QR scanner image</p>
                          <p className="text-[9px] text-slate-600 mt-1">PNG, JPG or SVG up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      disabled={uploadingQr}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-[10px] text-slate-500">
                  If uploaded, customers will scan this static image instead of a generated VPA QR code.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <XCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#7C73FF] py-3 text-sm font-bold text-white hover:opacity-90 transition shadow-lg shadow-[#635BFF]/20 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Payment Configuration'}
        </button>
      </form>
    </div>
  );
}
