# Environment Setup for KANE Footwear Sharing

## Required Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration (VITE prefix for Vite apps)
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
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
