import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface OrderRequest {
  id: string;
  created_at: string;
  updated_at: string;
  order_type: 'buy_now' | 'order_request';
  status: 'pending' | 'processing' | 'fulfilled' | 'cancelled';
  customer_info: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    notes: string;
  };
  product_info: {
    productId: string;
    productTitle: string;
    colorwayId: string;
    colorwayName: string;
    sizeQuantities: Record<string, number>;
    totalPairs: number;
    pricePerPair: number;
    totalPrice: number;
  };
  design_config: {
    upper: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string;
      splatterColor2?: string;
      splatterBaseColor?: string;
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
      splatterColor2?: string;
      splatterBaseColor?: string;
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
  metadata: {
    screenshot?: string;
    userAgent?: string;
    referrer?: string;
    shopDomain?: string;
    isCustomerContext?: boolean;
    timestamp?: string;
  };
  submitted_at: string;
  processed_at?: string;
  fulfilled_at?: string;
}

export interface SavedDesign {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  design_config: OrderRequest['design_config'];
  product_info: {
    productId: string;
    productTitle: string;
    colorwayId: string;
    colorwayName: string;
  };
  metadata: {
    screenshot?: string;
    userAgent?: string;
    shopDomain?: string;
    isCustomerContext?: boolean;
  };
  is_public: boolean;
  created_by?: string;
}

export const useSupabaseOrders = () => {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load orders from Supabase
  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('order_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Load saved designs from Supabase
  const loadSavedDesigns = useCallback(async () => {
    setIsLoadingDesigns(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('saved_designs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSavedDesigns(data || []);
    } catch (err) {
      console.error('Error loading saved designs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load saved designs');
    } finally {
      setIsLoadingDesigns(false);
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderRequest['status']) => {
    try {
      const updateData: any = { status };
      
      if (status === 'processing') {
        updateData.processed_at = new Date().toISOString();
      } else if (status === 'fulfilled') {
        updateData.fulfilled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('order_requests')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status, ...updateData }
            : order
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
      return false;
    }
  }, []);

  // Delete order
  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('order_requests')
        .delete()
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.filter(order => order.id !== orderId));
      return true;
    } catch (err) {
      console.error('Error deleting order:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete order');
      return false;
    }
  }, []);

  // Save design
  const saveDesign = useCallback(async (designData: Omit<SavedDesign, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('saved_designs')
        .insert([designData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setSavedDesigns(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error saving design:', err);
      setError(err instanceof Error ? err.message : 'Failed to save design');
      return null;
    }
  }, []);

  // Delete saved design
  const deleteSavedDesign = useCallback(async (designId: string) => {
    try {
      const { error } = await supabase
        .from('saved_designs')
        .delete()
        .eq('id', designId);

      if (error) {
        throw error;
      }

      // Update local state
      setSavedDesigns(prev => prev.filter(design => design.id !== designId));
      return true;
    } catch (err) {
      console.error('Error deleting saved design:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete saved design');
      return false;
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    savedDesigns,
    isLoadingOrders,
    isLoadingDesigns,
    error,
    loadOrders,
    loadSavedDesigns,
    updateOrderStatus,
    deleteOrder,
    saveDesign,
    deleteSavedDesign,
  };
};
