// app/page.js
"use client";

import { useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import { CirclePicker } from "react-color";

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");

  // Handle image file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageData = URL.createObjectURL(file);
      setImage(imageData);
      setBgColor("#ffffff"); // Reset background color to white when a new image is uploaded
    }
  };

  // Remove background function with configuration
  const handleRemoveBackground = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const config = {
        debug: true,
        progress: (key, current, total) => {
          console.log(`Downloading ${key}: ${current} of ${total}`);
        },
      };

      const bgRemovedBlob = await removeBackground(blob, config);
      const url = URL.createObjectURL(bgRemovedBlob);
      setImage(url);
      setBgColor("#D3D3D3"); // Change background color to light gray after background removal
    } catch (error) {
      console.error("Background removal failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-8 space-y-4">
      {/* Upload box that becomes the image */}
      <div
        className={`w-64 h-64 border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer relative overflow-hidden ${
          image ? "border-none" : "border-gray-400"
        } ${loading ? "animate-pulse" : ""}`}
        style={{
          backgroundColor: bgColor,
          backgroundImage:
            image && bgColor === "transparent"
              ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
              : "none",
          backgroundSize: "10px 10px",
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          onChange={handleFileChange}
        />
        {!image && <p>Drag & Drop or Click to Upload</p>}
        {image && <img src={image} alt="Uploaded" className="object-contain w-full h-full" />}
      </div>

      {/* Background removal and color picker */}
      <button
        onClick={handleRemoveBackground}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Removing Background..." : "Remove Background"}
      </button>

      <div>
        <p className="text-gray-700">Pick Background Color:</p>
        <CirclePicker
          color={bgColor}
          onChange={(color) => setBgColor(color.hex)}
        />
      </div>
    </div>
  );
}
