import { MoreHorizontal } from "lucide-react";

export type ChatMessagePlaceholderType = {
    bot_message_style?: React.CSSProperties;
};

export default function ChatMessagePlaceholder({
  bot_message_style,
}: ChatMessagePlaceholderType) {
  return (
    <div
      className="cl-chat-message cl-justify-start"
    >
        <div style={bot_message_style} className={"cl-bot_message"}>
            <div className="cl-animate-pulse">
              <MoreHorizontal />
            </div>
        </div>
    </div>
  );
}