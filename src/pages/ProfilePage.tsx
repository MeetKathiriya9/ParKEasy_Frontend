import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Avatar } from '@/components/ui';
import { ApiError } from '@/lib/api';
import {
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  fetchProfile,
  removePhoto,
  updateProfile,
  uploadPhoto,
  type ProfileUpdateInput,
} from '@/lib/profile';
import {
  ArrowLeft, Camera, Check, ImageUp, KeyRound, Loader2, Mail, Phone, Trash2, UserRound,
} from 'lucide-react';

const ACCEPTED = ACCEPTED_PHOTO_TYPES.split(',');

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Reads `details.reason` from a profile error without trusting its shape. */
function errorReason(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const { details } = error;
  if (details && typeof details === 'object' && 'reason' in details) {
    const reason = (details as { reason?: unknown }).reason;
    return typeof reason === 'string' ? reason : null;
  }
  return null;
}

export function ProfilePage() {
  const { currentUser, applyProfile, navigate, goBack } = useApp();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [notice, setNotice] = useState('');

  // The shell already carries a cached profile, but it may predate the last
  // edit on another device, so re-read it once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await fetchProfile();
        if (cancelled) return;
        applyProfile(profile);
        setName(profile.name);
        setPhone(profile.phone ?? '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once: applyProfile only writes to state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const storedPhone = currentUser?.phone ?? '';
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const nameError = trimmedName.length > 0 && trimmedName.length < 2 ? 'Name must be at least 2 characters.' : '';
  const nameDirty = currentUser != null && trimmedName !== currentUser.name;
  const phoneDirty = trimmedPhone !== storedPhone;
  const dirty = nameDirty || phoneDirty;
  const canSave = !saving && !loading && dirty && trimmedName.length >= 2 && !nameError;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!currentUser) return;

    const payload: ProfileUpdateInput = {};
    if (nameDirty) payload.name = trimmedName;
    // An emptied field clears the number; the server treats an empty string as
    // null, so a blank value is a deliberate clear rather than a no-op.
    if (phoneDirty) payload.phone = trimmedPhone === '' ? null : trimmedPhone;
    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    try {
      const profile = await updateProfile(payload);
      applyProfile(profile);
      setName(profile.name);
      setPhone(profile.phone ?? '');
      setNotice('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // Reset so picking the same file again still fires a change event.
    e.target.value = '';
    if (!file) return;

    setPhotoError('');
    setNotice('');
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(`That image is too large. The limit is ${formatSize(MAX_PHOTO_BYTES)}.`);
      return;
    }
    if (file.type && !ACCEPTED.includes(file.type)) {
      setPhotoError('Use a JPEG, PNG or WebP image.');
      return;
    }

    setPhotoBusy(true);
    try {
      const profile = await uploadPhoto(file);
      applyProfile(profile);
      setNotice('Photo updated.');
    } catch (err) {
      setPhotoError(
        errorReason(err) === 'PHOTO_TOO_LARGE'
          ? `That image is too large. The limit is ${formatSize(MAX_PHOTO_BYTES)}.`
          : err instanceof Error
            ? err.message
            : 'Could not upload that image.',
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoError('');
    setNotice('');
    setPhotoBusy(true);
    try {
      const profile = await removePhoto();
      applyProfile(profile);
      setNotice('Photo removed.');
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not remove your photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm text-[#8a98b5] hover:text-[#e8edf5] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="pe-card p-6 mb-4">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/15 flex items-center justify-center shrink-0">
              <UserRound size={20} className="text-[#60a5fa]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">My profile</h1>
              <p className="text-sm text-[#8a98b5]">Manage your name, contact number and photo.</p>
            </div>
          </div>

          {/* Photo */}
          <div className="flex items-center gap-4">
            <Avatar initials={currentUser?.avatar ?? ''} src={currentUser?.photoUrl} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={photoBusy}
                  className="pe-btn-primary disabled:opacity-60"
                >
                  {photoBusy ? <Loader2 size={16} className="animate-spin" /> : <ImageUp size={16} />}
                  {currentUser?.photoUrl ? 'Change photo' : 'Upload photo'}
                </button>
                {currentUser?.photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={photoBusy}
                    className="pe-btn-ghost disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-[#5a6a8a] mt-2 flex items-center gap-1.5">
                <Camera size={13} />
                JPEG, PNG or WebP, up to {formatSize(MAX_PHOTO_BYTES)}. Larger images are resized and
                compressed automatically.
              </p>
            </div>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES}
            onChange={handlePhotoPicked}
            className="hidden"
          />
          {photoError && <p className="text-xs text-[#ef4444] mt-3">{photoError}</p>}
        </div>

        {/* Details */}
        <form onSubmit={handleSave} className="pe-card p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Full name
              </label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={80}
                  className="pe-input pl-9"
                  disabled={loading}
                  required
                />
              </div>
              {nameError && <p className="text-xs text-[#ef4444] mt-1.5">{nameError}</p>}
            </div>

            <div>
              <label htmlFor="profile-email" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="profile-email"
                  type="email"
                  value={currentUser?.email ?? ''}
                  className="pe-input pl-9 opacity-70 cursor-not-allowed"
                  readOnly
                  disabled
                />
              </div>
              <p className="text-xs text-[#5a6a8a] mt-1.5">
                Your email identifies your account and cannot be changed. Contact support if it needs
                to be corrected.
              </p>
            </div>

            <div>
              <label htmlFor="profile-phone" className="text-xs text-[#8a98b5] font-medium mb-1.5 block">
                Phone number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 90000 00000"
                  maxLength={20}
                  className="pe-input pl-9"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fca5a5]"
            >
              {error}
            </div>
          )}
          {notice && !error && (
            <div className="mt-4 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-3 py-2 text-sm text-[#6ee7b7] flex items-center gap-2">
              <Check size={15} />
              {notice}
            </div>
          )}

          <div className="flex gap-3 pt-5">
            <button type="submit" disabled={!canSave} className="pe-btn-primary disabled:opacity-60">
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>

        {/* Security */}
        <div className="pe-card p-6 mt-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/15 flex items-center justify-center shrink-0">
              <KeyRound size={20} className="text-[#60a5fa]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Password</p>
              <p className="text-sm text-[#8a98b5]">
                Changing your password signs you out on every device.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('change-password')}
            className="pe-btn-ghost shrink-0"
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
}
