export interface Profile {
  id: string; // UUID, references auth.users.id
  email: string;
  full_name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Family {
  id: string; // UUID
  name: string;
  created_by: string; // references profiles.id
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface FamilyMember {
  id: string; // UUID
  family_id: string; // references families.id
  profile_id?: string | null; // references profiles.id (nullable for non-user members)
  name: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Platform {
  id: string; // UUID
  name: string;
  website_url?: string | null;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Medicine {
  id: string; // UUID
  name: string;
  brand: string;
  description?: string | null;
  dosage_form: string; // e.g., 'Tablet', 'Syrup', 'Capsule', 'Inhaler', etc.
  strength: string; // e.g., '500mg', '10ml', etc.
  created_by?: string | null; // references profiles.id (null for system defaults)
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Order {
  id: string; // UUID
  profile_id: string; // references profiles.id
  family_id?: string | null; // references families.id
  platform_id: string; // references platforms.id
  order_date: string;
  order_number: string;
  subtotal: number;
  discount: number;
  tax: number;
  delivery_charges: number;
  total_amount: number;
  status: 'ordered' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface OrderItem {
  id: string; // UUID
  order_id: string; // references orders.id
  medicine_id: string; // references medicines.id
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
  expiry_date?: string | null; // Format: YYYY-MM-DD
  batch_number?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Inventory {
  id: string; // UUID
  family_id?: string | null; // references families.id
  profile_id?: string | null; // references profiles.id
  medicine_id: string; // references medicines.id
  batch_number?: string | null;
  expiry_date?: string | null; // Format: YYYY-MM-DD
  quantity_remaining: number;
  quantity_original: number;
  location?: string | null; // e.g., 'Medicine Box', 'Fridge'
  status: 'active' | 'consumed' | 'expired' | 'discarded';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface PriceHistory {
  id: string; // UUID
  medicine_id: string; // references medicines.id
  platform_id: string; // references platforms.id
  price_per_unit: number; // calculated unit price
  recorded_at: string;
  order_item_id?: string | null; // references order_items.id
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Notification {
  id: string; // UUID
  profile_id: string; // references profiles.id
  type: 'expiry_warning' | 'low_stock' | 'medication_reminder' | 'order_status';
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Attachment {
  id: string; // UUID
  profile_id: string; // references profiles.id
  entity_type: 'order' | 'prescription' | 'medicine';
  entity_id: string; // UUID of the associated entity
  file_path: string; // Supabase storage path
  file_name: string;
  file_type: string; // MIME type
  file_size: number; // in bytes
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_result?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Prescription {
  id: string; // UUID
  profile_id: string; // references profiles.id
  family_member_id?: string | null; // references family_members.id
  doctor_name: string;
  clinic_name?: string | null;
  prescription_date: string; // Format: YYYY-MM-DD
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Setting {
  id: string; // UUID
  profile_id: string; // references profiles.id
  low_stock_threshold: number;
  expiry_warning_days: number;
  enable_reminders: boolean;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Profile, 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Profile>;
      };
      families: {
        Row: Family;
        Insert: Omit<Family, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Family, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Family>;
      };
      family_members: {
        Row: FamilyMember;
        Insert: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<FamilyMember>;
      };
      platforms: {
        Row: Platform;
        Insert: Omit<Platform, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Platform, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Platform>;
      };
      medicines: {
        Row: Medicine;
        Insert: Omit<Medicine, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Medicine, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Medicine>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Order, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<OrderItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<OrderItem>;
      };
      inventory: {
        Row: Inventory;
        Insert: Omit<Inventory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Inventory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Inventory>;
      };
      price_history: {
        Row: PriceHistory;
        Insert: Omit<PriceHistory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<PriceHistory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<PriceHistory>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Notification, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Notification>;
      };
      attachments: {
        Row: Attachment;
        Insert: Omit<Attachment, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Attachment, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Attachment>;
      };
      prescriptions: {
        Row: Prescription;
        Insert: Omit<Prescription, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Prescription, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Prescription>;
      };
      settings: {
        Row: Setting;
        Insert: Omit<Setting, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Setting, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Setting>;
      };
    };
  };
}
