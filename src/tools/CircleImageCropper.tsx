import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function ImageCropper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        const minDimension = Math.min(img.width, img.height);
        setCrop({
          x: (img.width - minDimension) / 2,
          y: (img.height - minDimension) / 2,
          size: minDimension,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = Math.min(600 / image.width, 600 / image.height);
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const scaledCrop = {
      x: crop.x * scale,
      y: crop.y * scale,
      size: crop.size * scale,
    };

    ctx.save();

    const centerX = scaledCrop.x + scaledCrop.size / 2;
    const centerY = scaledCrop.y + scaledCrop.size / 2;
    const radius = scaledCrop.size / 2;

    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(scaledCrop.x, scaledCrop.y, scaledCrop.size, scaledCrop.size);

    if (showGrid) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;

      for (let i = 1; i < 3; i++) {
        const x = scaledCrop.x + (scaledCrop.size / 3) * i;
        ctx.beginPath();
        ctx.moveTo(x, scaledCrop.y);
        ctx.lineTo(x, scaledCrop.y + scaledCrop.size);
        ctx.stroke();
      }

      for (let i = 1; i < 3; i++) {
        const y = scaledCrop.y + (scaledCrop.size / 3) * i;
        ctx.beginPath();
        ctx.moveTo(scaledCrop.x, y);
        ctx.lineTo(scaledCrop.x + scaledCrop.size, y);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }, [image, crop, showGrid]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) loadImage(file);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [loadImage]);

  useEffect(() => {
    if (image) drawCanvas();
  }, [image, drawCanvas]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(600 / image.width, 600 / image.height);
    const scaledCrop = {
      x: crop.x * scale,
      y: crop.y * scale,
      size: crop.size * scale,
    };

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x >= scaledCrop.x &&
      x <= scaledCrop.x + scaledCrop.size &&
      y >= scaledCrop.y &&
      y <= scaledCrop.y + scaledCrop.size
    ) {
      setIsDragging(true);
      setDragStart({ x: x - scaledCrop.x, y: y - scaledCrop.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(600 / image.width, 600 / image.height);

    const x = (e.clientX - rect.left - dragStart.x) / scale;
    const y = (e.clientY - rect.top - dragStart.y) / scale;

    const newX = Math.max(0, Math.min(x, image.width - crop.size));
    const newY = Math.max(0, Math.min(y, image.height - crop.size));

    setCrop({ ...crop, x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    if (!image) return;

    const downloadCanvas = document.createElement("canvas");
    downloadCanvas.width = crop.size;
    downloadCanvas.height = crop.size;
    const ctx = downloadCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, crop.size, crop.size);

    downloadCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cropped-image.png";
        a.click();
        URL.revokeObjectURL(url);
      },
      "image/png",
      1.0,
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Image Cropper</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="image-upload">Upload Image</Label>
              <Input
                id="image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">or paste an image from clipboard (Cmd/Ctrl + V)</p>
            </div>

            {image && (
              <>
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="border cursor-move"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="crop-size">Crop Size: {crop.size}px</Label>
                    <Slider
                      id="crop-size"
                      min={100}
                      max={Math.min(image.width, image.height)}
                      step={1}
                      value={[crop.size]}
                      onValueChange={(values) => {
                        const newSize = values[0];
                        setCrop({
                          size: newSize,
                          x: Math.max(0, Math.min(crop.x, image.width - newSize)),
                          y: Math.max(0, Math.min(crop.y, image.height - newSize)),
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox id="show-grid" checked={showGrid} onCheckedChange={setShowGrid} />
                    <Label htmlFor="show-grid" className="cursor-pointer whitespace-nowrap">
                      Show grid
                    </Label>
                  </div>
                </div>

                <Button onClick={handleDownload} className="w-full">
                  Download Cropped Image
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
