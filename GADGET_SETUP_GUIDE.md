# Complete Gadget Setup Guide for Kickview Interactive Shoes

This is a comprehensive, step-by-step guide for setting up Gadget as your backend while keeping your existing React frontend. Perfect for beginners!

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Create Gadget Backend App](#step-1-create-gadget-backend-app)
3. [Step 2: Add Shopify Plugin](#step-2-add-shopify-plugin)
4. [Step 3: Create Data Models](#step-3-create-data-models)
5. [Step 4: Set Up API Actions](#step-4-set-up-api-actions)
6. [Step 5: Configure CORS and API Keys](#step-5-configure-cors-and-api-keys)
7. [Step 6: Update Your React Frontend](#step-6-update-your-react-frontend)
8. [Step 7: Test the Integration](#step-7-test-the-integration)
9. [Step 8: Deploy to Production](#step-8-deploy-to-production)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you start, make sure you have:
- ✅ A Shopify store (or development store)
- ✅ Your existing React app (the one you're working on)
- ✅ A GitHub account (for version control)
- ✅ Basic understanding of React and JavaScript

## Step 1: Create Gadget Backend App

### 1.1 Go to Gadget
1. Open your web browser
2. Go to [gadget.new](https://gadget.new)
3. Click "Get Started" or "Create App"

### 1.2 Choose Template
1. **IMPORTANT**: Select "Blank App" (NOT "Shopify App" template)
2. This gives you more control and flexibility
3. Click "Create Blank App"

### 1.3 Name Your App
1. App Name: `kickview-shoes-backend`
2. Description: `Backend for Kickview Interactive Shoes customizer`
3. Choose your preferred region (closest to your users)
4. Click "Create App"

### 1.4 Wait for Setup
- Gadget will create your app (takes 1-2 minutes)
- You'll see a loading screen with progress
- Once complete, you'll be taken to your app dashboard

### 1.5 Verify App Creation
You should see:
- ✅ App dashboard with "Welcome to Gadget" message
- ✅ Left sidebar with "Models", "Actions", "API", etc.
- ✅ Top navigation with your app name

## Step 2: Add Shopify Plugin

### 2.1 Add Shopify Plugin
1. In your Gadget dashboard, click "Plugins" in the left sidebar
2. Click "Add Plugin"
3. Find "Shopify" in the list
4. Click "Add" next to Shopify

### 2.2 Configure Shopify Connection
1. You'll see a setup screen for Shopify
2. Click "Connect to Shopify"
3. This will open a new tab/window

### 2.3 Create Shopify App (if you don't have one)
1. In the new tab, you'll be taken to Shopify Partners
2. If you don't have a Shopify Partners account, create one
3. Click "Create App" → "Create app manually"
4. Fill in the details:
   - App name: `Kickview Shoes Customizer`
   - App URL: `https://your-gadget-app.gadget.app` (replace with your actual Gadget URL)
   - Allowed redirection URL: `https://your-gadget-app.gadget.app/auth/shopify/callback`

### 2.4 Configure App Scopes
In your Shopify app settings, go to "Configuration" and add these scopes:
- `read_products` - Read product data
- `write_products` - Update product variants  
- `read_inventory` - Check inventory levels
- `write_orders` - Create draft orders
- `read_customers` - Access customer data
- `write_customers` - Create/update customers

### 2.5 Get App Credentials
1. In your Shopify app, go to "App setup"
2. Copy the "Client ID" and "Client Secret"
3. Go back to your Gadget tab

### 2.6 Connect in Gadget
1. Paste the Client ID and Client Secret into Gadget
2. Click "Connect"
3. Authorize the connection when prompted
4. Wait for the connection to complete

### 2.7 Import Shopify Models
1. In Gadget, you'll see a list of Shopify models
2. Select these models to import:
   - ✅ Product
   - ✅ ProductVariant
   - ✅ Customer
   - ✅ DraftOrder
   - ✅ InventoryItem
   - ✅ InventoryLevel
3. Click "Import Models"
4. Wait for import to complete

## Step 3: Create Data Models

### 3.1 Create Colorway Model
1. In Gadget dashboard, click "Models" in the left sidebar
2. Click "Add Model"
3. Model name: `Colorway`
4. Click "Create Model"

### 3.2 Add Colorway Fields
Click "Add Field" for each of these fields:

**Basic Fields:**
- `name` - String (required)
- `description` - String
- `isActive` - Boolean (default: true)

**Color Fields:**
- `upperBaseColor` - String
- `upperHasSplatter` - Boolean (default: false)
- `upperSplatterColor` - String
- `upperSplatterBaseColor` - String
- `upperSplatterColor2` - String
- `upperUseDualSplatter` - Boolean (default: false)
- `upperPaintDensity` - Number (default: 0.5)

- `soleBaseColor` - String
- `soleHasSplatter` - Boolean (default: false)
- `soleSplatterColor` - String
- `soleSplatterBaseColor` - String
- `soleSplatterColor2` - String
- `soleUseDualSplatter` - Boolean (default: false)
- `solePaintDensity` - Number (default: 0.5)

- `laceColor` - String

**Shopify Integration:**
- `shopifyProductId` - String
- `shopifyVariantId` - String
- `inventoryQuantity` - Number (default: 0)

### 3.3 Create SavedDesign Model
1. Click "Add Model"
2. Model name: `SavedDesign`
3. Click "Create Model"

### 3.4 Add SavedDesign Fields
**Basic Fields:**
- `name` - String (required)
- `description` - String
- `shareToken` - String (required, unique)
- `isPublic` - Boolean (default: false)

**Design Configuration:**
- `colorwayId` - String
- `logoUrl` - String
- `logoColor1` - String
- `logoColor2` - String
- `logoColor3` - String

**Gradient Fields:**
- `upperHasGradient` - Boolean (default: false)
- `upperGradientColor1` - String
- `upperGradientColor2` - String
- `soleHasGradient` - Boolean (default: false)
- `soleGradientColor1` - String
- `soleGradientColor2` - String

**Texture Fields:**
- `upperTexture` - String
- `soleTexture` - String

**Metadata:**
- `createdBy` - String
- `viewCount` - Number (default: 0)
- `lastViewedAt` - DateTime

**Shopify Integration:**
- `shopifyDraftOrderId` - String
- `orderStatus` - String (default: "draft")

### 3.5 Create MetafieldMapping Model
1. Click "Add Model"
2. Model name: `MetafieldMapping`
3. Click "Create Model"

### 3.6 Add MetafieldMapping Fields
- `name` - String (required)
- `description` - String
- `isActive` - Boolean (default: true)
- `shopifyNamespace` - String (required)
- `shopifyKey` - String (required)
- `colorwayField` - String (required)
- `fieldType` - String (required) - Options: "color", "boolean", "number", "text"
- `displayName` - String
- `displayOrder` - Number (default: 0)
- `isRequired` - Boolean (default: false)
- `defaultValue` - String

### 3.7 Create OrderConfiguration Model
1. Click "Add Model"
2. Model name: `OrderConfiguration`
3. Click "Create Model"

### 3.8 Add OrderConfiguration Fields
**Customer Information:**
- `customerInfo` - JSON

**Order Details:**
- `sizeQuantities` - JSON
- `totalPairs` - Number
- `totalPrice` - Number
- `pricePerPair` - Number

**Design Data:**
- `designId` - String
- `modelScreenshot` - String
- `colorConfiguration` - JSON

**Status Tracking:**
- `status` - String (default: "draft") - Options: "draft", "pending", "completed", "cancelled"
- `shopifyDraftOrderId` - String
- `shopifyOrderId` - String

**Timestamps:**
- `expiresAt` - DateTime

## Step 4: Set Up API Actions

### 4.1 Create Get Colorways Action
1. Click "Actions" in the left sidebar
2. Click "Add Action"
3. Action name: `getColorways`
4. Click "Create Action"

### 4.2 Add Get Colorways Code
Replace the default code with:
```javascript
export async function run({ params, api, logger }) {
  const { includeInactive = false } = params;
  
  const colorways = await api.colorway.findMany({
    filter: {
      isActive: includeInactive ? undefined : true
    },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      inventoryQuantity: true,
      upperBaseColor: true,
      upperHasSplatter: true,
      upperSplatterColor: true,
      upperSplatterBaseColor: true,
      upperSplatterColor2: true,
      upperUseDualSplatter: true,
      upperPaintDensity: true,
      soleBaseColor: true,
      soleHasSplatter: true,
      soleSplatterColor: true,
      soleSplatterBaseColor: true,
      soleSplatterColor2: true,
      soleUseDualSplatter: true,
      solePaintDensity: true,
      laceColor: true,
      shopifyProductId: true,
      shopifyVariantId: true
    },
    sort: { name: "asc" }
  });

  return { colorways };
}
```

### 4.3 Create Save Design Action
1. Click "Add Action"
2. Action name: `saveDesign`
3. Click "Create Action"

### 4.4 Add Save Design Code
```javascript
export async function run({ params, api, logger }) {
  const { 
    name, 
    description, 
    isPublic, 
    designData, 
    createdBy 
  } = params;
  
  // Generate unique share token
  const shareToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  
  const design = await api.savedDesign.create({
    name,
    description,
    shareToken,
    isPublic,
    createdBy,
    ...designData
  });
  
  return { design };
}
```

### 4.5 Create Load Shared Design Action
1. Click "Add Action"
2. Action name: `loadSharedDesign`
3. Click "Create Action"

### 4.6 Add Load Shared Design Code
```javascript
export async function run({ params, api, logger }) {
  const { shareToken } = params;
  
  const design = await api.savedDesign.findFirst({
    filter: { shareToken },
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      colorwayId: true,
      logoUrl: true,
      logoColor1: true,
      logoColor2: true,
      logoColor3: true,
      upperHasGradient: true,
      upperGradientColor1: true,
      upperGradientColor2: true,
      soleHasGradient: true,
      soleGradientColor1: true,
      soleGradientColor2: true,
      upperTexture: true,
      soleTexture: true,
      createdBy: true,
      viewCount: true
    }
  });
  
  if (!design) {
    throw new Error("Design not found");
  }
  
  if (!design.isPublic) {
    throw new Error("Design is not public");
  }
  
  // Increment view count
  await api.savedDesign.update(design.id, {
    viewCount: (design.viewCount || 0) + 1,
    lastViewedAt: new Date()
  });
  
  return { design };
}
```

### 4.7 Create Draft Order Action
1. Click "Add Action"
2. Action name: `createDraftOrder`
3. Click "Create Action"

### 4.8 Add Draft Order Code
```javascript
export async function run({ params, api, logger }) {
  const { customerInfo, orderDetails, designId } = params;
  
  // Create or find customer
  let customer = await api.shopify.customer.findFirst({
    filter: { email: customerInfo.email }
  });

  if (!customer) {
    customer = await api.shopify.customer.create({
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      addresses: [{
        address1: customerInfo.address.line1,
        address2: customerInfo.address.line2,
        city: customerInfo.address.city,
        province: customerInfo.address.state,
        zip: customerInfo.address.zip,
        country: customerInfo.address.country
      }]
    });
  }

  // Prepare line items (you'll need to map sizes to variant IDs)
  const lineItems = Object.entries(orderDetails.sizeQuantities)
    .filter(([size, quantity]) => quantity > 0)
    .map(([size, quantity]) => ({
      variantId: getVariantIdForSize(size), // You'll need to implement this
      quantity: quantity
    }));

  // Create draft order
  const draftOrder = await api.shopify.draftOrder.create({
    customerId: customer.id,
    lineItems: lineItems,
    note: orderDetails.notes || "Custom shoe order from interactive designer",
    tags: ["custom-shoes", "interactive-designer"],
    customAttributes: [{
      key: "design_id",
      value: designId
    }, {
      key: "color_configuration",
      value: JSON.stringify(orderDetails.colorConfiguration)
    }, {
      key: "model_screenshot",
      value: orderDetails.modelScreenshot
    }],
    reserveInventoryUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });

  // Save order configuration
  const orderConfig = await api.orderConfiguration.create({
    customerInfo,
    sizeQuantities: orderDetails.sizeQuantities,
    totalPairs: orderDetails.totalPairs,
    totalPrice: orderDetails.totalPrice,
    pricePerPair: orderDetails.pricePerPair,
    designId,
    modelScreenshot: orderDetails.modelScreenshot,
    colorConfiguration: orderDetails.colorConfiguration,
    status: 'draft',
    shopifyDraftOrderId: draftOrder.id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  return { draftOrder, customer, orderConfig };
}

// Helper function to map sizes to variant IDs
function getVariantIdForSize(size) {
  // You'll need to implement this based on your Shopify product structure
  // This is a placeholder - replace with your actual logic
  const sizeToVariantMap = {
    "M3": "gid://shopify/ProductVariant/123",
    "M4": "gid://shopify/ProductVariant/124",
    "M5": "gid://shopify/ProductVariant/125",
    // Add more sizes as needed
  };
  
  return sizeToVariantMap[size] || null;
}
```

## Step 5: Configure CORS and API Keys

### 5.1 Set Up CORS
1. In Gadget dashboard, click "Settings" in the left sidebar
2. Click "API"
3. Find "CORS Origins" section
4. Add these origins:
   - `http://localhost:3000` (for development)
   - `https://your-frontend-domain.com` (for production - replace with your actual domain)
5. Click "Save"

### 5.2 Generate API Key
1. In the same "API" settings page
2. Find "API Keys" section
3. Click "Generate New Key"
4. Name it: `frontend-api-key`
5. Copy the generated key (you'll need this for your React app)
6. **IMPORTANT**: Save this key somewhere safe - you won't be able to see it again!

### 5.3 Test API Access
1. In Gadget dashboard, click "API" in the left sidebar
2. You should see your models listed
3. Click on "Colorway" to see the API endpoint
4. The URL should look like: `https://your-app.gadget.app/api/colorways`

## Step 6: Update Your React Frontend

### 6.1 Install Gadget Client
1. Open your terminal
2. Navigate to your React project directory:
   ```bash
   cd /Users/ty/kickview-interactive-shoes
   ```
3. Install the Gadget client:
   ```bash
   npm install @gadgetinc/api-client
   ```

### 6.2 Create Environment File
1. In your project root, create a new file called `.env.local`
2. Add your Gadget API key:
   ```env
   REACT_APP_GADGET_API_KEY=your_actual_api_key_here
   REACT_APP_GADGET_ENVIRONMENT=Development
   REACT_APP_GADGET_BASE_URL=https://your-app.gadget.app
   ```
3. Replace `your_actual_api_key_here` with the API key you copied from Gadget
4. Replace `your-app.gadget.app` with your actual Gadget app URL

### 6.3 Create Gadget Client Configuration
1. Create a new file: `src/lib/gadget.ts`
2. Add this code:
   ```typescript
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

### 6.4 Update Vite Configuration
1. Open `vite.config.ts`
2. Add environment variable definitions:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react-swc'

   export default defineConfig({
     plugins: [react()],
     define: {
       'process.env.REACT_APP_GADGET_API_KEY': JSON.stringify(process.env.REACT_APP_GADGET_API_KEY),
       'process.env.REACT_APP_GADGET_ENVIRONMENT': JSON.stringify(process.env.REACT_APP_GADGET_ENVIRONMENT),
       'process.env.REACT_APP_GADGET_BASE_URL': JSON.stringify(process.env.REACT_APP_GADGET_BASE_URL),
     },
   })
   ```

### 6.5 Create Gadget Service
1. Create a new file: `src/services/gadgetService.ts`
2. Add this code:
   ```typescript
   import { gadgetClient } from '@/lib/gadget';

   export class GadgetService {
     static async getColorways() {
       try {
         const response = await gadgetClient.getColorways();
         return response.colorways;
       } catch (error) {
         console.error('Error fetching colorways:', error);
         throw error;
       }
     }

     static async saveDesign(designData: any) {
       try {
         const response = await gadgetClient.saveDesign(designData);
         return response.design;
       } catch (error) {
         console.error('Error saving design:', error);
         throw error;
       }
     }

     static async loadSharedDesign(shareToken: string) {
       try {
         const response = await gadgetClient.loadSharedDesign({ shareToken });
         return response.design;
       } catch (error) {
         console.error('Error loading shared design:', error);
         throw error;
       }
     }

     static async createDraftOrder(orderData: any) {
       try {
         const response = await gadgetClient.createDraftOrder(orderData);
         return response;
       } catch (error) {
         console.error('Error creating draft order:', error);
         throw error;
       }
     }
   }
   ```

### 6.6 Create Colorways Hook
1. Create a new file: `src/hooks/useColorways.ts`
2. Add this code:
   ```typescript
   import { useState, useEffect } from 'react';
   import { GadgetService } from '@/services/gadgetService';

   export interface Colorway {
     id: string;
     name: string;
     description: string;
     isActive: boolean;
     inventoryQuantity: number;
     upperBaseColor: string;
     upperHasSplatter: boolean;
     upperSplatterColor: string;
     upperSplatterBaseColor: string;
     upperSplatterColor2: string;
     upperUseDualSplatter: boolean;
     upperPaintDensity: number;
     soleBaseColor: string;
     soleHasSplatter: boolean;
     soleSplatterColor: string;
     soleSplatterBaseColor: string;
     soleSplatterColor2: string;
     soleUseDualSplatter: boolean;
     solePaintDensity: number;
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
           const colorwaysData = await GadgetService.getColorways();
           setColorways(colorwaysData);
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

### 6.7 Update Your BuyButton Component
1. Open `src/components/BuyButton.tsx`
2. Add these imports at the top:
   ```typescript
   import { GadgetService } from '@/services/gadgetService';
   ```
3. Find your `handleSubmit` function and replace it with:
   ```typescript
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
       const designData = {
         name: `Custom Design - ${new Date().toLocaleDateString()}`,
         description: "Custom shoe design",
         isPublic: false,
         designData: getColorInfo(), // You'll need to implement this function
         createdBy: formData.email || 'anonymous'
       };

       const savedDesign = await GadgetService.saveDesign(designData);

       // Create draft order
       const orderData = {
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
           totalPairs: getTotalPairs(), // You'll need to implement this
           totalPrice: getTotalPrice(), // You'll need to implement this
           pricePerPair: PRICE_PER_PAIR, // You'll need to define this
           timestamp: new Date().toISOString(),
           modelScreenshot: screenshot, // You'll need to implement this
           colorConfiguration: getColorInfo() // You'll need to implement this
         },
         designId: savedDesign.id
       };

       const orderResponse = await GadgetService.createDraftOrder(orderData);

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

### 6.8 Update Your ColorCustomizer Component
1. Open `src/components/ColorCustomizer.tsx`
2. Add these imports at the top:
   ```typescript
   import { useColorways } from '@/hooks/useColorways';
   ```
3. Add this hook at the top of your component:
   ```typescript
   const { colorways, loading: colorwaysLoading } = useColorways();
   ```
4. Replace your static colorways data with the dynamic data:
   ```typescript
   // Replace this line (or similar):
   // const availableColorways = colorwaysData;
   
   // With this:
   const availableColorways = colorways.filter(colorway => 
     colorway.inventoryQuantity > 0
   );
   ```

## Step 7: Test the Integration

### 7.1 Start Your Development Server
1. In your terminal, run:
   ```bash
   npm run dev
   ```
2. Open your browser to `http://localhost:3000`

### 7.2 Test Colorways Loading
1. Check the browser console for any errors
2. Verify that colorways are loading (you might see an empty array initially)
3. Check the Network tab to see if API calls are being made

### 7.3 Add Test Data
1. Go to your Gadget dashboard
2. Click "Models" → "Colorway"
3. Click "Add Record"
4. Fill in some test data:
   - Name: "Test Colorway"
   - Description: "A test colorway"
   - Upper Base Color: "#2d5016"
   - Sole Base Color: "#1a1a1a"
   - Lace Color: "#ffffff"
   - Is Active: true
   - Inventory Quantity: 10
5. Click "Save"
6. Refresh your React app to see if the colorway appears

### 7.4 Test Design Saving
1. In your React app, try to save a design
2. Check the browser console for any errors
3. Go to Gadget dashboard → Models → SavedDesign to see if the design was saved

### 7.5 Test Order Creation
1. Try to create an order in your React app
2. Check for any errors in the console
3. Go to Gadget dashboard → Models → OrderConfiguration to see if the order was created
4. Check your Shopify admin for the draft order

## Step 8: Deploy to Production

### 8.1 Deploy Gadget Backend
1. In your Gadget dashboard, click "Settings"
2. Click "Environments"
3. Click "Promote to Production"
4. Wait for the promotion to complete

### 8.2 Update Environment Variables
1. In your React project, update `.env.local`:
   ```env
   REACT_APP_GADGET_API_KEY=your_production_api_key
   REACT_APP_GADGET_ENVIRONMENT=Production
   REACT_APP_GADGET_BASE_URL=https://your-app.gadget.app
   ```

### 8.3 Deploy Your React App
1. Build your app:
   ```bash
   npm run build
   ```
2. Deploy to your preferred platform (Vercel, Netlify, etc.)
3. Update your Gadget CORS settings to include your production domain

### 8.4 Update Shopify App Settings
1. In your Shopify app, update the App URL to your production domain
2. Update the allowed redirection URL

## Troubleshooting

### Common Issues and Solutions

#### 1. CORS Errors
**Problem**: "Access to fetch at 'https://your-app.gadget.app' from origin 'http://localhost:3000' has been blocked by CORS policy"

**Solution**: 
- Check your Gadget CORS settings
- Make sure `http://localhost:3000` is in the CORS origins list
- Restart your development server after updating CORS

#### 2. API Key Errors
**Problem**: "401 Unauthorized" or "Invalid API key"

**Solution**:
- Check that your API key is correct in `.env.local`
- Make sure you're using the right environment (Development vs Production)
- Regenerate the API key if needed

#### 3. Model Not Found Errors
**Problem**: "Model 'Colorway' not found"

**Solution**:
- Check that you've created all the required models in Gadget
- Verify the model names match exactly
- Make sure you've saved the models after creating them

#### 4. Field Not Found Errors
**Problem**: "Field 'upperBaseColor' not found"

**Solution**:
- Check that you've added all required fields to your models
- Verify field names match exactly
- Make sure fields are saved after adding them

#### 5. Shopify Connection Issues
**Problem**: "Shopify connection failed"

**Solution**:
- Check your Shopify app credentials
- Verify the app scopes are correct
- Make sure your Shopify app is approved (if required)

#### 6. Build Errors
**Problem**: "Module not found" or TypeScript errors

**Solution**:
- Make sure you've installed `@gadgetinc/api-client`
- Check that all import paths are correct
- Restart your development server

### Debugging Tips

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: See if API calls are being made
3. **Check Gadget Dashboard**: Look for error logs in the Actions section
4. **Test API Endpoints**: Use the API explorer in Gadget to test endpoints directly

### Getting Help

1. **Gadget Documentation**: [docs.gadget.dev](https://docs.gadget.dev)
2. **Gadget Community**: [community.gadget.dev](https://community.gadget.dev)
3. **Shopify Documentation**: [shopify.dev](https://shopify.dev)

## Next Steps

Once you have the basic integration working:

1. **Add More Features**: Design sharing, admin interface, etc.
2. **Optimize Performance**: Add caching, optimize API calls
3. **Add Error Handling**: Better error messages and recovery
4. **Add Testing**: Unit tests and integration tests
5. **Monitor Usage**: Set up analytics and monitoring

## Summary

This guide has walked you through:
- ✅ Creating a Gadget backend app
- ✅ Adding Shopify integration
- ✅ Creating data models
- ✅ Setting up API actions
- ✅ Configuring CORS and API keys
- ✅ Updating your React frontend
- ✅ Testing the integration
- ✅ Deploying to production

Your app now has:
- Persistent data storage in Gadget
- Shopify integration for products and orders
- API endpoints for all functionality
- Your existing React frontend with new backend capabilities

You can now save designs, create orders, and manage your shoe customizer with a robust backend!
