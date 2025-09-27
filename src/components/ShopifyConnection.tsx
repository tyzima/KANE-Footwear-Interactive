import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Store, CheckCircle, XCircle, Plug, Zap } from 'lucide-react';
import { useShopify } from '@/hooks/useShopify';
import { toast } from './ui/use-toast';

export const ShopifyConnection: React.FC = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    shop, 
    initializeConnection,
    connectViaOAuth,
    disconnect 
  } = useShopify();

  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'oauth' | 'manual'>('oauth');

  const handleOAuthConnect = () => {
    if (!shopDomain) {
      toast({
        title: "Missing Shop Domain",
        description: "Please enter your shop domain.",
        variant: "destructive",
      });
      return;
    }

    // Use OAuth flow
    connectViaOAuth(shopDomain);
  };

  const handleManualConnect = async () => {
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
            <Tabs value={connectionMethod} onValueChange={(value) => setConnectionMethod(value as 'oauth' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="oauth" className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  OAuth (Recommended)
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Plug className="h-3 w-3" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="oauth" className="space-y-4">
                <div>
                  <Label htmlFor="oauthShopDomain">Shop Domain</Label>
                  <Input
                    id="oauthShopDomain"
                    placeholder="kane-customs (or kane-customs.myshopify.com)"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter just your shop name (e.g., "kane-customs")
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">OAuth Flow:</h4>
                  <p className="text-xs text-blue-700">
                    A popup window will open for Shopify authorization. No need to find access tokens!
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleOAuthConnect} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Connect via OAuth
                      </>
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
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div>
                  <Label htmlFor="manualShopDomain">Shop Domain</Label>
                  <Input
                    id="manualShopDomain"
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

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-900 mb-1">Manual Setup:</h4>
                  <ol className="text-xs text-yellow-700 space-y-1">
                    <li>1. Go to your Shopify Admin → Settings → Apps and sales channels</li>
                    <li>2. Click "Develop apps" → Find your app</li>
                    <li>3. Copy the Admin API access token</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleManualConnect} 
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
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <h4 className="text-sm font-medium text-green-900 mb-1">✨ Recommended: OAuth</h4>
          <p className="text-xs text-green-700">
            OAuth is more secure and easier - just enter your shop domain and authorize!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};