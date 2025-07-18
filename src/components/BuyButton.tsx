import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Send, Plus, Minus, X, User, MessageSquare, Check, MapPin, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface BuyButtonProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isDarkMode?: boolean;
  // Optional callback to get current color configuration
  getColorConfiguration?: () => any;
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

const MENS_SIZES = ['M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18'];
const WOMENS_SIZES = ['W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20'];

// Combined sizes for "both" view - each men's size paired with corresponding women's size
const COMBINED_SIZES = [
  'M3 / W5', 'M4 / W6', 'M5 / W7', 'M6 / W8', 'M7 / W9', 'M8 / W10', 'M9 / W11', 'M10 / W12',
  'M11 / W13', 'M12 / W14', 'M13 / W15', 'M14 / W16', 'M15 / W17', 'M16 / W18', 'M17 / W19', 'M18 / W20'
];

const PRICE_PER_PAIR = 80; // Base price per pair

type SizeFilter = 'both' | 'mens' | 'womens';

export const BuyButton: React.FC<BuyButtonProps> = ({
  canvasRef,
  isDarkMode = false,
  getColorConfiguration
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('mens');
  const [currentStep, setCurrentStep] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
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
    notes: ''
  });

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const steps = [
    { title: 'Sizes', icon: ShoppingCart },
    { title: 'Contact', icon: User },
    { title: 'Review', icon: MessageSquare },
  ];

  useEffect(() => {
    if (tabRefs.current.length > 0 && indicatorRef.current) {
      const activeIndex = ['both', 'mens', 'womens'].indexOf(sizeFilter);
      const activeTab = tabRefs.current[activeIndex];
      if (activeTab) {
        indicatorRef.current.style.width = `${activeTab.offsetWidth}px`;
        indicatorRef.current.style.left = `${activeTab.offsetLeft}px`;
      }
    }
  }, [sizeFilter]);

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
        notes: ''
      });
      setScreenshot('');
      setCurrentStep(0);
    }
  };

  const updateQuantity = (size: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      sizeQuantities: {
        ...prev.sizeQuantities,
        [size]: Math.max(0, quantity)
      }
    }));
  };

  const getTotalPairs = () => {
    return Object.values(formData.sizeQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return getTotalPairs() * PRICE_PER_PAIR;
  };

  const getFilteredSizes = () => {
    switch (sizeFilter) {
      case 'mens':
        return MENS_SIZES;
      case 'womens':
        return WOMENS_SIZES;
      default:
        return COMBINED_SIZES;
    }
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
  const validateAddress = async () => {
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
  };

  // Debounced address validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.addressLine1 && formData.city && formData.country) {
        validateAddress();
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [formData.addressLine1, formData.city, formData.state, formData.zip, formData.country]);

  const applySuggestion = (suggestion: any) => {
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
        hasGradient: false,
        gradientColor1: '#4a8c2b',
        gradientColor2: '#c25d1e',
        texture: null
      },
      sole: {
        baseColor: '#2d5016',
        hasSplatter: false,
        splatterColor: '#f8f8ff',
        hasGradient: false,
        gradientColor1: '#4a8c2b',
        gradientColor2: '#c25d1e',
        texture: null
      },
      laces: {
        color: '#FFFFFF'
      },
      logo: {
        color: '#FFFFFF',
        url: null
      }
    };
  };

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
        className={`flex rounded-full items-center gap-2 transition-all duration-300 ${isDarkMode
          ? 'bg-white text-black hover:bg-white/90'
          : 'bg-black text-white hover:bg-black/40'
          }`}
      >
        <ShoppingCart className="w-4 h-4" />
        Buy Now
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => handleOpenChange(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-full max-w-lg bg-white rounded-l-3xl rounded-r-none shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-center pl-6 pt-3 pb-2 bg-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/kustom_1icon.svg" alt="Kustom Icon" className="w-auto h-12 -ml-4 opacity-50" />
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
        <div className="flex flex-col" style={{ height: 'calc(100vh - 89px)' }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Stepper - Simplified titles for less text */}
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${isStepComplete(index)
                        ? 'bg-green-500 text-white'
                        : currentStep === index
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                      {isStepComplete(index) ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="text-xs mt-1 text-center font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <form onSubmit={(e) => { if (currentStep === steps.length - 1) handleSubmit(e); else e.preventDefault(); }} className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Size & Quantity</h3>
                    <div className="text-sm text-gray-500">
                      Min. 8 pairs
                    </div>
                  </div>

                  {/* Enhanced Tab Bar with Sliding Indicator */}
                  <div className="relative flex bg-gray-100 rounded-full p-1">
                    <div
                      ref={indicatorRef}
                      className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-all duration-300 ease-out"
                    />
                    <Button
                      ref={el => tabRefs.current[0] = el}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSizeFilter('both')}
                      className={`flex-1 hover:text-gray-800 h-9 relative z-10 transition-colors rounded-full hover:bg-transparent ${sizeFilter === 'both' ? 'text-primary font-medium' : 'text-gray-600'}`}
                    >
                      Both
                    </Button>
                    <Button
                      ref={el => tabRefs.current[1] = el}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSizeFilter('mens')}
                      className={`flex-1 hover:text-gray-800 h-9 relative z-10 transition-colors rounded-full hover:bg-transparent ${sizeFilter === 'mens' ? 'text-primary font-medium' : 'text-gray-600'}`}
                    >
                      Men's
                    </Button>
                    <Button
                      ref={el => tabRefs.current[2] = el}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSizeFilter('womens')}
                      className={`flex-1 hover:text-gray-800 h-9 relative z-10 transition-colors rounded-full hover:bg-transparent ${sizeFilter === 'womens' ? 'text-primary font-medium' : 'text-gray-600'}`}
                    >
                      Women's
                    </Button>
                  </div>

                  {/* Size Grid with fade out */}
                  <div className="relative">
                    <div className="grid grid-cols-2 gap-4 max-h-[45vh] pb-4 overflow-y-auto pr-2">
                      {getFilteredSizes().map((size) => {
                        const quantity = formData.sizeQuantities[size] || 0;
                        return (
                          <div key={size} className={`flex items-center justify-between p-3 border rounded-lg transition-all ${quantity > 0 ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <span className="font-medium text-sm">{size}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(size, Math.max(0, quantity - 1))}
                                disabled={quantity === 0}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <input
                                type="number"
                                value={quantity}
                                onChange={(e) => updateQuantity(size, Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-12 text-center font-medium border rounded-md h-8 focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(size, quantity + 1)}
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
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Contact Info</h3>

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

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium text-base flex items-center gap-2">
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
                <div className="space-y-6">
                  {/* Screenshot Preview - Made larger for better visibility */}
                  {screenshot && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Your Design</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={screenshot}
                          alt="Custom shoe design"
                          className="w-full h-56 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Order Summary - Simplified */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                      <div className="flex justify-between">
                        <span>Pairs</span>
                        <span className="font-medium">{getTotalPairs()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price/Pair</span>
                        <span className="font-medium">${PRICE_PER_PAIR}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">${getTotalPrice()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Info Card */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-medium text-blue-900">Next Steps</h4>
                        <p className="text-sm text-blue-800">
                          We'll reach out to you with an official invoice and payment details within 24 hours.

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes - Collapsible */}
                  <div className="space-y-2">
                    {!showNotes ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNotes(true)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                      >
                        <Plus className="w-4 h-4" />
                        Add Special Notes
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="notes" className="text-sm">Special Notes</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNotes(false);
                              setFormData(prev => ({ ...prev, notes: '' }));
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any special instructions or requests..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="border-t bg-transparent p-6">
            <div className="flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0 || isSubmitting}
                className="flex-1 hover:bg-gray-50 hover:text-slate-900"
              >
                Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepComplete(currentStep) || isSubmitting}
                  className="flex-1"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid()}
                  className={`flex-1 flex items-center gap-2 transition-all ${isFormValid() && !isSubmitting
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
                      <Send className="w-4 h-4" />
                      Submit
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
