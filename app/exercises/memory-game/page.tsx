"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import Link from 'next/link';

const GAME_TILES = [
  { id: 1, emoji: '🍎', matched: false },
  { id: 2, emoji: '🍎', matched: false },
  { id: 3, emoji: '🌟', matched: false },
  { id: 4, emoji: '🌟', matched: false },
  { id: 5, emoji: '🎈', matched: false },
  { id: 6, emoji: '🎈', matched: false },
  { id: 7, emoji: '🌸', matched: false },
  { id: 8, emoji: '🌸', matched: false },
  { id: 9, emoji: '🦋', matched: false },
  { id: 10, emoji: '🦋', matched: false },
  { id: 11, emoji: '🎵', matched: false },
  { id: 12, emoji: '🎵', matched: false },
];

export default function MemoryGamePage() {
  const [tiles, setTiles] = useState(GAME_TILES);
  const [flippedTiles, setFlippedTiles] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Shuffle tiles on component mount
    setTiles(prev => [...prev].sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (flippedTiles.length === 2) {
      const [first, second] = flippedTiles;
      const firstTile = tiles.find(t => t.id === first);
      const secondTile = tiles.find(t => t.id === second);

      if (firstTile?.emoji === secondTile?.emoji) {
        // Match found
        setTimeout(() => {
          setTiles(prev => prev.map(tile => 
            tile.id === first || tile.id === second 
              ? { ...tile, matched: true }
              : tile
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedTiles([]);
        }, 1000);
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
    }
  }, [matchedPairs]);

  const handleTileClick = (tileId: number) => {
    if (flippedTiles.length === 2) return;
    if (flippedTiles.includes(tileId)) return;
    if (tiles.find(t => t.id === tileId)?.matched) return;

    setFlippedTiles(prev => [...prev, tileId]);
  };

  const resetGame = () => {
    setTiles(GAME_TILES.sort(() => Math.random() - 0.5));
    setFlippedTiles([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameComplete(false);
  };

  const isTileVisible = (tileId: number) => {
    const tile = tiles.find(t => t.id === tileId);
    return flippedTiles.includes(tileId) || tile?.matched;
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-8 rounded-3xl text-center max-w-md w-full">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Congratulations!
          </h2>
          <p className="text-gray-600 mb-2">
            You completed the memory game in
          </p>
          <p className="text-3xl font-bold text-blue-600 mb-6">
            {moves} moves
          </p>
          <div className="space-y-4">
            <Button 
              onClick={resetGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-lg font-medium"
            >
              Play Again
            </Button>
            <Link href="/exercises">
              <Button 
                variant="outline"
                className="w-full py-4 rounded-2xl text-lg font-medium border-2"
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <Link href="/exercises">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Memory Game</h1>
        <button onClick={resetGame}>
          <RotateCcw className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="p-6">
        {/* Game Stats */}
        <div className={`flex justify-between items-center mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{moves}</p>
            <p className="text-sm text-gray-600">Moves</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{matchedPairs}/6</p>
            <p className="text-sm text-gray-600">Pairs</p>
          </div>
        </div>

        {/* Game Grid */}
        <div className={`grid grid-cols-3 gap-4 max-w-sm mx-auto transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              className={`aspect-square rounded-2xl border-2 text-4xl font-bold transition-all duration-300 ${
                isTileVisible(tile.id)
                  ? tile.matched
                    ? 'bg-green-100 border-green-300 scale-95'
                    : 'bg-blue-100 border-blue-300'
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200 active:scale-95'
              }`}
              disabled={flippedTiles.length === 2 && !flippedTiles.includes(tile.id)}
            >
              {isTileVisible(tile.id) ? tile.emoji : '?'}
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className={`mt-8 p-6 bg-blue-50 rounded-2xl transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="font-bold text-blue-900 mb-2">How to Play:</h3>
          <p className="text-blue-800">
            Tap tiles to flip them over and find matching pairs. Try to complete the game in as few moves as possible!
          </p>
        </div>
      </div>
    </div>
  );
}