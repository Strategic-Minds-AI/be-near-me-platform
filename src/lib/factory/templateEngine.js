/**
 * Template Engine
 * Renders typed, versioned template packs with variables, conditions, loops, and partials.
 * Pure logic — no SDK dependencies.
 *
 * Supported modes: text, file_tree, code, prompt, document, config, sql,
 * ui_recipe, workflow_recipe, provisioning_recipe, compound.
 */

// ── Template Modes ──
export const TEMPLATE_MODES = [
  'text', 'file_tree', 'code', 'prompt', 'document', 'config',
  'sql', 'ui_recipe', 'workflow_recipe', 'provisioning_recipe', 'compound',
];

// ── Validate a TemplatePack against its schema ──
export function validateTemplatePack(pack) {
  const errors = [];

  if (!pack || typeof pack !== 'object') {
    return { valid: false, errors: ['TemplatePack must be an object'] };
  }

  if (!pack.id) errors.push('Missing required field: id');
  if (!pack.version) errors.push('Missing required field: version');
  if (!pack.mode) errors.push('Missing required field: mode');
  if (pack.mode && !TEMPLATE_MODES.includes(pack.mode)) {
    errors.push(`Invalid mode: ${pack.mode}. Must be one of: ${TEMPLATE_MODES.join(', ')}`);
  }
  if (!Array.isArray(pack.files)) errors.push('Missing or invalid: files (must be array)');

  return { valid: errors.length === 0, errors };
}

// ── Render a single template string with variables ──
// Supports: {{variable}}, {{object.nested}}, {{#if condition}}...{{/if}},
//           {{#each items}}...{{/each}}, {{#unless x}}...{{/unless}}
export function renderString(template, variables = {}) {
  if (typeof template !== 'string') return template;

  let result = template;

  // Process conditionals: {{#if condition}}...{{/if}}
  result = processConditionals(result, variables);

  // Process loops: {{#each items}}...{{/each}}
  result = processLoops(result, variables);

  // Process unless: {{#unless x}}...{{/unless}}
  result = processUnless(result, variables);

  // Process variable substitution: {{variable.path}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = resolvePath(key.trim(), variables);
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  });

  return result;
}

// ── Resolve a dotted path like "user.name" from variables ──
function resolvePath(path, variables) {
  const parts = path.split('.');
  let current = variables;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

// ── Evaluate a condition expression ──
function evaluateCondition(expr, variables) {
  // Simple truthiness check
  const value = resolvePath(expr.trim(), variables);
  return !!value;
}

// ── Process {{#if condition}}...{{/if}} blocks ──
function processConditionals(template, variables) {
  const pattern = /\{\{#if\s+(\S+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  return template.replace(pattern, (match, condition, body) => {
    if (evaluateCondition(condition, variables)) {
      return body;
    }
    return '';
  });
}

// ── Process {{#unless x}}...{{/unless}} blocks ──
function processUnless(template, variables) {
  const pattern = /\{\{#unless\s+(\S+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
  return template.replace(pattern, (match, condition, body) => {
    if (!evaluateCondition(condition, variables)) {
      return body;
    }
    return '';
  });
}

// ── Process {{#each items}}...{{/each}} blocks ──
function processLoops(template, variables) {
  const pattern = /\{\{#each\s+(\S+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  return template.replace(pattern, (match, collectionPath, body) => {
    const collection = resolvePath(collectionPath.trim(), variables);
    if (!Array.isArray(collection)) return '';

    return collection.map((item, index) => {
      const loopVars = {
        ...variables,
        this: item,
        index,
        first: index === 0,
        last: index === collection.length - 1,
      };
      return renderString(body, loopVars);
    }).join('');
  });
}

// ── Render a file tree template ──
// files: [{ path, content, mode }]
export function renderFileTree(pack, variables = {}) {
  if (!pack.files || !Array.isArray(pack.files)) return [];

  return pack.files.map(file => ({
    path: renderString(file.path, variables),
    content: renderString(file.content || '', variables),
    mode: file.mode || 'text',
  }));
}

// ── Render a full TemplatePack ──
export function renderPack(pack, variables = {}) {
  const validation = validateTemplatePack(pack);
  if (!validation.valid) {
    throw new Error(`Invalid template pack: ${validation.errors.join(', ')}`);
  }

  switch (pack.mode) {
    case 'text':
    case 'code':
    case 'prompt':
    case 'document':
    case 'config':
    case 'sql':
      return renderFileTree(pack, variables);

    case 'file_tree':
    case 'ui_recipe':
    case 'workflow_recipe':
    case 'provisioning_recipe':
      return renderFileTree(pack, variables);

    case 'compound':
      // Compound packs contain sub-packs
      return pack.files.map(file => ({
        path: renderString(file.path, variables),
        sub_pack: file.sub_pack,
        content: file.content ? renderString(file.content, variables) : undefined,
      }));

    default:
      return renderFileTree(pack, variables);
  }
}

// ── Create a simple text template pack ──
export function createTextPack(id, version, content, variablesSchema = {}) {
  return {
    id,
    version,
    mode: 'text',
    variables_schema: variablesSchema,
    files: [{ path: 'output.txt', content }],
  };
}

// ── Create a file tree template pack ──
export function createFileTreePack(id, version, files, variablesSchema = {}) {
  return {
    id,
    version,
    mode: 'file_tree',
    variables_schema: variablesSchema,
    files,
  };
}

// ── Create a code template pack ──
export function createCodePack(id, version, files, variablesSchema = {}) {
  return {
    id,
    version,
    mode: 'code',
    variables_schema: variablesSchema,
    files,
  };
}

// ── Create a SQL template pack ──
export function createSqlPack(id, version, files, variablesSchema = {}) {
  return {
    id,
    version,
    mode: 'sql',
    variables_schema: variablesSchema,
    files,
  };
}

// ── Create a provisioning recipe pack ──
export function createProvisioningRecipePack(id, version, files, variablesSchema = {}) {
  return {
    id,
    version,
    mode: 'provisioning_recipe',
    variables_schema: variablesSchema,
    files,
  };
}

// ── Validate template variables against schema ──
export function validateVariables(variables, schema) {
  const errors = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
  }

  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in variables)) {
        errors.push(`Missing required variable: ${field}`);
      }
    }
  }

  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in variables && propSchema.type) {
        const actualType = Array.isArray(variables[key]) ? 'array' : typeof variables[key];
        if (actualType !== propSchema.type) {
          errors.push(`Variable ${key}: expected ${propSchema.type}, got ${actualType}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}