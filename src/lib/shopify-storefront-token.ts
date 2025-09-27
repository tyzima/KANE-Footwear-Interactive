// Shopify Storefront Access Token Management
// This creates a Storefront API token programmatically using the Admin API

import { makeShopifyRequest } from './shopify';

export interface StorefrontTokenResult {
  accessToken: string;
  accessScopes: string[];
  title: string;
  id: string;
}

// Create a new Storefront access token using Admin API
export const createStorefrontAccessToken = async (title: string = 'KANE Configurator Token'): Promise<StorefrontTokenResult> => {
  const mutation = `
    mutation StorefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
      storefrontAccessTokenCreate(input: $input) {
        userErrors {
          field
          message
        }
        storefrontAccessToken {
          id
          accessToken
          accessScopes {
            handle
          }
          title
          createdAt
        }
      }
    }
  `;

  const variables = {
    input: {
      title: title
    }
  };

  try {
    const response = await makeShopifyRequest(mutation, variables);
    
    if (response.data?.storefrontAccessTokenCreate?.userErrors?.length > 0) {
      const errors = response.data.storefrontAccessTokenCreate.userErrors;
      throw new Error(`Failed to create Storefront token: ${errors.map((e: any) => e.message).join(', ')}`);
    }

    const tokenData = response.data?.storefrontAccessTokenCreate?.storefrontAccessToken;
    
    if (!tokenData) {
      throw new Error('No token data returned from Shopify');
    }

    return {
      accessToken: tokenData.accessToken,
      accessScopes: tokenData.accessScopes.map((scope: any) => scope.handle),
      title: tokenData.title,
      id: tokenData.id
    };
  } catch (error) {
    console.error('Error creating Storefront access token:', error);
    throw error;
  }
};

// List existing Storefront access tokens
export const listStorefrontAccessTokens = async () => {
  const query = `
    query {
      shop {
        storefrontAccessTokens(first: 50) {
          edges {
            node {
              id
              accessToken
              accessScopes {
                handle
              }
              title
              createdAt
            }
          }
        }
      }
    }
  `;

  try {
    const response = await makeShopifyRequest(query);
    const tokens = response.data?.shop?.storefrontAccessTokens?.edges?.map((edge: any) => ({
      id: edge.node.id,
      accessToken: edge.node.accessToken,
      accessScopes: edge.node.accessScopes.map((scope: any) => scope.handle),
      title: edge.node.title,
      createdAt: edge.node.createdAt
    })) || [];

    return tokens;
  } catch (error) {
    console.error('Error listing Storefront access tokens:', error);
    throw error;
  }
};

// Delete a Storefront access token
export const deleteStorefrontAccessToken = async (tokenId: string) => {
  const mutation = `
    mutation StorefrontAccessTokenDelete($input: StorefrontAccessTokenDeleteInput!) {
      storefrontAccessTokenDelete(input: $input) {
        deletedStorefrontAccessTokenId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: tokenId
    }
  };

  try {
    const response = await makeShopifyRequest(mutation, variables);
    
    if (response.data?.storefrontAccessTokenDelete?.userErrors?.length > 0) {
      const errors = response.data.storefrontAccessTokenDelete.userErrors;
      throw new Error(`Failed to delete Storefront token: ${errors.map((e: any) => e.message).join(', ')}`);
    }

    return response.data?.storefrontAccessTokenDelete?.deletedStorefrontAccessTokenId;
  } catch (error) {
    console.error('Error deleting Storefront access token:', error);
    throw error;
  }
};
