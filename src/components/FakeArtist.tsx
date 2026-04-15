import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, User, Eye, EyeOff, Check, RotateCcw, Trophy, AlertCircle, Pencil, Users, ChevronRight, X, Plus, Play, Sparkles } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  score: number;
  colorIndex: number;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  playerId: number;
}

type GameStep = 'setup' | 'reveal' | 'drawing' | 'voting' | 'reveal-fake' | 'results';

const WORDS = [
  { category: 'Animals', words: ['Elephant', 'Giraffe', 'Penguin', 'Shark', 'Butterfly', 'Lion', 'Kangaroo', 'Octopus', 'Owl', 'Snake', 'Tiger', 'Zebra', 'Dolphin', 'Eagle', 'Frog', 'Spider', 'Bee', 'Bear', 'Turtle', 'Whale'] },
  { category: 'Food', words: ['Pizza', 'Sushi', 'Taco', 'Ice Cream', 'Hamburger', 'Donut', 'Spaghetti', 'Watermelon', 'Croissant', 'Pineapple', 'Burrito', 'Pancakes', 'Waffles', 'Steak', 'Salad', 'Cupcake', 'Cookie', 'Apple', 'Banana', 'Cheese'] },
  { category: 'Objects', words: ['Umbrella', 'Bicycle', 'Camera', 'Telescope', 'Guitar', 'Sunglasses', 'Clock', 'Key', 'Backpack', 'Hammer', 'Scissors', 'Telephone', 'Toothbrush', 'Glasses', 'Spoon', 'Pillow', 'Watch', 'Chair', 'Table', 'Cup'] },
  { category: 'Places', words: ['Eiffel Tower', 'Beach', 'Volcano', 'Library', 'Space Station', 'Pyramid', 'Forest', 'Cinema', 'Airport', 'Castle', 'Museum', 'Stadium', 'Island', 'Desert', 'Mountain', 'Waterfall', 'Bridge', 'Park', 'School', 'Hospital'] },
  { category: 'Nature', words: ['Rainbow', 'Waterfall', 'Cactus', 'Moon', 'Thunderstorm', 'Mountain', 'Sunflower', 'Coral Reef', 'Tornado', 'Island', 'Star', 'Cloud', 'Rain', 'Snow', 'Sun', 'Earth', 'Ocean', 'River', 'Tree', 'Flower'] },
  { category: 'Sports', words: ['Soccer', 'Basketball', 'Baseball', 'Tennis', 'Golf', 'Swimming', 'Boxing', 'Skiing', 'Surfing', 'Cycling', 'Volleyball', 'Hockey', 'Rugby', 'Cricket', 'Bowling', 'Archery', 'Fencing', 'Karate', 'Gymnastics', 'Skateboarding'] },
  { category: 'Jobs', words: ['Doctor', 'Fireman', 'Police', 'Chef', 'Pilot', 'Artist', 'Singer', 'Teacher', 'Nurse', 'Astronaut', 'Baker', 'Farmer', 'Dentist', 'Scientist', 'Detective', 'Plumber', 'Judge', 'Lawyer', 'Soldier', 'Mechanic'] },
  { category: 'Clothing', words: ['Hat', 'Shoe', 'Shirt', 'Pants', 'Dress', 'Skirt', 'Socks', 'Jacket', 'Coat', 'Scarf', 'Gloves', 'Belt', 'Tie', 'Suit', 'Sweater', 'Hoodie', 'Jeans', 'Shorts', 'Boots', 'Sneakers'] }
];

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#64748b'
];

export default function FakeArtist({ isDarkMode, initialPlayers }: { isDarkMode: boolean; initialPlayers: string[] }) {
  const [players, setPlayers] = useState<Player[]>(
    initialPlayers.length >= 3 
      ? initialPlayers.map((name, i) => ({ id: `p-${i}-${Date.now()}`, name, score: 0, colorIndex: i }))
      : initialPlayers.map((name, i) => ({ id: `p-${i}-${Date.now()}`, name, score: 0, colorIndex: i })).concat(
          Array.from({ length: Math.max(0, 3 - initialPlayers.length) }, (_, i) => ({ 
            id: `p-extra-${i}-${Date.now()}`, 
            name: `Player ${initialPlayers.length + i + 1}`, 
            score: 0,
            colorIndex: initialPlayers.length + i
          }))
        )
  );
  const [newPlayerName, setNewPlayerName] = useState('');
  const [step, setStep] = useState<GameStep>('setup');
  const [numRounds, setNumRounds] = useState(2);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [fakeArtistId, setFakeArtistId] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [revealedCount, setRevealedCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawRound, setDrawRound] = useState(1);
  const [drawTurnIdx, setDrawTurnIdx] = useState(0);
  
  const [votedIdx, setVotedIdx] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [fakeArtistGuessedCorrectly, setFakeArtistGuessedCorrectly] = useState<boolean | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const maxColorIdx = players.length > 0 ? Math.max(...players.map(p => p.colorIndex)) : -1;
      setPlayers([...players, { 
        id: `p-new-${Date.now()}`, 
        name: newPlayerName.trim(), 
        score: 0, 
        colorIndex: maxColorIdx + 1 
      }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 3) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  // Initialize a new round
  const initRound = () => {
    const cat = WORDS[Math.floor(Math.random() * WORDS.length)];
    const word = cat.words[Math.floor(Math.random() * cat.words.length)];
    const fakeIdx = Math.floor(Math.random() * players.length);
    
    setCurrentWord(word);
    setCurrentCategory(cat.category);
    setFakeArtistId(players[fakeIdx].id);
    setRevealedCount(0);
    setStrokes([]);
    setDrawRound(1);
    setDrawTurnIdx(0);
    setVotedIdx(-1);
    setShowResult(false);
    setFakeArtistGuessedCorrectly(null);
    setStep('reveal');
  };

  const rotateAndInitRound = () => {
    setPlayers(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const first = next.shift();
      if (first) next.push(first);
      return next;
    });
    initRound();
  };

  useEffect(() => {
    if (step === 'reveal' && revealedCount === 0 && currentWord === '') {
      initRound();
    }
  }, [step]);

  // Canvas drawing logic
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (step !== 'drawing') return;
    const coords = getCoordinates(e);
    if (coords) {
      setIsDrawing(true);
      setCurrentStroke([coords]);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || step !== 'drawing') return;
    const coords = getCoordinates(e);
    if (coords) {
      setCurrentStroke(prev => [...prev, coords]);
    }
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentStroke.length > 1) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: COLORS[players[drawTurnIdx].colorIndex % COLORS.length],
        playerId: drawTurnIdx
      };
      setStrokes(prev => [...prev, newStroke]);
      
      // Move to next turn
      if (drawTurnIdx < players.length - 1) {
        setDrawTurnIdx(prev => prev + 1);
      } else {
        if (drawRound < numRounds) {
          setDrawRound(prev => prev + 1);
          setDrawTurnIdx(0);
        } else {
          setStep('voting');
        }
      }
    }
    setCurrentStroke([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;

    // Draw all completed strokes
    strokes.forEach(stroke => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });

    // Draw current active stroke
    if (currentStroke.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = COLORS[players[drawTurnIdx].colorIndex % COLORS.length];
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      currentStroke.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  }, [strokes, currentStroke, drawTurnIdx]);

  const handleVote = (idx: number) => {
    setVotedIdx(idx);
    setShowResult(true);
    
    const isFakeCaught = players[idx].id === fakeArtistId;
    const newPlayers = [...players];
    
    if (isFakeCaught) {
      // Everyone but fake artist gets a point
      newPlayers.forEach((p) => {
        if (p.id !== fakeArtistId) p.score += 1;
      });
    } else {
      // Only fake artist gets a point
      const fakeArtist = newPlayers.find(p => p.id === fakeArtistId);
      if (fakeArtist) fakeArtist.score += 1;
    }
    setPlayers(newPlayers);
    setStep('reveal-fake');
  };

  const handleFakeArtistGuess = (correct: boolean) => {
    setFakeArtistGuessedCorrectly(correct);
    if (correct) {
      const newPlayers = [...players];
      const fakeArtist = newPlayers.find(p => p.id === fakeArtistId);
      if (fakeArtist) fakeArtist.score += 1;
      setPlayers(newPlayers);
    }
    setStep('results');
  };

  const renderSetup = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8 w-full max-w-2xl mx-auto"
    >
      <div className="text-center space-y-4 max-w-md">
        <div className="space-y-2">
          <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Fake Artist</h2>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>One person doesn't know the word. Find the imposter!</p>
        </div>
        
        <div className={`rounded-2xl p-4 border transition-colors duration-300 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className={`flex items-center justify-center space-x-2 font-bold mb-3 text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            <Sparkles size={16} />
            <span>How to Play</span>
          </div>
          <div className="grid grid-cols-1 gap-3 text-left">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>1</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Everyone sees a word/category, except the **Fake Artist**.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>2</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Players draw a single stroke per turn. After {numRounds} rounds, vote for the Fake Artist.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>3</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>If caught, artists get 1pt. If not, Fake Artist gets 1pt. Extra point if Fake Artist guesses the word!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className={`rounded-3xl shadow-2xl p-8 space-y-8 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 shadow-black/50 border-slate-800' : 'bg-white shadow-indigo-100 border-slate-100'}`}>
          <div className="space-y-4">
            <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <RotateCcw size={18} className="text-indigo-400" />
              <span>Rounds per Player</span>
            </label>
            <div className={`flex items-center justify-between p-2 rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button 
                onClick={() => setNumRounds(Math.max(1, numRounds - 1))}
                className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
              >
                -
              </button>
              <span className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{numRounds}</span>
              <button 
                onClick={() => setNumRounds(Math.min(5, numRounds + 1))}
                className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <Users size={18} className="text-indigo-400" />
              <span>Players (Min 3)</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {players.map((p, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className={`flex-1 p-3 rounded-xl border border-transparent text-sm font-bold ${isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
                    {p.name}
                  </div>
                  <button 
                    onClick={() => removePlayer(i)}
                    disabled={players.length <= 3}
                    className={`p-3 rounded-xl transition-colors ${players.length <= 3 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'bg-slate-800 text-rose-500 hover:bg-rose-500/10' : 'bg-slate-50 text-rose-500 hover:bg-rose-50'}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Add player..."
                className={`flex-1 p-3 rounded-xl border-2 outline-none transition-all text-sm ${isDarkMode ? 'bg-slate-800 border-transparent focus:border-indigo-500 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-transparent focus:border-indigo-500 text-slate-900 placeholder:text-slate-400'}`}
              />
              <button
                onClick={addPlayer}
                disabled={!newPlayerName.trim()}
                className={`p-3 rounded-xl font-bold transition-all ${!newPlayerName.trim() ? 'opacity-50 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (players.length >= 3) {
                initRound();
              }
            }}
            disabled={players.length < 3}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2 ${
              players.length < 3 
                ? 'opacity-50 cursor-not-allowed grayscale' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 active:scale-95'
            }`}
          >
            <Play size={20} fill="currentColor" />
            <span>Start Game</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderReveal = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center space-y-8 w-full max-w-md mx-auto p-6"
    >
      <div className="text-center space-y-2">
        <h2 className={`text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Word Reveal</h2>
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Pass the phone to each player</p>
      </div>

      <div className={`w-full p-8 rounded-[2.5rem] border-4 border-dashed text-center space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xl'}`}>
        <div className="space-y-1">
          <p className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Current Player</p>
          <p className={`text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{players[revealedCount]?.name}</p>
        </div>

        <AnimatePresence mode="wait">
          {!isRevealing ? (
            <motion.button
              key="hide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRevealing(true)}
              className={`w-full py-12 rounded-3xl flex flex-col items-center justify-center space-y-4 transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
            >
              <EyeOff size={48} />
              <span className="font-bold">Tap to see your word</span>
            </motion.button>
          ) : (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              className={`w-full py-12 rounded-3xl flex flex-col items-center justify-center space-y-4 ${isDarkMode ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}
            >
              <Eye size={48} />
              <div className="space-y-2">
                <p className="text-sm font-bold uppercase">Your Word</p>
                <p className="text-4xl font-black">
                  {players[revealedCount]?.id === fakeArtistId ? 'FAKE ARTIST' : currentWord}
                </p>
                {players[revealedCount]?.id !== fakeArtistId && (
                  <p className="text-xs font-bold opacity-70">Category: {currentCategory}</p>
                )}
                {players[revealedCount]?.id === fakeArtistId && (
                  <p className="text-xs font-bold opacity-70">Pretend you know the word!</p>
                )}
              </div>
              <button
                onClick={() => {
                  setIsRevealing(false);
                  if (revealedCount < players.length - 1) {
                    setRevealedCount(prev => prev + 1);
                  } else {
                    setStep('drawing');
                  }
                }}
                className={`mt-4 px-8 py-2 rounded-xl font-bold text-white ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-600'}`}
              >
                Got it
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center space-x-2">
        {players.map((_, i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-full transition-all duration-500 ${i < revealedCount ? 'bg-indigo-500' : i === revealedCount ? 'bg-indigo-500 animate-pulse scale-125' : isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} 
          />
        ))}
      </div>
    </motion.div>
  );

  const renderDrawing = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center space-y-4 w-full max-w-2xl mx-auto p-4"
    >
      {step === 'drawing' && (
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              style={{ backgroundColor: COLORS[players[drawTurnIdx].colorIndex % COLORS.length] }}
            >
              {players[drawTurnIdx].name[0]}
            </div>
            <div>
              <p className={`text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{players[drawTurnIdx].name}'s Turn</p>
              <p className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Round {drawRound} of {numRounds}</p>
            </div>
          </div>
          <div className={`px-4 py-1 rounded-full text-xs font-black border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-indigo-400' : 'bg-white border-slate-100 text-indigo-600 shadow-sm'}`}>
            Category: {currentCategory}
          </div>
        </div>
      )}

      <div className={`relative w-full aspect-square rounded-[2rem] overflow-hidden border-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xl'}`}>
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className={`w-full h-full touch-none ${step === 'drawing' ? 'cursor-crosshair' : 'cursor-default'}`}
        />
        
        {step === 'drawing' && isDrawing && (
          <div className="absolute top-4 right-4 pointer-events-none">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg"
            >
              Drawing...
            </motion.div>
          </div>
        )}

        {step === 'drawing' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center">
            <p className={`text-[10px] font-bold uppercase tracking-widest opacity-30 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Draw one continuous stroke
            </p>
          </div>
        )}
      </div>

      {step === 'drawing' && (
        <div className="w-full flex justify-center space-x-2 overflow-x-auto py-2">
          {players.map((p, i) => (
            <div 
              key={i} 
              className={`flex flex-col items-center space-y-1 transition-all ${i === drawTurnIdx ? 'scale-110' : 'opacity-40'}`}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: COLORS[p.colorIndex % COLORS.length] }}
              >
                {p.name[0]}
              </div>
              <div className={`w-1 h-1 rounded-full ${i === drawTurnIdx ? 'bg-indigo-500' : 'transparent'}`} />
            </div>
          ))}
        </div>
      )}

      {step === 'voting' && (
        <div className="w-full space-y-4">
          <div className="text-center space-y-1">
            <h2 className={`text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Who is the Fake Artist?</h2>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Discuss and vote for the suspect</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-3">
            {players.map((p, i) => (
              <button
                key={i}
                onClick={() => handleVote(i)}
                className={`p-3 rounded-xl border-2 transition-all flex items-center space-x-3 group ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 text-slate-100' 
                    : 'bg-white border-slate-100 hover:border-indigo-500 text-slate-900 shadow-sm'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: COLORS[p.colorIndex % COLORS.length] }}
                >
                  {p.name[0]}
                </div>
                <span className="font-bold text-sm truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'reveal-fake' && (
        <div className="w-full space-y-4">
          {(() => {
            const isFakeCaught = players[votedIdx]?.id === fakeArtistId;
            return (
              <>
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-4">
                    <div className={`p-3 rounded-2xl border-2 transition-all duration-500 ${isFakeCaught ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-rose-500/10 border-rose-500 text-rose-500'}`}>
                      {isFakeCaught ? <Check size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <h2 className={`text-2xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                      {isFakeCaught ? 'CAUGHT!' : 'ESCAPED!'}
                    </h2>
                  </div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    The Fake Artist was <span className="text-indigo-400">{players.find(p => p.id === fakeArtistId)?.name}</span>
                  </p>
                </div>

                <div className={`w-full p-6 rounded-3xl border-4 border-dashed text-center space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Fake Artist's Turn</p>
                    <p className={`text-lg font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Can you guess the word?</p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleFakeArtistGuess(true)}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 shadow-lg shadow-green-900/20 active:scale-95 text-sm"
                    >
                      I guessed it correctly!
                    </button>
                    <button
                      onClick={() => handleFakeArtistGuess(false)}
                      className={`w-full py-3 rounded-xl font-bold transition-all border text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      I have no idea...
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </motion.div>
  );

  const renderResults = () => {
    const isFakeCaught = players[votedIdx]?.id === fakeArtistId;
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center space-y-8 w-full max-w-md mx-auto p-6"
      >
        <div className="text-center space-y-4">
          <div className={`inline-flex p-6 rounded-[2.5rem] mb-4 border-4 transition-all duration-500 ${isFakeCaught ? 'bg-green-500/10 border-green-500 text-green-500 rotate-12' : 'bg-rose-500/10 border-rose-500 text-rose-500 -rotate-12'}`}>
            {isFakeCaught ? <Check size={64} /> : <AlertCircle size={64} />}
          </div>
          <h2 className={`text-4xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
            {isFakeCaught ? 'CAUGHT!' : 'ESCAPED!'}
          </h2>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            The Fake Artist was <span className="text-indigo-400">{players.find(p => p.id === fakeArtistId)?.name}</span>
          </p>
          <div className="flex flex-col items-center space-y-2">
            <div className={`px-6 py-2 rounded-2xl font-black border inline-block ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`}>
              Word: {currentWord}
            </div>
            {fakeArtistGuessedCorrectly !== null && (
              <div className={`text-sm font-bold ${fakeArtistGuessedCorrectly ? 'text-green-500' : 'text-rose-500'}`}>
                Fake Artist guessed the word {fakeArtistGuessedCorrectly ? 'CORRECTLY' : 'INCORRECTLY'} (+{fakeArtistGuessedCorrectly ? '1' : '0'} pt)
              </div>
            )}
          </div>
        </div>

        <div className={`w-full p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Scoreboard</h3>
          <div className="space-y-3">
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: COLORS[p.colorIndex % COLORS.length] }}
                  >
                    {p.name[0]}
                  </div>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{p.name}</span>
                  {p.id === fakeArtistId && (
                    <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full uppercase">Fake</span>
                  )}
                </div>
                <span className="font-black text-indigo-500">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-3 w-full">
          <button
            onClick={() => setStep('setup')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            Setup
          </button>
          <button
            onClick={rotateAndInitRound}
            className="flex-2 py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 active:scale-95 flex items-center justify-center space-x-2"
          >
            <RotateCcw size={20} />
            <span>Next Round</span>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`min-h-full transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {step === 'setup' && renderSetup()}
          {step === 'reveal' && renderReveal()}
          {(step === 'drawing' || step === 'voting' || step === 'reveal-fake') && renderDrawing()}
          {step === 'results' && renderResults()}
        </AnimatePresence>
      </main>
    </div>
  );
}
