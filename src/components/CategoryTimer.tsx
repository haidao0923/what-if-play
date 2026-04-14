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
  "Hobbies", "School Subjects", "Languages", "Flowers", "Video Games",
  "Pizza Toppings", "Ice Cream Flavors", "Fast Food Chains", "Board Games",
  "Dog Breeds", "Soft Drinks", "Marvel Characters", "DC Characters",
  "Harry Potter Characters", "Disney Movies", "TV Shows", "Musical Artists",
  "Famous Actors", "Insects", "Sea Creatures", "Birds", "Trees",
  "Types of Pasta", "Spices & Herbs", "Kitchen Appliances", "Tools",
  "NBA Teams", "NFL Teams", "MLB Teams", "Soccer Clubs", "Olympic Sports",
  "Types of Shoes", "Makeup Brands", "Tech Companies", "Social Media Apps",
  "Programming Languages", "Types of Cheese", "Cocktails", "Breakfast Foods",
  "Sandwich Fillings", "Condiments", "Types of Soup", "Types of Bread",
  "Types of Cake", "Types of Cookie", "Types of Pie", "Types of Nut",
  "Types of Berry", "Types of Cereal", "Types of Sushi", "Types of Pizza",
  "Types of Burger", "Types of Taco", "Types of Sandwich", "Types of Salad",
  "Types of Snack", "Types of Chip", "Types of Candy", "Types of Chocolate",
  "Types of Tea", "Types of Coffee", "Types of Juice", "Types of Beer",
  "Types of Wine", "Types of Spirit", "Types of Liqueur", "Types of Soda",
  "Types of Water", "Types of Milk", "Types of Yogurt", "Types of Meat",
  "Types of Poultry", "Types of Fish", "Types of Shellfish", "Types of Pasta Sauce",
  "Types of Salad Dressing", "Types of Oil", "Types of Vinegar", "Types of Salt",
  "Types of Pepper", "Types of Sugar", "Types of Flour", "Types of Yeast",
  "Types of Vanilla", "Types of Extract", "Types of Food Coloring", "Types of Sprinkles",
  "Types of Frosting", "Types of Glaze", "Types of Filling", "Types of Crust",
  "Types of Topping", "Types of Garnish", "Types of Side Dish", "Types of Appetizer",
  "Types of Main Course", "Types of Beverage", "Types of Alcohol", "Types of Liqueur",
  "Types of Beer", "Types of Cider", "Types of Mead", "Types of Sake",
  "Types of Soju", "Types of Tequila", "Types of Vodka", "Types of Gin",
  "Types of Rum", "Types of Whiskey", "Types of Brandy", "Types of Cognac",
  "Types of Armagnac", "Types of Calvados", "Types of Grappa", "Types of Pisco",
  "Types of Absinthe", "Types of Vermouth", "Types of Bitters", "Types of Syrup",
  "Types of Juice", "Types of Soda", "Types of Water", "Types of Tea",
  "Types of Coffee", "Types of Milk", "Types of Cream", "Types of Sugar",
  "Types of Sweetener", "Types of Spice", "Types of Herb", "Types of Nut",
  "Types of Seed", "Types of Grain", "Types of Legume", "Types of Fruit",
  "Types of Vegetable", "Types of Meat", "Types of Poultry", "Types of Seafood",
  "Types of Dairy", "Types of Fats", "Types of Oils", "Types of Vinegar",
  "Types of Salt", "Types of Pepper", "Types of Sauce", "Types of Condiment",
  "Types of Dressing", "Types of Dip", "Types of Spread", "Types of Jam",
  "Types of Jelly", "Types of Marmalade", "Types of Preserve", "Types of Honey",
  "Types of Syrup", "Types of Molasses", "Types of Nectar", "Types of Extract",
  "Types of Essence", "Types of Flavoring", "Types of Coloring", "Types of Additive",
  "Types of Preservative", "Types of Stabilizer", "Types of Emulsifier", "Types of Thickener",
  "Types of Leavening Agent", "Types of Enzyme", "Types of Probiotic", "Types of Vitamin",
  "Types of Mineral", "Types of Amino Acid", "Types of Fatty Acid", "Types of Antioxidant",
  "Types of Phytochemical", "Types of Fiber", "Types of Carbohydrate", "Types of Protein",
  "Types of Lipid", "Types of Water", "Types of Ash", "Types of Energy",
  "Types of Nutrient", "Types of Food", "Types of Drink", "Types of Meal",
  "Types of Cuisine", "Types of Diet", "Types of Eating Habit", "Types of Cooking Method",
  "Types of Food Preparation", "Types of Food Storage", "Types of Food Preservation", "Types of Food Safety",
  "Types of Food Quality", "Types of Food Labeling", "Types of Food Marketing", "Types of Food Distribution",
  "Types of Food Consumption", "Types of Food Waste", "Types of Food Security", "Types of Food Policy",
  "Types of Food Law", "Types of Food Science", "Types of Food Technology", "Types of Food Engineering",
  "Types of Food Chemistry", "Types of Food Microbiology", "Types of Food Physics", "Types of Food Sensory Science",
  "Types of Food Gastronomy", "Types of Food History", "Types of Food Culture", "Types of Food Sociology",
  "Types of Food Psychology", "Types of Food Economics", "Types of Food Geography", "Types of Food Ethics",
  "Types of Food Religion", "Types of Food Art", "Types of Food Literature", "Types of Food Media",
  "Types of Food Education", "Types of Food Tourism", "Types of Food Events", "Types of Food Festivals",
  "Types of Food Awards", "Types of Food Competitions", "Types of Food Organizations", "Types of Food Institutions",
  "Types of Food Companies", "Types of Food Brands", "Types of Food Products", "Types of Food Services",
  "Types of Food Establishments", "Types of Food Outlets", "Types of Food Venues", "Types of Food Spaces",
  "Types of Food Environments", "Types of Food Landscapes", "Types of Food Systems", "Types of Food Chains",
  "Types of Food Networks", "Types of Food Networks", "Types of Food Webs", "Types of Food Cycles",
  "Types of Food Flows", "Types of Food Processes", "Types of Food Activities", "Types of Food Practices",
  "Types of Food Behaviors", "Types of Food Choices", "Types of Food Preferences", "Types of Food Attitudes",
  "Types of Food Beliefs", "Types of Food Values", "Types of Food Norms", "Types of Food Rules",
  "Types of Food Customs", "Types of Food Traditions", "Types of Food Rituals", "Types of Food Ceremonies",
  "Types of Food Symbols", "Types of Food Meanings", "Types of Food Identities", "Types of Food Experiences",
  "Types of Food Memories", "Types of Food Stories", "Types of Food Myths", "Types of Food Legends",
  "Types of Food Heroes", "Types of Food Villains", "Types of Food Monsters", "Types of Food Ghosts",
  "Types of Food Spirits", "Types of Food Gods", "Types of Food Goddesses", "Types of Food Saints",
  "Types of Food Angels", "Types of Food Demons", "Types of Food Fairies", "Types of Food Elves",
  "Types of Food Dwarves", "Types of Food Giants", "Types of Food Dragons", "Types of Food Unicorns",
  "Types of Food Phoenixes", "Types of Food Mermaids", "Types of Food Centaurs", "Types of Food Sphinxes",
  "Types of Food Griffins", "Types of Food Chimeras", "Types of Food Hydras", "Types of Food Medusas",
  "Types of Food Minotaurs", "Types of Food Satyrs", "Types of Food Nymphs", "Types of Food Muses",
  "Types of Food Fates", "Types of Food Graces", "Types of Food Valkyries", "Types of Food Banshees",
  "Types of Food Leprechauns", "Types of Food Gnomes", "Types of Food Trolls", "Types of Food Ogres",
  "Types of Food Orcs", "Types of Food Goblins", "Types of Food Kobolds", "Types of Food Hobgoblins",
  "Types of Food Bugbears", "Types of Food Gnolls", "Types of Food Lizardfolk", "Types of Food Dragonborn",
  "Types of Food Tieflings", "Types of Food Aasimar", "Types of Food Genasi", "Types of Food Goliaths",
  "Types of Food Tabaxi", "Types of Food Kenku", "Types of Food Tortles", "Types of Food Firbolgs",
  "Types of Food Tritons", "Types of Food Changelings", "Types of Food Kalashtar", "Types of Food Shifters",
  "Types of Food Warforged", "Types of Food Loxodons", "Types of Food Simic Hybrids", "Types of Food Vedalken",
  "Types of Food Centaurs", "Types of Food Minotaurs", "Types of Food Leonin", "Types of Food Satyrs",
  "Types of Food Owlin", "Types of Food Harengon", "Types of Food Fairy", "Types of Food Plasmoid",
  "Types of Food Giff", "Types of Food Thri-kreen", "Types of Food Autognome", "Types of Food Hadozee",
  "Types of Food Kender", "Types of Food Glitchling"
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 space-y-4 sm:space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1 sm:space-y-2"
        >
          <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Category Blitz</h2>
          <p className={`pt-1 sm:pt-2 text-sm sm:text-base ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Don't let your timer run out!</p>
          <div className={`rounded-2xl p-4 border mt-4 transition-colors duration-300 ${isDarkMode ? 'bg-rose-900/20 border-rose-800/30' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`flex items-center justify-center space-x-2 font-bold mb-3 text-sm ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
              <Sparkles size={16} />
              <span>How to Play</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-left">
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>1</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>On your turn, say a word that fits the current category.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>2</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tap the screen to pass the turn to the next player.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>3</div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>If your timer hits zero, you're out! Last one standing wins.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          <div className={`rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4 sm:space-y-8 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-gray-100 shadow-rose-100'}`}>
            <div className="space-y-2 sm:space-y-4">
              <label className={`flex items-center space-x-2 text-xs sm:text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Users size={16} className="text-rose-400 sm:w-[18px] sm:h-[18px]" />
                <span>Number of Players</span>
              </label>
              <div className={`flex items-center justify-between p-1.5 sm:p-2 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                <button 
                  onClick={() => updateNumPlayers(numPlayers - 1)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                >
                  -
                </button>
                <span className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{numPlayers}</span>
                <button 
                  onClick={() => updateNumPlayers(numPlayers + 1)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                >
                  +
                </button>
              </div>
            </div>

            {/* Player Names */}
            <div className="space-y-2 sm:space-y-4">
              <label className={`flex items-center space-x-2 text-xs sm:text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Users size={16} className="text-rose-400 sm:w-[18px] sm:h-[18px]" />
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
                    className={`w-full p-2.5 sm:p-3 rounded-xl border border-transparent outline-none transition-all text-xs sm:text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 text-slate-100 focus:border-rose-500 focus:bg-slate-700 placeholder:text-slate-600' 
                        : 'bg-gray-50 text-gray-900 focus:border-rose-500 focus:bg-white placeholder:text-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-4">
              <label className={`flex items-center space-x-2 text-xs sm:text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Timer size={16} className="text-rose-400 sm:w-[18px] sm:h-[18px]" />
                <span>Starting Time</span>
              </label>
              <input 
                type="range" 
                min="10" 
                max="180" 
                step="5"
                value={initialTime} 
                onChange={(e) => setInitialTime(parseInt(e.target.value))}
                className={`w-full h-1.5 sm:h-2 rounded-lg appearance-none cursor-pointer accent-rose-500 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}
              />
              <div className="text-center text-2xl sm:text-3xl font-black text-rose-500">
                {initialTime >= 60 ? `${Math.floor(initialTime / 60)}m ${initialTime % 60}s` : `${initialTime}s`}
              </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-3.5 sm:py-4 bg-rose-500 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-rose-900/20 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Play size={18} fill="currentColor" className="sm:w-5 sm:h-5" />
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
        className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 space-y-4 sm:space-y-8 cursor-pointer select-none overflow-hidden"
        onClick={handleScreenTap}
      >
        <div className="text-center space-y-2 sm:space-y-4">
          <div className={`inline-block px-4 py-1 sm:px-6 sm:py-2 rounded-full font-bold text-[10px] sm:text-sm tracking-widest uppercase transition-colors ${isDarkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
            Category
          </div>
          <h2 className={`text-3xl sm:text-5xl font-black transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{category}</h2>
        </div>

        <div className="relative w-full max-w-[280px] sm:max-w-md aspect-square flex items-center justify-center">
          {/* Progress Circle */}
          <svg className="w-full h-full -rotate-90 transform">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              className={`fill-none transition-colors ${isDarkMode ? 'stroke-slate-800' : 'stroke-gray-100'}`}
              strokeWidth="10"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              className="stroke-rose-500 fill-none"
              strokeWidth="10"
              strokeDasharray="283%"
              animate={{ strokeDashoffset: `${283 - (283 * progress) / 100}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-8">
            <motion.p 
              key={currentPlayer.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-lg sm:text-2xl font-bold mb-1 sm:mb-2 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              {currentPlayer.name}
            </motion.p>
            <span className={`text-5xl sm:text-7xl font-black tabular-nums transition-colors ${currentPlayer.timeLeft < 10 ? 'text-red-500 animate-pulse' : isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              {Math.ceil(currentPlayer.timeLeft)}
            </span>
            <p className={`mt-2 sm:mt-4 text-[10px] sm:text-sm font-medium uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {isPaused ? 'Tap to Start' : 'Tap to Pass'}
            </p>
          </div>
        </div>

        <div className="w-full max-w-md grid grid-cols-2 gap-2 sm:gap-4 overflow-y-auto max-h-[30vh] sm:max-h-none pr-1 custom-scrollbar">
          {players.map((p, idx) => (
            <div 
              key={p.id}
              className={`p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 ${
                idx === currentPlayerIndex 
                  ? isDarkMode ? 'bg-rose-900/30 border-rose-500 scale-105 shadow-xl shadow-black/20' : 'bg-rose-50 border-rose-500 scale-105 shadow-xl shadow-rose-100'
                  : p.isOut 
                    ? isDarkMode ? 'bg-slate-900 border-slate-800 opacity-30 grayscale' : 'bg-gray-100 border-gray-200 opacity-40 grayscale'
                    : isDarkMode ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-white border-gray-100 opacity-60'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xs sm:text-sm truncate mr-1 transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{p.name}</span>
                <span className={`font-black text-xs sm:text-base transition-colors ${p.isOut ? isDarkMode ? 'text-slate-600' : 'text-gray-400' : 'text-rose-500'}`}>
                  {p.isOut ? 'OUT' : `${Math.ceil(p.timeLeft)}s`}
                </span>
              </div>
              {!p.isOut && (
                <div className={`mt-1.5 sm:mt-2 h-1 sm:h-1.5 rounded-full overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-2 sm:space-y-4"
      >
        <div className={`inline-flex p-3 sm:p-4 rounded-full mb-1 sm:mb-2 transition-colors ${isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
          <Trophy size={32} className="sm:w-12 sm:h-12" />
        </div>
        <h2 className={`text-2xl sm:text-4xl font-black transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Game Over!</h2>
        <p className={`text-base sm:text-xl transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          <span className="font-bold text-indigo-500">{winner?.name}</span> is the last standing!
        </p>
      </motion.div>

      <div className="w-full max-w-md space-y-2 sm:space-y-4 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
        <h3 className={`text-center font-bold uppercase tracking-widest text-[10px] sm:text-sm transition-colors ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Final Rankings</h3>
        {[...players].sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((p, index) => (
          <div 
            key={p.id}
            className={`flex items-center justify-between p-3 sm:p-5 rounded-2xl border-2 transition-colors duration-300 ${
              p.rank === 1 
                ? isDarkMode ? 'bg-indigo-900/20 border-indigo-500' : 'bg-indigo-50 border-indigo-500' 
                : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-colors ${
                p.rank === 1 ? 'bg-indigo-500 text-white' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'
              }`}>
                {p.rank}
              </div>
              <span className={`font-bold text-sm sm:text-base transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{p.name}</span>
            </div>
            <span className={`font-black text-xs sm:text-base transition-colors ${p.rank === 1 ? 'text-indigo-500' : isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
              {p.rank === 1 ? 'WINNER' : 'ELIMINATED'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col w-full max-w-md space-y-2 sm:space-y-3">
        <ShareButton 
          title="Category Blitz Results"
          text={`I just played Category Blitz! ${winner?.name} won! 🏆\n\nFinal Rankings:\n${[...players].sort((a, b) => (a.rank || 99) - (b.rank || 99)).map(p => `${p.rank}. ${p.name}`).join('\n')}`}
          className="w-full py-3.5 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all text-sm sm:text-base"
        />
        <button 
          onClick={startGame}
          className="w-full py-3.5 sm:py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-900/20 hover:bg-rose-600 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <RotateCcw size={18} className="sm:w-5 sm:h-5" />
          <span>Rematch</span>
        </button>
        <button 
          onClick={resetGame}
          className={`w-full py-3.5 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 text-sm sm:text-base ${
            isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          <span>Back to Setup</span>
        </button>
      </div>
    </div>
  );
}
