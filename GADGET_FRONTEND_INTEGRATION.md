# Integrating Existing React Frontend with Gadget.dev Backend

This guide shows how to integrate your existing React frontend with a Gadget.dev backend without manually copying components or rebuilding the frontend.

## Overview

Gadget.dev can generate a frontend, but for existing applications, you'll want to:
1. Use Gadget as a backend API only
2. Keep your existing React frontend
3. Connect them via API calls
4. Deploy them separately

## Option 1: Gadget Backend + Existing Frontend (Recommended)

### 1.1 Create Gadget Backend Only

1. **Create Gadget App:**
   - Go to [gadget.new](https://gadget.new)
   - Select "Blank App" (not Shopify template)
   - Name it "kickview-shoes-backend"

2. **Add Shopify Plugin:**
   - Go to Plugins → Add Plugin → Shopify
   - Connect your Shopify store
   - Import only the models you need (Product, ProductVariant, Customer, DraftOrder)

3. **Build Your Models:**
   Use the AI prompt from `GADGET_AI_PROMPT.md` to create:
   - Colorway model
   - SavedDesign model
   - MetafieldMapping model
   - OrderConfiguration model

### 1.2 Configure Gadget for API-Only

1. **Disable Frontend Generation:**
   - In your Gadget app settings
   - Turn off "Generate Frontend"
   - This keeps Gadget as API-only

2. **Set Up CORS:**
   ```javascript
   // In your Gadget app's settings
   CORS_ORIGINS: [
     "http://localhost:3000", // Development
     "https://your-frontend-domain.com" // Production
   ]
   ```

3. **Generate API Key:**
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key for your frontend

### 1.3 Connect Frontend to Gadget

1. **Install Gadget Client:**
   ```bash
   npm install @gadgetinc/api-client
   ```

2. **Configure Gadget Client:**
   ```typescript
   // src/lib/gadget.ts
   import { Client } from "@gadgetinc/api-client";

   export const gadgetClient = new Client({
     environment: process.env.NODE_ENV === 'production' 
       ? 'Production' 
       : 'Development',
     authenticationMode: { 
       apiKey: process.env.REACT_APP_GADGET_API_KEY 
     }
   });
   ```

3. **Update Environment Variables:**
   ```env
   # .env.local
   REACT_APP_GADGET_API_KEY=your_gadget_api_key_here
   REACT_APP_GADGET_ENVIRONMENT=Development
   ```

4. **Update Vite Config:**
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react-swc'

   export default defineConfig({
     plugins: [react()],
     define: {
       'process.env.REACT_APP_GADGET_API_KEY': JSON.stringify(process.env.REACT_APP_GADGET_API_KEY),
       'process.env.REACT_APP_GADGET_ENVIRONMENT': JSON.stringify(process.env.REACT_APP_GADGET_ENVIRONMENT),
     },
   })
   ```

### 1.4 Replace Data Sources

1. **Update Colorway Hook:**
   ```typescript
   // src/hooks/useColorways.ts
   import { useState, useEffect } from 'react';
   import { gadgetClient } from '@/lib/gadget';

   export interface Colorway {
     id: string;
     name: string;
     description: string;
     isActive: boolean;
     inventoryQuantity: number;
     upperBaseColor: string;
     upperHasSplatter: boolean;
     upperSplatterColor: string;
     soleBaseColor: string;
     soleHasSplatter: boolean;
     soleSplatterColor: string;
     laceColor: string;
     shopifyProductId: string;
     shopifyVariantId: string;
   }

   export const useColorways = () => {
     const [colorways, setColorways] = useState<Colorway[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       const fetchColorways = async () => {
         try {
           setLoading(true);
           const response = await gadgetClient.getColorways();
           setColorways(response.colorways);
         } catch (err) {
           setError('Failed to load colorways');
           console.error('Error fetching colorways:', err);
         } finally {
           setLoading(false);
         }
       };

       fetchColorways();
     }, []);

     return { colorways, loading, error };
   };
   ```

2. **Update BuyButton Component:**
   ```typescript
   // src/components/BuyButton.tsx (key changes)
   import { gadgetClient } from '@/lib/gadget';

   // Replace the handleSubmit function
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();

     if (!isFormValid()) {
       toast({
         title: "Missing Information",
         description: "Please complete all required steps.",
         variant: "destructive",
       });
       return;
     }

     setIsSubmitting(true);

     try {
       // Save design first
       const designResponse = await gadgetClient.saveDesign({
         name: `Custom Design - ${new Date().toLocaleDateString()}`,
         description: "Custom shoe design",
         isPublic: false,
         designData: getColorInfo(),
         createdBy: formData.email || 'anonymous'
       });

       // Create draft order
       const orderResponse = await gadgetClient.createDraftOrder({
         customerInfo: {
           firstName: formData.firstName,
           lastName: formData.lastName,
           email: formData.email,
           phone: formData.phone,
           address: {
             line1: formData.addressLine1,
             line2: formData.addressLine2,
             city: formData.city,
             state: formData.state,
             zip: formData.zip,
             country: formData.country
           },
           notes: formData.notes
         },
         orderDetails: {
           sizeQuantities: formData.sizeQuantities,
           totalPairs: getTotalPairs(),
           totalPrice: getTotalPrice(),
           pricePerPair: PRICE_PER_PAIR,
           timestamp: new Date().toISOString(),
           modelScreenshot: screenshot,
           colorConfiguration: getColorInfo()
         },
         designId: designResponse.design.id
       });

       toast({
         title: "Order Created!",
         description: `Draft order #${orderResponse.draftOrder.id} has been created. We'll contact you soon with payment details.`,
       });

       setIsOpen(false);
     } catch (error) {
       console.error('Error creating order:', error);
       toast({
         title: "Order Failed",
         description: "There was an error creating your order. Please try again.",
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
   ```

## Option 2: Import Existing Components into Gadget

If you want to use Gadget's frontend capabilities, you can import your existing components:

### 2.1 Create Gadget App with Frontend

1. **Create Gadget App:**
   - Go to [gadget.new](https://gadget.new)
   - Select "Blank App"
   - Enable frontend generation

2. **Import Your Components:**
   ```bash
   # In your Gadget app's frontend directory
   # Copy your existing components
   cp -r /path/to/your/existing/src/components/* ./src/components/
   cp -r /path/to/your/existing/src/hooks/* ./src/hooks/
   cp -r /path/to/your/existing/src/lib/* ./src/lib/
   ```

3. **Update Imports:**
   - Change relative imports to work with Gadget's structure
   - Update any hardcoded paths
   - Ensure all dependencies are in Gadget's package.json

### 2.2 Migrate Dependencies

1. **Check Package.json:**
   ```bash
   # Compare dependencies
   diff package.json /path/to/your/existing/package.json
   ```

2. **Add Missing Dependencies:**
   ```bash
   # In Gadget app
   npm install @react-three/fiber @react-three/drei three
   npm install framer-motion gsap
   # ... other missing dependencies
   ```

3. **Update Gadget's Package.json:**
   - Add any missing dependencies
   - Ensure versions are compatible

## Option 3: Hybrid Approach (Best of Both Worlds)

### 3.1 Use Gadget for Backend + Admin

1. **Gadget Backend:**
   - Create the backend with all models and actions
   - Build admin interface for managing colorways
   - Handle Shopify integration

2. **Existing Frontend:**
   - Keep your existing React app
   - Connect to Gadget via API
   - Maintain all your custom components

3. **Admin Interface:**
   - Use Gadget's generated admin for:
     - Colorway management
     - Design gallery
     - Analytics dashboard
     - Metafield mapping configuration

### 3.2 Deployment Strategy

1. **Backend (Gadget):**
   - Deploy to Gadget's hosting
   - Configure custom domain if needed
   - Set up monitoring and analytics

2. **Frontend (Your App):**
   - Deploy to Vercel, Netlify, or your preferred platform
   - Configure environment variables
   - Set up CI/CD pipeline

3. **Domain Configuration:**
   ```
   api.yourdomain.com → Gadget backend
   yourdomain.com → Your React frontend
   admin.yourdomain.com → Gadget admin interface
   ```

## Implementation Steps

### Step 1: Set Up Gadget Backend

1. Create Gadget app (blank template)
2. Add Shopify plugin
3. Use AI prompt to build models and actions
4. Configure CORS for your frontend domain
5. Generate API key

### Step 2: Update Frontend

1. Install Gadget client
2. Configure environment variables
3. Update data fetching hooks
4. Modify BuyButton component
5. Test API connections

### Step 3: Add New Features

1. Design saving functionality
2. Share design components
3. Load shared design hook
4. Admin interface integration

### Step 4: Deploy and Test

1. Deploy backend to Gadget
2. Deploy frontend to your platform
3. Configure domains and SSL
4. Test end-to-end functionality
5. Set up monitoring

## Code Examples

### Frontend API Integration

```typescript
// src/services/gadgetService.ts
import { gadgetClient } from '@/lib/gadget';

export class GadgetService {
  static async getColorways() {
    return await gadgetClient.getColorways();
  }

  static async saveDesign(designData: any) {
    return await gadgetClient.saveDesign(designData);
  }

  static async loadSharedDesign(shareToken: string) {
    return await gadgetClient.loadSharedDesign({ shareToken });
  }

  static async createDraftOrder(orderData: any) {
    return await gadgetClient.createDraftOrder(orderData);
  }

  static async checkInventory(variantId: string, quantity: number) {
    return await gadgetClient.checkInventory({ variantId, requestedQuantity: quantity });
  }
}
```

### Environment Configuration

```typescript
// src/config/environment.ts
export const config = {
  gadget: {
    apiKey: process.env.REACT_APP_GADGET_API_KEY,
    environment: process.env.REACT_APP_GADGET_ENVIRONMENT || 'Development',
    baseUrl: process.env.REACT_APP_GADGET_BASE_URL
  },
  app: {
    name: 'Kickview Interactive Shoes',
    version: '1.0.0'
  }
};
```

### Error Handling

```typescript
// src/utils/errorHandler.ts
export const handleGadgetError = (error: any) => {
  console.error('Gadget API Error:', error);
  
  if (error.status === 401) {
    return 'Authentication failed. Please check your API key.';
  }
  
  if (error.status === 403) {
    return 'Access denied. Please check your permissions.';
  }
  
  if (error.status === 404) {
    return 'Resource not found.';
  }
  
  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred.';
};
```

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure your frontend domain is in Gadget's CORS settings
   - Check that requests are going to the correct environment

2. **API Key Issues:**
   - Verify the API key is correct
   - Check that the key has the right permissions
   - Ensure you're using the correct environment

3. **Import Errors:**
   - Check that all dependencies are installed
   - Verify import paths are correct
   - Ensure TypeScript types are properly configured

4. **Build Errors:**
   - Check for missing dependencies
   - Verify environment variables are set
   - Ensure all imports are resolved

### Debugging Tips

1. **Enable Debug Logging:**
   ```typescript
   // In your Gadget client configuration
   const gadgetClient = new Client({
     environment: 'Development',
     authenticationMode: { apiKey: process.env.REACT_APP_GADGET_API_KEY },
     logging: {
       level: 'debug'
     }
   });
   ```

2. **Check Network Tab:**
   - Monitor API calls in browser dev tools
   - Verify request/response formats
   - Check for CORS or authentication errors

3. **Gadget Dashboard:**
   - Monitor API usage and errors
   - Check action logs
   - Verify data is being created/updated correctly

## Best Practices

1. **Keep Frontend and Backend Separate:**
   - Maintain clear separation of concerns
   - Use API contracts for communication
   - Version your APIs

2. **Error Handling:**
   - Implement comprehensive error handling
   - Provide user-friendly error messages
   - Log errors for debugging

3. **Performance:**
   - Cache frequently accessed data
   - Implement loading states
   - Optimize API calls

4. **Security:**
   - Never expose API keys in frontend code
   - Use environment variables
   - Implement proper CORS policies

5. **Testing:**
   - Test API integration thoroughly
   - Mock API calls for unit tests
   - Test error scenarios

## Conclusion

The recommended approach is **Option 1** (Gadget Backend + Existing Frontend) because it:
- Preserves your existing codebase
- Leverages Gadget's backend capabilities
- Maintains flexibility and control
- Allows for easy updates and maintenance
- Provides a clear separation of concerns

This approach gives you the best of both worlds: Gadget's powerful backend with Shopify integration, and your existing, well-tested frontend components.
