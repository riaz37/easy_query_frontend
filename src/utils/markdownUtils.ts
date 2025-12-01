/**
 * Utility functions for processing markdown content from backend
 */

/**
 * Processes markdown content from backend by converting escaped characters
 * to their actual representations for proper markdown rendering
 * 
 * @param content - Raw content from backend with escaped characters
 * @returns Processed content ready for markdown rendering
 */
export const processMarkdownContent = (content: string): string => {
  if (!content) return '';
  
  return content
    // Replace literal \r\n with actual newlines
    .replace(/\\r\\n/g, '\n')
    // Replace literal \n with actual newlines
    .replace(/\\n/g, '\n')
    // Replace literal \t with actual tabs
    .replace(/\\t/g, '\t')
    // Replace literal \r with actual carriage returns
    .replace(/\\r/g, '\r')
    // Handle other common escaped characters
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    // Remove HTML comments that are breaking markdown rendering
    .replace(/<!--[\s\S]*?-->/g, '')
    // Fix markdown headers that might be malformed
    .replace(/^#{1,6}\s*/gm, (match) => match.trim() + ' ')
    // Fix bullet points and lists
    .replace(/^\*\s*/gm, '- ')
    .replace(/^\d+\.\s*/gm, (match) => match.trim() + ' ')
    // Fix code blocks that might be malformed
    .replace(/```([^`]*?)```/gs, (match, code) => {
      const trimmedCode = code.trim();
      return `\`\`\`\n${trimmedCode}\n\`\`\``;
    })
    // Fix inline code that might be malformed
    .replace(/`([^`]+)`/g, (match, code) => {
      const trimmedCode = code.trim();
      return `\`${trimmedCode}\``;
    })
    // Fix bold and italic formatting
    .replace(/\*\*([^*]+)\*\*/g, '**$1**')
    .replace(/\*([^*]+)\*/g, '*$1*')
    // Fix excessive spacing in separators (multiple spaces/dashes)
    .replace(/\s*[-=]{3,}\s*/g, '\n---\n')
    // Remove trailing backslashes at the end of lines
    .replace(/\\$/gm, '')
    // Preserve single backslashes but fix double backslashes
    .replace(/\\\\/g, '\\')
    // Clean up excessive line breaks (more than 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around headers
    .replace(/(\n|^)(#{1,6}\s+[^\n]+)/g, '\n\n$2\n')
    // Clean up any remaining formatting issues
    .trim();
};

/**
 * Validates if content appears to be markdown
 * @param content - Content to validate
 * @returns boolean indicating if content looks like markdown
 */
export const isMarkdownContent = (content: string): boolean => {
  if (!content) return false;
  
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headers
    /^\*\s/m,               // Bullet points
    /^\d+\.\s/m,           // Numbered lists
    /```[\s\S]*```/m,       // Code blocks
    /`[^`]+`/m,             // Inline code
    /^\>\s/m,               // Blockquotes
    /\[.*\]\(.*\)/m,        // Links
    /\*\*.*\*\*/m,          // Bold text
    /\*.*\*/m,              // Italic text
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
};

/**
 * Sanitizes content for safe markdown rendering
 * @param content - Content to sanitize
 * @returns Sanitized content
 */
export const sanitizeMarkdownContent = (content: string): string => {
  if (!content) return '';
  
  return content
    // Remove potential XSS vectors
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove other potentially dangerous HTML tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
};

/**
 * Processes complex documentation content with HTML comments and special formatting
 * @param content - Raw documentation content
 * @returns Properly formatted markdown content
 */
export const processDocumentationContent = (content: string): string => {
  if (!content) return '';
  
  return content
    // Remove HTML comments completely
    .replace(/<!--[\s\S]*?-->/g, '')
    // Convert section markers to proper headers
    .replace(/^Section\s+\d+:\s*(.+)$/gm, '## $1')
    // Fix business logic sections
    .replace(/^Business Logic$/gm, '### Business Logic')
    .replace(/^SQL Logic Description$/gm, '### SQL Logic Description')
    .replace(/^Expected Query Output$/gm, '### Expected Query Output')
    .replace(/^Calculation Logic per User$/gm, '### Calculation Logic per User')
    .replace(/^Conditions$/gm, '### Conditions')
    // Fix list items that start with dashes
    .replace(/^-\s*(.+)$/gm, '- $1')
    // Fix numbered lists
    .replace(/^\d+\.\s*(.+)$/gm, (match, content) => {
      const num = match.match(/^\d+/)?.[0] || '1';
      return `${num}. ${content.trim()}`;
    })
    // Fix code blocks and SQL queries
    .replace(/^sql\s+(.+)$/gm, '```sql\n$1\n```')
    .replace(/^WITH\s+/gm, '```sql\nWITH ')
    // Ensure proper spacing around code blocks
    .replace(/```([^`]*?)```/gs, (match, code) => {
      const trimmedCode = code.trim();
      return `\n\`\`\`\n${trimmedCode}\n\`\`\`\n`;
    })
    // Fix table references and field names
    .replace(/\*\*([^*]+)\*\*/g, '**$1**')
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around headers
    .replace(/(\n|^)(#{1,6}\s+[^\n]+)/g, '\n\n$2\n')
    .trim();
};
