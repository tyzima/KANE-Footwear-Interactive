# Integrating Existing React Frontend with Gadget.dev Backend

This guide shows how to integrate your existing React frontend with a Gadget.dev backend without manually copying components or rebuilding the frontend.

## Overview

Gadget.dev can generate a frontend, but for existing applications, you'll want to:
1. Use Gadget as a backend API only
2. Keep your existing React frontend
3. Connect them via API calls
4. Deploy them separately

## Data Models & Field Specifications

### Colorway Model
```javascript
model Colorway {
  fields {
    // Basic Information
    id: String (unique identifier)
    name: String (e.g., "Classic Forest", "Crimson Splatter")
    description: String (e.g., "Timeless forest green with natural tones")
    isActive: Boolean (whether this colorway is available for selection)
    
    // Upper Configuration
    upperBaseColor: String (hex color, e.g., "#2d5016")
    upperHasSplatter: Boolean (whether upper has splatter effect)
    upperSplatterColor: String (hex color for splatter, e.g., "#f8f8ff")
    upperSplatterBaseColor: String (hex color for splatter base, e.g., "#060c03")
    upperSplatterColor2: String (hex color for secondary splatter, e.g., "#0d1806")
    upperUseDualSplatter: Boolean (whether to use dual splatter colors)
    upperPaintDensity: Number (0-1, controls splatter intensity)
    
    // Sole Configuration
    soleBaseColor: String (hex color, e.g., "#8b4513")
    soleHasSplatter: Boolean (whether sole has splatter effect)
    soleSplatterColor: String (hex color for splatter)
    soleSplatterBaseColor: String (hex color for splatter base)
    soleSplatterColor2: String (hex color for secondary splatter)
    soleUseDualSplatter: Boolean (whether to use dual splatter colors)
    solePaintDensity: Number (0-1, controls splatter intensity)
    
    // Lace Configuration
    laceColor: String (hex color, e.g., "#FFFFFF")
    
    // Gradient Support (Advanced Features)
    upperHasGradient: Boolean (whether upper has gradient effect)
    upperGradientColor1: String (hex color for gradient start)
    upperGradientColor2: String (hex color for gradient end)
    soleHasGradient: Boolean (whether sole has gradient effect)
    soleGradientColor1: String (hex color for gradient start)
    soleGradientColor2: String (hex color for gradient end)
    
    // Texture Support
    upperTexture: String (texture file path or URL)
    soleTexture: String (texture file path or URL)
    
    // Shopify Integration
    shopifyProductId: String (Shopify product ID)
    shopifyVariantId: String (Shopify variant ID)
    inventoryQuantity: Number (available stock quantity)
    
    // Metadata
    createdAt: DateTime
    updatedAt: DateTime
  }
}
```

### SavedDesign Model
```javascript
model SavedDesign {
  fields {
    // Basic Information
    id: String (unique identifier)
    name: String (user-defined design name)
    description: String (optional description)
    shareToken: String (unique token for sharing, e.g., "abc123def456")
    isPublic: Boolean (whether design can be shared publicly)
    
    // Design Configuration
    colorwayId: String (reference to Colorway model)
    
    // Logo Configuration
    logoUrl: String (URL to uploaded logo image)
    logoColor1: String (hex color for logo part 1, e.g., blue parts)
    logoColor2: String (hex color for logo part 2, e.g., black parts)
    logoColor3: String (hex color for logo part 3, e.g., red parts)
    logoPosition: JSON (3D position [x, y, z])
    logoRotation: JSON (3D rotation [x, y, z])
    logoScale: Number (logo size multiplier)
    
    // Circle Logo (SVG texture)
    circleLogoUrl: String (URL to circle logo SVG)
    
    // Advanced Customization
    upperHasGradient: Boolean
    upperGradientColor1: String
    upperGradientColor2: String
    soleHasGradient: Boolean
    soleGradientColor1: String
    soleGradientColor2: String
    
    upperTexture: String
    soleTexture: String
    
    // User Information
    createdBy: String (user identifier or email)
    viewCount: Number (number of times design has been viewed)
    lastViewedAt: DateTime
    
    // Order Integration
    shopifyDraftOrderId: String (if design was used in an order)
    orderStatus: String ('draft', 'pending', 'completed', 'cancelled')
    
    // Metadata
    createdAt: DateTime
    updatedAt: DateTime
  }
}
```

### OrderConfiguration Model
```javascript
model OrderConfiguration {
  fields {
    // Customer Information
    customerInfo: JSON {
      firstName: String
      lastName: String
      email: String
      phone: String
      address: {
        line1: String
        line2: String (optional)
        city: String
        state: String
        zip: String
        country: String
      }
      notes: String (optional)
    }
    
    // Order Details
    sizeQuantities: JSON {
      "M3": Number
      "M4": Number
      "M5": Number
      "M6": Number
      "M7": Number
      "M8": Number
      "M9": Number
      "M10": Number
      "M11": Number
      "W5": Number
      "W6": Number
      "W7": Number
      "W8": Number
      "W9": Number
      "W10": Number
      "W11": Number
    }
    
    totalPairs: Number (sum of all size quantities)
    totalPrice: Number (totalPairs * pricePerPair)
    pricePerPair: Number (base price, e.g., 80)
    
    // Design Data
    designId: String (reference to SavedDesign)
    modelScreenshot: String (base64 encoded screenshot)
    colorConfiguration: JSON (complete color state)
    
    // Status Tracking
    status: String ('draft', 'pending', 'completed', 'cancelled')
    shopifyDraftOrderId: String
    shopifyOrderId: String (when order is completed)
    
    // Timestamps
    createdAt: DateTime
    updatedAt: DateTime
    expiresAt: DateTime (for draft orders, typically 24 hours)
  }
}
```

### MetafieldMapping Model
```javascript
model MetafieldMapping {
  fields {
    // Basic Information
    id: String (unique identifier)
    name: String (human-readable mapping name)
    description: String (description of what this mapping does)
    isActive: Boolean (whether this mapping is currently used)
    
    // Shopify Metafield Configuration
    shopifyNamespace: String (e.g., "custom")
    shopifyKey: String (e.g., "upper_base_color")
    shopifyMetafieldType: String (e.g., "single_line_text_field", "boolean", "number_integer")
    
    // Colorway Field Mapping
    colorwayField: String (which Colorway field this maps to, e.g., "upperBaseColor")
    fieldType: String ('color', 'boolean', 'number', 'text')
    
    // UI Configuration
    displayName: String (how to display this field in admin)
    displayOrder: Number (order in which to show fields)
    isRequired: Boolean (whether this field is required)
    defaultValue: String (default value if metafield is empty)
    
    // Validation Rules
    validationPattern: String (regex pattern for validation)
    minValue: Number (for numeric fields)
    maxValue: Number (for numeric fields)
    
    // Metadata
    createdAt: DateTime
    updatedAt: DateTime
  }
}
```

### School Model (for School Selector)
```javascript
model School {
  fields {
    // Basic Information
    id: String (unique identifier)
    name: String (school name, e.g., "University of California")
    shortName: String (abbreviation, e.g., "UC")
    city: String (e.g., "Berkeley")
    state: String (e.g., "CA")
    country: String (e.g., "USA")
    
    // Visual Configuration
    primaryColor: String (hex color for school's primary color)
    secondaryColor: String (hex color for school's secondary color)
    logoUrl: String (URL to school logo)
    
    // Metadata
    isActive: Boolean (whether school is available for selection)
    createdAt: DateTime
    updatedAt: DateTime
  }
}
```

### Size Configuration
```javascript
// Size definitions used throughout the application
const MENS_SIZES = ['M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11'];
const WOMENS_SIZES = ['W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11'];
const ALL_SIZES = [...MENS_SIZES, ...WOMENS_SIZES];

// Size to Shopify Variant ID mapping
const SIZE_TO_VARIANT_MAP = {
  'M3': 'gid://shopify/ProductVariant/1234567890',
  'M4': 'gid://shopify/ProductVariant/1234567891',
  // ... etc for all sizes
};
```

### Color Configuration Structure
```javascript
// Complete color configuration structure used in the application
interface ColorConfiguration {
  upper: {
    baseColor: string;           // Hex color
    hasSplatter: boolean;        // Whether splatter effect is enabled
    splatterColor: string;       // Primary splatter color
    splatterBaseColor: string;   // Base color for splatter effect
    splatterColor2: string;      // Secondary splatter color
    useDualSplatter: boolean;    // Whether to use dual splatter
    paintDensity: number;        // 0-1, controls splatter intensity
    hasGradient: boolean;        // Whether gradient effect is enabled
    gradientColor1: string;      // Gradient start color
    gradientColor2: string;      // Gradient end color
    texture: string | null;      // Texture file path or URL
  };
  sole: {
    baseColor: string;           // Hex color
    hasSplatter: boolean;        // Whether splatter effect is enabled
    splatterColor: string;       // Primary splatter color
    splatterBaseColor: string;   // Base color for splatter effect
    splatterColor2: string;      // Secondary splatter color
    useDualSplatter: boolean;    // Whether to use dual splatter
    paintDensity: number;        // 0-1, controls splatter intensity
    hasGradient: boolean;        // Whether gradient effect is enabled
    gradientColor1: string;      // Gradient start color
    gradientColor2: string;      // Gradient end color
    texture: string | null;      // Texture file path or URL
  };
  laces: {
    color: string;               // Hex color
  };
  logo: {
    color: string;               // Hex color (legacy, use logoColor1/2/3 instead)
    url: string | null;          // Logo image URL
    color1: string;              // Blue parts color
    color2: string;              // Black parts color
    color3: string;              // Red parts color
    position: [number, number, number]; // 3D position
    rotation: [number, number, number]; // 3D rotation
    scale: number;               // Size multiplier
  };
  circleLogo: {
    url: string | null;          // Circle logo SVG URL
  };
}
```

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
