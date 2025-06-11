
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://btbcvtdgabqituisviqu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YmN2dGRnYWJxaXR1aXN2aXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjQ3NjIsImV4cCI6MjA2NTE0MDc2Mn0.CpzRUuIuP8jPx-v7cVzZeBHXtVFZPIGtjxYV7KeDX0E";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
