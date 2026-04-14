import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Timer, RotateCcw, ChevronRight, Share2, Palette, CheckCircle2, XCircle, Users, Trophy, Info } from 'lucide-react';
import ShareButton from './ShareButton';

const COLORS = [
  { name: 'Red', hex: '#ef4444', text: 'text-red-500', bg: 'bg-red-500' },
  { name: 'Blue', hex: '#3b82f6', text: 'text-blue-500', bg: 'bg-blue-500' },
  { name: 'Yellow', hex: '#eab308', text: 'text-yellow-500', bg: 'bg-yellow-500' },
  { name: 'Green', hex: '#22c55e', text: 'text-green-500', bg: 'bg-green-500' },
  { name: 'Purple', hex: '#a855f7', text: 'text-purple-500', bg: 'bg-purple-500' },
  { name: 'Orange', hex: '#f97316', text: 'text-orange-500', bg: 'bg-orange-500' },
];

const PRIMARY_COLORS = ['Red', 'Blue', 'Yellow'];
const MIX_MAP: Record<string, string> = {
  'Red+Yellow': 'Orange',
  'Yellow+Red': 'Orange',
  'Red+Blue': 'Purple',
  'Blue+Red': 'Purple',
  'Yellow+Blue': 'Green',
  'Blue+Yellow': 'Green',
  'Red+Red': 'Red',
  'Blue+Blue': 'Blue',
  'Yellow+Yellow': 'Yellow'
};

interface ColorMatchProps {
  isDarkMode?: boolean;
  initialPlayers?: string[];
  isGauntlet?: boolean;
  initialDifficulty?: DifficultyMode;
  onGameEnd?: (score: number) => void;
}

type GameState = 'setup' | 'playing' | 'transition' | 'ended';
type DifficultyMode = 'easy' | 'standard' | 'mix-master';

interface PlayerResult {
  name: string;
  score: number;
}

export default function ColorMatch({ 
  isDarkMode = true, 
  initialPlayers = [], 
  isGauntlet = false, 
  initialDifficulty = 'standard',
  onGameEnd 
}: ColorMatchProps) {
  const [gameState, setGameState] = useState<GameState>(isGauntlet ? 'playing' : 'setup');
  const [isDuoMode, setIsDuoMode] = useState(false);
  const [numPlayers, setNumPlayers] = useState(initialPlayers.length > 0 ? initialPlayers.length : 1);
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    if (initialPlayers.length > 0) return initialPlayers;
    return ['Player 1'];
  });
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>(isGauntlet ? initialDifficulty : 'standard');
  const [shuffledColors, setShuffledColors] = useState(COLORS);
  
  const [score, setScore] = useState(0);
  const [score2, setScore2] = useState(0); // For Duo Mode
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentWord, setCurrentWord] = useState(COLORS[0]);
  const [currentColor, setCurrentColor] = useState(COLORS[1]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [player1Guessed, setPlayer1Guessed] = useState(false);
  const [player2Guessed, setPlayer2Guessed] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredEnd = useRef(false);

  const generateChallenge = () => {
    setPlayer1Guessed(false);
    setPlayer2Guessed(false);
    
    let wordIdx, colorIdx;
    
    if (difficultyMode === 'mix-master') {
      // Only use primary colors for the challenge
      const p1 = PRIMARY_COLORS[Math.floor(Math.random() * PRIMARY_COLORS.length)];
      const p2 = PRIMARY_COLORS[Math.floor(Math.random() * PRIMARY_COLORS.length)];
      
      const wordObj = COLORS.find(c => c.name === p1)!;
      const colorObj = COLORS.find(c => c.name === p2)!;
      
      setCurrentWord(wordObj);
      setCurrentColor(colorObj);
    } else {
      do {
        wordIdx = Math.floor(Math.random() * COLORS.length);
        colorIdx = Math.floor(Math.random() * COLORS.length);
        
        // 70% chance they are different (Stroop effect)
        if (Math.random() < 0.7) {
          while (colorIdx === wordIdx) {
            colorIdx = Math.floor(Math.random() * COLORS.length);
          }
        }
      } while (COLORS[wordIdx].name === currentWord.name && COLORS[colorIdx].name === currentColor.name);

      setCurrentWord(COLORS[wordIdx]);
      setCurrentColor(COLORS[colorIdx]);
    }

    if (difficultyMode === 'standard' || difficultyMode === 'mix-master' || isDuoMode) {
      setShuffledColors([...COLORS].sort(() => Math.random() - 0.5));
    } else {
      setShuffledColors(COLORS);
    }
  };

  const startNewGame = () => {
    const initialResults = playerNames.slice(0, numPlayers).map(name => ({ name, score: 0 }));
    setPlayerResults(initialResults);
    setCurrentPlayerIndex(0);
    startTurn(0);
  };

  const startTurn = (index: number) => {
    setScore(0);
    setScore2(0);
    setTimeLeft(30);
    setGameState('playing');
    generateChallenge();
  };

  const endTurn = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (isDuoMode) {
      setPlayerResults([
        { name: playerNames[0], score: score },
        { name: playerNames[1], score: score2 }
      ]);
      setGameState('ended');
    } else {
      setPlayerResults(prev => {
        const next = [...prev];
        if (next[currentPlayerIndex]) {
          next[currentPlayerIndex].score = score;
        }
        return next;
      });

      if (currentPlayerIndex + 1 < numPlayers) {
        setGameState('transition');
      } else {
        setGameState('ended');
        if (isGauntlet && onGameEnd && !hasTriggeredEnd.current) {
          hasTriggeredEnd.current = true;
          onGameEnd(score);
        }
      }
    }
    if (gameState !== 'ended') {
      hasTriggeredEnd.current = false;
    }
  };

  const nextPlayer = () => {
    const nextIdx = currentPlayerIndex + 1;
    setCurrentPlayerIndex(nextIdx);
    startTurn(nextIdx);
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            endTurn();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft, score, isGauntlet, onGameEnd, currentPlayerIndex, numPlayers]);

  const handleChoice = (colorName: string, playerNum: 1 | 2 = 1) => {
    if (gameState !== 'playing' || feedback !== null) return;
    
    if (isDuoMode) {
      if (playerNum === 1 && player1Guessed) return;
      if (playerNum === 2 && player2Guessed) return;
    }

    let isCorrect = false;
    if (difficultyMode === 'mix-master') {
      const targetColor = MIX_MAP[`${currentWord.name}+${currentColor.name}`];
      isCorrect = colorName === targetColor;
    } else {
      isCorrect = colorName === currentColor.name;
    }

    if (isCorrect) {
      if (playerNum === 1) setScore(prev => prev + 1);
      else setScore2(prev => prev + 1);
      setFeedback('correct');
      
      // Delay word change so user sees feedback
      setTimeout(() => {
        setFeedback(null);
        generateChallenge();
      }, 150);
    } else {
      if (isDuoMode) {
        if (playerNum === 1) setPlayer1Guessed(true);
        else setPlayer2Guessed(true);
        
        // If both guessed wrong, skip word
        if ((playerNum === 1 && player2Guessed) || (playerNum === 2 && player1Guessed)) {
          setFeedback('wrong');
          setTimeout(() => {
            setFeedback(null);
            generateChallenge();
          }, 150);
        }
      } else {
        setScore(prev => Math.max(0, prev - 2)); // Penalty for wrong answer
        setFeedback('wrong');
        setTimeout(() => {
          setFeedback(null);
          generateChallenge();
        }, 150);
      }
    }
  };

  const updateNumPlayers = (val: number) => {
    const newCount = Math.max(1, Math.min(8, val));
    setNumPlayers(newCount);
    if (playerNames.length < newCount) {
      const needed = newCount - playerNames.length;
      const newNames = [...playerNames];
      for (let i = 0; i < needed; i++) {
        newNames.push(`Player ${newNames.length + 1}`);
      }
      setPlayerNames(newNames);
    }
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  if (gameState === 'setup' && !isGauntlet) {
    return (
      <div className="flex flex-col items-center justify-center py-4 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8 w-full max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 w-full">
          <div className="space-y-2">
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Color Match</h2>
            <p className={`text-sm sm:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              The Stroop Effect challenge. Match the ink color, not the word!
            </p>
          </div>
          <div className={`rounded-2xl p-4 border transition-colors duration-300 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className={`flex items-center justify-center space-x-2 font-bold mb-3 text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              <Sparkles size={16} />
              <span>How to Play</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-left">
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>1</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {difficultyMode === 'mix-master' 
                    ? "Tap the color that results from mixing the word and ink colors." 
                    : "Ignore the word itself and tap the button that matches the ink color."}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>2</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Correct answers give +1 point, but wrong answers cost -2 points!</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>3</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Race against the clock to get the highest score possible!</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className={`w-full p-6 sm:p-8 rounded-[2.5rem] border transition-all duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-indigo-900/10' : 'bg-white border-slate-100 shadow-xl shadow-indigo-100'}`}>
          <div className="space-y-6">
            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Zap size={18} className="text-indigo-400" />
                <span>Difficulty Mode</span>
              </label>
              <div className={`flex p-1 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <button
                  onClick={() => setDifficultyMode('easy')}
                  className={`flex-1 py-2 rounded-xl font-bold text-[10px] transition-all ${
                    difficultyMode === 'easy'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  EASY
                </button>
                <button
                  onClick={() => setDifficultyMode('standard')}
                  className={`flex-1 py-2 rounded-xl font-bold text-[10px] transition-all ${
                    difficultyMode === 'standard'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  STANDARD
                </button>
                <button
                  onClick={() => setDifficultyMode('mix-master')}
                  className={`flex-1 py-2 rounded-xl font-bold text-[10px] transition-all ${
                    difficultyMode === 'mix-master'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  MIX MASTER
                </button>
              </div>
              <p className={`text-[10px] italic text-center ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                {difficultyMode === 'easy' && 'Buttons show their colors.'}
                {difficultyMode === 'standard' && 'Buttons shuffle every turn!'}
                {difficultyMode === 'mix-master' && 'Mix the word and ink colors!'}
                {isDuoMode && ' • Duo Battle enabled!'}
              </p>
            </div>

            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Users size={18} className="text-indigo-400" />
                <span>Number of Players</span>
              </label>
              <div className="flex items-center justify-center space-x-6">
                <button 
                  onClick={() => { updateNumPlayers(numPlayers - 1); if (numPlayers - 1 !== 2) setIsDuoMode(false); }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-100 text-slate-900 hover:bg-gray-200'}`}
                >
                  -
                </button>
                <span className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{numPlayers}</span>
                <button 
                  onClick={() => updateNumPlayers(numPlayers + 1)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-100 text-slate-900 hover:bg-gray-200'}`}
                >
                  +
                </button>
              </div>
              
              {numPlayers === 2 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <button
                    onClick={() => setIsDuoMode(!isDuoMode)}
                    className={`w-full py-3 rounded-xl border-2 font-bold text-[10px] sm:text-xs transition-all flex items-center justify-center space-x-2 ${
                      isDuoMode 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Users size={14} />
                    <span>{isDuoMode ? 'DUO BATTLE: ON' : 'DUO BATTLE: OFF'}</span>
                  </button>
                  <p className={`text-[10px] text-center mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    {isDuoMode ? 'Simultaneous head-to-head battle!' : 'Turn-based play.'}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Sparkles size={18} className="text-indigo-400" />
                <span>Player Names</span>
              </label>
              <div className="space-y-2 max-h-32 sm:max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {playerNames.slice(0, numPlayers).map((name, i) => (
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

            <button
              onClick={startNewGame}
              className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-indigo-900/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <span>Start Game</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'transition') {
    const nextPlayerName = playerNames[currentPlayerIndex + 1];
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className={`inline-flex p-6 rounded-full ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <Users size={64} />
          </div>
          <div className="space-y-2">
            <h2 className={`text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Next Player</h2>
            <p className={`text-5xl font-black text-indigo-500`}>{nextPlayerName}</p>
          </div>
          <button
            onClick={nextPlayer}
            className="px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all"
          >
            I'm Ready!
          </button>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'ended' && !isGauntlet) {
    const winner = [...playerResults].sort((a, b) => b.score - a.score)[0];
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <div className={`inline-flex p-4 rounded-full ${isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
            <Trophy size={48} />
          </div>
          <h2 className={`text-4xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Game Over!</h2>
          {numPlayers > 1 && (
            <p className={`text-xl font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Winner: <span className="text-yellow-500">{winner.name}</span> with {winner.score} pts
            </p>
          )}
        </motion.div>

        <div className={`w-full max-w-md rounded-[2.5rem] border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className="p-6 border-b border-slate-800/50">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Final Scores</h3>
          </div>
          <div className="divide-y divide-slate-800/50">
            {playerResults.map((result, i) => (
              <div key={i} className="flex items-center justify-between p-4 px-6">
                <span className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{result.name}</span>
                <span className="font-black text-indigo-500">{result.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-full max-w-md space-y-3">
          <ShareButton 
            title="WI-Play Results"
            text={isDuoMode 
              ? `We just had a Color Match Duo Battle on WI-Play! ⚔️\n\nWinner: ${winner.name} (${winner.score} pts)\nRunner-up: ${playerResults.find(r => r.name !== winner.name)?.name} (${playerResults.find(r => r.name !== winner.name)?.score} pts)\n\nWho's next?`
              : numPlayers > 1 
                ? `I just played Color Match on WI-Play with ${numPlayers} friends! 🏆\n\nWinner: ${winner.name} (${winner.score} pts)\n\nCan you beat us?`
                : `I just scored ${winner.score} pts in Color Match on WI-Play! 🏆\n\nCan you beat my score?`
            }
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-900/20 hover:bg-indigo-500 transition-all flex items-center justify-center space-x-2"
          />
          <button
            onClick={() => setGameState('setup')}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-2 ${
              isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <RotateCcw size={20} />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && isDuoMode) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full max-w-lg mx-auto p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] gap-y-8 overflow-hidden">
        {/* Player 2 (Top) */}
        <div className="w-full flex flex-col items-center space-y-2 rotate-180">
          <div className="w-full flex justify-between items-end px-2">
            <div className="space-y-0">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {playerNames[1]}
              </p>
              <p className={`text-3xl font-black ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{score2}</p>
            </div>
            <div className="text-right space-y-0">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Time Left</p>
              <p className={`text-3xl font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                {timeLeft}s
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 w-full px-2">
            {shuffledColors.map((color) => (
              <button
                key={color.name}
                onClick={() => handleChoice(color.name, 2)}
                disabled={player2Guessed || feedback !== null}
                className={`h-12 rounded-xl shadow-lg transition-all active:scale-90 flex items-center justify-center group relative overflow-hidden ${
                  difficultyMode === 'easy' 
                    ? color.bg 
                    : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                } ${player2Guessed || feedback !== null ? 'opacity-50 grayscale' : 'hover:scale-105'}`}
              >
                <span className={`font-black uppercase tracking-widest text-[8px] ${
                  difficultyMode === 'easy' ? 'text-white drop-shadow-md' : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Challenge (Mirrored) */}
        <div className="w-full flex flex-col items-center justify-center space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentWord.name}-${currentColor.name}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className={`w-full rounded-[2rem] shadow-xl p-2 min-h-[140px] flex flex-col items-center justify-center text-center border relative overflow-hidden ${
                isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-indigo-100'
              }`}
            >
              {/* Mirrored Word for Player 2 */}
              <h3 className={`text-3xl font-black tracking-tighter uppercase rotate-180 ${currentColor.text}`}>
                {currentWord.name}
              </h3>
              
              <div className={`h-px w-1/2 my-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
              
              {/* Word for Player 1 */}
              <h3 className={`text-3xl font-black tracking-tighter uppercase ${currentColor.text}`}>
                {currentWord.name}
              </h3>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className={`absolute inset-0 flex items-center justify-center backdrop-blur-[2px] z-20 ${
                      feedback === 'correct' ? 'bg-green-500/20' : 'bg-rose-500/20'
                    }`}
                  >
                    {feedback === 'correct' ? (
                      <CheckCircle2 size={40} className="text-green-500 drop-shadow-lg" />
                    ) : (
                      <XCircle size={40} className="text-rose-500 drop-shadow-lg" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Player 1 (Bottom) */}
        <div className="w-full flex flex-col items-center space-y-2">
          <div className="w-full flex justify-between items-end px-2">
            <div className="space-y-0">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {playerNames[0]}
              </p>
              <p className={`text-3xl font-black ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{score}</p>
            </div>
            <div className="text-right space-y-0">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Time Left</p>
              <p className={`text-3xl font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                {timeLeft}s
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full px-2">
            {shuffledColors.map((color) => (
              <button
                key={color.name}
                onClick={() => handleChoice(color.name, 1)}
                disabled={player1Guessed || feedback !== null}
                className={`h-12 rounded-xl shadow-lg transition-all active:scale-90 flex items-center justify-center group relative overflow-hidden ${
                  difficultyMode === 'easy' 
                    ? color.bg 
                    : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                } ${player1Guessed || feedback !== null ? 'opacity-50 grayscale' : 'hover:scale-105'}`}
              >
                <span className={`font-black uppercase tracking-widest text-[8px] ${
                  difficultyMode === 'easy' ? 'text-white drop-shadow-md' : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 space-y-6">
      <div className="w-full max-w-md flex justify-between items-end px-2">
        <div className="space-y-0">
          <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {numPlayers > 1 ? playerNames[currentPlayerIndex] : 'Score'}
          </p>
          <p className={`text-3xl font-black ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{score}</p>
        </div>
        <div className="text-right space-y-0">
          <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Time Left</p>
          <p className={`text-3xl font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
            {timeLeft}s
          </p>
        </div>
      </div>

      {/* Main Challenge Card */}
      <div className="w-full max-w-lg relative px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentWord.name}-${currentColor.name}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className={`rounded-[2.5rem] shadow-2xl p-8 min-h-[180px] flex items-center justify-center text-center border relative overflow-hidden ${
              isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-indigo-100'
            }`}
          >
            <h3 className={`text-6xl md:text-7xl font-black tracking-tighter uppercase ${currentColor.text}`}>
              {currentWord.name}
            </h3>

            {/* Feedback Overlay */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className={`absolute inset-0 flex items-center justify-center backdrop-blur-[2px] z-20 ${
                    feedback === 'correct' ? 'bg-green-500/20' : 'bg-rose-500/20'
                  }`}
                >
                  {feedback === 'correct' ? (
                    <CheckCircle2 size={60} className="text-green-500 drop-shadow-lg" />
                  ) : (
                    <XCircle size={60} className="text-rose-500 drop-shadow-lg" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Color Buttons - Now Uniform Color */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-lg px-2">
        {shuffledColors.map((color) => (
          <button
            key={color.name}
            onClick={() => handleChoice(color.name)}
            disabled={gameState !== 'playing'}
            className={`h-16 rounded-xl shadow-lg transition-all active:scale-90 flex items-center justify-center group relative overflow-hidden ${
              difficultyMode === 'easy' 
                ? color.bg 
                : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
            } ${gameState !== 'playing' ? 'opacity-50 grayscale' : 'hover:scale-105'}`}
          >
            <span className={`font-black uppercase tracking-widest text-[10px] ${
              difficultyMode === 'easy' ? 'text-white drop-shadow-md' : isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {color.name}
            </span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {!isGauntlet && (
        <div className={`text-center font-bold text-xs uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
          {difficultyMode === 'mix-master' ? 'What color do they make?' : 'Match the ink color, not the word!'}
        </div>
      )}
    </div>
  );
}
