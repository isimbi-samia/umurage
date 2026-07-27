import React, { useState } from 'react';
import { GraduationCap, Clock, Users, ChevronRight, Award, Zap, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { COURSES } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrollments, useEnrollCourse } from '@/hooks/useFollow';

const LEVEL_COLORS = {
  beginner: 'bg-green-900/40 text-green-300 border-green-800/50',
  intermediate: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
  advanced: 'bg-red-900/40 text-red-300 border-red-800/50',
};

const Courses: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, openAuth } = useAuth();
  const { data: enrollments = {}, isLoading } = useEnrollments(user?.id);
  const enrollCourse = useEnrollCourse();

  const handleEnroll = (courseId: string) => {
    if (!isAuthenticated || !user) { openAuth('signup'); return; }
    if (!enrollments[courseId]) {
      enrollCourse.mutate({ userId: user.id, courseId });
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('courses.title')}</h1>
        <p className="text-umurage-muted text-base">
          Structured cultural education — learn Rwanda's heritage, earn certificates, participate in Digital Itorero.
        </p>
      </div>

      {/* Digital Itorero Banner */}
      <div
        className="rounded-2xl p-6 mb-8 relative overflow-hidden border border-umurage-gold/30"
        style={{ background: 'linear-gradient(135deg, rgba(200,150,12,0.15) 0%, rgba(139,105,20,0.1) 100%)' }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Award size={20} className="text-umurage-gold" />
            <span className="font-cinzel text-umurage-gold font-bold text-lg">Digital Itorero</span>
          </div>
          <p className="text-umurage-cream text-sm mb-4 max-w-lg leading-relaxed">
            Rwanda's official digital cultural education program. Complete courses, earn verified certificates recognized across Rwanda, and carry your heritage with pride.
          </p>
          <div className="flex gap-3">
            <button onClick={() => handleEnroll('course4')} className="btn-gold text-sm px-6 py-2.5">
              {enrollments['course4'] ? 'Continue Digital Itorero' : 'Enroll in Digital Itorero'}
            </button>
            <button className="btn-outline-gold text-sm px-5 py-2.5">Learn More</button>
          </div>
        </div>
      </div>

      {/* Certificate types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { title: 'Beginner Cultural Certificate', icon: '🌱', xp: '500 XP' },
          { title: 'Intermediate Cultural Certificate', icon: '🌿', xp: '1000 XP' },
          { title: 'Cultural Leadership Certificate', icon: '🏆', xp: '2000 XP' },
          { title: 'Cultural Ambassador', icon: '🎖️', xp: '5000 XP' },
        ].map((cert, i) => (
          <div key={i} className="umurage-card rounded-xl p-4 text-center">
            <span className="text-3xl block mb-2">{cert.icon}</span>
            <p className="text-umurage-cream text-xs font-semibold leading-tight mb-1">{cert.title}</p>
            <span className="text-umurage-gold text-[10px] font-bold flex items-center justify-center gap-1">
              <Zap size={10} />{cert.xp}
            </span>
          </div>
        ))}
      </div>

      {/* Courses grid */}
      <h2 className="section-title mb-5">Available Courses</h2>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="text-umurage-gold animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {COURSES.map(course => {
            const enrollment = enrollments[course.id];
            const isEnrolled = !!enrollment;
            const progress = enrollment?.progress ?? course.progress ?? 0;

            return (
              <div key={course.id} className="umurage-card rounded-2xl overflow-hidden group cursor-pointer">
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-dark-gradient" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${LEVEL_COLORS[course.level]}`}>
                      {course.level}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded border bg-umurage-card/80 text-umurage-muted border-umurage-border">
                      {course.category}
                    </span>
                  </div>
                  {isEnrolled && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex justify-between text-[10px] text-white/70 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-umurage-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-umurage-cream font-semibold text-base leading-snug mb-2 group-hover:text-umurage-gold transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-umurage-muted text-sm leading-relaxed mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex items-center gap-4 text-umurage-subtle text-xs mb-4">
                    <span className="flex items-center gap-1"><Clock size={11} />{course.duration}</span>
                    <span className="flex items-center gap-1"><GraduationCap size={11} />{course.lessons} lessons</span>
                    <span className="flex items-center gap-1"><Users size={11} />{course.enrolled.toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-umurage-gold"><Zap size={11} />{course.xp} XP</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-umurage-muted text-xs">By {course.instructor}</span>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollCourse.isPending}
                      className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                        isEnrolled
                          ? 'bg-umurage-gold/10 text-umurage-gold border border-umurage-gold/30'
                          : 'btn-gold'
                      }`}
                    >
                      {enrollCourse.isPending ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={14} />}
                      {isEnrolled ? 'Continue' : 'Enroll'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Courses;
