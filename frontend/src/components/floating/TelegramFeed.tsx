'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LoadRecord, TelegramMessage } from '@/types/logistics';
import { useTelemetry } from '@/context/TelemetryContext';
import { cn } from '@/lib/utils';
import { Send, FileText, Bot, User, CheckCheck, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface TelegramFeedProps {
  load: LoadRecord;
}

export function TelegramFeed({ load }: TelegramFeedProps) {
  const { sendTelegramMessage } = useTelemetry();
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [load.telegramMessages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendTelegramMessage(load.id, inputText);
    setInputText('');
  };

  const handleQuickPing = (text: string) => {
    sendTelegramMessage(load.id, text);
  };

  return (
    <div className="flex flex-col h-[380px] bg-slate-950 rounded-lg border border-slate-800 text-xs overflow-hidden">
      {/* Feed Header */}
      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="font-semibold text-slate-200">
            {load.driver.telegramHandle}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ID: {load.driver.telegramChatId}
          </span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
          TELEGRAM BOT V2
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {load.telegramMessages.map((msg: TelegramMessage) => {
          const isBot = msg.sender === 'bot';
          const isDispatcher = msg.sender === 'dispatcher';
          const isDriver = msg.sender === 'driver';

          if (isBot) {
            return (
              <div key={msg.id} className="flex items-start gap-2 max-w-[90%]">
                <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-sky-400" />
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                  <div className="text-[11px] leading-relaxed">{msg.text}</div>
                  <div className="text-[9px] text-slate-500 mt-1 font-mono text-right">{msg.timestamp}</div>
                </div>
              </div>
            );
          }

          if (isDispatcher) {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] p-2 rounded-lg bg-blue-600 text-white shadow-sm space-y-1">
                  <div className="text-[11px] leading-relaxed">{msg.text}</div>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-blue-200 font-mono">
                    <span>{msg.timestamp}</span>
                    <CheckCheck className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex items-start gap-2 max-w-[85%]">
              <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 space-y-1.5">
                <div className="text-[11px] leading-relaxed">{msg.text}</div>

                {/* Attached Document / Photo Preview (e.g. Signed BOL) */}
                {msg.attachment && (
                  <div className="mt-1 pt-1 border-t border-slate-800">
                    <div 
                      onClick={() => setSelectedImage(msg.attachment!.url)}
                      className="cursor-pointer group relative rounded border border-slate-700 overflow-hidden bg-slate-950 max-w-[200px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={msg.attachment.url} 
                        alt={msg.attachment.title}
                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-medium flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded">
                          <ExternalLink className="w-3 h-3" /> Zoom BOL
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      <span>{msg.attachment.title}</span>
                    </div>
                  </div>
                )}

                <div className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Ping Chips */}
      <div className="px-2.5 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
        <span className="text-[10px] text-slate-500 font-medium shrink-0">Quick Pings:</span>
        <button
          type="button"
          onClick={() => handleQuickPing("Please send signed BOL photo as soon as loaded.")}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap transition-colors"
        >
          📄 Request BOL
        </button>
        <button
          type="button"
          onClick={() => handleQuickPing("What is your current ETA to delivery?")}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap transition-colors"
        >
          ⏱️ Ask ETA
        </button>
        <button
          type="button"
          onClick={() => handleQuickPing("Are you in door or waiting in line for check-in?")}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap transition-colors"
        >
          🚪 Door Status
        </button>
      </div>

      {/* Message Input Composer */}
      <form onSubmit={handleSend} className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${load.driver.name} on Telegram...`}
          className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Modal image zoom */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="relative max-w-xl max-h-[85vh] bg-slate-900 rounded-lg p-2 border border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="BOL Document" className="max-w-full max-h-[75vh] object-contain rounded" />
            <div className="text-center text-xs text-slate-400 mt-2 font-mono">
              Click anywhere to close document preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
