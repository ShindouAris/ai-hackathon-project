import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className = '' }: MarkdownProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-cyan-300">{children}</strong>,
          em: ({ children }) => <em className="italic text-purple-300">{children}</em>,
          code: ({ children, ...props }) => {
            const inline = !('data-language' in props)
            return inline ? (
              <code className="px-1.5 py-0.5 rounded bg-slate-800 border border-purple-900/60 text-cyan-200 text-[0.9em] font-mono">
                {children}
              </code>
            ) : (
              <code className="block p-2 rounded bg-slate-950 border border-purple-900/60 text-cyan-200 font-mono text-xs overflow-x-auto">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="my-2 p-2 rounded bg-slate-950 border border-purple-900/60 overflow-x-auto">
              {children}
            </pre>
          ),
          h1: ({ children }) => <h1 className="text-base font-bold text-cyan-300 mt-2 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-cyan-300 mt-2 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-purple-300 mt-2 mb-1">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-purple-500/60 pl-2 italic text-slate-400 my-2">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
              {children}
            </a>
          ),
          hr: () => <hr className="my-2 border-purple-900/60" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-purple-900/60 px-2 py-1 bg-slate-900/60 text-cyan-300 font-bold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-purple-900/60 px-2 py-1">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
