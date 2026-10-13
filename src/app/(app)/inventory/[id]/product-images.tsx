"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export function ProductImages({ productId, initialImages }: { productId: string; initialImages: ProductImage[] }) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          productId={productId}
          images={images}
          onImagesChange={setImages}
        />
      </CardContent>
    </Card>
  );
}
