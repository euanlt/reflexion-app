"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Trophy, Sparkles, Timer } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const GAME_TILES = [
  { id: 1, emoji: '🍎', color: 'from-red-400 to-red-600', matched: false },
  { id: 2, emoji: '🍎', color: 'from-red-400 to-red-600', matched: false },
  { id: 3, emoji: '🌟', color: 'from-yellow-400 to-yellow-600', matched: false },
  { id: 4, emoji: '🌟', color: 'from-yellow-400 to-yellow-600', matched: false },
  { id: 5, emoji: '🎈', color: 'from-pink-400 to-pink-600', matched: false },
  { id: 6, emoji: '🎈', color: 'from-pink-400 to-pink-600', matched: false },
  { id: 7, emoji: '🌸', color: 'from-purple-400 to-purple-600', matched: false },
  { id: 8, emoji: '🌸', color: 'from-purple-400 to-purple-600', matched: false },
  { id: 9, emoji: '🦋', color: 'from-blue-400 to-blue-600', matched: false },
  { id: 10, emoji: '🦋', color: 'from-blue-400 to-blue-600', matched: false },
  { id: 11, emoji: '🎵', color: 'from-green-400 to-green-600', matched: false },
  { id: 12, emoji: '🎵', color: 'from-green-400 to-green-600', matched: false },
];

export default function MemoryGamePage() {
  const [tiles, setTiles] = useState(GAME_TILES);
  const [flippedTiles, setFlippedTiles] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    setIsLoaded(true);
    // Shuffle tiles on component mount
    setTiles(prev => [...prev].sort(() => Math.random() - 0.5));
    // Load best score from localStorage
    const stored = localStorage.getItem('memoryGameBestScore');
    if (stored) setBestScore(parseInt(stored));
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameComplete) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameComplete]);

  useEffect(() => {
    if (flippedTiles.length === 2) {
      const [first, second] = flippedTiles;
      const firstTile = tiles.find(t => t.id === first);
      const secondTile = tiles.find(t => t.id === second);

      if (firstTile?.emoji === secondTile?.emoji) {
        // Match found
        setShowMatch(true);
        setTimeout(() => {
          setTiles(prev => prev.map(tile => 
            tile.id === first || tile.id === second 
              ? { ...tile, matched: true }
              : tile
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedTiles([]);
          setShowMatch(false);
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setFlippedTiles([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedTiles, tiles]);

  useEffect(() => {
    if (matchedPairs === 6) {
      setGameComplete(true);
      setIsPlaying(false);
      // Save best score
      if (!bestScore || moves < bestScore) {
        setBestScore(moves);
        localStorage.setItem('memoryGameBestScore', moves.toString());
      }
    }
  }, [matchedPairs, moves, bestScore]);

  const handleTileClick = (tileId: number) => {
    if (!isPlaying && moves === 0) {
      setIsPlaying(true);
    }
    
    if (flippedTiles.length === 2) return;
    if (flippedTiles.includes(tileId)) return;
    if (tiles.find(t => t.id === tileId)?.matched) return;

    setFlippedTiles(prev => [...prev, tileId]);
  };

  const resetGame = () => {
    setTiles(GAME_TILES.map(t => ({ ...t, matched: false })).sort(() => Math.random() - 0.5));
    setFlippedTiles([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameComplete(false);
    setTime(0);
    setIsPlaying(false);
    setShowMatch(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTileVisible = (tileId: number) => {
    const tile = tiles.find(t => t.id === tileId);
    return flippedTiles.includes(tileId) || tile?.matched;
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="p-8 rounded-3xl text-center max-w-md w-full shadow-2xl bg-white/90 backdrop-blur">
          <div className="relative">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-bounce" />
            <Sparkles className="w-8 h-8 text-yellow-400 absolute top-0 right-1/4 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute top-4 left-1/4 animate-pulse delay-200" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Excellent!
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-600">
              Completed in <span className="font-bold text-blue-600">{moves} moves</span>
            </p>
            <p className="text-gray-600">
              Time: <span className="font-bold text-green-600">{formatTime(time)}</span>
            </p>
            {bestScore === moves && (
              <p className="text-sm text-yellow-600 font-semibold mt-2">
                🎉 New Best Score!
              </p>
            )}
          </div>
          <div className="space-y-4">
            <Button 
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-2xl text-lg font-medium shadow-lg transform transition hover:scale-105"
            >
              Play Again
            </Button>
            <Link href="/exercises">
              <Button 
                variant="outline"
                className="w-full py-4 rounded-2xl text-lg font-medium border-2 hover:bg-gray-50"
              >
                Back to Exercises
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur border-b border-gray-200">
        <Link href="/exercises" className="transform transition hover:scale-110">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Memory Match</h1>
        <button onClick={resetGame} className="transform transition hover:scale-110 hover:rotate-180 duration-300">
          <RotateCcw className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="p-6">
        {/* Game Stats */}
        <div className={`flex justify-around items-center mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
            <div className="text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{moves}</p>
              <p className="text-xs text-gray-600">Moves</p>
            </div>
          </Card>
          <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
            <div className="text-center flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-600" />
              <p className="text-2xl font-bold text-gray-700">{formatTime(time)}</p>
            </div>
          </Card>
          <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
            <div className="text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{matchedPairs}/6</p>
              <p className="text-xs text-gray-600">Pairs</p>
            </div>
          </Card>
        </div>
        
        {/* Match indicator */}
        {showMatch && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg animate-bounce shadow-xl">
              Perfect Match! 🎉
            </div>
          </div>
        )}

        {/* Game Grid */}
        <div className={`grid grid-cols-3 gap-4 max-w-sm mx-auto transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {tiles.map((tile, index) => {
            const isVisible = isTileVisible(tile.id);
            const isFlipped = flippedTiles.includes(tile.id) && !tile.matched;
            
            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                className={cn(
                  "relative aspect-square rounded-2xl text-5xl font-bold transition-all duration-500 transform-gpu",
                  "shadow-lg hover:shadow-xl",
                  isVisible && tile.matched && "scale-90",
                  !isVisible && "hover:scale-105 active:scale-95",
                  flippedTiles.length === 2 && !flippedTiles.includes(tile.id) && "cursor-not-allowed"
                )}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
                disabled={flippedTiles.length === 2 && !flippedTiles.includes(tile.id)}
              >
                <div className={cn(
                  "absolute inset-0 rounded-2xl transition-all duration-500 backface-hidden",
                  "flex items-center justify-center",
                  isVisible ? "rotate-y-180" : "rotate-y-0",
                  "bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300"
                )}>
                  <span className="text-3xl text-gray-400">?</span>
                </div>
                <div className={cn(
                  "absolute inset-0 rounded-2xl transition-all duration-500 backface-hidden",
                  "flex items-center justify-center",
                  isVisible ? "rotate-y-0" : "rotate-y-180",
                  tile.matched 
                    ? "bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-green-500" 
                    : cn("bg-gradient-to-br", tile.color, "border-2 border-white"),
                  isFlipped && "animate-pulse"
                )}>
                  <span className={cn(
                    "drop-shadow-md",
                    tile.matched && "animate-bounce"
                  )}>
                    {tile.emoji}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Instructions & Best Score */}
        <div className={`mt-8 space-y-4 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              How to Play
            </h3>
            <p className="text-gray-700 text-sm">
              Tap tiles to flip them over and find matching pairs. Try to complete the game in as few moves as possible!
            </p>
          </Card>
          
          {bestScore && (
            <Card className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
              <p className="text-center text-sm">
                <span className="text-gray-600">Best Score: </span>
                <span className="font-bold text-yellow-700">{bestScore} moves</span>
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}