import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken, initializeShopifyClient } from '@/lib/shopify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ShopifyCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const shop = searchParams.get('shop');
        const state = searchParams.get('state');

        console.log('OAuth callback received:', { code: !!code, shop, state });

        if (!code) {
          throw new Error('No authorization code received from Shopify');
        }

        if (!shop) {
          throw new Error('No shop domain received from Shopify');
        }

        // Validate shop domain format
        const shopDomain = shop.endsWith('.myshopify.com') ? shop : `${shop}.myshopify.com`;

        setStatus('loading');
        
        console.log('Exchanging code for access token...');
        
        // Exchange code for access token
        const accessToken = await exchangeCodeForToken(shopDomain, code);
        
        console.log('Access token received:', accessToken.substring(0, 10) + '...');

        // Initialize Shopify client with the new token
        initializeShopifyClient(shopDomain, accessToken);

        // Store credentials securely
        localStorage.setItem('shopify_domain', shopDomain);
        localStorage.setItem('shopify_access_token', accessToken);

        console.log('OAuth flow completed successfully');
        
        setStatus('success');
        
        // Check if we're in a popup (opened by embedded app)
        const isPopup = window.opener && window.opener !== window;
        
        if (isPopup) {
          // Send success message to parent window
          window.opener.postMessage({
            type: 'SHOPIFY_OAUTH_SUCCESS',
            shop: shopDomain,
            accessToken: accessToken.substring(0, 10) + '...' // Don't send full token
          }, window.location.origin);
          
          // Show brief success message then close
          toast({
            title: "Successfully connected!",
            description: "Closing popup...",
          });
          
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          // Normal flow - show success and redirect
          toast({
            title: "Successfully connected to Shopify!",
            description: `Connected to ${shopDomain}`,
          });

          // Redirect to admin after a brief delay
          setTimeout(() => {
            navigate('/shopify-admin');
          }, 2000);
        }

      } catch (err) {
        console.error('OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setStatus('error');
        
        // Check if we're in a popup
        const isPopup = window.opener && window.opener !== window;
        
        if (isPopup) {
          // Send error message to parent window
          window.opener.postMessage({
            type: 'SHOPIFY_OAUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
          
          toast({
            title: "Connection failed",
            description: "Check the main window for details.",
            variant: "destructive",
          });
          
          // Keep popup open so user can see the error
        } else {
          toast({
            title: "Connection failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const retryConnection = () => {
    navigate('/shopify-admin');
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            
            {status === 'loading' && 'Connecting to Shopify...'}
            {status === 'success' && 'Successfully Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we complete the connection process.'}
            {status === 'success' && 'Your Shopify store has been connected successfully. Redirecting to admin...'}
            {status === 'error' && 'There was an issue connecting to your Shopify store.'}
          </CardDescription>
        </CardHeader>
        
        {status === 'loading' && (
          <CardContent className="text-center">
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Exchanging authorization code for access token...
              </p>
            </div>
          </CardContent>
        )}

        {status === 'success' && (
          <CardContent className="text-center space-y-4">
            <div className="text-green-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Connection Established!</p>
            </div>
            <p className="text-sm text-muted-foreground">
              You can now manage your products and orders through the KANE Footwear admin panel.
            </p>
          </CardContent>
        )}

        {status === 'error' && (
          <CardContent className="space-y-4">
            <div className="text-center text-red-600">
              <XCircle className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Connection Failed</p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Error:</strong> {error}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={retryConnection} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button onClick={goHome} variant="default" className="flex-1">
                Go Home
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ShopifyCallback;
