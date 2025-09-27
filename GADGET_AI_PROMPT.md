# Gadget.dev AI Prompt for Kickview Interactive Shoes Backend

## Project Overview
Create a Shopify-integrated backend for a custom shoe design application that allows users to:
1. Design custom shoes with color combinations, splatter effects, and logos
2. Create draft orders with inventory management
3. Save and share custom designs
4. Manage colorways through a flexible admin interface

## Core Requirements

### 1. Shopify Integration
- Connect to Shopify with full product, variant, and inventory access
- Sync products and variants automatically
- Handle draft order creation with inventory reservation
- Support customer creation and management

### 2. Data Models

#### Colorway Model
```javascript
model Colorway {
  fields {
    name: String
    description: String
    isActive: Boolean
    
    // Color configuration
    upperBaseColor: String
    upperHasSplatter: Boolean
    upperSplatterColor: String
    upperSplatterBaseColor: String
    upperSplatterColor2: String
    upperUseDualSplatter: Boolean
    upperPaintDensity: Number
    
    soleBaseColor: String
    soleHasSplatter: Boolean
    soleSplatterColor: String
    soleSplatterBaseColor: String
    soleSplatterColor2: String
    soleUseDualSplatter: Boolean
    solePaintDensity: Number
    
    laceColor: String
    
    // Shopify integration
    shopifyProductId: String
    shopifyVariantId: String
    inventoryQuantity: Number
    
    // Metadata mapping configuration
    metafieldMappings: JSON // Flexible field mapping
  }
}
```

#### SavedDesign Model
```javascript
model SavedDesign {
  fields {
    name: String
    description: String
    shareToken: String // Unique token for sharing
    isPublic: Boolean
    
    // Design configuration
    colorwayId: String
    logoUrl: String
    logoColor1: String
    logoColor2: String
    logoColor3: String
    
    // Additional customization
    upperHasGradient: Boolean
    upperGradientColor1: String
    upperGradientColor2: String
    soleHasGradient: Boolean
    soleGradientColor1: String
    soleGradientColor2: String
    
    upperTexture: String
    soleTexture: String
    
    // Metadata
    createdBy: String // User identifier
    viewCount: Number
    lastViewedAt: DateTime
    
    // Shopify integration
    shopifyDraftOrderId: String
    orderStatus: String // 'draft', 'pending', 'completed'
  }
}
```

#### MetafieldMapping Model
```javascript
model MetafieldMapping {
  fields {
    name: String
    description: String
    isActive: Boolean
    
    // Mapping configuration
    shopifyNamespace: String
    shopifyKey: String
    colorwayField: String // Which colorway field this maps to
    fieldType: String // 'color', 'boolean', 'number', 'text'
    
    // UI configuration
    displayName: String
    displayOrder: Number
    isRequired: Boolean
    defaultValue: String
  }
}
```

#### OrderConfiguration Model
```javascript
model OrderConfiguration {
  fields {
    // Customer information
    customerInfo: JSON
    
    // Order details
    sizeQuantities: JSON
    totalPairs: Number
    totalPrice: Number
    pricePerPair: Number
    
    // Design data
    designId: String // Reference to SavedDesign
    modelScreenshot: String
    colorConfiguration: JSON
    
    // Status tracking
    status: String // 'draft', 'pending', 'completed', 'cancelled'
    shopifyDraftOrderId: String
    shopifyOrderId: String
    
    // Timestamps
    createdAt: DateTime
    updatedAt: DateTime
    expiresAt: DateTime // For draft orders
  }
}
```

### 3. API Actions

#### Get Available Colorways
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
      // ... all other color fields
      shopifyProductId: true,
      shopifyVariantId: true
    },
    sort: { name: "asc" }
  });

  return { colorways };
}
```

#### Sync Colorways from Shopify
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

#### Save Design
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

#### Load Shared Design
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

#### Create Draft Order
```javascript
// actions/createDraftOrder.js
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
```

### 4. Admin Interface Requirements

#### Colorway Management
- List all colorways with search and filter
- Edit color values with color picker UI
- Bulk edit multiple colorways
- Sync from Shopify products
- Preview colorway combinations

#### Metafield Mapping Configuration
- Visual interface to map Shopify metafields to colorway fields
- Support for different field types (color, boolean, number, text)
- Default value configuration
- Field validation rules

#### Design Management
- List saved designs
- View design details and preview
- Manage public/private status
- Analytics on popular designs

### 5. Webhooks

#### Inventory Update Webhook
```javascript
// webhooks/inventoryUpdate.js
export async function run({ params, api, logger }) {
  const { inventoryItemId, locationId, available } = params;
  
  // Update colorway availability
  await api.colorway.updateMany({
    filter: { shopifyVariantId: { contains: inventoryItemId } },
    updates: { 
      inventoryQuantity: available,
      isActive: available > 0 
    }
  });
}
```

#### Product Update Webhook
```javascript
// webhooks/productUpdate.js
export async function run({ params, api, logger }) {
  const { productId } = params;
  
  // Re-sync colorways for this product
  await api.syncColorwaysFromShopify({ productId });
}
```

### 6. Frontend Integration Points

#### API Endpoints Needed
- `GET /api/colorways` - Get available colorways
- `GET /api/colorways/:id` - Get specific colorway
- `POST /api/designs/save` - Save a design
- `GET /api/designs/share/:token` - Load shared design
- `POST /api/orders/create` - Create draft order
- `GET /api/inventory/check` - Check inventory levels

#### Real-time Updates
- WebSocket connection for inventory updates
- Real-time colorway availability changes
- Order status updates

### 7. Security & Permissions

#### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration for frontend domain
- API key authentication for frontend

#### Data Privacy
- Secure handling of customer information
- GDPR compliance for EU customers
- Data retention policies
- Secure file upload for screenshots

### 8. Performance Requirements

#### Caching
- Redis cache for frequently accessed colorways
- CDN for static assets
- Database query optimization

#### Scalability
- Horizontal scaling support
- Database connection pooling
- Background job processing for heavy operations

### 9. Monitoring & Analytics

#### Metrics to Track
- Colorway popularity
- Design save/share rates
- Order conversion rates
- API performance metrics
- Error rates and types

#### Logging
- Structured logging for all operations
- Error tracking and alerting
- Performance monitoring
- User behavior analytics

### 10. Testing Requirements

#### Unit Tests
- All API actions
- Data model validations
- Utility functions

#### Integration Tests
- Shopify API integration
- Webhook handling
- End-to-end order flow

#### Load Testing
- API performance under load
- Database performance
- Shopify API rate limits

## Implementation Notes

1. **Flexible Metafield Mapping**: The system should allow users to configure which Shopify metafields map to which colorway fields, making it adaptable to different product structures.

2. **Color Management UI**: Provide an intuitive interface for editing color values with color pickers, making it easy to update colorways without touching Shopify directly.

3. **Design Sharing**: Implement a robust sharing system with unique tokens, view tracking, and privacy controls.

4. **Inventory Management**: Real-time inventory tracking with automatic updates when stock changes in Shopify.

5. **Error Handling**: Comprehensive error handling with user-friendly messages and proper logging.

6. **Performance**: Optimize for fast loading times and smooth user experience.

## Expected Deliverables

1. Complete Gadget application with all models and actions
2. Admin interface for managing colorways and mappings
3. API documentation
4. Deployment configuration
5. Testing suite
6. Monitoring setup

This backend should provide a solid foundation for the interactive shoe design application while maintaining flexibility and scalability.
