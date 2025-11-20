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
    <div className="bg-black/80 rounded-lg my-4 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-700/50">
        <span className="text-xs font-sans text-gray-400">{language || 'code'}</span>
        <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-white transition-colors">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
}

const renderText = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;
    
    let renderedText = text.replace(boldRegex, '<strong>$1</strong>');
    renderedText = renderedText.replace(italicRegex, '<em>$1</em>');
    
    return <div className="prose prose-invert prose-p:whitespace-pre-wrap max-w-none" dangerouslySetInnerHTML={{ __html: renderedText }} />;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parts = content.split('```');

  return (
    <div>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const lines = part.split('\n');
          const language = lines[0].trim();
          const code = lines.slice(1).join('\n');
          return <CodeBlock key={index} language={language} code={code} />;
        } else {
          return <React.Fragment key={index}>{renderText(part)}</React.Fragment>;
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;