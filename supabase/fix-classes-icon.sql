-- FIX: Add missing columns to classes table
-- Run this in Supabase SQL Editor

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'book';

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS target_grade numeric DEFAULT 90;

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS current_grade numeric;

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS credits numeric DEFAULT 3.0;

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT '[]'::jsonb;

