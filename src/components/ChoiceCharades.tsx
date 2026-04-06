import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Timer, Play, RotateCcw, ArrowLeft, Trophy, Sparkles, Zap, SkipForward, CheckCircle2, Share2 } from 'lucide-react';
import ShareButton from './ShareButton';

interface HistoryEntry {
  words: { easy: string; medium: string; hard: string };
  outcome: { type: 'guessed'; difficulty: 'easy' | 'medium' | 'hard' } | { type: 'skipped' } | { type: 'timeout' };
}

interface Team {
  id: number;
  name: string;
  score: number;
  players: string[];
  clueGiverIndex: number;
  history: HistoryEntry[];
}

const EASY_WORDS = [
  "Cat", "Dog", "Apple", "Book", "Tree", "Run", "Jump", "Sleep", "Eat", "Bird", 
  "Fish", "Sun", "Moon", "Ball", "Car", "Hat", "Milk", "Smile", "Cry", "Dance",
  "Lion", "Monkey", "Elephant", "Snake", "Rabbit", "Kangaroo", "Butterfly", "Shark", "Chicken", "Pig",
  "Cow", "Horse", "Duck", "Frog", "Spider", "Bee", "Bear", "Penguin", "Giraffe", "Zebra",
  "Turtle", "Umbrella", "Scissors", "Hammer", "Telephone", "Toothbrush", "Glasses", "Spoon", "Pillow", "Key",
  "Watch", "Chair", "Table", "Cup", "Pen", "Shoe", "Bed", "Flower", "Star", "Cloud",
  "Rain", "Snow", "Walk", "Sit", "Stand", "Wave", "Clap", "Kick", "Throw", "Catch",
  "Drink", "Read", "Write", "Draw", "Sing", "Swim", "Fly", "Drive", "Brush", "Wash",
  "Open", "Close", "Push", "Pull", "Climb", "Banana", "Orange", "Pizza", "Ice Cream", "Bicycle",
  "Airplane", "Boat", "Train", "Bus", "House", "Window", "Door", "Baby", "Doctor", "Fireman"
];

const MEDIUM_WORDS = [
  "Astronaut", "Microwave", "Surfing", "Dentist", "Library", "Elephant", "Bicycle", "Painting", "Cooking", "Doctor",
  "Fireman", "Keyboard", "Mountain", "Rainbow", "Spider", "Camera", "Guitar", "Pizza", "Robot", "Soccer",
  "Chef", "Pilot", "Ballerina", "Magician", "Soldier", "Detective", "Lifeguard", "Plumber", "Scientist", "Waiter",
  "Teacher", "Artist", "Musician", "Athlete", "Farmer", "Judge", "Roller coaster", "Campfire", "Waterfall", "Statue of Liberty",
  "Eiffel Tower", "Popcorn", "Skateboard", "Telescope", "Microscope", "Compass", "Airport", "Beach", "Forest", "Desert",
  "Island", "Castle", "Museum", "Cinema", "Stadium", "Gardening", "Yoga", "Bowling", "Knitting", "Chess",
  "Fishing", "Camping", "Hiking", "Skiing", "Skating", "Shopping", "Traveling", "Juggling", "Magic", "Origami",
  "Photography", "Sculpting", "Weaving", "Pottery", "Woodworking", "Metalworking", "Glassblowing", "Brewing", "Baking", "Grilling",
  "Scuba Diving", "Skydiving", "Bungee Jumping", "Rock Climbing", "Horseback Riding", "Sailing", "Kayaking", "Canoeing", "Snorkeling", "Archery",
  "Fencing", "Karate", "Boxing", "Wrestling", "Gymnastics", "Cheerleading", "Ballet", "Tap Dance", "Hip Hop", "Jazz Dance"
];

const HARD_WORDS = [
  "Gravity", "Procrastination", "Inception", "Deja Vu", "Sarcasm", "Evolution", "Symphony", "Philosophy", "Metamorphosis", "Quarantine",
  "Architecture", "Hypnosis", "Nostalgia", "Paradox", "Subconscious", "Tsunami", "Labyrinth", "Origami", "Hologram", "Zenith",
  "Freedom", "Justice", "Friendship", "Bravery", "Jealousy", "Curiosity", "Wisdom", "Patience", "Honesty", "Loyalty",
  "Ambition", "Courage", "Determination", "Empathy", "Forgiveness", "Gratitude", "Humility", "Integrity", "Kindness", "Optimism",
  "Perseverance", "Resilience", "DNA", "Black hole", "Northern Lights", "Time travel", "Parallel universe", "Virtual reality", "Artificial intelligence", "Global warming",
  "Solar eclipse", "Lunar landing", "Big Bang", "Dark matter", "Quantum physics", "String theory", "Chaos theory", "Game theory", "Fibonacci sequence", "Golden ratio",
  "Turing test", "Schrodinger's cat", "Piece of cake", "Under the weather", "Break a leg", "Once in a blue moon", "Spill the beans", "Cost an arm and a leg", "Let the cat out of the bag", "Hit the nail on the head",
  "Bite the bullet", "Burn the midnight oil", "Cry over spilled milk", "Don't judge a book by its cover", "Every cloud has a silver lining", "Haste makes waste", "It's raining cats and dogs", "Kill two birds with one stone", "Let sleeping dogs lie", "Practice makes perfect",
  "The early bird catches the worm", "When pigs fly", "Back to the drawing board", "Beat around the bush", "Best of both worlds", "Bite off more than you can chew", "Blessing in disguise", "Burn bridges", "By the skin of your teeth", "Caught between a rock and a hard place",
  "Cut corners", "Cutting edge", "Devil's advocate", "Down to earth", "Elephant in the room", "Fit as a fiddle", "Go the extra mile", "In the heat of the moment", "Keep your chin up", "Last resort"
];

export default function ChoiceCharades({ isDarkMode = true, initialPlayers = [] }: { isDarkMode?: boolean, initialPlayers?: string[] }) {
  const [gameState, setGameState] = useState<'setup' | 'ready' | 'playing' | 'round-over' | 'game-over'>('setup');
  const [numTeams, setNumTeams] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(initialPlayers.length > 3 ? Math.ceil(initialPlayers.length / 2) : 2);
  const [turnTime, setTurnTime] = useState(60);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWords, setCurrentWords] = useState<{ easy: string, medium: string, hard: string }>({ easy: "", medium: "", hard: "" });
  const [skipCooldown, setSkipCooldown] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [setupTeamNames, setSetupTeamNames] = useState<string[]>(['Team 1', 'Team 2']);
  const [setupPlayerNames, setSetupPlayerNames] = useState<string[][]>(() => {
    if (initialPlayers.length > 0) {
      const pPerTeam = Math.ceil(initialPlayers.length / 2);
      const team1 = initialPlayers.slice(0, pPerTeam);
      const team2 = initialPlayers.slice(pPerTeam);
      while (team1.length < 2) team1.push(`Player ${team1.length + 1}`);
      while (team2.length < 2) team2.push(`Player ${team2.length + 1}`);
      return [team1, team2];
    }
    return [['Player 1', 'Player 2'], ['Player 1', 'Player 2']];
  });
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [maxRounds, setMaxRounds] = useState(2); // Each player gets to be clue giver twice
  const [currentTurnHistory, setCurrentTurnHistory] = useState<HistoryEntry[]>([]);
  const [selectedTeamIdx, setSelectedTeamIdx] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingRef = useRef(false);
  const currentWordsRef = useRef(currentWords);
  const currentTeamIndexRef = useRef(currentTeamIndex);

  useEffect(() => {
    currentWordsRef.current = currentWords;
  }, [currentWords]);

  useEffect(() => {
    currentTeamIndexRef.current = currentTeamIndex;
  }, [currentTeamIndex]);

  const updateNumTeams = (val: number) => {
    const newCount = Math.max(2, val);
    setNumTeams(newCount);
    setSetupTeamNames(prev => {
      const next = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) next.push(`Team ${i + 1}`);
      } else return next.slice(0, newCount);
      return next;
    });
    setSetupPlayerNames(prev => {
      const next = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) next.push(Array.from({ length: playersPerTeam }, (_, j) => `Player ${j + 1}`));
      } else return next.slice(0, newCount);
      return next;
    });
  };

  const updatePlayersPerTeam = (val: number) => {
    const newCount = Math.max(2, val);
    setPlayersPerTeam(newCount);
    setSetupPlayerNames(prev => prev.map(teamPlayers => {
      const next = [...teamPlayers];
      if (newCount > teamPlayers.length) {
        for (let i = teamPlayers.length; i < newCount; i++) next.push(`Player ${i + 1}`);
      } else return next.slice(0, newCount);
      return next;
    }));
  };

  const randomizePlayers = () => {
    const allPlayers = setupPlayerNames.flat();
    for (let i = allPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPlayers[i], allPlayers[j]] = [allPlayers[j], allPlayers[i]];
    }
    const newSetupPlayerNames: string[][] = [];
    for (let i = 0; i < numTeams; i++) {
      newSetupPlayerNames.push(allPlayers.slice(i * playersPerTeam, (i + 1) * playersPerTeam));
    }
    setSetupPlayerNames(newSetupPlayerNames);
  };

  const generateWords = () => {
    const newWords = {
      easy: EASY_WORDS[Math.floor(Math.random() * EASY_WORDS.length)],
      medium: MEDIUM_WORDS[Math.floor(Math.random() * MEDIUM_WORDS.length)],
      hard: HARD_WORDS[Math.floor(Math.random() * HARD_WORDS.length)]
    };
    setCurrentWords(newWords);
    return newWords;
  };

  const setupGame = () => {
    const initialTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
      id: i + 1,
      name: setupTeamNames[i] || `Team ${i + 1}`,
      score: 0,
      players: setupPlayerNames[i].map((name, j) => name || `Player ${j + 1}`),
      clueGiverIndex: 0,
      history: []
    }));
    setTeams(initialTeams);
    setCurrentTeamIndex(0);
    setRoundsPlayed(0);
    setGameState('ready');
  };

  const startTurn = () => {
    generateWords();
    setTimeLeft(turnTime);
    setSkipCooldown(0);
    setCurrentTurnHistory([]);
    isEndingRef.current = false;
    setGameState('playing');
  };

  const handleScore = (difficulty: 'easy' | 'medium' | 'hard', points: number) => {
    if (gameState !== 'playing' || timeLeft <= 0 || isEndingRef.current) return;
    const entry: HistoryEntry = {
      words: { ...currentWordsRef.current },
      outcome: { type: 'guessed', difficulty }
    };
    
    setCurrentTurnHistory(prev => [...prev, entry]);
    setTeams(prevTeams => prevTeams.map((team, idx) => 
      idx === currentTeamIndexRef.current ? { 
        ...team, 
        score: team.score + points,
        history: [...team.history, entry]
      } : team
    ));
    
    generateWords();
  };

  const handleSkip = () => {
    if (gameState !== 'playing' || timeLeft <= 0 || isEndingRef.current || skipCooldown > 0) return;
    
    const entry: HistoryEntry = {
      words: { ...currentWordsRef.current },
      outcome: { type: 'skipped' }
    };
    
    setCurrentTurnHistory(prev => [...prev, entry]);
    setTeams(prevTeams => prevTeams.map((team, idx) => 
      idx === currentTeamIndexRef.current ? { 
        ...team, 
        history: [...team.history, entry]
      } : team
    ));

    setSkipCooldown(3);
    generateWords();
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.1) {
            clearInterval(timerRef.current!);
            if (!isEndingRef.current) {
              isEndingRef.current = true;
              
              // Record final word as timeout
              const entry: HistoryEntry = {
                words: { ...currentWordsRef.current },
                outcome: { type: 'timeout' }
              };
              
              setCurrentTurnHistory(prevHistory => [...prevHistory, entry]);
              setTeams(prevTeams => prevTeams.map((team, idx) => 
                idx === currentTeamIndexRef.current ? { 
                  ...team, 
                  history: [...team.history, entry]
                } : team
              ));
              
              endTurn();
            }
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (skipCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setSkipCooldown(prev => {
          if (prev <= 0.1) {
            clearInterval(cooldownRef.current!);
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(cooldownRef.current!);
  }, [skipCooldown]);

  const endTurn = () => {
    // Rotate clue giver for the current team
    setTeams(prevTeams => prevTeams.map((team, idx) => 
      idx === currentTeamIndex 
        ? { 
            ...team, 
            clueGiverIndex: (team.clueGiverIndex + 1) % team.players.length 
          } 
        : team
    ));

    const nextTeamIndex = (currentTeamIndex + 1) % numTeams;
    if (nextTeamIndex === 0) {
      const nextRounds = roundsPlayed + 1;
      setRoundsPlayed(nextRounds);
      if (nextRounds >= maxRounds) {
        setGameState('game-over');
      } else {
        setCurrentTeamIndex(nextTeamIndex);
        setGameState('round-over');
      }
    } else {
      setCurrentTeamIndex(nextTeamIndex);
      setGameState('round-over');
    }
  };

  const HistoryList = ({ history, title }: { history: HistoryEntry[], title?: string }) => (
    <div className="space-y-4 w-full max-w-md">
      {title && <h3 className={`text-center font-bold uppercase tracking-widest text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{title}</h3>}
      <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {history.length === 0 ? (
          <p className={`text-center text-sm italic ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No words attempted</p>
        ) : (
          history.map((entry, idx) => (
            <div key={idx} className={`p-3 rounded-2xl border shadow-sm flex flex-col space-y-2 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map(diff => {
                  const isGuessed = entry.outcome.type === 'guessed' && entry.outcome.difficulty === diff;
                  const word = entry.words?.[diff] || '---';
                  return (
                    <div key={diff} className={`text-center p-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      isGuessed 
                        ? 'bg-green-500 text-white border-green-500' 
                        : isDarkMode ? 'bg-slate-900 text-slate-500 border-slate-700' : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                      {word}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center px-1">
                <span className={`text-[10px] font-black uppercase tracking-tighter ${
                  entry.outcome.type === 'guessed' ? 'text-green-500' : 
                  entry.outcome.type === 'skipped' ? 'text-amber-500' : isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  {entry.outcome.type === 'guessed' ? `Guessed ${entry.outcome.difficulty}` : entry.outcome.type}
                </span>
                {entry.outcome.type === 'guessed' && (
                  <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    +{entry.outcome.difficulty === 'easy' ? 1 : entry.outcome.difficulty === 'medium' ? 2 : 3}pts
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (gameState === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="space-y-2">
            <h2 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Choice Charades</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Fast-paced acting. Choose your difficulty!</p>
          </div>

          <div className={`rounded-2xl p-4 border transition-colors duration-300 ${isDarkMode ? 'bg-rose-900/20 border-rose-800/30' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`flex items-center justify-center space-x-2 font-bold mb-2 text-sm ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
              <Sparkles size={16} />
              <span>How to Play</span>
            </div>
            <div className={`text-xs leading-relaxed text-center ${isDarkMode ? 'text-rose-300/70' : 'text-rose-700/70'}`}>
              1. One player acts out words for their team.<br/>
              2. Three words are shown: Easy (1pt), Medium (2pts), Hard (3pts).<br/>
              3. Score by tapping the word your team guesses correctly.<br/>
              4. Skip words if you're stuck (3s cooldown).<br/>
              5. Score as many points as possible before time runs out!
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-md space-y-6">
          <div className={`rounded-3xl shadow-2xl p-8 space-y-8 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 shadow-black/50 border-slate-800' : 'bg-white shadow-rose-100 border-gray-100'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Users size={18} className="text-rose-400" />
                  <span>Teams</span>
                </label>
                <div className={`flex items-center justify-between p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <button 
                    onClick={() => updateNumTeams(numTeams - 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                  >
                    -
                  </button>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{numTeams}</span>
                  <button 
                    onClick={() => updateNumTeams(numTeams + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Users size={18} className="text-rose-400" />
                  <span>Players/Team</span>
                </label>
                <div className={`flex items-center justify-between p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <button 
                    onClick={() => updatePlayersPerTeam(playersPerTeam - 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                  >
                    -
                  </button>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{playersPerTeam}</span>
                  <button 
                    onClick={() => updatePlayersPerTeam(playersPerTeam + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Users size={18} className="text-rose-400" />
                  <span>Customization</span>
                </label>
                <button 
                  onClick={randomizePlayers}
                  className={`text-xs font-bold flex items-center space-x-1 transition-colors ${isDarkMode ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-700'}`}
                >
                  <RotateCcw size={12} />
                  <span>Randomize</span>
                </button>
              </div>
              <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {setupTeamNames.map((name, tIdx) => (
                  <div key={tIdx} className={`p-4 rounded-2xl space-y-2 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => {
                        const next = [...setupTeamNames]; next[tIdx] = e.target.value; setSetupTeamNames(next);
                      }} 
                      className={`w-full bg-transparent font-bold outline-none border-b border-transparent focus:border-rose-500 transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`} 
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {setupPlayerNames[tIdx].map((pName, pIdx) => (
                        <input 
                          key={pIdx} 
                          type="text" 
                          value={pName} 
                          onChange={(e) => {
                            const next = [...setupPlayerNames]; next[tIdx] = [...next[tIdx]]; next[tIdx][pIdx] = e.target.value; setSetupPlayerNames(next);
                          }} 
                          className={`w-full p-1 rounded text-xs outline-none border border-transparent focus:border-rose-300 transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-white text-gray-500'}`} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Timer size={18} className="text-rose-400" />
                  <span>Turn Time</span>
                </label>
                <div className={`flex items-center justify-between p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <button 
                    onClick={() => setTurnTime(Math.max(10, turnTime - 5))} 
                    className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                  >
                    -
                  </button>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{turnTime}s</span>
                  <button 
                    onClick={() => setTurnTime(Math.min(120, turnTime + 5))} 
                    className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <RotateCcw size={18} className="text-rose-400" />
                  <span>Rounds</span>
                </label>
                <select 
                  value={maxRounds} 
                  onChange={(e) => setMaxRounds(parseInt(e.target.value))} 
                  className={`w-full p-2 rounded-xl font-bold outline-none transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-gray-50 text-gray-900 border-transparent'}`}
                >
                  <option value={1}>1 Round</option>
                  <option value={2}>2 Rounds</option>
                  <option value={3}>3 Rounds</option>
                </select>
              </div>
            </div>

            <button onClick={setupGame} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center space-x-2">
              <Play size={20} fill="currentColor" /><span>Start Game</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'ready' || gameState === 'round-over') {
    const prevTeamIndex = (currentTeamIndex - 1 + teams.length) % teams.length;
    const prevTeam = teams[prevTeamIndex];
    const currentTeam = teams[currentTeamIndex];
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <div className="text-center space-y-4 w-full max-w-md">
          <h2 className={`text-4xl font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{gameState === 'ready' ? 'Get Ready!' : 'Turn Over'}</h2>
          
          {gameState === 'round-over' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-green-900/20 border-green-800/30' : 'bg-green-50 border-green-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{prevTeam.name} scored</p>
                <p className={`text-3xl font-black ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{currentTurnHistory.filter(h => h.outcome.type === 'guessed').reduce((acc, h) => acc + (h.outcome.type === 'guessed' ? (h.outcome.difficulty === 'easy' ? 1 : h.outcome.difficulty === 'medium' ? 2 : 3) : 0), 0)} pts</p>
              </div>
              <HistoryList history={currentTurnHistory} title="Turn Summary" />
            </div>
          )}

          <div className={`p-8 rounded-3xl shadow-2xl border transition-colors duration-300 space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-rose-100'}`}>
            <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Next up: <span className="text-rose-500 font-bold">{currentTeam.name}</span></p>
            <div className={`p-4 rounded-2xl transition-colors ${isDarkMode ? 'bg-rose-900/20' : 'bg-rose-50'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>Clue Giver</p>
              <p className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{currentTeam.players[currentTeam.clueGiverIndex]}</p>
            </div>
            <button onClick={startTurn} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-900/20 hover:bg-rose-600 transition-all">Start Turn</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const currentTeam = teams[currentTeamIndex];
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <div className={`w-full max-w-md flex justify-between items-center p-4 rounded-2xl shadow-sm border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Team</span>
            <span className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{currentTeam.name}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Score</span>
            <span className="font-black text-rose-500 text-xl">{currentTeam.score}</span>
          </div>
        </div>

        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform">
            <circle cx="50%" cy="50%" r="45%" className={`fill-none ${isDarkMode ? 'stroke-slate-800' : 'stroke-gray-100'}`} strokeWidth="8" />
            <motion.circle cx="50%" cy="50%" r="45%" className="fill-none stroke-rose-500" strokeWidth="8" strokeDasharray="283%" animate={{ strokeDashoffset: `${283 - (283 * (timeLeft / turnTime))}%` }} transition={{ duration: 0.1, ease: "linear" }} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-black tabular-nums ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{Math.ceil(timeLeft)}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Seconds</span>
          </div>
        </div>

        <div className="w-full max-w-md space-y-4">
          {[
            { key: 'easy', label: 'Easy', pts: 1, color: 'bg-green-500', bg: isDarkMode ? 'bg-green-900/20' : 'bg-green-50', text: 'text-green-500' },
            { key: 'medium', label: 'Medium', pts: 2, color: 'bg-amber-500', bg: isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50', text: 'text-amber-500' },
            { key: 'hard', label: 'Hard', pts: 3, color: 'bg-rose-500', bg: isDarkMode ? 'bg-rose-900/20' : 'bg-rose-50', text: 'text-rose-500' }
          ].map((diff) => (
            <motion.div key={diff.key} whileTap={{ scale: 0.98 }} className={`flex items-center justify-between p-4 rounded-3xl border transition-colors duration-300 shadow-sm ${diff.bg} ${isDarkMode ? 'border-white/5' : 'border-white'}`}>
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${diff.text}`}>{diff.label} ({diff.pts}pt)</span>
                <span className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{currentWords[diff.key as keyof typeof currentWords]}</span>
              </div>
              <button onClick={() => handleScore(diff.key as any, diff.pts)} className={`${diff.color} text-white p-4 rounded-2xl shadow-lg shadow-black/20 active:scale-90 transition-all`}><CheckCircle2 size={24} /></button>
            </motion.div>
          ))}

          <button onClick={handleSkip} disabled={skipCooldown > 0} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all ${skipCooldown > 0 ? isDarkMode ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed' : isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            <SkipForward size={20} />
            <span>{skipCooldown > 0 ? `Skip (${Math.ceil(skipCooldown)}s)` : 'Skip All'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'game-over') {
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <div className={`inline-flex p-6 rounded-full mb-2 transition-colors ${isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-100 text-rose-600'}`}><Trophy size={64} /></div>
          <h2 className={`text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Game Over!</h2>
          <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>The winner is <span className="font-bold text-rose-500">{sortedTeams[0].name}</span></p>
        </motion.div>

        <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 border transition-colors duration-300 space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-rose-100'}`}>
          <h3 className={`text-center font-bold uppercase tracking-widest text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Final Standings</h3>
          <div className="space-y-3">
            {sortedTeams.map((team, idx) => (
              <div key={team.id} className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${idx === 0 ? 'bg-rose-500 text-white' : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</div>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{team.name}</span>
                </div>
                <span className="font-black text-xl text-rose-500">{team.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md space-y-4">
          <ShareButton 
            title="Choice Charades Results"
            text={`I just played Choice Charades! 🏆\n\nFinal Standings:\n${sortedTeams.map((t, i) => `${i + 1}. ${t.name}: ${t.score} pts`).join('\n')}`}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all"
          />
          <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
            {teams.map((team, idx) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamIdx(idx)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedTeamIdx === idx 
                    ? 'bg-rose-500 text-white' 
                    : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
          {teams[selectedTeamIdx] && (
            <HistoryList history={teams[selectedTeamIdx].history} title={`${teams[selectedTeamIdx].name} History`} />
          )}
        </div>

        <button onClick={() => setGameState('setup')} className="w-full max-w-md py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-900/20 hover:bg-rose-600 transition-all flex items-center justify-center space-x-2">
          <RotateCcw size={20} /><span>Play Again</span>
        </button>
      </div>
    );
  }

  return null;
}
