import React from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

const ImageViewer = ({ 
  images, 
  children, 
  className = ""
}) => {
  return (
    <PhotoProvider
      maskOpacity={0.9}
      loadingElement={
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      }
    >
      {children}
    </PhotoProvider>
  );
};

// Individual Photo Component for easier use
export const Photo = ({ src, alt, className = "", children }) => {
  return (
    <PhotoView src={src}>
      {children || (
        <img
          src={src}
          alt={alt}
          className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
        />
      )}
    </PhotoView>
  );
};

export default ImageViewer;
