'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { DiscussionRoom, DiscussionMessage } from '@/types';
import { MessageSquare, Plus, Send, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscussionRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<DiscussionRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<DiscussionRoom | null>(null);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chat' | 'forum'>('forum');

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      const cleanup = subscribeToMessages(selectedRoom.id);
      return cleanup;
    }
  }, [selectedRoom]);

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_rooms')
        .select('*')
        .eq('type', viewMode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('discussion_messages')
        .select('*')
        .eq('room_id', roomId)
        .is('parent_id', null) // Only top-level messages for now
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = (roomId: string) => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussion_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadMessages(roomId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!user || !selectedRoom || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from('discussion_messages').insert({
        room_id: selectedRoom.id,
        user_id: user.id,
        content: newMessage,
        message_type: viewMode,
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setViewMode('forum');
            setSelectedRoom(null);
            loadRooms();
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'forum'
              ? 'bg-windows-blue text-white'
              : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
          }`}
        >
          Forum
        </button>
        <button
          onClick={() => {
            setViewMode('chat');
            setSelectedRoom(null);
            loadRooms();
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'chat'
              ? 'bg-windows-blue text-white'
              : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
          }`}
        >
          Chat
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Rooms List */}
        <div className="w-1/3 border-r border-foreground/10 pr-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-semibold">{viewMode === 'chat' ? 'Chat Rooms' : 'Forum Topics'}</h5>
            <button className="p-2 bg-foreground/5 rounded-lg hover:bg-foreground/10">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedRoom?.id === room.id
                    ? 'bg-windows-blue/20 border-2 border-windows-blue'
                    : 'bg-foreground/5 hover:bg-foreground/10 border-2 border-transparent'
                }`}
              >
                <h6 className="font-medium text-sm mb-1">{room.name}</h6>
                {room.description && (
                  <p className="text-xs text-foreground/60 line-clamp-2">{room.description}</p>
                )}
                {room.category && (
                  <span className="text-xs px-2 py-0.5 bg-foreground/5 rounded mt-1 inline-block">
                    {room.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              <div className="border-b border-foreground/10 pb-3 mb-4">
                <h5 className="font-semibold">{selectedRoom.name}</h5>
                {selectedRoom.description && (
                  <p className="text-sm text-foreground/70">{selectedRoom.description}</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((message) => (
                  <div key={message.id} className="p-3 bg-foreground/5 rounded-lg">
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-foreground/50 mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              {user && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={`Type your ${viewMode === 'chat' ? 'message' : 'post'}...`}
                    className="flex-1 px-4 py-2 bg-foreground/5 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-windows-blue text-white rounded-lg hover:bg-windows-blue/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-foreground/50">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-foreground/20" />
                <p>Select a {viewMode === 'chat' ? 'chat room' : 'forum topic'} to start</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

