'use client'

import { useState } from 'react';
import { removeBackground } from "@imgly/background-removal";
import { ChromePicker } from "react-color";
import { FiDownload } from "react-icons/fi";
import { MdOutlineSettings } from "react-icons/md";

// Predefined animations
const ANIMATIONS = {
  pulse: {
    name: "Pulse",
    config: {
      duration: 2,
      fadeOpacity: { start: 0.7, end: 1 },
      scale: { start: 0.95, end: 1.05 }
    }
  },
  breathe: {
    name: "Breathe",
    config: {
      duration: 3,
      fadeOpacity: { start: 0.8, end: 1 },
      scale: { start: 0.9, end: 1.1 }
    }
  },
  bounce: {
    name: "Bounce",
    config: {
      duration: 1.5,
      fadeOpacity: { start: 1, end: 1 },
      scale: { start: 0.9, end: 1 }
    }
  },
  fade: {
    name: "Fade",
    config: {
      duration: 2,
      fadeOpacity: { start: 0.5, end: 1 },
      scale: { start: 1, end: 1 }
    }
  },
  zoom: {
    name: "Zoom",
    config: {
      duration: 2.5,
      fadeOpacity: { start: 1, end: 1 },
      scale: { start: 0.8, end: 1.2 }
    }
  },
  subtle: {
    name: "Subtle",
    config: {
      duration: 2,
      fadeOpacity: { start: 0.95, end: 1 },
      scale: { start: 0.98, end: 1.02 }
    }
  }
};

const AnimationPreview = ({ image, animation, bgColor, selected, onSelect }) => {
  const { config } = animation;
  
  const animationStyle = {
    animation: `${config.duration}s infinite alternate ease-in-out`,
    animationName: `animation-${animation.name.toLowerCase()}`,
  };

  return (
    <div 
      className={`relative w-48 h-48 m-2 cursor-pointer rounded-lg overflow-hidden
        ${selected ? 'ring-4 ring-green-500' : 'ring-1 ring-gray-200'}`}
      onClick={onSelect}
    >
      <style jsx>{`
        @keyframes animation-${animation.name.toLowerCase()} {
          from {
            opacity: ${config.fadeOpacity.start};
            transform: scale(${config.scale.start});
          }
          to {
            opacity: ${config.fadeOpacity.end};
            transform: scale(${config.scale.end});
          }
        }
      `}</style>
      
      <div 
  className="w-full h-full flex items-center justify-center"
  style={{ backgroundColor: image ? bgColor : '#E5E7EB' }}
>
  {image ? (
    <img 
      src={image} 
      alt={animation.name}
      className="w-full h-full object-contain"
      style={animationStyle}
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

  const generateVideoFrames = async (img, animation, duration, fps) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1080;

    const frames = [];
    const totalFrames = duration * fps;
    const config = ANIMATIONS[animation].config;
    
    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = (frame / totalFrames) % 1;
      const reverse = Math.floor((frame / totalFrames) * 2) % 2 === 1;
      const t = reverse ? 1 - progress : progress;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentOpacity = config.fadeOpacity.start + 
        (config.fadeOpacity.end - config.fadeOpacity.start) * t;
      const currentScale = config.scale.start + 
        (config.scale.end - config.scale.start) * t;

      ctx.save();
      ctx.globalAlpha = currentOpacity;

      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      ) * currentScale;

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      ctx.restore();

      frames.push(canvas.toDataURL('image/jpeg', exportConfig.quality));
    }

    return frames;
  };

  const exportSelectedVideos = async () => {
    if (!image || selectedAnimations.size === 0) return;
    
    setExporting(true);
    try {
      const img = new Image();
      img.src = image;
      await img.decode();
  
      for (const animationKey of selectedAnimations) {
        const frames = await generateVideoFrames(
          img,
          animationKey,
          exportConfig.duration,
          exportConfig.fps
        );
  
        // Create a promise that resolves when the video is fully exported
        await new Promise(async (resolveExport) => {
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
  
          // Set up video element
          const videoElement = document.createElement('video');
          videoElement.width = 1080;
          videoElement.height = 1080;
          videoElement.autoplay = true;
  
          // Set up media recorder
          const stream = canvas.captureStream(exportConfig.fps);
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000
          });
  
          const chunks = [];
          
          // Handle data available event
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };
  
          // Handle recording stop
          mediaRecorder.onstop = () => {
            // Create and download the video file
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `animation-${animationKey}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Resolve the export promise
            resolveExport();
          };
  
          // Start recording
          mediaRecorder.start();
  
          // Function to play frames
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
  
          // Draw the first frame and start the animation
          const firstFrame = new Image();
          firstFrame.onload = () => {
            ctx.drawImage(firstFrame, 0, 0);
            videoElement.srcObject = stream;
            playNextFrame();
          };
          firstFrame.src = frames[0];
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

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
          {!image && <p className="text-center text-gray-400">Drag & Drop or<br/>Click to Upload</p>}
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
            <div className="control-container">
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
                  onClick={exportSelectedVideos}
                  className="export-button w-full"
                  disabled={!image || selectedAnimations.size === 0 || exporting}
                >
                  {exporting ? 'Exporting...' : `Export ${selectedAnimations.size} Animation${selectedAnimations.size !== 1 ? 's' : ''}`}
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
        <h2 className="text-xl font-semibold mb-4">Select animations to export</h2>

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