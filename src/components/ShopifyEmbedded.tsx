import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ExternalLink, Settings, Zap } from 'lucide-react';

export const ShopifyEmbedded: React.FC = () => {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [shopDomain, setShopDomain] = useState('');

  useEffect(() => {
    // Check if we're running in an iframe (embedded in Shopify)
    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);

    // Try to get shop domain from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    if (shop) {
      setShopDomain(shop);
    }

    // If embedded, we can communicate with the parent Shopify admin
    if (embedded) {
      // Send a message to parent to indicate we're ready
      window.parent.postMessage({
        type: 'KANE_APP_READY',
        payload: { status: 'loaded' }
      }, '*');
    }
  }, []);

  const openFullApp = () => {
    const fullAppUrl = `https://kaneconfig.netlify.app/admin`;
    window.open(fullAppUrl, '_blank');
  };

  const openMainApp = () => {
    const mainAppUrl = `https://kaneconfig.netlify.app/`;
    window.open(mainAppUrl, '_blank');
  };

  if (!isEmbedded) {
    // Not embedded, redirect to admin
    window.location.href = '/admin';
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">KANE Footwear</h1>
          <p className="text-muted-foreground">Interactive Shoe Configurator</p>
          {shopDomain && (
            <p className="text-sm text-blue-600">Connected to: {shopDomain}</p>
          )}
        </div>

        {/* Embedded App Notice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Shopify App Integration
            </CardTitle>
            <CardDescription>
              You're viewing the KANE Footwear app embedded in Shopify Admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🎉 Integration Active!</h3>
              <p className="text-sm text-blue-700">
                Your KANE Footwear app is successfully connected to this Shopify store. 
                The app can now sync products, manage inventory, and process custom shoe orders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={openMainApp} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Shoe Configurator
              </Button>
              
              <Button onClick={openFullApp} variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Open Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Available Features</CardTitle>
            <CardDescription>
              What you can do with the KANE Footwear integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">🎨 Design Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Custom colorway configuration</li>
                  <li>• Splatter and gradient effects</li>
                  <li>• Logo customization</li>
                  <li>• 3D shoe visualization</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">🛍️ E-commerce Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Product synchronization</li>
                  <li>• Inventory management</li>
                  <li>• Custom order processing</li>
                  <li>• Customer data integration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Configure Products</p>
                <p className="text-sm text-muted-foreground">Add colorway metafields to your shoe products</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Set Up Variants</p>
                <p className="text-sm text-muted-foreground">Map shoe sizes to product variants</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Test Integration</p>
                <p className="text-sm text-muted-foreground">Create a test order through the configurator</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
