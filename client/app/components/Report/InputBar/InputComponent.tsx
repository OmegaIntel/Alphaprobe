import { FC, useRef } from 'react';
import TypeAnimation from './TypeAnimation';
import { Send } from 'lucide-react';
import { Button } from '~/components/ui/button';

type TInputComponentProps = {
  promptValue: string;
  setPromptValue: (prompt: string) => void;
  handleSubmit: (query: string) => void;
  handleSecondary?: (query: string) => void;
  disabled?: boolean;
  reset?: () => void;
  isStopped?: boolean;
};

// Debounce function to limit the rate at which a function can fire
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout | undefined;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const InputComponent: FC<TInputComponentProps> = ({
  promptValue,
  setPromptValue,
  handleSubmit,
  handleSecondary,
  disabled,
  reset,
  isStopped,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholder = handleSecondary
    ? 'Any questions about this report?'
    : 'What would you like to research next?';

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '3em';
    }
  };

  const adjustHeight = debounce((target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  }, 100);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    adjustHeight(target);
    setPromptValue(target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        if (!disabled) {
          if (reset) reset();
          handleSubmit(promptValue);
          setPromptValue('');
          resetHeight();
        }
      }
    }
  };

  if (isStopped) {
    return null;
  }

  return (
    <div className="flex items-center border rounded-lg px-4 py-2 w-full bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500">
      {/* <div className="flex items-center border rounded-lg px-4 py-2 w-full max-w-3xl bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500"> */}
      <textarea
        rows={2}
        // placeholder="Enter a prompt, ask a question, or search the web"
        disabled={disabled}
        placeholder={placeholder}
        ref={textareaRef}
        value={promptValue}
        onKeyDown={handleKeyDown}
        onChange={handleTextareaChange}
        className="flex-1 bg-transparent outline-none text-gray-700 resize-none"
      />

      {/* File Upload Button */}

      {/* Submit Button */}
      <Button
        type="submit"
        onClick={(e) => {
          //e.preventDefault();
          if (reset) reset();
          handleSubmit(promptValue);
          setPromptValue('');
          resetHeight();
        }}
        className="ml-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center">
            <TypeAnimation />
          </div>
        )}
        <Send />
      </Button>
      {/* </div> */}
    </div>
  );
};

export default InputComponent;
