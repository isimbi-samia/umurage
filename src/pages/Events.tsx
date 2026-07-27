import React, { useState, useRef } from 'react';
import {
  Calendar, MapPin, Loader2, Plus, ChevronLeft, ChevronRight,
  CheckCircle, Users, X, Image, Upload, Clock, Filter, AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCreateEvent } from '@/hooks/useFollow';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  event_date: string;
  location?: string | null;
  event_type?: string | null;
  image_url?: string | null;
  rsvp_count?: number;
  created_at?: string;
}

interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'interested' | 'not_going';
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const EVENT_TYPES = ['All', 'Cultural Ceremony', 'Music', 'Exhibition', 'Education', 'Conference', 'Festival'];

const TYPE_STYLES: Record<string, string> = {
  'Cultural Ceremony': 'bg-umurage-gold/20 text-umurage-gold border-umurage-gold/40',
  'Music':             'bg-red-900/30 text-red-400 border-red-800/40',
  'Exhibition':        'bg-purple-900/30 text-purple-400 border-purple-800/40',
  'Education':         'bg-blue-900/30 text-blue-400 border-blue-800/40',
  'Conference':        'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
  'Festival':          'bg-green-900/30 text-green-400 border-green-800/40',
};

const TYPE_EMOJIS: Record<string, string> = {
  'Cultural Ceremony': '🏺', 'Music': '🎵', 'Exhibition': '🖼️',
  'Education': '📚', 'Conference': '🎤', 'Festival': '🎉',
};

const RWANDAN_LOCATIONS = [
  'Kigali City', 'Northern Province', 'Southern Province',
  'Eastern Province', 'Western Province', 'Musanze', 'Huye', 'Rubavu',
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────
function useAllEvents(eventType?: string) {
  return useQuery({
    queryKey: ['events-all', eventType],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (eventType && eventType !== 'All') {
        query = query.eq('event_type', eventType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Event[];
    },
    staleTime: 30000,
  });
}

function useMyRSVPs(userId?: string) {
  return useQuery({
    queryKey: ['my-rsvps', userId],
    queryFn: async () => {
      if (!userId) return new Map<string, string>();
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id, status')
        .eq('user_id', userId);
      if (error) throw error;
      const map = new Map<string, string>();
      (data || []).forEach(r => map.set(r.event_id, r.status));
      return map;
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

function useRSVP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId, userId, status, currentStatus,
    }: { eventId: string; userId: string; status: string; currentStatus?: string }) => {
      if (currentStatus === status) {
        // Cancel RSVP
        const { error } = await supabase
          .from('event_registrations')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId);
        if (error) throw error;
        return null;
      }
      const { error } = await supabase
        .from('event_registrations')
        .upsert({ event_id: eventId, user_id: userId, status }, { onConflict: 'event_id,user_id' });
      if (error) throw error;
      return status;
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['my-rsvps', userId] });
      qc.invalidateQueries({ queryKey: ['events-all'] });
      toast.success(_d ? `RSVP updated!` : 'RSVP cancelled');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ──────────────────────────────────────────────
// Calendar grid helpers
// ──────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ──────────────────────────────────────────────
// Create Event Modal
// ──────────────────────────────────────────────
interface CreateEventModalProps {
  onClose: () => void;
  userId: string;
  defaultDate?: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, userId, defaultDate }) => {
  const createEvent = useCreateEvent();
  const thumbnailRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('10:00');
  const [location, setLocation] = useState('Kigali City');
  const [eventType, setEventType] = useState('Cultural Ceremony');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const inp = "w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors";

  const handleImage = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) { toast.error('Title and date are required'); return; }
    setUploading(true);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const path = `${userId}/events/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('umurage-media')
          .upload(path, imageFile, { contentType: imageFile.type });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('umurage-media').getPublicUrl(path);
        imageUrl = data.publicUrl;
      }

      await createEvent.mutateAsync({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        location: location,
        event_type: eventType,
        image_url: imageUrl,
      });

      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to create event');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 animate-fade-in overflow-y-auto"
        style={{ background: 'rgba(22,14,5,0.99)', border: '1px solid rgba(200,150,12,0.3)', maxHeight: '95vh' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-umurage-subtle hover:text-umurage-cream transition-colors">
          <X size={20} />
        </button>

        <div className="mb-5">
          <div className="w-10 h-1 bg-umurage-gold rounded-full mb-3" />
          <h2 className="font-cinzel text-umurage-gold text-xl font-bold">Create Cultural Event</h2>
          <p className="text-umurage-muted text-sm mt-1">Share a cultural gathering with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden h-36 group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => thumbnailRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-umurage-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-umurage-gold/40 hover:bg-umurage-surface/50 transition-all cursor-pointer"
            >
              <Image size={22} className="text-umurage-subtle" />
              <span className="text-umurage-muted text-sm">Upload event cover image</span>
              <span className="text-umurage-subtle text-xs">Optional — JPG, PNG, WebP</span>
            </button>
          )}
          <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />

          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Event Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Umuganura Harvest Festival 2026" className={inp} required />
          </div>

          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe this cultural event, what to expect, who should attend..."
              rows={3} className={`${inp} resize-none leading-relaxed`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Date *</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`${inp} cursor-pointer`} required />
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Time</label>
              <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                className={`${inp} cursor-pointer`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Event Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className={`${inp} cursor-pointer`}>
                {EVENT_TYPES.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Location</label>
              <select value={location} onChange={e => setLocation(e.target.value)} className={`${inp} cursor-pointer`}>
                {RWANDAN_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={uploading || !title.trim()} className="btn-gold w-full py-3 font-semibold flex items-center justify-center gap-2">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {uploading ? 'Creating Event...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Event Detail Sidebar / Modal
// ──────────────────────────────────────────────
interface EventDetailProps {
  event: Event;
  rsvpStatus?: string;
  onRSVP: (status: string) => void;
  onClose: () => void;
  isPending: boolean;
}

const EventDetailPanel: React.FC<EventDetailProps> = ({ event, rsvpStatus, onRSVP, onClose, isPending }) => {
  const { isAuthenticated, openAuth } = useAuth();
  const dateObj = new Date(event.event_date + 'T00:00:00');
  const typeStyle = TYPE_STYLES[event.event_type || ''] || 'bg-umurage-card text-umurage-muted border-umurage-border';

  const handleRSVP = (status: string) => {
    if (!isAuthenticated) { openAuth('login'); return; }
    onRSVP(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: 'rgba(22,14,5,0.99)', border: '1px solid rgba(200,150,12,0.25)' }}
      >
        {/* Cover image */}
        {event.image_url ? (
          <div className="relative h-44 overflow-hidden">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <X size={16} />
            </button>
            <span className={`absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg border ${typeStyle}`}>
              {TYPE_EMOJIS[event.event_type || ''] || '📅'} {event.event_type}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 pb-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${typeStyle}`}>
              {TYPE_EMOJIS[event.event_type || ''] || '📅'} {event.event_type}
            </span>
            <button onClick={onClose} className="text-umurage-subtle hover:text-umurage-cream transition-colors">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="p-5">
          <h3 className="font-cinzel text-umurage-gold text-xl font-bold mb-3 leading-snug">{event.title}</h3>

          {event.description && (
            <p className="text-umurage-muted text-sm leading-relaxed mb-4">{event.description}</p>
          )}

          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-3 text-umurage-muted text-sm">
              <Calendar size={15} className="text-umurage-gold flex-shrink-0" />
              <span>
                {dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-3 text-umurage-muted text-sm">
                <MapPin size={15} className="text-umurage-gold flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {(event.rsvp_count || 0) > 0 && (
              <div className="flex items-center gap-3 text-umurage-muted text-sm">
                <Users size={15} className="text-umurage-gold flex-shrink-0" />
                <span>{event.rsvp_count} people going</span>
              </div>
            )}
          </div>

          {/* RSVP buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleRSVP('going')}
              disabled={isPending}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                rsvpStatus === 'going'
                  ? 'bg-green-900/30 text-green-400 border-green-700/50'
                  : 'border-umurage-border text-umurage-muted hover:border-green-700/40 hover:text-green-400 hover:bg-green-900/10'
              }`}
            >
              {isPending && rsvpStatus !== 'going' ? <Loader2 size={12} className="animate-spin mx-auto" /> : null}
              {rsvpStatus === 'going' ? '✓ Going' : '✈️ Going'}
            </button>
            <button
              onClick={() => handleRSVP('interested')}
              disabled={isPending}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                rsvpStatus === 'interested'
                  ? 'bg-umurage-gold/20 text-umurage-gold border-umurage-gold/50'
                  : 'border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-gold hover:bg-umurage-gold/10'
              }`}
            >
              {rsvpStatus === 'interested' ? '★ Interested' : '☆ Interested'}
            </button>
            <button
              onClick={() => handleRSVP('not_going')}
              disabled={isPending}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                rsvpStatus === 'not_going'
                  ? 'bg-red-900/20 text-red-400 border-red-800/40'
                  : 'border-umurage-border text-umurage-muted hover:border-red-800/40 hover:text-red-400 hover:bg-red-900/10'
              }`}
            >
              {rsvpStatus === 'not_going' ? '✗ Declined' : '✗ Not Going'}
            </button>
          </div>

          {!isAuthenticated && (
            <p className="text-umurage-subtle text-xs text-center mt-3">
              <button onClick={() => openAuth('login')} className="text-umurage-gold hover:underline">Sign in</button> to RSVP
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Calendar Component
// ──────────────────────────────────────────────
interface CalendarViewProps {
  events: Event[];
  onDayClick: (dateStr: string, dayEvents: Event[]) => void;
  onEventClick: (event: Event) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onDayClick, onEventClick }) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayStr = now.toISOString().split('T')[0];

  // Build event map: dateStr → events[]
  const eventMap = new Map<string, Event[]>();
  events.forEach(ev => {
    const d = ev.event_date.split('T')[0];
    if (!eventMap.has(d)) eventMap.set(d, []);
    eventMap.get(d)!.push(ev);
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="umurage-card rounded-2xl overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-umurage-border">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full border border-umurage-border flex items-center justify-center text-umurage-muted hover:text-umurage-cream hover:border-umurage-gold/40 transition-all">
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-cinzel text-umurage-gold font-bold text-lg">
          {MONTHS[viewMonth]} {viewYear}
        </h2>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full border border-umurage-border flex items-center justify-center text-umurage-muted hover:text-umurage-cream hover:border-umurage-gold/40 transition-all">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-umurage-border">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center py-2.5 text-umurage-subtle text-xs font-semibold uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-16 sm:h-20 border-r border-b border-umurage-border/40 bg-umurage-surface/10" />;
          }
          const dateStr = toDateStr(viewYear, viewMonth, day);
          const dayEvents = eventMap.get(dateStr) || [];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr, dayEvents)}
              className={`h-16 sm:h-20 border-r border-b border-umurage-border/40 p-1.5 cursor-pointer transition-all duration-150 group relative ${
                isPast ? 'opacity-50' : 'hover:bg-umurage-surface/50'
              } ${isToday ? 'bg-umurage-gold/8 border-umurage-gold/30' : ''}`}
            >
              <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                isToday
                  ? 'bg-umurage-gold text-umurage-bg'
                  : 'text-umurage-muted group-hover:text-umurage-cream'
              }`}>
                {day}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map(ev => (
                  <div
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    className={`text-[9px] sm:text-[10px] truncate px-1 py-0.5 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity leading-tight ${
                      TYPE_STYLES[ev.event_type || '']?.replace('border-', 'border ') || 'bg-umurage-gold/20 text-umurage-gold'
                    }`}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[9px] text-umurage-subtle pl-1">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Event Card for List View
// ──────────────────────────────────────────────
interface EventCardProps {
  event: Event;
  rsvpStatus?: string;
  onRSVP: (eventId: string, status: string) => void;
  onClick: () => void;
  isPending: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, rsvpStatus, onRSVP, onClick, isPending }) => {
  const { isAuthenticated, openAuth } = useAuth();
  const dateObj = new Date(event.event_date + 'T00:00:00');
  const isUpcoming = event.event_date >= new Date().toISOString().split('T')[0];
  const typeStyle = TYPE_STYLES[event.event_type || ''] || 'bg-umurage-card text-umurage-muted border-umurage-border';

  const handleRSVP = (e: React.MouseEvent, status: string) => {
    e.stopPropagation();
    if (!isAuthenticated) { openAuth('login'); return; }
    onRSVP(event.id, status);
  };

  return (
    <div
      onClick={onClick}
      className="umurage-card rounded-2xl overflow-hidden group cursor-pointer animate-fade-in hover:border-umurage-gold/20 transition-all duration-200"
    >
      {/* Image */}
      {event.image_url && (
        <div className="relative h-40 overflow-hidden">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg border ${typeStyle}`}>
            {TYPE_EMOJIS[event.event_type || ''] || '📅'} {event.event_type}
          </span>
          {!isUpcoming && (
            <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white">Past</span>
          )}
        </div>
      )}

      <div className="p-5">
        {!event.image_url && (
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${typeStyle}`}>
              {TYPE_EMOJIS[event.event_type || ''] || '📅'} {event.event_type}
            </span>
            {!isUpcoming && (
              <span className="text-xs text-umurage-subtle">Past event</span>
            )}
          </div>
        )}

        <h3 className="text-umurage-cream font-semibold text-base mb-3 leading-snug group-hover:text-umurage-gold transition-colors">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-umurage-muted text-sm mb-3 line-clamp-2 leading-relaxed">{event.description}</p>
        )}

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-umurage-muted text-sm">
            <Calendar size={14} className="text-umurage-gold flex-shrink-0" />
            <span>
              {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-umurage-muted text-sm">
              <MapPin size={14} className="text-umurage-gold flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {(event.rsvp_count || 0) > 0 && (
            <div className="flex items-center gap-2 text-umurage-muted text-sm">
              <Users size={14} className="text-umurage-gold flex-shrink-0" />
              <span>{event.rsvp_count} attending</span>
            </div>
          )}
        </div>

        {/* RSVP buttons */}
        {isUpcoming ? (
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={e => handleRSVP(e, 'going')}
              disabled={isPending}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                rsvpStatus === 'going'
                  ? 'bg-green-900/30 text-green-400 border-green-700/50'
                  : 'btn-gold'
              }`}
            >
              {isPending ? <Loader2 size={12} className="animate-spin mx-auto" /> : rsvpStatus === 'going' ? '✓ Going' : '✈️ RSVP — Going'}
            </button>
            <button
              onClick={e => handleRSVP(e, 'interested')}
              disabled={isPending}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                rsvpStatus === 'interested'
                  ? 'bg-umurage-gold/20 text-umurage-gold border-umurage-gold/50'
                  : 'border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-gold'
              }`}
            >
              {rsvpStatus === 'interested' ? '★' : '☆'}
            </button>
          </div>
        ) : (
          <div className="py-2 text-center text-umurage-subtle text-xs border border-umurage-border rounded-xl">
            This event has passed
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Day Events Panel (shown when clicking a calendar day)
// ──────────────────────────────────────────────
interface DayPanelProps {
  dateStr: string;
  events: Event[];
  rsvpMap: Map<string, string>;
  onRSVP: (eventId: string, status: string) => void;
  isPending: boolean;
  onEventClick: (event: Event) => void;
  onClose: () => void;
  onCreateEvent: () => void;
  isAuthenticated: boolean;
}

const DayPanel: React.FC<DayPanelProps> = ({ dateStr, events, rsvpMap, onRSVP, isPending, onEventClick, onClose, onCreateEvent, isAuthenticated }) => {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const isPast = dateStr < new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 animate-fade-in overflow-y-auto"
        style={{ background: 'rgba(22,14,5,0.99)', border: '1px solid rgba(200,150,12,0.25)', maxHeight: '80vh' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-umurage-subtle text-xs font-semibold uppercase tracking-wider">
              {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <h3 className="font-cinzel text-umurage-gold text-lg font-bold">
              {dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
          </div>
          <button onClick={onClose} className="text-umurage-subtle hover:text-umurage-cream transition-colors">
            <X size={20} />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={32} className="text-umurage-gold/20 mx-auto mb-3" />
            <p className="text-umurage-muted text-sm mb-4">No events on this day</p>
            {!isPast && isAuthenticated && (
              <button onClick={() => { onClose(); onCreateEvent(); }} className="btn-gold text-sm px-5 py-2">
                + Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => {
              const typeStyle = TYPE_STYLES[ev.event_type || ''] || 'bg-umurage-card text-umurage-muted border-umurage-border';
              return (
                <div
                  key={ev.id}
                  onClick={() => { onClose(); onEventClick(ev); }}
                  className="umurage-card rounded-xl p-4 cursor-pointer hover:border-umurage-gold/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {ev.image_url && (
                      <img src={ev.image_url} alt={ev.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeStyle} inline-block mb-1.5`}>
                        {ev.event_type}
                      </span>
                      <h4 className="text-umurage-cream text-sm font-semibold leading-snug">{ev.title}</h4>
                      {ev.location && (
                        <p className="text-umurage-subtle text-xs mt-0.5 flex items-center gap-1">
                          <MapPin size={10} /> {ev.location}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${
                      rsvpMap.get(ev.id) === 'going' ? 'bg-green-900/30 text-green-400 border-green-700/50' :
                      rsvpMap.get(ev.id) === 'interested' ? 'bg-umurage-gold/20 text-umurage-gold border-umurage-gold/40' : 'hidden'
                    }`}>
                      {rsvpMap.get(ev.id) === 'going' ? '✓' : rsvpMap.get(ev.id) === 'interested' ? '★' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
            {!isPast && isAuthenticated && (
              <button onClick={() => { onClose(); onCreateEvent(); }} className="btn-outline-gold text-sm w-full py-2 flex items-center justify-center gap-1.5 mt-2">
                <Plus size={13} /> Add Event on This Day
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Events Page
// ──────────────────────────────────────────────
const EventsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, openAuth } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dayPanel, setDayPanel] = useState<{ dateStr: string; events: Event[] } | null>(null);
  const [createDefaultDate, setCreateDefaultDate] = useState('');

  const { data: events = [], isLoading } = useAllEvents(selectedFilter === 'All' ? undefined : selectedFilter);
  const { data: rsvpMap = new Map<string, string>() } = useMyRSVPs(user?.id);
  const rsvpMutation = useRSVP();

  const handleRSVP = (eventId: string, status: string) => {
    if (!user) { openAuth('login'); return; }
    rsvpMutation.mutate({
      eventId,
      userId: user.id,
      status,
      currentStatus: rsvpMap.get(eventId),
    });
  };

  const handleDayClick = (dateStr: string, dayEvents: Event[]) => {
    setDayPanel({ dateStr, events: dayEvents });
  };

  const handleCreateFromDay = (dateStr?: string) => {
    if (dateStr) setCreateDefaultDate(dateStr);
    if (!isAuthenticated) { openAuth('login'); return; }
    setShowCreateModal(true);
  };

  const upcomingEvents = events.filter(e => e.event_date >= new Date().toISOString().split('T')[0]);
  const pastEvents = events.filter(e => e.event_date < new Date().toISOString().split('T')[0]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Calendar size={22} className="text-umurage-gold" />
            <h1 className="font-cinzel text-2xl sm:text-3xl text-umurage-gold font-bold">{t('events.title')}</h1>
          </div>
          <p className="text-umurage-muted text-sm">Cultural festivals, ceremonies, exhibitions, and community gatherings across Rwanda.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-umurage-border rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'calendar' ? 'bg-umurage-gold/20 text-umurage-gold' : 'text-umurage-muted hover:text-umurage-cream'}`}
            >
              <Calendar size={13} /> Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-umurage-gold/20 text-umurage-gold' : 'text-umurage-muted hover:text-umurage-cream'}`}
            >
              <Filter size={13} /> List
            </button>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Plus size={14} /> Create Event
            </button>
          ) : (
            <button onClick={() => openAuth('login')} className="btn-outline-gold text-xs py-2 px-4 flex items-center gap-1.5">
              <Plus size={14} /> Create Event
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {EVENT_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setSelectedFilter(type)}
            className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 ${
              selectedFilter === type
                ? 'bg-umurage-gold/20 text-umurage-gold border-umurage-gold/50'
                : 'border-umurage-border text-umurage-muted hover:text-umurage-cream hover:border-umurage-gold/30'
            }`}
          >
            {type === 'All' ? '🌍 ' : `${TYPE_EMOJIS[type] || ''} `}{type}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="text-umurage-gold animate-spin" />
        </div>
      ) : (
        <>
          {/* ───── Calendar View ───── */}
          {viewMode === 'calendar' && (
            <div className="space-y-6">
              <CalendarView
                events={events}
                onDayClick={handleDayClick}
                onEventClick={setSelectedEvent}
              />

              {/* Upcoming events strip below calendar */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h2 className="text-umurage-cream font-semibold mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-umurage-gold" />
                    Upcoming Events
                    <span className="text-umurage-subtle text-xs font-normal">({upcomingEvents.length})</span>
                  </h2>
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 5).map(ev => {
                      const dateObj = new Date(ev.event_date + 'T00:00:00');
                      const typeStyle = TYPE_STYLES[ev.event_type || ''] || 'bg-umurage-card text-umurage-muted border-umurage-border';
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="umurage-card rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:border-umurage-gold/20 transition-all group"
                        >
                          {/* Date block */}
                          <div className="w-12 h-12 rounded-xl bg-umurage-gold/10 border border-umurage-gold/30 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-umurage-gold text-[10px] font-semibold uppercase">
                              {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-umurage-gold font-bold text-lg leading-none">
                              {dateObj.getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeStyle} inline-block mb-1`}>
                              {ev.event_type}
                            </span>
                            <h4 className="text-umurage-cream text-sm font-semibold truncate group-hover:text-umurage-gold transition-colors">
                              {ev.title}
                            </h4>
                            {ev.location && (
                              <p className="text-umurage-subtle text-xs flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {ev.location}
                              </p>
                            )}
                          </div>
                          {/* RSVP chip */}
                          {rsvpMap.get(ev.id) ? (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                              rsvpMap.get(ev.id) === 'going' ? 'bg-green-900/30 text-green-400 border-green-700/50' :
                              'bg-umurage-gold/20 text-umurage-gold border-umurage-gold/40'
                            }`}>
                              {rsvpMap.get(ev.id) === 'going' ? '✓ Going' : '★ Interested'}
                            </span>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); handleRSVP(ev.id, 'going'); }}
                              className="btn-gold text-xs px-3 py-1.5 flex-shrink-0 whitespace-nowrap"
                            >
                              RSVP
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {events.length === 0 && (
                <div className="text-center py-16">
                  <Calendar size={48} className="text-umurage-gold/20 mx-auto mb-4" />
                  <h3 className="text-umurage-cream font-semibold mb-2">No events {selectedFilter !== 'All' ? `for "${selectedFilter}"` : 'yet'}</h3>
                  <p className="text-umurage-muted text-sm mb-5">Be the first to create a cultural event!</p>
                  {isAuthenticated && (
                    <button onClick={() => setShowCreateModal(true)} className="btn-gold px-6 py-2.5">
                      + Create Event
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ───── List View ───── */}
          {viewMode === 'list' && (
            <div>
              {upcomingEvents.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-umurage-cream font-semibold mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-umurage-gold" /> Upcoming
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingEvents.map(ev => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        rsvpStatus={rsvpMap.get(ev.id)}
                        onRSVP={handleRSVP}
                        onClick={() => setSelectedEvent(ev)}
                        isPending={rsvpMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-umurage-muted font-semibold mb-4 flex items-center gap-2">
                    <Clock size={16} className="opacity-50" /> Past Events
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                    {pastEvents.map(ev => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        rsvpStatus={rsvpMap.get(ev.id)}
                        onRSVP={handleRSVP}
                        onClick={() => setSelectedEvent(ev)}
                        isPending={rsvpMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}

              {events.length === 0 && (
                <div className="text-center py-16">
                  <Calendar size={48} className="text-umurage-gold/20 mx-auto mb-4" />
                  <h3 className="text-umurage-cream font-semibold mb-2">No events {selectedFilter !== 'All' ? `for "${selectedFilter}"` : 'yet'}</h3>
                  <p className="text-umurage-muted text-sm mb-5">Be the first to create a cultural event!</p>
                  {isAuthenticated && (
                    <button onClick={() => setShowCreateModal(true)} className="btn-gold px-6 py-2.5">+ Create Event</button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && user && (
        <CreateEventModal
          onClose={() => { setShowCreateModal(false); setCreateDefaultDate(''); }}
          userId={user.id}
          defaultDate={createDefaultDate || undefined}
        />
      )}

      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          rsvpStatus={rsvpMap.get(selectedEvent.id)}
          onRSVP={status => handleRSVP(selectedEvent.id, status)}
          onClose={() => setSelectedEvent(null)}
          isPending={rsvpMutation.isPending}
        />
      )}

      {dayPanel && (
        <DayPanel
          dateStr={dayPanel.dateStr}
          events={dayPanel.events}
          rsvpMap={rsvpMap}
          onRSVP={handleRSVP}
          isPending={rsvpMutation.isPending}
          onEventClick={ev => { setDayPanel(null); setSelectedEvent(ev); }}
          onClose={() => setDayPanel(null)}
          onCreateEvent={() => handleCreateFromDay(dayPanel.dateStr)}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
};

export default EventsPage;
