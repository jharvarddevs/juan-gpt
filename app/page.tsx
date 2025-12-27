'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodePreview from './components/CodePreview';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Inside the Home component
  const [openPreviewId, setOpenPreviewId] = useState<string | null>(null);

  // --- Load / Save History ---
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat-history');
    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat-history', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Helper: Read the Stream ---
  const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder("utf-8");
    
    while (true) {
      const { done, value } = await reader.read();
      
      // Only stop if the server explicitly says "done"
      if (done) break;

      // Process the chunk
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        setStreamingContent((prev) => prev + chunk);
      }
    }
  };

    const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStreamingContent(''); 

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      // Local variable to accumulate text safely
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        
        // Update UI in real-time
        setStreamingContent(fullResponse);
      }

      // Stream is done. Save the final result to history
      setMessages((prev) => [...prev, { role: 'assistant', content: fullResponse }]);
      
    } catch (error) {
      console.error('Stream Error:', error);
      alert("Something went wrong with the stream. Check console.");
    } finally {
      // Clear the streaming buffer AFTER saving to history
      setStreamingContent('');
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      
      <header className="flex-none p-4 border-b border-gray-800 bg-gray-900 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white">
  JG {/* Stands for JuanGPT, or just J */}
</div>
          <h1 className="font-semibold text-lg tracking-tight">JuanGPT</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { if(confirm("Clear chat history?")) { setMessages([]); }}}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            Clear Chat
          </button>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Groq Powered</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {messages.length === 0 && !loading && (
          <div className="text-center mt-20 space-y-4 opacity-50">
            <h2 className="text-2xl font-bold text-white">How can I help you today?</h2>
            <p className="text-sm">Ask me to code, write, or analyze.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} openPreviewId={openPreviewId} setOpenPreviewId={setOpenPreviewId} />
        ))}

        {/* Show streaming content if it exists */}
        {streamingContent && (
          <MessageBubble msg={{ role: 'assistant', content: streamingContent }} isStreaming={true} openPreviewId={openPreviewId} setOpenPreviewId={setOpenPreviewId} />
        )}
        
        {loading && !streamingContent && (
           <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
               <span className="text-xs">AI</span>
             </div>
             <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm text-gray-400 text-sm italic">
               Thinking...
             </div>
           </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      <div className="flex-none p-4 bg-gray-900 border-t border-gray-800">
        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="max-w-3xl mx-auto relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-full pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-inner border border-gray-700"
            placeholder="Message JuanGPT..."
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${
              loading || !input.trim() ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.502l4.339 2.76 7.494-7.493Z"/>
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}

function MessageBubble({ msg, isStreaming = false, openPreviewId, setOpenPreviewId }: { msg: { role: string; content: string }, isStreaming?: boolean, openPreviewId: string | null, setOpenPreviewId: (id: string | null) => void }) {
  
  // Only allow previews for Assistant messages, and only one at a time
  const showPreview = msg.role === 'assistant' && !isStreaming && openPreviewId === (msg.content);

  return (
    <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      
      {msg.role === 'user' && (
        <div className="max-w-[80%] bg-purple-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-lg">
          {msg.content}
        </div>
      )}

      {msg.role === 'assistant' && (
        <div className="flex gap-4 max-w-[100%] flex-col"> {/* Changed to flex-col to fit full width preview */}
          
          <div className="flex gap-4 w-full">
            <div className="flex-none w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center border border-green-500/30">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135Z"/>
                <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866ZM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5Z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="bg-gray-800 text-gray-100 px-5 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-700/50 inline-block">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {isStreaming && <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse align-middle" />}
              </div>
              
              {/* Toggle Button */}
              {!isStreaming && (
                <button 
                  onClick={() => setOpenPreviewId(openPreviewId === msg.content ? null : msg.content)}
                  className={`mt-2 text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                    showPreview 
                    ? 'bg-purple-600 border-purple-600 text-white' 
                    : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {showPreview ? 'Close Live Preview' : 'Run Live Code'}
                </button>
              )}
            </div>
          </div>

          {/* The Live Preview Component */}
          {showPreview && <CodePreview content={msg.content} />}
        </div>
      )}
    </div>
  );
}