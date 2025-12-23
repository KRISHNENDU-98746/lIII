
import React, { useState } from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-zinc-950 rounded-xl my-4 overflow-hidden border border-zinc-800">
      <div className="flex justify-between items-center px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{language || 'code'}</span>
        <button onClick={handleCopy} className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5">
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Copied
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto text-zinc-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
}

const parseMarkdown = (text: string) => {
  // Simple regex-based markdown parser
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 border-b border-zinc-800 pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono text-sm">$1</code>')
    .split('\n').map(line => line.trim() === '' ? '<br/>' : `<p class="mb-3">${line}</p>`).join('');

  return html;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parts = content.split('```');

  return (
    <div className="markdown-body">
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const lines = part.split('\n');
          const language = lines[0].trim();
          const code = lines.slice(1).join('\n');
          return <CodeBlock key={index} language={language} code={code} />;
        } else {
          return (
            <div 
              key={index} 
              className="prose prose-invert max-w-none text-zinc-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(part) }} 
            />
          );
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;
