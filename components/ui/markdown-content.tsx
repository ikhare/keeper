import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({
  content,
  className = "",
}: MarkdownContentProps) {
  return (
    <div className={`prose max-w-none [&>*:first-child]:mt-0 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl font-bold mt-6 mb-4 first:mt-0"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-6 mb-4 first:mt-0" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold mt-6 mb-4 first:mt-0" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-4 first:mt-0" {...props} />
          ),
          a: ({ node, href, ...props }) => {
            if (!href) {
              // Handle cases where href might be undefined, though less common
              return <a {...props} />;
            }
            return (
              <Link href={href}>
                <a
                  className="underline text-blue-600 dark:text-blue-400"
                  {...props}
                />
              </Link>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
