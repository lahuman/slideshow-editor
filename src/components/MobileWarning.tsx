import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const MobileWarning: React.FC = () => {
  return (
    <div className="mobile-warning-overlay">
      <div className="mobile-warning-content">
        <FiAlertTriangle size={48} />
        <h2>PC 환경에 최적화되어 있습니다.</h2>
        <p>SlideFlow의 모든 기능을 원활하게 사용하시려면, 더 넓은 화면의 PC 환경에서 접속해주시기 바랍니다.</p>
      </div>
    </div>
  );
};

export default MobileWarning;
