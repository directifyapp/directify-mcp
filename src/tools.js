import { api, resolveDirectory } from './api.js';

// ─── Directories ───

export const listDirectories = {
  name: 'list_directories',
  description: 'List all directories owned by the authenticated user.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    const data = await api.get('/directories');
    return data.data || data;
  },
};

// ─── Categories ───

export const listCategories = {
  name: 'list_categories',
  description: 'List all active categories in a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID (optional if DIRECTIFY_DIRECTORY_ID is set)' },
    },
  },
  handler: async ({ directory_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/categories`);
    return data.data || data;
  },
};

export const getCategory = {
  name: 'get_category',
  description: 'Get details of a specific category.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      category_id: { type: 'string', description: 'Category ID' },
    },
    required: ['category_id'],
  },
  handler: async ({ directory_id, category_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/categories/${category_id}`);
    return data.data || data;
  },
};

export const createCategory = {
  name: 'create_category',
  description: 'Create a new category in a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      title: { type: 'string', description: 'Category title (required)' },
      slug: { type: 'string', description: 'URL slug (auto-generated if not set)' },
      description: { type: 'string', description: 'Category description' },
      content: { type: 'string', description: 'Category content (markdown)' },
      icon: { type: 'string', description: 'Icon (emoji or URL)' },
      custom_icon_url: { type: 'string', description: 'Custom icon image URL' },
      parent_id: { type: 'number', description: 'Parent category ID for nesting' },
      is_active: { type: 'boolean', description: 'Whether the category is active (default: true)' },
      order: { type: 'number', description: 'Sort order' },
      head_html: { type: 'string', description: 'Custom HTML injected into the <head> of the category page (e.g. hreflang tags, schema markup)' },
    },
    required: ['title'],
  },
  handler: async ({ directory_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.post(`/directories/${dir}/categories`, body);
    return data.data || data;
  },
};

export const updateCategory = {
  name: 'update_category',
  description: 'Update an existing category.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      category_id: { type: 'string', description: 'Category ID to update' },
      title: { type: 'string', description: 'Category title' },
      slug: { type: 'string', description: 'URL slug' },
      description: { type: 'string', description: 'Category description' },
      content: { type: 'string', description: 'Category content (markdown)' },
      icon: { type: 'string', description: 'Icon' },
      parent_id: { type: 'number', description: 'Parent category ID' },
      is_active: { type: 'boolean', description: 'Active status' },
      order: { type: 'number', description: 'Sort order' },
      head_html: { type: 'string', description: 'Custom HTML injected into the <head> of the category page (e.g. hreflang tags, schema markup)' },
    },
    required: ['category_id'],
  },
  handler: async ({ directory_id, category_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.put(`/directories/${dir}/categories/${category_id}`, body);
    return data.data || data;
  },
};

export const deleteCategory = {
  name: 'delete_category',
  description: 'Delete a category from a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      category_id: { type: 'string', description: 'Category ID to delete' },
    },
    required: ['category_id'],
  },
  handler: async ({ directory_id, category_id }) => {
    const dir = resolveDirectory(directory_id);
    await api.delete(`/directories/${dir}/categories/${category_id}`);
    return { success: true, message: `Category ${category_id} deleted.` };
  },
};

// ─── Tags ───

export const listTags = {
  name: 'list_tags',
  description: 'List all active tags in a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
    },
  },
  handler: async ({ directory_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/tags`);
    return data.data || data;
  },
};

export const getTag = {
  name: 'get_tag',
  description: 'Get details of a specific tag.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      tag_id: { type: 'string', description: 'Tag ID' },
    },
    required: ['tag_id'],
  },
  handler: async ({ directory_id, tag_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/tags/${tag_id}`);
    return data.data || data;
  },
};

export const createTag = {
  name: 'create_tag',
  description: 'Create a new tag in a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      title: { type: 'string', description: 'Tag title (required)' },
      slug: { type: 'string', description: 'URL slug' },
      color: { type: 'string', description: 'Background color (hex, e.g. #f59e0b)' },
      text_color: { type: 'string', description: 'Text color (hex)' },
      icon: { type: 'string', description: 'Icon' },
      heroicon: { type: 'string', description: 'Heroicon name' },
      is_active: { type: 'boolean', description: 'Active status (default: true)' },
    },
    required: ['title'],
  },
  handler: async ({ directory_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.post(`/directories/${dir}/tags`, body);
    return data.data || data;
  },
};

export const updateTag = {
  name: 'update_tag',
  description: 'Update an existing tag.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      tag_id: { type: 'string', description: 'Tag ID to update' },
      title: { type: 'string', description: 'Tag title' },
      slug: { type: 'string', description: 'URL slug' },
      color: { type: 'string', description: 'Background color (hex)' },
      text_color: { type: 'string', description: 'Text color (hex)' },
      is_active: { type: 'boolean', description: 'Active status' },
    },
    required: ['tag_id'],
  },
  handler: async ({ directory_id, tag_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.put(`/directories/${dir}/tags/${tag_id}`, body);
    return data.data || data;
  },
};

export const deleteTag = {
  name: 'delete_tag',
  description: 'Delete a tag from a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      tag_id: { type: 'string', description: 'Tag ID to delete' },
    },
    required: ['tag_id'],
  },
  handler: async ({ directory_id, tag_id }) => {
    const dir = resolveDirectory(directory_id);
    await api.delete(`/directories/${dir}/tags/${tag_id}`);
    return { success: true, message: `Tag ${tag_id} deleted.` };
  },
};

// ─── Custom Fields ───

export const listCustomFields = {
  name: 'list_custom_fields',
  description: 'List all custom fields defined for a directory. Use this to know which field names to set when creating/updating listings.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
    },
  },
  handler: async ({ directory_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/custom-fields`);
    return data.data || data;
  },
};

// ─── Listings ───

export const listListings = {
  name: 'list_listings',
  description: 'List all listings in a directory (paginated, 100 per page).',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      page: { type: 'number', description: 'Page number (default: 1)' },
    },
  },
  handler: async ({ directory_id, page = 1 }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/projects?page=${page}`);
    return data;
  },
};

export const getListing = {
  name: 'get_listing',
  description: 'Get full details of a specific listing, including custom field values.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      listing_id: { type: 'string', description: 'Listing ID' },
    },
    required: ['listing_id'],
  },
  handler: async ({ directory_id, listing_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/projects/${listing_id}`);
    return data.data || data;
  },
};

export const createListing = {
  name: 'create_listing',
  description:
    'Create a new listing in a directory. You can include custom field values by using the field name as a key (use list_custom_fields to see available fields).',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      name: { type: 'string', description: 'Listing name (required)' },
      url: { type: 'string', description: 'Website URL' },
      slug: { type: 'string', description: 'URL slug' },
      description: { type: 'string', description: 'Short description' },
      content: { type: 'string', description: 'Full content (markdown)' },
      image_url: { type: 'string', description: 'Cover image URL' },
      logo_url: { type: 'string', description: 'Logo URL' },
      phone_number: { type: 'string', description: 'Phone number' },
      email: { type: 'string', description: 'Email address' },
      address: { type: 'string', description: 'Physical address' },
      latitude: { type: 'number', description: 'Latitude' },
      longitude: { type: 'number', description: 'Longitude' },
      categories: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of category IDs',
      },
      tags: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of tag IDs',
      },
      is_active: { type: 'boolean', description: 'Active status (default: true)' },
      is_featured: { type: 'boolean', description: 'Featured status' },
      custom_fields: {
        type: 'object',
        description: 'Custom field values as key-value pairs (e.g. {"price_range": "2", "cuisine_type": "Italian"})',
        additionalProperties: true,
      },
    },
    required: ['name'],
  },
  handler: async ({ directory_id, custom_fields, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const payload = { ...body, ...custom_fields };
    const data = await api.post(`/directories/${dir}/projects`, payload);
    return data.data || data;
  },
};

export const updateListing = {
  name: 'update_listing',
  description: 'Update an existing listing. Only pass fields you want to change.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      listing_id: { type: 'string', description: 'Listing ID to update' },
      name: { type: 'string', description: 'Listing name' },
      url: { type: 'string', description: 'Website URL' },
      slug: { type: 'string', description: 'URL slug' },
      description: { type: 'string', description: 'Short description' },
      content: { type: 'string', description: 'Full content (markdown)' },
      image_url: { type: 'string', description: 'Cover image URL' },
      logo_url: { type: 'string', description: 'Logo URL' },
      phone_number: { type: 'string', description: 'Phone number' },
      email: { type: 'string', description: 'Email address' },
      address: { type: 'string', description: 'Physical address' },
      latitude: { type: 'number', description: 'Latitude' },
      longitude: { type: 'number', description: 'Longitude' },
      categories: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of category IDs',
      },
      tags: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of tag IDs',
      },
      is_active: { type: 'boolean', description: 'Active status' },
      is_featured: { type: 'boolean', description: 'Featured status' },
      custom_fields: {
        type: 'object',
        description: 'Custom field values as key-value pairs',
        additionalProperties: true,
      },
    },
    required: ['listing_id'],
  },
  handler: async ({ directory_id, listing_id, custom_fields, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const payload = { ...body, ...custom_fields };
    const data = await api.put(`/directories/${dir}/projects/${listing_id}`, payload);
    return data.data || data;
  },
};

export const deleteListing = {
  name: 'delete_listing',
  description: 'Delete a listing from a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      listing_id: { type: 'string', description: 'Listing ID to delete' },
    },
    required: ['listing_id'],
  },
  handler: async ({ directory_id, listing_id }) => {
    const dir = resolveDirectory(directory_id);
    await api.delete(`/directories/${dir}/projects/${listing_id}`);
    return { success: true, message: `Listing ${listing_id} deleted.` };
  },
};

export const checkListingExists = {
  name: 'check_listing_exists',
  description: 'Check if a listing with a given URL already exists in the directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      url: { type: 'string', description: 'URL to check' },
    },
    required: ['url'],
  },
  handler: async ({ directory_id, url }) => {
    const dir = resolveDirectory(directory_id);
    try {
      const data = await api.post(`/directories/${dir}/projects/exists`, { url });
      return { exists: false, message: data.message };
    } catch (err) {
      if (err.message.includes('already exists')) {
        return { exists: true, message: err.message };
      }
      throw err;
    }
  },
};

export const bulkCreateListings = {
  name: 'bulk_create_listings',
  description: 'Create multiple listings at once (max 100 per request).',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      listings: {
        type: 'array',
        description: 'Array of listing objects (each must have at least a "name" field)',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            url: { type: 'string' },
            description: { type: 'string' },
            categories: { type: 'array', items: { type: 'number' } },
            tags: { type: 'array', items: { type: 'number' } },
          },
          required: ['name'],
          additionalProperties: true,
        },
      },
    },
    required: ['listings'],
  },
  handler: async ({ directory_id, listings }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.post(`/directories/${dir}/projects/bulk`, { listings });
    return data;
  },
};

// ─── Articles ───

export const listArticles = {
  name: 'list_articles',
  description: 'List all blog articles in a directory (paginated).',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      page: { type: 'number', description: 'Page number (default: 1)' },
    },
  },
  handler: async ({ directory_id, page = 1 }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/articles?page=${page}`);
    return data;
  },
};

export const getArticle = {
  name: 'get_article',
  description: 'Get full details of a specific article.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      article_id: { type: 'string', description: 'Article ID' },
    },
    required: ['article_id'],
  },
  handler: async ({ directory_id, article_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/articles/${article_id}`);
    return data.data || data;
  },
};

export const createArticle = {
  name: 'create_article',
  description: 'Create a new blog article. Provide either "content" (HTML) or "markdown" for the body.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      title: { type: 'string', description: 'Article title (required)' },
      slug: { type: 'string', description: 'URL slug (auto-generated from title if not set)' },
      content: { type: 'string', description: 'HTML content' },
      markdown: { type: 'string', description: 'Markdown content' },
      active: { type: 'boolean', description: 'Published status (default: true)' },
      thumbnail_url: { type: 'string', description: 'Thumbnail image URL' },
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Category names (strings, not IDs)',
      },
      seo_title: { type: 'string', description: 'SEO title' },
      seo_description: { type: 'string', description: 'SEO meta description' },
    },
    required: ['title'],
  },
  handler: async ({ directory_id, seo_title, seo_description, ...body }) => {
    const dir = resolveDirectory(directory_id);
    if (seo_title || seo_description) {
      body.seo = {};
      if (seo_title) body.seo.title = seo_title;
      if (seo_description) body.seo.description = seo_description;
    }
    const data = await api.post(`/directories/${dir}/articles`, body);
    return data.data || data;
  },
};

export const updateArticle = {
  name: 'update_article',
  description: 'Update an existing article. Only pass fields you want to change.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      article_id: { type: 'string', description: 'Article ID to update' },
      title: { type: 'string', description: 'Article title' },
      slug: { type: 'string', description: 'URL slug' },
      content: { type: 'string', description: 'HTML content' },
      markdown: { type: 'string', description: 'Markdown content' },
      active: { type: 'boolean', description: 'Published status' },
      thumbnail_url: { type: 'string', description: 'Thumbnail image URL' },
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Category names',
      },
      seo_title: { type: 'string', description: 'SEO title' },
      seo_description: { type: 'string', description: 'SEO meta description' },
    },
    required: ['article_id'],
  },
  handler: async ({ directory_id, article_id, seo_title, seo_description, ...body }) => {
    const dir = resolveDirectory(directory_id);
    if (seo_title || seo_description) {
      body.seo = {};
      if (seo_title) body.seo.title = seo_title;
      if (seo_description) body.seo.description = seo_description;
    }
    const data = await api.put(`/directories/${dir}/articles/${article_id}`, body);
    return data.data || data;
  },
};

export const deleteArticle = {
  name: 'delete_article',
  description: 'Delete an article from a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      article_id: { type: 'string', description: 'Article ID to delete' },
    },
    required: ['article_id'],
  },
  handler: async ({ directory_id, article_id }) => {
    const dir = resolveDirectory(directory_id);
    await api.delete(`/directories/${dir}/articles/${article_id}`);
    return { success: true, message: `Article ${article_id} deleted.` };
  },
};

export const toggleArticle = {
  name: 'toggle_article',
  description: 'Toggle an article between active and inactive status.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      article_id: { type: 'string', description: 'Article ID to toggle' },
    },
    required: ['article_id'],
  },
  handler: async ({ directory_id, article_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.patch(`/directories/${dir}/articles/${article_id}/toggle`);
    return data.data || data;
  },
};

// ─── Custom Pages ───

export const listPages = {
  name: 'list_pages',
  description: 'List all custom pages in a directory. Custom pages are for static content like About, Terms, comparison pages, etc.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
    },
  },
  handler: async ({ directory_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/pages`);
    return data;
  },
};

export const getPage = {
  name: 'get_page',
  description: 'Get full details of a specific custom page.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      page_id: { type: 'string', description: 'Page ID' },
    },
    required: ['page_id'],
  },
  handler: async ({ directory_id, page_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/pages/${page_id}`);
    return data.data || data;
  },
};

export const createPage = {
  name: 'create_page',
  description: 'Create a custom page. Great for programmatic SEO pages (comparisons, location pages), About, Terms, etc. Content is markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      title: { type: 'string', description: 'Page title (required)' },
      slug: { type: 'string', description: 'URL slug (auto-generated from title if not set)' },
      markdown: { type: 'string', description: 'Page content in markdown' },
      placement: { type: 'string', enum: ['navbar', 'footer', 'sidebar', 'unlisted'], description: 'Where the page link appears (default: unlisted)' },
      is_published: { type: 'boolean', description: 'Published status (default: true)' },
      order: { type: 'number', description: 'Sort order for navigation' },
      seo_title: { type: 'string', description: 'SEO title' },
      seo_description: { type: 'string', description: 'SEO meta description' },
    },
    required: ['title'],
  },
  handler: async ({ directory_id, seo_title, seo_description, ...body }) => {
    const dir = resolveDirectory(directory_id);
    if (seo_title || seo_description) {
      body.seo = {};
      if (seo_title) body.seo.title = seo_title;
      if (seo_description) body.seo.description = seo_description;
    }
    const data = await api.post(`/directories/${dir}/pages`, body);
    return data.data || data;
  },
};

export const updatePage = {
  name: 'update_page',
  description: 'Update an existing custom page. Only pass fields you want to change.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      page_id: { type: 'string', description: 'Page ID to update' },
      title: { type: 'string', description: 'Page title' },
      slug: { type: 'string', description: 'URL slug' },
      markdown: { type: 'string', description: 'Page content in markdown' },
      placement: { type: 'string', enum: ['navbar', 'footer', 'sidebar', 'unlisted'], description: 'Where the page link appears' },
      is_published: { type: 'boolean', description: 'Published status' },
      order: { type: 'number', description: 'Sort order for navigation' },
      seo_title: { type: 'string', description: 'SEO title' },
      seo_description: { type: 'string', description: 'SEO meta description' },
    },
    required: ['page_id'],
  },
  handler: async ({ directory_id, page_id, seo_title, seo_description, ...body }) => {
    const dir = resolveDirectory(directory_id);
    if (seo_title || seo_description) {
      body.seo = {};
      if (seo_title) body.seo.title = seo_title;
      if (seo_description) body.seo.description = seo_description;
    }
    const data = await api.put(`/directories/${dir}/pages/${page_id}`, body);
    return data.data || data;
  },
};

export const deletePage = {
  name: 'delete_page',
  description: 'Delete a custom page from a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      page_id: { type: 'string', description: 'Page ID to delete' },
    },
    required: ['page_id'],
  },
  handler: async ({ directory_id, page_id }) => {
    const dir = resolveDirectory(directory_id);
    await api.delete(`/directories/${dir}/pages/${page_id}`);
    return { success: true, message: `Page ${page_id} deleted.` };
  },
};

export const togglePage = {
  name: 'toggle_page',
  description: 'Toggle a custom page between published and unpublished status.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      page_id: { type: 'string', description: 'Page ID to toggle' },
    },
    required: ['page_id'],
  },
  handler: async ({ directory_id, page_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.patch(`/directories/${dir}/pages/${page_id}/toggle`);
    return data.data || data;
  },
};

// ─── Organizers ───

export const listOrganizers = {
  name: 'list_organizers',
  description: 'List all organizers in a directory, including their associated listings.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
    },
  },
  handler: async ({ directory_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/organizers`);
    return data.data || data;
  },
};

export const getOrganizer = {
  name: 'get_organizer',
  description: 'Get details of a specific organizer, including their associated listings.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      organizer_id: { type: 'string', description: 'Organizer ID' },
    },
    required: ['organizer_id'],
  },
  handler: async ({ directory_id, organizer_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/organizers/${organizer_id}`);
    return data.data || data;
  },
};

export const createOrganizer = {
  name: 'create_organizer',
  description: 'Create a new organizer in a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      name: { type: 'string', description: 'Organizer name (required)' },
      slug: { type: 'string', description: 'URL slug (auto-generated from name if not provided)' },
      description: { type: 'string', description: 'Description' },
      email: { type: 'string', description: 'Contact email address' },
      phone: { type: 'string', description: 'Contact phone number' },
      website_url: { type: 'string', description: 'Website URL' },
      social_links: { type: 'object', description: 'Social links as key-value pairs (e.g. {Twitter: "https://..."})' },
      user_id: { type: 'number', description: 'User ID to assign as organizer owner (for submitter dashboard access)' },
      is_active: { type: 'boolean', description: 'Active status (default: true)' },
      order: { type: 'number', description: 'Sort order (default: 0)' },
    },
    required: ['name'],
  },
  handler: async ({ directory_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.post(`/directories/${dir}/organizers`, body);
    return data.data || data;
  },
};

export const updateOrganizer = {
  name: 'update_organizer',
  description: 'Update an existing organizer.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      organizer_id: { type: 'string', description: 'Organizer ID to update' },
      name: { type: 'string', description: 'Organizer name' },
      slug: { type: 'string', description: 'URL slug' },
      description: { type: 'string', description: 'Description' },
      email: { type: 'string', description: 'Contact email address' },
      phone: { type: 'string', description: 'Contact phone number' },
      website_url: { type: 'string', description: 'Website URL' },
      social_links: { type: 'object', description: 'Social links as key-value pairs' },
      user_id: { type: 'number', description: 'User ID to assign as organizer owner' },
      is_active: { type: 'boolean', description: 'Active status' },
      order: { type: 'number', description: 'Sort order' },
    },
    required: ['organizer_id'],
  },
  handler: async ({ directory_id, organizer_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.put(`/directories/${dir}/organizers/${organizer_id}`, body);
    return data.data || data;
  },
};

export const deleteOrganizer = {
  name: 'delete_organizer',
  description: 'Delete an organizer from a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      organizer_id: { type: 'string', description: 'Organizer ID to delete' },
    },
    required: ['organizer_id'],
  },
  handler: async ({ directory_id, organizer_id }) => {
    const dir = resolveDirectory(directory_id);
    await api.delete(`/directories/${dir}/organizers/${organizer_id}`);
    return { success: true, message: `Organizer ${organizer_id} deleted.` };
  },
};

// ─── Export all tools ───

export const allTools = [
  listDirectories,
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  listCustomFields,
  listListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  checkListingExists,
  bulkCreateListings,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleArticle,
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  togglePage,
  listOrganizers,
  getOrganizer,
  createOrganizer,
  updateOrganizer,
  deleteOrganizer,
];
