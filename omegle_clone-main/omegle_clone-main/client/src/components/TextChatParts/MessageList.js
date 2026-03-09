import React from 'react';
import { Message } from './StyledComponents';

// FIX: React.memo prevents re-renders when the parent re-renders for unrelated
// reasons (e.g. typing in the message input updates 'message' state). Without
// memo, the list would re-render on every keystroke even if 'messages' didn't change.
const MessageList = React.memo(function MessageList({ messages, messagesEndRef }) {
  return (
    <>
      {messages.map((msg, index) => (
        <Message key={index} $isMine={msg.isMine}>
          {msg.text}
        </Message>
      ))}
      <div ref={messagesEndRef} />
    </>
  );
});

export default MessageList;