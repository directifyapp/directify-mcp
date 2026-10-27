import { api, resolveDirectory } from './api.js';

// ─── Article SEO ───
// The articles endpoint takes SEO as a nested `seo` object, but flat `seo_*` tool
// args are far easier for a model to fill in. Map one onto the other.

const ARTICLE_SEO_PROPERTIES = {
  seo_title: { type: 'string', description: 'SEO title' },
  seo_description: { type: 'string', description: 'SEO meta description' },
  seo_keywords: { type: 'string', description: 'SEO keywords (comma-separated)' },
  seo_og_title: { type: 'string', description: 'Open Graph title' },
  seo_og_description: { type: 'string', description: 'Open Graph description' },
  seo_og_image: { type: 'string', description: 'Open Graph image URL' },
  seo_twitter_title: { type: 'string', description: 'Twitter card title' },
  seo_twitter_description: { type: 'string', description: 'Twitter card description' },
  seo_twitter_image: { type: 'string', description: 'Twitter card image URL' },
  seo_canonical: { type: 'string', description: "Canonical URL (leave empty to use the article's own URL)" },
};

const ARTICLE_SEO_KEYS = {
  seo_title: 'title',
  seo_description: 'description',
  seo_keywords: 'keywords',
  seo_og_title: 'og_title',
  seo_og_description: 'og_description',
  seo_og_image: 'og_image',
  seo_twitter_title: 'twitter_title',
  seo_twitter_description: 'twitter_description',
  seo_twitter_image: 'twitter_image',
  seo_canonical: 'canonical',
};

function splitArticleSeo(input) {
  const body = {};
  const seo = {};

  for (const [key, value] of Object.entries(input)) {
    const seoKey = ARTICLE_SEO_KEYS[key];
    if (!seoKey) {
      body[key] = value;
    } else if (value !== undefined) {
      seo[seoKey] = value;
    }
  }

  return Object.keys(seo).length > 0 ? { ...body, seo } : body;
}

// ─── Multi-language ───
// Multilingual directories: GETs accept ?locale=<code> to read text fields in that
// language; writes take a `translations` object ({"es": {"name": "…"}}) instead.
// ?locale is never sent on writes (the API answers 422).

const LOCALE_PROPERTY = {
  type: 'string',
  description:
    "Language code of this directory (see list_languages). Text fields come back in that language (its translation where one exists, else the original). Omit to get records as stored. An unknown code returns a 422 listing the directory's language codes.",
};

function translationsProperty(fields, exampleField = fields.split(',')[0].trim()) {
  return {
    type: 'object',
    description: `Translations for multilingual directories, keyed by language code (see list_languages) → { field: text }, e.g. {"es": {"${exampleField}": "…"}}. Translatable text fields: ${fields}. A field that can't be translated returns a 422 naming the allowed ones. Pass null for a field to remove that translation. The record's own language can't be a key (422: send those fields at the top level instead).`,
    additionalProperties: {
      type: 'object',
      additionalProperties: { type: ['string', 'null'] },
    },
  };
}

const LISTING_TRANSLATABLE = 'name, slug, description, content, seo_title, seo_description';
const CATEGORY_TRANSLATABLE = 'title, slug, display_name, description, content, filter_group, seo_title, seo_description';
const CUSTOM_FIELD_TRANSLATABLE = 'label, placeholder, description, value_prefix, value_suffix';
const ARTICLE_TRANSLATABLE = 'title, slug, content, markdown, seo_title, seo_description';
const PAGE_TRANSLATABLE = 'title, slug, markdown, seo_title, seo_description';
const ORGANIZER_TRANSLATABLE = 'name, slug, description, content';

const SOURCE_LOCALE_PROPERTY = {
  type: 'string',
  description:
    "Language code the listing's own (top-level) fields are written in (default: the directory's default language; see list_languages). When set to another language, `translations` may include the default language's code.",
};

function withQuery(path, params) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `${path}?${query}` : path;
}

export const SERVER_INSTRUCTIONS = [
  'Directify: manage directories and their listings, categories, tags, custom fields, organizers, custom pages, blog articles and theme (design).',
  'Multi-language: a directory has a default language (the language records\' own fields are written in) and may have extra languages. Before reading or writing content of a multilingual directory, call list_languages to get its language codes.',
  'To read content in a language, pass `locale` to list/get tools. Responses of multilingual directories include a `translations` object per record ({"es": {"name": "…"}}); listings also include `source_locale` (null = the default language).',
  'To write translations, pass `translations` (keyed by language code) to create/update tools; never use the record\'s own language as a key. A listing written in a non-default language takes `source_locale`.',
  'Design: get_theme reads everything the Theme Editor controls plus the valid options for the directory\'s template; update_theme changes any part of it and is live at once; preview_theme screenshots a page so you can check the result. Always call get_theme before update_theme.',
].join('\n\n');

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

export const listLanguages = {
  name: 'list_languages',
  description:
    "List a directory's languages: its default language (the language records' own fields are written in) and the extra languages translations can be written in, with each language's code, name, RTL flag and URL, plus the languages new listings are auto-translated into and the do-not-translate glossary. Call this first when working with a multilingual directory: use the codes as `locale` on list/get tools and as keys of `translations` on create/update tools.",
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID (optional if DIRECTIFY_DIRECTORY_ID is set)' },
    },
  },
  handler: async ({ directory_id }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/languages`);
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
      locale: LOCALE_PROPERTY,
    },
  },
  handler: async ({ directory_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/categories`, { locale }));
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
      locale: LOCALE_PROPERTY,
    },
    required: ['category_id'],
  },
  handler: async ({ directory_id, category_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/categories/${category_id}`, { locale }));
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
      show_on_sidebar: { type: 'boolean', description: 'Whether the category shows in the sidebar (default: true)' },
      order: { type: 'number', description: 'Sort order' },
      seo_title: { type: 'string', description: 'SEO title for the category page' },
      seo_description: { type: 'string', description: 'SEO meta description for the category page' },
      head_html: { type: 'string', description: 'Custom HTML injected into the <head> of the category page (e.g. hreflang tags, schema markup)' },
      translations: translationsProperty(CATEGORY_TRANSLATABLE),
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
      custom_icon_url: { type: 'string', description: 'Custom icon image URL' },
      parent_id: { type: 'number', description: 'Parent category ID' },
      is_active: { type: 'boolean', description: 'Active status' },
      show_on_sidebar: { type: 'boolean', description: 'Whether the category shows in the sidebar' },
      order: { type: 'number', description: 'Sort order' },
      seo_title: { type: 'string', description: 'SEO title for the category page' },
      seo_description: { type: 'string', description: 'SEO meta description for the category page' },
      head_html: { type: 'string', description: 'Custom HTML injected into the <head> of the category page (e.g. hreflang tags, schema markup)' },
      translations: translationsProperty(CATEGORY_TRANSLATABLE),
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
      locale: LOCALE_PROPERTY,
    },
  },
  handler: async ({ directory_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/tags`, { locale }));
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
      locale: LOCALE_PROPERTY,
    },
    required: ['tag_id'],
  },
  handler: async ({ directory_id, tag_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/tags/${tag_id}`, { locale }));
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
      show_title: { type: 'boolean', description: "Show the tag's title on the tag pill" },
      show_icon: { type: 'boolean', description: "Show the tag's icon on the tag pill" },
      is_active: { type: 'boolean', description: 'Active status (default: true)' },
      translations: translationsProperty('text fields such as title', 'title'),
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
      icon: { type: 'string', description: 'Icon' },
      heroicon: { type: 'string', description: 'Heroicon name' },
      show_title: { type: 'boolean', description: "Show the tag's title on the tag pill" },
      show_icon: { type: 'boolean', description: "Show the tag's icon on the tag pill" },
      is_active: { type: 'boolean', description: 'Active status' },
      translations: translationsProperty('text fields such as title', 'title'),
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
      locale: LOCALE_PROPERTY,
    },
  },
  handler: async ({ directory_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/custom-fields`, { locale }));
    return data.data || data;
  },
};

const CUSTOM_FIELD_TYPES = [
  'text', 'number', 'date', 'file_upload', 'url', 'email', 'rich_editor',
  'markdown', 'textarea', 'checkbox', 'rating', 'select', 'list',
  'multi_select', 'button', 'javascript', 'html',
];

const CUSTOM_FIELD_PLACEMENTS = ['after_tags', 'after_categories', 'before_content', 'after_content'];

const CUSTOM_FIELD_PLACEMENTS_ON_CARD = [
  'after_categories', 'before_categories', 'after_buttons', 'before_buttons', 'after_title',
];

export const getCustomField = {
  name: 'get_custom_field',
  description: 'Get the definition of a specific custom field.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      custom_field_id: { type: 'string', description: 'Custom field ID' },
      locale: LOCALE_PROPERTY,
    },
    required: ['custom_field_id'],
  },
  handler: async ({ directory_id, custom_field_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/custom-fields/${custom_field_id}`, { locale }));
    return data.data || data;
  },
};

export const createCustomField = {
  name: 'create_custom_field',
  description:
    'Create a new custom field definition for a directory. Field values are then set on listings by passing the field name as a key (see create_listing / update_listing).',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      label: { type: 'string', description: 'Human-readable field label (shown to users)' },
      type: { type: 'string', enum: CUSTOM_FIELD_TYPES, description: 'Field type' },
      name: { type: 'string', description: 'Machine name/key used when setting values (auto-derived from label, snake_cased, if omitted)' },
      fieldable_type: { type: 'string', enum: ['listing', 'organizer', 'article'], description: 'What the field attaches to (default: listing)' },
      placeholder: { type: 'string', description: 'Input placeholder text' },
      description: { type: 'string', description: 'Help text shown under the field' },
      default_value: { type: 'string', description: 'Default value' },
      value_prefix: { type: 'string', description: 'Prefix shown before the value (e.g. "$")' },
      value_suffix: { type: 'string', description: 'Suffix shown after the value (e.g. "/mo")' },
      options: { type: 'array', items: { type: 'string' }, description: 'Options for select / multi_select / list field types' },
      icon: { type: 'string', description: 'Icon (emoji or URL) shown next to the value' },
      heroicon: { type: 'string', description: 'Heroicon name shown next to the value (e.g. heroicon-o-currency-dollar)' },
      placement: { type: 'string', enum: CUSTOM_FIELD_PLACEMENTS, description: 'Where the field renders on the listing page' },
      placement_on_card: { type: 'string', enum: CUSTOM_FIELD_PLACEMENTS_ON_CARD, description: 'Where the field renders on a listing card' },
      is_required: { type: 'boolean', description: 'Whether the field is required' },
      is_visible: { type: 'boolean', description: 'Whether the field is shown on the listing page (default: true)' },
      show_on_card: { type: 'boolean', description: 'Show the value on listing cards' },
      show_on_public_submission: { type: 'boolean', description: 'Show the field on the public submission form' },
      show_label: { type: 'boolean', description: 'Show the field label on the listing page' },
      show_label_on_card: { type: 'boolean', description: 'Show the field label on listing cards' },
      show_icon: { type: 'boolean', description: 'Show the field icon on the listing page' },
      show_icon_on_card: { type: 'boolean', description: 'Show the field icon on listing cards' },
      filterable: { type: 'boolean', description: 'Allow filtering listings by this field' },
      order: { type: 'number', description: 'Sort order among fields' },
      settings: { type: 'object', description: 'Extra per-type settings as key-value pairs' },
      validation_rules: { type: 'array', items: { type: 'string' }, description: 'Extra Laravel validation rules (e.g. ["min:3", "max:80"])' },
      translations: translationsProperty(CUSTOM_FIELD_TRANSLATABLE),
    },
    required: ['label', 'type'],
  },
  handler: async ({ directory_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.post(`/directories/${dir}/custom-fields`, body);
    return data.data || data;
  },
};

export const updateCustomField = {
  name: 'update_custom_field',
  description: 'Update an existing custom field definition. Only pass fields you want to change.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      custom_field_id: { type: 'string', description: 'Custom field ID to update' },
      label: { type: 'string', description: 'Human-readable field label' },
      type: { type: 'string', enum: CUSTOM_FIELD_TYPES, description: 'Field type' },
      name: { type: 'string', description: 'Machine name/key used when setting values' },
      fieldable_type: { type: 'string', enum: ['listing', 'organizer', 'article'], description: 'What the field attaches to' },
      placeholder: { type: 'string', description: 'Input placeholder text' },
      description: { type: 'string', description: 'Help text shown under the field' },
      default_value: { type: 'string', description: 'Default value' },
      value_prefix: { type: 'string', description: 'Prefix shown before the value' },
      value_suffix: { type: 'string', description: 'Suffix shown after the value' },
      options: { type: 'array', items: { type: 'string' }, description: 'Options for select / multi_select / list field types' },
      icon: { type: 'string', description: 'Icon (emoji or URL) shown next to the value' },
      heroicon: { type: 'string', description: 'Heroicon name shown next to the value' },
      placement: { type: 'string', enum: CUSTOM_FIELD_PLACEMENTS, description: 'Where the field renders on the listing page' },
      placement_on_card: { type: 'string', enum: CUSTOM_FIELD_PLACEMENTS_ON_CARD, description: 'Where the field renders on a listing card' },
      is_required: { type: 'boolean', description: 'Whether the field is required' },
      is_visible: { type: 'boolean', description: 'Whether the field is shown on the listing page' },
      show_on_card: { type: 'boolean', description: 'Show the value on listing cards' },
      show_on_public_submission: { type: 'boolean', description: 'Show the field on the public submission form' },
      show_label: { type: 'boolean', description: 'Show the field label on the listing page' },
      show_label_on_card: { type: 'boolean', description: 'Show the field label on listing cards' },
      show_icon: { type: 'boolean', description: 'Show the field icon on the listing page' },
      show_icon_on_card: { type: 'boolean', description: 'Show the field icon on listing cards' },
      filterable: { type: 'boolean', description: 'Allow filtering listings by this field' },
      order: { type: 'number', description: 'Sort order among fields' },
      settings: { type: 'object', description: 'Extra per-type settings as key-value pairs' },
      validation_rules: { type: 'array', items: { type: 'string' }, description: 'Extra Laravel validation rules (e.g. ["min:3", "max:80"])' },
      translations: translationsProperty(CUSTOM_FIELD_TRANSLATABLE),
    },
    required: ['custom_field_id'],
  },
  handler: async ({ directory_id, custom_field_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.put(`/directories/${dir}/custom-fields/${custom_field_id}`, body);
    return data.data || data;
  },
};

export const deleteCustomField = {
  name: 'delete_custom_field',
  description: 'Delete a custom field definition from a directory. This also removes the field\'s values from all listings.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      custom_field_id: { type: 'string', description: 'Custom field ID to delete' },
    },
    required: ['custom_field_id'],
  },
  handler: async ({ directory_id, custom_field_id }) => {
    const dir = resolveDirectory(directory_id);
    await api.delete(`/directories/${dir}/custom-fields/${custom_field_id}`);
    return { success: true, message: `Custom field ${custom_field_id} deleted.` };
  },
};

// ─── Listings ───

export const listListings = {
  name: 'list_listings',
  description:
    'List all listings in a directory (paginated, 100 per page). For multilingual directories, call list_languages first and pass `locale` to read listings in one language; each listing also carries `translations` and `source_locale`.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      page: { type: 'number', description: 'Page number (default: 1)' },
      locale: LOCALE_PROPERTY,
    },
  },
  handler: async ({ directory_id, page = 1, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/projects`, { page, locale }));
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
      locale: LOCALE_PROPERTY,
    },
    required: ['listing_id'],
  },
  handler: async ({ directory_id, listing_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/projects/${listing_id}`, { locale }));
    return data.data || data;
  },
};

export const createListing = {
  name: 'create_listing',
  description:
    'Create a new listing in a directory. IMPORTANT: the URL is a unique key per directory — if a listing with the same URL already exists, that listing is UPDATED (overwritten) instead of a new one being created. Give each listing its own unique URL (e.g. the specific product page, not a shared homepage), or omit the URL to always create a new listing. You can include custom field values by using the field name as a key (use list_custom_fields to see available fields). Link the listing to organizers by passing their IDs (use list_organizers to find them). Multilingual directories: call list_languages first; pass translations for other languages in `translations`, and `source_locale` if the top-level fields are not in the default language.',
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      name: { type: 'string', description: 'Listing name (required)' },
      url: {
        type: 'string',
        description:
          'Website URL. Must be unique within the directory — creating with a URL that already exists updates that existing listing instead of adding a new one.',
      },
      slug: { type: 'string', description: 'URL slug' },
      description: { type: 'string', description: 'Short description' },
      content: { type: 'string', description: 'Full content (markdown)' },
      image_url: { type: 'string', description: 'Cover image URL' },
      image_alt_text: { type: 'string', description: 'Alt text for the cover image' },
      logo_url: { type: 'string', description: 'Logo URL' },
      logo_alt_text: { type: 'string', description: 'Alt text for the logo' },
      additional_image_urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Extra gallery image URLs',
      },
      video_url: { type: 'string', description: 'Video URL (e.g. YouTube)' },
      video_thumbnail_url: { type: 'string', description: 'Thumbnail image URL for the video' },
      phone_number: { type: 'string', description: 'Phone number' },
      email: { type: 'string', description: 'Email address' },
      address: { type: 'string', description: 'Physical address' },
      latitude: { type: 'number', description: 'Latitude' },
      longitude: { type: 'number', description: 'Longitude' },
      social_links: {
        type: 'object',
        description: 'Social profile links as key-value pairs (e.g. {"twitter": "https://x.com/acme"})',
        additionalProperties: true,
      },
      category_id: { type: 'number', description: 'Primary category ID (merged with `categories`)' },
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
      organizers: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of organizer IDs to link this listing to (must belong to the same directory; use list_organizers to find them)',
      },
      is_active: { type: 'boolean', description: 'Active status (default: true)' },
      is_featured: { type: 'boolean', description: 'Featured status' },
      is_no_follow: { type: 'boolean', description: "Add rel=nofollow to the listing's outbound link" },
      starts_at: { type: 'string', description: 'Date the listing becomes live (ISO 8601, e.g. 2026-08-01 09:00:00)' },
      ends_at: { type: 'string', description: 'Date the listing expires (ISO 8601). Expired listings are badged or hidden per directory settings.' },
      seo_title: { type: 'string', description: 'SEO title for the listing page' },
      seo_description: { type: 'string', description: 'SEO meta description for the listing page' },
      schema: { type: 'object', description: 'JSON-LD structured data for the listing page', additionalProperties: true },
      head_html: { type: 'string', description: 'Custom HTML injected into the <head> of the listing page' },
      custom_fields: {
        type: 'object',
        description: 'Custom field values as key-value pairs (e.g. {"price_range": "2", "cuisine_type": "Italian"})',
        additionalProperties: true,
      },
      source_locale: SOURCE_LOCALE_PROPERTY,
      translations: translationsProperty(LISTING_TRANSLATABLE),
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
  description: "Update an existing listing. Only pass fields you want to change. Pass organizers to replace the listing's linked organizers (omit it to leave them untouched). Multilingual directories: call list_languages first; add or change other languages via `translations` (only the languages and fields you pass change).",
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
      image_alt_text: { type: 'string', description: 'Alt text for the cover image' },
      logo_url: { type: 'string', description: 'Logo URL' },
      logo_alt_text: { type: 'string', description: 'Alt text for the logo' },
      additional_image_urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Extra gallery image URLs (replaces the current set)',
      },
      video_url: { type: 'string', description: 'Video URL (e.g. YouTube)' },
      video_thumbnail_url: { type: 'string', description: 'Thumbnail image URL for the video' },
      phone_number: { type: 'string', description: 'Phone number' },
      email: { type: 'string', description: 'Email address' },
      address: { type: 'string', description: 'Physical address' },
      latitude: { type: 'number', description: 'Latitude' },
      longitude: { type: 'number', description: 'Longitude' },
      social_links: {
        type: 'object',
        description: 'Social profile links as key-value pairs (e.g. {"twitter": "https://x.com/acme"}). Replaces the current set.',
        additionalProperties: true,
      },
      category_id: { type: 'number', description: 'Primary category ID (merged with `categories`)' },
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
      organizers: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of organizer IDs to link this listing to. Replaces the current set; pass [] to unlink all. Out-of-directory IDs are ignored.',
      },
      is_active: { type: 'boolean', description: 'Active status' },
      is_featured: { type: 'boolean', description: 'Featured status' },
      is_no_follow: { type: 'boolean', description: "Add rel=nofollow to the listing's outbound link" },
      starts_at: { type: 'string', description: 'Date the listing becomes live (ISO 8601, e.g. 2026-08-01 09:00:00)' },
      ends_at: { type: 'string', description: 'Date the listing expires (ISO 8601). Expired listings are badged or hidden per directory settings.' },
      seo_title: { type: 'string', description: 'SEO title for the listing page' },
      seo_description: { type: 'string', description: 'SEO meta description for the listing page' },
      schema: { type: 'object', description: 'JSON-LD structured data for the listing page', additionalProperties: true },
      head_html: { type: 'string', description: 'Custom HTML injected into the <head> of the listing page' },
      custom_fields: {
        type: 'object',
        description: 'Custom field values as key-value pairs',
        additionalProperties: true,
      },
      source_locale: SOURCE_LOCALE_PROPERTY,
      translations: translationsProperty(LISTING_TRANSLATABLE),
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
  description:
    'Create multiple listings at once (max 100 per request). IMPORTANT: the URL is a unique key per directory — a listing whose URL already exists in the directory (or appears twice in the batch) UPDATES that existing listing instead of creating a new one. Give each listing its own unique URL, or omit the URL to always create new listings. Multilingual directories: call list_languages first; each item may carry `translations` and `source_locale`.',
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
            category_id: { type: 'number' },
            categories: { type: 'array', items: { type: 'number' } },
            tags: { type: 'array', items: { type: 'number' } },
            organizers: { type: 'array', items: { type: 'number' } },
            starts_at: { type: 'string' },
            ends_at: { type: 'string' },
            source_locale: SOURCE_LOCALE_PROPERTY,
            translations: translationsProperty(LISTING_TRANSLATABLE),
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
      locale: LOCALE_PROPERTY,
    },
  },
  handler: async ({ directory_id, page = 1, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/articles`, { page, locale }));
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
      locale: LOCALE_PROPERTY,
    },
    required: ['article_id'],
  },
  handler: async ({ directory_id, article_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/articles/${article_id}`, { locale }));
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
      published_at: { type: 'string', description: 'Publish date (ISO 8601). Defaults to now; pass a past date to backdate or a future one to schedule.' },
      thumbnail_url: { type: 'string', description: 'Thumbnail image URL' },
      thumbnail_alt_text: { type: 'string', description: 'Alt text for the thumbnail image' },
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Category names (strings, not IDs)',
      },
      ...ARTICLE_SEO_PROPERTIES,
      translations: translationsProperty(ARTICLE_TRANSLATABLE),
    },
    required: ['title'],
  },
  handler: async ({ directory_id, ...rest }) => {
    const dir = resolveDirectory(directory_id);
    const payload = splitArticleSeo(rest);
    const data = await api.post(`/directories/${dir}/articles`, payload);
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
      published_at: { type: 'string', description: 'Publish date (ISO 8601). Pass a past date to backdate or a future one to schedule.' },
      thumbnail_url: { type: 'string', description: 'Thumbnail image URL' },
      thumbnail_alt_text: { type: 'string', description: 'Alt text for the thumbnail image' },
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Category names',
      },
      ...ARTICLE_SEO_PROPERTIES,
      translations: translationsProperty(ARTICLE_TRANSLATABLE),
    },
    required: ['article_id'],
  },
  handler: async ({ directory_id, article_id, ...rest }) => {
    const dir = resolveDirectory(directory_id);
    const payload = splitArticleSeo(rest);
    const data = await api.put(`/directories/${dir}/articles/${article_id}`, payload);
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
      locale: LOCALE_PROPERTY,
    },
  },
  handler: async ({ directory_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/pages`, { locale }));
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
      locale: LOCALE_PROPERTY,
    },
    required: ['page_id'],
  },
  handler: async ({ directory_id, page_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/pages/${page_id}`, { locale }));
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
      is_external: { type: 'boolean', description: 'Make this nav item link to an external URL instead of rendering a page' },
      external_url: { type: 'string', description: 'Destination URL when is_external is true' },
      new_tab: { type: 'boolean', description: 'Open the link in a new tab' },
      order: { type: 'number', description: 'Sort order for navigation' },
      seo_title: { type: 'string', description: 'SEO title' },
      seo_description: { type: 'string', description: 'SEO meta description' },
      translations: translationsProperty(PAGE_TRANSLATABLE),
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
      is_external: { type: 'boolean', description: 'Make this nav item link to an external URL instead of rendering a page' },
      external_url: { type: 'string', description: 'Destination URL when is_external is true' },
      new_tab: { type: 'boolean', description: 'Open the link in a new tab' },
      order: { type: 'number', description: 'Sort order for navigation' },
      seo_title: { type: 'string', description: 'SEO title' },
      seo_description: { type: 'string', description: 'SEO meta description' },
      translations: translationsProperty(PAGE_TRANSLATABLE),
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
      locale: LOCALE_PROPERTY,
    },
  },
  handler: async ({ directory_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/organizers`, { locale }));
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
      locale: LOCALE_PROPERTY,
    },
    required: ['organizer_id'],
  },
  handler: async ({ directory_id, organizer_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(withQuery(`/directories/${dir}/organizers/${organizer_id}`, { locale }));
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
      description: { type: 'string', description: 'Short description (shown on cards and header)' },
      content: { type: 'string', description: 'Long-form content (markdown supported, rendered as styled prose on profile page)' },
      logo_url: { type: 'string', description: 'Logo image URL' },
      cover_image_url: { type: 'string', description: 'Cover image URL' },
      email: { type: 'string', description: 'Contact email address' },
      phone: { type: 'string', description: 'Contact phone number' },
      address: { type: 'string', description: 'Physical address' },
      website_url: { type: 'string', description: 'Website URL' },
      social_links: { type: 'object', description: 'Social links as key-value pairs (e.g. {Twitter: "https://..."})' },
      user_id: { type: 'number', description: 'User ID to assign as organizer owner (for submitter dashboard access)' },
      is_active: { type: 'boolean', description: 'Active status (default: true)' },
      order: { type: 'number', description: 'Sort order (default: 0)' },
      translations: translationsProperty(ORGANIZER_TRANSLATABLE),
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
      description: { type: 'string', description: 'Short description (shown on cards and header)' },
      content: { type: 'string', description: 'Long-form content (markdown supported, rendered as styled prose on profile page)' },
      logo_url: { type: 'string', description: 'Logo image URL' },
      cover_image_url: { type: 'string', description: 'Cover image URL' },
      email: { type: 'string', description: 'Contact email address' },
      phone: { type: 'string', description: 'Contact phone number' },
      address: { type: 'string', description: 'Physical address' },
      website_url: { type: 'string', description: 'Website URL' },
      social_links: { type: 'object', description: 'Social links as key-value pairs' },
      user_id: { type: 'number', description: 'User ID to assign as organizer owner' },
      is_active: { type: 'boolean', description: 'Active status' },
      order: { type: 'number', description: 'Sort order' },
      translations: translationsProperty(ORGANIZER_TRANSLATABLE),
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

// ─── Theme (the Theme Editor over the API) ───

const COLOR_PROPERTY = { type: ['string', 'null'], description: 'Hex like #1f2937 (rgb()/hsl()/oklch() accepted); null clears' };
const COLOR_MAP = { type: 'object', additionalProperties: { type: ['string', 'null'] } };

export const getTheme = {
  name: 'get_theme',
  description:
    "Read a directory's theme: everything the Theme Editor controls (template, base theme, brand colors, fonts, dark mode, hero text/media/colors, buttons, homepage sections, footer, brand images, per-template settings, editable labels, submitter panel, custom CSS vars) plus `options` listing the valid values for this directory's template (templates, themes, fonts, palettes, section keys, template_settings, labels, CSS vars, languages). Call this before update_theme so you only send valid keys and values. `public_url` is the live site. Multilingual directories include `translations`.",
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      locale: { type: 'string', description: "Extra language code (see list_languages) to read the hero title/subtitle, homepage content and labels as that language's translations" },
    },
  },
  handler: async ({ directory_id, locale }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.get(`/directories/${dir}/theme${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`);
    return data.data || data;
  },
};

export const updateTheme = {
  name: 'update_theme',
  description:
    "Change a directory's theme — a partial update: send only the groups and keys to change; everything else keeps its value. Goes through the same save path as the Theme Editor's Save button and is live at once. Call get_theme first for the current values and the valid options. Switching `template` applies that template's preset brand colors (when it has one) and validates the rest of the request against the new template. `palette` sets all three brand colors at once; `brand` sets them individually (null clears one; -content text colors are derived). `custom_css_vars` merges DaisyUI vars (null removes one). Brand images are set from URLs in `media` (downloaded and stored; null removes). `template_settings` keys must be ones options.template_settings lists for the template. `translations` writes an extra language's hero texts, homepage content and labels. Returns the theme document after the change; use preview_theme to look at it.",
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      template: { type: 'string', description: 'Template to switch to (options.templates)' },
      theme: { type: 'string', description: 'DaisyUI base theme (options.themes), e.g. light, dark, cupcake' },
      palette: { type: 'string', description: 'Canned palette key: bold, pastel, mono, earthy, ocean' },
      brand: { type: 'object', description: 'Brand colors; the matching -content text colors are derived', properties: { primary: COLOR_PROPERTY, secondary: COLOR_PROPERTY, accent: COLOR_PROPERTY } },
      fonts: { type: 'object', properties: { body: { type: 'string', description: 'Font family (options.fonts)' }, heading: { type: ['string', 'null'], description: 'Heading font, weddings and members only; null = template default' } } },
      dark_mode: { type: 'object', properties: { auto: { type: 'boolean' }, theme: { type: 'string', description: 'Theme used in dark mode' } } },
      hero: {
        type: 'object',
        properties: {
          title: { type: ['string', 'null'], description: 'Hero heading (the directory title)' },
          subtitle: { type: ['string', 'null'], description: 'Text under the heading' },
          show_category_search: { type: 'boolean' },
          cover_image_opacity: { type: 'integer', minimum: 10, maximum: 100 },
          layout: { type: 'object', additionalProperties: { type: ['string', 'null'] }, description: 'height, height_mobile, background_size, background_position, background_repeat, classes (modern); logo_size, logo_size_mobile, logo_classes' },
          colors: { ...COLOR_MAP, description: 'Hero color overrides by key (see get_theme hero.colors)' },
          media: {
            type: 'object',
            description: 'Hero background media (templates where options.hero_media_supported is true)',
            properties: {
              type: { type: 'string', enum: ['image', 'slideshow', 'video'] },
              slideshow_interval: { type: 'integer', description: 'Seconds per slide: 3, 5, 8, 10 or 15' },
              slides: { type: 'array', items: { type: ['string', 'null'] }, maxItems: 5, description: 'Up to 5 image URLs (replaces all slides)' },
              video: {
                type: 'object',
                properties: {
                  source: { type: 'string', enum: ['embed', 'upload'] },
                  url: { type: ['string', 'null'], description: 'YouTube, Vimeo or direct .mp4/.webm URL' },
                  muted: { type: 'boolean' },
                  loop: { type: 'boolean' },
                  sound_button: { type: 'boolean' },
                  mobile_image: { type: 'boolean' },
                },
              },
            },
          },
          collage: { type: 'object', additionalProperties: { type: ['string', 'null'] }, description: 'Weddings only: image_1 … image_4 URLs' },
        },
      },
      buttons: { ...COLOR_MAP, description: 'Button colors: background, text, hover, border, border_hover' },
      homepage: {
        type: 'object',
        properties: {
          content: { type: ['string', 'null'], description: 'Rich content shown above the footer' },
          top_categories: { type: 'boolean' },
          category_count: { type: 'integer', description: '4, 8, 12 or 16' },
          map: { type: 'boolean' },
          map_placement: { type: 'string', enum: ['above_listings', 'below_listings'] },
          sections: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, enabled: { type: 'boolean' } }, required: ['key'] }, description: 'Ordered homepage sections (keys from options.sections)' },
          section_spacing: { type: 'string', enum: ['compact', 'default', 'spacious'], description: 'Marketplace only' },
          categories: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, enabled: { type: 'boolean' } }, required: ['id'] }, description: 'Modern only: curated category sections' },
        },
      },
      footer: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          hide_title: { type: 'boolean' },
          show_browse_section: { type: 'boolean' },
          show_custom_pages_section: { type: 'boolean' },
          show_quick_links_section: { type: 'boolean' },
          show_business_login_link: { type: 'boolean' },
          show_business_login_link_header: { type: 'boolean' },
          copyright_text: { type: ['string', 'null'] },
          colors: { ...COLOR_MAP, description: 'background, text, heading, link_hover, border, copyright' },
          sections: {
            type: 'array',
            description: 'Custom link columns (replaces all)',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                title_color: { type: ['string', 'null'] },
                links: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' }, target: { type: 'string' }, color: { type: ['string', 'null'] }, hover_color: { type: ['string', 'null'] } }, required: ['title', 'url'] } },
              },
              required: ['title'],
            },
          },
        },
      },
      media: {
        type: 'object',
        description: 'Brand images as public URLs; Directify downloads and stores a copy. null removes.',
        properties: {
          logo_url: { type: ['string', 'null'] },
          favicon_url: { type: ['string', 'null'] },
          cover_image_url: { type: ['string', 'null'], description: 'Templates where options.cover_image_supported is true' },
          blog_cover_image_url: { type: ['string', 'null'], description: 'Modern only' },
          footer_logo_url: { type: ['string', 'null'] },
        },
      },
      template_settings: { type: 'object', additionalProperties: { type: ['boolean', 'string', 'null'] }, description: 'Per-template toggles and selects; keys and types from options.template_settings' },
      labels: { type: 'object', additionalProperties: { type: 'object', additionalProperties: { type: ['string', 'null'] } }, description: 'Editable front-end labels by group and key (options.labels); null resets to the default' },
      submitter_panel: {
        type: 'object',
        properties: {
          dark_mode: { type: 'boolean' },
          accent_color: { type: ['string', 'null'] },
          custom_links: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, url: { type: 'string' }, new_tab: { type: 'boolean' } }, required: ['label', 'url'] } },
          labels: { type: 'object', additionalProperties: { type: ['string', 'null'] }, description: 'Keys from options.submitter_labels' },
        },
      },
      custom_css_vars: { type: 'object', additionalProperties: { type: ['string', 'null'] }, description: 'DaisyUI vars from options.custom_css_vars, e.g. {"--radius-box": "1.5rem"}; null removes' },
      translations: {
        type: 'object',
        description: 'Per extra language code (see list_languages): hero title/subtitle, homepage content and labels in that language',
        additionalProperties: {
          type: 'object',
          properties: {
            hero: { type: 'object', properties: { title: { type: ['string', 'null'] }, subtitle: { type: ['string', 'null'] } } },
            homepage: { type: 'object', properties: { content: { type: ['string', 'null'] } } },
            labels: { type: 'object', additionalProperties: { type: 'object', additionalProperties: { type: ['string', 'null'] } } },
          },
        },
      },
    },
  },
  handler: async ({ directory_id, ...body }) => {
    const dir = resolveDirectory(directory_id);
    const data = await api.put(`/directories/${dir}/theme`, body);
    const { options, ...theme } = data.data || data;
    return theme;
  },
};

export const previewTheme = {
  name: 'preview_theme',
  description:
    "Take a screenshot of one of the directory's live pages so you can see the theme as a visitor does — use it after update_theme to check the result. Pages: home, browse, categories, category, listing, blog, map, submit (category/listing/blog need at least one record). Returns the image plus its URL. Limited to 20 captures per hour per account. Captures are taken on the directory's Directify subdomain in preview mode (same theme and content as the custom domain), so the hostname in the image differs from a connected custom domain.",
  inputSchema: {
    type: 'object',
    properties: {
      directory_id: { type: 'string', description: 'Directory ID' },
      page: { type: 'string', enum: ['home', 'browse', 'categories', 'category', 'listing', 'blog', 'map', 'submit'], description: 'Which page (default: home)' },
      width: { type: 'integer', enum: [375, 768, 1280, 1440], description: 'Viewport width (default: 1280)' },
      locale: { type: 'string', description: "Extra language code to capture that language's version" },
    },
  },
  handler: async ({ directory_id, page, width, locale }) => {
    const dir = resolveDirectory(directory_id);
    const query = new URLSearchParams();
    if (page) query.set('page', page);
    if (width) query.set('width', String(width));
    if (locale) query.set('locale', locale);
    const qs = query.toString();
    const data = await api.get(`/directories/${dir}/theme/preview${qs ? `?${qs}` : ''}`);
    const capture = data.data || data;
    const image = await fetch(capture.url);
    if (!image.ok) {
      throw new Error(`The screenshot could not be downloaded (HTTP ${image.status}).`);
    }
    const mimeType = (image.headers.get('content-type') || 'image/png').split(';')[0];
    return {
      content: [
        { type: 'image', data: Buffer.from(await image.arrayBuffer()).toString('base64'), mimeType },
        { type: 'text', text: JSON.stringify(capture, null, 2) },
      ],
    };
  },
};

export const allTools = [
  listDirectories,
  listLanguages,
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
  getCustomField,
  createCustomField,
  updateCustomField,
  deleteCustomField,
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
  getTheme,
  updateTheme,
  previewTheme,
];
