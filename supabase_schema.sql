-- MedTrack Database Schema Definition
-- Includes tables, constraints, triggers, indexes, and Row Level Security (RLS) policies.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TIMESTAMP UPDATE TRIGGER FUNCTION
-- =========================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================================
-- 2. TABLES DEFINITIONS
-- =========================================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Families (family group units)
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Family Members (link table for profiles and families, support non-user members)
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_family_profile UNIQUE (family_id, profile_id)
);

-- Platforms (purchasing sources, e.g. 1mg, Pharmeasy, Local Pharmacy)
CREATE TABLE IF NOT EXISTS public.platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    website_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Medicines (master directory of medicines)
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    description TEXT,
    dosage_form TEXT NOT NULL, -- e.g. Tablet, Syrup, Capsule, etc.
    strength TEXT NOT NULL, -- e.g. 500mg, 10ml, etc.
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null if global default medicine
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_medicine_name_brand_strength UNIQUE (name, brand, strength)
);

-- Orders (orders recorded by users)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE RESTRICT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    order_number TEXT NOT NULL,
    subtotal NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (discount >= 0),
    tax NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (tax >= 0),
    delivery_charges NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (delivery_charges >= 0),
    total_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Order Items (medicines within an order)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (discount >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    expiry_date DATE,
    batch_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Inventory (tracks current stock of medicines)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    batch_number TEXT,
    expiry_date DATE,
    quantity_remaining NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (quantity_remaining >= 0),
    quantity_original NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (quantity_original >= 0),
    location TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'discarded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_inventory_owner CHECK (
        (family_id IS NOT NULL AND profile_id IS NULL) OR 
        (profile_id IS NOT NULL AND family_id IS NULL)
    )
);

-- Price History (historical pricing database of medicines per unit across platforms)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
    price_per_unit NUMERIC(12, 2) NOT NULL CHECK (price_per_unit >= 0),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Notifications (expiry warnings, low stock, dose reminders)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('expiry_warning', 'low_stock', 'medication_reminder', 'order_status')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Attachments (uploaded invoices, prescription scans, OCR metadata)
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('order', 'prescription', 'medicine')),
    entity_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    ocr_status TEXT NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
    ocr_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Prescriptions (scanned/uploaded prescriptions for family members or profiles)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    doctor_name TEXT NOT NULL,
    clinic_name TEXT,
    prescription_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Settings (user configuration parameters)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    low_stock_threshold INTEGER DEFAULT 5 NOT NULL CHECK (low_stock_threshold >= 0),
    expiry_warning_days INTEGER DEFAULT 30 NOT NULL CHECK (expiry_warning_days >= 0),
    enable_reminders BOOLEAN DEFAULT TRUE NOT NULL,
    theme TEXT DEFAULT 'system' NOT NULL CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================================
-- 3. TRIGGERS FOR TIMESTAMP UPDATES
-- =========================================================================
CREATE TRIGGER trigger_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_families BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_family_members BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_platforms BEFORE UPDATE ON public.platforms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_medicines BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_order_items BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_inventory BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_price_history BEFORE UPDATE ON public.price_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_notifications BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_attachments BEFORE UPDATE ON public.attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_prescriptions BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 4. PERFORMANCE INDEXES
-- =========================================================================
-- Indexing foreign keys and fields in active WHERE/JOIN clauses
CREATE INDEX IF NOT EXISTS idx_families_created_by ON public.families(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_family_members_profile_id ON public.family_members(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_medicines_created_by ON public.medicines(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON public.orders(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_family_id ON public.orders(family_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_platform_id ON public.orders(platform_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_medicine_id ON public.order_items(medicine_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_family_id ON public.inventory(family_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_profile_id ON public.inventory(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_medicine_id ON public.inventory(medicine_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_price_history_medicine_id ON public.price_history(medicine_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_price_history_platform_id ON public.price_history(platform_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(profile_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attachments_profile_id ON public.attachments(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON public.attachments(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_profile_id ON public.prescriptions(profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_family_member_id ON public.prescriptions(family_member_id) WHERE deleted_at IS NULL;

-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 5.1. Profiles policies
CREATE POLICY "Users can read own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 5.2. Families policies
CREATE POLICY "Users can read families they belong to" 
    ON public.families FOR SELECT 
    USING (
        created_by = auth.uid() OR 
        id IN (SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL)
    );

CREATE POLICY "Users can insert families" 
    ON public.families FOR INSERT 
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update families" 
    ON public.families FOR UPDATE 
    USING (created_by = auth.uid());

CREATE POLICY "Creators can delete families" 
    ON public.families FOR DELETE 
    USING (created_by = auth.uid());

-- 5.3. Family Members policies
CREATE POLICY "Users can view members of their families" 
    ON public.family_members FOR SELECT 
    USING (
        family_id IN (
            SELECT id FROM public.families WHERE created_by = auth.uid() AND deleted_at IS NULL
            UNION
            SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL
        )
    );

CREATE POLICY "Family admins can insert members" 
    ON public.family_members FOR INSERT 
    WITH CHECK (
        family_id IN (
            SELECT id FROM public.families WHERE created_by = auth.uid() AND deleted_at IS NULL
            UNION
            SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND role = 'admin' AND deleted_at IS NULL
        )
    );

CREATE POLICY "Family admins can update members" 
    ON public.family_members FOR UPDATE 
    USING (
        family_id IN (
            SELECT id FROM public.families WHERE created_by = auth.uid() AND deleted_at IS NULL
            UNION
            SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND role = 'admin' AND deleted_at IS NULL
        )
    );

CREATE POLICY "Family admins can delete members" 
    ON public.family_members FOR DELETE 
    USING (
        family_id IN (
            SELECT id FROM public.families WHERE created_by = auth.uid() AND deleted_at IS NULL
            UNION
            SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND role = 'admin' AND deleted_at IS NULL
        )
    );

-- 5.4. Platforms policies
CREATE POLICY "All authenticated users can view platforms" 
    ON public.platforms FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can insert platforms" 
    ON public.platforms FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 5.5. Medicines policies
CREATE POLICY "Users can view global or own medicines" 
    ON public.medicines FOR SELECT 
    USING (created_by IS NULL OR created_by = auth.uid());

CREATE POLICY "Users can insert medicines" 
    ON public.medicines FOR INSERT 
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own medicines" 
    ON public.medicines FOR UPDATE 
    USING (created_by = auth.uid());

-- 5.6. Orders policies
CREATE POLICY "Users can read own/family orders" 
    ON public.orders FOR SELECT 
    USING (
        profile_id = auth.uid() OR 
        family_id IN (SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL)
    );

CREATE POLICY "Users can insert own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own orders" 
    ON public.orders FOR UPDATE 
    USING (profile_id = auth.uid());

-- 5.7. Order Items policies
CREATE POLICY "Users can read own/family order items" 
    ON public.order_items FOR SELECT 
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE profile_id = auth.uid() OR family_id IN (
                SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL
            )
        )
    );

CREATE POLICY "Users can insert order items" 
    ON public.order_items FOR INSERT 
    WITH CHECK (
        order_id IN (SELECT id FROM public.orders WHERE profile_id = auth.uid())
    );

CREATE POLICY "Users can update order items" 
    ON public.order_items FOR UPDATE 
    USING (
        order_id IN (SELECT id FROM public.orders WHERE profile_id = auth.uid())
    );

-- 5.8. Inventory policies
CREATE POLICY "Users can read own/family inventory" 
    ON public.inventory FOR SELECT 
    USING (
        profile_id = auth.uid() OR 
        family_id IN (SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL)
    );

CREATE POLICY "Users can insert inventory" 
    ON public.inventory FOR INSERT 
    WITH CHECK (
        (profile_id = auth.uid()) OR
        (family_id IN (SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL))
    );

CREATE POLICY "Users can update inventory" 
    ON public.inventory FOR UPDATE 
    USING (
        profile_id = auth.uid() OR 
        family_id IN (SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL)
    );

-- 5.9. Price History policies
CREATE POLICY "All authenticated users can read price history" 
    ON public.price_history FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can insert price history" 
    ON public.price_history FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 5.10. Notifications policies
CREATE POLICY "Users can read own notifications" 
    ON public.notifications FOR SELECT 
    USING (profile_id = auth.uid());

CREATE POLICY "Users can update own notifications" 
    ON public.notifications FOR UPDATE 
    USING (profile_id = auth.uid());

-- 5.11. Attachments policies
CREATE POLICY "Users can read own/family attachments" 
    ON public.attachments FOR SELECT 
    USING (
        profile_id = auth.uid() OR
        (entity_type = 'order' AND entity_id IN (
            SELECT id FROM public.orders WHERE family_id IN (
                SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL
            )
        ))
    );

CREATE POLICY "Users can insert attachments" 
    ON public.attachments FOR INSERT 
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update/delete attachments" 
    ON public.attachments FOR UPDATE 
    USING (profile_id = auth.uid());

-- 5.12. Prescriptions policies
CREATE POLICY "Users can read own/family prescriptions" 
    ON public.prescriptions FOR SELECT 
    USING (
        profile_id = auth.uid() OR
        family_member_id IN (
            SELECT id FROM public.family_members WHERE family_id IN (
                SELECT family_id FROM public.family_members WHERE profile_id = auth.uid() AND deleted_at IS NULL
            )
        )
    );

CREATE POLICY "Users can insert prescriptions" 
    ON public.prescriptions FOR INSERT 
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own prescriptions" 
    ON public.prescriptions FOR UPDATE 
    USING (profile_id = auth.uid());

-- 5.13. Settings policies
CREATE POLICY "Users can read own settings" 
    ON public.settings FOR SELECT 
    USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own settings" 
    ON public.settings FOR INSERT 
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own settings" 
    ON public.settings FOR UPDATE 
    USING (profile_id = auth.uid());

-- =========================================================================
-- 6. PROFILE AUTO-CREATION ON SIGNUP
-- =========================================================================
-- Trigger to automatically create a public profile and settings when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    INSERT INTO public.settings (profile_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
