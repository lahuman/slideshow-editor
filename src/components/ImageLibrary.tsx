import React, { useRef } from 'react';
import { FaUpload, FaPlus } from 'react-icons/fa';
import { ImageFile } from '../types';
import { TranslationKey } from '../i18n';

interface ImageLibraryProps {
  images: ImageFile[];
  onImageUpload: (files: FileList) => void;
  onAddToTimeline: (image: ImageFile) => void;
  onCreateTextSlide: (text: string) => void;
  t: (key: TranslationKey) => string;
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({
  images,
  onImageUpload,
  onAddToTimeline,
  onCreateTextSlide,
  t
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textDraft, setTextDraft] = React.useState('');

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

  const handleCreateTextSlide = (): void => {
    const text = textDraft.trim();
    if (!text) return;
    onCreateTextSlide(text);
    setTextDraft('');
  };

  return (
    <div className="image-library">
      <div className="library-section image-section">
        <h3>{t('imageAssets')}</h3>
        <div 
          className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <FaUpload />
          <p>{t('uploadImagesHint')}</p>
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

      <div className="library-section text-section">
        <h3>{t('text')}</h3>
        <div className="text-template-form">
          <textarea
            placeholder={t('textPlaceholder')}
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            rows={3}
          />
          <button
            type="button"
            onClick={handleCreateTextSlide}
            className="create-template-btn"
            disabled={!textDraft.trim()}
          >
            {t('createAndAdd')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageLibrary;
