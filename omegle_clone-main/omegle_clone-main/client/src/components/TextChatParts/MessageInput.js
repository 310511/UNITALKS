import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, InputContainer } from './StyledComponents';
import EmojiPicker from 'emoji-picker-react';

function MessageInput({ message, setMessage, handleSend }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef();

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleEmojiClick = (emojiData, event) => {
    const emojiChar = emojiData.emoji;
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue = message.slice(0, start) + emojiChar + message.slice(end);
    setMessage(newValue);
    setShowEmojiPicker(false);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emojiChar.length, start + emojiChar.length);
    }, 0);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <InputContainer style={{ position: 'relative', zIndex: 1 }}>
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        style={{ flex: 1 }}
      />
      
      {/* Emoji Button */}
      <Button
        type="button"
        style={{ 
          margin: '0 0.5rem 0 0',
          width: 40,
          height: 40,
          padding: 0,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0b1220 0%, #111827 100%)',
          border: '1px solid rgba(29,185,84,0.35)',
          boxShadow: '0 6px 16px rgba(29,185,84,0.18)',
          color: '#c7f9d4',
          fontSize: '1.1rem'
        }}
        onClick={() => setShowEmojiPicker((v) => !v)}
        tabIndex={-1}
        aria-label="Add emoji"
      >
        😊
      </Button>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          style={{
            position: 'absolute',
            bottom: '110%',
            right: 0,
            zIndex: 200,
            width: 350,
            maxHeight: 400,
            overflow: 'auto',
            background: 'rgba(17,24,39,0.92)',
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            border: '1px solid #444'
          }}
        >
          <EmojiPicker 
            onEmojiClick={handleEmojiClick} 
            theme="dark" 
            height={400} 
            width={350} 
          />
        </div>
      )}

      {/* Send Button */}
      <Button
        type="button"
        style={{ 
          width: 40,
          height: 40,
          padding: 0,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #1DB954 0%, #19a64c 100%)',
          border: '1px solid rgba(29,185,84,0.6)',
          boxShadow: '0 8px 18px rgba(29,185,84,0.28)',
          color: '#eaf2ff',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={handleSend} 
        disabled={!message.trim()}
      >
        ➤
      </Button>
    </InputContainer>
  );
}

export default MessageInput; 