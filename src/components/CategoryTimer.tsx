import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Timer, Play, RotateCcw, ArrowLeft, Zap, AlertCircle, Trophy, Sparkles, ChevronRight, Share2 } from 'lucide-react';
import ShareButton from './ShareButton';

interface Player {
  id: number;
  name: string;
  timeLeft: number;
  isOut: boolean;
  rank?: number;
}

const CATEGORIES = [
  "Animals", "Fruits", "Vegetables", "Countries", "Cities", 
  "Movies", "Superheroes", "Brands", "Colors", "Musical Instruments",
  "Sports", "Car Brands", "Desserts", "Furniture", "Clothing Items",
  "Hobbies", "School Subjects", "Languages", "Planets", "Flowers"
];

export default function CategoryTimer({ isDarkMode = true, initialPlayers = [] }: { isDarkMode?: boolean, initialPlayers?: string[] }) {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [numPlayers, setNumPlayers] = useState(initialPlayers.length > 1 ? initialPlayers.length : 2);
  const [playerNames, setPlayerNames] = useState<string[]>(initialPlayers.length > 0 ? initialPlayers : ['Player 1', 'Player 2']);
  const [initialTime, setInitialTime] = useState(60); // in seconds
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [category, setCategory] = useState("");
  const [isPaused, setIsPaused] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateNumPlayers = (val: number) => {
    const newCount = Math.max(2, val);
    setNumPlayers(newCount);
    setPlayerNames(prev => {
      const next = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) {
          next.push(`Player ${i + 1}`);
        }
      } else {
        return next.slice(0, newCount);
      }
      return next;
    });
  };

  const handleNameChange = (index: number, name: string) => {
    const next = [...playerNames];
    next[index] = name;
    setPlayerNames(next);
  };

  const startGame = () => {
    const newPlayers = Array.from({ length: numPlayers }, (_, i) => ({
      id: i + 1,
      name: playerNames[i] || `Player ${i + 1}`,
      timeLeft: initialTime,
      isOut: false
    }));
    setPlayers(newPlayers);
    setCategory(CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]);
    setCurrentPlayerIndex(0);
    setGameState('playing');
    setIsPaused(true);
  };

  const getNextActivePlayerIndex = (currentIndex: number, currentPlayers: Player[]) => {
    let nextIndex = (currentIndex + 1) % currentPlayers.length;
    let attempts = 0;
    while (currentPlayers[nextIndex].isOut && attempts < currentPlayers.length) {
      nextIndex = (nextIndex + 1) % currentPlayers.length;
      attempts++;
    }
    return nextIndex;
  };

  const nextTurn = () => {
    if (gameState !== 'playing') return;
    setCurrentPlayerIndex((prev) => getNextActivePlayerIndex(prev, players));
  };

  const handleScreenTap = () => {
    if (gameState === 'playing') {
      if (isPaused) {
        setIsPaused(false);
      } else {
        nextTurn();
      }
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && !isPaused) {
      timerRef.current = setInterval(() => {
        setPlayers((prevPlayers) => {
          const newPlayers = [...prevPlayers];
          const currentPlayer = { ...newPlayers[currentPlayerIndex] };
          
          currentPlayer.timeLeft = Math.max(0, currentPlayer.timeLeft - 0.1);
          newPlayers[currentPlayerIndex] = currentPlayer;

          if (currentPlayer.timeLeft <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            
            currentPlayer.isOut = true;
            currentPlayer.timeLeft = 0;
            
            const remainingActive = newPlayers.filter(p => !p.isOut);
            const outCount = newPlayers.filter(p => p.isOut).length;
            
            // Rank is determined by elimination order
            // If 1st out in 3 players: rank = 3
            // If 2nd out in 3 players: rank = 2
            currentPlayer.rank = numPlayers - outCount + 1;

            if (remainingActive.length <= 1) {
              // Game Over - set winner rank
              if (remainingActive.length === 1) {
                const winnerIdx = newPlayers.findIndex(p => !p.isOut);
                newPlayers[winnerIdx].rank = 1;
              }
              setGameState('gameover');
            } else {
              // Continue with next player
              setIsPaused(true);
              setCurrentPlayerIndex(getNextActivePlayerIndex(currentPlayerIndex, newPlayers));
            }
          }
          
          return newPlayers;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isPaused, currentPlayerIndex, players.length, numPlayers]);

  const resetGame = () => {
    setGameState('setup');
    setIsPaused(true);
  };

  if (gameState === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h2 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Category Blitz</h2>
          <p className={`pt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Don't let your timer run out!</p>
          <div className={`rounded-2xl p-4 border mt-4 transition-colors ${isDarkMode ? 'bg-rose-900/20 border-rose-800/30' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`flex items-center justify-center space-x-2 font-bold mb-1 text-sm ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
              <Sparkles size={16} />
              <span>How to Play</span>
            </div>
            <p className={`text-xs leading-relaxed max-w-xs mx-auto ${isDarkMode ? 'text-rose-300/70' : 'text-rose-700/70'}`}>
              On your turn, say a word in the category and tap the screen to pass. If your timer hits zero, you're out! Last one standing wins.
            </p>
          </div>
        </motion.div>

        <div className="w-full max-w-md space-y-6">
          <div className={`rounded-3xl shadow-2xl p-8 space-y-8 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-rose-100'}`}>
            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Users size={18} className="text-rose-400" />
                <span>Number of Players</span>
              </label>
              <div className={`flex items-center justify-between p-2 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                <button 
                  onClick={() => updateNumPlayers(numPlayers - 1)}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                >
                  -
                </button>
                <span className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{numPlayers}</span>
                <button 
                  onClick={() => updateNumPlayers(numPlayers + 1)}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                >
                  +
                </button>
              </div>
            </div>

            {/* Player Names */}
            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Users size={18} className="text-rose-400" />
                <span>Player Names (Optional)</span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {playerNames.map((name, i) => (
                  <input
                    key={i}
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    placeholder={`Player ${i + 1}`}
                    className={`w-full p-3 rounded-xl border border-transparent outline-none transition-all text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 text-slate-100 focus:border-rose-500 focus:bg-slate-700 placeholder:text-slate-600' 
                        : 'bg-gray-50 text-gray-900 focus:border-rose-500 focus:bg-white placeholder:text-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Timer size={18} className="text-rose-400" />
                <span>Starting Time (seconds)</span>
              </label>
              <input 
                type="range" 
                min="10" 
                max="180" 
                step="5"
                value={initialTime} 
                onChange={(e) => setInitialTime(parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-rose-500 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}
              />
              <div className="text-center text-3xl font-black text-rose-500">
                {initialTime >= 60 ? `${Math.floor(initialTime / 60)}m ${initialTime % 60}s` : `${initialTime}s`}
              </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-900/20 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Play size={20} fill="currentColor" />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const currentPlayer = players[currentPlayerIndex];
    const progress = (currentPlayer.timeLeft / initialTime) * 100;

    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8 cursor-pointer select-none"
        onClick={handleScreenTap}
      >
        <div className="text-center space-y-4">
          <div className={`inline-block px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase transition-colors ${isDarkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
            Category
          </div>
          <h2 className={`text-5xl font-black transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{category}</h2>
        </div>

        <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
          {/* Progress Circle */}
          <svg className="w-full h-full -rotate-90 transform">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              className={`fill-none transition-colors ${isDarkMode ? 'stroke-slate-800' : 'stroke-gray-100'}`}
              strokeWidth="12"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              className="stroke-rose-500 fill-none"
              strokeWidth="12"
              strokeDasharray="283%"
              animate={{ strokeDashoffset: `${283 - (283 * progress) / 100}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <motion.p 
              key={currentPlayer.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-2xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              {currentPlayer.name}
            </motion.p>
            <span className={`text-7xl font-black tabular-nums transition-colors ${currentPlayer.timeLeft < 10 ? 'text-red-500 animate-pulse' : isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              {Math.ceil(currentPlayer.timeLeft)}
            </span>
            <p className={`mt-4 text-sm font-medium uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {isPaused ? 'Tap to Start' : 'Tap to Pass'}
            </p>
          </div>
        </div>

        <div className="w-full max-w-md grid grid-cols-2 gap-4">
          {players.map((p, idx) => (
            <div 
              key={p.id}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                idx === currentPlayerIndex 
                  ? isDarkMode ? 'bg-rose-900/30 border-rose-500 scale-105 shadow-xl shadow-black/20' : 'bg-rose-50 border-rose-500 scale-105 shadow-xl shadow-rose-100'
                  : p.isOut 
                    ? isDarkMode ? 'bg-slate-900 border-slate-800 opacity-30 grayscale' : 'bg-gray-100 border-gray-200 opacity-40 grayscale'
                    : isDarkMode ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-white border-gray-100 opacity-60'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`font-bold text-sm transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{p.name}</span>
                <span className={`font-black transition-colors ${p.isOut ? isDarkMode ? 'text-slate-600' : 'text-gray-400' : 'text-rose-500'}`}>
                  {p.isOut ? 'OUT' : `${Math.ceil(p.timeLeft)}s`}
                </span>
              </div>
              {!p.isOut && (
                <div className={`mt-2 h-1.5 rounded-full overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <div 
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${(p.timeLeft / initialTime) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const winner = players.find(p => p.rank === 1);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className={`inline-flex p-4 rounded-full mb-2 transition-colors ${isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
          <Trophy size={48} />
        </div>
        <h2 className={`text-4xl font-black transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Game Over!</h2>
        <p className={`text-xl transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          <span className="font-bold text-indigo-500">{winner?.name}</span> is the last standing!
        </p>
      </motion.div>

      <div className="w-full max-w-md space-y-4">
        <h3 className={`text-center font-bold uppercase tracking-widest text-sm transition-colors ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Final Rankings</h3>
        {[...players].sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((p, index) => (
          <div 
            key={p.id}
            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-colors duration-300 ${
              p.rank === 1 
                ? isDarkMode ? 'bg-indigo-900/20 border-indigo-500' : 'bg-indigo-50 border-indigo-500' 
                : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                p.rank === 1 ? 'bg-indigo-500 text-white' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'
              }`}>
                {p.rank}
              </div>
              <span className={`font-bold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{p.name}</span>
            </div>
            <span className={`font-black transition-colors ${p.rank === 1 ? 'text-indigo-500' : isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
              {p.rank === 1 ? 'WINNER' : 'ELIMINATED'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col w-full max-w-md space-y-3">
        <ShareButton 
          title="Category Blitz Results"
          text={`I just played Category Blitz! ${winner?.name} won! 🏆\n\nFinal Rankings:\n${[...players].sort((a, b) => (a.rank || 99) - (b.rank || 99)).map(p => `${p.rank}. ${p.name}`).join('\n')}`}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all"
        />
        <button 
          onClick={startGame}
          className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-900/20 hover:bg-rose-600 transition-all flex items-center justify-center space-x-2"
        >
          <RotateCcw size={20} />
          <span>Rematch</span>
        </button>
        <button 
          onClick={resetGame}
          className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${
            isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
          <span>Back to Setup</span>
        </button>
      </div>
    </div>
  );
}
