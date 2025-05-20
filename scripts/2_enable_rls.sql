
-- Enable Row Level Security on all tables
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audits table
-- Policy 1: Managers (מנהלת) can view all audits
CREATE POLICY "managers_view_all_audits" ON public.audits 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id::text = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'מנהלת'
        )
    );

-- Policy 2: Users can view their own audits
CREATE POLICY "users_view_own_audits" ON public.audits 
    FOR SELECT 
    USING (ownerId = auth.uid()::text);

-- Policy 3: Users can insert their own audits
CREATE POLICY "users_insert_own_audits" ON public.audits 
    FOR INSERT 
    WITH CHECK (ownerId = auth.uid()::text);

-- Policy 4: Users can update their own audits
CREATE POLICY "users_update_own_audits" ON public.audits 
    FOR UPDATE 
    USING (ownerId = auth.uid()::text);

-- Policy 5: Only owners can delete their own audits
CREATE POLICY "users_delete_own_audits" ON public.audits 
    FOR DELETE 
    USING (ownerId = auth.uid()::text);

-- Managers can update any audit
CREATE POLICY "managers_update_any_audit" ON public.audits 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id::text = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'מנהלת'
        )
    );

-- Create policies for contacts table
-- Policy 1: Anyone can view contacts of audits they can view
CREATE POLICY "view_contacts_of_visible_audits" ON public.contacts 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.audits
            WHERE audits.id = contacts.auditId
            AND (
                audits.ownerId = auth.uid()::text
                OR 
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id::text = auth.uid() 
                    AND auth.users.raw_user_meta_data->>'role' = 'מנהלת'
                )
            )
        )
    );

-- Policy 2: Users can insert contacts for their own audits
CREATE POLICY "insert_contacts_for_own_audits" ON public.contacts 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.audits
            WHERE audits.id = contacts.auditId
            AND audits.ownerId = auth.uid()::text
        )
    );

-- Policy 3: Users can update contacts for their own audits
CREATE POLICY "update_contacts_for_own_audits" ON public.contacts 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.audits
            WHERE audits.id = contacts.auditId
            AND audits.ownerId = auth.uid()::text
        )
    );

-- Policy 4: Users can delete contacts for their own audits
CREATE POLICY "delete_contacts_for_own_audits" ON public.contacts 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.audits
            WHERE audits.id = contacts.auditId
            AND audits.ownerId = auth.uid()::text
        )
    );

-- Policy 5: Managers can update any contacts
CREATE POLICY "managers_update_any_contacts" ON public.contacts 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id::text = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'מנהלת'
        )
    );

-- Create policies for status_logs table
-- Policy 1: Anyone can view status logs of audits they can view
CREATE POLICY "view_status_logs_of_visible_audits" ON public.status_logs 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.audits
            WHERE audits.id = status_logs.auditId
            AND (
                audits.ownerId = auth.uid()::text
                OR 
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id::text = auth.uid() 
                    AND auth.users.raw_user_meta_data->>'role' = 'מנהלת'
                )
            )
        )
    );

-- Policy 2: Users can insert status logs for their own audits
CREATE POLICY "insert_status_logs_for_own_audits" ON public.status_logs 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.audits
            WHERE audits.id = status_logs.auditId
            AND audits.ownerId = auth.uid()::text
        )
    );

-- Policy 3: Managers can insert status logs for any audit
CREATE POLICY "managers_insert_status_logs_for_any_audit" ON public.status_logs 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id::text = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'מנהלת'
        )
    );
