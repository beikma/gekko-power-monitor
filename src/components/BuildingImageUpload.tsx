import { useState, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BuildingImageUploadProps {
  buildingId: string;
  onImageUploaded?: (url: string) => void;
}

export default function BuildingImageUpload({ buildingId, onImageUploaded }: BuildingImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing image when component mounts
  useEffect(() => {
    const loadExistingImage = async () => {
      if (!buildingId) return;
      
      try {
        const { data, error } = await supabase
          .from('building_info')
          .select('image_url')
          .eq('id', buildingId)
          .maybeSingle();

        if (error) {
          console.error('Error loading building image:', error);
          return;
        }

        if (data?.image_url) {
          setImageUrl(data.image_url);
        }
      } catch (error) {
        console.error('Error loading building image:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingImage();
  }, [buildingId]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${buildingId}-${Date.now()}.${fileExt}`;
      const filePath = `buildings/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('building-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('building-images')
        .getPublicUrl(data.path);

      // Save the image URL to the database
      const { error: dbError } = await supabase
        .from('building_info')
        .update({ image_url: publicUrl })
        .eq('id', buildingId);

      if (dbError) {
        throw dbError;
      }

      setImageUrl(publicUrl);
      onImageUploaded?.(publicUrl);
      toast.success('Building image uploaded successfully!');

    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    try {
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `buildings/${fileName}`;

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from('building-images')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      // Remove the image URL from the database
      const { error: dbError } = await supabase
        .from('building_info')
        .update({ image_url: null })
        .eq('id', buildingId);

      if (dbError) {
        throw dbError;
      }

      setImageUrl(null);
      toast.success('Image removed successfully');

    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-energy-primary" />
          <span className="font-medium text-energy-text">Building Image</span>
        </div>
      </div>

      {loading ? (
        <div className="border-2 border-dashed border-energy-border rounded-lg p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-energy-surface rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-energy-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground mt-3">Loading image...</p>
        </div>
      ) : imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Building"
            className="w-full h-48 object-cover rounded-lg border border-energy-border"
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-energy-border rounded-lg p-6 text-center hover:border-energy-primary/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-energy-surface rounded-full flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-6 w-6 text-energy-primary animate-spin" />
              ) : (
                <Upload className="h-6 w-6 text-energy-primary" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-energy-text">
                {uploading ? 'Uploading...' : 'Upload building image'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 5MB
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}