import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
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
import { ShoeModel } from './ShoeModel';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';

export const ShopifyAdminPanel: React.FC = () => {
  const { isConnected, getProducts, shop, connectViaOAuth, updateProductMetafields } = useShopify();
  
  // Check for credentials in URL parameters and store them
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedToken = urlParams.get('token');
    const shop = urlParams.get('shop');
    const connected = urlParams.get('connected');
    
    console.log('ShopifyAdminPanel - URL params check:', {
      hasToken: !!encodedToken,
      shop,
      connected,
      fullUrl: window.location.href
    });
    
    if (encodedToken && shop && connected === 'true') {
      try {
        const accessToken = atob(encodedToken); // Decode base64
        console.log('Found credentials in URL, storing them...');
        
        // Store credentials immediately
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        
        const connectionData = {
          shopDomain: shop,
          accessToken,
          expiresAt: expirationDate.toISOString(),
          connectedAt: new Date().toISOString(),
          shop: { name: shop.replace('.myshopify.com', ''), domain: shop }
        };
        
        localStorage.setItem('shopify_connection', JSON.stringify(connectionData));
        localStorage.setItem('shopify_domain', shop);
        localStorage.setItem('shopify_access_token', accessToken);
        
        console.log('Credentials stored from URL params:', {
          shop,
          hasToken: !!accessToken,
          expiresAt: connectionData.expiresAt
        });
        
        // Clean the URL to remove credentials
        const cleanUrl = window.location.origin + window.location.pathname + '?embed=1&shop=' + encodeURIComponent(shop);
        window.history.replaceState({}, '', cleanUrl);
        
        // Force a page reload to pick up the new credentials
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Error processing URL credentials:', error);
      }
    }
  }, []);

  // Debug localStorage on mount
  useEffect(() => {
    console.log('ShopifyAdminPanel - localStorage debug:', {
      shopify_connection: localStorage.getItem('shopify_connection'),
      shopify_domain: localStorage.getItem('shopify_domain'),
      shopify_access_token: localStorage.getItem('shopify_access_token') ? 'present' : 'missing'
    });
  }, []);
  
  // Debug connection state
  useEffect(() => {
    console.log('ShopifyAdminPanel - Connection state update:', { 
      isConnected, 
      shop: shop ? { name: shop.name, domain: shop.domain } : null,
      hasShop: !!shop
    });
  }, [isConnected, shop]);

  // Suppress Shopify script errors
  useEffect(() => {
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (
        (source && (source.includes('share-modal.js') || source.includes('shopifycloud'))) ||
        (typeof message === 'string' && (
          message.includes('addEventListener') || 
          message.includes('Cannot read properties of null') ||
          message.includes('frame-ancestors')
        ))
      ) {
        console.warn('Suppressed Shopify script error:', message);
        return true; // Prevent default error handling
      }
      if (originalError) {
        return originalError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Also suppress unhandled promise rejections from Shopify scripts
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      if (
        event.reason && 
        typeof event.reason.message === 'string' &&
        (event.reason.message.includes('frame-ancestors') || 
         event.reason.message.includes('X-Frame-Options'))
      ) {
        console.warn('Suppressed Shopify iframe error:', event.reason.message);
        event.preventDefault();
        return;
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };

    return () => {
      window.onerror = originalError;
      window.onunhandledrejection = originalUnhandledRejection;
    };
  }, []);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const productsPerPage = 10;

  const loadProducts = async (page: number = 1, append: boolean = false) => {
    if (!isConnected) return;

    setIsLoadingProducts(true);
    try {
      // Load more products to check pagination
      const limit = Math.max(50, productsPerPage * page + 10); // Load enough for current page plus some extra
      const productList = await getProducts(limit);
      
      const startIndex = (page - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      const pageProducts = productList.slice(startIndex, endIndex);
      
      if (append) {
        setProducts(prev => [...prev, ...pageProducts]);
      } else {
        setProducts(pageProducts);
      }
      
      // Check if there are more products
      setHasMoreProducts(productList.length > endIndex);
      
      console.log('Products loaded:', {
        total: productList.length,
        page,
        showing: pageProducts.length,
        hasMore: productList.length > endIndex
      });
      
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

  const loadMoreProducts = async () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadProducts(nextPage, true);
  };

  // Handle metafield updates
  const handleUpdateMetafields = async (productId: string, metafields: Record<string, string>) => {
    try {
      console.log('Updating metafields for product:', productId, metafields);
      await updateProductMetafields(productId, metafields);
      console.log('Metafields updated successfully');
      
      // Optionally refresh the products to show updated metafields
      // await loadProducts(1, false);
    } catch (error) {
      console.error('Failed to update metafields:', error);
      throw error; // Re-throw so the ColorwayEditor can handle the error display
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
                    You'll be taken to Shopify to authorize the connection, then redirected back
                  </p>
                  
                  {/* Debug buttons */}
                  <div className="flex gap-2 mt-2">
                    <Button 
                      onClick={() => {
                        console.log('Manual localStorage check:', {
                          shopify_connection: localStorage.getItem('shopify_connection'),
                          shopify_domain: localStorage.getItem('shopify_domain'),
                          shopify_access_token: localStorage.getItem('shopify_access_token'),
                          allKeys: Object.keys(localStorage)
                        });
                      }} 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      Debug Storage
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        const testData = { test: 'data', timestamp: Date.now() };
                        localStorage.setItem('test_persistence', JSON.stringify(testData));
                        console.log('Stored test data:', testData);
                        
                        setTimeout(() => {
                          const retrieved = localStorage.getItem('test_persistence');
                          console.log('Retrieved test data:', retrieved);
                          if (retrieved) {
                            console.log('✅ localStorage is working');
                          } else {
                            console.log('❌ localStorage failed');
                          }
                        }, 1000);
                      }} 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      Test Storage
                    </Button>
                  </div>
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
            <p className="text-xs text-muted-foreground">
              {(() => {
                const connectionData = localStorage.getItem('shopify_connection');
                if (connectionData) {
                  try {
                    const data = JSON.parse(connectionData);
                    const connectedAt = new Date(data.connectedAt);
                    return `Connected ${connectedAt.toLocaleDateString()} at ${connectedAt.toLocaleTimeString()}`;
                  } catch (e) {
                    return 'Connection active';
                  }
                }
                return 'Connection active';
              })()}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="colorways">Colorways</TabsTrigger>
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
            <h3 className="text-lg font-medium">Products ({products.length})</h3>
            <div className="flex gap-2">
              <Button onClick={() => loadProducts(1, false)} disabled={isLoadingProducts} size="sm">
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
                    <div className="flex items-start gap-4 mb-2">
                      {/* Product Thumbnail */}
                      <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {product.images?.[0]?.url ? (
                          <img 
                            src={product.images[0].url} 
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{product.title}</h4>
                            <p className="text-sm text-muted-foreground">{product.handle}</p>
                          </div>
                          <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </div>
                      </div>
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
              
              {/* Load More Button */}
              {hasMoreProducts && products.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={loadMoreProducts} 
                    disabled={isLoadingProducts}
                    variant="outline"
                  >
                    {isLoadingProducts ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Load More Products
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Colorways Tab */}
        <TabsContent value="colorways" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Colorway Management</h3>
            <Button onClick={() => loadProducts(1, false)} disabled={isLoadingProducts} size="sm">
              {isLoadingProducts ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Products
                </>
              )}
            </Button>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found. Load products first.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <ColorwayEditor key={product.id} product={product} onUpdate={handleUpdateMetafields} />
              ))}
              
              {/* Load More Button for Colorways */}
              {hasMoreProducts && products.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={loadMoreProducts} 
                    disabled={isLoadingProducts}
                    variant="outline"
                  >
                    {isLoadingProducts ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Load More Products
                      </>
                    )}
                  </Button>
                </div>
              )}
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

// ColorwayEditor component for editing product metafields
const ColorwayEditor: React.FC<{ product: ShopifyProduct; onUpdate: (productId: string, metafields: Record<string, string>) => Promise<void> }> = ({ product, onUpdate }) => {
  const [metafields, setMetafields] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Define the colorway metafields we want to edit
  const colorwayFields = [
    { key: 'upper_base_hex', label: 'Upper Base Color', description: 'Main color of the upper shoe material' },
    { key: 'upper_darkbase_hex', label: 'Upper Dark Base Color', description: 'Darker shade for upper material' },
    { key: 'upper_splatter_hex', label: 'Upper Splatter Color', description: 'Primary splatter effect color on upper' },
    { key: 'upper_splatter2_hex', label: 'Upper Splatter Color 2', description: 'Secondary splatter effect color on upper (dual splatter)' },
    { key: 'sole_base_hex', label: 'Sole Base Color', description: 'Main color of the shoe sole' },
    { key: 'sole_splatter_hex', label: 'Sole Splatter Color', description: 'Primary splatter effect color on sole' },
    { key: 'sole_splatter2_hex', label: 'Sole Splatter Color 2', description: 'Secondary splatter effect color on sole (dual splatter)' },
    { key: 'lace_color_hex', label: 'Lace Color', description: 'Color of the shoe laces' },
  ];

  // Initialize metafields from product data
  useEffect(() => {
    console.log('Product metafields:', product.metafields);
    const initialMetafields: Record<string, string> = {};
    colorwayFields.forEach(field => {
      const metafield = product.metafields?.find(m => 
        m.key === field.key && m.namespace === 'custom'
      );
      console.log(`Looking for metafield: ${field.key}, found:`, metafield);
      initialMetafields[field.key] = metafield?.value || '#000000';
    });
    console.log('Initial metafields:', initialMetafields);
    setMetafields(initialMetafields);
  }, [product]);

  const handleColorChange = (key: string, value: string) => {
    setMetafields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Call the real Shopify API to update metafields
      await onUpdate(product.id, metafields);
      
      toast({
        title: "Colorway Updated",
        description: `Updated colorway settings for ${product.title}`,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating metafields:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update colorway settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const productImage = product.images?.[0]?.url;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Product Thumbnail */}
          <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
            {productImage ? (
              <img 
                src={productImage} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex-1">
            <CardTitle className="text-lg">{product.title}</CardTitle>
            <CardDescription className="mt-1">
              {product.handle} • {product.variants?.length || 0} variants
            </CardDescription>
          </div>
          
          {/* Edit Button */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)} 
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline"
                size="sm"
              >
                <Palette className="h-3 w-3 mr-1" />
                Edit Colors
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {isEditing && (
        <CardContent>
          {/* Live Preview Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2">Live Preview</h4>
                <p className="text-xs text-gray-600 mb-3">See your color changes in real-time</p>
                
                {/* Mini Shoe Model */}
                <div className="w-48 h-48 bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                  <Canvas
                    camera={{ position: [0, 0, 5], fov: 50 }}
                    style={{ background: 'transparent' }}
                  >
                    <Suspense fallback={null}>
                      <Environment preset="studio" />
                      <OrbitControls 
                        enableZoom={false} 
                        enablePan={false}
                        autoRotate={true}
                        autoRotateSpeed={2}
                      />
                      <ShoeModel
                        topColor={metafields.upper_base_hex || '#000000'}
                        bottomColor={metafields.sole_base_hex || '#000000'}
                        upperSplatterColor={metafields.upper_splatter_hex || '#000000'}
                        upperSplatterColor2={metafields.upper_splatter2_hex || '#000000'}
                        soleSplatterColor={metafields.sole_splatter_hex || '#000000'}
                        soleSplatterColor2={metafields.sole_splatter2_hex || '#000000'}
                        upperSplatterBaseColor={metafields.upper_darkbase_hex || '#000000'}
                        laceColor={metafields.lace_color_hex || '#000000'}
                        upperHasSplatter={true}
                        soleHasSplatter={true}
                        upperUseDualSplatter={!!(metafields.upper_splatter2_hex && metafields.upper_splatter2_hex !== '#000000')}
                        soleUseDualSplatter={!!(metafields.sole_splatter2_hex && metafields.sole_splatter2_hex !== '#000000')}
                        scale={0.8}
                      />
                    </Suspense>
                  </Canvas>
                </div>
              </div>
              
              {/* Color Summary */}
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2">Color Summary</h4>
                <div className="space-y-2">
                  {colorwayFields.map((field) => (
                    <div key={field.key} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: metafields[field.key] || '#000000' }}
                      />
                      <span className="text-gray-700">{field.label}</span>
                      <span className="text-gray-500 font-mono">{metafields[field.key] || '#000000'}</span>
                      {(field.key === 'upper_splatter2_hex' || field.key === 'sole_splatter2_hex') && 
                       metafields[field.key] && metafields[field.key] !== '#000000' && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                          Dual
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Dual Splatter Status */}
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>Upper Dual Splatter:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        metafields.upper_splatter2_hex && metafields.upper_splatter2_hex !== '#000000'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {metafields.upper_splatter2_hex && metafields.upper_splatter2_hex !== '#000000' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span>Sole Dual Splatter:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        metafields.sole_splatter2_hex && metafields.sole_splatter2_hex !== '#000000'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {metafields.sole_splatter2_hex && metafields.sole_splatter2_hex !== '#000000' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Color Editors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {colorwayFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`${product.id}-${field.key}`} className="text-sm font-medium">
                  {field.label}
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    id={`${product.id}-${field.key}`}
                    type="color"
                    value={metafields[field.key] || '#000000'}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={metafields[field.key] || '#000000'}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
                <p className="text-xs text-gray-500">{field.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These color values will be used by the KANE Footwear configurator to display available colorways for this product.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
