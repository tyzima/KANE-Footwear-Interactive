import React from 'react';
import { ShopifyAdminPanel } from '@/components/ShopifyAdminPanel';

const ShopifyAdmin: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <ShopifyAdminPanel />
    </div>
  );
};

export default ShopifyAdmin;
