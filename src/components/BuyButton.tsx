import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Send, Plus, Minus, X, User, MessageSquare, Check, MapPin, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { ExpandingButton } from '@/components/ExpandingButton';
import { useShopify } from '@/hooks/useShopify';
import { useShopifyCustomer } from '@/hooks/useShopifyCustomer';
import { buildCartAddUrl, extractVariantMapping, validateCartUrl, type DesignData, type ColorwayVariants } from '@/lib/shopify-cart';

interface BuyButtonProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isDarkMode?: boolean;
  // Current product and colorway for inventory checking
  currentProduct?: {
    id: string;
    title: string;
    variants: Array<{
      id: string;
      title: string;
      inventoryQuantity: number;
      sku: string;
      size?: string; // Size extracted from title or SKU
    }>;
  };
  currentColorway?: {
    id: string;
    name: string;
  };
  // Optional callback to get current color configuration
  getColorConfiguration?: () => {
    upper: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string;
      splatterColor2?: string | null;
      splatterBaseColor?: string | null;
      useDualSplatter?: boolean;
      hasGradient: boolean;
      gradientColor1: string;
      gradientColor2: string;
      texture: string | null;
      paintDensity: number;
    };
    sole: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string;
      splatterColor2?: string | null;
      splatterBaseColor?: string | null;
      useDualSplatter?: boolean;
      hasGradient: boolean;
      gradientColor1: string;
      gradientColor2: string;
      texture: string | null;
      paintDensity: number;
    };
    laces: {
      color: string;
    };
    logo: {
      color: string;
      url: string | null;
      color1?: string;
      color2?: string;
      color3?: string;
      logoUrl?: string | null;
      circleLogoUrl?: string | null;
    };
  };
}

interface SizeQuantity {
  [size: string]: number;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  sizeQuantities: SizeQuantity;
  notes: string;
  website: string; // Honeypot field
}

interface AddressValidation {
  isValidating: boolean;
  isValid: boolean | null;
  suggestions: Array<{
    display_name: string;
    address: {
      house_number?: string;
      road?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
    };
  }>;
  error: string | null;
}

// Fallback sizes when not connected to Shopify
const FALLBACK_MENS_SIZES = ['M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18'];
const FALLBACK_WOMENS_SIZES = ['W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20'];

const PRICE_PER_PAIR = 80; // Base price per pair


export const BuyButton: React.FC<BuyButtonProps> = ({
  canvasRef,
  isDarkMode = false,
  currentProduct,
  currentColorway,
  getColorConfiguration
}) => {
  const { isConnected, getProduct } = useShopify();
  
  // Detect if this is a customer context (embedded or direct link with shop domain)
  const urlParams = new URLSearchParams(window.location.search);
  const shopDomain = urlParams.get('shop');
  const isCustomerContext = urlParams.get('customer') === 'true' || !!urlParams.get('productId');
  const customerAPI = useShopifyCustomer(isCustomerContext ? shopDomain || undefined : undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [inventoryData, setInventoryData] = useState<Record<string, number>>({});
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [variantMapping, setVariantMapping] = useState<ColorwayVariants>({});
  const [addressValidation, setAddressValidation] = useState<AddressValidation>({
    isValidating: false,
    isValid: null,
    suggestions: [],
    error: null
  });
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    sizeQuantities: {},
    notes: '',
    website: '' // Honeypot field
  });


  // Load inventory data when component opens
  const loadInventory = useCallback(async () => {
    if (!currentProduct) {
      console.log('Cannot load inventory: no product');
      return;
    }

    setIsLoadingInventory(true);
    try {
      console.log('Loading inventory for product:', currentProduct.id);
      
      let inventory: Record<string, number> = {};
      
      // Use customer API if in customer context
      if (isCustomerContext && shopDomain) {
        console.log('Using Storefront API for inventory');
        inventory = await customerAPI.loadProductInventory(currentProduct.id);
        
        // Also get product data for variant mapping
        const productData = await customerAPI.getProduct(currentProduct.id);
        if (productData) {
          const variants = extractVariantMapping(productData);
          setVariantMapping(variants);
        }
      } else if (isConnected) {
        console.log('Using Admin API for inventory');
        // Get fresh product data with variants
        const productData = await getProduct(currentProduct.id);
        
        if (productData && productData.variants) {
          // Extract variant mapping for cart URLs
          const variants = extractVariantMapping(productData);
          setVariantMapping(variants);
          
          // Map each variant to its size and inventory
          productData.variants.forEach(variant => {
            // Extract size from variant title or SKU
            const size = extractSizeFromVariant(variant);
            if (size) {
              inventory[size] = Math.max(0, variant.inventoryQuantity || 0);
              console.log(`Size ${size}: ${inventory[size]} available`);
            }
          });
        }
      } else {
        console.log('No API available for inventory lookup');
      }
      
      setInventoryData(inventory);
      console.log('Inventory loaded:', inventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: "Inventory Error",
        description: "Could not load current stock levels. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingInventory(false);
    }
  }, [isConnected, currentProduct, getProduct, isCustomerContext, shopDomain, customerAPI]);

  // Extract size from variant title or SKU
  const extractSizeFromVariant = (variant: { size?: string; title?: string; sku?: string }) => {
    // Check if size is already provided
    if (variant.size) return variant.size;
    
    // Try to extract from title (e.g., "Men's 10", "Women's 8", "M10", "W8")
    const title = variant.title || '';
    const sizeMatch = title.match(/(?:Men's|M)\s*(\d+(?:\.\d+)?)|(?:Women's|W)\s*(\d+(?:\.\d+)?)/i);
    
    if (sizeMatch) {
      const mensSize = sizeMatch[1];
      const womensSize = sizeMatch[2];
      
      if (mensSize) return `M${mensSize}`;
      if (womensSize) return `W${womensSize}`;
    }
    
    // Try to extract from SKU
    const sku = variant.sku || '';
    const skuMatch = sku.match(/(?:M|MENS?)[-_]?(\d+(?:\.\d+)?)|(?:W|WOMENS?)[-_]?(\d+(?:\.\d+)?)/i);
    
    if (skuMatch) {
      const mensSize = skuMatch[1];
      const womensSize = skuMatch[2];
      
      if (mensSize) return `M${mensSize}`;
      if (womensSize) return `W${womensSize}`;
    }
    
    console.warn('Could not extract size from variant:', variant);
    return null;
  };

  // Get available quantity for a specific size
  const getAvailableQuantity = (size: string) => {
    return inventoryData[size] || 0;
  };

  // Check if a size is available
  const isSizeAvailable = (size: string) => {
    return getAvailableQuantity(size) > 0;
  };

  const steps = [
    { title: 'Sizes', icon: ShoppingCart },
    { title: 'Contact', icon: User },
    { title: 'Review', icon: MessageSquare },
  ];


  const captureScreenshot = () => {
    if (!canvasRef?.current) {
      toast({
        title: "Error",
        description: "Unable to capture the 3D model. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setScreenshot(dataUrl);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: "Error",
        description: "Failed to capture model screenshot.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      captureScreenshot();
      loadInventory(); // Load inventory when opening
    } else {
      // Reset form and step when closing
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        sizeQuantities: {},
        notes: '',
        website: '' // Honeypot field
      });
      setScreenshot('');
      setCurrentStep(0);
    }
  };

  const updateQuantity = (size: string, quantity: number) => {
    const maxQuantity = getAvailableQuantity(size);
    const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));
    
    // Show warning if user tries to exceed available quantity
    if (quantity > maxQuantity && maxQuantity > 0) {
      toast({
        title: "Stock Limit Reached",
        description: `Only ${maxQuantity} pairs available in size ${size}`,
        variant: "destructive",
      });
    }
    
    setFormData(prev => ({
      ...prev,
      sizeQuantities: {
        ...prev.sizeQuantities,
        [size]: newQuantity
      }
    }));
  };

  const getTotalPairs = () => {
    return Object.values(formData.sizeQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return getTotalPairs() * PRICE_PER_PAIR;
  };

  // Get available sizes from inventory data, sorted logically
  const getAvailableSizes = () => {
    if (!isConnected || Object.keys(inventoryData).length === 0) {
      // Fallback to standard sizes when not connected
      return [...FALLBACK_MENS_SIZES, ...FALLBACK_WOMENS_SIZES];
    }
    
    // Get sizes from inventory data and sort them
    const sizes = Object.keys(inventoryData);
    
    // Sort sizes logically (M3, M4, ..., W5, W6, ...)
    return sizes.sort((a, b) => {
      const aIsMens = a.startsWith('M');
      const bIsMens = b.startsWith('M');
      
      // Group mens first, then womens
      if (aIsMens && !bIsMens) return -1;
      if (!aIsMens && bIsMens) return 1;
      
      // Within same gender, sort by number
      const aNum = parseInt(a.substring(1));
      const bNum = parseInt(b.substring(1));
      return aNum - bNum;
    });
  };

  const isStepComplete = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return true;
    }
    if (stepIndex > currentStep) {
      return false;
    }
    // For current step
    switch (stepIndex) {
      case 0:
        return getTotalPairs() >= 8;
      case 1:
        return formData.firstName.trim() !== '' &&
          formData.lastName.trim() !== '' &&
          formData.email.trim() !== '' &&
          formData.addressLine1.trim() !== '' &&
          formData.city.trim() !== '' &&
          formData.state.trim() !== '' &&
          formData.zip.trim() !== '' &&
          formData.country.trim() !== '';
      case 2:
        return true; // Optional step
      default:
        return false;
    }
  };

  const isFormValid = () => {
    return steps.every((_, index) => isStepComplete(index));
  };

  const handleNext = () => {
    if (isStepComplete(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Incomplete Step",
        description: "Please complete the current step before proceeding.",
        variant: "destructive",
      });
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Address validation using Nominatim (OpenStreetMap) - Free service
  const validateAddress = useCallback(async () => {
    const { addressLine1, city, state, zip, country } = formData;

    // Don't validate if required fields are empty
    if (!addressLine1.trim() || !city.trim() || !country.trim()) {
      return;
    }

    setAddressValidation(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      // Construct search query
      const addressQuery = `${addressLine1}, ${city}, ${state} ${zip}, ${country}`.trim();

      // Use Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=3&q=${encodeURIComponent(addressQuery)}`,
        {
          headers: {
            'User-Agent': 'KustomShoeApp/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Address validation service unavailable');
      }

      const results = await response.json();

      if (results.length === 0) {
        setAddressValidation({
          isValidating: false,
          isValid: false,
          suggestions: [],
          error: 'Address not found. Please check your address details.'
        });
      } else {
        // Check if first result is a good match
        const firstResult = results[0];
        const isGoodMatch = firstResult.display_name.toLowerCase().includes(city.toLowerCase()) &&
          firstResult.display_name.toLowerCase().includes(country.toLowerCase());

        setAddressValidation({
          isValidating: false,
          isValid: isGoodMatch,
          suggestions: results.slice(0, 3).map(result => ({
            display_name: result.display_name,
            address: result.address || {}
          })),
          error: null
        });
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setAddressValidation({
        isValidating: false,
        isValid: null,
        suggestions: [],
        error: 'Unable to validate address. Please ensure it\'s correct.'
      });
    }
  }, [formData]);

  // Debounced address validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.addressLine1 && formData.city && formData.country) {
        validateAddress();
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [formData.addressLine1, formData.city, formData.state, formData.zip, formData.country, validateAddress]);

  const applySuggestion = (suggestion: {
    display_name: string;
    address: {
      house_number?: string;
      road?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      postcode?: string;
      country?: string;
    };
  }) => {
    const addr = suggestion.address;
    setFormData(prev => ({
      ...prev,
      addressLine1: addr.house_number && addr.road ? `${addr.house_number} ${addr.road}` : prev.addressLine1,
      city: addr.city || addr.town || addr.village || prev.city,
      state: addr.state || prev.state,
      zip: addr.postcode || prev.zip,
      country: addr.country || prev.country
    }));
    setAddressValidation(prev => ({ ...prev, suggestions: [], isValid: true }));
  };

  const getColorInfo = () => {
    // Use callback if available, otherwise return default configuration
    if (getColorConfiguration) {
      return getColorConfiguration();
    }

    // Default color configuration
    return {
      upper: {
        baseColor: '#8b4513',
        hasSplatter: false,
        splatterColor: '#f8f8ff',
        splatterColor2: null,
        splatterBaseColor: null,
        useDualSplatter: false,
        hasGradient: false,
        gradientColor1: '#4a8c2b',
        gradientColor2: '#c25d1e',
        texture: null,
        paintDensity: 1
      },
      sole: {
        baseColor: '#2d5016',
        hasSplatter: false,
        splatterColor: '#f8f8ff',
        splatterColor2: null,
        splatterBaseColor: null,
        useDualSplatter: false,
        hasGradient: false,
        gradientColor1: '#4a8c2b',
        gradientColor2: '#c25d1e',
        texture: null,
        paintDensity: 1
      },
      laces: {
        color: '#FFFFFF'
      },
      logo: {
        color: '#FFFFFF',
        url: null,
        color1: undefined,
        color2: undefined,
        color3: undefined,
        logoUrl: null,
        circleLogoUrl: null
      }
    };
  };

  // Build design data for cart properties
  const buildDesignData = (): DesignData => {
    const colorConfig = getColorInfo();
    
    return {
      colorwayName: currentColorway?.name || 'Custom Design',
      colorwayId: currentColorway?.id || 'custom',
      upperColor: colorConfig.upper.baseColor,
      soleColor: colorConfig.sole.baseColor,
      laceColor: colorConfig.laces.color,
      
      // Enhanced splatter data
      upperHasSplatter: colorConfig.upper.hasSplatter,
      upperSplatterColor: colorConfig.upper.hasSplatter ? colorConfig.upper.splatterColor : undefined,
      upperSplatterColor2: colorConfig.upper.splatterColor2 ?? undefined,
      upperUseDualSplatter: colorConfig.upper.useDualSplatter ?? false,
      
      soleHasSplatter: colorConfig.sole.hasSplatter,
      soleSplatterColor: colorConfig.sole.hasSplatter ? colorConfig.sole.splatterColor : undefined,
      soleSplatterColor2: colorConfig.sole.splatterColor2 ?? undefined,
      soleUseDualSplatter: colorConfig.sole.useDualSplatter ?? false,
      
      // Logo data
      logoUrl: colorConfig.logo.logoUrl || colorConfig.logo.url || undefined,
      circleLogoUrl: colorConfig.logo.circleLogoUrl ?? undefined,
      logoColor1: colorConfig.logo.color1 ?? undefined,
      logoColor2: colorConfig.logo.color2 ?? undefined,
      logoColor3: colorConfig.logo.color3 ?? undefined,
      
      // Design context
      screenshot: screenshot || undefined,
      notes: formData.notes || undefined,
      timestamp: new Date().toISOString()
    };
  };

  // Add items to Shopify cart using cart/add URL with line item properties
  const redirectToCart = async () => {
    if (!shopDomain) {
      toast({
        title: "Store Not Found",
        description: "Unable to determine the Shopify store domain.",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(variantMapping).length === 0) {
      toast({
        title: "Product Data Loading",
        description: "Please wait for product data to load, then try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const designData = buildDesignData();
      console.log('Design data for cart:', designData);
      
      // Build cart/add URL with line item properties
      const cartUrl = buildCartAddUrl(shopDomain, formData.sizeQuantities, variantMapping, designData);
      
      console.log('Generated cart/add URL:', cartUrl);
      
      // Show success message
      toast({
        title: "Adding to Cart",
        description: `Adding ${getTotalPairs()} pairs with custom design to your cart...`,
      });

      // Small delay to show the toast, then redirect
      setTimeout(() => {
        window.open(cartUrl, '_blank');
      }, 1000);
      
      // Close the modal
      setIsOpen(false);
      
    } catch (error) {
      console.error('Error building cart URL:', error);
      toast({
        title: "Cart Error",
        description: error instanceof Error ? error.message : "Failed to add items to cart",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check - if filled, it's likely spam
    if (formData.website.trim() !== '') {
      console.log('Spam detected - honeypot field filled');
      toast({
        title: "Submission Blocked",
        description: "Invalid submission detected.",
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid()) {
      toast({
        title: "Missing Information",
        description: "Please complete all required steps.",
        variant: "destructive",
      });
      return;
    }

    // For customer contexts, redirect to Shopify cart instead of webhook
    if (isCustomerContext && shopDomain) {
      await redirectToCart();
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data to send to n8n webhook
      const webhookData = {
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
        }
      };

      // Replace with your actual n8n webhook URL
      const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/shoe-order';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit order');
      }

      toast({
        title: "Order Submitted!",
        description: `Thank you for your order of ${getTotalPairs()} pairs! We'll contact you soon with more details.`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => handleOpenChange(true)}
        className={`flex w-9 md:w-auto rounded-full items-center gap-2 transition-all duration-300 ${isDarkMode
          ? 'bg-white text-black hover:bg-white/90'
          : 'bg-black text-white hover:bg-black/40'
          }`}
      >
        <ShoppingCart className="w-4 h-4" />
     <span className="hidden md:block">   Buy Now</span>
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#F8F9FA]/50 z-40 transition-opacity duration-300"
          onClick={() => handleOpenChange(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-full max-w-lg bg-[#F8F9FA] rounded-bl-[40px] rounded-r-none shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-center pl-6 pt-3 pb-2 bg-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg 
              className="w-auto h-12 -ml-4 opacity-100 fill-slate-500/80" 
              viewBox="0 0 71.3 21.09" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <g opacity="0.5">
                  <g>
                    <path d="M1.14,6.66c.27.11.53.21.8.31.83.31,1.65.62,2.48.93.21.08.41.19.56.36.22.24.31.52.31.84,0,1.76,0,3.51,0,5.27,0,.02,0,.03,0,.06-.02,0-.03,0-.04-.01-.85-.35-1.71-.7-2.55-1.07-.9-.4-1.4-1.1-1.54-2.07-.01-.09-.02-.18-.02-.28,0-1.43,0-2.85,0-4.28,0-.02,0-.04,0-.06Z"/>
                    <path d="M5.92,14.43v-.09c0-1.73,0-3.46,0-5.19,0-.61.28-1.02.85-1.24.92-.35,1.84-.69,2.76-1.04.16-.06.31-.12.47-.19.02,0,.05-.02.08-.03v.08c0,1.4,0,2.81,0,4.21,0,1.09-.62,2.01-1.63,2.43-.81.34-1.63.68-2.44,1.02-.02.01-.05.02-.08.03Z"/>
                  </g>
                  <g>
                    <g>
                      <path d="M28.1,14.19c-2.63,0-3.27-.79-3.27-1.95v-4.74c0-.24.12-.35.38-.35h1.66c.27,0,.38.11.38.35v4.37c0,.26.13.45.87.45s.88-.19.88-.45v-4.37c0-.24.11-.35.38-.35h1.61c.26,0,.38.11.38.35v4.74c0,1.17-.65,1.95-3.27,1.95Z"/>
                      <path d="M32.98,14.05c-.27,0-.38-.11-.38-.35v-1.12c0-.24.12-.35.38-.35h2.85c.18,0,.28-.12.28-.28,0-.22-.1-.31-.28-.33l-1.59-.2c-1-.13-1.64-.52-1.64-1.59v-1.01c0-1.09.82-1.69,2.19-1.69h2.97c.26,0,.38.11.38.35v1.14c0,.24-.12.35-.38.35h-2.47c-.18,0-.29.12-.29.29s.11.29.29.31l1.58.19c1,.13,1.65.52,1.65,1.59v1.01c0,1.09-.83,1.69-2.19,1.69h-3.35Z"/>
                      <path d="M41.46,14.05c-.26,0-.38-.11-.38-.35v-4.71h-1.56c-.26,0-.38-.11-.38-.35v-1.16c0-.24.12-.35.38-.35h5.6c.26,0,.38.11.38.35v1.16c0,.24-.12.35-.38.35h-1.56v4.71c0,.24-.12.35-.38.35h-1.72Z"/>
                      <path d="M49.65,14.19c-2.65,0-3.3-.79-3.3-1.95v-3.27c0-1.17.65-1.96,3.3-1.96s3.28.8,3.28,1.96v3.27c0,1.17-.64,1.95-3.28,1.95ZM49.65,12.34c.77,0,.89-.19.89-.45v-2.58c0-.25-.12-.44-.89-.44s-.89.19-.89.44v2.58c0,.26.13.45.89.45Z"/>
                      <path d="M54.66,14.05c-.26,0-.38-.11-.38-.35v-6.21c0-.24.12-.35.38-.35h1.71c.22,0,.36.08.49.29l.95,1.56c.07.11.11.16.19.16h.1c.09,0,.12-.05.19-.16l.94-1.56c.13-.21.27-.29.49-.29h1.72c.26,0,.38.11.38.35v6.21c0,.24-.12.35-.38.35h-1.63c-.28,0-.38-.11-.38-.35v-3.37l-.62,1.04c-.13.22-.29.31-.56.31h-.42c-.28,0-.43-.09-.56-.31l-.63-1.04v3.37c0,.24-.12.35-.38.35h-1.58Z"/>
                      <path d="M63.47,14.05c-.27,0-.38-.11-.38-.35v-1.12c0-.24.12-.35.38-.35h2.85c.18,0,.28-.12.28-.28,0-.22-.1-.31-.28-.33l-1.59-.2c-1-.13-1.64-.52-1.64-1.59v-1.01c0-1.09.82-1.69,2.19-1.69h2.97c.26,0,.38.11.38.35v1.14c0,.24-.12.35-.38.35h-2.47c-.18,0-.29.12-.29.29s.11.29.29.31l1.58.19c1,.13,1.65.52,1.65,1.59v1.01c0,1.09-.83,1.69-2.19,1.69h-3.35Z"/>
                    </g>
                    <path d="M15.64,7.05h.08c.73,0,1.47,0,2.2,0,.26,0,.45.19.45.45,0,.67,0,1.35,0,2.02v.09c.15,0,.3,0,.44,0,.13.01.2-.04.27-.14.53-.72,1.07-1.44,1.6-2.16.13-.18.3-.26.52-.26.71,0,1.42,0,2.12,0,.08,0,.16.01.23.04.11.05.16.15.12.27-.02.06-.06.13-.1.18-.76.98-1.52,1.96-2.29,2.94-.04.05-.04.08,0,.12.77.98,1.53,1.96,2.29,2.94.04.05.08.12.1.18.04.11,0,.22-.12.27-.06.03-.13.04-.19.04-.74,0-1.48,0-2.22,0-.2,0-.34-.09-.46-.24-.55-.75-1.11-1.5-1.66-2.25-.04-.05-.07-.07-.14-.07-.17,0-.35,0-.52,0v2.56s-.05,0-.08,0c-.74,0-1.48,0-2.22,0-.27,0-.43-.16-.43-.43,0-2.17,0-4.33,0-6.5v-.07Z"/>
                  </g>
                </g>
              </g>
            </svg>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="h-8 right-4 fixed w-8 p-0 hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col" style={{ height: 'calc(100vh - 59px)' }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Stepper - Simplified titles for less text */}
            <nav className="mb-2">
              <ol
                className="flex items-center justify-between w-full relative"
                style={{ marginTop: '-20px', minHeight: 70 }}
              >
                {steps.map((step, index) => {
                  const isCompleted = isStepComplete(index);
                  const isActive = currentStep === index;
                  // For the "liquid fill" effect: bars fill only after step is completed (i.e., after clicking "Next")
                  // So, bar before step 1 is never filled, after step 1 is completed, first bar fills, etc.
                  return (
                    <React.Fragment key={index}>
                      <li className="flex flex-col items-center flex-1 min-w-0 z-10">
                        <div
                          className={`
                            flex items-center justify-center
                            w-11 h-11
                            rounded-full
                            border-2
                            transition-all
                            duration-200
                            relative
                            ${isCompleted
                              ? 'bg-green-500 border-green-500 shadow-lg text-white'
                              : isActive
                                ? 'bg-primary border-primary shadow text-white'
                                : 'bg-white border-gray-300 text-gray-400'
                            }
                          `}
                          style={{
                            boxShadow: isActive
                              ? '0 0 0 6px rgba(59,130,246,0.10)'
                              : isCompleted
                                ? '0 0 0 6px rgba(34,197,94,0.10)'
                                : undefined
                          }}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <span className="font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <span
                          className={`
                            mt-2 text-xs font-semibold text-center transition-colors
                            ${isActive
                              ? 'text-primary'
                              : isCompleted
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }
                          `}
                          style={{
                            maxWidth: 80,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {step.title}
                        </span>
                      </li>
                      {index < steps.length - 1 && (
                        <div
                          className="relative flex-1 flex items-center"
                          style={{
                            // Move the lines up so they're closer to the middle of the circle
                            marginTop: '0.4rem',
                            marginBottom: 0,
                            minWidth: 32,
                            height: 10,
                          }}
                        >
                          {/* Track */}
                          <div
                            className="absolute w-full h-2 rounded-full bg-gray-200"
                            style={{
                              // Move the bar up to align with the center of the step circle
                              top: '-0.65rem',
                              left: 0,
                              zIndex: 0,
                            }}
                          />
                          {/* "Liquid fill" bar: only fills after step is completed */}
                          <div
                            className={`
                              absolute h-2 rounded-full transition-all duration-700
                              ${isStepComplete(index + 1)
                                ? 'bg-green-500'
                                : 'bg-primary/30'
                              }
                            `}
                            style={{
                              width: isStepComplete(index + 1) ? '100%' : '0%',
                              left: 0,
                              top: '-0.65rem',
                              zIndex: 1,
                              transitionTimingFunction: 'cubic-bezier(.4,1.6,.6,1)',
                              boxShadow: isStepComplete(index + 1)
                                ? '0 2px 8px 0 rgba(34,197,94,0.10)'
                                : undefined,
                            }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </ol>
            </nav>

            {/* Step Content */}
            <form onSubmit={(e) => { if (currentStep === steps.length - 1) handleSubmit(e); else e.preventDefault(); }} className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {/* Inventory Status */}
                    {currentProduct && (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {currentProduct.title}
                        </h3>
                        {isConnected && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isLoadingInventory 
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {isLoadingInventory ? 'Loading Stock...' : 'Live Inventory'}
                          </span>
                        )}
                      </div>
                    )}
                   
                  </div>

                  {/* Sizes Header */}
                

                  {/* Size Grid with fade out */}
                  <div className="relative pt-3">
                    <div className="grid grid-cols-2 gap-4 max-h-[50vh] pb-4 overflow-y-auto pr-2">
                      {getAvailableSizes().map((size) => {
                        const quantity = formData.sizeQuantities[size] || 0;
                        const available = getAvailableQuantity(size);
                        const isAvailable = isSizeAvailable(size);
                        const isLoading = isLoadingInventory;
                        
                        return (
                          <div key={size} className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                            !isAvailable && !isLoading
                              ? 'border-red-200 bg-red-50 opacity-60'
                              : quantity > 0 
                                ? 'border-slate-500/20 bg-slate-400/5' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <div className="flex flex-col">
                              <span className={`font-medium text-sm ${!isAvailable && !isLoading ? 'text-gray-500' : ''}`}>
                                {size}
                              </span>
                              <span className={`text-xs ${
                                isLoading 
                                  ? 'text-gray-400' 
                                  : !isAvailable 
                                    ? 'text-red-500' 
                                    : available <= 5 
                                      ? 'text-orange-600' 
                                      : 'text-green-600'
                              }`}>
                                {isLoading ? 'Loading...' : 
                                 !isAvailable ? 'Out of Stock' : 
                                 available <= 5 ? `Only ${available} left` : 
                                 `${available} available`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={quantity}
                                onChange={(e) => updateQuantity(size, Math.max(0, parseInt(e.target.value) || 0))}
                                disabled={!isAvailable || isLoading}
                                max={available}
                                className={`w-12 text-center font-medium border rounded-md h-8 focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  !isAvailable || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                                }`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(size, quantity + 1)}
                                disabled={!isAvailable || isLoading || quantity >= available}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>

                  {/* Quick Summary - Moved to bottom, simplified */}
                  {getTotalPairs() > 0 && (
                    <div className="bg-gray-50 py-2 px-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center font-medium">
                        <span>Total Pairs</span>
                        <span className="text-primary">{getTotalPairs()}</span>
                      </div>
                      {getTotalPairs() < 8 && (
                        <div className="text-xs text-red-600 mt-1">
                          Add {8 - getTotalPairs()} more to continue
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-sm">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="John"
                          autoComplete="given-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Doe"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="text-sm">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@example.com"
                          autoComplete="email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(555) 123-4567"
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    {/* Honeypot field - hidden from users but accessible to bots */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '-9999px', 
                      opacity: 0, 
                      pointerEvents: 'none'
                    }}>
                      <Label htmlFor="website" className="sr-only">Website (leave blank)</Label>
                      <Input
                        id="website"
                        type="text"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder=""
                        autoComplete="off"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-base flex items-center gap-2 mb-0">
                          <MapPin className="w-4 h-4" />
                          Shipping Address
                          {addressValidation.isValidating && (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                          )}
                          {addressValidation.isValid === true && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {addressValidation.isValid === false && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </h4>
                        <div className="flex-1 ml-2">
                          <div className="border-t border-gray-200 w-full" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="addressLine1" className="text-sm">Address Line 1 *</Label>
                        <Input
                          id="addressLine1"
                          value={formData.addressLine1}
                          onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                          placeholder="123 Main St"
                          autoComplete="address-line1"
                          className={addressValidation.isValid === false ? 'border-red-300 focus:border-red-500' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="addressLine2" className="text-sm">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          value={formData.addressLine2}
                          onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                          placeholder="Apt 4B"
                          autoComplete="address-line2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city" className="text-sm">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="New York"
                            autoComplete="address-level2"
                            className={addressValidation.isValid === false ? 'border-red-300 focus:border-red-500' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="state" className="text-sm">State / Province *</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="NY"
                            autoComplete="address-level1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zip" className="text-sm">ZIP / Postal Code *</Label>
                          <Input
                            id="zip"
                            value={formData.zip}
                            onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                            placeholder="10001"
                            autoComplete="postal-code"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country" className="text-sm">Country *</Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                            placeholder="United States"
                            autoComplete="country-name"
                            className={addressValidation.isValid === false ? 'border-red-300 focus:border-red-500' : ''}
                          />
                        </div>
                      </div>

                      {/* Address Validation Messages */}
                      {addressValidation.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{addressValidation.error}</p>
                          </div>
                        </div>
                      )}

                      {addressValidation.isValid === true && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-green-700">Address verified successfully!</p>
                          </div>
                        </div>
                      )}

                      {/* Address Suggestions */}
                      {addressValidation.suggestions.length > 0 && addressValidation.isValid !== true && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-700 font-medium">Did you mean one of these addresses?</p>
                          </div>
                          <div className="space-y-2">
                            {addressValidation.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => applySuggestion(suggestion)}
                                className="w-full text-left p-2 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                              >
                                {suggestion.display_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  {/* Screenshot Preview - Made larger for better visibility */}
                  {screenshot && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Your Design</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={screenshot}
                          alt="Custom shoe design"
                          className="w-full h-40 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Order Summary - Simplified */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg -mt-2">Order Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex-1 text-gray-700 text-sm">Quantity</span>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ml-2">
                          <span className="font-bold">{getTotalPairs()}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex-1 text-gray-700 text-sm">Price / Pair</span>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ml-2">
                          <span className="font-bold">${PRICE_PER_PAIR}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2 text-md font-bold">
                        <span className="flex-1">Total</span>
                        <span className="text-primary flex items-center gap-1 ml-2">
                          <span className="text-xl">${getTotalPrice()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Card - Different content for customer vs admin */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-medium text-blue-900">Next Steps</h4>
                        <p className="text-xs text-blue-800">
                          {isCustomerContext && shopDomain ? (
                            "Your items will be added to your Shopify cart where you can complete checkout with your preferred payment method."
                          ) : (
                            "We'll reach out to you with an official invoice within 24 hours."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes - Expanding Button */}
                  <div className="space-y-2">
                    <ExpandingButton
                      buttonText="Add Special Notes"
                      placeholder="Any special instructions or requests..."
                      value={formData.notes}
                      onChange={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                      onSubmit={(text) => {
                        setFormData(prev => ({ ...prev, notes: text }));
                        toast({
                          title: "Notes Added",
                          description: "Your special notes have been saved.",
                        });
                      }}
                      onCancel={() => setFormData(prev => ({ ...prev, notes: '' }))}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="border border-slate-400/20 mx-3 my-5 bg-gradient-to-r from-slate-400/10 to-slate-400/0 rounded-full p-4">
            <div className="flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0 || isSubmitting}
                className="flex-1 rounded-full hover:bg-gray-50 hover:text-slate-900"
              >
                Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepComplete(currentStep) || isSubmitting}
                  className="flex-1 rounded-full"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid()}
                  className={`flex-1 rounded-full flex items-center gap-2 transition-all ${isFormValid() && !isSubmitting
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {isCustomerContext && shopDomain ? (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Order
                        </>
                      )}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
