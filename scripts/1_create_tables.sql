
-- Create the audits table
CREATE TABLE IF NOT EXISTS public.audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    clientName TEXT,
    receivedDate TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    plannedMeetingDate TIMESTAMP WITH TIME ZONE,
    currentStatus TEXT NOT NULL DEFAULT 'התקבל',
    ownerId TEXT NOT NULL,
    ownerName TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditId UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    fullName TEXT NOT NULL,
    role TEXT,
    email TEXT,
    phone TEXT,
    gender TEXT DEFAULT 'other',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the status_logs table
CREATE TABLE IF NOT EXISTS public.status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditId UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    oldStatus TEXT,
    newStatus TEXT NOT NULL,
    oldDate TIMESTAMP WITH TIME ZONE,
    newDate TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    modifiedBy TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_owner ON public.audits(ownerId);
CREATE INDEX IF NOT EXISTS idx_contacts_audit ON public.contacts(auditId);
CREATE INDEX IF NOT EXISTS idx_status_logs_audit ON public.status_logs(auditId);
