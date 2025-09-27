import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Store, CheckCircle, XCircle, Plug } from 'lucide-react';
import { useShopify } from '@/hooks/useShopify';
import { toast } from './ui/use-toast';

export const ShopifyConnection: React.FC = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    shop, 
    initializeConnection, 
    disconnect 
  } = useShopify();

  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showConnectionForm, setShowConnectionForm] = useState(false);

  const handleConnect = async () => {
    if (!shopDomain || !accessToken) {
      toast({
        title: "Missing Information",
        description: "Please enter both shop domain and access token.",
        variant: "destructive",
      });
      return;
    }

    const result = await initializeConnection(shopDomain, accessToken);
    
    if (result.success) {
      toast({
        title: "Connected to Shopify!",
        description: `Successfully connected to ${result.shop?.name}`,
      });
      setShowConnectionForm(false);
      setShopDomain('');
      setAccessToken('');
    } else {
      toast({
        title: "Connection Failed",
        description: result.error || "Failed to connect to Shopify",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Disconnected",
      description: "Successfully disconnected from Shopify",
    });
  };

  if (isConnected && shop) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <CardTitle>Shopify Connected</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Shop Name</Label>
            <p className="text-sm text-muted-foreground">{shop.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Domain</Label>
            <p className="text-sm text-muted-foreground">{shop.domain}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm text-muted-foreground">{shop.email}</p>
          </div>
          <Button 
            onClick={handleDisconnect} 
            variant="outline" 
            className="w-full"
          >
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <CardTitle>Shopify Integration</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Not Connected
          </Badge>
        </div>
        <CardDescription>
          Connect your Shopify store to sync products and manage orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!showConnectionForm ? (
          <Button 
            onClick={() => setShowConnectionForm(true)} 
            className="w-full"
            disabled={isLoading}
          >
            <Plug className="h-4 w-4 mr-2" />
            Connect to Shopify
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="shopDomain">Shop Domain</Label>
              <Input
                id="shopDomain"
                placeholder="your-shop.myshopify.com"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your Shopify store domain (e.g., your-shop.myshopify.com)
              </p>
            </div>

            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="shpat_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your Shopify private app access token
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleConnect} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
              <Button 
                onClick={() => setShowConnectionForm(false)} 
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Setup Instructions:</h4>
          <ol className="text-xs text-blue-700 space-y-1">
            <li>1. Go to your Shopify Admin → Apps → App and sales channel settings</li>
            <li>2. Click "Develop apps" → "Create an app"</li>
            <li>3. Configure API access with required scopes</li>
            <li>4. Generate and copy the access token</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
