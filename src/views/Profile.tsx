import React, { useState } from 'react';
import { useDB } from '../context/DBContext';
import { db } from '../services/db';
import type { FamilyMember } from '../types/database.types';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jane',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Shadow'
];

export const ProfileView: React.FC = () => {
  const { user, updateProfile, families, familyMembers, refreshData, isLoading } = useDB();

  // Personal Profile state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Family selection & operations
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [familySuccess, setFamilySuccess] = useState('');
  const [familyError, setFamilyError] = useState('');

  // Add Family Member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');

  // Edit Family Member state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberRole, setEditMemberRole] = useState<'admin' | 'member'>('member');

  // Edit Family Name state
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [editFamilyNameVal, setEditFamilyNameVal] = useState('');

  if (!user) {
    return (
      <div className="md-card md-card--elevated text-center" style={{ padding: '32px' }}>
        <h3>Please log in to view profile details.</h3>
      </div>
    );
  }

  // Identify families current user belongs to
  const userMemberships = familyMembers.filter(fm => fm.profile_id === user.id);
  const userFamilies = families.filter(f => userMemberships.some(um => um.family_id === f.id));

  // Determine active family
  const activeFamily = userFamilies.find(f => f.id === selectedFamilyId) || userFamilies[0];
  if (activeFamily && selectedFamilyId !== activeFamily.id) {
    setSelectedFamilyId(activeFamily.id);
  }

  // Active family members
  const activeFamilyMembers = activeFamily 
    ? familyMembers.filter(fm => fm.family_id === activeFamily.id) 
    : [];

  // Check if current user is admin of active family
  const isFamilyAdmin = activeFamily 
    ? familyMembers.some(fm => fm.family_id === activeFamily.id && fm.profile_id === user.id && fm.role === 'admin') 
    : false;

  // Handle Profile Update
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!fullName.trim()) {
      setProfileError('Full name is required');
      return;
    }

    try {
      await updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl
      });
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile');
    }
  };

  // Handle Create Family Group
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setFamilySuccess('');
    setFamilyError('');

    if (!newFamilyName.trim()) {
      setFamilyError('Family group name is required');
      return;
    }

    try {
      // 1. Create family
      const createdFamily = await db.families.create({
        name: newFamilyName,
        created_by: user.id
      } as any);

      // 2. Add creator as admin member
      await db.family_members.create({
        family_id: createdFamily.id,
        profile_id: user.id,
        name: user.full_name,
        role: 'admin'
      } as any);

      await refreshData();
      setSelectedFamilyId(createdFamily.id);
      setNewFamilyName('');
      setFamilySuccess(`Created family group "${createdFamily.name}" successfully.`);
    } catch (err: any) {
      setFamilyError(err?.message || 'Failed to create family group');
    }
  };

  // Handle Edit Family Name
  const handleSaveFamilyName = async () => {
    if (!activeFamily || !editFamilyNameVal.trim()) return;
    try {
      await db.families.update(activeFamily.id, { name: editFamilyNameVal });
      await refreshData();
      setIsEditingFamilyName(false);
      setFamilySuccess('Family group name updated.');
    } catch (err: any) {
      setFamilyError(err?.message || 'Failed to update name');
    }
  };

  // Handle Add Family Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily) return;
    setFamilySuccess('');
    setFamilyError('');

    if (!newMemberName.trim()) {
      setFamilyError('Member name is required');
      return;
    }

    try {
      await db.family_members.create({
        family_id: activeFamily.id,
        name: newMemberName,
        role: newMemberRole,
        profile_id: null // Non-user collaborative profile
      } as any);

      await refreshData();
      setNewMemberName('');
      setNewMemberRole('member');
      setFamilySuccess(`Added ${newMemberName} to the family.`);
    } catch (err: any) {
      setFamilyError(err?.message || 'Failed to add family member');
    }
  };

  // Handle Delete Family Member
  const handleDeleteMember = async (id: string, name: string) => {
    if (!activeFamily) return;
    if (!window.confirm(`Are you sure you want to remove ${name} from this family group?`)) return;

    try {
      await db.family_members.delete(id);
      await refreshData();
      setFamilySuccess(`Removed ${name} from the family.`);
    } catch (err: any) {
      setFamilyError(err?.message || 'Failed to remove member');
    }
  };

  // Start Editing Member
  const startEditingMember = (member: FamilyMember) => {
    setEditingMemberId(member.id);
    setEditMemberName(member.name);
    setEditMemberRole(member.role);
  };

  // Save Member Edits
  const handleSaveMemberEdit = async () => {
    if (!editingMemberId) return;
    try {
      await db.family_members.update(editingMemberId, {
        name: editMemberName,
        role: editMemberRole
      });
      await refreshData();
      setEditingMemberId(null);
      setFamilySuccess('Member details updated.');
    } catch (err: any) {
      setFamilyError(err?.message || 'Failed to update member details');
    }
  };

  return (
    <div className="profile-view-container">
      {/* 1. PERSONAL PROFILE SECTION */}
      <section className="md-card md-card--elevated section-card">
        <h3>Personal Profile</h3>
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Update your profile name and select an adventurer avatar.
        </p>

        {profileSuccess && (
          <div className="md-alert md-alert--success">
            <span>{profileSuccess}</span>
          </div>
        )}
        {profileError && (
          <div className="md-alert md-alert--error">
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="avatar-selection-wrapper">
            <div className="current-avatar-container">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="profile-large-avatar" />
              ) : (
                <div className="profile-large-avatar-placeholder">?</div>
              )}
            </div>
            <div className="avatar-presets">
              <span className="preset-label">Choose Avatar Preset:</span>
              <div className="presets-grid">
                {AVATAR_PRESETS.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt={`Preset ${i}`}
                    className={`preset-img ${avatarUrl === p ? 'preset-img--selected' : ''}`}
                    onClick={() => setAvatarUrl(p)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="md-field-group">
            <label className="md-field-label">Email Address (Read-only)</label>
            <input type="text" className="md-field" value={user.email} disabled />
          </div>

          <div className="md-field-group">
            <label className="md-field-label">Full Name</label>
            <input
              type="text"
              className="md-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="md-btn md-btn--filled" style={{ alignSelf: 'flex-start' }} disabled={isLoading}>
            Save Profile Updates
          </button>
        </form>
      </section>

      {/* 2. FAMILY GROUPS MANAGEMENT */}
      <section className="md-card md-card--elevated section-card">
        <div className="section-header">
          <h3>Family Groups</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-primary)' }}>
            Collaborate on medication cabinet stocks
          </span>
        </div>

        {familySuccess && (
          <div className="md-alert md-alert--success">
            <span>{familySuccess}</span>
          </div>
        )}
        {familyError && (
          <div className="md-alert md-alert--error">
            <span>{familyError}</span>
          </div>
        )}

        {/* Selected family selector */}
        {userFamilies.length > 0 ? (
          <div className="family-selector-bar">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '8px' }}>Active Cabinet:</label>
            <select 
              value={selectedFamilyId} 
              onChange={(e) => {
                setSelectedFamilyId(e.target.value);
                setIsEditingFamilyName(false);
              }}
              className="md-field"
              style={{ width: 'auto', height: '40px', padding: '0 8px' }}
            >
              {userFamilies.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="md-alert md-alert--error" style={{ marginBottom: '16px' }}>
            <span>You do not belong to any family groups yet. Create one below to collaborate.</span>
          </div>
        )}

        {/* Active Family details */}
        {activeFamily && (
          <div className="active-family-card md-card md-card--filled">
            <div className="family-title-row">
              {isEditingFamilyName ? (
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <input
                    type="text"
                    className="md-field"
                    style={{ height: '40px' }}
                    value={editFamilyNameVal}
                    onChange={(e) => setEditFamilyNameVal(e.target.value)}
                  />
                  <button className="md-btn md-btn--filled" style={{ height: '40px' }} onClick={handleSaveFamilyName}>
                    Save
                  </button>
                  <button className="md-btn md-btn--outlined" style={{ height: '40px' }} onClick={() => setIsEditingFamilyName(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h4 style={{ margin: 0 }}>{activeFamily.name}</h4>
                  {isFamilyAdmin && (
                    <button 
                      className="md-btn md-btn--text" 
                      style={{ height: '28px', padding: '0 8px' }}
                      onClick={() => {
                        setIsEditingFamilyName(true);
                        setEditFamilyNameVal(activeFamily.name);
                      }}
                    >
                      ✏️ Edit Name
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Family Members list */}
            <div className="members-section mt-4">
              <h5 style={{ margin: '0 0 8px' }}>Members</h5>
              <div className="members-list">
                {activeFamilyMembers.map(member => (
                  <div key={member.id} className="member-item">
                    {editingMemberId === member.id ? (
                      <div className="member-edit-form">
                        <input
                          type="text"
                          className="md-field"
                          style={{ height: '36px', padding: '0 8px' }}
                          value={editMemberName}
                          onChange={(e) => setEditMemberName(e.target.value)}
                        />
                        <select
                          className="md-field"
                          style={{ height: '36px', padding: '0 8px', width: 'auto' }}
                          value={editMemberRole}
                          onChange={(e) => setEditMemberRole(e.target.value as any)}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                        <button className="md-btn md-btn--filled" style={{ height: '36px', padding: '0 12px' }} onClick={handleSaveMemberEdit}>
                          Save
                        </button>
                        <button className="md-btn md-btn--outlined" style={{ height: '36px', padding: '0 12px' }} onClick={() => setEditingMemberId(null)}>
                          X
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                          <span className="member-badge-role">{member.role === 'admin' ? '🛡️ Admin' : '👤 Member'}</span>
                          {member.profile_id ? (
                            <span className="linked-indicator">Linked user</span>
                          ) : (
                            <span className="collab-indicator">Collaborative profile</span>
                          )}
                        </div>

                        {/* Admin permissions for member editing */}
                        {isFamilyAdmin && (
                          <div className="member-actions">
                            <button 
                              className="md-btn md-btn--text" 
                              style={{ height: '32px', padding: '0 8px' }}
                              onClick={() => startEditingMember(member)}
                              disabled={member.profile_id === user.id} // Cannot edit own membership role here
                            >
                              Edit
                            </button>
                            <button 
                              className="md-btn md-btn--text" 
                              style={{ height: '32px', padding: '0 8px', color: 'var(--md-sys-color-error)' }}
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              disabled={member.profile_id === user.id} // Cannot delete yourself here
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Member form (Admin only) */}
            {isFamilyAdmin && (
              <form onSubmit={handleAddMember} className="add-member-form mt-4">
                <h5 style={{ margin: '0 0 8px' }}>Add Collaborative Profile</h5>
                <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Create a profile to log dosages for elders, children, or non-user members.
                </p>
                <div className="add-member-inputs">
                  <input
                    type="text"
                    className="md-field"
                    placeholder="Grandma, Johnny, etc."
                    style={{ height: '40px', flex: 1 }}
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                  />
                  <select
                    className="md-field"
                    style={{ height: '40px', width: 'auto' }}
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="md-btn md-btn--tonal" style={{ height: '40px' }}>
                    + Add
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Create new Family Cabinet group */}
        <form onSubmit={handleCreateFamily} className="create-family-form">
          <h5 style={{ margin: '0 0 8px' }}>Create New Cabinet Group</h5>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="md-field"
              placeholder="e.g. Smith Cabinet, Office Chest"
              style={{ height: '40px', flex: 1 }}
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
            />
            <button type="submit" className="md-btn md-btn--outlined" style={{ height: '40px' }}>
              Create Group
            </button>
          </div>
        </form>
      </section>

      <style>{`
        .profile-view-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }
        .section-card {
          padding: 24px;
        }
        .avatar-selection-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 8px;
        }
        .current-avatar-container {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          background-color: var(--md-sys-color-secondary-container);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--md-sys-color-primary);
        }
        .profile-large-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-large-avatar-placeholder {
          font-size: 2rem;
          color: var(--md-sys-color-on-secondary-container);
          font-weight: 700;
        }
        .avatar-presets {
          flex: 1;
        }
        .preset-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--md-sys-color-on-surface-variant);
          display: block;
          margin-bottom: 8px;
        }
        .presets-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .preset-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.2s, border-color 0.2s;
        }
        .preset-img:hover {
          transform: scale(1.1);
        }
        .preset-img--selected {
          border-color: var(--md-sys-color-primary);
          transform: scale(1.1);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-bottom: 1px solid var(--md-sys-color-outline-variant);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .family-selector-bar {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        .active-family-card {
          padding: 20px;
          margin-bottom: 16px;
        }
        .family-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--md-sys-color-outline-variant);
          padding-bottom: 10px;
          margin-bottom: 16px;
        }
        .member-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background-color: var(--md-sys-color-surface);
          border-radius: var(--md-shape-corner-s);
          margin-bottom: 8px;
          border: 1px solid var(--md-sys-color-outline-variant);
        }
        .member-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .member-name {
          font-weight: 500;
        }
        .member-badge-role {
          font-size: 0.75rem;
          background-color: var(--md-sys-color-secondary-container);
          color: var(--md-sys-color-on-secondary-container);
          padding: 2px 6px;
          border-radius: var(--md-shape-corner-full);
        }
        .linked-indicator {
          font-size: 0.7rem;
          color: #2e7d32;
          background-color: #e8f5e9;
          padding: 2px 6px;
          border-radius: var(--md-shape-corner-full);
        }
        .collab-indicator {
          font-size: 0.7rem;
          color: #f57c00;
          background-color: #fff3e0;
          padding: 2px 6px;
          border-radius: var(--md-shape-corner-full);
        }
        .member-actions {
          display: flex;
          gap: 4px;
        }
        .member-edit-form {
          display: flex;
          gap: 8px;
          width: 100%;
          align-items: center;
        }
        .add-member-inputs {
          display: flex;
          gap: 8px;
        }
        .create-family-form {
          border-top: 1px solid var(--md-sys-color-outline-variant);
          padding-top: 16px;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
};
