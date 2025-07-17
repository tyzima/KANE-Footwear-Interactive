# Design Document

## Overview

This design outlines the integration of Shopify's checkout system with the 3D shoe customizer. The solution enables users to seamlessly transition from customizing their shoes to purchasing them through a secure, Shopify-powered e-commerce flow. The design focuses on capturing customization data, managing product variants, real-time pricing, cart management, and order fulfillment integration.

## Architecture

### Component Structure

```
ShoeViewer (Enhanced with Commerce)
├── Canvas (Existing 3D viewer)
├── ColorCustomizer (Existing)
├── PricingDisplay (New)
├── AddToCartButton (New)
└── CartSummary (New)

ShopifyIntegration (New Service Layer)
├── ProductVariantManager
├── CustomizationEncoder
├── PricingCalculator
└── CartManager

CheckoutFlow (New)
├── CartDrawer
├── CustomizationSummary
└── ShopifyCheckoutRedirect
```

### Integration Points

1. **Customization Capture**: Real-time encoding of user customizations into Shopify-compatible product variants
2. **Pricing Engine**: Dynamic price calculation based on base price and customization fees
3. **Cart Management**: Shopify Storefront API integration for cart operations
4. **Checkout Flow**: Seamless redirect to Shopify's hosted checkout
5. **Order Processing**: Webhook integration for order fulfillment data

## Components and Interfaces

### Enhanced ShoeViewer Component

```typescript
interface ShoeViewerProps {
  className?: string;
  productId: string; // Shopify product ID
  basePrice: number;
  onPriceChange?: (price: number) => void;
}

interface CustomizationState {
  upperColor: string;
  soleColor: string;
  upperHasSplatter: boolean;
  soleHasSplatter: boolean;
  upperSplatterColor: string;
  soleSplatterColor: string;
  upperPaintDensity: number;
  solePaintDensity: number;
  upperHasGradient: boolean;
  soleHasGradient: boolean;
  upperGradientColor1: string;
  upperGradientColor2: string;
  soleGradientColor1: string;
  soleGradientColor2: string;
}
```

### New PricingDisplay Component

```typescript
interface PricingDisplayProps {
  basePrice: number;
  customizationFees: CustomizationFees;
  totalPrice: number;
  currency: string;
  loading?: boolean;
}

interface CustomizationFees {
  premiumColors: number;
  splatterEffect: number;
  gradientEffect: number;
  total: number;
}
```

### New AddToCartButton Component

```typescript
interface AddToCartButtonProps {
  productId: string;
  customization: CustomizationState;
  price: number;
  onAddToCart: (cartItem: CartItem) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  customization: CustomizationState;
  price: number;
  title: string;
  image: string;
}
```

### New CartDrawer Component

```typescript
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onEditCustomization: (item: CartItem) => void;
  onCheckout: () => void;
  loading?: boolean;
}
```

### ShopifyIntegration Service

```typescript
class ShopifyIntegrationService {
  private storefrontClient: StorefrontClient;
  private adminClient?: AdminClient;

  // Product and variant management
  async getProduct(productId: string): Promise<ShopifyProduct>;
  async createCustomVariant(customization: CustomizationState): Promise<string>;
  
  // Cart operations
  async createCart(): Promise<string>;
  async addToCart(cartId: string, items: CartLineInput[]): Promise<Cart>;
  async updateCartLines(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart>;
  async removeFromCart(cartId: string, lineIds: string[]): Promise<Cart>;
  
  // Checkout
  async getCheckoutUrl(cartId: string): Promise<string>;
  
  // Pricing
  calculateCustomizationFees(customization: CustomizationState): CustomizationFees;
}
```

### CustomizationEncoder Service

```typescript
class CustomizationEncoder {
  // Encode customization state into Shopify metafields
  encodeCustomization(customization: CustomizationState): ShopifyMetafield[];
  
  // Decode customization from Shopify metafields
  decodeCustomization(metafields: ShopifyMetafield[]): CustomizationState;
  
  // Generate unique variant SKU based on customization
  generateVariantSku(baseProductId: string, customization: CustomizationState): string;
  
  // Create human-readable customization summary
  generateCustomizationSummary(customization: CustomizationState): string;
}
```

## Data Models

### Shopify Product Configuration

```typescript
interface ShopifyProductConfig {
  productId: string;
  handle: string;
  title: string;
  basePrice: number;
  currency: string;
  images: string[];
  customizationOptions: {
    colors: ColorOption[];
    effects: EffectOption[];
    pricing: PricingRules;
  };
}

interface ColorOption {
  name: string;
  value: string;
  premiumPrice?: number;
  available: boolean;
}

interface EffectOption {
  type: 'splatter' | 'gradient';
  name: string;
  price: number;
  available: boolean;
}

interface PricingRules {
  premiumColorFee: number;
  splatterEffectFee: number;
  gradientEffectFee: number;
  complexCustomizationFee: number; // When multiple effects are combined
}
```

### Cart State Management

```typescript
interface CartState {
  cartId: string | null;
  items: CartItem[];
  totalPrice: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
}

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  quantity: number;
  price: number;
  customization: CustomizationState;
  customizationSummary: string;
  thumbnailUrl: string;
  sku: string;
}
```

### Shopify Integration Models

```typescript
interface ShopifyStorefrontConfig {
  domain: string;
  storefrontAccessToken: string;
  apiVersion: string;
}

interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: 'single_line_text_field' | 'json' | 'number_integer' | 'number_decimal';
}

interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{
    key: string;
    value: string;
  }>;
}
```

## Error Handling

### Shopify API Errors
- Network connectivity issues with graceful retry logic
- Rate limiting handling with exponential backoff
- Invalid product/variant ID error handling
- Cart session expiration management

### Customization Validation
- Color availability validation before adding to cart
- Price calculation error handling
- Customization encoding/decoding error recovery
- Invalid customization state detection

### Checkout Flow Errors
- Cart creation failures with user notification
- Checkout URL generation errors
- Payment processing error communication
- Order confirmation handling

## Testing Strategy

### Integration Testing
- Shopify Storefront API connectivity testing
- Cart operations end-to-end testing
- Checkout flow validation
- Webhook integration testing

### Customization Testing
- All customization combinations pricing validation
- Customization encoding/decoding accuracy
- Cart persistence across browser sessions
- Mobile checkout flow testing

### Performance Testing
- API response time monitoring
- Cart operations performance benchmarking
- Large cart handling (multiple customized items)
- Concurrent user cart management

### User Experience Testing
- Customization-to-purchase flow usability
- Cart management interface testing
- Mobile responsiveness validation
- Error state user experience

## Implementation Phases

### Phase 1: Core Shopify Integration
- Set up Shopify Storefront API client
- Implement basic product fetching
- Create customization encoding system
- Basic pricing calculation engine

### Phase 2: Cart Management
- Implement cart creation and management
- Add to cart functionality
- Cart persistence and session management
- Cart item customization display

### Phase 3: Pricing and Variants
- Dynamic pricing calculation
- Real-time price updates
- Premium customization fee handling
- Variant generation for custom products

### Phase 4: Checkout Flow
- Cart drawer/summary interface
- Customization review and editing
- Shopify checkout redirect
- Order confirmation handling

### Phase 5: Advanced Features
- Analytics integration
- Inventory management
- Bulk customization options
- Admin dashboard integration

## Technical Considerations

### Shopify API Limitations
- Storefront API rate limits (1000 requests per minute)
- Product variant limits (100 variants per product)
- Metafield storage limitations
- Cart session duration (30 days)

### Performance Optimization
- Implement GraphQL query optimization
- Cache product and pricing data
- Lazy load cart operations
- Optimize customization encoding

### Security Considerations
- Secure storage of Shopify access tokens
- Input validation for all customization data
- HTTPS enforcement for all API calls
- PCI compliance for payment processing

### Mobile Considerations
- Touch-optimized cart interface
- Mobile-responsive checkout flow
- Offline cart persistence
- Progressive web app capabilities

## Shopify Configuration Requirements

### Product Setup
- Create base shoe product in Shopify admin
- Configure product metafields for customization data
- Set up product images and descriptions
- Configure inventory tracking

### Storefront API Setup
- Generate Storefront API access token
- Configure API permissions for cart operations
- Set up webhook endpoints for order processing
- Configure checkout domain settings

### Pricing Configuration
- Set base product pricing
- Configure customization fee structure
- Set up tax and shipping calculations
- Configure currency and regional pricing

## Analytics and Tracking

### Customization Analytics
- Track popular color combinations
- Monitor customization completion rates
- Analyze pricing impact on conversions
- Track cart abandonment patterns

### Business Intelligence
- Revenue breakdown by customization type
- Customer lifetime value analysis
- Seasonal customization trends
- Geographic customization preferences

### Performance Metrics
- API response time monitoring
- Cart operation success rates
- Checkout completion rates
- Error rate tracking and alerting