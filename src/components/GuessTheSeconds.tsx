import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Users, Timer, ArrowLeft, Sparkles, ChevronRight, Zap, Share2 } from 'lucide-react';
import ShareButton from './ShareButton';

type GameMode = 'standard' | 'math' | 'under' | 'metronome';

interface MetronomeTap {
  time: number;
  target: number;
  error: number;
}

interface MathAttempt {
  equation: string;
  target: number;
  elapsed: number;
  diff: number;
}

interface PlayerResult {
  id: number;
  name: string;
  elapsedTime: number; // Total for math, single for others
  diff: number; // Total for math, single for others
  disqualified?: boolean;
  mathAttempts?: MathAttempt[];
  metronomeTaps?: MetronomeTap[];
  metronomeInterval?: number;
}

export default function GuessTheSeconds({ isDarkMode = true, initialPlayers = [] }: { isDarkMode?: boolean, initialPlayers?: string[] }) {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'results'>('setup');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [numPlayers, setNumPlayers] = useState(initialPlayers.length > 0 ? initialPlayers.length : 2);
  const [playerNames, setPlayerNames] = useState<string[]>(initialPlayers.length > 0 ? initialPlayers : ['Player 1', 'Player 2']);
  const [targetTime, setTargetTime] = useState(10);

  useEffect(() => {
    if (gameMode === 'metronome') {
      setTargetTime(30);
    } else if (gameMode === 'standard' || gameMode === 'under') {
      setTargetTime(10);
    }
  }, [gameMode]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [mathEquation, setMathEquation] = useState({ text: '', result: 0 });
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'impossible'>('easy');
  const [numEquations, setNumEquations] = useState(3);
  const [metronomeInterval, setMetronomeInterval] = useState(1);
  const [metronomeTaps, setMetronomeTaps] = useState<MetronomeTap[]>([]);
  const [seedInput, setSeedInput] = useState('');
  const [activeSeed, setActiveSeed] = useState('');
  const [isCustomSeed, setIsCustomSeed] = useState(false);
  const rngRef = useRef<() => number>(Math.random);

  const seedRegex = /^([emhi])([1-9a-f])([1-9a-f])-(.+)$/i;
  const isValidSeed = !seedInput || seedRegex.test(seedInput);
  const parsedSeed = seedInput.match(seedRegex);

  const getDifficultyFromChar = (char: string): GameMode | any => {
    const map: Record<string, any> = { e: 'easy', m: 'medium', h: 'hard', i: 'impossible' };
    return map[char.toLowerCase()] || 'easy';
  };

  const getCharFromDifficulty = (diff: string): string => {
    const map: Record<string, string> = { easy: 'e', medium: 'm', hard: 'h', impossible: 'i' };
    return map[diff] || 'e';
  };

  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const mulberry32 = (a: number) => {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  };

  const generateMathEquation = () => {
    const rng = rngRef.current;
    const maxRes = 15;
    const minRes = 5;
    const intermediateLimit = 100;
    let finalRes = 0;
    let finalText = '';

    const opsPool = difficulty === 'easy' ? ['+', '-'] : 
                    difficulty === 'medium' ? ['+', '-', '*', '/'] : 
                    ['+', '-', '*', '/', '^2', 'sqrt'];
    
    const numOps = difficulty === 'easy' ? (rng() > 0.5 ? 2 : 3) :
                   difficulty === 'medium' ? (rng() > 0.5 ? 3 : 4) :
                   difficulty === 'hard' ? (rng() > 0.5 ? 4 : 5) : 6;

    let attempts = 0;
    let opsCount = 0;
    while ((finalRes < minRes || finalRes > maxRes || opsCount !== numOps) && attempts < 100) {
      attempts++;
      let currentVal = Math.floor(rng() * 8) + 2;
      let currentText = `${currentVal}`;
      opsCount = 0;
      let stepAttempts = 0;

      while (opsCount < numOps && stepAttempts < 50) {
        stepAttempts++;
        const op = opsPool[Math.floor(rng() * opsPool.length)];
        
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
          const b = Math.floor(rng() * 20) + 1;
          if (currentVal + b <= intermediateLimit) {
            currentVal += b;
            currentText = `${currentText} + ${b}`;
            opsCount++;
          }
        } else if (op === '-') {
          const b = Math.floor(rng() * 20) + 1;
          if (currentVal - b >= 1) {
            currentVal -= b;
            currentText = `${currentText} - ${b}`;
            opsCount++;
          }
        } else if (op === '*') {
          const b = Math.floor(rng() * 5) + 2;
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
            const b = possibleDivisors[Math.floor(rng() * possibleDivisors.length)];
            currentVal /= b;
            currentText = `(${currentText}) ÷ ${b}`;
            opsCount++;
          }
        }
      }
      finalRes = currentVal;
      finalText = currentText;
    }
    
    setMathEquation({ text: finalText, result: finalRes });
  };

  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'math' && !isTimerRunning && lastElapsed === null) {
      generateMathEquation();
    }
  }, [gameState, gameMode, currentPlayerIndex, currentAttemptIndex, isTimerRunning, lastElapsed]);

  const updateNumPlayers = (val: number) => {
    const newCount = Math.max(1, val);
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
    if (!isValidSeed) return;

    let finalDifficulty = difficulty;
    let finalNumEquations = numEquations;
    let finalNumPlayers = numPlayers;
    let rawSeed = '';

    if (parsedSeed) {
      finalDifficulty = getDifficultyFromChar(parsedSeed[1]);
      finalNumEquations = parseInt(parsedSeed[2], 16);
      finalNumPlayers = parseInt(parsedSeed[3], 16);
      rawSeed = parsedSeed[4];
      
      // Update state to match seed for consistency
      setDifficulty(finalDifficulty as any);
      setNumEquations(finalNumEquations);
      updateNumPlayers(finalNumPlayers);
      setIsCustomSeed(true);
    } else {
      rawSeed = seedInput || Math.random().toString(36).substring(2, 10);
      setIsCustomSeed(!!seedInput);
    }

    const numericSeed = hashString(rawSeed);
    const formattedSeed = `${getCharFromDifficulty(finalDifficulty)}${finalNumEquations.toString(16)}${finalNumPlayers.toString(16)}-${rawSeed}`;
    
    setActiveSeed(formattedSeed);
    rngRef.current = mulberry32(numericSeed);
    setGameState('playing');
    setCurrentPlayerIndex(0);
    setCurrentAttemptIndex(0);
    setResults([]);
    setLastElapsed(null);
    setMetronomeTaps([]);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && gameMode === 'metronome' && isTimerRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= targetTime) {
          setIsTimerRunning(false);
          setLastElapsed(targetTime);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState, gameMode, isTimerRunning, startTime]);

  // Separate effect to handle metronome results when timer stops
  useEffect(() => {
    if (gameMode === 'metronome' && !isTimerRunning && lastElapsed !== null) {
      const expectedTaps = Math.floor(targetTime / metronomeInterval);
      const penalty = Math.max(0, expectedTaps - metronomeTaps.length) * (metronomeInterval / 2);
      const diff = metronomeTaps.reduce((acc, tap) => acc + tap.error, 0) + penalty;

      setResults(prev => {
        const next = [...prev];
        const existingIdx = next.findIndex(r => r.id === currentPlayerIndex + 1);
        if (existingIdx === -1) {
          next.push({
            id: currentPlayerIndex + 1,
            name: playerNames[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`,
            elapsedTime: lastElapsed,
            diff,
            metronomeTaps: [...metronomeTaps],
            metronomeInterval
          });
        }
        return next;
      });
    }
  }, [isTimerRunning, lastElapsed, gameMode, metronomeTaps, currentPlayerIndex, playerNames, metronomeInterval, targetTime]);

  const handleTap = () => {
    if (!isTimerRunning) {
      setStartTime(Date.now());
      setIsTimerRunning(true);
      setLastElapsed(null);
      setMetronomeTaps([]);
    } else {
      const endTime = Date.now();
      const elapsed = (endTime - (startTime || endTime)) / 1000;
      
      if (gameMode === 'metronome') {
        const target = Math.round(elapsed / metronomeInterval) * metronomeInterval;
        if (target > 0) {
          const error = Math.abs(elapsed - target);
          const expectedTaps = Math.floor(targetTime / metronomeInterval);
          const newTapsCount = metronomeTaps.length + 1;
          
          setMetronomeTaps(prev => [...prev, { time: elapsed, target, error }]);
          
          if (newTapsCount >= expectedTaps) {
            setIsTimerRunning(false);
            setLastElapsed(elapsed);
          }
        }
        return;
      }

      setIsTimerRunning(false);
      setLastElapsed(elapsed);

      if (gameMode === 'math') {
        const diff = Math.abs(elapsed - mathEquation.result);
        const attempt: MathAttempt = {
          equation: mathEquation.text,
          target: mathEquation.result,
          elapsed,
          diff
        };

        setResults(prev => {
          const next = [...prev];
          const existingIdx = next.findIndex(r => r.id === currentPlayerIndex + 1);
          if (existingIdx !== -1) {
            const existing = { ...next[existingIdx] };
            existing.mathAttempts = [...(existing.mathAttempts || []), attempt];
            existing.diff += diff;
            existing.elapsedTime += elapsed;
            next[existingIdx] = existing;
          } else {
            next.push({
              id: currentPlayerIndex + 1,
              name: playerNames[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`,
              elapsedTime: elapsed,
              diff,
              mathAttempts: [attempt]
            });
          }
          return next;
        });
      } else {
        let diff = 0;
        let disqualified = false;
        if (gameMode === 'under') {
          if (elapsed > targetTime) {
            diff = 1000 + (elapsed - targetTime);
            disqualified = true;
          } else {
            diff = targetTime - elapsed;
          }
        } else {
          diff = Math.abs(elapsed - targetTime);
        }

        setResults((prev) => [...prev, {
          id: currentPlayerIndex + 1,
          name: playerNames[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`,
          elapsedTime: elapsed,
          diff,
          disqualified
        }]);
      }
    }
  };

  const nextAction = () => {
    if (gameMode === 'math') {
      if (currentAttemptIndex < numEquations - 1) {
        setCurrentAttemptIndex(currentAttemptIndex + 1);
        setLastElapsed(null);
      } else {
        if (currentPlayerIndex < numPlayers - 1) {
          setCurrentPlayerIndex(currentPlayerIndex + 1);
          setCurrentAttemptIndex(0);
          setLastElapsed(null);
        } else {
          setGameState('results');
        }
      }
    } else {
      if (currentPlayerIndex < numPlayers - 1) {
        setCurrentPlayerIndex(currentPlayerIndex + 1);
        setLastElapsed(null);
      } else {
        setGameState('results');
      }
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setNumPlayers(2);
    setTargetTime(10);
    setGameMode('standard');
    setNumEquations(4);
    setCurrentPlayerIndex(0);
    setCurrentAttemptIndex(0);
    setIsTimerRunning(false);
    setResults([]);
    setLastElapsed(null);
  };

  const modes = [
    { id: 'standard', name: 'Standard', desc: 'Closest to target' },
    { id: 'math', name: 'Math', desc: 'Solve 5 equations' },
    { id: 'under', name: 'Under', desc: 'Closest without going over' },
    { id: 'metronome', name: 'Metronome', desc: `Keep the beat for ${targetTime}s` },
  ];

  if (gameState === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center py-4 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8 w-full max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 w-full"
        >
          <div className="space-y-2">
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Guess the Seconds</h2>
            <p className={`text-sm sm:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>How accurate is your internal clock?</p>
          </div>
          
          <div className={`rounded-2xl p-4 border transition-colors duration-300 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className={`flex items-center justify-center space-x-2 font-bold mb-3 text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              <Sparkles size={16} />
              <span>How to Play</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-left">
              {gameMode === 'math' ? (
                <>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>1</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Start the timer to reveal a math equation (result between 5-15).</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>2</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Solve it in your head and stop the timer when you think the result has passed in seconds.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>3</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Repeat {numEquations} times. The player with the lowest total error wins!</p>
                  </div>
                </>
              ) : gameMode === 'metronome' ? (
                <>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>1</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Choose your beat interval. First tap starts the {targetTime}-second challenge.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>2</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tap on every beat to maintain the rhythm until the time is up.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>3</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your score is the cumulative error from the target beats. Lowest error wins!</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>1</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Choose your game mode and target time.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>2</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Each player takes turns tapping the screen to start and stop a hidden timer.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>3</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Try to stop the timer as close to the target time as possible!</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="w-full space-y-6">
          <div className={`rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 sm:space-y-8 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 shadow-black/50 border-slate-800' : 'bg-white shadow-indigo-100 border-slate-100'}`}>
            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Zap size={18} className="text-indigo-400" />
                <span>Game Mode</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setGameMode(m.id as GameMode)}
                    className={`p-2 sm:p-3 rounded-2xl text-[10px] sm:text-xs font-bold transition-all border-2 ${
                      gameMode === m.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-400'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <p className={`text-[10px] text-center font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {modes.find(m => m.id === gameMode)?.desc}
              </p>
            </div>

            {gameMode === 'math' && (
              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Sparkles size={18} className="text-indigo-400" />
                  <span>Game Seed (Optional)</span>
                </label>
                <input
                  type="text"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="Format: e42-myseed"
                  className={`w-full p-2 sm:p-3 rounded-xl border-2 outline-none transition-all text-xs sm:text-sm font-mono ${
                    seedInput && !isValidSeed 
                      ? isDarkMode ? 'border-red-900/50 bg-red-900/20 text-red-200' : 'border-red-200 bg-red-50 text-red-600'
                      : isDarkMode ? 'bg-slate-800 border-transparent focus:border-indigo-500 focus:bg-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-transparent focus:border-indigo-500 focus:bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                {seedInput && !isValidSeed ? (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                    Invalid Format! Use: [Diff][Eqs][Players]-[Name]
                  </p>
                ) : (
                  <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Seed overrides difficulty, equations, and player count.
                  </p>
                )}
              </div>
            )}

            {gameMode === 'metronome' && (
              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Timer size={18} className="text-indigo-400" />
                  <span>Beat Interval (seconds)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((interval) => (
                    <button
                      key={interval}
                      onClick={() => setMetronomeInterval(interval)}
                      className={`p-2 sm:p-3 rounded-2xl text-[10px] sm:text-xs font-bold transition-all border-2 ${
                        metronomeInterval === interval 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                          : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-400'
                      }`}
                    >
                      {interval}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`space-y-6 sm:space-y-8 transition-opacity ${seedInput ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {gameMode === 'math' && (
                <div className="space-y-4">
                  <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Zap size={18} className="text-indigo-400" />
                    <span>Math Difficulty</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['easy', 'medium', 'hard', 'impossible'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`p-2 sm:p-3 rounded-2xl text-[10px] sm:text-xs font-bold transition-all border-2 capitalize ${
                          difficulty === d 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                            : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {gameMode === 'math' && (
                <div className="space-y-4">
                  <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Timer size={18} className="text-indigo-400" />
                    <span>Number of Equations</span>
                  </label>
                  <div className={`flex items-center justify-between p-1 sm:p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <button 
                      onClick={() => setNumEquations(Math.max(1, numEquations - 1))}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-gray-900 hover:bg-slate-50'}`}
                    >
                      -
                    </button>
                    <span className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{numEquations}</span>
                    <button 
                      onClick={() => setNumEquations(Math.min(15, numEquations + 1))}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-gray-900 hover:bg-slate-50'}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Users size={18} className="text-indigo-400" />
                  <span>Number of Players</span>
                </label>
                <div className={`flex items-center justify-between p-1 sm:p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <button 
                    onClick={() => updateNumPlayers(numPlayers - 1)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-gray-900 hover:bg-slate-50'}`}
                  >
                    -
                  </button>
                  <span className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{numPlayers}</span>
                  <button 
                    onClick={() => updateNumPlayers(Math.min(15, numPlayers + 1))}
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-gray-900 hover:bg-slate-50'}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Users size={18} className="text-indigo-400" />
                <span>Player Names (Optional)</span>
              </label>
              <div className="space-y-2 max-h-32 sm:max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {playerNames.map((name, i) => (
                  <input
                    key={i}
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    placeholder={`Player ${i + 1}`}
                    className={`w-full p-2 sm:p-3 rounded-xl border border-transparent outline-none transition-all text-xs sm:text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 text-slate-100 focus:border-indigo-500 focus:bg-slate-700 placeholder:text-slate-500' 
                        : 'bg-gray-50 text-gray-900 focus:border-indigo-500 focus:bg-white placeholder:text-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {gameMode !== 'math' && (
              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Timer size={18} className="text-indigo-400" />
                  <span>Target Time (seconds)</span>
                </label>
                <input 
                  type="range" 
                  min="3" 
                  max="60" 
                  value={targetTime} 
                  onChange={(e) => setTargetTime(parseInt(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}
                />
                <div className="text-center text-2xl sm:text-3xl font-black text-indigo-500">
                  {targetTime}s
                </div>
              </div>
            )}

            <button 
              onClick={startGame}
              disabled={!isValidSeed}
              className={`w-full py-3 sm:py-4 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg transition-all flex items-center justify-center space-x-2 ${
                isValidSeed ? 'bg-indigo-600 shadow-indigo-900/20 hover:bg-indigo-500 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none'
              }`}
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
    const effectiveTarget = gameMode === 'math' ? mathEquation.result : targetTime;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 pt-[env(safe-area-inset-top)] space-y-6 sm:space-y-12 overflow-hidden">
        <div className="text-center space-y-2">
          <h3 className={`text-lg sm:text-xl font-medium transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{playerNames[currentPlayerIndex]}'s Turn</h3>
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
              {gameMode} mode {gameMode === 'math' && `(Attempt ${currentAttemptIndex + 1}/${numEquations})`}
              {gameMode === 'metronome' && `(Beat: ${metronomeInterval}s)`}
            </span>
            {gameMode === 'math' && (
              <div className="flex flex-col items-center mb-1 sm:mb-2">
                <span className={`text-[8px] sm:text-[10px] font-mono uppercase ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Seed: {activeSeed}</span>
                <span className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-widest ${isCustomSeed ? 'text-indigo-400' : isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {isCustomSeed ? 'Custom Seed' : 'Randomized Seed'}
                </span>
              </div>
            )}
            {gameMode === 'math' ? (
              <div className="h-10 sm:h-12 flex items-center justify-center">
                {isTimerRunning || lastElapsed !== null ? (
                  <p className="text-2xl sm:text-4xl font-black text-indigo-400 tracking-tight">{mathEquation.text}</p>
                ) : (
                  <p className={`text-sm sm:text-lg font-bold italic ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Equation will appear on start...</p>
                )}
              </div>
            ) : gameMode === 'metronome' ? (
              <div className="h-10 sm:h-12 flex flex-col items-center justify-center">
                <p className={`text-xl sm:text-2xl font-bold transition-colors ${isDarkMode ? 'text-slate-50' : 'text-gray-900'}`}>
                  Goal: <span className="text-indigo-400">{targetTime}s</span>
                </p>
                {isTimerRunning && (
                  <div className="w-32 sm:w-48 h-1 bg-slate-800 rounded-full mt-1 sm:mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: targetTime, ease: "linear" }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className={`text-xl sm:text-2xl font-bold transition-colors ${isDarkMode ? 'text-slate-50' : 'text-gray-900'}`}>Goal: <span className="text-indigo-400">{effectiveTarget}s</span></p>
            )}
          </div>
        </div>

        <div 
          onClick={lastElapsed === null ? handleTap : undefined}
          className={`relative w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isTimerRunning ? 'scale-105 sm:scale-110' : 'scale-100'
          }`}
        >
          <div className={`absolute inset-0 border-4 sm:border-8 rounded-full transition-colors ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}></div>
          
          <AnimatePresence>
            {isTimerRunning && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.1, 1],
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.73, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl sm:blur-2xl"
              />
            )}
          </AnimatePresence>

          <div className="text-center z-10">
            {!isTimerRunning && lastElapsed === null && (
              <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                <Play size={32} className="text-indigo-400 sm:w-12 sm:h-12" fill="currentColor" />
                <span className="font-bold text-xs sm:text-sm text-slate-500">TAP TO START</span>
              </div>
            )}
            {isTimerRunning && (
              <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse" />
                <span className="font-bold text-xs sm:text-sm text-indigo-400">
                  {gameMode === 'metronome' ? 'KEEP THE BEAT!' : 'TAP TO STOP'}
                </span>
                {gameMode === 'metronome' && (
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {metronomeTaps.length} Taps recorded
                  </span>
                )}
              </div>
            )}
            {lastElapsed !== null && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <span className={`text-3xl sm:text-5xl font-black transition-colors ${isDarkMode ? 'text-slate-50' : 'text-gray-900'}`}>{lastElapsed.toFixed(2)}s</span>
                <span className={`text-xs sm:text-sm font-bold mt-1 sm:mt-2 ${
                  gameMode === 'metronome'
                    ? 'text-indigo-400'
                    : gameMode === 'under' && lastElapsed > targetTime 
                      ? 'text-red-400' 
                      : Math.abs(lastElapsed - effectiveTarget) < 0.5 
                        ? 'text-green-400' 
                        : 'text-orange-400'
                }`}>
                  {gameMode === 'metronome' ? (
                  (() => {
                    const expectedTaps = Math.floor(targetTime / metronomeInterval);
                    const penalty = Math.max(0, expectedTaps - metronomeTaps.length) * (metronomeInterval / 2);
                    const totalError = metronomeTaps.reduce((acc, tap) => acc + tap.error, 0) + penalty;
                    return `Error: ${totalError.toFixed(3)}s`;
                  })()
                ) : gameMode === 'under' && lastElapsed > targetTime ? 'BUSTED!' :
                   Math.abs(lastElapsed - effectiveTarget) < 0.1 ? 'PERFECT!' : 
                   Math.abs(lastElapsed - effectiveTarget) < 0.5 ? 'SO CLOSE!' : 
                   lastElapsed > effectiveTarget ? 'TOO LATE' : 'TOO EARLY'}
                </span>
                {gameMode === 'math' && (
                  <span className={`text-[10px] sm:text-xs font-bold mt-0.5 sm:mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Target was {effectiveTarget}s</span>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {lastElapsed !== null && (
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={nextAction}
            className={`w-full max-w-xs py-3 sm:py-4 rounded-2xl font-bold shadow-xl transition-all text-sm sm:text-base ${
              isDarkMode ? 'bg-slate-800 text-slate-50 hover:bg-slate-700' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {gameMode === 'math' 
              ? (currentAttemptIndex < numEquations - 1 ? 'Next Attempt' : (currentPlayerIndex < numPlayers - 1 ? 'Next Player' : 'See Results'))
              : (currentPlayerIndex < numPlayers - 1 ? 'Next Player' : 'See Results')
            }
          </motion.button>
        )}
      </div>
    );
  }

  const winner = [...results].sort((a, b) => a.diff - b.diff)[0];

  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8 w-full max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 w-full"
      >
        <div className={`inline-flex p-3 sm:p-4 rounded-full mb-2 transition-colors ${isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
          <Trophy size={40} className="sm:w-12 sm:h-12" />
        </div>
        <h2 className={`text-3xl sm:text-4xl font-black transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Results</h2>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">{gameMode} mode</span>
          {gameMode === 'math' && (
            <div className="flex flex-col items-center mb-2">
              <span className={`text-[10px] font-mono uppercase ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Seed: {activeSeed}</span>
              <span className={`text-[8px] font-bold uppercase tracking-widest ${isCustomSeed ? 'text-indigo-400' : isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                {isCustomSeed ? 'Custom Seed' : 'Randomized Seed'}
              </span>
            </div>
          )}
          {gameMode !== 'math' && (
            <p className={`text-base sm:text-lg transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Goal was <span className="font-bold text-indigo-400">{targetTime}s</span></p>
          )}
        </div>
      </motion.div>

      <div className="w-full space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {results.sort((a, b) => a.diff - b.diff).map((result, index) => (
          <div key={result.id} className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-colors duration-300 ${
                index === 0 && !result.disqualified 
                  ? isDarkMode ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-500' 
                  : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
              } ${result.disqualified ? 'opacity-60 grayscale' : ''}`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-colors ${
                  index === 0 && !result.disqualified ? 'bg-indigo-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-400'
                }`}>
                  {result.disqualified ? 'X' : index + 1}
                </div>
                <div>
                  <p className={`font-bold text-sm sm:text-base transition-colors ${isDarkMode ? 'text-slate-50' : 'text-gray-900'}`}>{result.name}</p>
                  <p className={`text-[10px] sm:text-xs transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    {gameMode === 'math' ? `${result.mathAttempts?.length} attempts` : `${result.elapsedTime.toFixed(2)}s elapsed`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm sm:text-base transition-colors ${index === 0 && !result.disqualified ? 'text-indigo-400' : isDarkMode ? 'text-slate-50' : 'text-gray-900'}`}>
                  {result.disqualified ? 'BUST' : `±${result.diff.toFixed(2)}s`}
                </p>
                {gameMode === 'math' && (
                  <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Total Error</p>
                )}
              </div>
            </motion.div>
            
            {gameMode === 'math' && result.mathAttempts && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`rounded-2xl p-3 sm:p-4 border space-y-2 ml-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-gray-50 border-gray-100'
                }`}
              >
                {result.mathAttempts.map((attempt, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] sm:text-xs">
                    <div className="flex flex-col">
                      <span className="font-mono text-indigo-400 font-bold">{attempt.equation}</span>
                      <span className={`transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Target: {attempt.target}s</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold transition-colors ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{attempt.elapsed.toFixed(2)}s</div>
                      <div className="text-red-400 font-medium">±{attempt.diff.toFixed(2)}s</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {gameMode === 'metronome' && result.metronomeTaps && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`rounded-2xl p-3 sm:p-4 border space-y-2 ml-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex justify-between items-center text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Tap Analysis</span>
                  <span>Interval: {result.metronomeInterval}s</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {result.metronomeTaps.map((tap, i) => (
                    <div key={i} className="flex justify-between items-center text-[8px] sm:text-[10px] p-2 rounded-lg bg-slate-900/30">
                      <span className="text-indigo-400 font-bold">Tap {i + 1}</span>
                      <span className="text-red-400">±{tap.error.toFixed(2)}s</span>
                    </div>
                  ))}
                  {(() => {
                    const interval = result.metronomeInterval || 1;
                    const expectedTaps = Math.floor(targetTime / interval);
                    const missing = Math.max(0, expectedTaps - result.metronomeTaps.length);
                    if (missing === 0) return null;
                    return Array.from({ length: missing }).map((_, i) => (
                      <div key={`missing-${i}`} className="flex justify-between items-center text-[8px] sm:text-[10px] p-2 rounded-lg bg-red-900/20 border border-red-900/30">
                        <span className="text-red-400 font-bold">Missing Tap</span>
                        <span className="text-red-400">±{(interval / 2).toFixed(2)}s</span>
                      </div>
                    ));
                  })()}
                </div>
                {result.metronomeTaps.length === 0 && (
                  <p className="text-[10px] text-center text-slate-500 italic">No taps recorded!</p>
                )}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col w-full space-y-3">
        <ShareButton 
          title="Guess the Seconds Results"
          text={`I just played Guess the Seconds (${gameMode} mode)${gameMode === 'math' ? ` with seed: ${activeSeed}` : ''}! 🏆\n\nFinal Rankings:\n${results.sort((a, b) => a.diff - b.diff).map((r, i) => `${i + 1}. ${r.name} (±${r.diff.toFixed(2)}s)`).join('\n')}`}
          className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-indigo-900/20 hover:bg-indigo-500 transition-all flex items-center justify-center space-x-2"
        />
        <button 
          onClick={startGame}
          className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-indigo-900/20 hover:bg-indigo-500 transition-all flex items-center justify-center space-x-2"
        >
          <RotateCcw size={20} />
          <span>Play Again</span>
        </button>
        <button 
          onClick={resetGame}
          className={`w-full py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center space-x-2 ${
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
