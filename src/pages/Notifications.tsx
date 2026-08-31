import React from 'react';
import { Bell, CheckCheck, Loader2, MessageCircle, Heart, Sparkles, Shield, Trash2, ShoppingBag, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAllRead, useMarkOneRead, useDeleteNotification } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
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
  const deleteNotif = useDeleteNotification();

  const handleClick = (notif: { id: string; post_id?: string | null; topic_id?: string | null; type: string; read: boolean; user_id: string; actor_id?: string | null }) => {
    if (!notif.read) {
      markOne.mutate({ notifId: notif.id, userId: notif.user_id });
    }
    if (notif.post_id) navigate(`/post/${notif.post_id}`);
    else if (notif.topic_id) navigate('/discussions');
    else if (notif.type === 'message') navigate('/messages');
    else if (notif.type === 'follow' && notif.actor_id) navigate(`/profile/${notif.actor_id}`);
    else if (notif.type === 'order') navigate('/marketplace');
    else if (notif.type === 'course') navigate('/courses');
    else navigate('/notifications');
  };

  const handleDelete = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    if (!user) return;
    deleteNotif.mutate({ notifId, userId: user.id });
    toast.success('Notification removed');
  };

  return (
    <div className="mx-auto max-w-4xl rounded-[28px] border border-[#4a2a12]/70 bg-[#1b120b]/90 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#4a2a12]/60 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Notifications</p>
          <h1 className="mt-1 text-2xl font-semibold text-amber-50">Activity Stream & Alerts</h1>
        </div>
        <button
          onClick={() => markAll.mutate(user?.id || '')}
          disabled={!user?.id || markAll.isPending || notifications.length === 0}
          className="rounded-full border border-amber-400/30 bg-[#221509] px-4 py-2 text-xs text-amber-100/80 hover:bg-[#331d0c] disabled:opacity-40 transition-colors font-semibold"
        >
          {markAll.isPending ? <Loader2 className="mr-2 inline animate-spin" size={14} /> : <CheckCheck className="mr-2 inline" size={14} />}
          Mark all read
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-amber-200/70 text-sm">
          <Loader2 className="mr-2 animate-spin text-amber-400" size={18} />
          Loading your activity notifications…
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#5c3417] p-10 text-center text-amber-100/70">
          <Bell className="mx-auto mb-3 text-amber-400/40" size={32} />
          <p className="text-sm font-semibold">You are all caught up!</p>
          <p className="mt-1 text-xs text-amber-100/50">Messages, follows, discussion replies, and community interactions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            const iconMap = {
              like: <Heart size={15} className="text-rose-400" />,
              follow: <Sparkles size={15} className="text-sky-400" />,
              comment: <MessageCircle size={15} className="text-amber-400" />,
              reply: <MessageCircle size={15} className="text-green-400" />,
              verification: <Shield size={15} className="text-purple-400" />,
              message: <MessageCircle size={15} className="text-indigo-400" />,
              order: <ShoppingBag size={15} className="text-emerald-400" />,
              course: <BookOpen size={15} className="text-cyan-400" />,
            } as const;

            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif as any)}
                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left cursor-pointer group transition-all duration-200 ${
                  notif.read ? 'border-[#3d2510] bg-[#221509] hover:bg-[#2c1b0c]' : 'border-amber-400/40 bg-[#2b1a0c] hover:bg-[#36210f]'
                }`}
              >
                {/* Actor Avatar with Action Icon Badge */}
                <div className="relative flex-shrink-0">
                  {notif.actor?.avatar_url ? (
                    <img
                      src={notif.actor.avatar_url}
                      alt={notif.actor.username || 'User'}
                      className="w-9 h-9 rounded-full object-cover border border-[#4a2a12]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#140d07] flex items-center justify-center border border-[#3d2510]">
                      {iconMap[notif.type as keyof typeof iconMap] || <Bell size={15} className="text-amber-400" />}
                    </div>
                  )}
                  {notif.actor?.avatar_url && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-[#140d07] p-0.5 border border-[#3d2510]">
                      {iconMap[notif.type as keyof typeof iconMap] || <Bell size={11} className="text-amber-400" />}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-amber-50 leading-relaxed font-medium">{notif.message}</p>
                  <p className="mt-1 text-[10px] text-amber-100/50">{timeAgo(notif.created_at)}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notif.read && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#1b120b] text-amber-200/50 hover:text-red-400 transition-all"
                    title="Delete Notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
