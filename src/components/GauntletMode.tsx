import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Users, Timer, ArrowLeft, Sparkles, Zap, ChevronRight, User, Medal, History, Share2, Brain, MapPin, Globe, Palette, Clock, Calendar, BarChart3 } from 'lucide-react';
import ShareButton from './ShareButton';
import MemoryShape from './MemoryShape';
import GeoTrivia from './GeoTrivia';
import ColorMatch from './ColorMatch';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';

type GauntletStep = 'name' | 'selection' | 'playing' | 'results' | 'leaderboard';
type GauntletType = 'seconds' | 'math' | 'memory-classic' | 'memory-progressive' | 'geotrivia-time' | 'geotrivia-distance' | 'color-match' | 'color-match-easy' | 'color-match-mix';
type MathDifficulty = 'easy' | 'medium' | 'hard' | 'insane';
type Timeframe = 'daily' | 'weekly' | 'monthly' | 'all-time';

interface LeaderboardEntry {
  name: string;
  score: number; // For seconds: error. For math: total error.
  date: string;
  timestamp?: Date;
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
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
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
  const [leaderboardSource, setLeaderboardSource] = useState<'local' | 'global'>('local');
  const [globalTimeframe, setGlobalTimeframe] = useState<Timeframe>('all-time');
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ entry: LeaderboardEntry, index: number } | null>(null);
  const hasSavedScore = useRef(false);

  useEffect(() => {
    if (step === 'leaderboard') {
      loadLeaderboard(type, leaderboardSource, globalTimeframe);
    }
  }, [step, type, leaderboardSource, globalTimeframe]);

  const getLeaderboardKey = (t: GauntletType) => {
    if (t === 'seconds') return 'gauntlet_seconds';
    if (t === 'math') return 'gauntlet_math_combined';
    if (t === 'memory-classic') return 'gauntlet_memory_classic';
    if (t === 'memory-progressive') return 'gauntlet_memory_progressive';
    if (t === 'geotrivia-time') return 'gauntlet_geotrivia_time';
    if (t === 'geotrivia-distance') return 'gauntlet_geotrivia_distance';
    if (t === 'color-match') return 'gauntlet_color_match';
    if (t === 'color-match-easy') return 'gauntlet_color_match_easy';
    if (t === 'color-match-mix') return 'gauntlet_color_match_mix';
    return 'gauntlet_unknown';
  };

  const loadLeaderboard = async (t: GauntletType, source: 'local' | 'global' = leaderboardSource, timeframe: Timeframe = globalTimeframe) => {
    if (source === 'local') {
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
    } else {
      setIsLoadingGlobal(true);
      try {
        const isHigherBetter = t.startsWith('memory-') || t === 'geotrivia-time' || t.startsWith('color-match');
        const q = query(
          collection(db, 'gauntlet_leaderboards'),
          where('gameType', '==', t),
          orderBy('score', isHigherBetter ? 'desc' : 'asc'),
          limit(200)
        );
        const snapshot = await getDocs(q);
        let entries = snapshot.docs.map(doc => {
          const data = doc.data();
          const ts = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date();
          return {
            name: data.playerName,
            score: data.score,
            date: ts.toLocaleDateString(),
            timestamp: ts
          };
        });

        const now = new Date();
        if (timeframe === 'daily') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          entries = entries.filter(e => e.timestamp && e.timestamp.getTime() >= startOfToday);
        } else if (timeframe === 'weekly') {
          const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
          entries = entries.filter(e => e.timestamp && e.timestamp.getTime() >= startOfWeek);
        } else if (timeframe === 'monthly') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          entries = entries.filter(e => e.timestamp && e.timestamp.getTime() >= startOfMonth);
        }
        setLeaderboard(entries.slice(0, 50));
      } catch (e) {
        console.error("Error loading global leaderboard", e);
        setLeaderboard([]);
      } finally {
        setIsLoadingGlobal(false);
      }
    }
  };

  const checkNameExists = (name: string, t: GauntletType) => {
    const key = getLeaderboardKey(t);
    const current: LeaderboardEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    return current.some(entry => entry.name.toLowerCase() === name.trim().toLowerCase());
  };

  const saveToLeaderboard = async (name: string, score: number, t: GauntletType) => {
    if (hasSavedScore.current) return;
    hasSavedScore.current = true;

    // Local save
    const key = getLeaderboardKey(t);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const newEntry: LeaderboardEntry = {
      name: name.trim(),
      score: parseFloat(score.toFixed(3)),
      date: new Date().toLocaleDateString()
    };
    const isHigherBetter = t.startsWith('memory-') || t === 'geotrivia-time' || t.startsWith('color-match');
    const updated = [...current, newEntry].sort((a, b) => isHigherBetter ? b.score - a.score : a.score - b.score).slice(0, 50);
    localStorage.setItem(key, JSON.stringify(updated));
    setLeaderboard(updated);

    // Global save with rate limiting
    const RATE_LIMIT_KEY = 'gauntlet_global_save_rate_limit';
    const MAX_PER_HOUR = 100;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    let rateLimitData = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{"count": 0, "startTime": 0}');
    
    if (now - rateLimitData.startTime > oneHour) {
      rateLimitData = { count: 0, startTime: now };
    }

    if (rateLimitData.count < MAX_PER_HOUR) {
      try {
        await addDoc(collection(db, 'gauntlet_leaderboards'), {
          playerName: name.trim(),
          score: parseFloat(score.toFixed(3)),
          gameType: t,
          timestamp: serverTimestamp()
        });
        
        rateLimitData.count += 1;
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimitData));
      } catch (e) {
        console.error("Error saving to global leaderboard", e);
      }
    } else {
      console.warn("Global leaderboard rate limit reached (100/hr). Score saved locally only.");
    }
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

    setTotalQuestions(type === 'seconds' ? 1 : type === 'math' ? 4 : 1);
    setCurrentQuestion(0);
    setTotalError(0);
    setAttempts([]);
    setLastElapsed(null);
    if (type === 'math') {
      setDifficulty('easy');
      generateMathEquation('easy');
    }
    hasSavedScore.current = false;
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

  const renderSelectionStep = () => {
    const games = [
      { 
        id: 'seconds-math', 
        name: 'Seconds', 
        icon: Timer, 
        color: 'indigo',
        description: 'Test your internal clock and math skills. Can you stop exactly at the target?',
        modes: [
          { id: 'seconds', name: '30s Challenge', desc: 'One round. Closest to 30s wins.' },
          { id: 'math', name: 'Math Gauntlet', desc: '4 rounds. Easy to Insane.' }
        ]
      },
      { 
        id: 'memory', 
        name: 'Memory', 
        icon: Brain, 
        color: 'violet',
        description: 'Memorize shapes and patterns. How far can your memory go?',
        modes: [
          { id: 'memory-classic', name: 'Classic', desc: '10 rounds. Total correct.' },
          { id: 'memory-progressive', name: 'Progressive', desc: 'Infinite rounds. Highest round.' }
        ]
      },
      { 
        id: 'geo', 
        name: 'Geography', 
        icon: MapPin, 
        color: 'blue',
        description: 'Find states on the map. Speed or accuracy?',
        modes: [
          { id: 'geotrivia-time', name: 'GeoTime', desc: 'Find states in 60s.' },
          { id: 'geotrivia-distance', name: 'GeoDistance', desc: '10 states. Lowest distance.' }
        ]
      },
      { 
        id: 'color', 
        name: 'Color', 
        icon: Palette, 
        color: 'emerald',
        description: 'The Stroop Effect. Match colors, not words!',
        modes: [
          { id: 'color-match-easy', name: 'Easy', desc: 'Buttons show colors.' },
          { id: 'color-match', name: 'Standard', desc: 'Buttons shuffle. Hard!' },
          { id: 'color-match-mix', name: 'Mix Master', desc: 'Mix primary colors!' }
        ]
      }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center space-y-6 w-full max-w-lg"
      >
        <div className="text-center space-y-1">
          <h2 className={`text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Choose Your Path</h2>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Welcome, <span className="text-indigo-400 font-bold">{playerName}</span></p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
              className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all group ${
                selectedGame === game.id
                  ? `border-${game.color}-500 ${isDarkMode ? `bg-${game.color}-900/20` : `bg-${game.color}-50`}`
                  : isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-2xl mb-2 transition-colors ${
                selectedGame === game.id
                  ? `text-${game.color}-400`
                  : isDarkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'
              }`}>
                <game.icon size={28} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                selectedGame === game.id ? `text-${game.color}-400` : isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {game.name}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedGame && (
            <motion.div
              key={selectedGame}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full space-y-4 overflow-hidden"
            >
              <div className={`p-6 rounded-[2rem] border-2 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className={`text-sm mb-6 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {games.find(g => g.id === selectedGame)?.description}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {games.find(g => g.id === selectedGame)?.modes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => { setType(mode.id as GauntletType); setStep('leaderboard'); loadLeaderboard(mode.id as GauntletType); }}
                      className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/50' : 'bg-gray-50 border-gray-200 hover:border-indigo-400 shadow-sm'
                      }`}
                    >
                      <div>
                        <h4 className={`font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{mode.name}</h4>
                        <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{mode.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setStep('name')}
          className={`flex items-center space-x-2 text-sm font-bold ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ArrowLeft size={16} />
          <span>Change Name</span>
        </button>
      </motion.div>
    );
  };

  const renderLeaderboardStep = () => {
    const gameGroups = [
      { id: 'seconds-math', name: 'Seconds', icon: Timer, modes: [{ id: 'seconds', name: '30s' }, { id: 'math', name: 'Math' }] },
      { id: 'memory', name: 'Memory', icon: Brain, modes: [{ id: 'memory-classic', name: 'Classic' }, { id: 'memory-progressive', name: 'Prog' }] },
      { id: 'geo', name: 'Geo', icon: MapPin, modes: [{ id: 'geotrivia-time', name: 'Time' }, { id: 'geotrivia-distance', name: 'Dist' }] },
      { id: 'color', name: 'Color', icon: Palette, modes: [{ id: 'color-match-easy', name: 'Easy' }, { id: 'color-match', name: 'Std' }, { id: 'color-match-mix', name: 'Mix' }] }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center space-y-6 w-full max-w-md relative"
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
        </div>

        <div className={`w-full p-4 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          {/* Source Selector */}
          <div className="flex justify-center space-x-2 mb-4">
            <button
              onClick={() => setLeaderboardSource('local')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                leaderboardSource === 'local'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                  : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <User size={14} />
              <span>Local</span>
            </button>
            <button
              onClick={() => setLeaderboardSource('global')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                leaderboardSource === 'global'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                  : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Globe size={14} />
              <span>Global</span>
            </button>
          </div>

          {/* Timeframe Selector (only for Global) */}
          {leaderboardSource === 'global' && (
            <div className="flex justify-center space-x-1 mb-4 overflow-x-auto pb-2 no-scrollbar">
              {(['daily', 'weekly', 'monthly', 'all-time'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setGlobalTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    globalTimeframe === tf
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tf.replace('-', ' ')}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-4">
            {gameGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  const firstMode = group.modes[0].id as GauntletType;
                  setType(firstMode);
                  loadLeaderboard(firstMode);
                }}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  group.modes.some(m => m.id === type)
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <group.icon size={20} />
                <span className="text-[8px] font-black uppercase mt-1">{group.name}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {gameGroups.find(g => g.modes.some(m => m.id === type))?.modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => { setType(mode.id as GauntletType); loadLeaderboard(mode.id as GauntletType); }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  type === mode.id
                    ? 'bg-indigo-500 text-white'
                    : isDarkMode ? 'bg-slate-800 text-slate-500 hover:text-slate-300' : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>

          <div className={`w-full rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
            {isLoadingGlobal ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Fetching global scores...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center space-y-4">
                <History size={32} className={`mx-auto opacity-20 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No records yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 group ${idx === 0 ? isDarkMode ? 'bg-yellow-900/10' : 'bg-yellow-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <span className={`w-4 text-center text-xs font-black ${idx === 0 ? 'text-yellow-500' : isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{entry.name}</p>
                        <div className="flex items-center space-x-2">
                          <p className={`text-[8px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{entry.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-black ${idx === 0 ? 'text-yellow-500' : 'text-indigo-500'}`}>
                        {type.startsWith('memory-') || type.startsWith('color-match') || type === 'geotrivia-time' ? `${entry.score} pts` : 
                         type === 'geotrivia-distance' ? `${entry.score.toFixed(0)} km` :
                         `±${entry.score.toFixed(2)}s`}
                      </span>
                      <button 
                        onClick={() => setDeleteConfirm({ entry, index: idx })}
                        className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'hover:bg-rose-500/20 text-slate-600 hover:text-rose-500' : 'hover:bg-rose-50 text-slate-300 hover:text-rose-600'}`}
                      >
                        <History size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
  };

  const renderPlayingStep = () => {
    if (type.startsWith('memory-')) {
      return (
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between px-6 py-4">
            <button 
              onClick={() => setStep('selection')}
              className={`flex items-center space-x-2 text-sm font-bold ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ArrowLeft size={16} />
              <span>Quit Gauntlet</span>
            </button>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Gauntlet Mode</p>
              <h3 className={`text-lg font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{playerName}</h3>
            </div>
          </div>
          <MemoryShape 
            isDarkMode={isDarkMode} 
            initialPlayers={[playerName]} 
            isGauntlet={true}
            gauntletMode={type === 'memory-classic' ? 'classic' : 'progressive'}
            onGameEnd={(score) => {
              setTotalError(score);
              saveToLeaderboard(playerName, score, type);
              setStep('results');
            }}
          />
        </div>
      );
    }

    if (type.startsWith('geotrivia-')) {
      return (
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between px-6 py-4">
            <button 
              onClick={() => setStep('selection')}
              className={`flex items-center space-x-2 text-sm font-bold ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ArrowLeft size={16} />
              <span>Quit Gauntlet</span>
            </button>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Gauntlet Mode</p>
              <h3 className={`text-lg font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{playerName}</h3>
            </div>
          </div>
          <GeoTrivia 
            isDarkMode={isDarkMode} 
            initialPlayers={[playerName]} 
            isGauntlet={true}
            gauntletMode={type === 'geotrivia-time' ? 'time' : 'distance'}
            onGameEnd={(score) => {
              setTotalError(score);
              saveToLeaderboard(playerName, score, type);
              setStep('results');
            }}
          />
        </div>
      );
    }

    if (type.startsWith('color-match')) {
      return (
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between px-6 py-4">
            <button 
              onClick={() => setStep('selection')}
              className={`flex items-center space-x-2 text-sm font-bold ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ArrowLeft size={16} />
              <span>Quit Gauntlet</span>
            </button>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Gauntlet Mode</p>
              <h3 className={`text-lg font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{playerName}</h3>
            </div>
          </div>
          <ColorMatch 
            isDarkMode={isDarkMode} 
            isGauntlet={true}
            initialDifficulty={
              type === 'color-match-easy' ? 'easy' :
              type === 'color-match-mix' ? 'mix-master' : 'standard'
            }
            onGameEnd={(score) => {
              setTotalError(score);
              saveToLeaderboard(playerName, score, type);
              setStep('results');
            }}
          />
        </div>
      );
    }

    return (
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
};

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
          <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {type.startsWith('memory-') || type === 'geotrivia-time' || type.startsWith('color-match') ? 'Final Score: ' : 
             type === 'geotrivia-distance' ? 'Total Distance: ' : 'Total Error: '}
            <span className="font-black text-indigo-500">
              {type.startsWith('memory-') || type === 'geotrivia-time' || type.startsWith('color-match') ? `${totalError} pts` : 
               type === 'geotrivia-distance' ? `${totalError.toFixed(0)} km` : `±${totalError.toFixed(2)}s`}
            </span>
          </p>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            {playerName}, your score has been saved to the local and global leaderboards.
          </p>
        </div>
      </motion.div>

      {type.startsWith('memory-') || type.startsWith('geotrivia-') || type.startsWith('color-match') ? null : (
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
      )}

      <div className="flex flex-col w-full max-w-md space-y-3">
        <ShareButton 
          title="Gauntlet Mode Results"
          text={type.startsWith('memory-') 
            ? `I just completed the Memory Shape ${type.split('-')[1]} Gauntlet! 🏆\n\nMy Score: ${totalError} pts\n\nCan you beat my score?`
            : type === 'geotrivia-time'
            ? `I just completed the GeoTrivia Time Challenge Gauntlet! 🏆\n\nMy Score: ${totalError} pts\n\nCan you beat my score?`
            : type.startsWith('color-match')
            ? `I just completed the Color Match Gauntlet! 🏆\n\nMy Score: ${totalError} pts\n\nCan you beat my score?`
            : type === 'geotrivia-distance'
            ? `I just completed the GeoTrivia Distance Duel Gauntlet! 🏆\n\nMy Total Distance: ${totalError.toFixed(0)} km\n\nCan you beat my score?`
            : `I just completed the ${type === 'seconds' ? '30s' : difficulty + ' math'} Gauntlet! 🏆\n\nMy Total Error: ±${totalError.toFixed(2)}s\n\nCan you beat my score?`
          }
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
      <main className="flex flex-col items-center justify-center p-6 pt-[calc(3rem+env(safe-area-inset-top))]">
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
