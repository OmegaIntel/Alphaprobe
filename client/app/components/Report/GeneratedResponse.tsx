import { useEffect, useState } from 'react';
import { remark,  } from 'remark';
import html from 'remark-html';
import { Compatible } from 'vfile';
import './styles/markdown.css';
import { Copy } from 'lucide-react';
import gfm from "remark-gfm"

export default function GeneratedResponse({ response }: { response: string }) {
  const [htmlContent, setHtmlContent] = useState('');
  
  async function markdownToHtml(markdown: Compatible | undefined) {
    try {
      const result = await remark().use(gfm).use(html).process(markdown);
      return result.toString();
    } catch (error) {
      console.error('Error converting Markdown to HTML:', error);
      return '';
    }
  }

  useEffect(() => {
    markdownToHtml(response).then((html) => setHtmlContent(html));
  }, [response]);

  return (
    <div className="container flex h-auto w-full shrink-0 gap-4 rounded-lg border border-solid border-gray-200 p-5">
      <div className="w-full">
        <div className="flex items-center justify-between pb-3">
          {response && (
            <div className="flex items-center gap-3">
              <button
                className="p-1 rounded bg-gray-200 text-sm font-medium items-center"
                onClick={() => {
                  navigator.clipboard.writeText(response.trim());
                }}
              >
                <Copy className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap content-center items-center gap-[15px] pl-10 pr-10">
          <div className="w-full whitespace-pre-wrap text-base font-light leading-[152.5%] text-gray-600 log-message">
            {response ? (
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
