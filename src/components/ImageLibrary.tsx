import React, { useRef } from 'react';
import { FaUpload, FaPlus } from 'react-icons/fa';
import { ImageFile } from '../types';

interface ImageLibraryProps {
  images: ImageFile[];
  onImageUpload: (files: FileList) => void;
  onAddToTimeline: (image: ImageFile) => void;
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({
  images,
  onImageUpload,
  onAddToTimeline
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onImageUpload(files);
    }
  };

  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-library">
      <h3>이미지 라이브러리</h3>
      
      <div 
        className="upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <FaUpload />
        <p>이미지를 드래그하거나 클릭하여 업로드</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="images-grid">
        {images.map(image => (
          <div key={image.id} className="image-item">
            <img src={image.url} alt={image.name} />
            <div className="image-overlay">
              <button 
                onClick={() => onAddToTimeline(image)}
                className="add-to-timeline-btn"
              >
                <FaPlus />
              </button>
            </div>
            <p className="image-name">{image.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageLibrary;
