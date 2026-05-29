import { MCP_SERVER_URL } from '@repo/config'

export type {
  ExamplePrompt,
  FaqItem,
  McpToolConfig,
  SetupConfig,
  ToolParameter,
  TroubleshootingItem
} from './page-data-types'
export { MCP_SERVER_URL }

import type {
  ExamplePrompt,
  FaqItem,
  McpToolConfig,
  SetupConfig,
  TroubleshootingItem
} from './page-data-types'

export const MCP_TOOLS: McpToolConfig[] = [
  {
    name: 'audit_url',
    icon: 'Globe',
    description:
      'Fetches a public URL and audits its HTML against frontend best practice rules — no copy-pasting required.',
    useCase: 'Audit any live website by URL instead of pasting HTML.',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'Public https:// URL to audit (private IPs blocked)'
      },
      {
        name: 'focus',
        type: 'Category[]',
        required: false,
        description: 'Focus on specific categories (auto-detects if omitted)'
      },
      {
        name: 'minPriority',
        type: 'Priority',
        required: false,
        description: 'Minimum priority level to report (default: medium)'
      }
    ],
    example: `{
  "name": "audit_url",
  "arguments": {
    "url": "https://example.com",
    "minPriority": "high"
  }
}`
  },
  {
    name: 'get_checklist_rules',
    icon: 'ClipboardList',
    description:
      'Returns full rule details for every rule in a curated checklist in one call — more efficient than calling get_rule N times.',
    useCase: 'Load a complete checklist for a comprehensive review or audit.',
    parameters: [
      {
        name: 'checklist',
        type: 'string',
        required: true,
        description: 'Checklist slug (e.g. "launch-checklist", "seo-audit")'
      },
      {
        name: 'includeContent',
        type: 'boolean',
        required: false,
        description: 'Include full MDX body content (large). Default false.'
      }
    ],
    example: `{
  "name": "get_checklist_rules",
  "arguments": {
    "checklist": "launch-checklist"
  }
}`
  },
  {
    name: 'review_code',
    icon: 'Sparkles',
    description:
      'Proactively analyzes HTML/CSS/JS code against multiple frontend best practice rules simultaneously.',
    useCase: 'Use as the FIRST step for any code review.',
    parameters: [
      {
        name: 'code',
        type: 'string',
        required: true,
        description: 'The HTML, CSS, or JavaScript code to review'
      },
      {
        name: 'focus',
        type: 'Category[]',
        required: false,
        description: 'Focus on specific categories (auto-detects if omitted)'
      },
      {
        name: 'minPriority',
        type: 'Priority',
        required: false,
        description: 'Minimum priority level to report (default: medium)'
      }
    ],
    example: `{
  "name": "review_code",
  "arguments": {
    "code": "<img src='hero.jpg'>\\n<div onclick='...'>Click</div>",
    "minPriority": "high"
  }
}`
  },
  {
    name: 'get_rule',
    icon: 'FileText',
    description:
      'Retrieves a single frontend development rule by its unique slug with complete details.',
    useCase: 'Get full rule content including prompts and examples.',
    parameters: [
      {
        name: 'slug',
        type: 'string',
        required: true,
        description: "The rule's unique slug (e.g., 'alt-tags')"
      },
      {
        name: 'includeUrl',
        type: 'boolean',
        required: false,
        description: "Include the rule's web URL (default: false)"
      }
    ],
    example: `{
  "name": "get_rule",
  "arguments": {
    "slug": "alt-tags"
  }
}`
  },
  {
    name: 'search_rules',
    icon: 'Search',
    description: 'Searches and filters frontend development rules by query, category, or priority.',
    useCase: 'Find relevant rules for specific topics or categories.',
    parameters: [
      { name: 'query', type: 'string', required: false, description: 'Free-text search query' },
      {
        name: 'categories',
        type: 'Category[]',
        required: false,
        description: 'Filter by categories'
      },
      {
        name: 'priorities',
        type: 'Priority[]',
        required: false,
        description: 'Filter by priorities'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Max results (default: 20, max: 100)'
      },
      { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor' }
    ],
    example: `{
  "name": "search_rules",
  "arguments": {
    "categories": ["accessibility", "html"],
    "priorities": ["critical", "high"],
    "limit": 10
  }
}`
  },
  {
    name: 'check_rule',
    icon: 'ClipboardCheck',
    description:
      'Checks code against a specific frontend rule and returns analysis with fix guidance.',
    useCase: 'Validate code compliance with a specific rule.',
    parameters: [
      { name: 'slug', type: 'string', required: true, description: "The rule's slug" },
      { name: 'code', type: 'string', required: false, description: 'Code snippet to analyze' }
    ],
    example: `{
  "name": "check_rule",
  "arguments": {
    "slug": "alt-tags",
    "code": "<img src='hero.jpg'>"
  }
}`
  },
  {
    name: 'fix_rule',
    icon: 'Wrench',
    description: 'Returns the fix/implementation prompt for a specific rule with priority context.',
    useCase: 'Get detailed guidance on how to fix a rule violation.',
    parameters: [{ name: 'slug', type: 'string', required: true, description: "The rule's slug" }],
    example: `{
  "name": "fix_rule",
  "arguments": {
    "slug": "doctype"
  }
}`
  },
  {
    name: 'explain_rule',
    icon: 'BookOpen',
    description: 'Returns the educational explanation for a rule - why it matters and its impact.',
    useCase: 'Learn the reasoning behind a best practice.',
    parameters: [{ name: 'slug', type: 'string', required: true, description: "The rule's slug" }],
    example: `{
  "name": "explain_rule",
  "arguments": {
    "slug": "semantic-html"
  }
}`
  },
  {
    name: 'list_categories',
    icon: 'List',
    description:
      'Returns all available categories with metadata including rule counts and descriptions.',
    useCase: 'Discover available categories and their scope.',
    parameters: [],
    example: `{
  "name": "list_categories",
  "arguments": {}
}`
  },
  {
    name: 'get_workflow',
    icon: 'Workflow',
    description: 'Returns a curated, ordered sequence of rules for a specific checklist workflow.',
    useCase: 'Get structured audit workflows for launches, SEO, etc.',
    parameters: [
      { name: 'slug', type: 'string', required: true, description: 'The checklist workflow slug' }
    ],
    example: `{
  "name": "get_workflow",
  "arguments": {
    "slug": "launch-checklist"
  }
}`
  },
  {
    name: 'get_quick_reference',
    icon: 'Terminal',
    description:
      'Returns a compact, actionable checklist of rules for a category with priority filtering.',
    useCase: 'Generate quick checklists for CI/CD or team handoffs.',
    parameters: [
      {
        name: 'category',
        type: 'string',
        required: true,
        description: 'The category to get a reference for'
      },
      {
        name: 'priorityFilter',
        type: 'string',
        required: false,
        description: "Filter: 'all', 'critical', 'critical+high', 'critical+high+medium'"
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: "Output: 'json', 'markdown', 'checklist'"
      }
    ],
    example: `{
  "name": "get_quick_reference",
  "arguments": {
    "category": "accessibility",
    "priorityFilter": "critical+high",
    "format": "markdown"
  }
}`
  }
]

export const CLIENT_CONFIGS: SetupConfig[] = [
  {
    id: 'cursor',
    title: 'Cursor',
    description: 'Add to .cursor/mcp.json (supports native remote MCP)',
    config: `{
  "mcpServers": {
    "frontend-checklist": {
      "url": "${MCP_SERVER_URL}"
    }
  }
}`
  },
  {
    id: 'vscode',
    title: 'VS Code',
    description: 'Add to User Settings (JSON) or .vscode/mcp.json — native HTTP',
    config: `{
  "mcp": {
    "servers": {
      "frontend-checklist": {
        "type": "http",
        "url": "${MCP_SERVER_URL}"
      }
    }
  }
}`
  },
  {
    id: 'claude_desktop',
    title: 'Claude Desktop',
    description: 'Add to claude_desktop_config.json (requires Node.js for mcp-remote)',
    config: `{
  "mcpServers": {
    "frontend-checklist": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_SERVER_URL}"]
    }
  }
}`
  },
  {
    id: 'claude_code',
    title: 'Claude Code',
    description: 'Run this command in your terminal',
    config: `claude mcp add --transport http frontend-checklist ${MCP_SERVER_URL}`
  },
  {
    id: 'chatgpt',
    title: 'ChatGPT',
    description: 'Pro, Plus, Business, or Education account required. Add custom MCP connector.',
    config: `Server URL: ${MCP_SERVER_URL}

No authentication required. In ChatGPT: Settings → Developer mode → Add custom connector → enter the URL above.`
  },
  {
    id: 'claude_ai',
    title: 'Claude.ai',
    description: 'Web app. Add MCP server in profile settings.',
    config: `Server URL: ${MCP_SERVER_URL}

Settings → Profile → Integrations → Add More → enter the URL above. No authentication required.`
  },
  {
    id: 'codex',
    title: 'Codex',
    description: 'Run this command in your terminal',
    config: `codex mcp add frontend-checklist --url ${MCP_SERVER_URL}`
  },
  {
    id: 'windsurf',
    title: 'Windsurf',
    description: 'Add to Cascade → MCP servers (requires Node.js for mcp-remote)',
    config: `{
  "mcpServers": {
    "frontend-checklist": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_SERVER_URL}"]
    }
  }
}`
  },
  {
    id: 'http',
    title: 'HTTP API',
    description: 'Direct API access via POST requests',
    config: `POST ${MCP_SERVER_URL}
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "review_code",
    "arguments": {
      "code": "<your-code-here>"
    }
  }
}`
  },
  {
    id: 'other',
    title: 'Other',
    description:
      "Any MCP-compatible client. Use the server URL in your client's MCP configuration.",
    config: `Server URL: ${MCP_SERVER_URL}

No authentication required. Check your client's documentation for how to add HTTP/Streamable HTTP MCP servers.`
  }
]

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    prompt: 'Audit https://example.com for frontend best practices',
    description: 'Uses audit_url to check a live site'
  },
  {
    prompt: 'Review this HTML for accessibility issues',
    description: 'Uses review_code with focus on accessibility'
  },
  {
    prompt: 'What are the critical rules I should check before launching?',
    description: 'Uses get_workflow or get_quick_reference'
  },
  {
    prompt: 'Explain why semantic HTML matters',
    description: 'Uses explain_rule'
  },
  {
    prompt: 'Give me a performance checklist in markdown format',
    description: 'Uses get_quick_reference with format: markdown'
  },
  {
    prompt: 'Check this code against the alt-tags rule',
    description: 'Uses check_rule with a specific slug'
  }
]

export const TROUBLESHOOTING_ITEMS: TroubleshootingItem[] = [
  {
    title: 'Connection not working',
    content:
      'Verify the server URL is exactly ' +
      MCP_SERVER_URL +
      '. Restart your editor completely after adding the MCP server—many clients only load MCP config at startup.'
  },
  {
    title: 'Tools not showing',
    content:
      'Check that your config JSON is valid (no trailing commas, correct quotes). Ensure you added the config to the right file: .cursor/mcp.json for Cursor, User Settings or .vscode/mcp.json for VS Code, claude_desktop_config.json for Claude Desktop.'
  },
  {
    title: 'Claude Desktop or Windsurf',
    content:
      'These clients use the mcp-remote bridge, which requires Node.js 18+ installed. Run npx -y mcp-remote ' +
      MCP_SERVER_URL +
      ' in a terminal to confirm it runs. If it fails, install Node.js from nodejs.org.'
  }
]

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is MCP?',
    answer:
      'The Model Context Protocol (MCP) is a standard for connecting Large Language Models (LLMs) to external tools and data sources. It allows AI assistants to interact with services like Front-End Checklist programmatically.'
  },
  {
    question: 'Is authentication required?',
    answer:
      'No, the Front-End Checklist MCP server is public and does not require authentication. It provides read-only access to our rules database.'
  },
  {
    question: 'Which AI tools are supported?',
    answer:
      'Any MCP-compatible client works, including Claude Desktop, Cursor, VS Code with Copilot, Windsurf, Zed, and more. The server exposes tools, reusable prompts, and read-only resources over the same public MCP URL.'
  },
  {
    question: 'What data does the MCP server access?',
    answer:
      'The MCP server only provides access to our public frontend development rules. It cannot access your code, files, or any private data unless you explicitly pass code snippets to tools like review_code or check_rule.'
  },
  {
    question: 'Can I use this in CI/CD pipelines?',
    answer:
      'Yes! Use the HTTP API directly or the get_quick_reference tool to generate checklists in markdown format for automated quality gates.'
  },
  {
    question: 'How does Smithery work with this monorepo?',
    answer:
      'The MCP package is the monorepo unit for registry integrations. Smithery should target the packages/mcp base directory, where the canonical-url smithery.yaml lives, while the public MCP URL stays the same.'
  }
]
