'use client'

import React, { useState, useEffect } from 'react';
import { removeBackground } from "@imgly/background-removal";
import { ChromePicker } from "react-color";
import { FiDownload } from "react-icons/fi";
import { MdOutlineSettings } from "react-icons/md";

const ANIMATIONS = {
  wobble: {
    name: "Wobble",
    className: "wobble-hor-bottom"
  },
  shake: {
    name: "Shake",
    className: "shake-horizontal"
  },
  rotateIn: {
    name: "Rotate In",
    className: "rotate-in-2-cw"
  },
  scaleIn: {
    name: "Scale In",
    className: "scale-in-center"
  },
  pulseLight: {
    name: "Pulse Light",
    className: "pulse-light"
  },
  pulseStrong: {
    name: "Pulse Strong",
    className: "pulse-strong"
  },
  fadeIn: {
    name: "Fade In",
    className: "fade-in"
  },
  Jello: {
    name: "Jello",
    className: "jello-horizontal"
  },
  slideUp: {
    name: "Slide Up",
    className: "slide-in-bottom"
  },
  slideDown: {
    name: "Slide Down",
    className: "slide-in-top"
  },
  bounceIn: {
    name: "Bounce In",
    className: "bounce-in-fwd"
  },
  swingIn: {
    name: "Swing In",
    className: "swing-in-top-fwd"
  }
};

// Move video export functions outside component
const generateVideoFrames = async (img, bgColor, exportConfig, animationClassName) => {
  if (typeof window === 'undefined') return [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1080;
  canvas.height = 1080;

  const frames = [];
  const totalFrames = exportConfig.duration * exportConfig.fps;
  
  // Animation parameters based on the animation type
  const getAnimationTransform = (progress, animationType) => {
    switch (animationType) {
      case 'wobble-hor-bottom':
        const wobbleX = Math.sin(progress * Math.PI * 4) * 50;
        const wobbleRotate = Math.sin(progress * Math.PI * 4) * 15;
        return { translateX: wobbleX, rotate: wobbleRotate, scale: 1 };
      
      case 'shake-horizontal':
        const shakeX = Math.sin(progress * Math.PI * 8) * 30;
        return { translateX: shakeX, rotate: 0, scale: 1 };
      
      case 'rotate-in-2-cw':
        const rotateAngle = progress * 360;
        return { translateX: 0, rotate: rotateAngle, scale: 1 };
      
      case 'scale-in-center':
        const scaleValue = 0.5 + progress;
        return { translateX: 0, rotate: 0, scale: scaleValue };
      
      case 'pulse-light':
        const pulseScale = 0.9 + (Math.sin(progress * Math.PI * 2) * 0.2);
        return { translateX: 0, rotate: 0, scale: pulseScale };
      
      case 'pulse-strong':
        const strongPulseScale = 0.8 + (Math.sin(progress * Math.PI * 2) * 0.4);
        return { translateX: 0, rotate: 0, scale: strongPulseScale };
      
      case 'fade-in':
        return { translateX: 0, rotate: 0, scale: 1, opacity: progress };
      
      case 'jello-horizontal':
        const jelloProgress = progress * 8;
        const jelloScale = {
          x: 1 + Math.sin(jelloProgress * Math.PI) * 0.4,
          y: 1 - Math.sin(jelloProgress * Math.PI) * 0.4
        };
        return { translateX: 0, rotate: 0, scaleX: jelloScale.x, scaleY: jelloScale.y };
      
      case 'slide-in-bottom':
        const slideY = Math.sin(progress * Math.PI * 2) * 100;
        return { translateX: 0, translateY: slideY, rotate: 0, scale: 1 };
      
      case 'slide-in-top':
        const slideTopY = -Math.sin(progress * Math.PI * 2) * 100;
        return { translateX: 0, translateY: slideTopY, rotate: 0, scale: 1 };
      
      case 'bounce-in-fwd':
        const bounceProgress = progress * Math.PI * 2;
        const bounceScale = 0.8 + Math.abs(Math.sin(bounceProgress)) * 0.4;
        return { translateX: 0, rotate: 0, scale: bounceScale };
      
      case 'swing-in-top-fwd':
        const swingRotate = Math.sin(progress * Math.PI * 2) * 45;
        return { translateX: 0, rotate: swingRotate, scale: 1, transformOrigin: 'top' };
      
      default:
        return { translateX: 0, rotate: 0, scale: 1 };
    }
  };

  for (let frame = 0; frame < totalFrames; frame++) {
    const progress = ((Math.sin(frame / totalFrames * Math.PI * 2) + 1) / 2);
    
    // Get animation transform for current frame
    const transform = getAnimationTransform(progress, animationClassName);
    
    // Clear canvas and fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply transformations
    if (transform.rotate) {
      ctx.rotate((transform.rotate * Math.PI) / 180);
    }
    
    if (transform.scale) {
      ctx.scale(transform.scale, transform.scale);
    } else if (transform.scaleX && transform.scaleY) {
      ctx.scale(transform.scaleX, transform.scaleY);
    }
    
    if (transform.translateX || transform.translateY) {
      ctx.translate(transform.translateX || 0, transform.translateY || 0);
    }
    
    // Calculate image dimensions
    const scale = Math.min(
      canvas.width / img.width,
      canvas.height / img.height
    ) * 0.8;
    
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    
    // Draw image centered
    ctx.drawImage(
      img, 
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );
    
    // Restore context state
    ctx.restore();
    
    frames.push(canvas.toDataURL('image/jpeg', exportConfig.quality));
  }

  return frames;
};

const AnimationPreview = ({ image, animation, bgColor, selected, onSelect }) => {
  return (
    <div 
      className={`relative w-48 h-48 m-2 cursor-pointer rounded-lg overflow-hidden
        ${selected ? 'ring-4 ring-green-500' : 'ring-1 ring-gray-200'}`}
      onClick={onSelect}
    >
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: image ? bgColor : '#E5E7EB' }}
      >
        {image ? (
          <img 
            src={image} 
            alt={animation.name}
            className={`w-full h-full object-contain ${animation.className}`}
          />
        ) : (
          <div className="text-gray-400 text-sm text-center p-4">
            Upload an image<br/>to preview
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-30 text-white p-2 text-sm text-center">
        {animation.name}
      </div>
    </div>
  );
};

const AnimatedImageEditor = () => {
  const [mounted, setMounted] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [activeTab, setActiveTab] = useState('background');
  const [exporting, setExporting] = useState(false);
  const [selectedAnimations, setSelectedAnimations] = useState(new Set());
  const [exportConfig, setExportConfig] = useState({
    duration: 5,
    fps: 30,
    quality: 0.8
  });

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
      const bgRemovedBlob = await removeBackground(blob);
      const url = URL.createObjectURL(bgRemovedBlob);
      setImage(url);
      setBgColor("#D3D3D3");
    } catch (error) {
      console.error("Background removal failed", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnimationSelection = (animationKey) => {
    setSelectedAnimations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(animationKey)) {
        newSet.delete(animationKey);
      } else {
        newSet.add(animationKey);
      }
      return newSet;
    });
  };

  const exportSelectedVideos = async () => {
    if (!image || !mounted || selectedAnimations.size === 0) return;
    
    setExporting(true);
    try {
      const img = new Image();
      img.src = image;
      await img.decode();

      for (const animationKey of selectedAnimations) {
        // Generate frames with the correct animation className
        const frames = await generateVideoFrames(
          img, 
          bgColor, 
          exportConfig,
          ANIMATIONS[animationKey].className
        );

        if (typeof window === 'undefined' || !frames.length) continue;

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        
        const stream = canvas.captureStream(exportConfig.fps);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 8000000
        });

        const chunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `animation-${animationKey}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };

        mediaRecorder.start();

        let frameIndex = 0;
        const ctx = canvas.getContext('2d');
        
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

        const firstFrame = new Image();
        firstFrame.onload = () => {
          ctx.drawImage(firstFrame, 0, 0);
          playNextFrame();
        };
        firstFrame.src = frames[0];
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  if (!mounted) {
    return null;
  }
  return (
    <div className="flex flex-col lg:flex-row p-8 pl-[5%] pr-[5%] gap-8">
      <div className="flex flex-col items-center space-y-6 max-w-xl">
        {/* Image Upload Area */}
        <div
          className={`w-96 h-96 border-2 rounded-lg border-gray-200 flex items-center justify-center cursor-pointer relative overflow-hidden ${
            image ? "border-solid" : "border-dashed"
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
          {!image && <p className="text-center text-black font-bold">Drag & Drop or<br/>Click to Upload</p>}
          {image && (
            <img 
              src={image} 
              alt="Uploaded" 
              className="object-contain w-full h-full"
            />
          )}
        </div>

        {/* Controls Section */}
        <div className="w-full">
          {/* Tab Buttons */}
          <div className="flex mb-4">
            <button
              className={`tab-button whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'background' ? 'active' : ''}`}
              onClick={() => setActiveTab('background')}
            >
              Background Settings
              <MdOutlineSettings size={18} />
            </button>
            <button
              className={`tab-button flex items-center justify-center gap-2 ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              Export Video
              <FiDownload size={18} />
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'background' && (
            <div className="control-container flex flex-col items-center">
              <button
                onClick={handleRemoveBackground}
                className="w-full bg-black text-white px-4 py-2 rounded mb-4"
                disabled={loading}
              >
                {loading ? "Removing Background..." : "Remove Background"}
              </button>

              <ChromePicker
                color={bgColor}
                onChange={(color) => setBgColor(color.hex)}
                className="!w-full"
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
                  onClick={exportSelectedVideos}
                  className="export-button w-full"
                  disabled={!image || selectedAnimations.size === 0 || exporting}
                >
                  {exporting ? 'Exporting...' : `Export ${selectedAnimations.size} Video${selectedAnimations.size !== 1 ? 's' : ''} `}
                </button>

                <p className="text-sm text-gray-500 mt-2">
                  Export will create 1080x1080 videos for each selected animation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animation Previews Grid */}
      <div className="flex flex-col bg-gray-50 p-8 rounded-lg">
        <h2 className="text-xl text-gray-400 font-semibold mb-4">Select animations to export</h2>

        <div className="flex flex-wrap gap-4">
          {Object.entries(ANIMATIONS).map(([key, animation]) => (
            <AnimationPreview
              key={key}
              image={image}
              animation={animation}
              bgColor={bgColor}
              selected={selectedAnimations.has(key)}
              onSelect={() => toggleAnimationSelection(key)}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        .tab-button {
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
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
          background-color: black;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          transition: background-color 0.2s;
        }

        .export-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AnimatedImageEditor;