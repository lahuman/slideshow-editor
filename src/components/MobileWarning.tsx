import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { TranslationKey } from '../i18n';

interface MobileWarningProps {
  t: (key: TranslationKey) => string;
}

const MobileWarning: React.FC<MobileWarningProps> = ({ t }) => {
  return (
    <div className="mobile-warning-overlay">
      <div className="mobile-warning-content">
        <FiAlertTriangle size={48} />
        <h2>{t('mobileWarningTitle')}</h2>
        <p>{t('mobileWarningBody')}</p>
      </div>
    </div>
  );
};

export default MobileWarning;
