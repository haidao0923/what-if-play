import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, RotateCcw, ChevronRight, ChevronLeft, Sparkles, Zap, Share2 } from 'lucide-react';
import ShareButton from './ShareButton';

const PROMPTS = [
  "Most likely to win the lottery and lose the ticket",
  "Most likely to become a millionaire",
  "Most likely to join a cult",
  "Most likely to go to the wrong house",
  "Most likely to survive a zombie apocalypse",
  "Most likely to become a famous actor",
  "Most likely to cry at a wedding",
  "Most likely to forget their own birthday",
  "Most likely to get a tattoo on a dare",
  "Most likely to stay up all night gaming",
  "Most likely to accidentally start a fire while cooking",
  "Most likely to become a world traveler",
  "Most likely to laugh at the wrong time",
  "Most likely to talk to their pets like they're humans",
  "Most likely to get lost in their own neighborhood",
  "Most likely to spend all their money on something useless",
  "Most likely to become a stand-up comedian",
  "Most likely to sleep through an earthquake",
  "Most likely to win an Olympic medal",
  "Most likely to become a mad scientist",
  "Most likely to go viral for something embarrassing",
  "Most likely to be the first one to die in a horror movie",
  "Most likely to marry a celebrity",
  "Most likely to own 10+ cats",
  "Most likely to move to a different country on a whim",
  "Most likely to read everyone's horoscope",
  "Most likely to spend hours looking for something that's in their hand",
  "Most likely to fall asleep in a movie theater",
  "Most likely to break their phone within a week of getting it",
  "Most likely to become a CEO",
  "Most likely to invent something useful",
  "Most likely to win a game show",
  "Most likely to be a secret agent",
  "Most likely to accidentally send a text to the person they're talking about",
  "Most likely to trip on a flat surface",
  "Most likely to have a reality TV show",
  "Most likely to stay friends with their ex",
  "Most likely to become a professional gamer",
  "Most likely to win an argument with a stranger",
  "Most likely to be late to their own wedding",
  "Most likely to spend the most time on social media",
  "Most likely to have the most unread emails",
  "Most likely to go to space",
  "Most likely to live to 100",
  "Most likely to become a politician",
  "Most likely to write a best-selling book",
  "Most likely to be the first one to get married",
  "Most likely to own a private island",
  "Most likely to survive on a deserted island",
  "Most likely to become a chef"
];

export default function MostLikelyTo({ isDarkMode = true, initialPlayers = [] }: { isDarkMode?: boolean, initialPlayers?: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledPrompts, setShuffledPrompts] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
    setShuffledPrompts(shuffled);
    setIsReady(true);
  }, []);

  const nextPrompt = () => {
    setCurrentIndex((prev) => (prev + 1) % shuffledPrompts.length);
  };

  const prevPrompt = () => {
    setCurrentIndex((prev) => (prev - 1 + shuffledPrompts.length) % shuffledPrompts.length);
  };

  const reshuffle = () => {
    const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
    setShuffledPrompts(shuffled);
    setCurrentIndex(0);
  };

  if (!isReady) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-center space-y-4 max-w-md"
      >
        <div className="space-y-2">
          <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
            Most Likely To
          </h2>
          <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Point to the person who fits best!</p>
        </div>

        <div className={`rounded-2xl p-4 border transition-colors ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="flex items-center justify-center space-x-2 font-bold text-indigo-500 mb-2 text-sm">
            <Sparkles size={16} />
            <span>How to Play</span>
          </div>
          <p className={`text-xs leading-relaxed text-center ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-700/70'}`}>
            Read the prompt aloud. On the count of three, everyone points to the person they think fits best. The person with the most fingers pointed at them "wins" the round!
          </p>
        </div>
      </motion.div>

      <div className="w-full max-w-lg perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ rotateY: 90, opacity: 0, scale: 0.9 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            exit={{ rotateY: -90, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className={`rounded-[3rem] shadow-2xl p-12 min-h-[300px] flex items-center justify-center text-center border relative overflow-hidden group transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-indigo-100'
            }`}
          >
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-colors ${isDarkMode ? 'bg-indigo-900/20 group-hover:bg-indigo-900/40' : 'bg-indigo-50 group-hover:bg-indigo-100'}`} />
            <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl transition-colors ${isDarkMode ? 'bg-purple-900/20 group-hover:bg-purple-900/40' : 'bg-purple-50 group-hover:bg-purple-100'}`} />

            <div className="space-y-6 relative z-10">
              <Sparkles className="mx-auto text-indigo-500 opacity-50" size={32} />
              <h3 className={`text-3xl md:text-4xl font-black leading-tight ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                {shuffledPrompts[currentIndex]}
              </h3>
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-indigo-500 font-bold text-sm uppercase tracking-widest">
                  <Users size={16} />
                  <span>Everyone Points!</span>
                </div>
                {initialPlayers.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                    {initialPlayers.map((p, i) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center space-x-4 w-full max-w-md">
        <ShareButton 
          title="Most Likely To Prompt"
          text={`Who is: "${shuffledPrompts[currentIndex]}"? 😂`}
          className={`p-4 rounded-2xl shadow-md border transition-all ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-indigo-400' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600'
          }`}
        />
        
        <button 
          onClick={prevPrompt}
          className={`p-4 rounded-2xl shadow-md border transition-all ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-indigo-400' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600'
          }`}
        >
          <ChevronLeft size={24} />
        </button>
        
        <button 
          onClick={nextPrompt}
          className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <span>Next Prompt</span>
          <ChevronRight size={24} />
        </button>

        <button 
          onClick={reshuffle}
          className={`p-4 rounded-2xl shadow-md border transition-all ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-indigo-400' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600'
          }`}
        >
          <RotateCcw size={24} />
        </button>
      </div>

      <div className={`text-center font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
        Prompt {currentIndex + 1} of {shuffledPrompts.length}
      </div>
    </div>
  );
}
