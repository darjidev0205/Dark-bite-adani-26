import React from 'react';
import { ResponsiveNavbar } from './common/ResponsiveNavbar';

interface HeaderProps {
  isBackendOnline?: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ isBackendOnline }) => {
  return <ResponsiveNavbar isBackendOnline={isBackendOnline} />;
};
