# KANE Footwear - Shopify Embed Setup Guide

This guide explains how to embed the KANE 3D Configurator on your Shopify product pages or anywhere else on your store.

## 🎯 **Three Embedding Options**

### **Option 1: Shopify App Embed (Recommended)**
The most seamless integration - shows up as a block in the theme editor.

### **Option 2: Simple iframe Embed**
Easy to implement, works anywhere on your site.

### **Option 3: App Proxy**
Advanced option for custom implementations.

---

## 🚀 **Option 1: Shopify App Embed Setup**

### **Step 1: Configure App Embed**

1. **Update your `shopify.app.toml`** (already created):
```toml
name = "KANE Footwear Configurator"
client_id = "d4d69ee44cf2dd4522f73989a961c273"
application_url = "https://kaneconfig.netlify.app"
embedded = true

[[app_proxy.extensions]]
type = "product-embed"
name = "KANE 3D Configurator"
handle = "kane-3d-configurator"
```

### **Step 2: Deploy App Embed**

```bash
# Install Shopify CLI if you haven't
npm install -g @shopify/cli @shopify/theme

# Deploy the app embed
shopify app deploy
```

### **Step 3: Enable in Theme**

1. Go to your Shopify Admin → **Online Store** → **Themes**
2. Click **Customize** on your active theme
3. Navigate to a product page
4. Click **Add section** or **Add block**
5. Look for **"KANE 3D Configurator"** in the **Apps** section
6. Add it to your product page
7. Configure the settings:
   - **Product to Configure**: Select the product
   - **Show Buy Button**: Enable/disable buy functionality
   - **Show Share Button**: Enable/disable sharing
   - **Embed Size**: Choose size (small/medium/large/full)

### **Step 4: Save and Test**

1. **Save** your theme changes
2. Visit a product page where you added the configurator
3. The 3D configurator should load with live inventory data

---

## 🎨 **Option 2: Simple iframe Embed**

### **Basic iframe Code**

Add this HTML anywhere on your Shopify pages:

```html
<iframe 
  src="https://kaneconfig.netlify.app/embed?shop=YOUR_SHOP.myshopify.com&product=PRODUCT_ID&token=YOUR_ACCESS_TOKEN"
  width="100%" 
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
</iframe>
```

### **iframe Parameters**

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `shop` | Yes | Your shop domain | `mystore.myshopify.com` |
| `product` | No | Specific product ID | `8200678080699` |
| `token` | No | Access token for live data | `shpat_...` |
| `theme` | No | `dark` or `light` | `dark` |
| `buy` | No | Show buy button | `true`/`false` |
| `share` | No | Show share button | `true`/`false` |

### **Example Implementations**

**Basic Embed (No Shopify Connection):**
```html
<iframe 
  src="https://kaneconfig.netlify.app/embed"
  width="100%" 
  height="600"
  frameborder="0">
</iframe>
```

**Product-Specific with Live Data:**
```html
<iframe 
  src="https://kaneconfig.netlify.app/embed?shop={{ shop.permanent_domain }}&product={{ product.id }}&token=shpat_YOUR_TOKEN&theme=dark"
  width="100%" 
  height="600"
  frameborder="0">
</iframe>
```

**Liquid Template Integration:**
```liquid
<!-- In product.liquid or product-form.liquid -->
<div class="kane-configurator-embed">
  <iframe 
    src="https://kaneconfig.netlify.app/embed?shop={{ shop.permanent_domain }}&product={{ product.id }}&token={{ settings.kane_access_token }}&theme=dark"
    width="100%" 
    height="600"
    frameborder="0"
    style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
  </iframe>
</div>
```

---

## ⚙️ **Option 3: App Proxy Setup**

### **Step 1: Configure App Proxy**

1. In your Shopify Partner Dashboard:
   - Go to **Apps** → **KANE Footwear Configurator**
   - Click **App setup** → **App proxy**
   - Set **Subpath prefix**: `apps`
   - Set **Subpath**: `kane`
   - Set **Proxy URL**: `https://kaneconfig.netlify.app`

### **Step 2: Access via Proxy**

Your configurator will be available at:
```
https://YOUR_SHOP.myshopify.com/apps/kane/configurator?product_id=123
```

### **Step 3: Liquid Integration**

```liquid
<!-- In product.liquid -->
<div id="kane-configurator">
  <script>
    fetch('/apps/kane/configurator?product_id={{ product.id }}')
      .then(response => response.text())
      .then(html => {
        document.getElementById('kane-configurator').innerHTML = html;
      });
  </script>
</div>
```

---

## 🔧 **Configuration Options**

### **Environment Variables**

Add these to your Netlify environment:

```bash
SHOPIFY_CLIENT_ID=d4d69ee44cf2dd4522f73989a961c273
SHOPIFY_CLIENT_SECRET=3c4fbf1eb5b479e223c4f940871bd489
VITE_SHOPIFY_CLIENT_ID=d4d69ee44cf2dd4522f73989a961c273
```

### **Theme Settings**

Add to your theme's `settings_schema.json`:

```json
{
  "name": "KANE Configurator",
  "settings": [
    {
      "type": "text",
      "id": "kane_access_token",
      "label": "KANE Access Token",
      "info": "Your Shopify access token for live inventory"
    },
    {
      "type": "checkbox",
      "id": "kane_show_on_product",
      "label": "Show on Product Pages",
      "default": true
    }
  ]
}
```

---

## 📱 **Responsive Design**

### **Mobile-Friendly iframe**

```html
<div style="position: relative; width: 100%; padding-bottom: 75%; height: 0; overflow: hidden;">
  <iframe 
    src="https://kaneconfig.netlify.app/embed?shop={{ shop.permanent_domain }}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allowfullscreen>
  </iframe>
</div>
```

### **CSS for Responsive Embeds**

```css
.kane-embed-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.kane-embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

@media (max-width: 768px) {
  .kane-embed-container {
    padding-bottom: 75%; /* Taller on mobile */
  }
}
```

---

## 🎯 **Features by Embed Type**

| Feature | App Embed | iframe | App Proxy |
|---------|-----------|--------|-----------|
| **Live Inventory** | ✅ | ✅ | ✅ |
| **Dynamic Colorways** | ✅ | ✅ | ✅ |
| **Buy Button** | ✅ | ✅ | ✅ |
| **Share Function** | ✅ | ✅ | ✅ |
| **Theme Integration** | ✅ | ⚠️ | ✅ |
| **Easy Setup** | ⚠️ | ✅ | ⚠️ |
| **Performance** | ✅ | ⚠️ | ✅ |
| **SEO Friendly** | ✅ | ❌ | ✅ |

---

## 🚀 **Quick Start Recommendations**

### **For Beginners:**
Start with **Option 2 (iframe)** - it's the easiest to implement and test.

### **For Production:**
Use **Option 1 (App Embed)** for the best user experience and performance.

### **For Advanced Users:**
Consider **Option 3 (App Proxy)** if you need custom integration or server-side rendering.

---

## 🔍 **Testing Your Embed**

### **Test URLs:**

1. **Basic Embed**: `https://kaneconfig.netlify.app/embed`
2. **With Shop**: `https://kaneconfig.netlify.app/embed?shop=YOUR_SHOP.myshopify.com`
3. **Full Featured**: `https://kaneconfig.netlify.app/embed?shop=YOUR_SHOP.myshopify.com&product=123&token=YOUR_TOKEN`

### **Troubleshooting:**

**❌ Configurator not loading:**
- Check if your shop domain is correct
- Verify the access token is valid
- Check browser console for errors

**❌ No live inventory:**
- Ensure you're connected to Shopify in the admin panel
- Verify the product has variants with inventory
- Check that metafields are set up correctly

**❌ iframe not responsive:**
- Use the responsive CSS provided above
- Test on different screen sizes
- Adjust padding-bottom percentage as needed

---

## 🎨 **Customization**

### **Custom Styling**

You can customize the embed appearance by passing URL parameters:

```html
<!-- Dark theme, no share button, medium size -->
<iframe src="https://kaneconfig.netlify.app/embed?theme=dark&share=false&size=medium"></iframe>
```

### **Custom Events**

The embed can communicate with your page via `postMessage`:

```javascript
// Listen for configurator events
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://kaneconfig.netlify.app') return;
  
  if (event.data.type === 'KANE_DESIGN_CHANGED') {
    console.log('Design changed:', event.data.design);
  }
  
  if (event.data.type === 'KANE_BUY_CLICKED') {
    console.log('Buy button clicked:', event.data.product);
  }
});
```

---

## 📞 **Support**

If you need help setting up the embed:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Test with a simple iframe first before moving to app embeds
4. Contact support with specific error messages and your setup details

**Your KANE Configurator is ready to embed anywhere on your Shopify store!** 🎯✨
