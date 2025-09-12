-- Add image_url column to building_info table to store building images persistently
ALTER TABLE public.building_info 
ADD COLUMN image_url TEXT;