import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeMathjax from 'rehype-mathjax';

type ChatMessageType = {
  message: string;
  isSend: boolean;
  error?: boolean;
  bot_message_style?: React.CSSProperties;
  user_message_style?: React.CSSProperties;
  error_message_style?: React.CSSProperties;
};

export default function ChatMessage({
  message,
  isSend,
  error,
  user_message_style,
  bot_message_style,
  error_message_style,
}: ChatMessageType) {
    
  return (
    <div
      className={
        'cl-chat-message ' + (isSend ? ' cl-justify-end' : ' cl-justify-start')
      }
    >
      {isSend ? (
        <div style={user_message_style} className="cl-user_message">
          {message}
        </div>
      ) : error ? (
        <div style={error_message_style} className={'cl-error_message'}>
          {message}
        </div>
      ) : (
        <div style={bot_message_style} className={'cl-bot_message'}>
          <Markdown
            // @ts-ignore
            // className={
            //   'markdown-body prose flex flex-col word-break-break-word'
            // }
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeMathjax]}
          >
            {message}
          </Markdown>
        </div>
      )}
    </div>
  );
}
