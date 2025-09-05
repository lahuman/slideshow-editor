import React from 'react';
import { Slide, TransitionOption, TransitionType, Position } from '../types';

interface ControlPanelProps {
  selectedSlide: Slide | null;
  onSlideUpdate: (slideId: number, updates: Partial<Slide>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ selectedSlide, onSlideUpdate }) => {
  const transitionOptions: TransitionOption[] = [
    { value: 'none', label: '없음' },
    { value: 'fade', label: '페이드' },
    { value: 'slide', label: '슬라이드' },
    { value: 'zoom', label: '줌' },
    { value: 'flip', label: '플립' }
  ];

  if (!selectedSlide) {
    return (
      <div className="control-panel">
        <h3>속성 편집</h3>
        <p>슬라이드를 선택하세요</p>
      </div>
    );
  }

  const handlePropertyChange = <T extends keyof Slide>(property: T, value: Slide[T]): void => {
    onSlideUpdate(selectedSlide.id, { [property]: value });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string): void => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      const newPosition: Position = {
        ...selectedSlide.position,
        [axis]: numValue
      };
      handlePropertyChange('position', newPosition);
    }
  };

  const handleNumberChange = <T extends keyof Slide>(
    property: T, 
    value: string, 
    parser: (val: string) => Slide[T]
  ): void => {
    const parsedValue = parser(value);
    if (parsedValue !== null && parsedValue !== undefined) {
      handlePropertyChange(property, parsedValue);
    }
  };

  return (
    <div className="control-panel">
      <h3>속성 편집</h3>
      
      <div className="property-group">
        <label>위치</label>
        <div className="input-group">
          <input
            type="number"
            value={selectedSlide.position.x}
            onChange={(e) => handlePositionChange('x', e.target.value)}
            placeholder="X"
          />
          <input
            type="number"
            value={selectedSlide.position.y}
            onChange={(e) => handlePositionChange('y', e.target.value)}
            placeholder="Y"
          />
        </div>
      </div>

      <div className="property-group">
        <label>크기</label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={selectedSlide.scale}
          onChange={(e) => handleNumberChange('scale', e.target.value, parseFloat)}
        />
        <span>{selectedSlide.scale.toFixed(1)}</span>
      </div>

      <div className="property-group">
        <label>회전</label>
        <input
          type="range"
          min="0"
          max="360"
          value={selectedSlide.rotation}
          onChange={(e) => handleNumberChange('rotation', e.target.value, parseInt)}
        />
        <span>{selectedSlide.rotation}°</span>
      </div>

      <div className="property-group">
        <label>지속시간</label>
        <input
          type="number"
          min="0.5"
          step="0.1"
          value={selectedSlide.duration}
          onChange={(e) => handleNumberChange('duration', e.target.value, parseFloat)}
        />
        <span>초</span>
      </div>

      <div className="property-group">
        <label>전환 효과</label>
        <select
          value={selectedSlide.transition}
          onChange={(e) => handlePropertyChange('transition', e.target.value as TransitionType)}
        >
          {transitionOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="property-group">
        <label>전환 시간</label>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={selectedSlide.transitionDuration}
          onChange={(e) => handleNumberChange('transitionDuration', e.target.value, parseFloat)}
        />
        <span>{selectedSlide.transitionDuration}초</span>
      </div>

      <div className="property-group">
        <label>레이어 순서</label>
        <input
          type="number"
          min="0"
          value={selectedSlide.zIndex}
          onChange={(e) => handleNumberChange('zIndex', e.target.value, parseInt)}
        />
      </div>
    </div>
  );
};

export default ControlPanel;
