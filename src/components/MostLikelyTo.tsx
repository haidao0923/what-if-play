import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, RotateCcw, ChevronRight, ChevronLeft, Sparkles, Zap, Share2, History, UserCheck, X } from 'lucide-react';
import ShareButton from './ShareButton';

interface Assignment {
  prompt: string;
  playerName: string;
  timestamp: number;
}

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
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [playerNames, setPlayerNames] = useState<string[]>(initialPlayers.length > 0 ? initialPlayers : ['Player 1', 'Player 2']);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledPrompts, setShuffledPrompts] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [history, setHistory] = useState<Assignment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  useEffect(() => {
    const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
    setShuffledPrompts(shuffled);
    setIsReady(true);
  }, []);

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayerNames([...playerNames, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 1) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  const startGame = () => {
    if (playerNames.length >= 2) {
      setGameState('playing');
    }
  };

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
    setHistory([]);
  };

  const assignToPlayer = (playerName: string) => {
    const currentPrompt = shuffledPrompts[currentIndex];
    // Avoid duplicate assignments for the same prompt in history if user clicks multiple times
    // or just allow it? Usually better to just add it.
    setHistory(prev => [
      { prompt: currentPrompt, playerName, timestamp: Date.now() },
      ...prev
    ]);
    nextPrompt();
  };

  const removeHistoryItem = (timestamp: number) => {
    setHistory(prev => prev.filter(item => item.timestamp !== timestamp));
  };

  const filteredHistory = historyFilter 
    ? history.filter(item => item.playerName === historyFilter)
    : history;

  if (!isReady) return null;

  if (gameState === 'setup') {
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
            <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Setup your players</p>
          </div>
        </motion.div>

        <div className={`w-full max-w-md p-8 rounded-[2.5rem] border transition-all duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-indigo-900/10' : 'bg-white border-slate-100 shadow-xl shadow-indigo-100'}`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Users size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Players</h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Add at least 2 players</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <AnimatePresence>
              {playerNames.map((player, index) => (
                <motion.div
                  key={`${player}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
                >
                  <span>{player}</span>
                  <button 
                    onClick={() => removePlayer(index)}
                    className={`p-1 rounded-full hover:bg-rose-500/20 hover:text-rose-500 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex space-x-2 mb-8">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter player name..."
              className={`flex-1 px-4 py-3 rounded-2xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 placeholder:text-slate-400'}`}
            />
            <button
              onClick={addPlayer}
              disabled={!newPlayerName.trim()}
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${!newPlayerName.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'} ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              Add
            </button>
          </div>

          <button
            onClick={startGame}
            disabled={playerNames.length < 2}
            className={`w-full py-4 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center space-x-2 ${playerNames.length < 2 ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-95'} ${isDarkMode ? 'bg-indigo-600 text-white shadow-indigo-900/20' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
          >
            <span>Start Game</span>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

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

        <div className={`rounded-2xl p-4 border transition-colors duration-300 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className={`flex items-center justify-center space-x-2 font-bold mb-3 text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            <Sparkles size={16} />
            <span>How to Play</span>
          </div>
          <div className="grid grid-cols-1 gap-3 text-left">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>1</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Read the prompt aloud. Everyone thinks about who fits it best.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>2</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>On the count of three, everyone points to their chosen person.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>3</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>The person with the most fingers pointed at them "wins" the round!</p>
            </div>
          </div>
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
            className={`rounded-[3rem] shadow-2xl p-12 min-h-[350px] flex items-center justify-center text-center border relative overflow-hidden group transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-indigo-100'
            }`}
          >
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-colors ${isDarkMode ? 'bg-indigo-900/20 group-hover:bg-indigo-900/40' : 'bg-indigo-50 group-hover:bg-indigo-100'}`} />
            <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl transition-colors ${isDarkMode ? 'bg-purple-900/20 group-hover:bg-purple-900/40' : 'bg-purple-50 group-hover:bg-purple-100'}`} />

            <div className="space-y-8 relative z-10 w-full">
              <Sparkles className="mx-auto text-indigo-500 opacity-50" size={32} />
              <h3 className={`text-3xl md:text-4xl font-black leading-tight ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                {shuffledPrompts[currentIndex]}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-indigo-500 font-bold text-sm uppercase tracking-widest">
                  <UserCheck size={16} />
                  <span>Assign to Player</span>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3">
                  {playerNames.map((p, i) => (
                    <button 
                      key={i} 
                      onClick={() => assignToPlayer(p)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all active:scale-90 ${
                        isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-indigo-600 hover:border-indigo-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-lg">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-4 rounded-2xl shadow-md border transition-all relative ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-indigo-400' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600'
            }`}
            title="View History"
          >
            <History size={24} />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                {history.length}
              </span>
            )}
          </button>

          <ShareButton 
            title="Most Likely To Prompt"
            text={`Who is: "${shuffledPrompts[currentIndex]}"? 😂`}
            className={`p-4 rounded-2xl shadow-md border transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-indigo-400' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600'
            }`}
          />
        </div>
        
        <div className="flex items-center space-x-2">
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
            className="px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight size={24} />
          </button>

          <button 
            onClick={reshuffle}
            className={`p-4 rounded-2xl shadow-md border transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-indigo-400' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600'
            }`}
            title="Reshuffle"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-lg overflow-hidden"
          >
            <div className={`rounded-3xl border p-6 space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
              <div className="flex items-center justify-between">
                <h4 className={`font-black uppercase tracking-widest text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>History</h4>
                <button onClick={() => { setHistory([]); setHistoryFilter(null); }} className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Clear All</button>
              </div>

              {/* Player Filter */}
              {history.length > 0 && (
                <div className="flex flex-wrap gap-2 py-2 border-y border-slate-800/50">
                  <button
                    onClick={() => setHistoryFilter(null)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      historyFilter === null
                        ? 'bg-indigo-600 text-white'
                        : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    All
                  </button>
                  {Array.from(new Set(history.map(h => h.playerName))).map(name => (
                    <button
                      key={name}
                      onClick={() => setHistoryFilter(name)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        historyFilter === name
                          ? 'bg-indigo-600 text-white'
                          : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.length === 0 ? (
                  <p className={`text-center py-8 text-sm italic ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {historyFilter ? `No assignments for ${historyFilter}.` : 'No assignments yet.'}
                  </p>
                ) : (
                  filteredHistory.map((item) => (
                    <div key={item.timestamp} className={`flex items-start justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="space-y-1">
                        <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.prompt}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Assigned to: {item.playerName}</p>
                      </div>
                      <button 
                        onClick={() => removeHistoryItem(item.timestamp)}
                        className={`p-1 rounded-lg hover:bg-rose-500/20 hover:text-rose-500 transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`text-center font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
        Prompt {currentIndex + 1} of {shuffledPrompts.length}
      </div>
    </div>
  );
}
