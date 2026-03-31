import React, { useState, useCallback } from "react";
import { Upload, X, ZoomIn, Check, Eye, Crop, Trash } from "lucide-react";
import Cropper from "react-easy-crop";

interface ImageUploadProps {
  previewUrl: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  isViewMode?: boolean;
  label?: string;
  id?: string;
}

// --- Utility function to extract the cropped image ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: any,
  fileName: string = "cropped-logo.jpeg"
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const file = new File([blob], fileName, { type: "image/jpeg" });
      resolve(file);
    }, "image/jpeg");
  });
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  previewUrl,
  onChange,
  onClear,
  isViewMode = false,
  label = "Upload Image",
  id = "imageUpload",
}) => {
  // States
  const [isDragging, setIsDragging] = useState(false);
  const [isViewing, setIsViewing] = useState(false); 
  
  // Cropper States
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  // --- Handlers for Drag & Drop ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isViewMode) setIsDragging(true);
  }, [isViewMode]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isViewMode) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const fileUrl = URL.createObjectURL(file);
        setTempImage(fileUrl);
      }
    }
  }, [isViewMode]);

  // --- Handlers for Standard Click Select ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        const fileUrl = URL.createObjectURL(file);
        setTempImage(fileUrl);
      }
    }
    e.target.value = ""; // Reset input so the same file can be selected again
  };

  // --- Cropper Completion ---
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!tempImage || !croppedAreaPixels) return;
    
    setIsCropping(true);
    try {
      const croppedFile = await getCroppedImg(tempImage, croppedAreaPixels);
      if (croppedFile) {
        // Synthetic event so parent component works flawlessly without rewrites
        const syntheticEvent = {
          target: { files: [croppedFile], name: id, value: "" }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        
        onChange(syntheticEvent);
      }
    } catch (e) {
      console.error("Failed to crop image", e);
    } finally {
      setIsCropping(false);
      if (tempImage !== previewUrl) URL.revokeObjectURL(tempImage);
      setTempImage(null);
    }
  };

  const handleCancelCrop = () => {
    if (tempImage && tempImage !== previewUrl) URL.revokeObjectURL(tempImage);
    setTempImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <>
      {/* MAIN UPLOAD ZONE */}
      <div className="flex flex-col items-center">
        <div 
          className={`w-28 h-28 rounded-full border-2 flex items-center justify-center overflow-hidden relative transition-all duration-200 ${
            isDragging 
              ? "border-primary bg-primary/10 scale-105" 
              : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Upload size={24} className={isDragging ? "text-primary animate-bounce" : ""} />
              {!isDragging && <span className="text-[10px] mt-1 text-gray-400 font-medium">Drop Here</span>}
            </div>
          )}
        </div>

        {/* EXTERNAL ACTION BUTTONS */}
        {previewUrl ? (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button 
              type="button" 
              onClick={() => setIsViewing(true)} 
              className="p-2 text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/40 rounded-full transition-all" 
              title="View Full Image"
            >
              <Eye size={16} />
            </button>
            
            {!isViewMode && (
              <>
                <button 
                  type="button" 
                  onClick={() => setTempImage(previewUrl)} 
                  className="p-2 text-gray-500 hover:text-green-600 bg-gray-100 hover:bg-green-50 dark:bg-gray-800 dark:hover:bg-green-900/40 rounded-full transition-all" 
                  title="Crop & Adjust"
                >
                  <Crop size={16} />
                </button>

                <div className="relative">
                  <input 
                    type="file" 
                    id={id} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileSelect} 
                  />
                  <label 
                    htmlFor={id} 
                    className="cursor-pointer flex p-2 text-gray-500 hover:text-primary bg-gray-100 hover:bg-primary/10 dark:bg-gray-800 dark:hover:bg-primary/20 rounded-full transition-all" 
                    title="Change Image"
                  >
                    <Upload size={16} />
                  </label>
                </div>

                <button 
                  type="button" 
                  onClick={onClear} 
                  className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/40 rounded-full transition-all" 
                  title="Remove Image"
                >
                  <Trash size={16} />
                </button>
              </>
            )}
          </div>
        ) : (
          /* Empty State Upload Button */
          !isViewMode && (
            <div className="mt-4 relative">
              <input 
                type="file" 
                id={id} 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileSelect} 
              />
              <label 
                htmlFor={id} 
                className="cursor-pointer px-4 py-2 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors inline-block"
              >
                {label}
              </label>
            </div>
          )
        )}
      </div>

      {/* FULL-SCREEN VIEW MODAL */}
      {isViewing && previewUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setIsViewing(false)} 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-2"
          >
            <X size={28} />
          </button>
          <img 
            src={previewUrl} 
            alt="Full Screen View" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}

      {/* CROP MODAL OVERLAY */}
      {tempImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crop Image</h3>
              <button onClick={handleCancelCrop} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full h-72 bg-gray-900">
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={1} 
                cropShape="round" 
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-3">
                <ZoomIn size={18} className="text-gray-400" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  disabled={isCropping}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isCropping ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Crop & Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUpload;