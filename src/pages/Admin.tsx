import React from 'react';
import { ShopifyAdmin } from '@/components/ShopifyAdmin';

const Admin: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <ShopifyAdmin />
      </div>
    </div>
  );
};

export default Admin;
