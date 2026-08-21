import React, { useState } from 'react';
import { BookOpen, CheckCircle, Clock, GraduationCap, Play, X, Loader2, Award, RotateCcw, Trash2 } from 'lucide-react';
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

  const lessons = course.lessons_data || [
    {
      title: '1. Introduction to Rwandan Royal Roots & Heritage',
      duration: '15 mins',
      content: "Rwanda's heritage spans over 1,800 years of documented oral history, traditional governance, and sacred royal symbols such as Kalinga, Inyambo cattle, and Ubwitegerezo.",
    },
    {
      title: '2. Ubwuzu & Umuganura Ceremonial Values',
      duration: '20 mins',
      content: "Umuganura is the national harvest festival celebrating unity, sorghum, cattle, and community self-reliance. Learn the chants and oral recitations performed by traditional Abiru elders.",
    },
    {
      title: '3. Traditional Music & Sacred Inanga Chants',
      duration: '25 mins',
      content: "The Inanga is Rwanda's premier traditional string instrument. Discover historic compositions by master players such as Thomas Kirusu and Sophie Nzayisenga.",
    },
    {
      title: '4. Ancient Monarchy Structure & Royal Enclosure',
      duration: '30 mins',
      content: "The King (Mwami) ruled alongside queen mothers (Umugabekazi) and ritual advisors (Abiru). Explore Nyanza court protocol and architecture.",
    },
  ];

  // 20 Verified Rwandan Heritage Questions
  const VERIFIED_20_QUESTIONS = [
    {
      id: 1,
      question: '1. What is the historical significance of the Umuganura festival in Rwanda?',
      options: ['A) Celebrating the national harvest and community unity', 'B) Marking the end of rainy season', 'C) Foreign trade fair', 'D) Sports games'],
      correct: 'A',
      explanation: "Umuganura has been celebrated for over 1,800 years as Rwanda's national harvest festival promoting unity and gratitude.",
    },
    {
      id: 2,
      question: '2. Which sacred long-horned cattle were bred exclusively for the Royal Court of Rwanda?',
      options: ['A) Sacred Lions', 'B) Inyambo cattle', 'C) Mountain Gorillas', 'D) Falcons'],
      correct: 'B',
      explanation: 'Inyambo are the majestic long-horned cattle trained to march gracefully in royal court ceremonies.',
    },
    {
      id: 3,
      question: '3. Where is the historic King’s Palace Museum located?',
      options: ['A) Nyanza District, Southern Province', 'B) Musanze District', 'C) Rubavu District', 'D) Rwamagana District'],
      correct: 'A',
      explanation: 'Nyanza in Southern Province was the historic royal seat of the Kingdom of Rwanda.',
    },
    {
      id: 4,
      question: '4. What unique 18th-century Rwandan relief art form uses cow dung and geometric pigments?',
      options: ['A) Imigongo', 'B) Agaseke', 'C) Inanga', 'D) Intore'],
      correct: 'A',
      explanation: 'Imigongo art was invented by Prince Kakira of the Gisaka kingdom in Eastern Rwanda.',
    },
    {
      id: 5,
      question: '5. What traditional hairstyle was worn by Rwandan nobility to represent dignity and beauty?',
      options: ['A) Amasunzu', 'B) Ikondera', 'C) Ubwitegerezo', 'D) Inzozi'],
      correct: 'A',
      explanation: 'Amasunzu is the traditional crest hairstyle worn by men and women in historic Rwanda.',
    },
    {
      id: 6,
      question: '6. Who were the Abiru in the traditional Kingdom of Rwanda?',
      options: ['A) Sacred ritual advisors guarding royal secrets', 'B) Foreign traders', 'C) Farmers', 'D) Archers'],
      correct: 'A',
      explanation: 'Abiru were high ritualists responsible for preserving royal succession laws and traditions.',
    },
    {
      id: 7,
      question: '7. What stringed zither instrument is central to traditional Rwandan oral storytelling?',
      options: ['A) Inanga', 'B) Umuduri', 'C) Ikondera', 'D) Ingoma'],
      correct: 'A',
      explanation: 'The Inanga is a flat wooden string instrument used to accompany historical epics and poems.',
    },
    {
      id: 8,
      question: '8. What is the traditional name for handwoven Rwandan peace baskets?',
      options: ['A) Agaseke', 'B) Imigongo', 'C) Intore', 'D) Ubwato'],
      correct: 'A',
      explanation: 'Agaseke baskets feature pointed woven lids and symbolize peace, friendship, and gratitude.',
    },
    {
      id: 9,
      question: '9. Which warrior dance group traditionally performed before the King (Mwami)?',
      options: ['A) Intore', 'B) Amagaba', 'C) Ikinimba', 'D) Umugaganzo'],
      correct: 'A',
      explanation: 'Intore dancers perform the dance of heroes with leopard skin belts, sisal wigs, and spears.',
    },
    {
      id: 10,
      question: '10. What legendary king constructed sacred water pot rock formations at Utubindi twa Rubona?',
      options: ['A) King Ruganzu II Ndoli', 'B) King Yuhi V Musinga', 'C) King Mutara III', 'D) King Kigeri IV'],
      correct: 'A',
      explanation: 'Oral tradition attributes the sacred water pot rock depressions at Gatsibo to warrior King Ruganzu II Ndoli.',
    },
    {
      id: 11,
      question: '11. Which museum in Huye District holds over 10,000 pre-colonial artifacts?',
      options: ['A) Ethnographic Museum of Rwanda', 'B) Art Museum', 'C) Palace Museum', 'D) Environmental Museum'],
      correct: 'A',
      explanation: 'The Ethnographic Museum in Huye is one of Africa’s premier institutions for pre-colonial heritage.',
    },
    {
      id: 12,
      question: '12. What traditional beverage made from fermented sorghum plays a central ceremonial role in Umuganura?',
      options: ['A) Ikigage', 'B) Urwagwa', 'C) Ubuki', 'D) Inyange'],
      correct: 'A',
      explanation: 'Ikigage is traditional sorghum beer served during Umuganura harvest recitations.',
    },
    {
      id: 13,
      question: '13. What natural rock in Ruhango is famous for the trial legend of Mibambwe IV?',
      options: ['A) Urutare rwa Kamegeri', 'B) Utubindi twa Rubona', 'C) Buhanga Eco-Park', 'D) Mount Karisimbi'],
      correct: 'A',
      explanation: 'Urutare rwa Kamegeri is a historic natural rock monument near Ruhango.',
    },
    {
      id: 14,
      question: '14. What official program educates Rwandan youth on national values and cultural leadership?',
      options: ['A) Itorero', 'B) Umuganda', 'C) Kwita Izina', 'D) Ubudehe'],
      correct: 'A',
      explanation: 'Itorero is the traditional civic and cultural school instilling patriotism and heritage.',
    },
    {
      id: 15,
      question: '15. What annual ceremony names newborn mountain gorillas in Volcanoes National Park?',
      options: ['A) Kwita Izina', 'B) Umuganura', 'C) Gusaba', 'D) Gacaca'],
      correct: 'A',
      explanation: 'Kwita Izina is Rwanda’s gorilla naming ceremony inspired by ancestral human naming customs.',
    },
    {
      id: 16,
      question: '16. What is the traditional marriage introduction ceremony called in Kinyarwanda?',
      options: ['A) Gusaba n\'Gukwera', 'B) Umuganura', 'C) Itorero', 'D) Ubwate'],
      correct: 'A',
      explanation: 'Gusaba is the traditional dowry negotiation and formal family introduction ceremony.',
    },
    {
      id: 17,
      question: '17. What horn instrument is blown in traditional royal drum ensembles?',
      options: ['A) Ikondera', 'B) Inanga', 'C) Umuduri', 'D) Agaseke'],
      correct: 'A',
      explanation: 'Ikondera horns are played in harmony alongside Ingoma royal drums.',
    },
    {
      id: 18,
      question: '18. Which sacred forest served as the coronation site for ancient Kings of Rwanda?',
      options: ['A) Buhanga Eco-Park (Musanze)', 'B) Nyungwe Forest', 'C) Akagera', 'D) Gishwati'],
      correct: 'A',
      explanation: 'Buhanga Sacred Forest is the historic coronation grove where royal bathing rituals occurred.',
    },
    {
      id: 19,
      question: '19. What proverb collection preserves wisdom in Kinyarwanda oral literature?',
      options: ['A) Imigani iremre', 'B) Ibitekerezo', 'C) Ibisakuzo', 'D) Amasanzu'],
      correct: 'A',
      explanation: 'Imigani iremre are traditional proverbs passing down ethical and philosophical lessons.',
    },
    {
      id: 20,
      question: '20. What community monthly initiative promotes collective self-reliance and environmental care?',
      options: ['A) Umuganda', 'B) Itorero', 'C) Kwibuka', 'D) Umuganura'],
      correct: 'A',
      explanation: 'Umuganda is Rwanda’s monthly community work day fostering unity and development.',
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
      toast.success(`Enrolled in ${course.title}!`);
      onEnrollmentChanged();
      setActiveTab('lessons');
    } catch (err: any) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleLeaveCourse = async () => {
    if (!user || !enrollment) return;
    try {
      const { error } = await supabase.from('enrollments').delete().eq('user_id', user.id).eq('course_id', course.id);
      if (error) throw error;
      toast.success('Unenrolled from course.');
      onEnrollmentChanged();
      onClose();
    } catch (e) {
      toast.error('Failed to unenroll');
    }
  };

  const handleCompleteLesson = async () => {
    if (!user || !isEnrolled) return;
    const nextProgress = Math.min(100, Math.round(((activeLessonIndex + 1) / lessons.length) * 100));
    try {
      await supabase.from('enrollments').update({ progress: nextProgress, updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('course_id', course.id);
      toast.success(`Lesson completed! Progress: ${nextProgress}%`);
      onEnrollmentChanged();
      if (activeLessonIndex < lessons.length - 1) {
        setActiveLessonIndex((prev) => prev + 1);
      } else {
        setActiveTab('quiz');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    VERIFIED_20_QUESTIONS.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) correctCount++;
    });

    const scorePercentage = Math.round((correctCount / VERIFIED_20_QUESTIONS.length) * 100);
    setQuizScore(scorePercentage);

    if (scorePercentage >= 70) {
      toast.success(`Passed! ${scorePercentage}% score. Verified cultural certificate awarded!`);
    } else {
      toast.error(`Score: ${scorePercentage}%. Minimum threshold is 70%. Please review and try again.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#18110a] border border-[#5c3c1e] p-6 z-10 animate-fade-in text-umurage-cream">
        <button onClick={onClose} className="absolute top-4 right-4 text-umurage-subtle hover:text-umurage-cream">
          <X size={20} />
        </button>

        <div className="flex items-start gap-4 mb-5 border-b border-[#4a2e16] pb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={28} className="text-umurage-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/40">
                {course.level || 'Beginner'}
              </span>
              <span className="text-xs text-umurage-subtle">• 20 Verified Questions Exam</span>
            </div>
            <h2 className="font-cinzel text-2xl text-umurage-gold font-bold">{course.title}</h2>
          </div>
        </div>

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
              {tab === 'quiz' ? '20 Questions Exam' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-semibold text-umurage-gold uppercase tracking-wider mb-2">About Course & 20-Question Exam</h3>
              <p className="text-umurage-cream leading-relaxed">{course.description}</p>
            </div>

            {!isEnrolled ? (
              <button onClick={handleEnroll} disabled={isEnrolling} className="w-full btn-gold py-3 text-xs font-bold flex items-center justify-center gap-2">
                {isEnrolling ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={18} />} Enroll Now
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setActiveTab('lessons')} className="flex-1 btn-gold py-3 text-xs font-bold">Continue Modules</button>
                <button onClick={handleLeaveCourse} className="py-3 px-4 rounded-xl border border-red-900/40 text-red-400 text-xs">Leave Course</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 border-r border-[#4a2e16] pr-3">
                {lessons.map((l: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveLessonIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs ${
                      activeLessonIndex === idx ? 'bg-amber-900/40 text-amber-300 border-amber-500' : 'bg-[#22160d] border-[#4a2e16] text-umurage-muted'
                    }`}
                  >
                    <span className="truncate block">{l.title}</span>
                  </button>
                ))}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="p-4 rounded-xl bg-[#22160d] border border-[#4a2e16] space-y-3">
                  <h4 className="font-semibold text-amber-400 text-sm">{lessons[activeLessonIndex].title}</h4>
                  <p className="text-umurage-cream leading-relaxed text-xs leading-6">{lessons[activeLessonIndex].content}</p>
                </div>
                <button onClick={handleCompleteLesson} className="btn-gold text-xs px-5 py-2.5 font-bold flex items-center gap-1.5 float-right">
                  <CheckCircle size={14} /> Complete & Next
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">20-Question Verified Cultural Exam</h3>

            {quizScore !== null ? (
              <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-700/50 text-center space-y-3">
                <Award size={40} className="text-amber-400 mx-auto" />
                <h4 className="font-cinzel text-xl text-amber-300 font-bold">Exam Score: {quizScore}%</h4>
                <p className="text-xs text-amber-100/80">
                  {quizScore >= 70 ? 'Passed! Your verified certificate in Rwandan Royal Heritage is unlocked.' : 'Minimum pass score is 70%. Review course modules and retry.'}
                </p>
                <button onClick={() => setQuizScore(null)} className="btn-outline-gold text-xs px-4 py-2">
                  <RotateCcw size={12} className="inline mr-1" /> Retry Exam
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {VERIFIED_20_QUESTIONS.map((q, idx) => (
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
                              isSelected ? 'bg-amber-900/50 text-amber-300 border-amber-500 font-semibold' : 'bg-[#18110a] border-[#4a2e16] text-umurage-muted'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button onClick={handleSubmitQuiz} className="w-full btn-gold py-3 text-xs font-bold flex items-center justify-center gap-2">
                  <Award size={16} /> Submit 20-Question Exam
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
