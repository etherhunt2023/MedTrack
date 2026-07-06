import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
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
  Setting,
  Database
} from '../types/database.types';

// =========================================================================
// 1. SUPABASE CLIENT CONFIGURATION
// =========================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

// =========================================================================
// 2. MOCK DATA INITIALIZATION
// =========================================================================
const DEFAULT_USER_ID = 'u1-profile-id-1234-5678-9abcdef01234';
let currentUserId = DEFAULT_USER_ID;

export const getCurrentUserId = (): string => currentUserId;
export const setCurrentUserId = (id: string): void => {
  currentUserId = id;
};

const MOCK_PROFILES: Profile[] = [
  {
    id: DEFAULT_USER_ID,
    email: 'jane.doe@example.com',
    full_name: 'Jane Doe',
    avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jane',
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  }
];

const MOCK_SETTINGS: Setting[] = [
  {
    id: 's1-settings-id-1234-5678-9abcdef01234',
    profile_id: DEFAULT_USER_ID,
    low_stock_threshold: 5,
    expiry_warning_days: 30,
    enable_reminders: true,
    theme: 'light',
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  }
];

const MOCK_FAMILIES: Family[] = [
  {
    id: 'f1-family-id-1234-5678-9abcdef01234',
    name: 'Doe Family Group',
    created_by: DEFAULT_USER_ID,
    created_at: '2026-01-02T10:00:00Z',
    updated_at: '2026-01-02T10:00:00Z',
    deleted_at: null
  }
];

const MOCK_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fm1-member-id-1234-5678-9abcdef01234',
    family_id: 'f1-family-id-1234-5678-9abcdef01234',
    profile_id: DEFAULT_USER_ID,
    name: 'Jane Doe',
    role: 'admin',
    created_at: '2026-01-02T10:00:00Z',
    updated_at: '2026-01-02T10:00:00Z',
    deleted_at: null
  },
  {
    id: 'fm2-member-id-1234-5678-9abcdef01234',
    family_id: 'f1-family-id-1234-5678-9abcdef01234',
    profile_id: null,
    name: 'Johnny Doe (Child)',
    role: 'member',
    created_at: '2026-01-02T10:05:00Z',
    updated_at: '2026-01-02T10:05:00Z',
    deleted_at: null
  },
  {
    id: 'fm3-member-id-1234-5678-9abcdef01234',
    family_id: 'f1-family-id-1234-5678-9abcdef01234',
    profile_id: null,
    name: 'Grandma Doe',
    role: 'member',
    created_at: '2026-01-02T10:10:00Z',
    updated_at: '2026-01-02T10:10:00Z',
    deleted_at: null
  }
];

const MOCK_PLATFORMS: Platform[] = [
  {
    id: 'p1-platform-id-1234-5678-9abcdef01234',
    name: 'Tata 1mg',
    website_url: 'https://www.1mg.com',
    logo_url: 'https://img.1mg.com/images/tata_1mg_logo.svg',
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  },
  {
    id: 'p2-platform-id-1234-5678-9abcdef01234',
    name: 'PharmEasy',
    website_url: 'https://pharmeasy.in',
    logo_url: 'https://assets.pharmeasy.in/web-assets/dist/fca22c5d.svg',
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  },
  {
    id: 'p3-platform-id-1234-5678-9abcdef01234',
    name: 'Apollo Pharmacy',
    website_url: 'https://www.apollopharmacy.in',
    logo_url: null,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  },
  {
    id: 'p4-platform-id-1234-5678-9abcdef01234',
    name: 'Local Pharmacy',
    website_url: null,
    logo_url: null,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  }
];

const MOCK_MEDICINES: Medicine[] = [
  {
    id: 'm1-med-id-1234-5678-9abcdef01234',
    name: 'Paracetamol',
    brand: 'Crocin 650',
    description: 'Analgesic and antipyretic for pain and fever relief.',
    dosage_form: 'Tablet',
    strength: '650mg',
    created_by: null,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  },
  {
    id: 'm2-med-id-1234-5678-9abcdef01234',
    name: 'Amoxicillin',
    brand: 'Amoxil',
    description: 'Penicillin-type antibiotic for bacterial infections.',
    dosage_form: 'Capsule',
    strength: '500mg',
    created_by: null,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  },
  {
    id: 'm3-med-id-1234-5678-9abcdef01234',
    name: 'Atorvastatin',
    brand: 'Lipitor',
    description: 'HMG-CoA reductase inhibitor to lower cholesterol levels.',
    dosage_form: 'Tablet',
    strength: '10mg',
    created_by: null,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  },
  {
    id: 'm4-med-id-1234-5678-9abcdef01234',
    name: 'Metformin Hydrochloride',
    brand: 'Glycomet 500 SR',
    description: 'Oral antihyperglycemic agent for managing type 2 diabetes.',
    dosage_form: 'Tablet',
    strength: '500mg',
    created_by: null,
    created_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-01T12:00:00Z',
    deleted_at: null
  }
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'o1-order-id-1234-5678-9abcdef01234',
    profile_id: DEFAULT_USER_ID,
    family_id: 'f1-family-id-1234-5678-9abcdef01234',
    platform_id: 'p1-platform-id-1234-5678-9abcdef01234',
    order_date: '2026-06-01T10:00:00Z',
    order_number: 'TXN-87612398',
    subtotal: 350.0,
    discount: 50.0,
    tax: 18.0,
    delivery_charges: 40.0,
    total_amount: 358.0,
    status: 'delivered',
    created_at: '2026-06-01T10:15:00Z',
    updated_at: '2026-06-01T14:30:00Z',
    deleted_at: null
  },
  {
    id: 'o2-order-id-1234-5678-9abcdef01234',
    profile_id: DEFAULT_USER_ID,
    family_id: 'f1-family-id-1234-5678-9abcdef01234',
    platform_id: 'p2-platform-id-1234-5678-9abcdef01234',
    order_date: '2026-06-25T15:30:00Z',
    order_number: 'PE-9081273',
    subtotal: 120.0,
    discount: 10.0,
    tax: 6.0,
    delivery_charges: 0.0,
    total_amount: 116.0,
    status: 'delivered',
    created_at: '2026-06-25T15:45:00Z',
    updated_at: '2026-06-26T12:00:00Z',
    deleted_at: null
  }
];

const MOCK_ORDER_ITEMS: OrderItem[] = [
  {
    id: 'oi1-item-id-1234-5678-9abcdef01234',
    order_id: 'o1-order-id-1234-5678-9abcdef01234',
    medicine_id: 'm1-med-id-1234-5678-9abcdef01234',
    quantity: 2,
    unit_price: 40.0,
    discount: 0.0,
    total_price: 80.0,
    expiry_date: '2028-05-31',
    batch_number: 'CROC-872A',
    created_at: '2026-06-01T10:15:00Z',
    updated_at: '2026-06-01T10:15:00Z',
    deleted_at: null
  },
  {
    id: 'oi2-item-id-1234-5678-9abcdef01234',
    order_id: 'o1-order-id-1234-5678-9abcdef01234',
    medicine_id: 'm2-med-id-1234-5678-9abcdef01234',
    quantity: 1,
    unit_price: 120.0,
    discount: 10.0,
    total_price: 110.0,
    expiry_date: '2026-05-15',
    batch_number: 'AMX-112B',
    created_at: '2026-06-01T10:15:00Z',
    updated_at: '2026-06-01T10:15:00Z',
    deleted_at: null
  },
  {
    id: 'oi3-item-id-1234-5678-9abcdef01234',
    order_id: 'o1-order-id-1234-5678-9abcdef01234',
    medicine_id: 'm4-med-id-1234-5678-9abcdef01234',
    quantity: 3,
    unit_price: 50.0,
    discount: 0.0,
    total_price: 150.0,
    expiry_date: '2027-09-30',
    batch_number: 'GLY-998C',
    created_at: '2026-06-01T10:15:00Z',
    updated_at: '2026-06-01T10:15:00Z',
    deleted_at: null
  },
  {
    id: 'oi4-item-id-1234-5678-9abcdef01234',
    order_id: 'o2-order-id-1234-5678-9abcdef01234',
    medicine_id: 'm1-med-id-1234-5678-9abcdef01234',
    quantity: 3,
    unit_price: 40.0,
    discount: 0.0,
    total_price: 120.0,
    expiry_date: '2028-05-31',
    batch_number: 'CROC-872A',
    created_at: '2026-06-25T15:45:00Z',
    updated_at: '2026-06-25T15:45:00Z',
    deleted_at: null
  }
];

const MOCK_INVENTORY: Inventory[] = [
  {
    id: 'inv1-inv-id-1234-5678-9abcdef01234',
    family_id: 'f1-family-id-1234-5678-9abcdef01234',
    profile_id: null,
    medicine_id: 'm1-med-id-1234-5678-9abcdef01234',
    batch_number: 'CROC-872A',
    expiry_date: '2028-05-31',
    quantity_remaining: 50,
    quantity_original: 50,
    location: 'First Aid Box (Hall)',
    status: 'active',
    created_at: '2026-06-01T14:30:00Z',
    updated_at: '2026-06-25T16:00:00Z',
    deleted_at: null
  },
  {
    id: 'inv2-inv-id-1234-5678-9abcdef01234',
    family_id: 'f1-family-id-1234-5678-9abcdef01234',
    profile_id: null,
    medicine_id: 'm2-med-id-1234-5678-9abcdef01234',
    batch_number: 'AMX-112B',
    expiry_date: '2026-05-15',
    quantity_remaining: 10,
    quantity_original: 15,
    location: 'Kitchen Drawer',
    status: 'expired',
    created_at: '2026-06-01T14:30:00Z',
    updated_at: '2026-06-01T14:30:00Z',
    deleted_at: null
  },
  {
    id: 'inv3-inv-id-1234-5678-9abcdef01234',
    family_id: 'f1-family-id-1234-5678-9abcdef01234',
    profile_id: null,
    medicine_id: 'm4-med-id-1234-5678-9abcdef01234',
    batch_number: 'GLY-998C',
    expiry_date: '2027-09-30',
    quantity_remaining: 2,
    quantity_original: 30,
    location: 'Jane Bedside Table',
    status: 'active',
    created_at: '2026-06-01T14:30:00Z',
    updated_at: '2026-07-01T10:00:00Z',
    deleted_at: null
  }
];

const MOCK_PRICE_HISTORY: PriceHistory[] = [
  {
    id: 'ph1-price-id-1234-5678-9abcdef01234',
    medicine_id: 'm1-med-id-1234-5678-9abcdef01234',
    platform_id: 'p1-platform-id-1234-5678-9abcdef01234',
    price_per_unit: 4.0,
    recorded_at: '2026-06-01T10:00:00Z',
    order_item_id: 'oi1-item-id-1234-5678-9abcdef01234',
    created_at: '2026-06-01T10:15:00Z',
    updated_at: '2026-06-01T10:15:00Z',
    deleted_at: null
  },
  {
    id: 'ph2-price-id-1234-5678-9abcdef01234',
    medicine_id: 'm1-med-id-1234-5678-9abcdef01234',
    platform_id: 'p2-platform-id-1234-5678-9abcdef01234',
    price_per_unit: 3.8,
    recorded_at: '2026-06-25T15:30:00Z',
    order_item_id: 'oi4-item-id-1234-5678-9abcdef01234',
    created_at: '2026-06-25T15:45:00Z',
    updated_at: '2026-06-25T15:45:00Z',
    deleted_at: null
  }
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1-notif-id-1234-5678-9abcdef01234',
    profile_id: DEFAULT_USER_ID,
    type: 'expiry_warning',
    title: 'Expired Medicine Alert',
    message: 'Amoxicillin (Batch: AMX-112B) in Kitchen Drawer expired on 2026-05-15. Please dispose of it safely.',
    is_read: false,
    read_at: null,
    metadata: {
      medicine_id: 'm2-med-id-1234-5678-9abcdef01234',
      inventory_id: 'inv2-inv-id-1234-5678-9abcdef01234'
    },
    created_at: '2026-07-01T08:00:00Z',
    updated_at: '2026-07-01T08:00:00Z',
    deleted_at: null
  },
  {
    id: 'n2-notif-id-1234-5678-9abcdef01234',
    profile_id: DEFAULT_USER_ID,
    type: 'low_stock',
    title: 'Low Stock Warning',
    message: 'Metformin Hydrochloride (Glycomet 500 SR) is running low. Only 2 tablets remaining.',
    is_read: false,
    read_at: null,
    metadata: {
      medicine_id: 'm4-med-id-1234-5678-9abcdef01234',
      inventory_id: 'inv3-inv-id-1234-5678-9abcdef01234'
    },
    created_at: '2026-07-02T09:30:00Z',
    updated_at: '2026-07-02T09:30:00Z',
    deleted_at: null
  }
];

const MOCK_ATTACHMENTS: Attachment[] = [
  {
    id: 'a1-attach-id-1234-5678-9abcdef01234',
    profile_id: DEFAULT_USER_ID,
    entity_type: 'order',
    entity_id: 'o1-order-id-1234-5678-9abcdef01234',
    file_path: 'orders/u1/invoice_o1.pdf',
    file_name: 'Tata1mg_Invoice_June.pdf',
    file_type: 'application/pdf',
    file_size: 245102,
    ocr_status: 'completed',
    ocr_result: {
      invoice_number: 'TXN-87612398',
      date: '2026-06-01',
      total: 358.0,
      items: [
        { name: 'Crocin 650', quantity: 2, price: 40.0 },
        { name: 'Amoxil', quantity: 1, price: 120.0 },
        { name: 'Glycomet 500 SR', quantity: 3, price: 50.0 }
      ]
    },
    created_at: '2026-06-01T10:15:00Z',
    updated_at: '2026-06-01T10:20:00Z',
    deleted_at: null
  }
];

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'pr1-prescr-id-1234-5678-9abcdef01234',
    profile_id: DEFAULT_USER_ID,
    family_member_id: 'fm1-member-id-1234-5678-9abcdef01234',
    doctor_name: 'Dr. Aris Thorne',
    clinic_name: 'Metropolis Endocrine Center',
    prescription_date: '2026-05-10',
    notes: 'Take Metformin 500mg once daily with dinner. Monitor blood sugar weekly.',
    created_at: '2026-05-10T11:00:00Z',
    updated_at: '2026-05-10T11:00:00Z',
    deleted_at: null
  }
];

// =========================================================================
// 3. GENERIC LOCAL STORAGE ENTITY SERVICE
// =========================================================================
export interface EntityService<T, TInsert, TUpdate> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: TInsert): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<T>;
}

class LocalStorageService<
  T extends { id: string; created_at: string; updated_at: string; deleted_at?: string | null },
  TInsert extends Record<string, any>,
  TUpdate extends Record<string, any>
> implements EntityService<T, TInsert, TUpdate>
{
  private key: string;
  private defaultData: T[];

  constructor(tableName: string, defaultData: T[]) {
    this.key = `medtrack_${tableName}`;
    this.defaultData = defaultData;
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.key)) {
      localStorage.setItem(this.key, JSON.stringify(this.defaultData));
    }
  }

  private getRaw(): T[] {
    this.init();
    return JSON.parse(localStorage.getItem(this.key) || '[]');
  }

  private setRaw(data: T[]): void {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  async list(): Promise<T[]> {
    return this.getRaw().filter((item) => !item.deleted_at);
  }

  async get(id: string): Promise<T | null> {
    const items = await this.list();
    return items.find((item) => item.id === id) || null;
  }

  async create(data: TInsert): Promise<T> {
    const items = this.getRaw();
    const now = new Date().toISOString();
    const newItem = {
      ...data,
      id: data.id || crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      deleted_at: null
    } as unknown as T;

    items.push(newItem);
    this.setRaw(items);
    return newItem;
  }

  async update(id: string, data: TUpdate): Promise<T> {
    const items = this.getRaw();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Record with id ${id} not found`);
    }

    const updatedItem = {
      ...items[index],
      ...data,
      updated_at: new Date().toISOString()
    } as unknown as T;

    items[index] = updatedItem;
    this.setRaw(items);
    return updatedItem;
  }

  async delete(id: string): Promise<T> {
    return this.update(id, { deleted_at: new Date().toISOString() } as any);
  }
}

// =========================================================================
// 4. SUPABASE TABLE ADAPTER
// =========================================================================
class SupabaseTableService<
  T extends { id: string; created_at: string; updated_at: string; deleted_at?: string | null },
  TInsert extends Record<string, any>,
  TUpdate extends Record<string, any>
> implements EntityService<T, TInsert, TUpdate>
{
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getClient() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    return supabase;
  }

  async list(): Promise<T[]> {
    const client = this.getClient();
    const { data, error } = await (client.from(this.tableName as any) as any)
      .select('*')
      .is('deleted_at', null);

    if (error) throw error;
    return (data || []) as T[];
  }

  async get(id: string): Promise<T | null> {
    const client = this.getClient();
    const { data, error } = await (client.from(this.tableName as any) as any)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as T | null;
  }

  async create(data: TInsert): Promise<T> {
    const client = this.getClient();
    const { data: inserted, error } = await (client.from(this.tableName as any) as any)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return inserted as T;
  }

  async update(id: string, data: TUpdate): Promise<T> {
    const client = this.getClient();
    const { data: updated, error } = await (client.from(this.tableName as any) as any)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as T;
  }

  async delete(id: string): Promise<T> {
    const now = new Date().toISOString();
    const client = this.getClient();
    const { data: deleted, error } = await (client.from(this.tableName as any) as any)
      .update({ deleted_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return deleted as T;
  }
}

// =========================================================================
// 5. EXPORT DATABASE SERVICE (AUTO SWITCHING)
// =========================================================================
const createService = <
  T extends { id: string; created_at: string; updated_at: string; deleted_at?: string | null },
  TInsert extends Record<string, any>,
  TUpdate extends Record<string, any>
>(
  tableName: string,
  defaultData: T[]
): EntityService<T, TInsert, TUpdate> => {
  if (isSupabaseConfigured) {
    return new SupabaseTableService<T, TInsert, TUpdate>(tableName);
  } else {
    return new LocalStorageService<T, TInsert, TUpdate>(tableName, defaultData);
  }
};

export const db = {
  profiles: createService<
    Profile,
    Omit<Profile, 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Profile, 'id'>>,
    Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
  >('profiles', MOCK_PROFILES),

  families: createService<
    Family,
    Omit<Family, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Family, 'id'>>,
    Partial<Omit<Family, 'id' | 'created_at' | 'updated_at'>>
  >('families', MOCK_FAMILIES),

  family_members: createService<
    FamilyMember,
    Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<FamilyMember, 'id'>>,
    Partial<Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>>
  >('family_members', MOCK_FAMILY_MEMBERS),

  platforms: createService<
    Platform,
    Omit<Platform, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Platform, 'id'>>,
    Partial<Omit<Platform, 'id' | 'created_at' | 'updated_at'>>
  >('platforms', MOCK_PLATFORMS),

  medicines: createService<
    Medicine,
    Omit<Medicine, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Medicine, 'id'>>,
    Partial<Omit<Medicine, 'id' | 'created_at' | 'updated_at'>>
  >('medicines', MOCK_MEDICINES),

  orders: createService<
    Order,
    Omit<Order, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Order, 'id'>>,
    Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>
  >('orders', MOCK_ORDERS),

  order_items: createService<
    OrderItem,
    Omit<OrderItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<OrderItem, 'id'>>,
    Partial<Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>>
  >('order_items', MOCK_ORDER_ITEMS),

  inventory: createService<
    Inventory,
    Omit<Inventory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Inventory, 'id'>>,
    Partial<Omit<Inventory, 'id' | 'created_at' | 'updated_at'>>
  >('inventory', MOCK_INVENTORY),

  price_history: createService<
    PriceHistory,
    Omit<PriceHistory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<PriceHistory, 'id'>>,
    Partial<Omit<PriceHistory, 'id' | 'created_at' | 'updated_at'>>
  >('price_history', MOCK_PRICE_HISTORY),

  notifications: createService<
    Notification,
    Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Notification, 'id'>>,
    Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>
  >('notifications', MOCK_NOTIFICATIONS),

  attachments: createService<
    Attachment,
    Omit<Attachment, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Attachment, 'id'>>,
    Partial<Omit<Attachment, 'id' | 'created_at' | 'updated_at'>>
  >('attachments', MOCK_ATTACHMENTS),

  prescriptions: createService<
    Prescription,
    Omit<Prescription, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Prescription, 'id'>>,
    Partial<Omit<Prescription, 'id' | 'created_at' | 'updated_at'>>
  >('prescriptions', MOCK_PRESCRIPTIONS),

  settings: createService<
    Setting,
    Omit<Setting, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Setting, 'id'>>,
    Partial<Omit<Setting, 'id' | 'created_at' | 'updated_at'>>
  >('settings', MOCK_SETTINGS)
};
