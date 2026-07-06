import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { db, getCurrentUserId, setCurrentUserId, supabase } from '../services/db';
import type {
  Profile,
  Family,
  FamilyMember,
  Platform,
  Medicine,
  Order,
  OrderItem,
  Inventory,
  PriceHistory,
  Notification,
  Attachment,
  Prescription,
  Setting
} from '../types/database.types';

export interface DBContextType {
  user: Profile | null;
  profiles: Profile[];
  families: Family[];
  familyMembers: FamilyMember[];
  platforms: Platform[];
  medicines: Medicine[];
  orders: Order[];
  orderItems: OrderItem[];
  inventory: Inventory[];
  priceHistory: PriceHistory[];
  notifications: Notification[];
  attachments: Attachment[];
  prescriptions: Prescription[];
  settings: Setting[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>>) => Promise<void>;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by'>) => Promise<Medicine>;
  createOrder: (
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'profile_id'>,
    itemsData: Array<{
      medicine_id: string;
      quantity: number;
      unit_price: number;
      discount?: number;
      expiry_date?: string | null;
      batch_number?: string | null;
    }>
  ) => Promise<Order>;
  addInventoryItem: (item: Omit<Inventory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<Inventory>;
  updateInventoryItem: (id: string, updates: Partial<Omit<Inventory, 'id' | 'created_at' | 'updated_at'>>) => Promise<Inventory>;
  consumeDose: (inventoryId: string, quantity: number) => Promise<void>;
  createPrescription: (prescription: Omit<Prescription, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'profile_id'>) => Promise<Prescription>;
  updateSettings: (updates: Partial<Omit<Setting, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>) => Promise<Setting>;
  markNotificationAsRead: (id: string) => Promise<void>;
}

const DBContext = createContext<DBContextType | undefined>(undefined);

export const DBProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;
        if (!data.user) throw new Error('No user returned from Supabase');
        
        setCurrentUserId(data.user.id);
        const profile = await db.profiles.get(data.user.id);
        if (profile) {
          setUser(profile);
        } else {
          const tempProfile: Profile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUser(tempProfile);
        }
      } else {
        const allProfiles = await db.profiles.list();
        const profile = allProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
        
        if (!profile) {
          throw new Error('User not found. Please sign up first.');
        }
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        setCurrentUserId(profile.id);
        localStorage.setItem('medtrack_current_user_id', profile.id);
        setUser(profile);
      }
      await refreshData();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err?.message || 'Failed to sign in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (authError) throw authError;
        if (!data.user) throw new Error('No user returned from Supabase signup');

        setCurrentUserId(data.user.id);
        
        let profile = await db.profiles.get(data.user.id);
        if (!profile) {
          profile = await db.profiles.create({
            id: data.user.id,
            email,
            full_name: fullName
          });
        }
        setUser(profile);
      } else {
        const allProfiles = await db.profiles.list();
        const exists = allProfiles.some(p => p.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          throw new Error('Email is already registered');
        }

        const newUserId = crypto.randomUUID();
        const newProfile = await db.profiles.create({
          id: newUserId,
          email,
          full_name: fullName
        });

        await db.settings.create({
          profile_id: newUserId,
          low_stock_threshold: 5,
          expiry_warning_days: 30,
          enable_reminders: true,
          theme: 'light'
        } as any);

        const newFamily = await db.families.create({
          name: `${fullName}'s Family`,
          created_by: newUserId
        } as any);

        await db.family_members.create({
          family_id: newFamily.id,
          profile_id: newUserId,
          name: fullName,
          role: 'admin'
        } as any);

        setCurrentUserId(newUserId);
        localStorage.setItem('medtrack_current_user_id', newUserId);
        setUser(newProfile);
      }
      await refreshData();
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err?.message || 'Failed to sign up');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (supabase) {
        const { error: authError } = await supabase.auth.signOut();
        if (authError) throw authError;
      } else {
        localStorage.removeItem('medtrack_current_user_id');
      }
      setUser(null);
      setCurrentUserId('u1-profile-id-1234-5678-9abcdef01234');
      setProfiles([]);
      setFamilies([]);
      setFamilyMembers([]);
      setInventory([]);
      setOrders([]);
      setOrderItems([]);
      setNotifications([]);
      setPrescriptions([]);
      setSettings([]);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err?.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;
    setError(null);
    setIsLoading(true);
    try {
      const updated = await db.profiles.update(user.id, updates);
      setUser(updated);
      await refreshData();
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err?.message || 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        loadedProfiles,
        loadedFamilies,
        loadedFamilyMembers,
        loadedPlatforms,
        loadedMedicines,
        loadedOrders,
        loadedOrderItems,
        loadedInventory,
        loadedPriceHistory,
        loadedNotifications,
        loadedAttachments,
        loadedPrescriptions,
        loadedSettings
      ] = await Promise.all([
        db.profiles.list(),
        db.families.list(),
        db.family_members.list(),
        db.platforms.list(),
        db.medicines.list(),
        db.orders.list(),
        db.order_items.list(),
        db.inventory.list(),
        db.price_history.list(),
        db.notifications.list(),
        db.attachments.list(),
        db.prescriptions.list(),
        db.settings.list()
      ]);

      setProfiles(loadedProfiles);
      setFamilies(loadedFamilies);
      setFamilyMembers(loadedFamilyMembers);
      setPlatforms(loadedPlatforms);
      setMedicines(loadedMedicines);
      setOrders(loadedOrders);
      setOrderItems(loadedOrderItems);
      setInventory(loadedInventory);
      setPriceHistory(loadedPriceHistory);
      setNotifications(loadedNotifications);
      setAttachments(loadedAttachments);
      setPrescriptions(loadedPrescriptions);
      setSettings(loadedSettings);

      // Run automatic checks for expiry and low stock based on settings
      const activeSettings = loadedSettings.find(s => s.profile_id === getCurrentUserId()) || loadedSettings[0];
      await runBackgroundChecks(loadedInventory, loadedMedicines, loadedNotifications, activeSettings);
    } catch (err: any) {
      console.error('Error refreshing database state:', err);
      setError(err?.message || 'Failed to sync with database');
    } finally {
      setIsLoading(false);
    }
  };

  const runBackgroundChecks = async (
    invItems: Inventory[],
    meds: Medicine[],
    notifs: Notification[],
    userSettings?: Setting
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const warningDays = userSettings ? userSettings.expiry_warning_days : 30;
    const profileId = getCurrentUserId();
    let hasChanges = false;

    for (const item of invItems) {
      if (!item.expiry_date || item.status === 'consumed' || item.status === 'discarded') continue;

      const med = meds.find(m => m.id === item.medicine_id);
      if (!med) continue;

      // 1. Check if expired
      if (item.expiry_date < today && item.status !== 'expired') {
        await db.inventory.update(item.id, { status: 'expired' } as any);
        hasChanges = true;

        const exists = notifs.some(
          n => n.metadata?.inventory_id === item.id && n.type === 'expiry_warning' && n.title === 'Expired Medicine Alert'
        );
        if (!exists) {
          await db.notifications.create({
            profile_id: profileId,
            type: 'expiry_warning',
            title: 'Expired Medicine Alert',
            message: `${med.name} (${med.brand}) expired on ${item.expiry_date}. Please dispose of it safely.`,
            is_read: false,
            read_at: null,
            metadata: {
              medicine_id: med.id,
              inventory_id: item.id
            }
          } as any);
        }
      } 
      // 2. Check if close to expiry
      else if (item.status === 'active') {
        const expiryTime = new Date(item.expiry_date).getTime();
        const todayTime = new Date(today).getTime();
        const diffDays = Math.ceil((expiryTime - todayTime) / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays <= warningDays) {
          const exists = notifs.some(
            n => n.metadata?.inventory_id === item.id && n.type === 'expiry_warning' && n.title === 'Upcoming Expiry Warning'
          );
          if (!exists) {
            await db.notifications.create({
              profile_id: profileId,
              type: 'expiry_warning',
              title: 'Upcoming Expiry Warning',
              message: `${med.name} (${med.brand}) is expiring in ${diffDays} days on ${item.expiry_date}.`,
              is_read: false,
              read_at: null,
              metadata: {
                medicine_id: med.id,
                inventory_id: item.id
              }
            } as any);
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      // Re-fetch notifications & inventory if we mutated them during checks
      const refreshedNotifs = await db.notifications.list();
      const refreshedInventory = await db.inventory.list();
      setNotifications(refreshedNotifs);
      setInventory(refreshedInventory);
    }
  };

  const addMedicine = async (
    medicineData: Omit<Medicine, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by'>
  ): Promise<Medicine> => {
    const profileId = getCurrentUserId();
    const result = await db.medicines.create({
      ...medicineData,
      created_by: profileId
    } as any);
    await refreshData();
    return result;
  };

  const createOrder = async (
    orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'profile_id'>,
    itemsData: Array<{
      medicine_id: string;
      quantity: number;
      unit_price: number;
      discount?: number;
      expiry_date?: string | null;
      batch_number?: string | null;
    }>
  ): Promise<Order> => {
    const profileId = getCurrentUserId();
    
    // Create primary Order
    const newOrder = await db.orders.create({
      ...orderData,
      profile_id: profileId
    } as any);

    // Create related items, price history and inventory
    for (const item of itemsData) {
      const discountVal = item.discount || 0;
      const totalPrice = item.quantity * item.unit_price - discountVal;

      const newItem = await db.order_items.create({
        order_id: newOrder.id,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: discountVal,
        total_price: totalPrice,
        expiry_date: item.expiry_date || null,
        batch_number: item.batch_number || null
      } as any);

      // Save recorded price in price history
      await db.price_history.create({
        medicine_id: item.medicine_id,
        platform_id: newOrder.platform_id,
        price_per_unit: item.unit_price,
        recorded_at: newOrder.order_date,
        order_item_id: newItem.id
      } as any);

      // Insert into inventory
      const isFamily = !!newOrder.family_id;
      await db.inventory.create({
        family_id: newOrder.family_id || null,
        profile_id: !isFamily ? profileId : null,
        medicine_id: item.medicine_id,
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null,
        quantity_original: item.quantity,
        quantity_remaining: item.quantity,
        status: 'active',
        location: isFamily ? 'Family Cabinet' : 'Personal Chest'
      } as any);
    }

    await refreshData();
    return newOrder;
  };

  const addInventoryItem = async (
    itemData: Omit<Inventory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
  ): Promise<Inventory> => {
    const result = await db.inventory.create(itemData as any);
    await refreshData();
    return result;
  };

  const updateInventoryItem = async (
    id: string,
    updates: Partial<Omit<Inventory, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Inventory> => {
    const result = await db.inventory.update(id, updates);
    await refreshData();
    return result;
  };

  const consumeDose = async (inventoryId: string, quantity: number): Promise<void> => {
    const invItem = await db.inventory.get(inventoryId);
    if (!invItem) throw new Error('Inventory item not found');

    const newQty = Math.max(0, invItem.quantity_remaining - quantity);
    const status = newQty === 0 ? 'consumed' : invItem.status;

    await db.inventory.update(inventoryId, {
      quantity_remaining: newQty,
      status
    } as any);

    // Fetch active settings to verify low stock thresholds
    const userSettings = settings.find(s => s.profile_id === getCurrentUserId()) || settings[0];
    const threshold = userSettings ? userSettings.low_stock_threshold : 5;
    const med = medicines.find(m => m.id === invItem.medicine_id);

    if (newQty <= threshold && newQty > 0 && med) {
      await db.notifications.create({
        profile_id: getCurrentUserId(),
        type: 'low_stock',
        title: 'Low Stock Warning',
        message: `${med.name} (${med.brand}) is running low. Only ${newQty} items left in stock.`,
        is_read: false,
        read_at: null,
        metadata: {
          medicine_id: med.id,
          inventory_id: invItem.id
        }
      } as any);
    }

    await refreshData();
  };

  const createPrescription = async (
    prescriptionData: Omit<Prescription, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'profile_id'>
  ): Promise<Prescription> => {
    const profileId = getCurrentUserId();
    const result = await db.prescriptions.create({
      ...prescriptionData,
      profile_id: profileId
    } as any);
    await refreshData();
    return result;
  };

  const updateSettings = async (
    updates: Partial<Omit<Setting, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>
  ): Promise<Setting> => {
    const activeSetting = settings.find(s => s.profile_id === getCurrentUserId()) || settings[0];
    if (!activeSetting) throw new Error('User settings record not found');

    const result = await db.settings.update(activeSetting.id, updates);
    await refreshData();
    return result;
  };

  const markNotificationAsRead = async (id: string): Promise<void> => {
    await db.notifications.update(id, {
      is_read: true,
      read_at: new Date().toISOString()
    } as any);
    await refreshData();
  };

  useEffect(() => {
    let isMounted = true;

    if (supabase) {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        if (session?.user) {
          setCurrentUserId(session.user.id);
          db.profiles.get(session.user.id).then(profile => {
            if (!isMounted) return;
            if (profile) {
              setUser(profile);
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
            refreshData();
          });
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });

      // 2. Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
        if (!isMounted) return;
        if (session?.user) {
          setCurrentUserId(session.user.id);
          const profile = await db.profiles.get(session.user.id);
          if (!isMounted) return;
          if (profile) {
            setUser(profile);
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          await refreshData();
        } else {
          setUser(null);
          setCurrentUserId('u1-profile-id-1234-5678-9abcdef01234');
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } else {
      // Mock auth initialization
      const mockUserId = localStorage.getItem('medtrack_current_user_id');
      if (mockUserId) {
        setCurrentUserId(mockUserId);
        db.profiles.get(mockUserId).then(profile => {
          if (!isMounted) return;
          if (profile) {
            setUser(profile);
            refreshData();
          } else {
            localStorage.removeItem('medtrack_current_user_id');
            setUser(null);
            setIsLoading(false);
          }
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }

      return () => {
        isMounted = false;
      };
    }
  }, []);

  return (
    <DBContext.Provider
      value={{
        user,
        profiles,
        families,
        familyMembers,
        platforms,
        medicines,
        orders,
        orderItems,
        inventory,
        priceHistory,
        notifications,
        attachments,
        prescriptions,
        settings,
        isLoading,
        error,
        refreshData,
        signIn,
        signUp,
        signOut,
        updateProfile,
        addMedicine,
        createOrder,
        addInventoryItem,
        updateInventoryItem,
        consumeDose,
        createPrescription,
        updateSettings,
        markNotificationAsRead
      }}
    >
      {children}
    </DBContext.Provider>
  );
};

// eslint-disable-next-line react/only-export-components
export const useDB = () => {
  const context = useContext(DBContext);
  if (context === undefined) {
    throw new Error('useDB must be used within a DBProvider');
  }
  return context;
};
