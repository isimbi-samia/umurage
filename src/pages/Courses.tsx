import React, { useState } from 'react';
import { GraduationCap, Clock, Users, ChevronRight, Award, Zap, Loader2, Gamepad2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CourseDetailModal } from '@/components/features/CourseDetailModal';
import { CulturalChallenges } from '@/components/features/CulturalChallenges';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-900/40 text-green-300 border-green-800/50',
  intermediate: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
  advanced: 'bg-red-900/40 text-red-300 border-red-800/50',
};

const SEED_COURSES = [
  {
    id: 'course-1',
    title: 'Rwandan Language & Oral Traditions (Ikinyarwanda)',
    description: 'Master authentic Kinyarwanda proverb structures (Imigani), ancient idioms, and ceremonial court etiquette.',
    level: 'beginner',
    lessons: 12,
    duration: '4 weeks',
    enrolled: 420,
    thumbnail: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=500&h=350&fit=crop',
    instructor: 'Abiru Cultural Panel',
    category: 'Language',
    xp: 500,
  },
  {
    id: 'course-2',
    title: 'Royal Court Traditions & Inyambo Heritage',
    description: 'Deep dive into 1,800 years of the Kingdom of Rwanda, sacred royal symbols, Amasunzu hairstyles, and Inyambo cattle.',
    level: 'intermediate',
    lessons: 16,
    duration: '6 weeks',
    enrolled: 680,
    thumbnail: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=500&h=350&fit=crop',
    instructor: 'Elder Emmanuel Ntezimana',
    category: 'History',
    xp: 1000,
  },
  {
    id: 'course-3',
    title: 'Traditional Imigongo Arts & Sacred Crafts',
    description: 'Learn the techniques of 18th-century geometric cow dung relief art invented in Gisaka.',
    level: 'beginner',
    lessons: 8,
    duration: '3 weeks',
    enrolled: 310,
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=500&h=350&fit=crop',
    instructor: 'Gisaka Master Craftsman',
    category: 'Arts',
    xp: 600,
  },
  {
    id: 'course-4',
    title: 'Digital Itorero — National Cultural Leadership',
    description: 'Rwanda official digital cultural education program. Earn verified certificates recognized across Rwanda.',
    level: 'advanced',
    lessons: 20,
    duration: '8 weeks',
    enrolled: 1250,
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=350&fit=crop',
    instructor: 'Itorero Cultural Council',
    category: 'Leadership',
    xp: 2000,
  },
];

export const Courses: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, openAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalogue' | 'challenges'>('catalogue');
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Fetch enrollments for current user
  const { data: userEnrollments = {}, refetch: refetchEnrollments } = useQuery({
    queryKey: ['user-course-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        console.warn('Enrollments query error:', error);
      }

      const map: Record<string, any> = {};
      (data || []).forEach((e: any) => {
        map[e.course_id] = e;
      });
      return map;
    },
    enabled: !!user?.id,
  });

  // Query database courses or fallback to seed
  const { data: coursesList = [], isLoading } = useQuery({
    queryKey: ['db-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.warn('Courses query error:', error);
      }

      if (data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          level: c.level || 'beginner',
          lessons: 12,
          duration: c.duration || '4 weeks',
          enrolled: 250,
          thumbnail: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=500&h=350&fit=crop',
          instructor: c.instructor_name || 'Umurage Elder',
          category: c.category || 'Heritage',
          xp: c.xp || 500,
        }));
      }

      return SEED_COURSES;
    },
    staleTime: 60000,
  });

  const handleOpenCourse = (course: any) => {
    if (!isAuthenticated) {
      openAuth('signup');
      return;
    }
    setSelectedCourse(course);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('courses.title')}</h1>
          <p className="text-umurage-muted text-base">
            Structured cultural education — learn Rwanda's heritage, earn certificates, and join Digital Itorero.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 bg-[#1b120b] p-1.5 rounded-xl border border-umurage-border">
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'catalogue'
                ? 'bg-umurage-gold text-umurage-bg shadow-sm'
                : 'text-umurage-muted hover:text-umurage-cream'
            }`}
          >
            Course Catalogue
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'challenges'
                ? 'bg-umurage-gold text-umurage-bg shadow-sm'
                : 'text-umurage-muted hover:text-umurage-cream'
            }`}
          >
            <Gamepad2 size={15} /> Cultural Challenges
          </button>
        </div>
      </div>

      {activeTab === 'challenges' ? (
        <CulturalChallenges />
      ) : (
        <>
          {/* Digital Itorero Banner */}
          <div
            className="rounded-2xl p-6 mb-8 relative overflow-hidden border border-umurage-gold/30"
            style={{ background: 'linear-gradient(135deg, rgba(200,150,12,0.15) 0%, rgba(139,105,20,0.1) 100%)' }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Award size={20} className="text-umurage-gold" />
                <span className="font-cinzel text-umurage-gold font-bold text-lg">Digital Itorero Program</span>
              </div>
              <p className="text-umurage-cream text-sm mb-4 max-w-lg leading-relaxed">
                Rwanda's official digital cultural education program. Complete verified modules, earn recognized certificates, and carry your heritage with pride.
              </p>
              <div className="flex gap-3">
                <button onClick={() => handleOpenCourse(SEED_COURSES[3])} className="btn-gold text-sm px-6 py-2.5 font-bold">
                  {userEnrollments['course-4'] ? 'Continue Digital Itorero' : 'Enroll in Digital Itorero'}
                </button>
              </div>
            </div>
          </div>

          {/* Certificate badges preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { title: 'Beginner Cultural Certificate', icon: '🌱', xp: '500 XP' },
              { title: 'Intermediate Cultural Certificate', icon: '🌿', xp: '1000 XP' },
              { title: 'Cultural Leadership Certificate', icon: '🏆', xp: '2000 XP' },
              { title: 'Cultural Ambassador', icon: '🎖️', xp: '5000 XP' },
            ].map((cert, i) => (
              <div key={i} className="umurage-card rounded-xl p-4 text-center border border-umurage-border">
                <span className="text-3xl block mb-2">{cert.icon}</span>
                <p className="text-umurage-cream text-xs font-semibold leading-tight mb-1">{cert.title}</p>
                <span className="text-umurage-gold text-[10px] font-bold flex items-center justify-center gap-1">
                  <Zap size={10} />{cert.xp}
                </span>
              </div>
            ))}
          </div>

          {/* Available Courses Grid */}
          <h2 className="section-title mb-5">Available Verified Courses</h2>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="text-umurage-gold animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {coursesList.map((course: any) => {
                const enrollment = userEnrollments[course.id];
                const isEnrolled = !!enrollment;
                const progress = enrollment?.progress ?? 0;

                return (
                  <div
                    key={course.id}
                    onClick={() => handleOpenCourse(course)}
                    className="umurage-card rounded-2xl overflow-hidden group cursor-pointer border border-umurage-border flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-dark-gradient" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner}`}>
                            {course.level}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded border bg-umurage-card/80 text-umurage-muted border-umurage-border">
                            {course.category}
                          </span>
                        </div>
                        {isEnrolled && (
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex justify-between text-[10px] text-white/90 font-semibold mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-umurage-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-umurage-cream font-semibold text-base leading-snug mb-2 group-hover:text-umurage-gold transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-umurage-muted text-xs leading-relaxed mb-4 line-clamp-2">{course.description}</p>

                        <div className="flex items-center gap-4 text-umurage-subtle text-xs mb-4">
                          <span className="flex items-center gap-1"><Clock size={11} />{course.duration}</span>
                          <span className="flex items-center gap-1"><GraduationCap size={11} />{course.lessons} lessons</span>
                          <span className="flex items-center gap-1 text-umurage-gold"><Zap size={11} />{course.xp} XP</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center justify-between border-t border-umurage-border/40 mt-auto">
                      <span className="text-umurage-muted text-xs">By {course.instructor}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenCourse(course); }}
                        className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 ${
                          isEnrolled
                            ? 'bg-umurage-gold/15 text-umurage-gold border border-umurage-gold/30'
                            : 'btn-gold'
                        }`}
                      >
                        <ChevronRight size={14} />
                        {isEnrolled ? 'Continue' : 'Enroll'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          course={selectedCourse}
          enrollment={userEnrollments[selectedCourse.id]}
          onEnrollmentChanged={() => refetchEnrollments()}
        />
      )}
    </div>
  );
};

export default Courses;
