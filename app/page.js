"use client";

import React, { useState } from 'react';
import { removeBackground } from "@imgly/background-removal";
import { SketchPicker } from "react-color";

const AnimatedImageEditor = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [activeTab, setActiveTab] = useState('animation');
  
  // Animation controls
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [animationConfig, setAnimationConfig] = useState({
    duration: 2,
    fadeOpacity: {
      start: 0,
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
      </div>
    </div>
  );
};

export default AnimatedImageEditor;