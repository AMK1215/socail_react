import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

const ImageModal = ({ isOpen, onClose, images, currentIndex = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex]);

  const goToPrevious = () => {
    setActiveIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
    setIsZoomed(false);
  };

  const goToNext = () => {
    setActiveIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
    setIsZoomed(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[activeIndex];
    link.download = `image-${activeIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!isOpen || !images?.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center space-x-3">
            <span className="text-white text-sm font-medium">
              {activeIndex + 1} of {images.length}
            </span>
            {images.length > 1 && (
              <div className="flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveIndex(index);
                      setIsZoomed(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleZoom}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title={isZoomed ? "Zoom Out" : "Zoom In"}
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title="Close (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-16">
          <div className={`relative max-w-full max-h-full transition-transform duration-300 ${
            isZoomed ? 'scale-150 cursor-move' : 'cursor-zoom-in'
          }`}>
            <img
              src={images[activeIndex]}
              alt={`Image ${activeIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={toggleZoom}
              style={{ maxHeight: '80vh', maxWidth: '90vw' }}
            />
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
              title="Previous (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
              title="Next (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="text-center">
            <p className="text-white/80 text-sm">
              Use arrow keys to navigate • Click image to zoom • Press Esc to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
