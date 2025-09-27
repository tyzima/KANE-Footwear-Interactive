import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ExternalLink, 
  Settings, 
  Package, 
  Users, 
  ShoppingCart, 
  Archive,
  Palette,
  Eye,
  Plus,
  RefreshCw,
  AlertCircle,
  Store,
  Zap
} from 'lucide-react';
import { useShopify } from '@/hooks/useShopify';
import { ShopifyConnection } from './ShopifyConnection';
import { toast } from './ui/use-toast';
import type { ShopifyProduct } from '@/lib/shopify';

export const ShopifyAdminPanel: React.FC = () => {
  const { isConnected, getProducts, shop, connectViaOAuth } = useShopify();
  
  // Debug connection state
  useEffect(() => {
    console.log('ShopifyAdminPanel - Connection state:', { isConnected, shop });
  }, [isConnected, shop]);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadProducts = async () => {
    if (!isConnected) return;

    setIsLoadingProducts(true);
    try {
      const productList = await getProducts(10);
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products from Shopify",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadProducts();
    }
  }, [isConnected]);

  const openConfigurator = () => {
    const configUrl = `https://kaneconfig.netlify.app/`;
    window.open(configUrl, '_blank');
  };

  const openFullAdmin = () => {
    const adminUrl = `https://kaneconfig.netlify.app/admin`;
    window.open(adminUrl, '_blank');
  };

  // Auto-detect shop domain from embedded context
  const getShopFromUrl = (): string | null => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      return shopParam.endsWith('.myshopify.com') ? shopParam : `${shopParam}.myshopify.com`;
    }
    
    // Check if we're in an iframe and try to get from parent
    if (window.self !== window.top) {
      try {
        // Try to get shop from the parent URL
        const parentUrl = document.referrer;
        if (parentUrl && parentUrl.includes('.myshopify.com')) {
          const match = parentUrl.match(/https?:\/\/([^\.]+\.myshopify\.com)/);
          if (match) {
            return match[1];
          }
        }
      } catch (error) {
        console.warn('Could not access parent URL:', error);
      }
    }
    
    return null;
  };

  const handleQuickConnect = () => {
    const detectedShop = getShopFromUrl();
    
    if (detectedShop) {
      console.log('Auto-detected shop:', detectedShop);
      connectViaOAuth(detectedShop);
    } else {
      toast({
        title: "Shop not detected",
        description: "Please use the connection form below to manually enter your shop domain.",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    const detectedShop = getShopFromUrl();
    
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">KANE Footwear Admin</h1>
          <p className="text-muted-foreground">
            {detectedShop 
              ? `Ready to connect to ${detectedShop}` 
              : "Connect your Shopify store to get started"
            }
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-md space-y-4">
            {detectedShop ? (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Store className="h-5 w-5" />
                    Quick Connect
                  </CardTitle>
                  <CardDescription>
                    Connect to {detectedShop}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleQuickConnect} className="w-full" size="lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Connect to Shopify
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    You'll be redirected to authorize the connection
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ShopifyConnection />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KANE Footwear Admin</h1>
          <p className="text-sm text-muted-foreground">
            Connected to {shop?.name || 'Shopify Store'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Archive className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={openConfigurator} className="h-16 flex items-center gap-3">
          <Palette className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Open Configurator</div>
            <div className="text-xs opacity-80">Design custom shoes</div>
          </div>
        </Button>
        
        <Button onClick={openFullAdmin} variant="outline" className="h-16 flex items-center gap-3">
          <Settings className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Full Admin</div>
            <div className="text-xs opacity-60">Advanced management</div>
          </div>
        </Button>
        
        <Button onClick={loadProducts} variant="outline" className="h-16 flex items-center gap-3" disabled={isLoadingProducts}>
          {isLoadingProducts ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
          <div className="text-left">
            <div className="font-medium">Sync Products</div>
            <div className="text-xs opacity-60">Refresh from Shopify</div>
          </div>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium">Products</p>
                    <p className="text-lg font-bold">{products.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs font-medium">Variants</p>
                    <p className="text-lg font-bold">
                      {products.reduce((total, product) => total + product.variants.length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-medium">Active</p>
                    <p className="text-lg font-bold">
                      {products.filter(p => p.status === 'ACTIVE').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs font-medium">Colorways</p>
                    <p className="text-lg font-bold">
                      {products.reduce((total, product) => 
                        total + product.metafields.filter(m => m.namespace === 'colorway').length, 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Quick Setup
              </CardTitle>
              <CardDescription>
                Get your KANE Footwear integration up and running
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Add Colorway Metafields</p>
                  <p className="text-sm text-muted-foreground">Configure your shoe products with colorway data</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Metafields
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Configure Size Variants</p>
                  <p className="text-sm text-muted-foreground">Map shoe sizes to product variants</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure Sizes
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Test Integration</p>
                  <p className="text-sm text-muted-foreground">Create a test order through the configurator</p>
                  <Button size="sm" onClick={openConfigurator} className="mt-2">
                    <Eye className="h-3 w-3 mr-1" />
                    Test Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Products</h3>
            <Button onClick={loadProducts} disabled={isLoadingProducts} size="sm">
              {isLoadingProducts ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{product.title}</h4>
                        <p className="text-sm text-muted-foreground">{product.handle}</p>
                      </div>
                      <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Variants: </span>
                        <span className="text-muted-foreground">{product.variants.length}</span>
                      </div>
                      <div>
                        <span className="font-medium">Type: </span>
                        <span className="text-muted-foreground">{product.productType || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Metafields: </span>
                        <span className="text-muted-foreground">{product.metafields.length}</span>
                      </div>
                    </div>

                    {/* Show colorway metafields if any */}
                    {product.metafields.filter(m => m.namespace === 'colorway').length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-md">
                        <p className="text-xs font-medium mb-1">Colorway Configuration:</p>
                        <div className="grid grid-cols-2 gap-1">
                          {product.metafields
                            .filter(m => m.namespace === 'colorway')
                            .slice(0, 4)
                            .map((metafield) => (
                              <div key={metafield.id} className="text-xs">
                                <span className="font-medium">{metafield.key}: </span>
                                <span className="text-muted-foreground">{metafield.value}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>
                Manage your Shopify integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShopifyConnection />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>External Links</CardTitle>
              <CardDescription>
                Quick access to other parts of the KANE Footwear system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={openConfigurator} variant="outline" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Shoe Configurator
              </Button>
              <Button onClick={openFullAdmin} variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Open Full Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
