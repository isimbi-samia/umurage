import React from 'react';
import { Bell, CheckCheck, Loader2, MessageCircle, Heart, Sparkles, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAllRead, useMarkOneRead } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  const markAll = useMarkAllRead();
  const markOne = useMarkOneRead();

  const handleClick = (notif: { id: string; post_id?: string | null; topic_id?: string | null; type: string; read: boolean; user_id: string }) => {
    if (!notif.read) {
      markOne.mutate({ notifId: notif.id, userId: notif.user_id });
    }
    if (notif.post_id) navigate(`/post/${notif.post_id}`);
    else if (notif.topic_id) navigate('/discussions');
    else navigate('/notifications');
  };

  return (
    <div className="mx-auto max-w-5xl rounded-[28px] border border-[#4a2a12]/70 bg-[#1b120b]/90 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Notifications</p>
          <h1 className="mt-1 text-2xl font-semibold text-amber-50">Your activity stream</h1>
        </div>
        <button
          onClick={() => markAll.mutate(user?.id || '')}
          disabled={!user?.id || markAll.isPending}
          className="rounded-full border border-amber-400/30 bg-[#221509] px-4 py-2 text-sm text-amber-100/80"
        >
          {markAll.isPending ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : <CheckCheck className="mr-2 inline" size={16} />}
          Mark all read
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-amber-200/70">
          <Loader2 className="mr-2 animate-spin" size={18} />
          Loading your notifications…
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#5c3417] p-8 text-center text-amber-100/70">
          <Bell className="mx-auto mb-3" size={28} />
          <p className="text-sm">You are all caught up.</p>
          <p className="mt-1 text-xs text-amber-100/50">Likes, replies, follows, and verification updates will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const iconMap = {
              like: <Heart size={16} className="text-rose-400" />,
              follow: <Sparkles size={16} className="text-sky-400" />,
              comment: <MessageCircle size={16} className="text-amber-400" />,
              reply: <MessageCircle size={16} className="text-green-400" />,
              verification: <Shield size={16} className="text-purple-400" />,
            } as const;

            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif as any)}
                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${notif.read ? 'border-[#3d2510] bg-[#221509]' : 'border-amber-400/30 bg-[#2b1a0c]'}`}
              >
                <div className="rounded-full bg-[#140d07] p-2">
                  {iconMap[notif.type as keyof typeof iconMap] || <Bell size={16} className="text-amber-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-amber-50">{notif.message}</p>
                  <p className="mt-1 text-xs text-amber-100/60">{timeAgo(notif.created_at)}</p>
                </div>
                {!notif.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
