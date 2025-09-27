import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Package, Users, ShoppingCart, Inventory } from 'lucide-react';
import { useShopify } from '@/hooks/useShopify';
import { ShopifyConnection } from './ShopifyConnection';
import { toast } from './ui/use-toast';
import type { ShopifyProduct } from '@/lib/shopify';

export const ShopifyAdmin: React.FC = () => {
  const { isConnected, getProducts, getInventoryLevels } = useShopify();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const loadProducts = async () => {
    if (!isConnected) return;

    setIsLoadingProducts(true);
    try {
      const productList = await getProducts(10); // Load first 10 products
      setProducts(productList);
      toast({
        title: "Products Loaded",
        description: `Loaded ${productList.length} products from Shopify`,
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

  useEffect(() => {
    if (isConnected) {
      loadProducts();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Shopify Integration</h2>
          <p className="text-muted-foreground mb-6">
            Connect your Shopify store to enable product sync and order management
          </p>
        </div>
        <div className="flex justify-center">
          <ShopifyConnection />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shopify Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your Shopify integration and sync products
          </p>
        </div>
        <ShopifyConnection />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Inventory className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Variants</p>
                <p className="text-2xl font-bold">
                  {products.reduce((total, product) => total + product.variants.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Active Products</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Metafields</p>
                <p className="text-2xl font-bold">
                  {products.reduce((total, product) => total + product.metafields.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Your Shopify products and their colorway configurations
              </CardDescription>
            </div>
            <Button onClick={loadProducts} disabled={isLoadingProducts}>
              {isLoadingProducts ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Refresh Products'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{product.title}</h3>
                      <p className="text-sm text-muted-foreground">{product.handle}</p>
                    </div>
                    <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Variants</p>
                      <p className="text-sm text-muted-foreground">
                        {product.variants.length} variants
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Product Type</p>
                      <p className="text-sm text-muted-foreground">
                        {product.productType || 'Not specified'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Metafields</p>
                      <p className="text-sm text-muted-foreground">
                        {product.metafields.length} metafields
                      </p>
                    </div>
                  </div>

                  {/* Show colorway metafields if any */}
                  {product.metafields.filter(m => m.namespace === 'colorway').length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium mb-2">Colorway Configuration:</p>
                      <div className="space-y-1">
                        {product.metafields
                          .filter(m => m.namespace === 'colorway')
                          .map((metafield) => (
                            <div key={metafield.id} className="flex justify-between text-xs">
                              <span className="font-medium">{metafield.key}:</span>
                              <span className="text-muted-foreground">{metafield.value}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
