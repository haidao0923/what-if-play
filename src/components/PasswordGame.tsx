import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Timer, Play, RotateCcw, ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle, Trophy, Sparkles, ChevronRight, MessageSquare, Share2 } from 'lucide-react';
import ShareButton from './ShareButton';

interface Team {
  id: number;
  name: string;
  score: number;
  players: string[];
  clueGiverIndex: number;
}

const WORDS = [
  "Apple", "Banana", "Elephant", "Computer", "Guitar", "Mountain", "Ocean", "Pizza", "Robot", "Spaceship",
  "Tiger", "Umbrella", "Volcano", "Window", "Xylophone", "Yacht", "Zebra", "Astronaut", "Bicycle", "Cactus",
  "Dolphin", "Eagle", "Fireman", "Giraffe", "Hammer", "Ice Cream", "Jungle", "Kangaroo", "Lemon", "Magnet",
  "Notebook", "Owl", "Penguin", "Queen", "Rainbow", "Snowman", "Telephone", "Unicorn", "Violin", "Waterfall",
  "Airplane", "Balloon", "Camera", "Doctor", "Egg", "Flower", "Ghost", "Helicopter", "Island", "Jacket",
  "Kite", "Lion", "Moon", "Nurse", "Orange", "Piano", "Quiet", "Rocket", "Sun", "Train",
  "Under", "Village", "Whale", "Yellow", "Zoo", "Bread", "Cheese", "Dance", "Earth", "Forest",
  "Game", "Heart", "Ink", "Joke", "Key", "Leaf", "Milk", "Night", "Paper", "Rain",
  "Star", "Tree", "Up", "Voice", "Water", "Box", "Cat", "Dog", "End", "Fish",
  "Acorn", "Anchor", "Ant", "Axe", "Baby", "Bag", "Bat", "Bed", "Bee", "Bell",
  "Bird", "Boat", "Bone", "Boot", "Bowl", "Boy", "Bug", "Bus", "Cake", "Can",
  "Cap", "Car", "Chair", "Clock", "Cloud", "Coat", "Comb", "Cow", "Cup", "Desk",
  "Door", "Drum", "Duck", "Ear", "Eye", "Fan", "Feet", "Flag", "Foot", "Fork",
  "Fox", "Frog", "Gate", "Girl", "Glove", "Goat", "Gum", "Hair", "Hand", "Hat",
  "Hen", "Hill", "Hippopotamus", "Horse", "House", "Jar", "Jeep", "Jet", "Key", "King",
  "Knee", "Knife", "Lamp", "Leg", "Lip", "Lock", "Log", "Map", "Mask", "Mat",
  "Mop", "Mouse", "Mouth", "Nail", "Neck", "Nest", "Net", "Nose", "Nut", "Pan",
  "Pen", "Pig", "Pin", "Pot", "Rat", "Ring", "Road", "Rock", "Roof", "Rope",
  "Sack", "Sail", "Sand", "Saw", "Seal", "Seed", "Ship", "Shirt", "Shoe", "Sink",
  "Soap", "Sock", "Sofa", "Soup", "Spoon", "Stair", "Stem", "Stick", "Stool", "Stove",
  "Suit", "Table", "Tail", "Tap", "Tent", "Tie", "Toe", "Tool", "Top", "Toy",
  "Tray", "Truck", "Tub", "Vase", "Vest", "Wall", "Wasp", "Watch", "Web", "Wheel",
  "Whip", "Wig", "Wind", "Wing", "Wire", "Wolf", "Worm", "Yard", "Yarn", "Yo-yo"
];

export default function PasswordGame({ isDarkMode = true, initialPlayers = [] }: { isDarkMode?: boolean, initialPlayers?: string[] }) {
  const [gameState, setGameState] = useState<'setup' | 'reveal-word' | 'clue-giving' | 'guessing' | 'round-over'>('setup');
  const [numTeams, setNumTeams] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(initialPlayers.length > 3 ? Math.ceil(initialPlayers.length / 2) : 2);
  const [turnTime, setTurnTime] = useState(15);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isWordVisible, setIsWordVisible] = useState(false);
  
  // Setup state for names
  const [setupTeamNames, setSetupTeamNames] = useState<string[]>(['Team 1', 'Team 2']);
  const [setupPlayerNames, setSetupPlayerNames] = useState<string[][]>(() => {
    if (initialPlayers.length > 0) {
      const pPerTeam = Math.ceil(initialPlayers.length / 2);
      const team1 = initialPlayers.slice(0, pPerTeam);
      const team2 = initialPlayers.slice(pPerTeam);
      // Ensure team2 has at least 2 players if possible, or fill with placeholders
      while (team1.length < 2) team1.push(`Player ${team1.length + 1}`);
      while (team2.length < 2) team2.push(`Player ${team2.length + 1}`);
      return [team1, team2];
    }
    return [
      ['Player 1', 'Player 2'],
      ['Player 1', 'Player 2']
    ];
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateNumTeams = (val: number) => {
    const newCount = Math.max(2, val);
    setNumTeams(newCount);
    setSetupTeamNames(prev => {
      const next = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) {
          next.push(`Team ${i + 1}`);
        }
      } else {
        return next.slice(0, newCount);
      }
      return next;
    });
    setSetupPlayerNames(prev => {
      const next = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) {
          next.push(Array.from({ length: playersPerTeam }, (_, j) => `Player ${j + 1}`));
        }
      } else {
        return next.slice(0, newCount);
      }
      return next;
    });
  };

  const updatePlayersPerTeam = (val: number) => {
    const newCount = Math.max(2, val);
    setPlayersPerTeam(newCount);
    setSetupPlayerNames(prev => {
      return prev.map(teamPlayers => {
        const next = [...teamPlayers];
        if (newCount > teamPlayers.length) {
          for (let i = teamPlayers.length; i < newCount; i++) {
            next.push(`Player ${i + 1}`);
          }
        } else {
          return next.slice(0, newCount);
        }
        return next;
      });
    });
  };

  const randomizePlayers = () => {
    const allPlayers = setupPlayerNames.flat();
    // Shuffle
    for (let i = allPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPlayers[i], allPlayers[j]] = [allPlayers[j], allPlayers[i]];
    }
    
    // Redistribute
    const newSetupPlayerNames: string[][] = [];
    for (let i = 0; i < numTeams; i++) {
      newSetupPlayerNames.push(allPlayers.slice(i * playersPerTeam, (i + 1) * playersPerTeam));
    }
    setSetupPlayerNames(newSetupPlayerNames);
  };

  const setupTeams = () => {
    const initialTeams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
      id: i + 1,
      name: setupTeamNames[i] || `Team ${i + 1}`,
      score: 0,
      players: setupPlayerNames[i].map((name, j) => name || `Player ${j + 1}`),
      clueGiverIndex: 0
    }));
    setTeams(initialTeams);
    startNewRound(initialTeams);
  };

  const startNewRound = (currentTeams: Team[]) => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(randomWord);
    
    // Find team with lowest score to go first (Catch-up mechanic)
    let lowestScore = Infinity;
    let lastPlaceIndex = 0;
    currentTeams.forEach((team, idx) => {
      if (team.score < lowestScore) {
        lowestScore = team.score;
        lastPlaceIndex = idx;
      }
    });
    
    setCurrentTeamIndex(lastPlaceIndex);
    setIsWordVisible(false);
    setGameState('reveal-word');
  };

  const startClueGiving = () => {
    setGameState('clue-giving');
    setTimeLeft(turnTime);
  };

  const startGuessing = () => {
    setGameState('guessing');
    setTimeLeft(turnTime);
  };

  const handleCorrectGuess = () => {
    const updatedTeams = [...teams];
    updatedTeams[currentTeamIndex].score += 1;
    
    // Rotate clue givers for next round
    updatedTeams.forEach(team => {
      team.clueGiverIndex = (team.clueGiverIndex + 1) % team.players.length;
    });
    
    setTeams(updatedTeams);
    setGameState('round-over');
  };

  const handleWrongGuess = () => {
    const nextTeam = (currentTeamIndex + 1) % teams.length;
    setCurrentTeamIndex(nextTeam);
    setGameState('clue-giving');
    setTimeLeft(turnTime);
  };

  useEffect(() => {
    if ((gameState === 'clue-giving' || gameState === 'guessing') && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (gameState === 'clue-giving') {
              startGuessing();
            } else {
              handleWrongGuess();
            }
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const handleTeamNameChange = (teamIdx: number, name: string) => {
    const next = [...setupTeamNames];
    next[teamIdx] = name;
    setSetupTeamNames(next);
  };

  const handlePlayerNameChange = (teamIdx: number, playerIdx: number, name: string) => {
    const next = [...setupPlayerNames];
    next[teamIdx] = [...next[teamIdx]];
    next[teamIdx][playerIdx] = name;
    setSetupPlayerNames(next);
  };

  if (gameState === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-md">
          <div className="space-y-2">
            <h2 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Password</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>One word clues. One chance to guess.</p>
          </div>

          <div className={`rounded-2xl p-4 border transition-colors duration-300 ${isDarkMode ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-100'}`}>
            <div className={`flex items-center justify-center space-x-2 font-bold mb-3 text-sm ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              <Sparkles size={16} />
              <span>How to Play</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-left">
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>1</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Divide into teams. One player per team is the Clue Giver (only they see the word).</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>2</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Clue Giver gives a **one-word clue**. Their team has one chance to guess.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>3</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>If wrong, the next team gets a turn with a new clue. First team to guess wins the point!</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-md space-y-6">
          <div className={`rounded-3xl shadow-2xl p-8 space-y-8 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 shadow-black/50 border-slate-800' : 'bg-white shadow-amber-100 border-slate-100'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Users size={18} className="text-amber-400" />
                  <span>Teams</span>
                </label>
                <div className={`flex items-center justify-between p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
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
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Users size={18} className="text-amber-400" />
                  <span>Players/Team</span>
                </label>
                <div className={`flex items-center justify-between p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
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

            {/* Team and Player Customization */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Users size={18} className="text-amber-400" />
                  <span>Team Customization</span>
                </label>
                <button 
                  onClick={randomizePlayers}
                  className={`text-xs font-bold flex items-center space-x-1 transition-colors ${isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}
                >
                  <RotateCcw size={12} />
                  <span>Randomize Players</span>
                </button>
              </div>
              
              <div className="space-y-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {setupTeamNames.map((teamName, teamIdx) => (
                  <div key={teamIdx} className={`space-y-3 p-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => handleTeamNameChange(teamIdx, e.target.value)}
                      placeholder={`Team ${teamIdx + 1} Name`}
                      className={`w-full p-2 rounded-lg border border-transparent focus:border-amber-500 outline-none font-bold transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white text-slate-900 placeholder:text-slate-400'}`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {setupPlayerNames[teamIdx].map((playerName, playerIdx) => (
                        <input
                          key={playerIdx}
                          type="text"
                          value={playerName}
                          onChange={(e) => handlePlayerNameChange(teamIdx, playerIdx, e.target.value)}
                          placeholder={`Player ${playerIdx + 1}`}
                          className={`w-full p-2 rounded-lg border border-transparent focus:border-amber-500 outline-none text-xs transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-300 placeholder:text-slate-500' : 'bg-white text-slate-600 placeholder:text-slate-400'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Timer size={18} className="text-amber-400" />
                <span>Turn Time (seconds)</span>
              </label>
              <input 
                type="range" min="5" max="60" step="5" value={turnTime} 
                onChange={(e) => setTurnTime(parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-colors ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
              />
              <div className="text-center text-2xl font-black text-amber-500">{turnTime}s</div>
            </div>

            <button 
              onClick={setupTeams}
              className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-amber-900/20 hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Play size={20} fill="currentColor" />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'reveal-word') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <div className="text-center space-y-4">
          <h2 className={`text-3xl font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Clue Givers Only!</h2>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Pass the device to the Clue Givers of all teams.</p>
        </div>

        <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 border transition-colors duration-300 flex flex-col items-center space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-amber-100 shadow-amber-100'}`}>
          <div className="w-full space-y-4">
            <h3 className={`text-center font-bold uppercase text-xs tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Current Clue Givers</h3>
            <div className="grid grid-cols-2 gap-2">
              {teams.map(team => (
                <div key={team.id} className={`p-3 rounded-xl border transition-colors duration-300 text-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-amber-50 border-amber-100'}`}>
                  <p className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{team.name}</p>
                  <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{team.players[team.clueGiverIndex]}</p>
                </div>
              ))}
            </div>
          </div>

          <div 
            onClick={() => setIsWordVisible(!isWordVisible)}
            className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
          >
            {isWordVisible ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                <p className="text-xs font-bold text-amber-500 uppercase mb-1">The Word is</p>
                <p className={`text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{currentWord}</p>
                <div className={`mt-4 flex items-center justify-center text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  <EyeOff size={14} className="mr-1" /> Tap to hide
                </div>
              </motion.div>
            ) : (
              <div className={`text-center ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                <Eye size={48} className="mx-auto mb-2 opacity-20" />
                <p className="font-bold">TAP TO REVEAL WORD</p>
              </div>
            )}
          </div>

          <button 
            onClick={startClueGiving}
            disabled={!isWordVisible}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2 ${
              isWordVisible 
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20 hover:bg-amber-600' 
                : isDarkMode ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Everyone Ready?</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'clue-giving' || gameState === 'guessing') {
    const currentTeam = teams[currentTeamIndex];
    const clueGiver = currentTeam.players[currentTeam.clueGiverIndex];
    const guessers = currentTeam.players.filter((_, i) => i !== currentTeam.clueGiverIndex);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 space-y-4 sm:space-y-8 overflow-hidden">
        {/* Scoreboard Header */}
        <div className="w-full max-w-md flex justify-between items-center px-4">
          {teams.map((team, idx) => (
            <div key={team.id} className={`flex flex-col items-center ${idx === currentTeamIndex ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl transition-colors ${
                idx === currentTeamIndex 
                  ? 'bg-amber-500 text-white shadow-lg' 
                  : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-200 text-gray-500'
              }`}>
                {team.score}
              </div>
              <span className={`text-[8px] sm:text-[10px] font-bold uppercase mt-1 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{team.name}</span>
            </div>
          ))}
        </div>

        <div className="text-center space-y-1 sm:space-y-2">
          <motion.div 
            key={gameState}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`inline-block px-4 py-1 sm:px-6 sm:py-2 rounded-full font-black text-[10px] sm:text-sm tracking-widest uppercase transition-colors ${
              gameState === 'clue-giving' 
                ? isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600' 
                : isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
            }`}
          >
            {gameState === 'clue-giving' ? 'Clue Giving' : 'Guessing'}
          </motion.div>
          <h2 className={`text-2xl sm:text-3xl font-black transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{currentTeam.name}</h2>
        </div>

        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform">
            <circle cx="50%" cy="50%" r="45%" className={`fill-none transition-colors ${isDarkMode ? 'stroke-slate-800' : 'stroke-gray-100'}`} strokeWidth="8" />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              className={`fill-none ${gameState === 'clue-giving' ? 'stroke-indigo-500' : 'stroke-green-500'}`}
              strokeWidth="8"
              strokeDasharray="283%"
              animate={{ strokeDashoffset: `${283 - (283 * (timeLeft / turnTime))}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl sm:text-6xl font-black tabular-nums transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{Math.ceil(timeLeft)}</span>
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Seconds</span>
          </div>
        </div>

        <div className={`w-full max-w-md rounded-3xl shadow-xl p-6 sm:p-8 border transition-colors duration-300 space-y-4 sm:space-y-6 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            <div className={`text-center flex-1 p-3 sm:p-4 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
              <p className={`text-[8px] sm:text-[10px] font-bold uppercase mb-1 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Clue Giver</p>
              <p className={`font-bold text-sm sm:text-base transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{clueGiver}</p>
            </div>
            <div className={`transition-colors ${isDarkMode ? 'text-slate-700' : 'text-gray-300'}`}>
              <ChevronRight size={20} />
            </div>
            <div className={`text-center flex-1 p-3 sm:p-4 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
              <p className={`text-[8px] sm:text-[10px] font-bold uppercase mb-1 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Guessers</p>
              <p className={`font-bold text-sm sm:text-base transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{guessers.join(", ")}</p>
            </div>
          </div>

          <div className={`p-3 sm:p-4 rounded-2xl border transition-colors ${
            isDarkMode ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-100'
          } text-center`}>
            <p className={`text-[8px] sm:text-[10px] font-bold uppercase mb-1 transition-colors ${isDarkMode ? 'text-amber-500/70' : 'text-amber-600'}`}>Secret Word (Clue Giver Only)</p>
            <p className={`text-xl sm:text-2xl font-black transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{currentWord}</p>
          </div>

          {gameState === 'guessing' && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button 
                onClick={handleWrongGuess}
                className={`py-3 sm:py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all text-sm sm:text-base ${
                  isDarkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <XCircle size={18} className="sm:w-5 sm:h-5" />
                <span>Wrong</span>
              </button>
              <button 
                onClick={handleCorrectGuess}
                className="py-3 sm:py-4 bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-green-900/20 hover:bg-green-600 transition-all text-sm sm:text-base"
              >
                <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
                <span>Correct</span>
              </button>
            </div>
          )}
          
          {gameState === 'clue-giving' && (
            <button 
              onClick={startGuessing}
              className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all text-sm sm:text-base"
            >
              <MessageSquare size={18} className="sm:w-5 sm:h-5" />
              <span>Clue Given!</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'round-over') {
    const winningTeam = teams[currentTeamIndex];

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className={`inline-flex p-6 rounded-full mb-2 transition-colors ${isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-600'}`}>
            <Trophy size={64} />
          </div>
          <h2 className={`text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Point for {winningTeam.name}!</h2>
          <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>The word was <span className="font-bold text-amber-500">{currentWord}</span></p>
        </motion.div>

        <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 border transition-colors duration-300 space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-amber-100'}`}>
          <h3 className={`text-center font-bold uppercase tracking-widest text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Current Standings</h3>
          <div className="space-y-3">
            {[...teams].sort((a, b) => b.score - a.score).map((team, idx) => (
              <div key={team.id} className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${idx === 0 ? 'bg-amber-500 text-white' : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{team.name}</span>
                </div>
                <span className="font-black text-xl text-amber-500">{team.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-full max-w-md space-y-3">
          <ShareButton 
            title="Password Game Results"
            text={`I just played Password! 🏆\n\nFinal Standings:\n${[...teams].sort((a, b) => b.score - a.score).map((t, i) => `${i + 1}. ${t.name}: ${t.score} pts`).join('\n')}`}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all"
          />
          <button 
            onClick={() => startNewRound(teams)}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-900/20 hover:bg-amber-600 transition-all flex items-center justify-center space-x-2"
          >
            <RotateCcw size={20} />
            <span>Next Round</span>
          </button>
          <button 
            onClick={() => setGameState('setup')}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <ArrowLeft size={20} />
            <span>End Game</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
