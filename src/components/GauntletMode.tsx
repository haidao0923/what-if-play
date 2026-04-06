import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Users, Timer, ArrowLeft, Sparkles, Zap, ChevronRight, User, Medal, History, Share2 } from 'lucide-react';
import ShareButton from './ShareButton';

type GauntletStep = 'name' | 'selection' | 'playing' | 'results' | 'leaderboard';
type GauntletType = 'seconds' | 'math';
type MathDifficulty = 'easy' | 'medium' | 'hard' | 'insane';

interface LeaderboardEntry {
  name: string;
  score: number; // For seconds: error. For math: total error.
  date: string;
}

const EASY_OPS = ['+', '-'];
const MEDIUM_OPS = ['+', '-', '*', '/'];
const HARD_OPS = ['+', '-', '*', '/', '^2', 'sqrt'];
const INSANE_OPS = ['+', '-', '*', '/', '^2', 'sqrt', 'log']; // Adding log for "insane"

export default function GauntletMode({ 
  isDarkMode = true, 
  onBack,
  initialStep = 'name',
  initialType = 'seconds'
}: { 
  isDarkMode?: boolean, 
  onBack: () => void,
  initialStep?: GauntletStep,
  initialType?: GauntletType
}) {
  const [step, setStep] = useState<GauntletStep>(initialStep);
  const [playerName, setPlayerName] = useState('');
  const [type, setType] = useState<GauntletType>(initialType);
  const [difficulty, setDifficulty] = useState<MathDifficulty>('easy');
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Game State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);
  const [mathEquation, setMathEquation] = useState({ text: '', result: 0 });
  const [totalError, setTotalError] = useState(0);
  const [attempts, setAttempts] = useState<{ target: number, elapsed: number, diff: number, text?: string, difficulty?: string }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ entry: LeaderboardEntry, index: number } | null>(null);

  useEffect(() => {
    if (initialStep === 'leaderboard') {
      loadLeaderboard(initialType);
    }
  }, [initialStep, initialType]);

  const getLeaderboardKey = (t: GauntletType) => {
    return t === 'seconds' ? 'gauntlet_seconds' : 'gauntlet_math_combined';
  };

  const loadLeaderboard = (t: GauntletType) => {
    const key = getLeaderboardKey(t);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setLeaderboard(JSON.parse(saved));
      } catch (e) {
        setLeaderboard([]);
      }
    } else {
      setLeaderboard([]);
    }
  };

  const checkNameExists = (name: string, t: GauntletType) => {
    const key = getLeaderboardKey(t);
    const current: LeaderboardEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    return current.some(entry => entry.name.toLowerCase() === name.trim().toLowerCase());
  };

  const saveToLeaderboard = (name: string, score: number, t: GauntletType) => {
    const key = getLeaderboardKey(t);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const newEntry: LeaderboardEntry = {
      name: name.trim(),
      score: parseFloat(score.toFixed(3)),
      date: new Date().toLocaleDateString()
    };
    const updated = [...current, newEntry].sort((a, b) => a.score - b.score).slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updated));
    setLeaderboard(updated);
  };

  const deleteFromLeaderboard = (index: number, t: GauntletType) => {
    const key = getLeaderboardKey(t);
    const current: LeaderboardEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((_, i) => i !== index);
    localStorage.setItem(key, JSON.stringify(updated));
    setLeaderboard(updated);
    setDeleteConfirm(null);
  };

  const generateMathEquation = (diff: MathDifficulty) => {
    const maxRes = 15;
    const minRes = 5;
    const intermediateLimit = 100;
    let finalRes = 0;
    let finalText = '';

    const opsPool = diff === 'easy' ? EASY_OPS : 
                    diff === 'medium' ? MEDIUM_OPS : 
                    diff === 'hard' ? HARD_OPS : INSANE_OPS;
    
    const numOps = diff === 'easy' ? 2 :
                   diff === 'medium' ? 3 :
                   diff === 'hard' ? 4 : 6;

    let attemptsCount = 0;
    while ((finalRes < minRes || finalRes > maxRes) && attemptsCount < 100) {
      attemptsCount++;
      let currentVal = Math.floor(Math.random() * 8) + 2;
      let currentText = `${currentVal}`;
      let opsCount = 0;

      while (opsCount < numOps) {
        const op = opsPool[Math.floor(Math.random() * opsPool.length)];
        
        if (op === '^2') {
          if (currentVal >= 1 && currentVal <= 10 && (currentVal * currentVal) <= intermediateLimit) {
            currentVal = currentVal * currentVal;
            currentText = `(${currentText})²`;
            opsCount++;
          }
        } else if (op === 'sqrt') {
          const perfectSquares = [4, 9, 16, 25, 36, 49, 64, 81, 100];
          if (perfectSquares.includes(currentVal)) {
            currentVal = Math.sqrt(currentVal);
            currentText = `√(${currentText})`;
            opsCount++;
          }
        } else if (op === '+') {
          const b = Math.floor(Math.random() * 20) + 1;
          if (currentVal + b <= intermediateLimit) {
            currentVal += b;
            currentText = `${currentText} + ${b}`;
            opsCount++;
          }
        } else if (op === '-') {
          const b = Math.floor(Math.random() * 20) + 1;
          if (currentVal - b >= 1) {
            currentVal -= b;
            currentText = `${currentText} - ${b}`;
            opsCount++;
          }
        } else if (op === '*') {
          const b = Math.floor(Math.random() * 5) + 2;
          if (currentVal * b <= intermediateLimit) {
            currentVal *= b;
            currentText = `(${currentText}) × ${b}`;
            opsCount++;
          }
        } else if (op === '/') {
          const possibleDivisors = [];
          for (let d = 2; d <= 10; d++) {
            if (currentVal % d === 0) possibleDivisors.push(d);
          }
          if (possibleDivisors.length > 0) {
            const b = possibleDivisors[Math.floor(Math.random() * possibleDivisors.length)];
            currentVal /= b;
            currentText = `(${currentText}) ÷ ${b}`;
            opsCount++;
          }
        } else if (op === 'log') {
          const powersOf2 = [2, 4, 8, 16, 32, 64];
          if (powersOf2.includes(currentVal)) {
            const res = Math.log2(currentVal);
            currentVal = res;
            currentText = `log₂(${currentText})`;
            opsCount++;
          }
        }
      }
      finalRes = currentVal;
      finalText = currentText;
    }
    
    setMathEquation({ text: finalText, result: finalRes });
  };

  const startGauntlet = () => {
    const trimmedName = playerName.trim();
    const alphaRegex = /^[a-zA-Z\s]+$/;

    if (!trimmedName) {
      setNameError("Please enter your name first.");
      setStep('name');
      return;
    }

    if (!alphaRegex.test(trimmedName)) {
      setNameError("Names can only contain letters and spaces.");
      setStep('name');
      return;
    }

    if (checkNameExists(playerName, type)) {
      setNameError(`"${playerName}" has already completed this gauntlet!`);
      setStep('name');
      return;
    }

    setTotalQuestions(type === 'seconds' ? 1 : 4);
    setCurrentQuestion(0);
    setTotalError(0);
    setAttempts([]);
    setLastElapsed(null);
    if (type === 'math') {
      setDifficulty('easy');
      generateMathEquation('easy');
    }
    setStep('playing');
  };

  const handleTap = () => {
    if (!isTimerRunning) {
      setStartTime(Date.now());
      setIsTimerRunning(true);
      setLastElapsed(null);
    } else {
      const endTime = Date.now();
      const elapsed = (endTime - (startTime || endTime)) / 1000;
      setIsTimerRunning(false);
      setLastElapsed(elapsed);

      const target = type === 'seconds' ? 30 : mathEquation.result;
      const diff = Math.abs(elapsed - target);
      
      setTotalError(prev => prev + diff);
      setAttempts(prev => [...prev, { 
        target, 
        elapsed, 
        diff, 
        text: type === 'math' ? mathEquation.text : undefined,
        difficulty: type === 'math' ? difficulty : undefined
      }]);
    }
  };

  const nextAction = () => {
    if (currentQuestion < totalQuestions - 1) {
      const nextIdx = currentQuestion + 1;
      setCurrentQuestion(nextIdx);
      setLastElapsed(null);
      if (type === 'math') {
        const diffs: MathDifficulty[] = ['easy', 'medium', 'hard', 'insane'];
        const nextDiff = diffs[nextIdx];
        setDifficulty(nextDiff);
        generateMathEquation(nextDiff);
      }
    } else {
      const finalScore = totalError;
      saveToLeaderboard(playerName, finalScore, type);
      setStep('results');
    }
  };

  const renderNameStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center space-y-8 w-full max-w-md"
    >
      <div className="text-center space-y-2">
        <div className={`inline-flex p-4 rounded-3xl mb-4 border transition-colors duration-300 ${isDarkMode ? 'bg-indigo-900/30 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
          <User size={40} />
        </div>
        <h2 className={`text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Enter the Gauntlet</h2>
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>What should we call you, challenger?</p>
      </div>

      <div className="w-full space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            value={playerName}
            onChange={(e) => { setPlayerName(e.target.value); setNameError(null); }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && playerName.trim()) {
                const alphaRegex = /^[a-zA-Z\s]+$/;
                if (!alphaRegex.test(playerName.trim())) {
                  setNameError("Names can only contain letters and spaces.");
                } else {
                  setStep('selection');
                }
              }
            }}
            placeholder="Your Name..."
            autoFocus
            className={`w-full p-4 rounded-2xl border outline-none transition-all text-lg font-bold text-center ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500 placeholder:text-slate-600' 
                : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 placeholder:text-slate-400 shadow-sm'
            } ${nameError ? 'border-rose-500 focus:border-rose-500' : ''}`}
          />
          {nameError && (
            <p className="text-rose-500 text-xs font-bold text-center animate-bounce">{nameError}</p>
          )}
        </div>
        <button
          onClick={() => {
            const alphaRegex = /^[a-zA-Z\s]+$/;
            if (!alphaRegex.test(playerName.trim())) {
              setNameError("Names can only contain letters and spaces.");
            } else {
              setStep('selection');
            }
          }}
          disabled={!playerName.trim()}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2 ${
            !playerName.trim() 
              ? 'opacity-50 cursor-not-allowed grayscale' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 active:scale-95'
          }`}
        >
          <span>Continue</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </motion.div>
  );

  const renderSelectionStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center space-y-8 w-full max-w-md"
    >
      <div className="text-center space-y-2">
        <h2 className={`text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Choose Your Path</h2>
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Welcome, <span className="text-indigo-400 font-bold">{playerName}</span></p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full">
        <button
          onClick={() => { setType('seconds'); setStep('leaderboard'); loadLeaderboard('seconds'); }}
          className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
            isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-100 hover:border-indigo-400 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Timer size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>30s Challenge</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>One round. Closest to 30s wins.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => { setType('math'); setStep('leaderboard'); loadLeaderboard('math'); }}
          className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
            isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-rose-500/50' : 'bg-white border-slate-100 hover:border-rose-400 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
              <Zap size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Math Gauntlet</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>4 rounds. Easy to Insane.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <button 
        onClick={() => setStep('name')}
        className={`flex items-center space-x-2 text-sm font-bold ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <ArrowLeft size={16} />
        <span>Change Name</span>
      </button>
    </motion.div>
  );

  const renderLeaderboardStep = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center space-y-8 w-full max-w-md relative"
    >
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl" />
            <div className={`relative p-6 rounded-2xl border-2 text-center space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xl'}`}>
              <div className="text-rose-500 mx-auto w-12 h-12 flex items-center justify-center bg-rose-500/10 rounded-full">
                <History size={24} />
              </div>
              <div className="space-y-2">
                <h3 className={`font-bold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Delete Score?</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Are you sure you want to delete the score for <span className="font-bold text-indigo-400">{deleteConfirm.entry.name}</span>?
                </p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteFromLeaderboard(deleteConfirm.index, type)}
                  className="flex-1 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-2">
        <div className={`inline-flex p-4 rounded-3xl mb-2 border transition-colors duration-300 ${isDarkMode ? 'bg-yellow-900/30 border-yellow-500/20 text-yellow-400' : 'bg-yellow-50 border-yellow-100 text-yellow-600'}`}>
          <Medal size={40} />
        </div>
        <h2 className={`text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Leaderboard</h2>
        <div className="flex justify-center space-x-2 mt-2">
          <button 
            onClick={() => { setType('seconds'); loadLeaderboard('seconds'); }}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              type === 'seconds' 
                ? 'bg-indigo-600 text-white' 
                : isDarkMode ? 'bg-slate-800 text-slate-500 hover:text-slate-300' : 'bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            30s Challenge
          </button>
          <button 
            onClick={() => { setType('math'); loadLeaderboard('math'); }}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              type === 'math' 
                ? 'bg-indigo-600 text-white' 
                : isDarkMode ? 'bg-slate-800 text-slate-500 hover:text-slate-300' : 'bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            Math Gauntlet
          </button>
        </div>
      </div>

      <div className={`w-full rounded-3xl border overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
        {leaderboard.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <History size={48} className={`mx-auto opacity-20 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <p className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>No records yet. Be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {leaderboard.map((entry, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 group ${idx === 0 ? isDarkMode ? 'bg-yellow-900/10' : 'bg-yellow-50' : ''}`}>
                <div className="flex items-center space-x-4">
                  <span className={`w-6 text-center font-black ${idx === 0 ? 'text-yellow-500' : isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{entry.name}</p>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{entry.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`font-black ${idx === 0 ? 'text-yellow-500' : 'text-indigo-500'}`}>
                    ±{entry.score.toFixed(2)}s
                  </span>
                  <button 
                    onClick={() => setDeleteConfirm({ entry, index: idx })}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'hover:bg-rose-500/20 text-slate-600 hover:text-rose-500' : 'hover:bg-rose-50 text-slate-300 hover:text-rose-600'}`}
                  >
                    <History size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <button
          onClick={() => setStep('selection')}
          className={`py-4 rounded-2xl font-bold transition-all border-2 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100' : 'bg-white border-slate-100 text-slate-500 hover:text-slate-900 shadow-sm'
          }`}
        >
          Back
        </button>
        <button
          onClick={startGauntlet}
          className="py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 active:scale-95 transition-all"
        >
          Start Challenge
        </button>
      </div>
    </motion.div>
  );

  const renderPlayingStep = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-12">
      <div className="text-center space-y-2">
        <h3 className={`text-xl font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{playerName}'s Gauntlet</h3>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
            {type === 'seconds' ? '30s Challenge' : `Math Gauntlet (${difficulty})`}
          </span>
          {type === 'math' && (
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
          )}
          <div className="h-16 flex items-center justify-center mt-4">
            {type === 'math' ? (
              isTimerRunning || lastElapsed !== null ? (
                <p className="text-4xl font-black text-indigo-400 tracking-tight">{mathEquation.text}</p>
              ) : (
                <p className={`text-lg font-bold italic ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Equation will appear on start...</p>
              )
            ) : (
              <p className={`text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Goal: <span className="text-indigo-400">30s</span></p>
            )}
          </div>
        </div>
      </div>

      <div 
        onClick={lastElapsed === null ? handleTap : undefined}
        className={`relative w-64 h-64 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
          isTimerRunning ? 'scale-110' : 'scale-100'
        }`}
      >
        <div className={`absolute inset-0 border-8 rounded-full transition-colors ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}></div>
        
        <AnimatePresence>
          {isTimerRunning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.1, 1],
              }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.73, ease: "easeInOut" }}
              className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl"
            />
          )}
        </AnimatePresence>

        <div className="text-center z-10">
          {!isTimerRunning && lastElapsed === null && (
            <div className="flex flex-col items-center space-y-2">
              <Play size={48} className="text-indigo-400" fill="currentColor" />
              <span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>TAP TO START</span>
            </div>
          )}
          {isTimerRunning && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <span className="font-bold text-indigo-400">TAP TO STOP</span>
            </div>
          )}
          {lastElapsed !== null && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <span className={`text-5xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{lastElapsed.toFixed(2)}s</span>
              <span className="text-sm font-bold mt-2 text-indigo-400">
                {type === 'math' ? `Target: ${mathEquation.result}s` : 'Target: 30s'}
              </span>
              <span className="text-xs font-bold text-rose-500 mt-1">Error: ±{Math.abs(lastElapsed - (type === 'seconds' ? 30 : mathEquation.result)).toFixed(2)}s</span>
            </motion.div>
          )}
        </div>
      </div>

      {lastElapsed !== null && (
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={nextAction}
          className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-500 transition-all"
        >
          {currentQuestion < totalQuestions - 1 ? 'Next Question' : 'Finish Gauntlet'}
        </motion.button>
      )}
    </div>
  );

  const renderResultsStep = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className={`inline-flex p-4 rounded-full mb-2 transition-colors ${isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
          <Trophy size={48} />
        </div>
        <h2 className={`text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Gauntlet Complete!</h2>
        <div className="flex flex-col items-center">
          <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Error: <span className="font-black text-indigo-500">±{totalError.toFixed(2)}s</span></p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{playerName}, you've been added to the leaderboard.</p>
        </div>
      </motion.div>

      <div className="w-full max-w-md space-y-4">
        <h3 className={`text-center font-bold uppercase tracking-widest text-xs ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Your Performance</h3>
        <div className="space-y-2">
          {attempts.map((a, i) => (
            <div key={i} className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    {type === 'seconds' ? '30s Challenge' : `${a.difficulty} Math`}
                  </p>
                  <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{a.text || `${a.target}s Target`}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{a.elapsed.toFixed(2)}s</p>
                  <p className="text-xs font-bold text-rose-500">±{a.diff.toFixed(2)}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col w-full max-w-md space-y-3">
        <ShareButton 
          title="Gauntlet Mode Results"
          text={`I just completed the ${type === 'seconds' ? '30s' : difficulty + ' math'} Gauntlet! 🏆\n\nMy Total Error: ±${totalError.toFixed(2)}s\n\nCan you beat my score?`}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 transition-all"
        />
        <button 
          onClick={startGauntlet}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 transition-all flex items-center justify-center space-x-2"
        >
          <RotateCcw size={20} />
          <span>Try Again</span>
        </button>
        <button 
          onClick={() => { loadLeaderboard(type); setStep('leaderboard'); }}
          className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${
            isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Medal size={20} />
          <span>View Leaderboard</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <main className="flex flex-col items-center justify-center p-6 pt-12">
        <AnimatePresence mode="wait">
          {step === 'name' && renderNameStep()}
          {step === 'selection' && renderSelectionStep()}
          {step === 'leaderboard' && renderLeaderboardStep()}
          {step === 'playing' && renderPlayingStep()}
          {step === 'results' && renderResultsStep()}
        </AnimatePresence>
      </main>
    </div>
  );
}
