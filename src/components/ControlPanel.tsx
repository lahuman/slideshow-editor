import React, { useState, useEffect, useMemo } from 'react';
import { Slide, TransitionOption, TransitionType, Position, CanvasSettings } from '../types';

interface ControlPanelProps {
  selectedSlides: Slide[];
  onSlidesUpdate: (slideIds: number[], updates: Partial<Slide>) => void;
  canvasSettings: CanvasSettings;
  onCanvasSettingsChange: (updates: Partial<CanvasSettings>) => void;
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
  canvasSettings,
  onCanvasSettingsChange
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
    { value: 'none', label: '없음' },
    { value: 'fade', label: '페이드' },
    { value: 'slide', label: '슬라이드' },
    { value: 'zoom', label: '줌' },
    { value: 'flip', label: '플립' }
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
      const ids = selectedSlides.map(s => s.id);
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

  const handleCanvasSettingChange = <T extends keyof CanvasSettings>(
    property: T,
    value: string,
    parser: (val: string) => CanvasSettings[T]
  ) => {
    const parsedValue = parser(value);
    if (!isNaN(parsedValue as number)) {
      onCanvasSettingsChange({ [property]: parsedValue });
    }
  };

  return (
    <div className="control-panel">
      <h3>캔버스 속성</h3>
      <div className="property-group">
        <label>크기</label>
        <div className="input-group">
          <input type="number" value={canvasSettings.width} onChange={(e) => handleCanvasSettingChange('width', e.target.value, parseInt)} placeholder="W" />
          <input type="number" value={canvasSettings.height} onChange={(e) => handleCanvasSettingChange('height', e.target.value, parseInt)} placeholder="H" />
        </div>
      </div>
      <div className="property-group">
        <label>배경색</label>
        <div className="input-group">
          <input type="color" value={canvasSettings.backgroundColor} onChange={(e) => onCanvasSettingsChange({ backgroundColor: e.target.value })} style={{ padding: 0, height: '38px'}} />
          <input type="text" value={canvasSettings.backgroundColor} onChange={(e) => onCanvasSettingsChange({ backgroundColor: e.target.value })} />
        </div>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <h3>아이템 속성</h3>
      {selectedSlides.length === 0 ? (
        <p>타임라인에서 아이템을 선택하세요</p>
      ) : (
        <>
          <p style={{marginBottom: '1rem', color: '#555'}}>{selectedSlides.length}개 아이템 선택됨</p>
          
          <div className="property-group">
            <label>위치</label>
            <div className="input-group">
              <input type="number" value={commonValues.x === 'mixed' ? '' : commonValues.x} placeholder={commonValues.x === 'mixed' ? '혼합' : 'X'} onChange={(e) => handlePositionChange('x', e.target.value)} />
              <input type="number" value={commonValues.y === 'mixed' ? '' : commonValues.y} placeholder={commonValues.y === 'mixed' ? '혼합' : 'Y'} onChange={(e) => handlePositionChange('y', e.target.value)} />
            </div>
          </div>

          <div className="property-group">
            <label>크기</label>
            <input type="range" min="0.1" max="3" step="0.1" value={commonValues.scale === 'mixed' ? 1 : commonValues.scale} onChange={(e) => handlePropertyChange('scale', parseFloat(e.target.value))} style={{opacity: commonValues.scale === 'mixed' ? 0.5 : 1}} />
            <span>{commonValues.scale === 'mixed' ? '혼합' : commonValues.scale.toFixed(1)}</span>
          </div>

          <div className="property-group">
            <label>회전</label>
            <input type="range" min="0" max="360" value={commonValues.rotation === 'mixed' ? 0 : commonValues.rotation} onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))} style={{opacity: commonValues.rotation === 'mixed' ? 0.5 : 1}} />
            <span>{commonValues.rotation === 'mixed' ? '혼합' : `${commonValues.rotation}°`}</span>
          </div>

          <div className="property-group">
            <label>지속시간 (초)</label>
            <input type="number" min="1" max="100" step="0.1" value={durationInput} placeholder={commonValues.duration === 'mixed' ? '혼합' : ''} onChange={(e) => setDurationInput(e.target.value)} onBlur={handleDurationBlur} />
          </div>

          <div className="property-group">
            <label>전환 효과</label>
            <select value={commonValues.transition === 'mixed' ? '' : commonValues.transition} onChange={(e) => handlePropertyChange('transition', e.target.value as TransitionType)} style={{ color: commonValues.transition === 'mixed' ? 'gray' : 'inherit'}}>
              {commonValues.transition === 'mixed' && <option value="" disabled>혼합</option>}
              {transitionOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>

          <div className="property-group">
            <label>전환 시간 (초)</label>
            <input type="range" min="0.1" max="2" step="0.1" value={commonValues.transitionDuration === 'mixed' ? 0.5 : commonValues.transitionDuration} onChange={(e) => handlePropertyChange('transitionDuration', parseFloat(e.target.value))} style={{opacity: commonValues.transitionDuration === 'mixed' ? 0.5 : 1}} />
            <span>{commonValues.transitionDuration === 'mixed' ? '혼합' : `${commonValues.transitionDuration}초`}</span>
          </div>

          <div className="property-group">
            <label>레이어 순서</label>
            <input type="number" min="0" value={commonValues.zIndex === 'mixed' ? '' : commonValues.zIndex} placeholder={commonValues.zIndex === 'mixed' ? '혼합' : ''} onChange={(e) => handlePropertyChange('zIndex', parseInt(e.target.value))} />
          </div>
        </>
      )}
    </div>
  );
};

export default ControlPanel;
