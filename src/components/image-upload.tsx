"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Upload, X, Star, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
}

interface ImageUploadProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

export function ImageUpload({ productId, images, onImagesChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { addToast } = useToast();

  async function handleUpload(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);

    for (const file of fileArray) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        addToast(`${file.name} is not an image file`, "error");
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        addToast(`${file.name} is too large (max 10MB)`, "error");
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);
      formData.append("isPrimary", String(images.length === 0)); // First image is primary

      try {
        const response = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          addToast(data.error || "Upload failed", "error");
          continue;
        }

        const data = await response.json();
        onImagesChange([...images, data.image]);
        addToast("Image uploaded", "success");
      } catch {
        addToast("Failed to upload image", "error");
      }
    }

    setIsUploading(false);
  }

  async function handleDelete(imageId: string) {
    try {
      const response = await fetch(`/api/images?id=${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        addToast("Failed to delete image", "error");
        return;
      }

      const updatedImages = images.filter((img) => img.id !== imageId);
      onImagesChange(updatedImages);
      addToast("Image deleted", "success");
    } catch {
      addToast("Failed to delete image", "error");
    }
  }

  async function handleSetPrimary(imageId: string) {
    // Optimistically update UI
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    onImagesChange(updatedImages);

    // API call to update primary (reusing the upload route logic)
    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("imageId", imageId);

      await fetch(`/api/images/primary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, productId }),
      });
    } catch {
      addToast("Failed to update primary image", "error");
    }
  }

  function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleUpload(files);
    };
    input.click();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        aria-busy={isUploading}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Drop images here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP up to 10MB each
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border"
            >
              <img
                src={image.url}
                alt={`Product photo ${index + 1}${image.isPrimary ? " (primary)" : ""}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  onClick={(e) => { e.stopPropagation(); handleSetPrimary(image.id); }}
                  title="Set as primary"
                  aria-label="Set as primary photo"
                  aria-pressed={image.isPrimary}
                >
                  <Star className={cn("h-4 w-4", image.isPrimary && "fill-primary text-primary")} />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10"
                  onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                  title="Delete"
                  aria-label="Delete photo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Primary badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>No images uploaded yet</span>
        </div>
      )}
    </div>
  );
}
