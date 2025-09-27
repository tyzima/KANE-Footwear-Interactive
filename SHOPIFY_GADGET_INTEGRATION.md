# Shopify + Gadget.dev Integration Guide

This document outlines the steps to integrate your Kickview Interactive Shoes app with Shopify using Gadget.dev as the backend. The integration will ensure that color combinations are limited to available products, and the BuyButton component will create draft orders with proper inventory management.

## Overview

The integration will:
1. Replace static colorway data with dynamic data from Shopify products
2. Use custom fields to define color variables for each product variant
3. Create draft orders when users submit through BuyButton
4. Enforce inventory limits based on available stock
5. Reserve inventory during the order process

## Phase 1: Gadget.dev Setup

### 1.1 Create Gadget Application

1. Navigate to [gadget.new](https://gadget.new)
2. Select the "Shopify App" template
3. Name your application (e.g., "kickview-shoes-backend")
4. Choose your preferred region

### 1.2 Connect to Shopify

1. **Create Shopify App:**
   - Go to [Shopify Partner Dashboard](https://partners.shopify.com)
   - Click "Create App" → "Create app manually"
   - Name: "Kickview Shoes Customizer"
   - App URL: Your Gadget app URL
   - Allowed redirection URL: `https://your-gadget-app.gadget.app/auth/shopify/callback`

2. **Configure Scopes:**
   - `read_products` - Read product data
   - `write_products` - Update product variants
   - `read_inventory` - Check inventory levels
   - `write_orders` - Create draft orders
   - `read_customers` - Access customer data
   - `write_customers` - Create/update customers

3. **Connect in Gadget:**
   - In your Gadget app, go to Plugins → Shopify
   - Enter your Shopify app's Client ID and Client Secret
   - Click "Connect" and authorize the connection

### 1.3 Configure Data Models

1. **Import Shopify Models:**
   - Product
   - ProductVariant
   - InventoryItem
   - InventoryLevel
   - Customer
   - DraftOrder
   - Order

2. **Create Custom Models:**
   ```javascript
   // Colorway model
   model Colorway {
     fields {
       name: String
       description: String
       upperBaseColor: String
       upperHasSplatter: Boolean
       upperSplatterColor: String
       soleBaseColor: String
       soleHasSplatter: Boolean
       soleSplatterColor: String
       laceColor: String
       isActive: Boolean
       shopifyProductId: String
       shopifyVariantId: String
     }
   }

   // Order Configuration model
   model OrderConfiguration {
     fields {
       colorwayId: String
       sizeQuantities: JSON
       customerInfo: JSON
       screenshot: String
       totalPrice: Number
       status: String // 'draft', 'pending', 'completed'
       shopifyDraftOrderId: String
     }
   }
   ```

## Phase 2: Product Setup in Shopify

### 2.1 Create Product Structure

1. **Main Product:**
   - Title: "Custom Interactive Shoes"
   - Product Type: "Shoes"
   - Vendor: "Kickview"

2. **Product Variants:**
   Create variants for each colorway:
   - Option 1: Colorway (Classic Forest, Forest Splatter, etc.)
   - Option 2: Size (M3, M4, M5, etc.)

### 2.2 Configure Custom Fields (Flexible Mapping)

The system supports flexible metafield mapping, allowing you to configure which Shopify metafields map to which colorway fields. This makes the system adaptable to different product structures.

**Default Metafield Structure:**
```json
{
  "colorway_config": {
    "namespace": "custom",
    "key": "colorway_config",
    "type": "json",
    "description": "Colorway configuration for 3D model"
  },
  "upper_base_color": {
    "namespace": "custom",
    "key": "upper_base_color",
    "type": "single_line_text_field",
    "description": "Upper base color hex code"
  },
  "upper_has_splatter": {
    "namespace": "custom",
    "key": "upper_has_splatter",
    "type": "boolean",
    "description": "Whether upper has splatter effect"
  },
  "upper_splatter_color": {
    "namespace": "custom",
    "key": "upper_splatter_color",
    "type": "single_line_text_field",
    "description": "Upper splatter color hex code"
  },
  "sole_base_color": {
    "namespace": "custom",
    "key": "sole_base_color",
    "type": "single_line_text_field",
    "description": "Sole base color hex code"
  },
  "sole_has_splatter": {
    "namespace": "custom",
    "key": "sole_has_splatter",
    "type": "boolean",
    "description": "Whether sole has splatter effect"
  },
  "sole_splatter_color": {
    "namespace": "custom",
    "key": "sole_splatter_color",
    "type": "single_line_text_field",
    "description": "Sole splatter color hex code"
  },
  "lace_color": {
    "namespace": "custom",
    "key": "lace_color",
    "type": "single_line_text_field",
    "description": "Lace color hex code"
  }
}
```

**Metafield Mapping Configuration:**
The admin interface allows you to:
- Map any Shopify metafield to any colorway field
- Configure field types (color, boolean, number, text)
- Set default values
- Define validation rules
- Reorder fields for display

### 2.3 Set Up Inventory

1. **Enable Inventory Tracking:**
   - Go to each product variant
   - Enable "Track quantity"
   - Set initial inventory levels

2. **Configure Inventory Locations:**
   - Set up your warehouse location
   - Assign inventory to the location

## Phase 3: Gadget.dev API Development

### 3.1 Create API Actions

1. **Get Available Colorways:**
   ```javascript
   // actions/getColorways.js
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
         // All color fields
         upperBaseColor: true,
         upperHasSplatter: true,
         upperSplatterColor: true,
         soleBaseColor: true,
         soleHasSplatter: true,
         soleSplatterColor: true,
         laceColor: true,
         shopifyProductId: true,
         shopifyVariantId: true
       },
       sort: { name: "asc" }
     });

     return { colorways };
   }
   ```

2. **Sync Colorways from Shopify:**
   ```javascript
   // actions/syncColorwaysFromShopify.js
   export async function run({ params, api, logger }) {
     const { productId } = params;
     
     // Get product from Shopify
     const product = await api.shopify.product.findFirst({
       filter: { id: productId },
       select: {
         id: true,
         title: true,
         variants: {
           select: {
             id: true,
             title: true,
             inventoryQuantity: true,
             metafields: true
           }
         }
       }
     });

     if (!product) {
       throw new Error("Product not found");
     }

     // Get active metafield mappings
     const mappings = await api.metafieldMapping.findMany({
       filter: { isActive: true },
       sort: { displayOrder: "asc" }
     });

     const colorways = [];
     
     for (const variant of product.variants) {
       // Extract color configuration using mappings
       const colorConfig = extractColorConfig(variant.metafields, mappings);
       
       // Create or update colorway
       const colorway = await api.colorway.upsert({
         where: { shopifyVariantId: variant.id },
         create: {
           name: variant.title,
           description: `${product.title} - ${variant.title}`,
           isActive: variant.inventoryQuantity > 0,
           inventoryQuantity: variant.inventoryQuantity,
           shopifyProductId: product.id,
           shopifyVariantId: variant.id,
           ...colorConfig
         },
         update: {
           name: variant.title,
           description: `${product.title} - ${variant.title}`,
           isActive: variant.inventoryQuantity > 0,
           inventoryQuantity: variant.inventoryQuantity,
           ...colorConfig
         }
       });
       
       colorways.push(colorway);
     }

     return { colorways, synced: colorways.length };
   }

   function extractColorConfig(metafields, mappings) {
     const config = {};
     
     for (const mapping of mappings) {
       const metafield = metafields.find(m => 
         m.namespace === mapping.shopifyNamespace && 
         m.key === mapping.shopifyKey
       );
       
       if (metafield) {
         let value = metafield.value;
         
         // Convert value based on field type
         switch (mapping.fieldType) {
           case 'boolean':
             value = value === 'true' || value === true;
             break;
           case 'number':
             value = parseFloat(value) || 0;
             break;
           default:
             value = value || mapping.defaultValue;
         }
         
         config[mapping.colorwayField] = value;
       } else if (mapping.defaultValue) {
         config[mapping.colorwayField] = mapping.defaultValue;
       }
     }
     
     return config;
   }
   ```

3. **Save Design:**
   ```javascript
   // actions/saveDesign.js
   export async function run({ params, api, logger }) {
     const { 
       name, 
       description, 
       isPublic, 
       designData, 
       createdBy 
     } = params;
     
     // Generate unique share token
     const shareToken = generateShareToken();
     
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

   function generateShareToken() {
     return Math.random().toString(36).substring(2, 15) + 
            Math.random().toString(36).substring(2, 15);
   }
   ```

4. **Load Shared Design:**
   ```javascript
   // actions/loadSharedDesign.js
   export async function run({ params, api, logger }) {
     const { shareToken } = params;
     
     const design = await api.savedDesign.findFirst({
       filter: { shareToken },
       select: {
         id: true,
         name: true,
         description: true,
         isPublic: true,
         // All design fields
         colorwayId: true,
         logoUrl: true,
         logoColor1: true,
         logoColor2: true,
         logoColor3: true,
         // ... all other design fields
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

2. **Check Inventory:**
   ```javascript
   // actions/checkInventory.js
   export async function run({ params, api, logger }) {
     const { variantId, requestedQuantity } = params;
     
     const variant = await api.shopify.productVariant.findFirst({
       filter: { id: variantId },
       select: {
         id: true,
         inventoryQuantity: true,
         inventoryItem: {
           select: {
             inventoryLevels: {
               select: {
                 available: true
               }
             }
           }
         }
       }
     });

     const availableQuantity = variant.inventoryItem.inventoryLevels.reduce(
       (sum, level) => sum + level.available, 0
     );

     return {
       variantId,
       requestedQuantity,
       availableQuantity,
       canFulfill: requestedQuantity <= availableQuantity
     };
   }
   ```

3. **Create Draft Order:**
   ```javascript
   // actions/createDraftOrder.js
   export async function run({ params, api, logger }) {
     const { customerInfo, orderDetails } = params;
     
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

     // Prepare line items
     const lineItems = Object.entries(orderDetails.sizeQuantities)
       .filter(([size, quantity]) => quantity > 0)
       .map(([size, quantity]) => ({
         variantId: getVariantIdForSize(size),
         quantity: quantity
       }));

     // Create draft order
     const draftOrder = await api.shopify.draftOrder.create({
       customerId: customer.id,
       lineItems: lineItems,
       note: orderDetails.notes,
       tags: ["custom-shoes", "interactive-designer"],
       customAttributes: [{
         key: "color_configuration",
         value: JSON.stringify(orderDetails.colorConfiguration)
       }, {
         key: "model_screenshot",
         value: orderDetails.modelScreenshot
       }],
       reserveInventoryUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
     });

     return { draftOrder, customer };
   }
   ```

### 3.2 Set Up Webhooks

1. **Inventory Update Webhook:**
   ```javascript
   // webhooks/inventoryUpdate.js
   export async function run({ params, api, logger }) {
     const { inventoryItemId, locationId, available } = params;
     
     // Update your colorway availability
     await api.colorway.updateMany({
       filter: { shopifyVariantId: { contains: inventoryItemId } },
       updates: { isActive: available > 0 }
     });

     // Notify frontend of inventory changes
     // Implementation depends on your real-time solution
   }
   ```

## Phase 4: Frontend Integration

### 4.1 Install Dependencies

```bash
npm install @gadgetinc/react @gadgetinc/api-client
```

### 4.2 Configure Gadget Client

```typescript
// src/lib/gadget.ts
import { Client } from "@gadgetinc/api-client";

export const gadgetClient = new Client({
  environment: process.env.NODE_ENV === 'production' 
    ? 'Production' 
    : 'Development',
  authenticationMode: { apiKey: process.env.REACT_APP_GADGET_API_KEY }
});
```

### 4.3 Update Colorway Data Source

```typescript
// src/hooks/useColorways.ts
import { useState, useEffect } from 'react';
import { gadgetClient } from '@/lib/gadget';

export interface Colorway {
  id: string;
  name: string;
  inventoryQuantity: number;
  colorConfig: {
    upper: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string;
    };
    sole: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string;
    };
    laces: {
      color: string;
    };
  };
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

### 4.4 Update BuyButton Component

```typescript
// src/components/BuyButton.tsx (updated sections)

// Add new imports
import { gadgetClient } from '@/lib/gadget';
import { useColorways } from '@/hooks/useColorways';

// Update the component
export const BuyButton: React.FC<BuyButtonProps> = ({
  canvasRef,
  isDarkMode = false,
  getColorConfiguration
}) => {
  // ... existing state ...
  
  const { colorways, loading: colorwaysLoading } = useColorways();
  const [inventoryCheck, setInventoryCheck] = useState<{[key: string]: number}>({});
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);

  // Check inventory for selected sizes
  const checkInventory = async (sizeQuantities: SizeQuantity) => {
    const inventoryPromises = Object.entries(sizeQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(async ([size, quantity]) => {
        const variantId = getVariantIdForSize(size);
        const response = await gadgetClient.checkInventory({
          variantId,
          requestedQuantity: quantity
        });
        return { size, available: response.availableQuantity };
      });

    const results = await Promise.all(inventoryPromises);
    const inventoryMap = results.reduce((acc, { size, available }) => {
      acc[size] = available;
      return acc;
    }, {} as {[key: string]: number});

    setInventoryCheck(inventoryMap);
    return inventoryMap;
  };

  // Save design before creating order
  const saveDesign = async () => {
    try {
      const designData = {
        colorwayId: getCurrentColorwayId(),
        logoUrl: getCurrentLogoUrl(),
        logoColor1: getCurrentLogoColor1(),
        logoColor2: getCurrentLogoColor2(),
        logoColor3: getCurrentLogoColor3(),
        upperHasGradient: getCurrentUpperHasGradient(),
        upperGradientColor1: getCurrentUpperGradientColor1(),
        upperGradientColor2: getCurrentUpperGradientColor2(),
        soleHasGradient: getCurrentSoleHasGradient(),
        soleGradientColor1: getCurrentSoleGradientColor1(),
        soleGradientColor2: getCurrentSoleGradientColor2(),
        upperTexture: getCurrentUpperTexture(),
        soleTexture: getCurrentSoleTexture()
      };

      const response = await gadgetClient.saveDesign({
        name: `Custom Design - ${new Date().toLocaleDateString()}`,
        description: "Custom shoe design",
        isPublic: false,
        designData,
        createdBy: formData.email || 'anonymous'
      });

      setSavedDesignId(response.design.id);
      return response.design.id;
    } catch (error) {
      console.error('Error saving design:', error);
      return null;
    }
  };

  // Update handleSubmit
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
      const designId = await saveDesign();
      
      // Check inventory before creating order
      const inventory = await checkInventory(formData.sizeQuantities);
      
      // Validate quantities against available inventory
      const invalidSizes = Object.entries(formData.sizeQuantities)
        .filter(([size, quantity]) => quantity > (inventory[size] || 0));

      if (invalidSizes.length > 0) {
        toast({
          title: "Inventory Error",
          description: `Some sizes are not available in the requested quantities.`,
          variant: "destructive",
        });
        return;
      }

      // Prepare order data
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
          totalPairs: getTotalPairs(),
          totalPrice: getTotalPrice(),
          pricePerPair: PRICE_PER_PAIR,
          timestamp: new Date().toISOString(),
          modelScreenshot: screenshot,
          colorConfiguration: getColorInfo()
        },
        designId
      };

      // Create draft order via Gadget
      const response = await gadgetClient.createDraftOrder(orderData);

      toast({
        title: "Order Created!",
        description: `Draft order #${response.draftOrder.id} has been created. We'll contact you soon with payment details.`,
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

  // ... rest of component remains the same ...
};
```

### 4.5 Update ColorCustomizer Component

```typescript
// src/components/ColorCustomizer.tsx (updated sections)

import { useColorways } from '@/hooks/useColorways';

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  // ... existing props ...
}) => {
  const { colorways, loading } = useColorways();
  
  // Replace static colorwaysData with dynamic data
  const availableColorways = colorways.filter(colorway => 
    colorway.inventoryQuantity > 0
  );

  // ... rest of component logic ...
};
```

## Phase 5: Environment Configuration

### 5.1 Environment Variables

Create `.env.local`:

```env
REACT_APP_GADGET_API_KEY=your_gadget_api_key_here
REACT_APP_GADGET_ENVIRONMENT=Development
```

### 5.2 Production Configuration

Update `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.REACT_APP_GADGET_API_KEY': JSON.stringify(process.env.REACT_APP_GADGET_API_KEY),
    'process.env.REACT_APP_GADGET_ENVIRONMENT': JSON.stringify(process.env.REACT_APP_GADGET_ENVIRONMENT),
  },
});
```

## Phase 6: Testing & Deployment

### 6.1 Testing Checklist

- [ ] Colorways load from Shopify products
- [ ] Only available colorways are displayed
- [ ] Inventory quantities are accurate
- [ ] Draft orders are created successfully
- [ ] Customer information is captured
- [ ] Inventory is reserved during order creation
- [ ] Error handling works for out-of-stock items

### 6.2 Deployment Steps

1. **Deploy Gadget App:**
   - Push your Gadget app to production
   - Update Shopify app settings with production URLs

2. **Deploy Frontend:**
   - Update environment variables for production
   - Deploy to your hosting platform
   - Update Shopify app URLs

3. **Final Testing:**
   - Test the complete flow in production
   - Verify webhook connections
   - Test inventory updates

## Phase 7: Design Sharing & Management

### 7.1 Design Sharing Features

1. **Save Design:**
   - Users can save their custom designs
   - Designs include all color configurations, logos, and textures
   - Each design gets a unique share token

2. **Share Design:**
   - Generate shareable links with unique tokens
   - Public/private visibility controls
   - View tracking and analytics

3. **Load Shared Design:**
   - Users can open shared designs via URL
   - Exact recreation of original design
   - Option to modify and save as new design

### 7.2 Admin Interface for Design Management

1. **Design Gallery:**
   - View all saved designs
   - Filter by public/private status
   - Search and sort functionality

2. **Analytics Dashboard:**
   - Most popular designs
   - View counts and engagement
   - Design performance metrics

## Phase 8: Color Management UI

### 8.1 Admin Colorway Editor

1. **Visual Color Editor:**
   - Color picker interface for all color fields
   - Real-time preview of changes
   - Bulk edit capabilities

2. **Metafield Mapping Interface:**
   - Drag-and-drop field mapping
   - Visual configuration of Shopify metafields
   - Field type validation and conversion

3. **Sync Management:**
   - One-click sync from Shopify
   - Conflict resolution for updates
   - Batch operations for multiple products

### 8.2 Frontend Design Sharing

1. **Save Design Component:**
   ```typescript
   // src/components/SaveDesignButton.tsx
   export const SaveDesignButton: React.FC<SaveDesignButtonProps> = ({
     designData,
     onSave
   }) => {
     const [isOpen, setIsOpen] = useState(false);
     const [designName, setDesignName] = useState('');
     const [isPublic, setIsPublic] = useState(false);

     const handleSave = async () => {
       try {
         const response = await gadgetClient.saveDesign({
           name: designName,
           description: "Custom shoe design",
           isPublic,
           designData,
           createdBy: 'current-user'
         });

         onSave(response.design);
         setIsOpen(false);
       } catch (error) {
         console.error('Error saving design:', error);
       }
     };

     return (
       <Dialog open={isOpen} onOpenChange={setIsOpen}>
         <DialogTrigger asChild>
           <Button>Save Design</Button>
         </DialogTrigger>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Save Your Design</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <Input
               placeholder="Design name"
               value={designName}
               onChange={(e) => setDesignName(e.target.value)}
             />
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="public"
                 checked={isPublic}
                 onCheckedChange={setIsPublic}
               />
               <Label htmlFor="public">Make this design public</Label>
             </div>
             <Button onClick={handleSave} disabled={!designName}>
               Save Design
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     );
   };
   ```

2. **Share Design Component:**
   ```typescript
   // src/components/ShareDesignButton.tsx
   export const ShareDesignButton: React.FC<ShareDesignButtonProps> = ({
     designId,
     shareToken
   }) => {
     const [copied, setCopied] = useState(false);
     const shareUrl = `${window.location.origin}/design/${shareToken}`;

     const copyToClipboard = async () => {
       try {
         await navigator.clipboard.writeText(shareUrl);
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
       } catch (error) {
         console.error('Failed to copy:', error);
       }
     };

     return (
       <div className="flex items-center space-x-2">
         <Input value={shareUrl} readOnly className="flex-1" />
         <Button onClick={copyToClipboard}>
           {copied ? 'Copied!' : 'Copy Link'}
         </Button>
       </div>
     );
   };
   ```

3. **Load Shared Design Hook:**
   ```typescript
   // src/hooks/useSharedDesign.ts
   export const useSharedDesign = (shareToken: string) => {
     const [design, setDesign] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
       const loadDesign = async () => {
         try {
           setLoading(true);
           const response = await gadgetClient.loadSharedDesign({ shareToken });
           setDesign(response.design);
         } catch (err) {
           setError('Design not found or not public');
         } finally {
           setLoading(false);
         }
       };

       if (shareToken) {
         loadDesign();
       }
     }, [shareToken]);

     return { design, loading, error };
   };
   ```

## Phase 9: Monitoring & Maintenance

### 9.1 Set Up Monitoring

1. **Gadget Dashboard:**
   - Monitor API usage
   - Check error logs
   - Track performance metrics

2. **Shopify Analytics:**
   - Monitor draft order creation
   - Track inventory levels
   - Analyze customer behavior

3. **Design Analytics:**
   - Track design saves and shares
   - Monitor popular color combinations
   - Analyze user engagement

### 9.2 Maintenance Tasks

1. **Regular Updates:**
   - Update product variants in Shopify
   - Sync new colorways
   - Monitor inventory levels

2. **Error Handling:**
   - Set up alerts for API failures
   - Monitor webhook delivery
   - Track order completion rates

3. **Design Management:**
   - Clean up old/inactive designs
   - Monitor design performance
   - Update popular design recommendations

## Troubleshooting

### Common Issues

1. **Colorways not loading:**
   - Check Gadget API key
   - Verify Shopify connection
   - Check product metafields

2. **Inventory not updating:**
   - Verify webhook configuration
   - Check inventory tracking settings
   - Monitor webhook delivery

3. **Draft orders failing:**
   - Check Shopify permissions
   - Verify customer data format
   - Check variant IDs

### Support Resources

- [Gadget.dev Documentation](https://docs.gadget.dev)
- [Shopify API Documentation](https://shopify.dev/docs)
- [Gadget Community](https://community.gadget.dev)

## Conclusion

This integration provides a robust foundation for managing your custom shoe business through Shopify while maintaining the interactive design experience. The system ensures inventory accuracy, proper order management, and a seamless customer experience.

Remember to test thoroughly in a development environment before deploying to production, and monitor the system closely during the initial launch period.
