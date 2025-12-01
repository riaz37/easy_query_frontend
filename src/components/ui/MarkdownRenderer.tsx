import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processMarkdownContent, sanitizeMarkdownContent, processDocumentationContent } from '@/utils/markdownUtils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxHeight?: string;
  isDocumentation?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  maxHeight = '600px',
  isDocumentation = false,
}) => {
  // Process the content to handle escaped characters from backend
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    
    // First sanitize the content for security
    const sanitized = sanitizeMarkdownContent(content);
    
    // Use documentation processing for complex content with HTML comments
    if (isDocumentation) {
      return processDocumentationContent(sanitized);
    }
    
    // Then process escaped characters for regular content
    return processMarkdownContent(sanitized);
  }, [content, isDocumentation]);

  return (
    <div className={`overflow-y-auto ${className}`} style={{ maxHeight }}>
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom styling for markdown elements
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-1">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-white mb-2">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-sm font-semibold text-white mb-2">
                {children}
              </h4>
            ),
            h5: ({ children }) => (
              <h5 className="text-sm font-medium text-white mb-1">
                {children}
              </h5>
            ),
            h6: ({ children }) => (
              <h6 className="text-xs font-medium text-white mb-1">
                {children}
              </h6>
            ),
            p: ({ children }) => (
              <p className="text-gray-200 mb-2 leading-relaxed">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="text-gray-200 mb-3 ml-4 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="text-gray-200 mb-3 ml-4 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-200">
                {children}
              </li>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-gray-800 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code className="block bg-gray-900 text-gray-200 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-gray-900 text-gray-200 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-900/20 text-emerald-200 mb-3 italic">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-3">
                <table className="min-w-full border border-gray-600 rounded-lg">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-800">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody>
                {children}
              </tbody>
            ),
            th: ({ children }) => (
              <th className="bg-gray-800 text-white px-3 py-2 text-left border-b border-gray-600 font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="text-gray-200 px-3 py-2 border-b border-gray-700">
                {children}
              </td>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-gray-800/50">
                {children}
              </tr>
            ),
            a: ({ children, href }) => (
              <a 
                href={href} 
                className="text-emerald-400 hover:text-emerald-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-white">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-300">
                {children}
              </em>
            ),
            hr: () => (
              <hr className="border-gray-600 my-2" />
            ),
            // Handle task lists (GitHub Flavored Markdown)
            input: ({ type, checked, ...props }) => {
              if (type === 'checkbox') {
                return (
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled
                    className="mr-2 accent-emerald-500"
                    {...props}
                  />
                );
              }
              return <input type={type} {...props} />;
            },
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
