import React, { useState } from 'react';
import { Radio, Plus, Loader2, Eye, Music, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useStoriesGroupedByUser } from '@/hooks/useStories';
import { GroupedStoryViewer } from '@/components/features/StoriesBar';
import { extractSoundFromCaption } from '@/lib/soundMetadata';

const StoriesPage: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const [viewingGroupIdx, setViewingGroupIdx] = useState<number | null>(null);

  const { data: userGroups = [], isLoading } = useStoriesGroupedByUser();

  return (
    <div className="animate-fade-in max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio size={22} className="text-[#d4a24c]" />
            <h1 className="font-cinzel text-2xl text-[#d4a24c] font-bold">Cultural Stories</h1>
          </div>
          <p className="text-xs text-[#a89078]">24-hour visual & video moments shared by the Umurage community.</p>
        </div>

        <button
          onClick={() => (!isAuthenticated ? openAuth('login') : navigate('/upload'))}
          className="btn-gold py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add Story</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="text-[#d4a24c] animate-spin" />
        </div>
      ) : userGroups.length === 0 ? (
        <div className="rounded-xl border border-[#2d1e13] bg-[#160f09] py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#24170d] flex items-center justify-center mx-auto mb-3 text-[#d4a24c]">
            <Radio size={22} />
          </div>
          <h3 className="text-sm font-semibold text-[#f2e6d8] mb-1">No active stories right now</h3>
          <p className="text-xs text-[#a89078] mb-4">Be the first to share a 24-hour story with the community!</p>
          <button
            onClick={() => (!isAuthenticated ? openAuth('login') : navigate('/upload'))}
            className="btn-gold py-2 px-4 text-xs"
          >
            Create a Story
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {userGroups.map((group, groupIdx) => {
            const firstStory = group.stories[0];
            const { cleanCaption, sound } = extractSoundFromCaption(firstStory?.caption);
            const username = group.author?.username || 'User';

            return (
              <div
                key={group.user_id}
                onClick={() => setViewingGroupIdx(groupIdx)}
                className="relative cursor-pointer overflow-hidden rounded-xl border border-[#2d1e13] bg-[#1a110a] h-64 group hover:border-[#c8960c]/60 transition-all duration-200"
              >
                {firstStory.type === 'video' ? (
                  <video src={firstStory.media_url} className="h-full w-full object-cover" />
                ) : (
                  <img src={firstStory.media_url} alt={cleanCaption || 'Story'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* User Avatar Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs rounded-full p-1 pr-2.5 border border-white/10">
                  <img
                    src={group.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`}
                    alt={username}
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                  />
                  <span className="text-[10px] font-medium text-white truncate max-w-[80px]">
                    {username}
                  </span>
                </div>

                {/* Story count badge */}
                {group.stories.length > 1 && (
                  <div className="absolute top-2 right-2 bg-[#c8960c] text-black text-[9px] font-bold px-2 py-0.5 rounded-full border border-black flex items-center gap-1">
                    <Layers size={10} />
                    <span>{group.stories.length} stories</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  {sound && (
                    <div className="inline-flex items-center gap-1 text-[9px] text-[#d4a24c] bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs border border-[#c8960c]/30 truncate max-w-full">
                      <Music size={9} />
                      <span className="truncate">{sound.title}</span>
                    </div>
                  )}
                  {cleanCaption && <p className="text-xs text-white line-clamp-2 leading-snug">{cleanCaption}</p>}
                  <div className="flex items-center gap-1 text-[10px] text-white/70">
                    <Eye size={10} />
                    <span>{firstStory.views} views</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingGroupIdx !== null && userGroups[viewingGroupIdx] && (
        <GroupedStoryViewer
          userGroups={userGroups}
          initialGroupIdx={viewingGroupIdx}
          onClose={() => setViewingGroupIdx(null)}
        />
      )}
    </div>
  );
};

export default StoriesPage;