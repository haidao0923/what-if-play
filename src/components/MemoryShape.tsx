import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Timer, 
  Trophy, 
  RotateCcw, 
  Play, 
  ChevronRight, 
  Sparkles, 
  Users, 
  X, 
  Plus, 
  Circle, 
  Square, 
  Triangle, 
  Star,
  CheckCircle2,
  XCircle
} from 'lucide-react';

type GameState = 'setup' | 'memorize' | 'question' | 'result' | 'ended' | 'sequence-flash' | 'sequence-input' | 'sequence-countdown';
type ShapeType = 'circle' | 'square' | 'triangle' | 'star';
type GameMode = 'classic' | 'progressive' | 'sequence';

interface MemoryItem {
  number: number;
  shape: ShapeType;
  x: number;
  y: number;
  color: string;
}

interface PlayerResult {
  name: string;
  score: number;
}

const SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'star'];
const COLORS = [
  'text-rose-500', 
  'text-indigo-500', 
  'text-emerald-500', 
  'text-amber-500', 
  'text-violet-500', 
  'text-cyan-500',
  'text-orange-500',
  'text-pink-500'
];

const ShapeIcon = ({ type, size = 48, className = "" }: { type: ShapeType, size?: number, className?: string }) => {
  switch (type) {
    case 'circle': return <Circle size={size} className={className} />;
    case 'square': return <Square size={size} className={className} />;
    case 'triangle': return <Triangle size={size} className={className} />;
    case 'star': return <Star size={size} className={className} />;
  }
};

const PLAYER_COLORS = [
  { light: 'bg-rose-50 border-rose-200 text-rose-600', dark: 'bg-rose-900/20 border-rose-500/30 text-rose-400', accent: 'bg-rose-500', text: 'text-rose-500' },
  { light: 'bg-indigo-50 border-indigo-200 text-indigo-600', dark: 'bg-indigo-900/20 border-indigo-500/30 text-indigo-400', accent: 'bg-indigo-500', text: 'text-indigo-500' },
  { light: 'bg-emerald-50 border-emerald-200 text-emerald-600', dark: 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400', accent: 'bg-emerald-500', text: 'text-emerald-500' },
  { light: 'bg-amber-50 border-amber-200 text-amber-600', dark: 'bg-amber-900/20 border-amber-500/30 text-amber-400', accent: 'bg-amber-500', text: 'text-amber-500' },
  { light: 'bg-violet-50 border-violet-200 text-violet-600', dark: 'bg-violet-900/20 border-violet-500/30 text-violet-400', accent: 'bg-violet-500', text: 'text-violet-500' },
  { light: 'bg-cyan-50 border-cyan-200 text-cyan-600', dark: 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400', accent: 'bg-cyan-500', text: 'text-cyan-500' },
  { light: 'bg-orange-50 border-orange-200 text-orange-600', dark: 'bg-orange-900/20 border-orange-500/30 text-orange-400', accent: 'bg-orange-500', text: 'text-orange-500' },
  { light: 'bg-pink-50 border-pink-200 text-pink-600', dark: 'bg-pink-900/20 border-pink-500/30 text-pink-400', accent: 'bg-pink-500', text: 'text-pink-500' },
];

export default function MemoryShape({ 
  isDarkMode, 
  initialPlayers, 
  onGameEnd,
  isGauntlet = false,
  gauntletMode = 'classic'
}: { 
  isDarkMode: boolean; 
  initialPlayers: string[]; 
  onGameEnd?: (score: number) => void;
  isGauntlet?: boolean;
  gauntletMode?: 'classic' | 'progressive' | 'sequence';
}) {
  const [gameState, setGameState] = useState<GameState>(isGauntlet ? (gauntletMode === 'sequence' ? 'sequence-flash' : 'memorize') : 'setup');
  const [numPlayers, setNumPlayers] = useState(initialPlayers.length > 0 ? initialPlayers.length : 1);
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    if (initialPlayers.length > 0) return initialPlayers;
    return ['Player 1'];
  });
  const [numRounds, setNumRounds] = useState(isGauntlet && gauntletMode === 'classic' ? 10 : 3);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameMode, setGameMode] = useState<GameMode>(isGauntlet ? gauntletMode : 'classic');
  const [playerLives, setPlayerLives] = useState<number[]>([]);
  
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [playerAssignments, setPlayerAssignments] = useState<number[]>([]); // number assigned to each player for the current round
  const [playerGuesses, setPlayerGuesses] = useState<(ShapeType | null)[]>([]);
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(5);
  const hasTriggeredEnd = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sequence mode state
  const [sequence, setSequence] = useState<ShapeType[]>([]);
  const [activeFlash, setActiveFlash] = useState<ShapeType | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isWrong, setIsWrong] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [pressedShape, setPressedShape] = useState<ShapeType | null>(null);

  const audioContext = useRef<AudioContext | null>(null);
  const oscillators = useRef<Record<ShapeType, number>>({
    circle: 261.63, // C4
    square: 329.63, // E4
    triangle: 392.00, // G4
    star: 523.25, // C5
  });

  const playTone = (shape: ShapeType) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContext.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(oscillators.current[shape], ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  // Initialize gauntlet game immediately if in gauntlet mode
  useEffect(() => {
    if (isGauntlet) {
      const initialResults = playerNames.slice(0, numPlayers).map(name => ({ name, score: 0 }));
      setPlayerResults(initialResults);
      setPlayerLives(new Array(numPlayers).fill(gauntletMode === 'sequence' ? 1 : 3));
      setCurrentRound(1);
      if (gauntletMode === 'classic') {
        setNumRounds(10);
      }
      startRound(1, new Array(numPlayers).fill(gauntletMode === 'sequence' ? 1 : 3));
    }
  }, [isGauntlet]);

  // Trigger onGameEnd when game ends
  useEffect(() => {
    if (gameState === 'ended' && onGameEnd && playerResults.length > 0 && !hasTriggeredEnd.current) {
      hasTriggeredEnd.current = true;
      onGameEnd(playerResults[0].score);
    }
    if (gameState !== 'ended') {
      hasTriggeredEnd.current = false;
    }
  }, [gameState, onGameEnd, playerResults]);

  const startNewGame = () => {
    const initialResults = playerNames.slice(0, numPlayers).map(name => ({ name, score: 0 }));
    const initialLives = new Array(numPlayers).fill(gameMode === 'sequence' ? 1 : 3);
    setPlayerResults(initialResults);
    setPlayerLives(initialLives);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
    setSequence([]);
    startRound(1, initialLives);
  };

  const flashSequence = (seq: ShapeType[]) => {
    setGameState('sequence-flash');
    setActiveFlash(null);
    
    let i = 0;
    const interval = setInterval(() => {
      if (i >= seq.length) {
        clearInterval(interval);
        setActiveFlash(null);
        setTimeout(() => {
          setGameState('sequence-input');
          setInputIndex(0);
        }, 400);
        return;
      }
      
      const currentShape = seq[i];
      setActiveFlash(currentShape);
      playTone(currentShape);
      setTimeout(() => setActiveFlash(null), 400);
      i++;
    }, 700);
  };

  const startRound = (roundNum: number, overrideLives?: number[], overrideSequence?: ShapeType[]) => {
    if (gameMode === 'sequence') {
      const currentSeq = overrideSequence !== undefined ? overrideSequence : sequence;
      const newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const newSequence = [...currentSeq, newShape];
      setSequence(newSequence);
      
      setGameState('sequence-countdown');
      setCountdown(3);
      
      const countInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countInterval);
            flashSequence(newSequence);
            return 0;
          }
          return prev - 1;
        });
      }, 800);
      return;
    }

    const newItems: MemoryItem[] = [];
    const usedPositions: {x: number, y: number}[] = [];
    
    const itemCount = gameMode === 'classic' ? 10 : (2 + roundNum);
    const maxNumber = gameMode === 'classic' ? 10 : itemCount;
    
    for (let i = 1; i <= itemCount; i++) {
      let x, y;
      let isOverlap;
      let attempts = 0;
      do {
        x = 10 + Math.random() * 80; // 10% to 90%
        y = 10 + Math.random() * 80;
        isOverlap = usedPositions.some(pos => Math.abs(pos.x - x) < 12 && Math.abs(pos.y - y) < 12);
        attempts++;
      } while (isOverlap && attempts < 50);
      
      usedPositions.push({x, y});
      newItems.push({
        number: i,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        x,
        y,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
    }
    
    setItems(newItems);
    
    // Assign a random number to each player who is still in the game
    const currentLives = overrideLives || playerLives;
    const assignments = playerNames.slice(0, numPlayers).map((_, idx) => {
      // Use the current lives from the state if available, otherwise assume 3
      const lives = currentLives.length > idx ? currentLives[idx] : 3;
      if (gameMode === 'progressive' && lives <= 0) return -1;
      return Math.floor(Math.random() * maxNumber) + 1;
    });
    setPlayerAssignments(assignments);
    
    // Initialize guesses: all players start with null
    setPlayerGuesses(new Array(numPlayers).fill(null));
    
    setGameState('memorize');
    setTimeLeft(5);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState('question');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGuess = (playerIndex: number, shape: ShapeType) => {
    if (gameMode === 'sequence') {
      if (gameState !== 'sequence-input' || playerIndex !== currentPlayerIndex) return;
      
      playTone(shape);
      setPressedShape(shape);
      setTimeout(() => setPressedShape(null), 150);

      if (shape === sequence[inputIndex]) {
        if (inputIndex === sequence.length - 1) {
          // Correct sequence completed
          const updatedResults = [...playerResults];
          updatedResults[currentPlayerIndex].score = sequence.length;
          setPlayerResults(updatedResults);
          
          setTimeout(() => {
            setCurrentRound(prev => prev + 1);
            startRound(currentRound + 1);
          }, 500);
        } else {
          setInputIndex(prev => prev + 1);
        }
      } else {
        // Wrong shape
        setIsWrong(true);
        const updatedResults = [...playerResults];
        updatedResults[currentPlayerIndex].score = sequence.length;
        setPlayerResults(updatedResults);
        
        const updatedLives = [...playerLives];
        updatedLives[currentPlayerIndex] = 0;
        setPlayerLives(updatedLives);
        
        setTimeout(() => {
          setIsWrong(false);
          setGameState('result');
        }, 1000);
      }
      return;
    }

    if (playerGuesses[playerIndex] !== null) return;

    const newGuesses = [...playerGuesses];
    newGuesses[playerIndex] = shape;
    setPlayerGuesses(newGuesses);
    
    // If everyone (who is active) has guessed, move to result
    const activePlayerIndices = playerAssignments.map((a, i) => a > 0 ? i : -1).filter(i => i !== -1);
    const allActiveGuessed = activePlayerIndices.every(idx => newGuesses[idx] !== null);

    if (allActiveGuessed) {
      // Calculate scores and lives for this round
      const updatedResults = playerResults.map((res, idx) => {
        const assignedNumber = playerAssignments[idx];
        const correctItem = items.find(item => item.number === assignedNumber);
        const guess = newGuesses[idx];
        
        if (gameMode === 'progressive') {
          // In progressive mode, score is the round number reached/eliminated in
          if (assignedNumber > 0) {
            return { ...res, score: currentRound };
          }
          return res;
        } else {
          // In classic mode, score is based on correct guesses
          if (assignedNumber > 0 && correctItem && correctItem.shape === guess) {
            return { ...res, score: res.score + 1 };
          }
          return res;
        }
      });

      const updatedLives = playerLives.map((lives, idx) => {
        const assignedNumber = playerAssignments[idx];
        const correctItem = items.find(item => item.number === assignedNumber);
        const guess = newGuesses[idx];
        
        if (gameMode === 'progressive' && assignedNumber > 0) {
          if (!correctItem || correctItem.shape !== guess) {
            return Math.max(0, lives - 1);
          }
        }
        return lives;
      });

      setPlayerResults(updatedResults);
      setPlayerLives(updatedLives);
      setGameState('result');
    }
  };

  const nextRound = () => {
    if (gameMode === 'sequence') {
      const nextPlayerIdx = currentPlayerIndex + 1;
      if (nextPlayerIdx < numPlayers) {
        setCurrentPlayerIndex(nextPlayerIdx);
        setSequence([]);
        setCurrentRound(1);
        startRound(1, undefined, []);
      } else {
        setGameState('ended');
      }
      return;
    }

    if (gameMode === 'classic') {
      if (currentRound < numRounds) {
        setCurrentRound(prev => prev + 1);
        startRound(currentRound + 1);
      } else {
        setGameState('ended');
      }
    } else {
      // Progressive mode end conditions: Play until everyone is eliminated
      const activePlayers = playerLives.filter(l => l > 0);
      if (activePlayers.length === 0) {
        setGameState('ended');
      } else {
        setCurrentRound(prev => prev + 1);
        startRound(currentRound + 1);
      }
    }
  };

  const updateNumPlayers = (val: number) => {
    const newCount = Math.max(1, Math.min(8, val));
    setNumPlayers(newCount);
    setPlayerNames(prev => {
      const next = [...prev];
      if (next.length < newCount) {
        for (let i = next.length; i < newCount; i++) {
          next.push(`Player ${i + 1}`);
        }
      } else {
        return next.slice(0, newCount);
      }
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const renderSetup = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 max-w-md"
      >
        <div className="space-y-2">
          <h2 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Memory Shape</h2>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Test your visual memory!</p>
        </div>
        
        <div className={`rounded-2xl p-4 border transition-colors duration-300 ${isDarkMode ? 'bg-violet-900/20 border-violet-800/30' : 'bg-violet-50 border-violet-100'}`}>
          <div className={`flex items-center justify-center space-x-2 font-bold mb-3 text-sm ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
            <Sparkles size={16} />
            <span>How to Play</span>
          </div>
          <div className="grid grid-cols-1 gap-3 text-left">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>1</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Memorize the numbers and their surrounding shapes.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>2</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>You have 5 seconds before they disappear from the screen.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>3</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Identify the correct shape for your assigned number!</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="w-full max-w-md space-y-6">
        <div className={`rounded-3xl shadow-2xl p-8 space-y-8 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 shadow-black/50 border-slate-800' : 'bg-white shadow-violet-100 border-slate-100'}`}>
          <div className="space-y-4">
            <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <Sparkles size={18} className="text-violet-400" />
              <span>Game Mode</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGameMode('classic')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                  gameMode === 'classic'
                    ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/20'
                    : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-violet-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-violet-400'
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => setGameMode('progressive')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                  gameMode === 'progressive'
                    ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/20'
                    : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-violet-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-violet-400'
                }`}
              >
                Progressive
              </button>
              <button
                onClick={() => setGameMode('sequence')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 col-span-2 ${
                  gameMode === 'sequence'
                    ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/20'
                    : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-violet-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-violet-400'
                }`}
              >
                Sequence
              </button>
            </div>
            <p className={`text-[10px] leading-relaxed text-center italic ${isDarkMode ? 'text-violet-300/50' : 'text-violet-700/50'}`}>
              {gameMode === 'classic' 
                ? "10 shapes every round. Fixed number of rounds."
                : gameMode === 'progressive'
                ? "Starts with 3 shapes, +1 each round. 3 lives. Last one standing wins!"
                : "Simon says! Repeat the flashing sequence. One shape added each round."}
            </p>
          </div>

          {gameMode === 'classic' && (
            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <RotateCcw size={18} className="text-violet-400" />
                <span>Number of Rounds</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((r) => (
                  <button
                    key={r}
                    onClick={() => setNumRounds(r)}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                      numRounds === r 
                        ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/20' 
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-violet-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-violet-400'
                    }`}
                  >
                    {r} Rounds
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <Users size={18} className="text-violet-400" />
              <span>Number of Players</span>
            </label>
            <div className={`flex items-center justify-between p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button 
                onClick={() => updateNumPlayers(numPlayers - 1)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
              >
                -
              </button>
              <span className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{numPlayers}</span>
              <button 
                onClick={() => updateNumPlayers(numPlayers + 1)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              <Users size={18} className="text-violet-400" />
              <span>Player Names</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {playerNames.map((name, i) => (
                <input
                  key={i}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const next = [...playerNames];
                    next[i] = e.target.value;
                    setPlayerNames(next);
                  }}
                  placeholder={`Player ${i + 1}`}
                  className={`w-full p-3 rounded-xl border border-transparent outline-none transition-all text-sm ${
                    isDarkMode 
                      ? 'bg-slate-800 text-slate-100 focus:border-violet-500 focus:bg-slate-700 placeholder:text-slate-500' 
                      : 'bg-gray-50 text-gray-900 focus:border-violet-500 focus:bg-white placeholder:text-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={startNewGame}
            className={`w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-violet-900/20 hover:bg-violet-500 active:scale-95 flex items-center justify-center space-x-2`}
          >
            <Play size={20} fill="currentColor" />
            <span>Start Game</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMemorize = () => (
    <div className="flex flex-col items-center justify-start min-h-screen p-2 sm:p-4 space-y-4 sm:space-y-6 overflow-hidden">
      <div className="w-full max-w-4xl flex justify-between items-center px-2 sm:px-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Round</p>
            <p className={`text-base sm:text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              {gameMode === 'classic' ? `${currentRound}/${numRounds}` : currentRound}
            </p>
          </div>
          <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-colors ${timeLeft <= 2 ? 'bg-rose-500/10 border-rose-500/30' : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${timeLeft <= 2 ? 'text-rose-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Memorize</p>
            <p className={`text-base sm:text-2xl font-black ${timeLeft <= 2 ? 'text-rose-500' : isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{timeLeft}s</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className={`text-lg sm:text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Memorize Shapes!</h3>
          <p className="text-[8px] sm:text-[10px] font-bold text-violet-500 uppercase tracking-widest">Look closely</p>
        </div>
      </div>

      <div className={`relative w-full max-w-4xl aspect-[1.6] rounded-xl sm:rounded-[2.5rem] border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
        {items.map((item) => (
          <motion.div
            key={item.number}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <div className="relative flex items-center justify-center">
              <ShapeIcon type={item.shape} className={item.color} size={isGauntlet ? 48 : 64} />
              <span className={`absolute text-base sm:text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {item.number}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderQuestion = () => {
    const isSmall = numPlayers > 4;
    const isMedium = numPlayers > 2 && numPlayers <= 4;
    const isLarge = numPlayers <= 2;

    return (
      <div className="flex flex-col items-center justify-start p-2 sm:p-4 space-y-2 sm:space-y-4">
        <div className="w-full max-w-5xl flex justify-between items-center px-4 py-1">
          <div className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border flex items-center space-x-2 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Round</p>
            <p className={`text-sm sm:text-lg font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              {gameMode === 'classic' ? `${currentRound}/${numRounds}` : currentRound}
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <h3 className={`text-lg sm:text-2xl font-black leading-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>What was the shape?</h3>
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-violet-500">All players guess</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full max-w-md px-2">
          {playerNames.map((name, idx) => {
            const assignedNumber = playerAssignments[idx];
            const isEliminated = gameMode === 'progressive' && playerLives[idx] <= 0;
            if (isEliminated) return null;

            const hasGuessed = playerGuesses[idx] !== null;
            const pColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];

            return (
              <motion.div 
                key={idx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-2.5 rounded-2xl border text-center relative overflow-hidden transition-all flex items-center space-x-4 ${
                  hasGuessed 
                    ? (isDarkMode ? pColor.dark : pColor.light)
                    : (isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50')
                }`}
              >
                {hasGuessed && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] z-10"
                  >
                    <div className={`${pColor.accent} text-white px-3 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest shadow-lg`}>
                      Ready!
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col items-center justify-center min-w-[60px] space-y-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest truncate max-w-[60px] ${hasGuessed ? (isDarkMode ? pColor.text : pColor.text) : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
                    {name}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${hasGuessed ? 'bg-white/20 text-current' : (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900')}`}>
                    {assignedNumber > 0 ? assignedNumber : ''}
                  </div>
                  {gameMode === 'progressive' && (
                    <div className="flex space-x-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < playerLives[idx] ? 'bg-rose-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-4 gap-2">
                  {SHAPES.map((shape) => (
                    <button
                      key={shape}
                      disabled={hasGuessed}
                      onClick={() => handleGuess(idx, shape)}
                      className={`group flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                        isDarkMode 
                          ? 'bg-slate-800 border-slate-700 hover:border-white/50 hover:bg-slate-700' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:bg-white'
                      }`}
                    >
                      <ShapeIcon 
                        type={shape} 
                        size={20} 
                        className={`${hasGuessed ? 'text-current opacity-50' : (isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900')} transition-colors`} 
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (gameMode === 'sequence') {
      const pColor = PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length];
      const isLastPlayer = currentPlayerIndex === numPlayers - 1;

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-8"
        >
          <div className="text-center space-y-2">
            <div className={`inline-flex p-4 rounded-3xl mb-4 border transition-colors duration-300 ${isDarkMode ? 'bg-violet-900/30 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-100 text-violet-600'}`}>
              <Trophy size={48} />
            </div>
            <h2 className={`text-4xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{playerNames[currentPlayerIndex]}</h2>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Challenge Completed!</p>
          </div>

          <div className={`w-full max-w-xs p-8 rounded-[2.5rem] border-4 text-center space-y-2 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
            <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Final Sequence Length</p>
            <p className="text-7xl font-black text-violet-500">{sequence.length}</p>
          </div>

          <button
            onClick={nextRound}
            className="w-full max-w-xs py-4 bg-violet-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-violet-900/20 hover:bg-violet-500 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <span>{isLastPlayer ? 'View Final Results' : `Next: ${playerNames[currentPlayerIndex + 1]}`}</span>
            <ChevronRight size={24} />
          </button>
        </motion.div>
      );
    }

    const isSmall = numPlayers > 4;
    const isMedium = numPlayers > 2 && numPlayers <= 4;
    const isLarge = numPlayers <= 2;

    return (
      <div className="flex flex-col items-center justify-start p-2 sm:p-4 space-y-2 sm:space-y-4">
        <div className="w-full max-w-5xl flex justify-between items-center px-4 py-1">
          <div className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border flex items-center space-x-2 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Round</p>
            <p className={`text-sm sm:text-lg font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              {gameMode === 'classic' ? `${currentRound}/${numRounds}` : currentRound}
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <h3 className={`text-lg sm:text-2xl font-black leading-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Round Results</h3>
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-violet-500">How did everyone do?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full max-w-md px-2">
          {playerNames.map((name, idx) => {
            const assignedNumber = playerAssignments[idx];
            const isEliminated = gameMode === 'progressive' && playerLives[idx] <= 0 && playerGuesses[idx] === null;
            if (isEliminated) return null;

            const correctItem = items.find(item => item.number === assignedNumber);
            const guess = playerGuesses[idx];
            const isCorrect = correctItem?.shape === guess;
            const pColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            const justEliminated = gameMode === 'progressive' && playerLives[idx] <= 0;

            return (
              <motion.div 
                key={idx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-2.5 rounded-2xl border text-center flex items-center space-x-4 ${
                  isDarkMode ? pColor.dark : pColor.light
                } ${justEliminated ? 'grayscale opacity-60' : ''}`}
              >
                <div className="flex flex-col items-center justify-center min-w-[60px] space-y-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest truncate max-w-[60px] ${isDarkMode ? pColor.text : pColor.text}`}>
                    {name}
                  </span>
                  <div className={`flex items-center space-x-1 ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      {justEliminated ? 'OUT' : isCorrect ? 'OK' : 'NO'}
                    </span>
                  </div>
                  {gameMode === 'progressive' && (
                    <div className="flex space-x-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < playerLives[idx] ? 'bg-rose-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-around">
                  <div className="text-center space-y-0.5">
                    <p className="text-[6px] font-black uppercase tracking-widest text-slate-500">Num {assignedNumber > 0 ? assignedNumber : '?'}</p>
                    <div className={`p-1.5 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      {guess && <ShapeIcon type={guess} size={20} className={isCorrect ? 'text-emerald-500' : 'text-rose-500'} />}
                    </div>
                    <p className="text-[6px] font-black uppercase tracking-widest text-slate-500">Guess</p>
                  </div>
                  {!isCorrect && (
                    <div className="text-center space-y-0.5">
                      <p className="text-[6px] font-black uppercase tracking-widest text-slate-500">Correct</p>
                      <div className={`p-1.5 rounded-lg border border-emerald-500/50 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                        {correctItem && <ShapeIcon type={correctItem.shape} size={20} className="text-emerald-500" />}
                      </div>
                      <p className="text-[6px] font-black uppercase tracking-widest text-slate-500">Shape</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={nextRound}
          className={`w-full bg-violet-600 text-white rounded-xl font-bold shadow-lg hover:bg-violet-500 active:scale-95 flex items-center justify-center space-x-2 ${
            isLarge ? 'max-w-xs py-4 text-xl' : 'max-w-[200px] py-2.5 text-base'
          }`}
        >
          <span>
            {gameMode === 'classic' 
              ? (currentRound < numRounds ? 'Next Round' : 'Final Results')
              : (numPlayers > 1 
                  ? (playerLives.filter(l => l > 0).length <= 1 ? 'Final Results' : 'Next Round')
                  : (playerLives[0] <= 0 ? 'Final Results' : 'Next Round'))
            }
          </span>
          <ChevronRight size={isLarge ? 24 : 18} />
        </button>
      </div>
    );
  };

  const renderSequence = () => (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 space-y-8">
      <div className="w-full max-w-4xl flex justify-between items-center px-4">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sequence</p>
            <p className={`text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{sequence.length}</p>
          </div>
          <div className={`p-3 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Player</p>
            <p className={`text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{playerNames[currentPlayerIndex]}</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className={`text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
            {gameState === 'sequence-countdown' ? 'Get Ready!' : 
             gameState === 'sequence-flash' ? 'Watch Carefully!' : 'Repeat Pattern!'}
          </h3>
          <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">
            {gameState === 'sequence-countdown' ? `Starting in ${countdown}...` :
             gameState === 'sequence-flash' ? 'Memorizing...' : `${inputIndex}/${sequence.length}`}
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-4 w-full max-w-md aspect-square p-4">
        {gameState === 'sequence-countdown' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <motion.span
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-8xl font-black text-violet-500 drop-shadow-2xl"
            >
              {countdown}
            </motion.span>
          </div>
        )}
        {SHAPES.map((shape) => {
          const isActive = activeFlash === shape || pressedShape === shape;
          const isInputting = gameState === 'sequence-input';
          
          return (
            <motion.button
              key={shape}
              disabled={!isInputting || isWrong}
              onClick={() => handleGuess(currentPlayerIndex, shape)}
              animate={isActive ? { scale: 1.1, filter: 'brightness(1.5)' } : { scale: 1, filter: 'brightness(1)' }}
              className={`relative aspect-square rounded-3xl border-4 flex items-center justify-center transition-all ${
                isActive 
                  ? 'bg-violet-500 border-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.5)] z-10'
                  : isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-700' 
                    : 'bg-slate-200 border-slate-300 text-slate-400 shadow-sm'
              } ${isInputting && !isWrong ? 'hover:border-violet-500/50 active:scale-95' : 'cursor-default'}`}
            >
              <ShapeIcon 
                type={shape} 
                size={64} 
                className={`${isActive ? 'text-white' : isDarkMode ? 'text-slate-800' : 'text-slate-400'} transition-colors`} 
              />
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/20 rounded-3xl"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {isWrong && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-2"
        >
          <div className="bg-rose-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest shadow-lg">
            Wrong Pattern!
          </div>
          <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Final Score: {sequence.length}
          </p>
        </motion.div>
      )}
    </div>
  );

  const renderEnded = () => {
    const sortedResults = [...playerResults].sort((a, b) => b.score - a.score);

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 p-6 text-center"
      >
        <div className="space-y-4">
          <div className={`inline-flex p-6 rounded-[2.5rem] mb-4 border-4 transition-all duration-500 bg-yellow-500/10 border-yellow-500 text-yellow-500 rotate-12`}>
            <Trophy size={64} />
          </div>
          <h2 className={`text-5xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>LEADERBOARD</h2>
          <div className="flex justify-center">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isDarkMode ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600'}`}>
              {gameMode} Mode
            </span>
          </div>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {numPlayers > 1 ? (
              <><span className="text-violet-400">{sortedResults[0]?.name}</span> is the Memory Master!</>
            ) : (
              <>Game Complete!</>
            )}
          </p>
        </div>

        <div className={`w-full max-w-sm p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className="space-y-4 mb-8">
            {sortedResults.map((res, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${i === 0 ? 'bg-violet-500/10 border-violet-500/30' : isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${i === 0 ? 'bg-yellow-500 text-white' : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                    {i + 1}
                  </span>
                  <span className={`font-bold ${i === 0 ? (isDarkMode ? 'text-slate-50' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-600')}`}>
                    {res.name}
                  </span>
                </div>
                <span className="font-black text-violet-500">{res.score} pts</span>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setGameState('setup')}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              Setup
            </button>
            <button
              onClick={startNewGame}
              className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-500 shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              <RotateCcw size={20} />
              <span>Rematch</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`min-h-[80vh] transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <AnimatePresence mode="wait">
        {gameState === 'setup' && renderSetup()}
        {(gameState === 'sequence-flash' || gameState === 'sequence-input' || gameState === 'sequence-countdown') && renderSequence()}
        {gameState === 'memorize' && renderMemorize()}
        {gameState === 'question' && renderQuestion()}
        {gameState === 'result' && renderResult()}
        {gameState === 'ended' && renderEnded()}
      </AnimatePresence>
    </div>
  );
}
