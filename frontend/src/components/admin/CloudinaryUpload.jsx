// frontend/src/components/admin/CloudinaryUpload.jsx
import React, { useEffect } from 'react';

const CloudinaryUpload = ({ onUploadSuccess, onClose, buttonText = '📷 Add Image', buttonStyle = {} }) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openWidget = () => {
    if (!window.cloudinary) {
      alert('Upload widget is loading. Please try again.');
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        cropping: true,
        croppingAspectRatio: 16 / 9,
        multiple: false,
        showAdvancedOptions: false,
        sources: ['local', 'url', 'camera'],
        folder: 'quiz_images',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxImageFileSize: 5000000,
        styles: {
          palette: {
            window: '#1e3c72',
            sourceBg: '#f0f7f4',
            windowBorder: '#1e3c72',
            tabIcon: '#1e3c72',
            inactiveTabIcon: '#888',
            link: '#1e3c72',
            action: '#ff9800'
          }
        }
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          onUploadSuccess(imageUrl);
        }
        if (result?.event === 'close') {
          onClose?.();
        }
      }
    );

    widget.open();
  };

  return (
    <button
      onClick={openWidget}
      style={{
        background: '#1e3c72',
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 'bold',
        ...buttonStyle
      }}
    >
      {buttonText}
    </button>
  );
};

export default CloudinaryUpload;