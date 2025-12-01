import { forwardRef, useLayoutEffect, useState } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import type { TextareaAutosizeProps } from 'react-textarea-autosize';
import { useChatStore } from '@/store/chat-store';

export const TextareaAutosize = forwardRef<HTMLTextAreaElement, TextareaAutosizeProps>(
  (props, ref) => {
    const [, setIsRerendered] = useState(false);
    const chatDirection = useChatStore((state) => state.chatDirection).toLowerCase();
    
    // Force re-render for proper initial sizing (as per library recommendations)
    useLayoutEffect(() => setIsRerendered(true), []);
    
    return <ReactTextareaAutosize dir={chatDirection} {...props} ref={ref} />;
  },
);

TextareaAutosize.displayName = 'TextareaAutosize';
