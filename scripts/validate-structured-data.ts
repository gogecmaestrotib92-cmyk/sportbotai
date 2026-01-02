/**
 * Validate Structured Data (Schema.org JSON-LD)
 * 
 * Checks all pages for:
 * - Missing required fields
 * - Invalid date formats
 * - Missing author/publisher information
 * - Image requirements
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationIssue {
  file: string;
  schemaType: string;
  issue: string;
  severity: 'error' | 'warning';
}

const issues: ValidationIssue[] = [];

// Required fields by schema type
const REQUIRED_FIELDS = {
  Article: ['headline', 'author', 'publisher', 'datePublished', 'image'],
  BlogPosting: ['headline', 'author', 'publisher', 'datePublished', 'image'],
  NewsArticle: ['headline', 'author', 'publisher', 'datePublished', 'image'],
  WebApplication: ['name', 'applicationCategory', 'offers'],
  Organization: ['name', 'url'],
  FAQPage: ['mainEntity'],
  Product: ['name', 'offers'],
};

function extractSchemas(content: string): any[] {
  const schemas = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      schemas.push(parsed);
    } catch (e) {
      // Invalid JSON
      schemas.push({ error: 'Invalid JSON', raw: match[1] });
    }
  }
  
  return schemas;
}

function validateSchema(schema: any, filePath: string): void {
  if (schema.error) {
    issues.push({
      file: filePath,
      schemaType: 'Unknown',
      issue: `Invalid JSON: ${schema.error}`,
      severity: 'error',
    });
    return;
  }
  
  const type = schema['@type'];
  if (!type) {
    issues.push({
      file: filePath,
      schemaType: 'Unknown',
      issue: 'Missing @type field',
      severity: 'error',
    });
    return;
  }
  
  const required = REQUIRED_FIELDS[type as keyof typeof REQUIRED_FIELDS];
  if (required) {
    required.forEach(field => {
      if (!schema[field]) {
        issues.push({
          file: filePath,
          schemaType: type,
          issue: `Missing required field: ${field}`,
          severity: 'error',
        });
      }
    });
  }
  
  // Validate author structure for articles
  if (['Article', 'BlogPosting', 'NewsArticle'].includes(type)) {
    if (schema.author && !schema.author['@type']) {
      issues.push({
        file: filePath,
        schemaType: type,
        issue: 'Author missing @type (should be Person or Organization)',
        severity: 'error',
      });
    }
    
    if (schema.publisher && !schema.publisher.logo) {
      issues.push({
        file: filePath,
        schemaType: type,
        issue: 'Publisher missing logo (required for Google Rich Results)',
        severity: 'warning',
      });
    }
    
    // Validate image is object or string
    if (schema.image && typeof schema.image !== 'string' && !schema.image.url) {
      issues.push({
        file: filePath,
        schemaType: type,
        issue: 'Image must be URL string or ImageObject with url property',
        severity: 'error',
      });
    }
  }
  
  // Validate dates
  if (schema.datePublished && !isValidDate(schema.datePublished)) {
    issues.push({
      file: filePath,
      schemaType: type,
      issue: `Invalid datePublished format: ${schema.datePublished}`,
      severity: 'error',
    });
  }
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function scanFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const schemas = extractSchemas(content);
  
  schemas.forEach(schema => validateSchema(schema, filePath));
}

function scanDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      scanFile(fullPath);
    }
  });
}

// Run validation
console.log('🔍 Validating structured data...\n');

const srcDir = path.join(process.cwd(), 'src');
scanDirectory(srcDir);

// Report issues
if (issues.length === 0) {
  console.log('✅ No structured data issues found!');
} else {
  console.log(`❌ Found ${issues.length} structured data issues:\n`);
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (errors.length > 0) {
    console.log(`🔴 ERRORS (${errors.length}):\n`);
    errors.forEach(issue => {
      console.log(`  ${issue.file}`);
      console.log(`  Type: ${issue.schemaType}`);
      console.log(`  Issue: ${issue.issue}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.forEach(issue => {
      console.log(`  ${issue.file}`);
      console.log(`  Type: ${issue.schemaType}`);
      console.log(`  Issue: ${issue.issue}\n`);
    });
  }
}

process.exit(issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);
