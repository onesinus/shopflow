import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth';

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBio(user?.profile?.bio ?? '');
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateMe({ bio });
      await refreshUser();
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container container-narrow">
      <h1>My account</h1>
      <div className="card">
        <h2>Profile</h2>
        <form className="form" onSubmit={saveProfile}>
          <div className="summary-row">
            <span>Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="summary-row">
            <span>Role</span>
            <span>{user?.role}</span>
          </div>
          <label>
            Bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
