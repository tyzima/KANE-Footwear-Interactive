// Shopify Cart Integration Utilities
// Handles cart URL construction with custom properties for design data

export interface DesignData {
  // Colorway info
  colorwayName: string;
  colorwayId: string;
  
  // Colors
  upperColor: string;
  soleColor: string;
  laceColor: string;
  
  // Splatter
  upperHasSplatter: boolean;
  upperSplatterColor?: string;
  upperSplatterColor2?: string;
  upperUseDualSplatter?: boolean;
  soleHasSplatter: boolean;
  soleSplatterColor?: string;
  soleSplatterColor2?: string;
  soleUseDualSplatter?: boolean;
  
  // Logos
  logoUrl?: string;
  circleLogoUrl?: string;
  logoColor1?: string;
  logoColor2?: string;
  logoColor3?: string;
  
  // Design context
  screenshot?: string;
  notes?: string;
  designId?: string;
  timestamp?: string;
}

export interface SizeQuantities {
  [size: string]: number;
}

export interface ColorwayVariants {
  [size: string]: string; // size -> variant ID mapping
}

/**
 * Build Shopify cart URL with line items and custom properties
 */
export const buildCartUrl = (
  shopDomain: string,
  sizeQuantities: SizeQuantities,
  colorwayVariants: ColorwayVariants,
  designData: DesignData
): string => {
  console.log('Building cart URL:', { shopDomain, sizeQuantities, colorwayVariants, designData });
  
  // Build line items using Shopify cart permalink format: VARIANT_ID:QUANTITY
  console.log('Available variant mappings:', Object.keys(colorwayVariants));
  console.log('Requested sizes:', Object.keys(sizeQuantities).filter(size => sizeQuantities[size] > 0));
  
  const lineItems = Object.entries(sizeQuantities)
    .filter(([size, qty]) => qty > 0)
    .map(([size, qty]) => {
      const variantId = colorwayVariants[size];
      console.log(`Looking for size ${size}: found variant ID ${variantId}`);
      if (!variantId) {
        console.warn(`No variant ID found for size ${size}`);
        console.warn('Available sizes:', Object.keys(colorwayVariants));
        return null;
      }
      return `${variantId}:${qty}`; // Shopify cart permalink format
    })
    .filter(Boolean)
    .join(','); // Multiple items separated by commas

  if (!lineItems) {
    throw new Error('No valid line items to add to cart');
  }

  // Build custom properties for cart permalink
  const properties = buildCartProperties(designData);
  
  // Construct Shopify cart permalink URL (correct format)
  const baseUrl = `https://${shopDomain}/cart`;
  let cartUrl = `${baseUrl}/${lineItems}`;
  
  // Add properties as query parameters if any
  if (properties.length > 0) {
    cartUrl += `?${properties.join('&')}`;
  }
  
  console.log('Generated cart permalink:', cartUrl);
  return cartUrl;
};

/**
 * Build cart properties array from design data for cart permalinks
 * Note: Shopify cart permalinks use different property format than cart/add URLs
 */
const buildCartProperties = (designData: DesignData): string[] => {
  const properties: string[] = [];
  
  // For cart permalinks, we'll use attributes instead of properties
  // Essential design properties
  if (designData.colorwayName) {
    properties.push(`attributes[Colorway]=${encodeURIComponent(designData.colorwayName)}`);
  }
  
  if (designData.upperColor) {
    properties.push(`attributes[Upper Color]=${encodeURIComponent(designData.upperColor)}`);
  }
  
  if (designData.soleColor) {
    properties.push(`attributes[Sole Color]=${encodeURIComponent(designData.soleColor)}`);
  }
  
  if (designData.laceColor) {
    properties.push(`attributes[Lace Color]=${encodeURIComponent(designData.laceColor)}`);
  }
  
  // Splatter properties
  if (designData.upperHasSplatter && designData.upperSplatterColor) {
    const splatterInfo = designData.upperUseDualSplatter && designData.upperSplatterColor2
      ? `${designData.upperSplatterColor} + ${designData.upperSplatterColor2}`
      : designData.upperSplatterColor;
    properties.push(`attributes[Upper Splatter]=${encodeURIComponent(splatterInfo)}`);
  }
  
  if (designData.soleHasSplatter && designData.soleSplatterColor) {
    const splatterInfo = designData.soleUseDualSplatter && designData.soleSplatterColor2
      ? `${designData.soleSplatterColor} + ${designData.soleSplatterColor2}`
      : designData.soleSplatterColor;
    properties.push(`attributes[Sole Splatter]=${encodeURIComponent(splatterInfo)}`);
  }
  
  // Logo properties
  if (designData.logoUrl) {
    properties.push(`attributes[Side Logo]=${encodeURIComponent('Custom Logo Uploaded')}`);
  }
  
  if (designData.circleLogoUrl) {
    properties.push(`attributes[Back Logo]=${encodeURIComponent('Custom Logo Uploaded')}`);
  }
  
  // Logo colors (if logos are present)
  if ((designData.logoUrl || designData.circleLogoUrl) && designData.logoColor1) {
    const logoColors = [
      designData.logoColor1,
      designData.logoColor2,
      designData.logoColor3
    ].filter(Boolean).join(', ');
    properties.push(`attributes[Logo Colors]=${encodeURIComponent(logoColors)}`);
  }
  
  // Design reference
  if (designData.designId) {
    properties.push(`attributes[Design ID]=${encodeURIComponent(designData.designId)}`);
  }
  
  // Customer notes
  if (designData.notes) {
    // Truncate notes to fit in property value limit
    const truncatedNotes = designData.notes.length > 200 
      ? designData.notes.substring(0, 200) + '...'
      : designData.notes;
    properties.push(`attributes[Special Notes]=${encodeURIComponent(truncatedNotes)}`);
  }
  
  // Timestamp
  if (designData.timestamp) {
    properties.push(`attributes[Design Created]=${encodeURIComponent(designData.timestamp)}`);
  }
  
  console.log('Generated cart properties:', properties);
  return properties;
};

/**
 * Extract variant IDs from Shopify product data for size mapping
 */
export const extractVariantMapping = (product: any): ColorwayVariants => {
  const variants: ColorwayVariants = {};
  
  if (!product?.variants) {
    console.warn('No variants found in product data');
    return variants;
  }
  
  product.variants.forEach((variant: any) => {
    // Extract size from variant title, SKU, or option values
    const size = extractSizeFromVariant(variant);
    if (size && variant.id) {
      // Use the variant ID as-is (might be numeric or GraphQL format)
      let variantId = variant.id.toString();
      
      // If it's a GraphQL ID, extract just the numeric part for cart URLs
      if (variantId.startsWith('gid://shopify/ProductVariant/')) {
        variantId = variantId.replace('gid://shopify/ProductVariant/', '');
      }
      
      console.log('Processing variant:', { originalId: variant.id, cleanedId: variantId });
      
      // Handle combined sizes like "M3 / W5" by creating mappings for both
      if (size.includes(' / ')) {
        const [mensSize, womensSize] = size.split(' / ');
        variants[mensSize.trim()] = variantId;
        variants[womensSize.trim()] = variantId;
      } else {
        variants[size] = variantId;
      }
    }
  });
  
  console.log('Extracted variant mapping:', variants);
  return variants;
};

/**
 * Extract size from variant data
 */
const extractSizeFromVariant = (variant: any): string | null => {
  // Check if size is in variant options
  if (variant.selectedOptions) {
    const sizeOption = variant.selectedOptions.find((option: any) => 
      option.name.toLowerCase() === 'size'
    );
    if (sizeOption?.value) {
      // Return the raw size value (e.g., "M3 / W5") without formatting
      // The extractVariantMapping function will handle splitting combined sizes
      return sizeOption.value;
    }
  }
  
  // Check variant title (e.g., "Men's 10", "Women's 8", "M10", "W8")
  if (variant.title) {
    const sizeMatch = variant.title.match(/(?:Men's|M)\s*(\d+(?:\.\d+)?)|(?:Women's|W)\s*(\d+(?:\.\d+)?)/i);
    if (sizeMatch) {
      const mensSize = sizeMatch[1];
      const womensSize = sizeMatch[2];
      
      if (mensSize) return `M${mensSize}`;
      if (womensSize) return `W${womensSize}`;
    }
  }
  
  // Check SKU
  if (variant.sku) {
    const skuMatch = variant.sku.match(/(?:M|MENS?)[-_]?(\d+(?:\.\d+)?)|(?:W|WOMENS?)[-_]?(\d+(?:\.\d+)?)/i);
    if (skuMatch) {
      const mensSize = skuMatch[1];
      const womensSize = skuMatch[2];
      
      if (mensSize) return `M${mensSize}`;
      if (womensSize) return `W${womensSize}`;
    }
  }
  
  console.warn('Could not extract size from variant:', variant);
  return null;
};

/**
 * Format size to consistent format (M10, W8, etc.)
 */
const formatSize = (size: string): string => {
  // If already formatted, return as-is
  if (/^[MW]\d+/.test(size)) {
    return size;
  }
  
  // Try to determine gender and format
  const numMatch = size.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const num = numMatch[1];
    // Default to men's sizing if no gender specified
    return `M${num}`;
  }
  
  return size;
};

/**
 * Validate cart URL length (browsers have URL length limits)
 */
export const validateCartUrl = (url: string): { isValid: boolean; length: number; maxLength: number } => {
  const maxLength = 2048; // Conservative browser URL limit
  return {
    isValid: url.length <= maxLength,
    length: url.length,
    maxLength
  };
};
