# Gadget.dev AI Prompt for KANE Footwear Interactive Shoes Backend

## Project Overview
Create a comprehensive Shopify-integrated backend for a custom shoe design application that allows users to:
1. Design custom shoes with color combinations, splatter effects, gradients, textures, and logos
2. Create draft orders with inventory management and size selection
3. Save and share custom designs with unique tokens
4. Manage colorways through a flexible admin interface with metafield mapping
5. Support school/team customization with logo uploads
6. Handle complex color configurations including dual splatter effects

## Core Requirements

### 1. Shopify Integration
- Connect to Shopify with full product, variant, and inventory access
- Sync products and variants automatically with flexible metafield mapping
- Handle draft order creation with inventory reservation
- Support customer creation and management
- Real-time inventory updates via webhooks
- Support for custom metafields to store color configurations

### 2. Data Models

#### Colorway Model
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

#### SavedDesign Model
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

#### MetafieldMapping Model
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

#### OrderConfiguration Model
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

#### School Model (for School Selector)
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

#### Size Configuration
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

2. **Color Management UI**: Provide an intuitive interface for editing color values with color pickers, making it easy to update colorways without touching having to go into each product indivudally in shopify.

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

## AI Prompt for Gadget.dev

**Copy and paste this prompt into Gadget.dev's AI assistant when creating your app:**

---

Create a comprehensive Shopify-integrated backend for a custom shoe design application called "KANE Footwear Interactive Shoes". This application allows users to design custom shoes with complex color configurations, save and share designs, and create draft orders through Shopify.

**Core Requirements:**
1. **Shopify Integration**: Full product, variant, and inventory management with custom metafield mapping
2. **Complex Color System**: Support for base colors, splatter effects (including dual splatter), gradients, textures, and lace colors
3. **Logo System**: Support for uploaded logos with 3 separate color channels and 3D positioning
4. **Design Management**: Save, share, and load custom designs with unique tokens
5. **Order Processing**: Create draft orders with size selection and inventory management
6. **School/Team Support**: Manage school data with logos and colors

**Data Models Needed:**

**Colorway Model** - Store shoe color configurations:
- Basic info: id, name, description, isActive
- Upper colors: upperBaseColor, upperHasSplatter, upperSplatterColor, upperSplatterBaseColor, upperSplatterColor2, upperUseDualSplatter, upperPaintDensity
- Sole colors: soleBaseColor, soleHasSplatter, soleSplatterColor, soleSplatterBaseColor, soleSplatterColor2, soleUseDualSplatter, solePaintDensity
- Lace color: laceColor
- Advanced: upperHasGradient, upperGradientColor1, upperGradientColor2, soleHasGradient, soleGradientColor1, soleGradientColor2
- Textures: upperTexture, soleTexture
- Shopify: shopifyProductId, shopifyVariantId, inventoryQuantity
- Timestamps: createdAt, updatedAt

**SavedDesign Model** - Store user designs:
- Basic: id, name, description, shareToken, isPublic
- Design: colorwayId
- Logo: logoUrl, logoColor1, logoColor2, logoColor3, logoPosition, logoRotation, logoScale, circleLogoUrl
- Advanced: upperHasGradient, upperGradientColor1, upperGradientColor2, soleHasGradient, soleGradientColor1, soleGradientColor2, upperTexture, soleTexture
- User: createdBy, viewCount, lastViewedAt
- Order: shopifyDraftOrderId, orderStatus
- Timestamps: createdAt, updatedAt

**OrderConfiguration Model** - Store order data:
- Customer: customerInfo (JSON with firstName, lastName, email, phone, address, notes)
- Order: sizeQuantities (JSON with M3-M11, W5-W11), totalPairs, totalPrice, pricePerPair
- Design: designId, modelScreenshot, colorConfiguration
- Status: status, shopifyDraftOrderId, shopifyOrderId
- Timestamps: createdAt, updatedAt, expiresAt

**MetafieldMapping Model** - Map Shopify metafields to colorway fields:
- Basic: id, name, description, isActive
- Shopify: shopifyNamespace, shopifyKey, shopifyMetafieldType
- Mapping: colorwayField, fieldType
- UI: displayName, displayOrder, isRequired, defaultValue
- Validation: validationPattern, minValue, maxValue
- Timestamps: createdAt, updatedAt

**School Model** - Store school/team data:
- Basic: id, name, shortName, city, state, country
- Visual: primaryColor, secondaryColor, logoUrl
- Status: isActive
- Timestamps: createdAt, updatedAt

**Required API Actions:**
1. `getColorways` - Get available colorways with filtering
2. `syncColorwaysFromShopify` - Sync colorways from Shopify products using metafield mappings
3. `saveDesign` - Save a custom design with unique share token
4. `loadSharedDesign` - Load a shared design by token
5. `createDraftOrder` - Create Shopify draft order with customer and design data
6. `checkInventory` - Check inventory levels for specific variants
7. `updateColorway` - Update colorway configuration
8. `getSchools` - Get available schools for selection

**Key Features:**
- Flexible metafield mapping system for Shopify integration
- Support for complex color configurations including dual splatter effects
- Design sharing with unique tokens and view tracking
- Real-time inventory management
- Comprehensive order processing with size selection
- School/team customization support

**Size Configuration:**
- Men's sizes: M3, M4, M5, M6, M7, M8, M9, M10, M11
- Women's sizes: W5, W6, W7, W8, W9, W10, W11
- Each size maps to a specific Shopify variant ID

**Color Configuration Structure:**
The system supports complex color configurations with:
- Base colors for upper, sole, and laces
- Splatter effects with primary and secondary colors
- Dual splatter support for advanced effects
- Gradient effects for upper and sole
- Texture support for custom materials
- Logo customization with 3 color channels
- 3D positioning for logos

Create a robust, scalable backend that can handle high traffic and complex color configurations while maintaining data integrity and providing excellent performance.

---

This backend should provide a solid foundation for the interactive shoe design application while maintaining flexibility and scalability.
