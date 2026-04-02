# Directify MCP Server

[MCP (Model Context Protocol)](https://modelcontextprotocol.io) server for [Directify](https://directify.app) - manage your directory websites through AI assistants like Claude, Cursor, and other MCP-compatible tools.

## What is this?

This MCP server lets AI assistants directly manage your Directify directories. Ask Claude to create listings, update categories, publish articles, and more - all through natural language.

## Installation

```bash
npm install -g directify-mcp
```

## Setup

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "directify": {
      "command": "npx",
      "args": ["-y", "directify-mcp"],
      "env": {
        "DIRECTIFY_API_TOKEN": "your-api-token-here",
        "DIRECTIFY_DIRECTORY_ID": "123"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add directify -- npx -y directify-mcp

# Then set environment variables in your shell:
export DIRECTIFY_API_TOKEN="your-api-token-here"
export DIRECTIFY_DIRECTORY_ID="123"
```

### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "directify": {
      "command": "npx",
      "args": ["-y", "directify-mcp"],
      "env": {
        "DIRECTIFY_API_TOKEN": "your-api-token-here",
        "DIRECTIFY_DIRECTORY_ID": "123"
      }
    }
  }
}
```

## Configuration

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `DIRECTIFY_API_TOKEN` | Yes | Your API token from Settings > API |
| `DIRECTIFY_DIRECTORY_ID` | No | Default directory ID (can also pass per-tool) |

### Getting your API token

1. Go to your [Directify dashboard](https://directify.app)
2. Navigate to **Settings > API**
3. Click the **Key icon** to generate a new token
4. Copy the token

### Finding your Directory ID

Ask Claude: *"List my Directify directories"* - or find it in the URL when viewing your directory in the dashboard (`/app/{directory_id}/...`).

## Available Tools

### Directories

| Tool | Description |
|------|-------------|
| `list_directories` | List all directories you own |

### Categories

| Tool | Description |
|------|-------------|
| `list_categories` | List all categories in a directory |
| `get_category` | Get details of a specific category |
| `create_category` | Create a new category |
| `update_category` | Update a category |
| `delete_category` | Delete a category |

### Tags

| Tool | Description |
|------|-------------|
| `list_tags` | List all tags |
| `get_tag` | Get a specific tag |
| `create_tag` | Create a new tag |
| `update_tag` | Update a tag |
| `delete_tag` | Delete a tag |

### Custom Fields

| Tool | Description |
|------|-------------|
| `list_custom_fields` | List all custom fields (useful to know field names for listings) |

### Listings

| Tool | Description |
|------|-------------|
| `list_listings` | List all listings (paginated) |
| `get_listing` | Get full listing details with custom fields |
| `create_listing` | Create a new listing with custom field values |
| `update_listing` | Update a listing |
| `delete_listing` | Delete a listing |
| `check_listing_exists` | Check if a URL already exists |
| `bulk_create_listings` | Create up to 100 listings at once |

### Articles

| Tool | Description |
|------|-------------|
| `list_articles` | List all blog articles (paginated) |
| `get_article` | Get article details |
| `create_article` | Create a new article (HTML or Markdown) |
| `update_article` | Update an article |
| `delete_article` | Delete an article |
| `toggle_article` | Toggle active/inactive status |

## Example Conversations

### Create a listing

> **You:** Add a new restaurant called "Bella Trattoria" at 123 Main St, Italian cuisine, price range $$$, open Mon-Sat 11am-10pm.

Claude will use `create_listing` with the appropriate fields.

### Bulk import

> **You:** Create 5 test listings for Japanese restaurants in San Francisco with different names and addresses.

Claude will use `bulk_create_listings` to create all 5 at once.

### Manage content

> **You:** Write a blog article about the top 10 Italian restaurants and publish it.

Claude will use `create_article` with markdown content.

### Update listings

> **You:** Update all listings that don't have a description and add a short one based on their name and category.

Claude will use `list_listings`, then `update_listing` for each one.

## Rate Limits

The Directify API allows **120 requests per minute** per directory. The MCP server handles rate limit errors gracefully and will inform the AI assistant to retry.

## License

MIT
