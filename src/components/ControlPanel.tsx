import React, { useState, useEffect, useMemo } from 'react';
import type { Slide, TextSlide, TransitionOption, TransitionType, CanvasSettings } from '../types';
import { TranslationKey } from '../i18n';

interface ControlPanelProps {
  selectedSlides: Slide[];
  onSlidesUpdate: (slideIds: number[], updates: Partial<Slide>) => void;
  selectedTextSlide: TextSlide | null;
  onTextSlideUpdate: (updates: Partial<TextSlide>) => void;
  canvasSettings: CanvasSettings;
  onCanvasSettingsChange: (updates: Partial<CanvasSettings>) => void;
  t: (key: TranslationKey) => string;
}

// Generic helper to find a common value or return 'mixed'
const getCommonValue = <T, K extends keyof Slide>(items: Slide[], property: K): T | 'mixed' => {
  if (items.length === 0) return '' as T;
  const firstValue = items[0][property];
  const allSame = items.every(item => item[property] === firstValue);
  return allSame ? firstValue as T : 'mixed';
};

const getCommonPositionValue = (items: Slide[], axis: 'x' | 'y'): number | 'mixed' => {
    if (items.length === 0) return 0;
    const firstValue = items[0].position[axis];
    const allSame = items.every(item => item.position[axis] === firstValue);
    return allSame ? firstValue : 'mixed';
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  selectedSlides, 
  onSlidesUpdate,
  selectedTextSlide,
  onTextSlideUpdate,
  canvasSettings,
  onCanvasSettingsChange,
  t
}) => {

  const [durationInput, setDurationInput] = useState('');

  const commonValues = useMemo(() => ({
    x: getCommonPositionValue(selectedSlides, 'x'),
    y: getCommonPositionValue(selectedSlides, 'y'),
    scale: getCommonValue<number, 'scale'>(selectedSlides, 'scale'),
    rotation: getCommonValue<number, 'rotation'>(selectedSlides, 'rotation'),
    duration: getCommonValue<number, 'duration'>(selectedSlides, 'duration'),
    transition: getCommonValue<TransitionType, 'transition'>(selectedSlides, 'transition'),
    transitionDuration: getCommonValue<number, 'transitionDuration'>(selectedSlides, 'transitionDuration'),
    zIndex: getCommonValue<number, 'zIndex'>(selectedSlides, 'zIndex'),
  }), [selectedSlides]);

  useEffect(() => {
    if (commonValues.duration !== 'mixed') {
      setDurationInput(commonValues.duration.toString());
    } else {
      setDurationInput(''); // Empty or placeholder for mixed values
    }
  }, [commonValues.duration]);

  const transitionOptions: TransitionOption[] = [
    { value: 'none', label: t('none') },
    { value: 'fade', label: t('fade') },
    { value: 'slide', label: t('slide') },
    { value: 'zoom', label: t('zoom') },
    { value: 'flip', label: t('flip') }
  ];

  const handlePropertyChange = <T extends keyof Slide>(property: T, value: Slide[T]): void => {
    const ids = selectedSlides.map(s => s.id);
    if (ids.length > 0) {
      onSlidesUpdate(ids, { [property]: value });
    }
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string): void => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // This requires a special updater since it's a nested property
      // We update based on each slide's current position to only change one axis
      selectedSlides.forEach(slide => {
        onSlidesUpdate([slide.id], { position: { ...slide.position, [axis]: numValue } });
      });
    }
  };

  const handleDurationBlur = () => {
    const value = parseFloat(durationInput);
    if (!isNaN(value) && durationInput.trim() !== '') {
      const clampedValue = Math.max(1, Math.min(value, 100));
      handlePropertyChange('duration', clampedValue);
      setDurationInput(clampedValue.toString());
    }
  };

  const handleTextPositionChange = (axis: 'x' | 'y', value: string): void => {
    if (!selectedTextSlide) return;
    const numValue = parseInt(value, 10);
    if (Number.isNaN(numValue)) return;
    onTextSlideUpdate({
      position: {
        ...selectedTextSlide.position,
        [axis]: numValue,
      },
    });
  };

  

  return (
    <div className="control-panel">
      <h3>{t('canvasProperties')}</h3>
      <div className="property-group">
        <label>{t('ratio')}</label>
        <select value={canvasSettings.aspectRatio} onChange={(e) => onCanvasSettingsChange({ aspectRatio: e.target.value })}>
          <option value="16:9">16:9</option>
          <option value="4:3">4:3</option>
          <option value="1:1">1:1</option>
          <option value="9:16">9:16</option>
        </select>
      </div>
      <div className="property-group">
        <label>{t('backgroundColor')}</label>
        <div className="input-group">
          <input type="color" value={canvasSettings.backgroundColor} onChange={(e) => onCanvasSettingsChange({ backgroundColor: e.target.value })} style={{ padding: 0, height: '38px'}} />
          <input type="text" value={canvasSettings.backgroundColor} onChange={(e) => onCanvasSettingsChange({ backgroundColor: e.target.value })} />
        </div>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <h3>{t('itemProperties')}</h3>
      {selectedTextSlide ? (
        <>
          <p style={{marginBottom: '1rem', color: '#555'}}>{t('textItemSelected')}</p>

          <div className="property-group">
            <label>{t('text')}</label>
            <input
              type="text"
              value={selectedTextSlide.text}
              onChange={(e) => onTextSlideUpdate({ text: e.target.value })}
            />
          </div>

          <div className="property-group">
            <label>{t('position')}</label>
            <div className="input-group">
              <input
                type="number"
                value={selectedTextSlide.position.x}
                onChange={(e) => handleTextPositionChange('x', e.target.value)}
              />
              <input
                type="number"
                value={selectedTextSlide.position.y}
                onChange={(e) => handleTextPositionChange('y', e.target.value)}
              />
            </div>
          </div>

          <div className="property-group">
            <label>{t('fontSize')}</label>
            <input
              type="range"
              min="10"
              max="120"
              step="1"
              value={selectedTextSlide.fontSize}
              onChange={(e) => onTextSlideUpdate({ fontSize: parseInt(e.target.value, 10) })}
            />
            <span>{selectedTextSlide.fontSize}px</span>
          </div>

          <div className="property-group">
            <label>{t('boxWidth')}</label>
            <input
              type="range"
              min="80"
              max="1200"
              step="10"
              value={selectedTextSlide.maxWidth}
              onChange={(e) => onTextSlideUpdate({ maxWidth: parseInt(e.target.value, 10) })}
            />
            <span>{Math.round(selectedTextSlide.maxWidth)}px</span>
          </div>

          <div className="property-group">
            <label>{t('textColor')}</label>
            <div className="input-group">
              <input
                type="color"
                value={selectedTextSlide.color}
                onChange={(e) => onTextSlideUpdate({ color: e.target.value })}
                style={{ padding: 0, height: '38px' }}
              />
              <input
                type="text"
                value={selectedTextSlide.color}
                onChange={(e) => onTextSlideUpdate({ color: e.target.value })}
              />
            </div>
          </div>

          <div className="property-group">
            <label>{t('textBackgroundColor')}</label>
            <div className="input-group">
              <input
                type="color"
                value={selectedTextSlide.backgroundColor.startsWith('#') ? selectedTextSlide.backgroundColor : '#000000'}
                onChange={(e) => onTextSlideUpdate({ backgroundColor: e.target.value })}
                style={{ padding: 0, height: '38px' }}
              />
              <input
                type="text"
                value={selectedTextSlide.backgroundColor}
                onChange={(e) => onTextSlideUpdate({ backgroundColor: e.target.value })}
              />
            </div>
          </div>

          <div className="property-group">
            <label>{t('align')}</label>
            <select
              value={selectedTextSlide.align}
              onChange={(e) => onTextSlideUpdate({ align: e.target.value as TextSlide['align'] })}
            >
              <option value="left">{t('left')}</option>
              <option value="center">{t('center')}</option>
              <option value="right">{t('right')}</option>
            </select>
          </div>

          <div className="property-group">
            <label>{t('rotation')}</label>
            <input
              type="range"
              min="0"
              max="360"
              value={selectedTextSlide.rotation}
              onChange={(e) => onTextSlideUpdate({ rotation: parseInt(e.target.value, 10) })}
            />
            <span>{Math.round(selectedTextSlide.rotation)}°</span>
          </div>

          <div className="property-group">
            <label>{t('durationSec')}</label>
            <input
              type="number"
              min="1"
              max="100"
              step="0.1"
              value={selectedTextSlide.duration}
              onChange={(e) => onTextSlideUpdate({ duration: Math.max(1, parseFloat(e.target.value) || 1) })}
            />
          </div>
        </>
      ) : selectedSlides.length === 0 ? (
        <p>{t('selectItemHint')}</p>
      ) : (
        <>
          <p style={{marginBottom: '1rem', color: '#555'}}>{selectedSlides.length} {t('selectedItems')}</p>
          
          <div className="property-group">
            <label>{t('position')}</label>
            <div className="input-group">
              <input type="number" value={commonValues.x === 'mixed' ? '' : commonValues.x} placeholder={commonValues.x === 'mixed' ? t('mixed') : 'X'} onChange={(e) => handlePositionChange('x', e.target.value)} />
              <input type="number" value={commonValues.y === 'mixed' ? '' : commonValues.y} placeholder={commonValues.y === 'mixed' ? t('mixed') : 'Y'} onChange={(e) => handlePositionChange('y', e.target.value)} />
            </div>
          </div>

          <div className="property-group">
            <label>{t('size')}</label>
            <input type="range" min="0.2" max="3" step="0.1" value={commonValues.scale === 'mixed' ? 1 : commonValues.scale} onChange={(e) => handlePropertyChange('scale', parseFloat(e.target.value))} style={{opacity: commonValues.scale === 'mixed' ? 0.5 : 1}} />
            <span>{commonValues.scale === 'mixed' ? t('mixed') : commonValues.scale.toFixed(1)}</span>
          </div>

          <div className="property-group">
            <label>{t('rotation')}</label>
            <input type="range" min="0" max="360" value={commonValues.rotation === 'mixed' ? 0 : commonValues.rotation} onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))} style={{opacity: commonValues.rotation === 'mixed' ? 0.5 : 1}} />
            <span>{commonValues.rotation === 'mixed' ? t('mixed') : `${commonValues.rotation}°`}</span>
          </div>

          <div className="property-group">
            <label>{t('durationSec')}</label>
            <input type="number" min="1" max="100" step="0.1" value={durationInput} placeholder={commonValues.duration === 'mixed' ? t('mixed') : ''} onChange={(e) => setDurationInput(e.target.value)} onBlur={handleDurationBlur} />
          </div>

          <div className="property-group">
            <label>{t('transition')}</label>
            <select value={commonValues.transition === 'mixed' ? '' : commonValues.transition} onChange={(e) => handlePropertyChange('transition', e.target.value as TransitionType)} style={{ color: commonValues.transition === 'mixed' ? 'gray' : 'inherit'}}>
              {commonValues.transition === 'mixed' && <option value="" disabled>{t('mixed')}</option>}
              {transitionOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>

          <div className="property-group">
            <label>{t('transitionDuration')}</label>
            <input type="range" min="0.1" max="2" step="0.1" value={commonValues.transitionDuration === 'mixed' ? 0.5 : commonValues.transitionDuration} onChange={(e) => handlePropertyChange('transitionDuration', parseFloat(e.target.value))} style={{opacity: commonValues.transitionDuration === 'mixed' ? 0.5 : 1}} />
            <span>{commonValues.transitionDuration === 'mixed' ? t('mixed') : `${commonValues.transitionDuration}s`}</span>
          </div>

          <div className="property-group">
            <label>{t('layerOrder')}</label>
            <input type="number" min="0" value={commonValues.zIndex === 'mixed' ? '' : commonValues.zIndex} placeholder={commonValues.zIndex === 'mixed' ? t('mixed') : ''} onChange={(e) => handlePropertyChange('zIndex', parseInt(e.target.value))} />
          </div>
        </>
      )}
    </div>
  );
};

export default ControlPanel;
