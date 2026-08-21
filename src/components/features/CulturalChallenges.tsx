import React, { useState } from 'react';
import { Gamepad2, Award, RotateCcw, CheckCircle, XCircle, Globe, ChevronRight, Zap, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ChallengeSet {
  id: string;
  setTitle: { en: string; rw: string; fr: string };
  questions: {
    id: number;
    question: { en: string; rw: string; fr: string };
    options: { en: string[]; rw: string[]; fr: string[] };
    correctIndex: number;
    explanation: { en: string; rw: string; fr: string };
  }[];
}

const CHALLENGE_SETS: ChallengeSet[] = [
  {
    id: 'set-1',
    setTitle: {
      en: 'Set 1: Royalty, Monarchy & Ancestral Roots',
      rw: 'Icyiciro 1: Ubwami, Ingoro n\'Amateka y\'Abami',
      fr: 'Série 1 : Royauté, Monarchie et Racines Anjestrales',
    },
    questions: [
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
          en: 'What sacred long-horned cattle were bred exclusively for the Royal Court of Rwanda?',
          rw: 'Ni izihe inka z\'ihembe rirerire zororwaga mu ngoro y\'Uwami gusa?',
          fr: 'Bovins sacrés aux cornes majestueuses élevés pour la Cour Royale ?',
        },
        options: {
          en: ['Inyambo', 'Ankole', 'Zebu', 'Friesian'],
          rw: ['Inyambo', 'Ankole', 'Zebu', 'Friesian'],
          fr: ['Inyambo', 'Ankole', 'Zebu', 'Friesian'],
        },
        correctIndex: 0,
        explanation: {
          en: 'Inyambo were trained to march gracefully in royal parades (Amasunzu).',
          rw: 'Inyambo zatozwaga gutambuka mu birori by\'ingoro y\'Uwami.',
          fr: 'Les Inyambo étaient entraînées à défiler lors des cérémonies royales.',
        },
      },
    ],
  },
  {
    id: 'set-2',
    setTitle: {
      en: 'Set 2: Language, Proverbs & Idioms (Ikinyarwanda)',
      rw: 'Icyiciro 2: Ururimi, Imigani n\'Ibisakuzo',
      fr: 'Série 2 : Langue, Proverbes et Idiomes',
    },
    questions: [
      {
        id: 3,
        question: {
          en: 'What is the traditional crest hairstyle representing dignity in historic Rwanda?',
          rw: 'Ni ubuhe bwoko bw\'isunzu ry\'umutwe ryo mu muco nyarwanda rifite igihe?',
          fr: 'Quelle coiffure traditionnelle représentait la dignité au Rwanda ?',
        },
        options: {
          en: ['Amasunzu', 'Ikondera', 'Agaseke', 'Ubwato'],
          rw: ['Amasunzu', 'Ikondera', 'Agaseke', 'Ubwato'],
          fr: ['Amasunzu', 'Ikondera', 'Agaseke', 'Ubwato'],
        },
        correctIndex: 0,
        explanation: {
          en: 'Amasunzu is the iconic sculpted hairstyle worn by nobility.',
          rw: 'Amasunzu yari isunzu ryo mu mutwe rya kinyarwanda rihanitse.',
          fr: 'Amasunzu est la coiffure traditionnelle portée avec fierté.',
        },
      },
    ],
  },
];

export const CulturalChallenges: React.FC = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<'en' | 'rw' | 'fr'>('en');
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const activeSet = CHALLENGE_SETS[currentSetIdx];
  const currentQ = activeSet.questions[currentIndex];

  const handleNext = () => {
    let newScore = score;
    if (selectedOption === currentQ.correctIndex) newScore += 100;
    setScore(newScore);

    if (currentIndex < activeSet.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  };

  const handleNextSet = () => {
    if (currentSetIdx < CHALLENGE_SETS.length - 1) {
      setCurrentSetIdx((prev) => prev + 1);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsCompleted(false);
      toast.success(`Loaded ${CHALLENGE_SETS[currentSetIdx + 1].setTitle[language]}`);
    } else {
      toast.success('Congratulations! You completed all available challenge sets!');
    }
  };

  return (
    <div className="umurage-card rounded-2xl p-6 border border-umurage-gold/30 animate-fade-in text-umurage-cream">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-umurage-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
            <Gamepad2 size={24} className="text-umurage-gold animate-bounce" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl text-umurage-gold font-bold">{activeSet.setTitle[language]}</h2>
            <p className="text-xs text-umurage-muted">Interactive trivia — complete set to unlock the next challenge!</p>
          </div>
        </div>

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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                language === l.key ? 'bg-umurage-gold text-umurage-bg font-bold' : 'text-umurage-subtle hover:text-umurage-cream'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {!isCompleted ? (
        <div className="space-y-5 text-xs">
          <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
            <span>Question {currentIndex + 1} of {activeSet.questions.length}</span>
            <span className="flex items-center gap-1 text-umurage-gold"><Zap size={14} /> Score: {score} XP</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#22160d] border border-[#4a2e16] space-y-4">
            <h3 className="text-sm font-semibold text-amber-50 leading-relaxed">{currentQ.question[language]}</h3>
            <div className="space-y-2">
              {currentQ.options[language].map((opt, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected ? 'bg-amber-900/50 text-amber-300 border-amber-500 scale-[0.99]' : 'bg-[#18110a] border-[#4a2e16] text-umurage-muted hover:text-umurage-cream'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleNext} disabled={selectedOption === null} className="btn-gold text-xs px-6 py-2.5 font-bold flex items-center gap-1.5 disabled:opacity-40">
              Next Question <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-4 text-xs">
          <Award size={48} className="text-umurage-gold mx-auto animate-bounce" />
          <h3 className="font-cinzel text-2xl text-umurage-gold font-bold">Challenge Set Completed!</h3>
          <p className="text-sm text-amber-100 font-semibold">Total Score: {score} XP</p>

          <div className="flex justify-center gap-3">
            <button onClick={() => { setIsCompleted(false); setCurrentIndex(0); setSelectedOption(null); }} className="btn-outline-gold text-xs px-5 py-2.5 flex items-center gap-2">
              <RotateCcw size={14} /> Retry Set
            </button>
            {currentSetIdx < CHALLENGE_SETS.length - 1 && (
              <button onClick={handleNextSet} className="btn-gold text-xs px-6 py-2.5 font-bold flex items-center gap-2">
                <Layers size={14} /> Load Next Challenge Set →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
