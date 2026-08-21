import React, { useState } from 'react';
import { BookOpen, CheckCircle, Clock, GraduationCap, Play, X, Loader2, Award, ArrowLeft, Check, RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  enrollment?: any;
  onEnrollmentChanged: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  isOpen,
  onClose,
  course,
  enrollment,
  onEnrollmentChanged,
}) => {
  const { user } = useAuth();
  const [schedulePreference, setSchedulePreference] = useState<'self-paced' | 'daily' | 'weekends'>('self-paced');
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'quiz'>('overview');
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  if (!isOpen || !course) return null;

  const isEnrolled = !!enrollment;
  const progressPercent = enrollment?.progress ?? 0;

  // Sample structured lessons for the course
  const lessons = course.lessons_data || [
    {
      title: '1. Introduction to Rwandan Royal Heritage & Roots',
      duration: '15 mins',
      content:
        "Rwanda's heritage spans over 1,800 years of documented oral history, traditional governance, and sacred royal symbols such as Kalinga, Inyambo cattle, and Ubwitegerezo.",
    },
    {
      title: '2. Ubwuzu & Umuganura Ceremonial Values',
      duration: '20 mins',
      content:
        "Umuganura is the national harvest festival celebrating unity, sorghum, cattle, and community self-reliance. Learn the chants and oral recitations performed by traditional Abiru elders.",
    },
    {
      title: '3. Traditional Music & Sacred Inanga Chants',
      duration: '25 mins',
      content:
        "The Inanga is Rwanda's premier traditional string instrument. Discover historic compositions by master players such as Thomas Kirusu and Sophie Nzayisenga.",
    },
  ];

  // Sample quiz questions
  const quizQuestions = [
    {
      id: 1,
      question: 'What is the historical significance of the Umuganura festival in Rwanda?',
      options: [
        'A) Celebrating the national harvest and community unity',
        'B) Marking the end of the rainy season',
        'C) A trade fair for foreign merchants',
        'D) A sports competition',
      ],
      correct: 'A',
      explanation: "Umuganura has been celebrated for over 1,800 years as Rwanda's national harvest festival promoting unity and gratitude.",
    },
    {
      id: 2,
      question: 'Which sacred animal was traditionally bred exclusively for the Royal Court of Rwanda?',
      options: [
        'A) Sacred Lions',
        'B) Inyambo long-horned cattle',
        'C) Mountain Gorillas',
        'D) Royal Falcons',
      ],
      correct: 'B',
      explanation: 'Inyambo are the majestic long-horned cattle trained to march in royal court ceremonies.',
    },
  ];

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please sign in to enroll in courses.');
      return;
    }

    setIsEnrolling(true);
    try {
      const { error } = await supabase.from('enrollments').upsert({
        user_id: user.id,
        course_id: course.id,
        progress: 10,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(`Successfully enrolled in ${course.title} (${schedulePreference})!`);
      onEnrollmentChanged();
      setActiveTab('lessons');
    } catch (err: any) {
      console.error('Enrollment error:', err);
      toast.error(err.message || 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleLeaveCourse = async () => {
    if (!user || !enrollment) return;
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', course.id);

      if (error) throw error;

      toast.success('Unenrolled from course. Your progress has been reset.');
      onEnrollmentChanged();
      onClose();
    } catch (err: any) {
      toast.error('Failed to leave course');
    }
  };

  const handleCompleteLesson = async () => {
    if (!user || !isEnrolled) return;
    const nextProgress = Math.min(100, Math.round(((activeLessonIndex + 1) / lessons.length) * 100));

    try {
      await supabase
        .from('enrollments')
        .update({ progress: nextProgress, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('course_id', course.id);

      toast.success(`Lesson completed! Progress: ${nextProgress}%`);
      onEnrollmentChanged();
      if (activeLessonIndex < lessons.length - 1) {
        setActiveLessonIndex((prev) => prev + 1);
      } else {
        setActiveTab('quiz');
      }
    } catch (e) {
      console.error('Error updating progress:', e);
    }
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        score += 50;
      }
    });
    setQuizScore(score);
    if (score >= 70) {
      toast.success('Congratulations! You passed the cultural quiz and earned your certificate!');
    } else {
      toast.error('Keep reviewing! Score threshold for certificate is 70%.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#18110a] border border-[#5c3c1e] p-6 z-10 animate-fade-in text-umurage-cream">
        <button onClick={onClose} className="absolute top-4 right-4 text-umurage-subtle hover:text-umurage-cream">
          <X size={20} />
        </button>

        {/* Course Header Banner */}
        <div className="flex items-start gap-4 mb-5 border-b border-[#4a2e16] pb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={28} className="text-umurage-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/40">
                {course.level || 'Beginner'}
              </span>
              <span className="text-xs text-umurage-subtle">• {course.duration || '4 weeks'}</span>
            </div>
            <h2 className="font-cinzel text-2xl text-umurage-gold font-bold">{course.title}</h2>
            <p className="text-xs text-umurage-muted mt-1">Instructor: {course.instructor || 'Umurage Elder Panel'}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 border-b border-umurage-border/40 pb-2">
          {['overview', 'lessons', 'quiz'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-umurage-gold text-umurage-bg font-bold shadow-sm'
                  : 'bg-umurage-card text-umurage-muted hover:text-umurage-cream'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & Enrollment */}
        {activeTab === 'overview' && (
          <div className="space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-semibold text-umurage-gold uppercase tracking-wider mb-2">About This Course</h3>
              <p className="text-umurage-cream leading-relaxed">{course.description}</p>
            </div>

            {/* Schedule Preference Selector */}
            {!isEnrolled && (
              <div className="p-4 rounded-xl bg-[#22160d] border border-[#4a2e16] space-y-3">
                <h4 className="font-semibold text-amber-300 text-sm">Select Your Preferred Schedule</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'self-paced', label: 'Self-Paced (Learn anytime)' },
                    { key: 'daily', label: 'Daily Short Modules' },
                    { key: 'weekends', label: 'Weekend Intensive' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSchedulePreference(s.key as any)}
                      className={`p-2.5 rounded-xl border text-[11px] font-semibold text-center transition-all ${
                        schedulePreference === s.key
                          ? 'bg-amber-900/50 text-amber-300 border-amber-500'
                          : 'bg-black/30 border-[#4a2e16] text-umurage-subtle'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isEnrolled && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-2">
                <div className="flex justify-between items-center text-xs text-amber-300 font-semibold">
                  <span>Course Progress</span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-umurage-gold transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {isEnrolled ? (
                <>
                  <button
                    onClick={() => setActiveTab('lessons')}
                    className="flex-1 btn-gold py-3 text-xs flex items-center justify-center gap-2 font-bold"
                  >
                    <Play size={16} /> Continue Learning
                  </button>
                  <button
                    onClick={handleLeaveCourse}
                    className="py-3 px-4 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-950/30 text-xs flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Leave Course
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="w-full btn-gold py-3 text-xs flex items-center justify-center gap-2 font-bold shadow-lg"
                >
                  {isEnrolling ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={18} />}
                  Enroll in Course
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Lessons Stream */}
        {activeTab === 'lessons' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lesson list sidebar */}
              <div className="space-y-2 border-r border-[#4a2e16] pr-3">
                <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-2">Modules</p>
                {lessons.map((l: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveLessonIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      activeLessonIndex === idx
                        ? 'bg-amber-900/40 text-amber-300 border-amber-500 font-semibold'
                        : 'bg-[#22160d] border-[#4a2e16] text-umurage-muted hover:text-umurage-cream'
                    }`}
                  >
                    <span className="truncate">{l.title}</span>
                  </button>
                ))}
              </div>

              {/* Lesson Viewer */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 rounded-xl bg-[#22160d] border border-[#4a2e16] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-amber-400 text-sm">{lessons[activeLessonIndex].title}</h4>
                    <span className="text-[10px] text-amber-200/60 flex items-center gap-1">
                      <Clock size={12} /> {lessons[activeLessonIndex].duration}
                    </span>
                  </div>

                  <p className="text-umurage-cream leading-relaxed text-xs leading-6">{lessons[activeLessonIndex].content}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCompleteLesson}
                    className="btn-gold text-xs px-5 py-2.5 flex items-center gap-1.5 font-bold"
                  >
                    <CheckCircle size={14} /> Mark Module Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cultural Quiz */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Course Certificate Quiz</h3>

            {quizScore !== null ? (
              <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-700/50 text-center space-y-3">
                <Award size={40} className="text-amber-400 mx-auto" />
                <h4 className="font-cinzel text-xl text-amber-300 font-bold">Quiz Result: {quizScore}%</h4>
                <p className="text-xs text-amber-100/80">
                  {quizScore >= 70
                    ? 'Congratulations! You have demonstrated verified knowledge of Rwanda royal heritage.'
                    : 'Review the modules and try again to achieve the 70% certificate threshold.'}
                </p>
                <button onClick={() => setQuizScore(null)} className="btn-outline-gold text-xs px-4 py-2">
                  <RotateCcw size={12} className="inline mr-1" /> Retry Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-[#22160d] border border-[#4a2e16] space-y-3">
                    <p className="font-semibold text-amber-50 text-xs">{q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const optKey = opt[0];
                        const isSelected = quizAnswers[idx] === optKey;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [idx]: optKey }))}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                              isSelected
                                ? 'bg-amber-900/50 text-amber-300 border-amber-500 font-semibold'
                                : 'bg-[#18110a] border-[#4a2e16] text-umurage-muted hover:text-umurage-cream'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitQuiz}
                  className="w-full btn-gold py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Award size={16} /> Submit Quiz Answers
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
