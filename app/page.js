"use client";

import React, { useState } from 'react';
import { removeBackground } from "@imgly/background-removal";
import { SketchPicker } from "react-color";

const AnimatedImageEditor = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [activeTab, setActiveTab] = useState('animation');
  const [exporting, setExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    duration: 5,
    fps: 30,
    quality: 0.8
  });
  
  // Animation controls
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [animationConfig, setAnimationConfig] = useState({
    duration: 2,
    fadeOpacity: {
      start: 0.9,
      end: 1
    },
    scale: {
      start: 0.8,
      end: 1
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageData = URL.createObjectURL(file);
      setImage(imageData);
      setBgColor("#ffffff");
    }
  };

  const handleRemoveBackground = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const bgRemovedBlob = await removeBackground(blob, {
        debug: true,
        progress: (key, current, total) => {
          console.log(`Downloading ${key}: ${current} of ${total}`);
        },
      });
      const url = URL.createObjectURL(bgRemovedBlob);
      setImage(url);
      setBgColor("#D3D3D3");
    } catch (error) {
      console.error("Background removal failed", error);
    } finally {
      setLoading(false);
    }
  };

  const generateVideoFrames = async (img, duration, fps) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set fixed canvas size to 1080x1080
    canvas.width = 1080;
    canvas.height = 1080;

    const frames = [];
    const totalFrames = duration * fps;
    
    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = (frame / totalFrames) % 1;
      const reverse = Math.floor((frame / totalFrames) * 2) % 2 === 1;
      const t = reverse ? 1 - progress : progress;

      // Clear canvas
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate current animation values
      const currentOpacity = animationConfig.fadeOpacity.start + 
        (animationConfig.fadeOpacity.end - animationConfig.fadeOpacity.start) * t;
      const currentScale = animationConfig.scale.start + 
        (animationConfig.scale.end - animationConfig.scale.start) * t;

      // Save context state
      ctx.save();
      
      // Set opacity
      ctx.globalAlpha = currentOpacity;

      // Calculate scaled dimensions while maintaining aspect ratio
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      ) * currentScale;

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the image
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      // Draw the image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      ctx.restore();

      // Add frame to array
      frames.push(canvas.toDataURL('image/jpeg', exportConfig.quality));
    }

    return frames;
  };

  const exportVideo = async () => {
    if (!image || !animationEnabled) return;
  
    setExporting(true);
    try {
      // Load the image
      const img = new Image();
      img.src = image;
      await img.decode();
  
      // Generate frames
      const frames = await generateVideoFrames(
        img,
        exportConfig.duration,
        exportConfig.fps
      );
  
      // Create a canvas for the video
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
  
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.width = 1080;
      videoElement.height = 1080;
      videoElement.autoplay = true;
  
      // Wait for video to be ready
      await new Promise((resolve) => {
        videoElement.oncanplay = resolve;
        // Set initial frame
        if (frames.length > 0) {
          const tempImage = new Image();
          tempImage.onload = () => {
            ctx.drawImage(tempImage, 0, 0);
            videoElement.srcObject = canvas.captureStream(exportConfig.fps);
          };
          tempImage.src = frames[0];
        }
      });
  
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(canvas.captureStream(exportConfig.fps), {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 // 8 Mbps
      });
  
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'animation.webm';
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
      };
  
      mediaRecorder.start();
  
      // Play frames
      let frameIndex = 0;
      const playNextFrame = () => {
        if (frameIndex < frames.length) {
          const tempImage = new Image();
          tempImage.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempImage, 0, 0);
            frameIndex++;
            setTimeout(playNextFrame, 1000 / exportConfig.fps);
          };
          tempImage.src = frames[frameIndex];
        } else {
          mediaRecorder.stop();
        }
      };
  
      playNextFrame();
  
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
    }
  };

  const getAnimationStyle = () => {
    if (!animationEnabled) return {};
    
    return {
      animation: `${animationConfig.duration}s infinite alternate ease-in-out`,
      animationName: 'imageAnimation',
    };
  };

  const handleSliderChange = (key, subKey, value) => {
    setAnimationConfig(prev => {
      if (subKey) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [subKey]: parseFloat(value)
          }
        };
      }
      return {
        ...prev,
        [key]: parseFloat(value)
      };
    });
  };

  return (
    <div className="flex flex-col items-center p-8 space-y-6 max-w-4xl mx-auto">
      <style jsx global>{`
        @keyframes imageAnimation {
          from {
            opacity: ${animationConfig.fadeOpacity.start};
            transform: scale(${animationConfig.scale.start});
          }
          to {
            opacity: ${animationConfig.fadeOpacity.end};
            transform: scale(${animationConfig.scale.end});
          }
        }

        .tab-button {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-button.active {
          background: #f8fafc;
          border-bottom: 2px solid #000;
        }

        .control-container {
          border: 1px solid #e2e8f0;
          padding: 1rem;
          border-radius: 0.5rem;
          background: white;
        }

        .slider-container {
          margin: 1rem 0;
        }

        .slider-container label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .slider-container input[type="range"] {
          width: 100%;
        }

        .value-display {
          font-size: 0.875rem;
          color: #718096;
          margin-left: 0.5rem;
        }

        .export-button {
          background-color: #3b82f6;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          transition: background-color 0.2s;
        }

        .export-button:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .export-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>

      {/* Image Upload Area */}
      <div
        className={`w-96 h-96 border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer relative overflow-hidden ${
          image ? "border-none" : "border-gray-400"
        } ${loading ? "animate-pulse" : ""}`}
        style={{
          backgroundColor: bgColor,
          backgroundImage: image && bgColor === "transparent"
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
        {!image && <p className="text-center text-gray-400">Drag & Drop or<br/>Click to Upload</p>}
        {image && (
          <img 
            src={image} 
            alt="Uploaded" 
            className="object-contain w-full h-full"
            style={getAnimationStyle()}
          />
        )}
      </div>

      {/* Controls Section */}
      <div className="w-full">
        {/* Tab Buttons */}
        <div className="flex mb-4">
          <button
            className={`tab-button ${activeTab === 'animation' ? 'active' : ''}`}
            onClick={() => setActiveTab('animation')}
          >
            Animation Controls
          </button>
          <button
            className={`tab-button ${activeTab === 'background' ? 'active' : ''}`}
            onClick={() => setActiveTab('background')}
          >
            Background Controls
          </button>
          <button
            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export Controls
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'animation' && (
          <div className="control-container">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={animationEnabled}
                onChange={(e) => setAnimationEnabled(e.target.checked)}
                id="animation-toggle"
              />
              <label htmlFor="animation-toggle">Enable Animation</label>
            </div>

            <div className="space-y-4">
              <div className="slider-container">
                <label>
                  Duration (seconds)
                  <span className="value-display">{animationConfig.duration}s</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={animationConfig.duration}
                  onChange={(e) => handleSliderChange('duration', null, e.target.value)}
                />
              </div>

              <div className="slider-container">
                <label>
                  Fade Start Opacity
                  <span className="value-display">{animationConfig.fadeOpacity.start}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={animationConfig.fadeOpacity.start}
                  onChange={(e) => handleSliderChange('fadeOpacity', 'start', e.target.value)}
                />
              </div>

              <div className="slider-container">
                <label>
                  Fade End Opacity
                  <span className="value-display">{animationConfig.fadeOpacity.end}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={animationConfig.fadeOpacity.end}
                  onChange={(e) => handleSliderChange('fadeOpacity', 'end', e.target.value)}
                />
              </div>

              <div className="slider-container">
                <label>
                  Scale Start
                  <span className="value-display">{animationConfig.scale.start}x</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={animationConfig.scale.start}
                  onChange={(e) => handleSliderChange('scale', 'start', e.target.value)}
                />
              </div>

              <div className="slider-container">
                <label>
                  Scale End
                  <span className="value-display">{animationConfig.scale.end}x</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={animationConfig.scale.end}
                  onChange={(e) => handleSliderChange('scale', 'end', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'background' && (
          <div className="control-container">
            <button
              onClick={handleRemoveBackground}
              className="w-full bg-black text-white px-4 py-2 text-sm rounded mb-4"
              disabled={loading}
            >
              {loading ? "Removing Background..." : "Remove Background"}
            </button>

            <SketchPicker
              color={bgColor}
              onChange={(color) => setBgColor(color.hex)}
              className="w-full"
            />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="control-container">
            <div className="space-y-4">
              <div className="slider-container">
                <label>
                  Video Duration (seconds)
                  <span className="value-display">{exportConfig.duration}s</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={exportConfig.duration}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    duration: parseInt(e.target.value)
                  }))}
                />
              </div>

              <div className="slider-container">
                <label>
                  Frame Rate (FPS)
                  <span className="value-display">{exportConfig.fps} fps</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="1"
                  value={exportConfig.fps}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    fps: parseInt(e.target.value)
                  }))}
                />
              </div>

              <div className="slider-container">
                <label>
                Quality
                  <span className="value-display">{Math.round(exportConfig.quality * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={exportConfig.quality}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    quality: parseFloat(e.target.value)
                  }))}
                />
              </div>

              <button
                onClick={exportVideo}
                className="export-button w-full"
                disabled={!image || !animationEnabled || exporting}
              >
                {exporting ? 'Exporting...' : 'Export Animation'}
              </button>

              <p className="text-sm text-gray-500 mt-2">
                Export will create a 1080x1080 video with your current animation settings
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedImageEditor;