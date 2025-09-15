import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import VoicePlayer from "./VoicePlayer";

const VoiceNoteFeed = ({ token }) => {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVoiceNoteFeed();
  }, []);

  const fetchVoiceNoteFeed = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/voice/feed", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setVoiceNotes(data.data.voiceNotes);
      }
    } catch (error) {
      console.error("Error fetching voice note feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-12 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {voiceNotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No voice notes yet</h3>
          <p className="text-slate-500">
            Start following friends or create your first voice note to see content here.
          </p>
        </div>
      ) : (
        voiceNotes.map((note) => (
          <div
            key={note._id}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    note.userId.profilePic ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      note.userId.username
                    )}`
                  }
                  alt={note.userId.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium text-slate-900">
                    {note.userId.username}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {formatDate(note.createdAt)}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              {note.title}
            </h2>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Voice Player */}
            <div className="mb-4">
              <VoicePlayer
                audioUrl={`http://localhost:8080${note.audioUrl}`}
                duration={note.duration}
                className="bg-slate-50 rounded-lg p-4"
              />
            </div>

            {/* Transcription */}
            {note.transcription && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700 italic">
                  "{note.transcription}"
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-slate-500 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">{note.likes?.length || 0}</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{note.comments?.length || 0}</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-500 hover:text-green-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
              <span className="text-xs text-slate-400 capitalize">
                {note.visibility}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default VoiceNoteFeed;