import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, Timer, Trophy, RotateCcw, Play, AlertCircle, ChevronRight, Sparkles, Search, Navigation, Zap, Users, UserPlus, X, Plus, MapPin } from 'lucide-react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import statesData from 'us-atlas/states-10m.json';

type GameState = 'setup' | 'transition' | 'playing' | 'question-result' | 'ended';
type GameMode = 'time' | 'distance';

interface StateData {
  id: string;
  name: string;
}

interface PlayerTap {
  playerId: number;
  name: string;
  coords: [number, number];
  distance: number;
  timedOut?: boolean;
}

interface PlayerResult {
  name: string;
  score: number; // For time mode
  totalDistance: number; // For distance mode
  taps: PlayerTap[];
}

const US_STATES: StateData[] = [
  { id: "01", name: "Alabama" }, { id: "02", name: "Alaska" }, { id: "04", name: "Arizona" },
  { id: "05", name: "Arkansas" }, { id: "06", name: "California" }, { id: "08", name: "Colorado" },
  { id: "09", name: "Connecticut" }, { id: "10", name: "Delaware" }, { id: "12", name: "Florida" },
  { id: "13", name: "Georgia" }, { id: "15", name: "Hawaii" }, { id: "16", name: "Idaho" },
  { id: "17", name: "Illinois" }, { id: "18", name: "Indiana" }, { id: "19", name: "Iowa" },
  { id: "20", name: "Kansas" }, { id: "21", name: "Kentucky" }, { id: "22", name: "Louisiana" },
  { id: "23", name: "Maine" }, { id: "24", name: "Maryland" }, { id: "25", name: "Massachusetts" },
  { id: "26", name: "Michigan" }, { id: "27", name: "Minnesota" }, { id: "28", name: "Mississippi" },
  { id: "29", name: "Missouri" }, { id: "30", name: "Montana" }, { id: "31", name: "Nebraska" },
  { id: "32", name: "Nevada" }, { id: "33", name: "New Hampshire" }, { id: "34", name: "New Jersey" },
  { id: "35", name: "New Mexico" }, { id: "36", name: "New York" }, { id: "37", name: "North Carolina" },
  { id: "38", name: "North Dakota" }, { id: "39", name: "Ohio" }, { id: "40", name: "Oklahoma" },
  { id: "41", name: "Oregon" }, { id: "42", name: "Pennsylvania" }, { id: "44", name: "Rhode Island" },
  { id: "45", name: "South Carolina" }, { id: "46", name: "South Dakota" }, { id: "47", name: "Tennessee" },
  { id: "48", name: "Texas" }, { id: "49", name: "Utah" }, { id: "50", name: "Vermont" },
  { id: "51", name: "Virginia" }, { id: "53", name: "Washington" }, { id: "54", name: "West Virginia" },
  { id: "55", name: "Wisconsin" }, { id: "56", name: "Wyoming" }
];

const PLAYER_COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Rose
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

const SMALL_STATES_IDS = ["09", "10", "24", "25", "33", "34", "44", "50"];

export default function GeoTrivia({ 
  isDarkMode, 
  initialPlayers,
  isGauntlet = false,
  gauntletMode = 'time',
  onGameEnd
}: { 
  isDarkMode: boolean; 
  initialPlayers: string[];
  isGauntlet?: boolean;
  gauntletMode?: GameMode;
  onGameEnd?: (score: number) => void;
}) {
  const [gameState, setGameState] = useState<GameState>(isGauntlet ? 'transition' : 'setup');
  const [gameMode, setGameMode] = useState<GameMode>(isGauntlet ? gauntletMode : 'time');
  const [duration, setDuration] = useState(isGauntlet && gauntletMode === 'time' ? 60 : 60);
  const [numQuestions, setNumQuestions] = useState(isGauntlet && gauntletMode === 'distance' ? 10 : 5);
  const [numPlayers, setNumPlayers] = useState(isGauntlet ? 1 : (initialPlayers.length > 0 ? initialPlayers.length : 1));
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    if (isGauntlet) return initialPlayers;
    if (initialPlayers.length > 0) return initialPlayers;
    return ['Player 1'];
  });
  
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  const [currentRoundTaps, setCurrentRoundTaps] = useState<PlayerTap[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(isGauntlet && gauntletMode === 'time' ? 60 : 60);
  const [duelTimeLeft, setDuelTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [targetState, setTargetState] = useState<StateData | null>(null);
  const [roundStates, setRoundStates] = useState<StateData[]>(() => {
    if (isGauntlet) {
      return [...US_STATES].sort(() => Math.random() - 0.5);
    }
    return [];
  });
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'distance', id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const processingTapRef = useRef(false);
  const hasTriggeredEnd = useRef(false);

  const projection = d3.geoAlbersUsa().scale(1000).translate([480, 300]);
  const pathGenerator = d3.geoPath().projection(projection);

  const statesGeo = useMemo(() => {
    return (topojson.feature(statesData as any, statesData.objects.states as any) as any).features;
  }, []);

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Handle game end for gauntlet
  useEffect(() => {
    if (isGauntlet && gameState === 'ended' && onGameEnd && !hasTriggeredEnd.current) {
      hasTriggeredEnd.current = true;
      const finalScore = gameMode === 'time' ? score : playerResults[0]?.totalDistance || 0;
      onGameEnd(finalScore);
    }
    if (gameState !== 'ended') {
      hasTriggeredEnd.current = false;
    }
  }, [isGauntlet, gameState, onGameEnd, gameMode, score, playerResults]);

  // Initialize gauntlet results
  useEffect(() => {
    if (isGauntlet && playerResults.length === 0) {
      setPlayerResults([{
        name: playerNames[0] || 'Player 1',
        score: 0,
        totalDistance: 0,
        taps: []
      }]);
    }
  }, [isGauntlet, playerResults.length, playerNames]);

  const generateRoundStates = () => {
    const shuffled = [...US_STATES].sort(() => Math.random() - 0.5);
    setRoundStates(shuffled);
  };

  const startNewGame = () => {
    generateRoundStates();
    const initialResults: PlayerResult[] = [];
    for (let i = 0; i < numPlayers; i++) {
      initialResults.push({
        name: playerNames[i] || `Player ${i + 1}`,
        score: 0,
        totalDistance: 0,
        taps: []
      });
    }
    setPlayerResults(initialResults);
    setCurrentPlayerIndex(0);
    setCurrentQuestionIndex(0);
    setCurrentRoundTaps([]);
    setGameState('transition');
  };

  const startTurn = () => {
    setTargetState(roundStates[currentQuestionIndex % roundStates.length]);
    setGameState('playing');
    setLastDistance(null);
    setFeedback(null);
    processingTapRef.current = false;
    
    if (gameMode === 'time') {
      setScore(0);
      setTimeLeft(duration);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            endTurn();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameMode === 'distance') {
      setDuelTimeLeft(10);
      timerRef.current = setInterval(() => {
        setDuelTimeLeft(prev => {
          if (prev <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Separate effect to handle Distance Duel timeout
  useEffect(() => {
    if (gameMode === 'distance' && gameState === 'playing' && duelTimeLeft === 0 && !processingTapRef.current) {
      handleDistancePenalty();
    }
  }, [duelTimeLeft, gameMode, gameState]);

  const handleDistancePenalty = () => {
    if (gameState !== 'playing' || !targetState || feedback || processingTapRef.current) return;
    
    processingTapRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const distanceInKm = 4000;
    const tapCoords: [number, number] = [0, 0]; 
    
    const tap: PlayerTap = {
      playerId: currentPlayerIndex,
      name: playerNames[currentPlayerIndex],
      coords: tapCoords,
      distance: distanceInKm,
      timedOut: true
    };

    setLastDistance(4000);
    setFeedback({ type: 'distance' });
    setCurrentRoundTaps(prev => [...prev, tap]);

    setPlayerResults(prev => {
      const next = [...prev];
      if (next[currentPlayerIndex]) {
        next[currentPlayerIndex] = {
          ...next[currentPlayerIndex],
          totalDistance: next[currentPlayerIndex].totalDistance + distanceInKm,
          taps: [...next[currentPlayerIndex].taps, tap]
        };
      }
      return next;
    });

    setTimeout(() => {
      setFeedback(null);
      if (currentPlayerIndex + 1 < numPlayers) {
        setCurrentPlayerIndex(prev => prev + 1);
        setGameState('transition');
      } else {
        setGameState('question-result');
      }
    }, 1500); // Slightly longer for penalty feedback
  };

  const endTurn = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setGameState(currentGameState => {
      if (currentGameState !== 'playing') return currentGameState;
      
      if (gameMode === 'time') {
        if (currentPlayerIndex + 1 < numPlayers) {
          setCurrentPlayerIndex(prev => prev + 1);
          setCurrentQuestionIndex(0);
          return 'transition';
        } else {
          return 'ended';
        }
      }
      return currentGameState;
    });
  };

  const calculateDistance = (event: React.MouseEvent<SVGSVGElement>) => {
    // Prevent double clicking while feedback is showing or processing
    if (gameState !== 'playing' || !targetState || !svgRef.current || feedback || processingTapRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    processingTapRef.current = true;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const tapCoords = projection.invert!([svgP.x, svgP.y]);
    if (!tapCoords) return;

    const targetFeature = statesGeo.find((f: any) => f.id === targetState.id);
    if (!targetFeature) return;

    const targetCentroid = d3.geoCentroid(targetFeature);
    const distanceInKm = d3.geoDistance(tapCoords, targetCentroid) * 6371;

    const tap: PlayerTap = {
      playerId: currentPlayerIndex,
      name: playerNames[currentPlayerIndex],
      coords: tapCoords,
      distance: distanceInKm
    };

    setLastDistance(Math.round(distanceInKm));
    setFeedback({ type: 'distance' });
    setCurrentRoundTaps(prev => [...prev, tap]);

    // Update player's total results
    setPlayerResults(prev => {
      const next = [...prev];
      if (next[currentPlayerIndex]) {
        next[currentPlayerIndex] = {
          ...next[currentPlayerIndex],
          totalDistance: next[currentPlayerIndex].totalDistance + distanceInKm,
          taps: [...next[currentPlayerIndex].taps, tap]
        };
      }
      return next;
    });

    setTimeout(() => {
      setFeedback(null);
      
      if (currentPlayerIndex + 1 < numPlayers) {
        // Next player for the SAME question
        setCurrentPlayerIndex(prev => prev + 1);
        setGameState('transition');
      } else {
        // All players have tapped for this question, show results
        setGameState('question-result');
      }
    }, 1000);
  };

  const nextQuestion = () => {
    processingTapRef.current = false;
    if (currentQuestionIndex + 1 >= numQuestions) {
      setGameState('ended');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentPlayerIndex(0);
      setCurrentRoundTaps([]);
      setGameState('transition');
    }
  };

  const handleStateClick = (stateId: string, event: React.MouseEvent) => {
    if (gameMode === 'distance') return; // Let it bubble to SVG
    
    event.stopPropagation();
    if (gameState !== 'playing' || !targetState || feedback) return;

    if (stateId === targetState.id) {
      setScore(prev => prev + 1);
      setFeedback({ type: 'correct', id: stateId });
      setTimeout(() => {
        setFeedback(null);
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setTargetState(roundStates[nextIdx % roundStates.length]);
      }, 400);
    } else {
      setTimeLeft(prev => Math.max(0, prev - 3));
      setFeedback({ type: 'wrong', id: stateId });
      setTimeout(() => {
        setFeedback(null);
        if (gameMode === 'time') {
          const nextIdx = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIdx);
          setTargetState(roundStates[nextIdx % roundStates.length]);
        }
      }, 400);
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

  const handleNameChange = (idx: number, name: string) => {
    setPlayerNames(prev => {
      const next = [...prev];
      next[idx] = name;
      return next;
    });
  };

  useEffect(() => {
    if (gameMode === 'time' && gameState === 'playing') {
      setPlayerResults(prev => {
        const next = [...prev];
        if (next[currentPlayerIndex] && next[currentPlayerIndex].score !== score) {
          next[currentPlayerIndex] = { ...next[currentPlayerIndex], score };
          return next;
        }
        return prev;
      });
    }
  }, [score, currentPlayerIndex, gameMode, gameState]);

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
          <div className={`inline-flex p-4 rounded-3xl mb-4 border transition-colors duration-300 ${isDarkMode ? 'bg-indigo-900/30 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
            <MapIcon size={48} />
          </div>
          <h2 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>GeoTrivia</h2>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>How well do you know the US map?</p>
        </div>
        
        <div className={`rounded-2xl p-4 border transition-colors duration-300 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className={`flex items-center justify-center space-x-2 font-bold mb-2 text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            <Sparkles size={16} />
            <span>How to Play</span>
          </div>
          <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-700/70'}`}>
            {gameMode === 'time' ? (
              <>
                1. Find as many states as you can.<br/>
                2. Tap the correct state on the blank map.<br/>
                3. Correct = +1 Point. Wrong = <span className="text-rose-500 font-bold">-3 Seconds</span>.<br/>
                4. Multi-player: Everyone gets the same sequence of states!
              </>
            ) : (
              <>
                1. Find {numQuestions} specific states.<br/>
                2. Tap where you think the center of the state is.<br/>
                3. <span className="text-indigo-500 font-bold">Pass the phone</span> after each tap.<br/>
                4. See everyone's pins after each question!
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="w-full max-w-md space-y-6">
        <div className={`rounded-3xl shadow-2xl p-8 space-y-8 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 shadow-black/50 border-slate-800' : 'bg-white shadow-indigo-100 border-slate-100'}`}>
          <div className="space-y-4">
            <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <Zap size={18} className="text-indigo-400" />
              <span>Game Mode</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGameMode('time')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                  gameMode === 'time' 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-400'
                }`}
              >
                Time Challenge
              </button>
              <button
                onClick={() => setGameMode('distance')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                  gameMode === 'distance' 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-400'
                }`}
              >
                Distance Duel
              </button>
            </div>
          </div>

          {gameMode === 'time' ? (
            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Timer size={18} className="text-indigo-400" />
                <span>Game Duration</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDuration(t)}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                      duration === t 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-400'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Navigation size={18} className="text-indigo-400" />
                <span>Number of Questions</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumQuestions(n)}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                      numQuestions === n 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-400'
                    }`}
                  >
                    {n} Qs
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <Users size={18} className="text-indigo-400" />
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
              <Users size={18} className="text-indigo-400" />
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
                      ? 'bg-slate-800 text-slate-100 focus:border-indigo-500 focus:bg-slate-700 placeholder:text-slate-500' 
                      : 'bg-gray-50 text-gray-900 focus:border-indigo-500 focus:bg-white placeholder:text-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={startNewGame}
            disabled={isLoading}
            className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 active:scale-95 flex items-center justify-center space-x-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                <span>Start Challenge</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderTransition = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 p-6 text-center"
    >
      <div className="space-y-4">
        <div 
          className={`inline-flex p-6 rounded-[2.5rem] mb-4 border-4 transition-all duration-500`}
          style={{ backgroundColor: `${PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length]}20`, borderColor: PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length], color: PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length] }}
        >
          <Users size={64} />
        </div>
        <p className={`text-xl font-bold uppercase tracking-widest`} style={{ color: PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length] }}>
          {gameMode === 'distance' ? `Question ${currentQuestionIndex + 1}` : 'Next Up'}
        </p>
        <h2 className={`text-5xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
          {playerNames[currentPlayerIndex]}
        </h2>
        <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Pass the phone and get ready!
        </p>
      </div>

      <button
        onClick={startTurn}
        className="w-full max-w-xs py-4 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 flex items-center justify-center space-x-2"
        style={{ backgroundColor: PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length] }}
      >
        <Play size={24} fill="currentColor" />
        <span>I'm Ready</span>
      </button>
    </motion.div>
  );

  const renderPlaying = () => (
    <div className="flex flex-col items-center justify-start min-h-[80vh] p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* HUD */}
      <div className="w-full max-w-6xl flex justify-between items-center px-2 sm:px-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {gameMode === 'time' ? (
            <>
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Score</p>
                <p className={`text-xl sm:text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{score}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-colors ${timeLeft < 10 ? 'bg-rose-500/10 border-rose-500/30' : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${timeLeft < 10 ? 'text-rose-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Time</p>
                <p className={`text-xl sm:text-2xl font-black ${timeLeft < 10 ? 'text-rose-500' : isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{timeLeft}s</p>
              </div>
            </>
          ) : (
            <>
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Question</p>
                <p className={`text-xl sm:text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{currentQuestionIndex + 1}/{numQuestions}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-colors ${duelTimeLeft < 4 ? 'bg-rose-500/10 border-rose-500/30' : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${duelTimeLeft < 4 ? 'text-rose-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Timer</p>
                <p className={`text-xl sm:text-2xl font-black ${duelTimeLeft < 4 ? 'text-rose-500' : isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{duelTimeLeft}s</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Player</p>
                <p className={`text-xl sm:text-2xl font-black`} style={{ color: PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length] }}>
                  {currentPlayerIndex + 1}/{numPlayers}
                </p>
              </div>
            </>
          )}
        </div>
        
        <div className="text-right">
          <p className={`text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5 sm:mb-1`}>
            {(playerNames[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`)}'s Turn
          </p>
          <motion.h3 
            key={targetState?.id}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}
          >
            {targetState?.name}
          </motion.h3>
        </div>
      </div>

      {/* Orientation Hint */}
      {isPortrait && (
        <div className="sm:hidden bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-full flex items-center space-x-2 animate-pulse">
          <RotateCcw size={14} className="text-indigo-400" />
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Rotate for a bigger map</span>
        </div>
      )}

      {/* Map Container */}
      <div className={`relative w-full max-w-6xl aspect-[1.6] rounded-2xl sm:rounded-[2.5rem] border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
        <svg 
          ref={svgRef}
          viewBox="0 0 960 600" 
          className="w-full h-full touch-none"
          onClick={(e) => gameMode === 'distance' && calculateDistance(e)}
        >
          <g>
            {statesGeo.map((feature: any) => {
              const id = feature.id;
              const isFeedback = feedback?.id === id;
              const isCorrect = isFeedback && feedback?.type === 'correct';
              const isWrong = isFeedback && feedback?.type === 'wrong';

              return (
                <g key={id} className="group">
                  {/* Hit Area for small states */}
                  <path
                    d={pathGenerator(feature) || ""}
                    onClick={(e) => handleStateClick(id, e)}
                    className="fill-transparent stroke-transparent stroke-[12] cursor-pointer"
                  />
                  {/* Visual Path */}
                  <path
                    d={pathGenerator(feature) || ""}
                    onClick={(e) => handleStateClick(id, e)}
                    className={`transition-all duration-200 cursor-pointer stroke-[0.5] pointer-events-none group-hover:pointer-events-auto ${
                      isCorrect ? 'fill-green-500 stroke-green-600' :
                      isWrong ? 'fill-rose-500 stroke-rose-600' :
                      isDarkMode 
                        ? 'fill-slate-800 stroke-slate-700 group-hover:fill-slate-700' 
                        : 'fill-white stroke-slate-300 group-hover:fill-slate-100'
                    }`}
                  />
                </g>
              );
            })}

            {/* Forgiving Hitbox for small states cluster */}
            {gameMode === 'time' && targetState && SMALL_STATES_IDS.includes(targetState.id) && (
              <rect
                x="820" y="50" width="140" height="250"
                fill="transparent"
                className="cursor-pointer"
                onClick={(e) => {
                  if (gameState !== 'playing' || !targetState || feedback) return;
                  e.stopPropagation();
                  handleStateClick(targetState.id, e);
                }}
              />
            )}
          </g>
        </svg>

        {/* Feedback Overlays */}
        <AnimatePresence>
          {feedback?.type === 'wrong' && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="bg-rose-500 text-white px-6 py-3 rounded-full font-black text-2xl shadow-2xl flex items-center space-x-2">
                <AlertCircle size={24} />
                <span>-3s</span>
              </div>
            </motion.div>
          )}
          {feedback?.type === 'distance' && lastDistance !== null && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className={`${currentRoundTaps[currentRoundTaps.length - 1]?.timedOut ? 'bg-rose-600' : 'bg-indigo-600'} text-white px-6 py-3 rounded-full font-black text-2xl shadow-2xl flex items-center space-x-2`}>
                {currentRoundTaps[currentRoundTaps.length - 1]?.timedOut ? <AlertCircle size={24} /> : <Navigation size={24} />}
                <span>{currentRoundTaps[currentRoundTaps.length - 1]?.timedOut ? 'Timed Out! ' : ''}{lastDistance} km</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderQuestionResult = () => {
    const targetFeature = statesGeo.find((f: any) => f.id === targetState?.id);
    const targetCentroid = targetFeature ? d3.geoCentroid(targetFeature) : [0, 0];
    const [targetX, targetY] = projection(targetCentroid as [number, number]) || [0, 0];

    return (
      <div className="flex flex-col items-center justify-start min-h-[80vh] p-4 space-y-6">
        <div className="w-full max-w-4xl flex justify-between items-end px-4">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Question Results</p>
            <h3 className={`text-4xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{targetState?.name}</h3>
          </div>
          <button
            onClick={nextQuestion}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-500 flex items-center space-x-2"
          >
            <span>Next Question</span>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className={`relative w-full max-w-4xl aspect-[1.6] rounded-[2.5rem] border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <svg viewBox="0 0 960 600" className="w-full h-full">
            <g>
              {statesGeo.map((feature: any) => (
                <path
                  key={feature.id}
                  d={pathGenerator(feature) || ""}
                  className={`${feature.id === targetState?.id ? 'fill-indigo-500/20 stroke-indigo-500 stroke-2' : isDarkMode ? 'fill-slate-800 stroke-slate-700' : 'fill-white stroke-slate-200'}`}
                />
              ))}
            </g>
            
            {/* Target Center */}
            <circle cx={targetX} cy={targetY} r={6} fill="#ef4444" className="animate-pulse" />
            
            {/* Player Taps */}
            {currentRoundTaps.map((tap, i) => {
              const [x, y] = projection(tap.coords) || [0, 0];
              if (tap.timedOut) {
                return (
                  <g key={i}>
                    <text x={480} y={300 + (i * 20)} textAnchor="middle" className="text-[14px] font-black" fill={PLAYER_COLORS[tap.playerId % PLAYER_COLORS.length]}>
                      {tap.name} TIMED OUT (+4000km)
                    </text>
                  </g>
                );
              }
              return (
                <g key={i}>
                  <line x1={x} y1={y} x2={targetX} y2={targetY} stroke={PLAYER_COLORS[tap.playerId % PLAYER_COLORS.length]} strokeWidth={2} strokeDasharray="4 4" opacity={0.6} />
                  <circle cx={x} cy={y} r={8} fill={PLAYER_COLORS[tap.playerId % PLAYER_COLORS.length]} stroke="white" strokeWidth={2} />
                  <text x={x} y={y - 15} textAnchor="middle" className="text-[10px] font-black" fill={PLAYER_COLORS[tap.playerId % PLAYER_COLORS.length]}>
                    {tap.name} ({Math.round(tap.distance)}km)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl">
          {currentRoundTaps.sort((a, b) => a.distance - b.distance).map((tap, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} ${tap.timedOut ? 'border-rose-500/50' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAYER_COLORS[tap.playerId % PLAYER_COLORS.length] }} />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">{tap.name}</span>
                </div>
                {tap.timedOut && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Timed Out</span>}
              </div>
              <p className={`text-xl font-black ${tap.timedOut ? 'text-rose-500' : ''}`}>{Math.round(tap.distance)} km</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnded = () => {
    const sortedResults = [...playerResults].sort((a, b) => {
      if (gameMode === 'time') return b.score - a.score;
      return a.totalDistance - b.totalDistance;
    });

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
          <p className={`text-xl font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {numPlayers > 1 && sortedResults.length > 0 ? (
              <><span className="text-indigo-400">{sortedResults[0]?.name || 'Player'}</span> Wins!</>
            ) : (
              <>Challenge Complete!</>
            )}
          </p>
        </div>

        <div className={`w-full max-w-sm p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className="space-y-4 mb-8">
            {sortedResults.map((res, i) => {
              if (!res) return null;
              return (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${i === 0 ? 'bg-indigo-500/10 border-indigo-500/30' : isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center space-x-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${i === 0 ? 'bg-yellow-500 text-white' : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <span className={`font-bold ${i === 0 ? (isDarkMode ? 'text-slate-50' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-600')}`}>
                      {res.name}
                    </span>
                  </div>
                  <span className="font-black text-indigo-500">
                    {gameMode === 'time' ? `${res.score || 0} pts` : `${Math.round(res.totalDistance || 0)} km`}
                  </span>
                </div>
              );
            })}
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
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 shadow-lg active:scale-95 flex items-center justify-center space-x-2"
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
        {gameState === 'transition' && renderTransition()}
        {gameState === 'playing' && renderPlaying()}
        {gameState === 'question-result' && renderQuestionResult()}
        {gameState === 'ended' && renderEnded()}
      </AnimatePresence>
    </div>
  );
}
