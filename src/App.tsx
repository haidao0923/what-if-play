import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Timer, Sparkles, ChevronRight, Zap, MessageSquare, Users, Search, Share2, Sun, Moon, Plus, X, UserPlus, Medal, Palette, Brain, Map as MapIcon } from 'lucide-react';
import ShareButton from './components/ShareButton';
import GuessTheSeconds from './components/GuessTheSeconds';
import CategoryTimer from './components/CategoryTimer';
import PasswordGame from './components/PasswordGame';
import ChoiceCharades from './components/ChoiceCharades';
import MostLikelyTo from './components/MostLikelyTo';
import ObservationBingo from './components/ObservationBingo';
import GauntletMode from './components/GauntletMode';
import FakeArtist from './components/FakeArtist';
import GeoTrivia from './components/GeoTrivia';
import MemoryShape from './components/MemoryShape';
import ColorMatch from './components/ColorMatch';

type GameType = 'none' | 'guess-seconds' | 'category-timer' | 'password' | 'choice-charades' | 'most-likely-to' | 'observation-bingo' | 'gauntlet' | 'fake-artist' | 'geotrivia' | 'memory-shape' | 'color-match';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameType>('none');
  const [gauntletConfig, setGauntletConfig] = useState<{ step: 'name' | 'playing' | 'results' | 'leaderboard', type: 'seconds' | 'math' | 'memory-classic' | 'memory-progressive' }>({ step: 'name', type: 'seconds' });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playerFilter, setPlayerFilter] = useState<number>(0);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  const games = [
    {
      id: 'guess-seconds' as GameType,
      title: 'Guess the Seconds',
      description: 'Stop the timer as close to the target as possible without looking.',
      icon: <Timer className="w-8 h-8" />,
      color: 'bg-indigo-500',
      accent: 'indigo',
      minPlayers: 1
    },
    {
      id: 'category-timer' as GameType,
      title: 'Category Blitz',
      description: 'Say a word in the category and pass the turn before your time runs out!',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-rose-500',
      accent: 'rose',
      minPlayers: 2
    },
    {
      id: 'password' as GameType,
      title: 'Password',
      description: 'Give one-word clues to help your team guess the secret word.',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'bg-amber-500',
      accent: 'amber',
      minPlayers: 2
    },
    {
      id: 'choice-charades' as GameType,
      title: 'Choice Charades',
      description: 'Fast-paced acting with three difficulty levels at once!',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'bg-rose-500',
      accent: 'rose',
      minPlayers: 2
    },
    {
      id: 'most-likely-to' as GameType,
      title: 'Most Likely To',
      description: 'Point to the person who fits the prompt best. Perfect for waiting in line!',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-indigo-500',
      accent: 'indigo',
      minPlayers: 2
    },
    {
      id: 'observation-bingo' as GameType,
      title: 'Observation Bingo',
      description: 'Spot items in the crowd to get 3 in a row. Perfect for people-watching!',
      icon: <Search className="w-8 h-8" />,
      color: 'bg-rose-500',
      accent: 'rose',
      minPlayers: 1
    },
    {
      id: 'fake-artist' as GameType,
      title: 'Fake Artist',
      description: 'One person doesn\'t know the word. Draw one stroke at a time to find the imposter!',
      icon: <Palette className="w-8 h-8" />,
      color: 'bg-indigo-500',
      accent: 'indigo',
      minPlayers: 3
    },
    {
      id: 'geotrivia' as GameType,
      title: 'GeoTrivia',
      description: 'Test your US geography! Find the state on a blank map before time runs out.',
      icon: <MapIcon className="w-8 h-8" />,
      color: 'bg-amber-500',
      accent: 'amber',
      minPlayers: 1
    },
    {
      id: 'memory-shape' as GameType,
      title: 'Memory Shape',
      description: 'Memorize shapes and numbers before they disappear. Can you remember them all?',
      icon: <Brain className="w-8 h-8" />,
      color: 'bg-violet-500',
      accent: 'violet',
      minPlayers: 1
    },
    {
      id: 'color-match' as GameType,
      title: 'Color Match',
      description: 'Don\'t read the word! Tap the color of the ink as fast as you can.',
      icon: <Palette className="w-8 h-8" />,
      color: 'bg-emerald-500',
      accent: 'emerald',
      minPlayers: 1
    },
  ];

  if (activeGame !== 'none') {
    return (
      <div className={`h-screen flex flex-col transition-colors duration-300 overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
        <nav className={`p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center">
            <button 
              onClick={() => setActiveGame('none')}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-50' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
            >
              <ChevronRight className="rotate-180" />
            </button>
            <h1 className={`ml-2 font-bold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              {games.find(g => g.id === activeGame)?.title || 'Back to Games'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-800' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <ShareButton 
              title="WI-Play"
              text={`Come play ${games.find(g => g.id === activeGame)?.title} with me!`}
              className={`p-2 transition-colors ${isDarkMode ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}
            />
          </div>
        </nav>
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${activeGame === 'geotrivia' ? "w-full" : "max-w-5xl mx-auto w-full"}`}>
          {activeGame === 'guess-seconds' && <GuessTheSeconds isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'category-timer' && <CategoryTimer isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'password' && <PasswordGame isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'choice-charades' && <ChoiceCharades isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'most-likely-to' && <MostLikelyTo isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'observation-bingo' && <ObservationBingo isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'fake-artist' && <FakeArtist isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'geotrivia' && <GeoTrivia isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'memory-shape' && <MemoryShape isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'color-match' && <ColorMatch isDarkMode={isDarkMode} initialPlayers={players} />}
          {activeGame === 'gauntlet' && (
            <GauntletMode 
              isDarkMode={isDarkMode} 
              onBack={() => setActiveGame('none')} 
              initialStep={gauntletConfig.step}
              initialType={gauntletConfig.type}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="pt-[calc(4rem+env(safe-area-inset-top))] pb-8 px-6 text-center space-y-4 relative">
        <div className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] right-6 flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-yellow-400 border border-slate-800' : 'bg-white text-slate-500 hover:text-indigo-600 border border-slate-200 shadow-sm'}`}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`inline-flex p-1 rounded-3xl shadow-2xl mb-4 border overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 shadow-indigo-900/20 border-slate-800' : 'bg-white shadow-indigo-100 border-slate-100'}`}
        >
          <img 
            src="/logo.png" 
            alt="WI-Play Logo" 
            className="w-20 h-20 object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black tracking-tight"
        >
          WI-<span className="text-indigo-400">Play</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-lg max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
        >
          A collection of fun, minimalist games to play with your friends.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-4"
        >
          <ShareButton 
            title="WI-Play"
            text="Check out these fun party games! Perfect for playing with friends in person or while waiting in line."
            className={`inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all border ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200'}`}
          />
        </motion.div>
      </header>

      {/* Gauntlet Mode CTA */}
      <section className="max-w-4xl mx-auto px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div
            onClick={() => setActiveGame('gauntlet')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveGame('gauntlet');
              }
            }}
            className={`w-full group relative overflow-hidden p-8 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col md:flex-row items-center justify-between text-left cursor-pointer ${
              isDarkMode 
                ? 'bg-gradient-to-br from-indigo-950/50 to-slate-900 border-indigo-500/30 hover:border-indigo-400 shadow-2xl shadow-indigo-900/20' 
                : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200 hover:border-indigo-400 shadow-xl shadow-indigo-100'
            }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className={`p-4 rounded-3xl shadow-lg transition-transform group-hover:scale-110 duration-500 ${isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white'}`}>
                <Zap size={32} fill="currentColor" />
              </div>
              <div className="text-center md:text-left">
                <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  THE <span className="text-indigo-400">GAUNTLET</span>
                </h2>
                <p className={`text-sm font-medium max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Prove Your Skill. Compete in solo challenges on the leaderboard
                </p>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0 relative z-10 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGauntletConfig({ step: 'name', type: 'seconds' });
                  setActiveGame('gauntlet');
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-500 transition-all active:scale-95"
              >
                <span>Enter Now</span>
                <ChevronRight size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGauntletConfig({ step: 'leaderboard', type: 'seconds' });
                  setActiveGame('gauntlet');
                }}
                className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all border-2 active:scale-95 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600' 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Medal size={20} />
                <span>Leaderboard</span>
              </button>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
          </div>
        </motion.div>
      </section>

      {/* Player Management Section */}
      <section className="max-w-4xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-indigo-900/10' : 'bg-white border-slate-100 shadow-xl shadow-indigo-100'}`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Users size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Players</h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Add names to pre-fill games</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <AnimatePresence>
              {players.map((player, index) => (
                <motion.div
                  key={`${player}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
                >
                  <span>{player}</span>
                  <button 
                    onClick={() => removePlayer(index)}
                    className={`p-1 rounded-full hover:bg-rose-500/20 hover:text-rose-500 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length === 0 && (
              <p className={`text-sm italic py-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No players added yet.</p>
            )}
          </div>

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter player name..."
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 placeholder:text-slate-400'}`}
              />
              <UserPlus size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
            <button
              onClick={addPlayer}
              disabled={!newPlayerName.trim()}
              className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center space-x-2 ${!newPlayerName.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'} ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </motion.div>
      </section>
      
      {/* Game Filters */}
      <section className="max-w-4xl mx-auto px-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Users size={18} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
            <span className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Filter by Players</span>
          </div>
          <div className={`flex p-1 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            {[0, 1, 2, 3].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerFilter(count)}
                className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                  playerFilter === count
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {count === 0 ? 'ALL' : `${count}+`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Game Grid */}
      <main className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games
            .filter(game => playerFilter === 0 || game.minPlayers <= playerFilter)
            .map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              whileHover={{ y: -5 }}
              onClick={() => {
                setActiveGame(game.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`group cursor-pointer p-8 rounded-[2.5rem] shadow-sm transition-all border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 hover:shadow-2xl hover:shadow-indigo-500/10 border-slate-800' : 'bg-white hover:shadow-xl hover:shadow-indigo-100 border-slate-100'}`}
            >
              <div className="space-y-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border-2 ${
                  isDarkMode 
                    ? `bg-${game.accent}-500/20 border-${game.accent}-500/30` 
                    : `bg-${game.accent}-500 border-${game.accent}-600 shadow-lg shadow-${game.accent}-500/20`
                }`}>
                  {React.cloneElement(game.icon as React.ReactElement, { 
                    className: `w-8 h-8 ${isDarkMode ? `text-${game.accent}-400` : 'text-white'}` 
                  })}
                </div>
                <div className="space-y-2">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>{game.title}</h3>
                  <p className={`leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{game.description}</p>
                </div>
              </div>
              <div className={`mt-8 flex items-center font-bold ${isDarkMode ? `text-${game.accent}-400` : `text-${game.accent}-600`}`}>
                <span>Play Now</span>
                <ChevronRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}

          {/* Coming Soon Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4 opacity-60 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}
          >
            <Sparkles className={`${isDarkMode ? 'text-slate-600' : 'text-slate-300'} w-10 h-10`} />
            <div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>More Games</h3>
              <p className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}>Coming soon...</p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`text-center py-8 text-sm ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
        <p>© 2026 WI-Play</p>
      </footer>
    </div>
  );

}
