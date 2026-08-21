import React, { useState } from 'react';
import { Gamepad2, Award, RotateCcw, CheckCircle, XCircle, Globe, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Question {
  id: number;
  question: { en: string; rw: string; fr: string };
  options: { en: string[]; rw: string[]; fr: string[] };
  correctIndex: number;
  explanation: { en: string; rw: string; fr: string };
}

const TRIVIA_QUESTIONS: Question[] = [
  {
    id: 1,
    question: {
      en: 'Which festival celebrates the first fruits of the harvest in Rwandan tradition?',
      rw: 'Ni uwuhe munsi mukuru mu muco nyarwanda wizihiza umusaruro w’ubutaka?',
      fr: 'Quelle fête célèbre les premiers fruits de la récolte dans la tradition rwandaise ?',
    },
    options: {
      en: ['Umuganura', 'Kwita Izina', 'Gusaba', 'Ubwate'],
      rw: ['Umuganura', 'Kwita Izina', 'Gusaba', 'Ubwate'],
      fr: ['Umuganura', 'Kwita Izina', 'Gusaba', 'Ubwate'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Umuganura is the ancient harvest festival celebrated for over 1,800 years.',
      rw: 'Umuganura umazemo imyaka irenga 1,800 wizihizwa nk’umunsi w’umusaruro.',
      fr: 'Umuganura est l’ancienne fête de la moisson célébrée depuis plus de 1 800 ans.',
    },
  },
  {
    id: 2,
    question: {
      en: 'What unique 18th-century art form uses cow dung and natural pigments to form geometric reliefs?',
      rw: 'Ni ubuhe bukorikori bwo mu kinyejana cha 18 bukoresha amase n’amabara y’umwimerere?',
      fr: 'Quelle forme d’art unique du XVIIIe siècle utilise de la bouse de vache et des pigments naturels ?',
    },
    options: {
      en: ['Imigongo', 'Agaseke', 'Inanga', 'Icumu'],
      rw: ['Imigongo', 'Agaseke', 'Inanga', 'Icumu'],
      fr: ['Imigongo', 'Agaseke', 'Inanga', 'Icumu'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Imigongo art was invented by Prince Kakira of the Gisaka kingdom in Eastern Rwanda.',
      rw: 'Ubukorikori bw’Imigongo bwahimbwe n’Umutware Kakira mu muryango w’i Gisaka.',
      fr: 'L’art Imigongo a été inventé par le prince Kakira du royaume de Gisaka.',
    },
  },
  {
    id: 3,
    question: {
      en: 'In which province is the historic King’s Palace (Ingoro y’Umutware) located?',
      rw: 'Ingoro y’Uwami i Nyanza iherereye mu yihe Ntara?',
      fr: 'Dans quelle province se trouve l’ancien Palais Royal de Nyanza ?',
    },
    options: {
      en: ['Southern Province (Nyanza)', 'Northern Province (Musanze)', 'Western Province (Rubavu)', 'Kigali City'],
      rw: ['Intara y’Amajyepfo (Nyanza)', 'Intara y’Amajyaruguru (Musanze)', 'Intara y’Ibirengerazuba (Rubavu)', 'Umujyi wa Kigali'],
      fr: ['Province du Sud (Nyanza)', 'Province du Nord (Musanze)', 'Province de l’Ouest (Rubavu)', 'Ville de Kigali'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Nyanza in the Southern Province was the historic royal seat of the Kingdom of Rwanda.',
      rw: 'Nyanza mu Majyepfo yari umurwa mukuru w’Ubwami bw’u Rwanda.',
      fr: 'Nyanza, dans la province du Sud, était le siège royal historique du royaume du Rwanda.',
    },
  },
];

export const CulturalChallenges: React.FC = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<'en' | 'rw' | 'fr'>('en');
  const [topic, setTopic] = useState('History & Royalty');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  const currentQ = TRIVIA_QUESTIONS[currentIndex];

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: index }));
  };

  const handleNext = async () => {
    let newScore = score;
    if (selectedOption === currentQ.correctIndex) {
      newScore += 100;
      setScore(newScore);
    }

    if (currentIndex < TRIVIA_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
      if (user) {
        try {
          await supabase.from('challenge_attempts').insert({
            user_id: user.id,
            challenge_id: '00000000-0000-0000-0000-000000000001',
            score: newScore,
            total_questions: TRIVIA_QUESTIONS.length,
            language,
          });
        } catch (e) {
          console.warn('Challenge attempt save error:', e);
        }
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsCompleted(false);
    setUserAnswers({});
  };

  return (
    <div className="umurage-card rounded-2xl p-6 border border-umurage-gold/30 animate-fade-in text-umurage-cream">
      {/* Challenge Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-umurage-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
            <Gamepad2 size={24} className="text-umurage-gold animate-bounce" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl text-umurage-gold font-bold">Interactive Cultural Challenge</h2>
            <p className="text-xs text-umurage-muted">No course enrollment needed — test your heritage knowledge instant quiz!</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-[#1e130a] p-1.5 rounded-xl border border-[#4a2e16]">
          <Globe size={14} className="text-amber-400 ml-1" />
          {[
            { key: 'en', label: 'English' },
            { key: 'rw', label: 'Kinyarwanda' },
            { key: 'fr', label: 'Français' },
          ].map((l) => (
            <button
              key={l.key}
              onClick={() => setLanguage(l.key as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                language === l.key
                  ? 'bg-umurage-gold text-umurage-bg font-bold'
                  : 'text-umurage-subtle hover:text-umurage-cream'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {!isCompleted ? (
        <div className="space-y-5 text-xs">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
            <span>Question {currentIndex + 1} of {TRIVIA_QUESTIONS.length}</span>
            <span className="flex items-center gap-1 text-umurage-gold"><Zap size={14} /> Score: {score} XP</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#22160d] border border-[#4a2e16] space-y-4">
            <h3 className="text-sm font-semibold text-amber-50 leading-relaxed">
              {currentQ.question[language]}
            </h3>

            <div className="space-y-2">
              {currentQ.options[language].map((opt, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-amber-900/50 text-amber-300 border-amber-500 shadow-md scale-[0.99]'
                        : 'bg-[#18110a] border-[#4a2e16] text-umurage-muted hover:text-umurage-cream hover:border-amber-700/40'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className="btn-gold text-xs px-6 py-2.5 font-bold flex items-center gap-1.5 shadow-md disabled:opacity-40"
            >
              Next Question <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-4 text-xs">
          <Award size={48} className="text-umurage-gold mx-auto animate-bounce" />
          <h3 className="font-cinzel text-2xl text-umurage-gold font-bold">Challenge Completed!</h3>
          <p className="text-sm text-amber-100 font-semibold">Total Score: {score} / {TRIVIA_QUESTIONS.length * 100} XP</p>

          <div className="p-4 rounded-2xl bg-[#22160d] border border-[#4a2e16] max-w-lg mx-auto text-left space-y-3">
            <h4 className="font-semibold text-amber-300 text-xs uppercase tracking-wider">Answer Key & Explanations</h4>
            {TRIVIA_QUESTIONS.map((q, idx) => {
              const isCorrect = userAnswers[idx] === q.correctIndex;
              return (
                <div key={q.id} className="p-2.5 rounded-xl bg-[#18110a] border border-[#3d240e]">
                  <p className="font-semibold text-amber-50 flex items-center gap-1.5">
                    {isCorrect ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                    {q.question[language]}
                  </p>
                  <p className="text-[11px] text-umurage-muted mt-1">{q.explanation[language]}</p>
                </div>
              );
            })}
          </div>

          <button onClick={handleRestart} className="btn-gold text-xs px-6 py-2.5 font-bold inline-flex items-center gap-2">
            <RotateCcw size={14} /> Play Challenge Again
          </button>
        </div>
      )}
    </div>
  );
};
