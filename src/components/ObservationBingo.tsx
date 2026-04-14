import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, RotateCcw, Trophy, CheckCircle2, Info, Sparkles, Users, User, Timer, X, Circle, Share2, MapPin, ChevronDown } from 'lucide-react';
import { deflateSync, inflateSync } from 'fflate';
import ShareButton from './ShareButton';

const BINGO_DATA: Record<string, string[]> = {
  "General": [
    "using phone", "hat", "checking watch", "red clothing",
    "yawning", "child laughing", "shopping bag", "glasses",
    "drinking", "blue backpack", "sneakers", "beard",
    "headphones", "talking loudly", "yellow item", "leaning on wall",
    "coffee cup", "suit", "stroller", "colorful umbrella",
    "watch", "ponytail", "hoodie", "backpack",
    "checking phone", "tattoo", "boots", "scarf",
    "looking at sign", "reusable water bottle", "denim jacket",
    "striped shirt", "jewelry", "messenger bag", "sunglasses",
    "eating apple", "green shirt", "running", "dog",
    "riding bike", "white t‑shirt", "belt", "ring",
    "notebook", "pen", "skirt", "dress",
    "sandals", "cap", "keychain", "wallet",
    "tie", "vest", "briefcase", "umbrella"
  ],
  "Mall": [
    "3+ shopping bags", "mannequin", "eating pretzel", "security guard",
    "Sale sign >50%", "trying on shoes", "fountain", "waiting outside",
    "massage chair", "looking at directory", "stroller (2 kids)", "shopping cart",
    "neon sign", "sitting on bench", "coffee cup", "checking watch",
    "backpack", "sunglasses indoors", "colorful umbrella",
    "hoodie", "ponytail", "checking phone", "tattoo",
    "boots", "scarf", "looking at menu", "reusable water bottle",
    "denim jacket", "striped shirt", "jewelry", "messenger bag",
    "food court", "cinema ticket", "looking at jewelry", "toy store bag",
    "trying on hat", "perfume sample", "electronics", "sports store bag",
    "using escalator", "elevator", "looking at map", "gift card",
    "waiting for friend", "phone case", "looking at shoes", "watch store bag",
    "balloon", "pretzel", "window display", "receipt"
  ],
  "Airport": [
    "sleeping at gate", "pilot", "suitcase (ribbon)", "departures board",
    "neck pillow", "running to gate", "service animal", "$15 sandwich",
    "3+ carry-ons", "charging phone", "flight crew", "reading book",
    "child (rolling bag)", "noise-canceling headphones", "looking out window",
    "duty-free bag", "destination shirt", "checking passport",
    "laptop on lap", "buying magazine", "coffee cup", "checking watch",
    "backpack", "hoodie", "ponytail", "using phone",
    "hat", "red clothing", "yawning", "glasses", "drinking",
    "boarding pass", "luggage tag", "looking at watch", "travel pillow",
    "tracksuit", "gate number", "water bottle",
    "using tablet", "camera", "looking at souvenir", "neck strap",
    "jacket", "scarf", "looking at map", "phone",
    "rolling bag", "neck pillow", "flight screen", "passport"
  ],
  "Park": [
    "dog catching frisbee", "on picnic blanket", "jogging with dog", "reading under tree",
    "squirrel eating nut", "playing guitar", "child on swing", "photo of flower",
    "riding bike", "flying kite", "yoga mat", "feeding birds",
    "sun hat", "pushing stroller", "water bottle", "sneakers",
    "backpack", "checking phone", "ponytail", "sunglasses",
    "beard", "laughing", "yellow flower", "sitting on bench", "checking watch",
    "using phone", "hat", "red clothing", "yawning", "glasses",
    "walking dog", "frisbee", "playing catch", "soccer ball",
    "sitting on grass", "book", "t‑shirt", "cap",
    "looking at bird", "camera", "taking selfie", "shorts",
    "sandals", "water bottle", "snack", "picnic basket",
    "kite", "playing with ball", "on path", "looking at tree"
  ],
  "Amusement Center": [
    "winning plushie", "playing air hockey", "claw machine", "bucket of tickets",
    "eating nachos", "Jackpot sound", "racing game", "VR headset",
    "rhythm game", "glowing drink", "photo booth", "lanyard",
    "gaming t‑shirt", "backpack", "checking phone", "ponytail",
    "sneakers", "laughing", "talking loudly", "hoodie",
    "checking watch", "glasses", "drinking", "yellow item", "leaning on wall",
    "playing pinball", "prize", "game menu", "card",
    "using joystick", "button", "looking at screen", "headset",
    "cap", "t‑shirt", "drink", "snack",
    "sitting on stool", "standing", "prize counter", "ticket",
    "bucket of tokens", "game card", "high score", "joystick"
  ],
  "Theme Park": [
    "mouse ears", "churro", "soaked from ride", "fast-pass lanyard",
    "screaming on ride", "giant balloon", "park map", "family t‑shirt",
    "souvenir bucket", "misting fan", "60+ min wait", "stroller",
    "sun hat", "backpack", "checking phone", "ponytail",
    "sneakers", "laughing", "talking loudly", "hoodie",
    "checking watch", "glasses", "drinking", "yellow item", "leaning on wall",
    "poncho", "turkey leg", "photo with character", "souvenir bag",
    "wait time board", "popcorn bucket", "theme park shirt", "sun hat",
    "using locker", "stroller", "looking at map", "phone",
    "lanyard", "badge", "water bottle", "snack",
    "souvenir hat", "cotton candy", "watching parade", "wand"
  ],
  "Restaurant": [
    "sending back dish", "photo of food", "dropping fork", "wine list",
    "eating with chopsticks", "napkin as bib", "paying with cash", "birthday candle",
    "checking reflection", "high chair", "asking for check", "water bottle",
    "suit", "backpack", "checking phone", "ponytail",
    "sneakers", "laughing", "talking loudly", "hoodie",
    "checking watch", "glasses", "drinking", "yellow item", "leaning on wall",
    "eating dessert", "menu", "looking at waiter", "glass",
    "using napkin", "plate", "looking at table", "chair",
    "dress", "shirt", "tie", "watch",
    "looking at phone", "wallet", "paying bill", "receipt",
    "salt shaker", "pepper mill", "specials board", "menu"
  ],
  "High School": [
    "letterman jacket", "running to class", "teacher with papers", "instrument case",
    "students laughing", "school spirit shirt", "heavy backpack", "using locker",
    "sports ball", "lanyard", "skateboarder", "water bottle",
    "glasses", "checking phone", "colorful backpack", "hoodie",
    "ponytail", "sneakers", "denim jacket", "jewelry",
    "messenger bag", "watch", "tattoo", "boots", "scarf",
    "eating lunch", "textbook", "checking schedule", "pen",
    "using calculator", "notebook", "cap", "t‑shirt",
    "sitting on bench", "standing in hallway", "looking at poster", "badge",
    "belt", "ring", "keychain", "wallet",
    "gym bag", "binder", "looking at trophies", "school bag"
  ],
  "University": [
    "carrying laptop", "coffee cup", "riding bike", "university hoodie",
    "thick textbook", "professor", "walking & texting", "studying on grass",
    "yoga mat", "noise-canceling headphones", "messenger bag", "club t‑shirt",
    "longboard", "water bottle", "hat", "beard",
    "watch", "ponytail", "sneakers", "backpack",
    "checking phone", "tattoo", "boots", "scarf", "looking at menu",
    "eating at cafe", "tablet", "looking at map", "badge",
    "library book", "notebook", "university cap", "university t‑shirt",
    "sitting in lecture", "standing in plaza", "looking at flyer", "lanyard",
    "jacket", "bag", "water bottle", "snack",
    "student ID", "research poster", "checking events", "laptop"
  ],
  "Commute": [
    "sleeping on shoulder", "physical newspaper", "running for doors", "bike on board",
    "giving up seat", "large instrument", "smelly snack", "wet umbrella",
    "reading Kindle", "briefcase", "high-vis vest", "skateboard",
    "checking transit app", "coffee in thermos", "winter coat in summer", "rolling bag",
    "talking to self", "colorful hat", "mask", "backpack on front",
    "looking at map", "badge", "water bottle", "snack",
    "reading book", "headphones", "looking out window", "phone"
  ],
  "Coffee Shop": [
    "laptop with stickers", "ordering complex drink", "waiting for order", "reading poetry",
    "reusable cup", "person writing", "photo of latte art", "dog outside",
    "beanie in summer", "sketchbook", "job interview", "pastry",
    "looking for outlet", "large headphones", "scarf indoors", "messenger bag",
    "checking watch", "phone", "notebook", "pen",
    "drinking espresso", "tablet", "talking on laptop", "backpack"
  ],
  "Grocery Store": [
    "overflowing cart", "comparing items", "eating a grape", "reusable bag",
    "looking for aisle", "crying toddler", "stack of coupons", "basket of snacks",
    "pajamas", "flower bouquet", "checking expiration", "rotisserie chicken",
    "waiting at deli", "large pack of water", "hat", "phone",
    "checking list", "wallet", "paying bill", "receipt",
    "frozen pizza", "milk carton", "checking price", "shopping bag"
  ],
  "Nature Walk": [
    "bird with bright feathers", "walking stick", "photo of a bug", "zip-off pants",
    "large camera lens", "hydration pack", "identifying plant", "dog on long leash",
    "sun hat", "binoculars", "field guide", "water bottle",
    "backpack", "checking GPS", "ponytail", "hiking boots",
    "beard", "laughing", "yellow flower", "trail marker", "checking watch",
    "looking at butterfly", "camera", "taking selfie", "snack"
  ],
  "Library": [
    "sleeping on book", "stack of 5+ books", "headphones", "whispering",
    "microfilm reader", "colorful bookmark", "looking at map", "laptop",
    "using printer", "looking for book", "reusable bag", "glasses",
    "notebook", "pen", "checking watch", "ponytail",
    "sweater", "backpack", "reading magazine", "newspaper",
    "using computer", "library card", "checking bulletin", "water bottle"
  ],
  "Beach": [
    "giant inflatable", "building sandcastle", "sun hat", "surfboard",
    "applying sunscreen", "reading in chair", "colorful towel", "playing frisbee",
    "cooler", "sunglasses", "beach ball", "collecting shells",
    "kite", "flip-flops", "snorkel", "metal detector",
    "beach umbrella", "swimsuit", "cover-up", "straw bag",
    "photo of waves", "seagull nearby", "ice cream", "cold drink"
  ],
  "City Street": [
    "hailing taxi", "street map", "eating hot dog", "briefcase",
    "suit", "messenger bag", "looking at storefront", "coffee cup",
    "using crosswalk", "colorful umbrella", "headphones", "backpack",
    "checking phone", "dog", "riding bike", "riding scooter",
    "hat", "shopping bag", "checking watch", "camera",
    "taking selfie", "tourist map", "backpack on front", "stroller"
  ]
};

const LOCATIONS = [...Object.keys(BINGO_DATA), "Custom"];

type PlayerMode = '1' | '2';
type SubMode = 'line' | 'blackout' | 'tictactoe' | 'race5';
type SquareOwner = 'p1' | 'p2' | null;

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

interface Square {
  text: string;
  owner: SquareOwner;
}

interface Move {
  player: 'p1' | 'p2';
  squareText: string;
  action: 'claim' | 'clear';
  time: number;
}

export default function ObservationBingo({ isDarkMode = true, initialPlayers = [] }: { isDarkMode?: boolean, initialPlayers?: string[] }) {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'won' | 'sandbox'>('setup');
  const [playerMode, setPlayerMode] = useState<PlayerMode>('1');
  const [subMode, setSubMode] = useState<SubMode>('line');
  const [p1Name, setP1Name] = useState(initialPlayers[0] || 'Player 1');
  const [p2Name, setP2Name] = useState(initialPlayers[1] || 'Player 2');
  const [location, setLocation] = useState<string>("General");
  const [gridSize, setGridSize] = useState<3 | 4 | 5>(3);
  const [grid, setGrid] = useState<Square[]>([]);
  const [timer, setTimer] = useState(0);
  const [winner, setWinner] = useState<SquareOwner>(null);
  const [boardCode, setBoardCode] = useState("");
  const [isCustomBoard, setIsCustomBoard] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [customWordsInput, setCustomWordsInput] = useState("");

  // Auto-set location when a valid code is typed/pasted
  useEffect(() => {
    if (customCodeInput.length >= 11) {
      const decoded = decodeBoard(customCodeInput);
      if (decoded) {
        setLocation(decoded.locName);
        setGridSize(decoded.size as 3 | 4 | 5);
      }
    }
  }, [customCodeInput]);

  const [error, setError] = useState("");
  const [sandboxGrid, setSandboxGrid] = useState<string[]>(Array(gridSize * gridSize).fill(""));
  const [customSquareText, setCustomSquareText] = useState("");
  
  useEffect(() => {
    setSandboxGrid(Array(gridSize * gridSize).fill(""));
  }, [gridSize]);

  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const [allowClearing, setAllowClearing] = useState(true);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [moves, setMoves] = useState<Move[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const encodeBoard = (items: string[], size: number) => {
    const locIdx = LOCATIONS.indexOf(location);
    
    // Try to find indices in predefined list
    const currentItems = BINGO_DATA[location] || [];
    const indices = items.map(text => currentItems.indexOf(text));
    
    // If all items are in the predefined list and it's not the "Custom"location
    if (location !== "Custom"&& indices.every(idx => idx !== -1)) {
      return ALPHABET[locIdx] + ALPHABET[size] + indices.map(i => ALPHABET[i]).join('');
    }
    
    // Otherwise, use a "Compressed Long Code"format
    // Format: Z + Size + Base64(Deflate(JSON([location, ...items])))
    try {
      const data = { l: location, s: size, w: items };
      const json = JSON.stringify(data);
      const compressed = deflateSync(new TextEncoder().encode(json));
      // Convert Uint8Array to Base64 safely
      let binary = '';
      const bytes = new Uint8Array(compressed);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);
      return "Z"+ ALPHABET[size] + b64;
    } catch (e) {
      return "CUSTOM";
    }
  };

  const decodeBoard = (code: string) => {
    if (!code || code.length < 3) return null;

    // Handle Compressed Long Code (Base64 + Deflate)
    if (code.startsWith("Z")) {
      try {
        const size = ALPHABET.indexOf(code[1]);
        const b64 = code.substring(2);
        // Convert Base64 to Uint8Array
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const decompressed = inflateSync(bytes);
        const json = new TextDecoder().decode(decompressed);
        const data = JSON.parse(json);
        return { 
          locName: data.l, 
          itemTexts: data.w, 
          size: data.s || size 
        };
      } catch (e) {
        return null;
      }
    }

    // Handle Short Code (Index-based)
    if (code === "CUSTOM") return null;
    const locIdx = ALPHABET.indexOf(code[0]);
    const size = ALPHABET.indexOf(code[1]);
    if (locIdx === -1 || locIdx >= LOCATIONS.length) return null;
    if (size < 3 || size > 5) return null;
    
    const expectedLength = 2 + size * size;
    if (code.length !== expectedLength) return null;

    const locName = LOCATIONS[locIdx];
    const itemIndices = code.substring(2).split('').map(char => ALPHABET.indexOf(char));
    const currentItems = BINGO_DATA[locName];
    
    if (!currentItems || itemIndices.some(i => i === -1 || i >= currentItems.length)) return null;
    return { locName, itemIndices, size };
  };

  const generateGrid = (code?: string) => {
    let selectedIndices: number[] | null = null;
    let selectedTexts: string[] | null = null;
    let custom = false;
    let targetLocation = location;
    let targetSize = gridSize;
    
    if (code && code !== "CUSTOM") {
      const decoded = decodeBoard(code);
      if (decoded) {
        selectedIndices = (decoded as any).itemIndices || null;
        selectedTexts = (decoded as any).itemTexts || null;
        targetLocation = decoded.locName;
        targetSize = decoded.size as 3 | 4 | 5;
        setLocation(targetLocation);
        setGridSize(targetSize);
        custom = true;
      }
    }

    const currentItems = targetLocation === "Custom"
      ? customWordsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : BINGO_DATA[targetLocation];

    if (!selectedIndices && !selectedTexts) {
      if (targetLocation === "Custom"&& currentItems.length < targetSize * targetSize) {
        setError(`Please provide at least ${targetSize * targetSize} words for a ${targetSize}x${targetSize} board.`);
        return;
      }
      const indices = Array.from({ length: currentItems.length }, (_, i) => i);
      const shuffled = indices.sort(() => Math.random() - 0.5);
      selectedIndices = shuffled.slice(0, targetSize * targetSize);
      custom = false;
    }

    const selected = selectedIndices 
      ? selectedIndices.map(idx => ({ text: currentItems[idx], owner: null }))
      : selectedTexts!.map(text => ({ text, owner: null }));
    
    const newCode = selectedIndices 
      ? encodeBoard(selectedIndices.map(idx => currentItems[idx]), targetSize) 
      : encodeBoard(selectedTexts!, targetSize);
    
    setGrid(selected);
    setBoardCode(newCode);
    setIsCustomBoard(custom);
    setTimer(0);
    setWinner(null);
    setMoves([]);
    setShowHistory(false);
    setError("");
    setGameState('playing');
    
    if (playerMode === '1') {
      startTimer();
    } else {
      startTimer();
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimer();
  }, []);

  const checkWin = (newGrid: Square[]) => {
    const size = gridSize;
    const patterns: number[][] = [];
    
    // Rows
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) row.push(i * size + j);
      patterns.push(row);
    }
    // Cols
    for (let i = 0; i < size; i++) {
      const col = [];
      for (let j = 0; j < size; j++) col.push(j * size + i);
      patterns.push(col);
    }
    // Diagonals
    const diag1 = [];
    const diag2 = [];
    for (let i = 0; i < size; i++) {
      diag1.push(i * size + i);
      diag2.push(i * size + (size - 1 - i));
    }
    patterns.push(diag1);
    patterns.push(diag2);

    if (playerMode === '1') {
      if (subMode === 'line') {
        const won = patterns.some(pattern => pattern.every(idx => newGrid[idx].owner === 'p1'));
        if (won) handleWin('p1');
      } else if (subMode === 'blackout') {
        const won = newGrid.every(square => square.owner === 'p1');
        if (won) handleWin('p1');
      }
    } else {
      if (subMode === 'tictactoe') {
        const p1Won = patterns.some(pattern => pattern.every(idx => newGrid[idx].owner === 'p1'));
        const p2Won = patterns.some(pattern => pattern.every(idx => newGrid[idx].owner === 'p2'));
        
        if (p1Won) handleWin('p1');
        else if (p2Won) handleWin('p2');
      } else if (subMode === 'race5') {
        const p1Count = newGrid.filter(s => s.owner === 'p1').length;
        const p2Count = newGrid.filter(s => s.owner === 'p2').length;
        
        if (p1Count >= 5) handleWin('p1');
        else if (p2Count >= 5) handleWin('p2');
      }
    }
  };

  const handleWin = (player: SquareOwner) => {
    setWinner(player);
    setGameState('won');
    setShowWinScreen(true);
    stopTimer();
  };

  const handleSquareClick = (index: number, player: 'p1' | 'p2') => {
    if (gameState !== 'playing') return;

    const newGrid = [...grid];
    const currentOwner = newGrid[index].owner;

    if (playerMode === '1') {
      const action = currentOwner === 'p1' ? 'clear' : 'claim';
      newGrid[index].owner = currentOwner === 'p1' ? null : 'p1';
      setMoves(prev => [...prev, { player: 'p1', squareText: newGrid[index].text, action, time: timer }]);
    } else {
      if (currentOwner !== null && !allowClearing) return;
      if (currentOwner === null) {
        newGrid[index].owner = player;
        setMoves(prev => [...prev, { player, squareText: newGrid[index].text, action: 'claim', time: timer }]);
      } else {
        newGrid[index].owner = null; // Clear
        setMoves(prev => [...prev, { player, squareText: newGrid[index].text, action: 'clear', time: timer }]);
      }
    }

    setGrid(newGrid);
    checkWin(newGrid);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center space-y-6 max-w-md w-full"
        >
          <div className="space-y-2">
            <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Observation Bingo
            </h2>
            <p className={`font-medium pt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Choose your challenge</p>
            <div className={`rounded-2xl p-4 border mt-4 transition-colors duration-300 ${isDarkMode ? 'bg-rose-900/20 border-rose-800/30' : 'bg-rose-50 border-rose-100'}`}>
              <div className={`flex items-center justify-center space-x-2 font-bold mb-3 text-sm ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                <Sparkles size={16} />
                <span>How to Play</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>1</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Spot items in the crowd to mark your board. Get a line or blackout to win!</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>2</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>In Duo mode, if an opponent has claimed a square, you can clear it by spotting the item again.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>3</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Spot it once more to claim it for yourself! First to reach the goal wins.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`space-y-4 p-8 rounded-[2.5rem] shadow-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-slate-100 shadow-rose-100'}`}>
            <div className="space-y-3">
              <label className={`text-sm font-black uppercase tracking-widest block text-left ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Location</label>
              <div className="relative">
                <select 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full p-4 pl-12 rounded-2xl border outline-none appearance-none font-bold transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-50 focus:border-rose-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500'}`}
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <MapPin size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <ChevronDown size={20} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {location === "Custom"&& (
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest block text-left ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Custom Word List</label>
                <textarea 
                  value={customWordsInput}
                  onChange={(e) => setCustomWordsInput(e.target.value)}
                  placeholder="Enter words separated by commas (e.g. Tree, Car, Bird...)"
                  className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all min-h-[100px] text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-50 focus:border-rose-500 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500 placeholder:text-slate-400'}`}
                />
                <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Need at least {gridSize * gridSize} words.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className={`text-xs font-black uppercase tracking-widest block text-left ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Board Size</label>
              <div className="grid grid-cols-3 gap-3">
                {[3, 4, 5].map(size => (
                  <button 
                    key={size}
                    onClick={() => setGridSize(size as 3 | 4 | 5)}
                    className={`p-4 rounded-2xl border-2 font-bold transition-all ${gridSize === size ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/20' : isDarkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-200 text-slate-500 hover:border-rose-400'}`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className={`text-xs font-black uppercase tracking-widest block text-left ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Players</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setPlayerMode('1'); setSubMode('line'); }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center space-y-2 transition-all ${playerMode === '1' ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/20' : isDarkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-200 text-slate-500 hover:border-rose-400'}`}
                >
                  <User size={24} />
                  <span className="font-bold">Solo</span>
                </button>
                <button 
                  onClick={() => { setPlayerMode('2'); setSubMode('tictactoe'); }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center space-y-2 transition-all ${playerMode === '2' ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/20' : isDarkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-200 text-slate-500 hover:border-rose-400'}`}
                >
                  <Users size={24} />
                  <span className="font-bold">Duo</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className={`text-xs font-black uppercase tracking-widest block text-left ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Game Mode</label>
              <div className="grid grid-cols-1 gap-3">
                {playerMode === '1' ? (
                  <>
                    <button 
                      onClick={() => setSubMode('line')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${subMode === 'line' ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/20' : isDarkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-200 text-slate-500 hover:border-rose-400'}`}
                    >
                      <div className="font-bold text-lg">Standard</div>
                      <div className="text-xs opacity-70">Get {gridSize} in a row to win</div>
                    </button>
                    <button 
                      onClick={() => setSubMode('blackout')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${subMode === 'blackout' ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/20' : isDarkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-200 text-slate-500 hover:border-rose-400'}`}
                    >
                      <div className="font-bold text-lg">Blackout</div>
                      <div className="text-xs opacity-70">Clear the entire board</div>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setSubMode('tictactoe')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${subMode === 'tictactoe' ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/20' : isDarkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-200 text-slate-500 hover:border-rose-400'}`}
                    >
                      <div className="font-bold text-lg">Tic Tac Toe</div>
                      <div className="text-xs opacity-70">Get {gridSize} in a row! Claim, Clear, and Steal squares!</div>
                    </button>
                    <button 
                      onClick={() => setSubMode('race5')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${subMode === 'race5' ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/20' : isDarkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-200 text-slate-500 hover:border-rose-400'}`}
                    >
                      <div className="font-bold text-lg">Race to 5</div>
                      <div className="text-xs opacity-70">First player to claim 5 squares wins</div>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className={`text-xs font-black uppercase tracking-widest block text-left ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Board Setup (Optional)</label>
              <div className="space-y-2">
                <input 
                  type="text"
                  value={customCodeInput}
                  onChange={(e) => setCustomCodeInput(e.target.value)}
                  placeholder="Enter Board Code (e.g. A1B2C3D4E)"
                  className={`w-full p-4 rounded-2xl border outline-none font-mono text-center transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-50 focus:border-rose-500 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500 placeholder:text-slate-400'}`}
                  maxLength={1000}
                />
                <button 
                  onClick={() => setGameState('sandbox')}
                  className={`w-full py-3 border-2 border-dashed rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:border-rose-500/50 hover:text-rose-400' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-500/50 hover:text-rose-600'}`}
                >
                  <Sparkles size={14} />
                  <span>Design Your Own Board</span>
                </button>
              </div>
            </div>

            {playerMode === '2' && (
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest block text-left ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Settings</label>
                <button 
                  onClick={() => setAllowClearing(!allowClearing)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${allowClearing ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/20' : isDarkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-200 text-slate-500 hover:border-rose-400'}`}
                >
                  <div className="flex items-center space-x-3">
                    <RotateCcw size={20} />
                    <span className="font-bold">Allow Clearing Squares</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${allowClearing ? 'bg-rose-500' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${allowClearing ? 'left-5' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            )}

            <button 
              onClick={() => generateGrid(customCodeInput)}
              className="w-full py-5 bg-rose-600 text-white rounded-3xl font-black text-xl shadow-lg shadow-rose-900/20 hover:bg-rose-500 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles size={24} />
              <span>Start Game</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'sandbox') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className={`text-3xl font-black uppercase italic ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Board <span className="text-rose-500">Designer</span></h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tap a square to pick an item</p>
        </div>

        <div className={`w-full max-w-md grid gap-3 ${gridSize === 3 ? 'grid-cols-3' : gridSize === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {sandboxGrid.map((text, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectingIndex(idx);
                setCustomSquareText(text);
              }}
              className={`aspect-square border-2 rounded-3xl p-3 flex items-center justify-center text-center text-[10px] font-bold transition-all ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-rose-500/50' 
                  : 'bg-white border-slate-100 text-slate-600 hover:border-rose-500/50 shadow-sm shadow-rose-100'
              }`}
            >
              {text || <span className="opacity-30 italic">Empty</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-col w-full max-w-md space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                const items = location === "Custom"
                  ? customWordsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
                  : BINGO_DATA[location];
                if (items.length < gridSize * gridSize) return;
                const indices = Array.from({ length: items.length }, (_, i) => i);
                const shuffled = indices.sort(() => Math.random() - 0.5);
                const selected = shuffled.slice(0, gridSize * gridSize).map(i => items[i]);
                setSandboxGrid(selected);
              }}
              className={`py-4 rounded-2xl font-black transition-all border-2 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-rose-500/50' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-500/50'
              }`}
            >
              Shuffle
            </button>
            <button 
              onClick={() => {
              const code = encodeBoard(sandboxGrid, gridSize);
              setCustomCodeInput(code);
              generateGrid(code);
            }}
            disabled={sandboxGrid.some(s => !s)}
            className="py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-900/20 hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Play This Board
          </button>
          </div>
          <button 
            onClick={() => setGameState('setup')}
            className={`w-full py-4 rounded-2xl font-black transition-all ${
              isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
        </div>

        <AnimatePresence>
          {selectingIndex !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 rounded-[2.5rem] w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col border border-slate-800"
              >
                <div className={`p-6 border-b flex justify-between items-center transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                  <h3 className={`font-black uppercase ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Edit Square</h3>
                  <button onClick={() => setSelectingIndex(null)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20} /></button>
                </div>
                
                <div className="p-4 border-b border-slate-800 bg-slate-900/30 space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Custom Text</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text"
                      value={customSquareText}
                      onChange={(e) => setCustomSquareText(e.target.value)}
                      placeholder="Type custom text..."
                      className="flex-1 p-3 rounded-xl bg-slate-800 border border-transparent focus:border-rose-500 outline-none text-sm text-slate-100"
                    />
                    <button 
                      onClick={() => {
                        const newSandbox = [...sandboxGrid];
                        newSandbox[selectingIndex!] = customSquareText;
                        setSandboxGrid(newSandbox);
                        setSelectingIndex(null);
                      }}
                      className="px-4 bg-rose-600 text-white rounded-xl font-bold text-xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Pick from {location}</label>
                  {location !== "Custom"? (
                    BINGO_DATA[location].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const newSandbox = [...sandboxGrid];
                          newSandbox[selectingIndex!] = item;
                          setSandboxGrid(newSandbox);
                          setSelectingIndex(null);
                        }}
                        className={`w-full p-4 text-left rounded-2xl font-bold text-sm transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-rose-900/40 hover:text-rose-400 text-slate-300' : 'bg-slate-50 hover:bg-rose-100 hover:text-rose-600 text-slate-600'}`}
                      >
                        {item}
                      </button>
                    ))
                  ) : (
                    customWordsInput.split(',').map(s => s.trim()).filter(s => s.length > 0).map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const newSandbox = [...sandboxGrid];
                          newSandbox[selectingIndex!] = item;
                          setSandboxGrid(newSandbox);
                          setSelectingIndex(null);
                        }}
                        className={`w-full p-4 text-left rounded-2xl font-bold text-sm transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-rose-900/40 hover:text-rose-400 text-slate-300' : 'bg-slate-50 hover:bg-rose-100 hover:text-rose-600 text-slate-600'}`}
                      >
                        {item}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
      <div className="w-full max-w-md flex justify-between items-center px-2">
        <div className="flex flex-col">
          <span className={`text-base sm:text-lg font-black uppercase tracking-widest ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
            {playerMode === '1' ? (subMode === 'line' ? 'Line Mode' : 'Blackout Mode') : (subMode === 'tictactoe' ? 'Tic Tac Toe' : 'Race to 5')}
          </span>
          <h3 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Observation Bingo</h3>
          <span className={`text-base sm:text-lg font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{location}</span>
          {!boardCode.startsWith('Z') && boardCode !== 'CUSTOM' && (
            <span className={`text-sm sm:text-base font-mono uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Code: {boardCode}</span>
          )}
          <span className={`text-sm sm:text-base font-bold uppercase tracking-widest ${isCustomBoard ? (isDarkMode ? 'text-rose-400' : 'text-rose-600') : (isDarkMode ? 'text-slate-600' : 'text-slate-400')}`}>
            {isCustomBoard ? 'Custom Board' : 'Randomized Board'}
          </span>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-sm border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-rose-100'}`}>
          <Timer size={16} className="text-rose-500 sm:w-5 sm:h-5"/>
          <span className={`font-mono font-bold text-lg sm:text-xl ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{formatTime(timer)}</span>
        </div>
      </div>

      <div className="w-full max-w-md relative">
        <AnimatePresence>
          {gameState === 'won' && showWinScreen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm rounded-[2rem] sm:rounded-[2.5rem] border-4 shadow-2xl p-4 sm:p-8 text-center transition-colors duration-300 overflow-y-auto ${isDarkMode ? 'bg-slate-900/95 border-rose-600 shadow-black/50' : 'bg-white/95 border-rose-500 shadow-rose-200'}`}
            >
              <div className="flex flex-col items-center justify-center w-full py-2 sm:py-4">
                <button 
                  onClick={() => setShowWinScreen(false)}
                  className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-2 transition-colors z-10 ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <X size={20} className="sm:w-6 sm:h-6"/>
                </button>
                <Trophy className="text-rose-500 w-10 h-10 sm:w-20 sm:h-20 mb-1 sm:mb-4"/>
                <h3 className={`text-xl sm:text-4xl font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                  {playerMode === '1' ? 'VICTORY!' : (winner === 'p1' ? `${p1Name.toUpperCase()} WINS!` : `${p2Name.toUpperCase()} WINS!`)}
                </h3>
                <p className={`font-bold mt-0.5 sm:mt-2 text-sm sm:text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Time: {formatTime(timer)}</p>
                <div className="flex flex-col w-full space-y-2 sm:space-y-3 mt-3 sm:mt-8">
                  <ShareButton 
                    title="Observation Bingo Results"
                    text={`I just played Observation Bingo (${playerMode === '1' ? (subMode === 'line' ? 'Line' : subMode === 'blackout' ? 'Blackout' : 'Custom') : (subMode === 'tictactoe' ? 'Tic Tac Toe' : 'Race to 5')} mode)! 🏆\n\nTime: ${formatTime(timer)}\n\n${playerMode === '2' ? (winner === 'p1' ? `${p1Name} won!` : `${p2Name} won!`) : ''}${!boardCode.startsWith('Z') && boardCode !== 'CUSTOM' ? `\n\nBoard Code: ${boardCode}` : ''}`}
                    className="w-full py-2.5 sm:py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 text-xs sm:text-base"
                  />
                  <button 
                    onClick={() => generateGrid()}
                    className="w-full py-2.5 sm:py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-colors flex items-center justify-center space-x-2 text-xs sm:text-base"
                  >
                    <RotateCcw size={16} className="sm:w-5 sm:h-5"/>
                    <span>Play Again</span>
                  </button>
                  <button 
                    onClick={() => setGameState('setup')}
                    className={`w-full py-2.5 sm:py-4 rounded-2xl font-black transition-colors text-xs sm:text-base ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Change Mode
                  </button>
                  <button 
                    onClick={() => setShowHistory(true)}
                    className={`w-full py-2.5 sm:py-4 border-2 rounded-2xl font-black transition-colors flex items-center justify-center space-x-2 text-xs sm:text-base ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-rose-500/50 hover:text-rose-400' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-500/50 hover:text-rose-600'}`}
                  >
                    <RotateCcw size={16} className="rotate-90 sm:w-5 sm:h-5"/>
                    <span>View Move History</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`grid ${gridSize === 5 ? 'gap-1.5 sm:gap-3' : 'gap-2 sm:gap-3'} ${gridSize === 3 ? 'grid-cols-3' : gridSize === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {grid.map((square, index) => (
            <div key={index} className="relative aspect-square">
              <div className={`
                w-full h-full p-1 sm:p-3 rounded-xl sm:rounded-3xl border-2 transition-all flex flex-col items-center justify-center text-center relative overflow-hidden
                ${square.owner === 'p1' ? 'bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-900/20' : 
                  square.owner === 'p2' ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-900/20' : 
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 shadow-sm' : 'bg-white border-slate-100 text-slate-600 shadow-sm shadow-rose-100'}
              `}>
                {/* Split background for empty squares in 2-player mode */}
                {!square.owner && playerMode === '2' && (
                  <div className="absolute inset-0 flex flex-col opacity-10">
                    <div className={`flex-1 bg-rose-500 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`} />
                    <div className="flex-1 bg-indigo-500"/>
                  </div>
                )}

                <span className={`
                  ${gridSize === 5 ? 'text-[10px] sm:text-sm' : gridSize === 4 ? 'text-sm sm:text-xl' : 'text-base sm:text-3xl'}
                  font-bold leading-[1.1] relative z-10 break-normal px-1
                  ${square.owner ? 'text-white' : isDarkMode ? 'text-slate-300' : 'text-slate-700'}
                `}>
                  {square.text}
                </span>
                
                {square.owner === 'p1' && <X className="absolute top-0.5 right-0.5 text-white opacity-40 w-1/4 h-1/4 max-w-[20px] max-h-[20px]"/>}
                {square.owner === 'p2' && <Circle className="absolute top-0.5 right-0.5 text-white opacity-40 w-1/4 h-1/4 max-w-[20px] max-h-[20px]"/>}
              </div>

              {/* Interaction Layer */}
              <div className="absolute inset-0 z-20">
                {playerMode === '1' ? (
                  <button 
                    onClick={() => handleSquareClick(index, 'p1')}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col">
                    <button 
                      onClick={() => handleSquareClick(index, 'p1')}
                      className="flex-1 w-full bg-rose-500/0 hover:bg-rose-500/10 transition-colors rounded-t-xl sm:rounded-t-3xl flex items-center justify-center group relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] sm:text-xs font-black text-rose-600 uppercase relative z-10">P1</span>
                    </button>
                    <button 
                      onClick={() => handleSquareClick(index, 'p2')}
                      className="flex-1 w-full bg-indigo-500/0 hover:bg-indigo-500/10 transition-colors rounded-b-xl sm:rounded-b-3xl flex items-center justify-center group relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] sm:text-xs font-black text-indigo-600 uppercase relative z-10">P2</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-3 sm:space-y-4 w-full max-w-md">
        {gameState === 'playing' && moves.length > 0 && (
          <button 
            onClick={() => setShowHistory(true)}
            className={`text-xs sm:text-sm font-black uppercase tracking-widest transition-colors flex items-center space-x-1 ${isDarkMode ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
          >
            <RotateCcw size={12} className="rotate-90 sm:w-4 sm:h-4"/>
            <span>View Move History ({moves.length})</span>
          </button>
        )}
        <div className="flex space-x-2 sm:space-x-3 w-full">
          {gameState === 'won' && !showWinScreen ? (
            <button 
              onClick={() => setShowWinScreen(true)}
              className="flex-1 py-3 sm:py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Trophy size={18} className="sm:w-5 sm:h-5"/>
              <span>Show Results</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => generateGrid()}
                className={`flex-1 py-3 sm:py-4 border-2 rounded-2xl font-black shadow-sm transition-all flex items-center justify-center space-x-2 text-sm sm:text-base ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-rose-500/50 hover:text-rose-400' : 'bg-white border-slate-100 text-slate-500 hover:border-rose-400 hover:text-rose-600'}`}
              >
                <RotateCcw size={18} className="sm:w-5 sm:h-5"/>
                <span>Reset</span>
              </button>
              <button 
                onClick={() => setGameState('setup')}
                className={`flex-1 py-3 sm:py-4 border-2 rounded-2xl font-black shadow-sm transition-all text-sm sm:text-base ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-rose-500/50 hover:text-rose-400' : 'bg-white border-slate-100 text-slate-500 hover:border-rose-400 hover:text-rose-600'}`}
              >
                Mode
              </button>
            </>
          )}
        </div>

        {playerMode === '2' && (
          <div className={`flex items-center space-x-4 sm:space-x-8 p-3 sm:p-4 rounded-3xl shadow-sm border w-full justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-rose-100'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-rose-500"/>
              <span className={`text-[10px] sm:text-xs font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{p1Name} (X)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-indigo-500"/>
              <span className={`text-[10px] sm:text-xs font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{p2Name} (O)</span>
            </div>
          </div>
        )}

        <div className={`flex items-center space-x-2 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          <Info size={10} className="sm:w-3 sm:h-3"/>
          <span>Observation Challenge</span>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`rounded-[2.5rem] w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col border shadow-2xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-slate-100 shadow-rose-100'}`}
            >
              <div className={`p-6 border-b flex justify-between items-center transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex flex-col">
                  <h3 className={`font-black uppercase ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Move History</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{moves.length} total actions</span>
                </div>
                <button onClick={() => setShowHistory(false)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {moves.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <RotateCcw size={48} className={`mx-auto ${isDarkMode ? 'text-slate-800' : 'text-slate-100'}`} />
                    <p className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No moves recorded yet</p>
                  </div>
                ) : (
                  moves.map((move, idx) => (
                    <div key={idx} className="flex items-center space-x-4 group">
                      <div className="flex flex-col items-center space-y-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm ${
                          move.player === 'p1' ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}>
                          {move.player === 'p1' ? p1Name.substring(0, 2).toUpperCase() : p2Name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className={`w-0.5 h-4 group-last:hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                      </div>
                      <div className={`flex-1 rounded-2xl p-3 border transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:border-rose-200'}`}>
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            move.action === 'claim' ? 'text-green-400' : 'text-rose-400'
                          }`}>
                            {move.action}ed
                          </span>
                          <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{formatTime(move.time)}</span>
                        </div>
                        <p className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{move.squareText}</p>
                      </div>
                    </div>
                  )).reverse()
                )}
              </div>
              <div className={`p-6 border-t transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <button 
                  onClick={() => setShowHistory(false)}
                  className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all ${isDarkMode ? 'bg-slate-50 text-slate-950 hover:bg-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
