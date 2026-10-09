import React from 'react';
import { PrePostDoctorTracker } from '../components/dashboard/PrePostDoctorTracker';

export const PrePostPage: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-300">
      <PrePostDoctorTracker />
    </div>
  );
};

export default PrePostPage;
