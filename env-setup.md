# Environment Setup for KANE Footwear

## Required Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration (VITE prefix for Vite apps)
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Shopify Configuration (Optional - can be set via UI)
VITE_SHOPIFY_CLIENT_ID=d4d69ee44cf2dd4522f73989a961c273
VITE_SHOPIFY_CLIENT_SECRET=3c4fbf1eb5b479e223c4f940871bd489

# Shopify Configuration for Netlify Functions (Required for OAuth)
SHOPIFY_CLIENT_ID=d4d69ee44cf2dd4522f73989a961c273
SHOPIFY_CLIENT_SECRET=3c4fbf1eb5b479e223c4f940871bd489
```

## Getting Your Supabase Keys

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ofocvxnnkwegfrdmxsaj/settings/api
2. Copy the "anon public" key
3. Paste it into your `.env.local` file

## Netlify Deployment

For deployment on Netlify, add these environment variables in your Netlify dashboard:

1. Go to Site settings → Environment variables
2. Add: `VITE_SUPABASE_ANON_KEY` with your anon key value

## Testing

After setting up the environment variables:

1. Run your dev server: `npm run dev`
2. Try the "Save & Share Design" button
3. Check the browser console for any errors
4. Test sharing a design by copying the generated link
