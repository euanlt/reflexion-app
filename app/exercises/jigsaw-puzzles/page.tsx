"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Trophy, Sparkles, Timer, Eye, EyeOff, Grid3x3, Puzzle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PuzzlePiece {
  id: number;
  correctPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  isPlaced: boolean;
  isCorrect: boolean;
  isDragging: boolean;
}

const PUZZLE_IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=600&h=600&fit=crop',
    name: 'Golden Retriever',
    difficulty: 'Easy'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&h=600&fit=crop',
    name: 'Colorful Parrots',
    difficulty: 'Medium'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&h=600&fit=crop',
    name: 'Beautiful Landscape',
    difficulty: 'Hard'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=600&fit=crop',
    name: 'Garden Flowers',
    difficulty: 'Easy'
  }
];

export default function JigsawPuzzlePage() {
  const [gridSize, setGridSize] = useState(3);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedImage, setSelectedImage] = useState(PUZZLE_IMAGES[0]);
  const [showImageSelect, setShowImageSelect] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [pieceSize, setPieceSize] = useState(100);
  const [moves, setMoves] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  const puzzleContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsLoaded(true);
    initializePuzzle();
    setStartTime(Date.now());
    setMoves(0);
    
    // Load best time
    const key = `jigsaw-best-${selectedImage.id}-${gridSize}`;
    const stored = localStorage.getItem(key);
    if (stored) setBestTime(parseInt(stored));
    
    // Calculate piece size
    const updatePieceSize = () => {
      if (puzzleContainerRef.current) {
        const containerWidth = Math.min(400, window.innerWidth - 96);
        setPieceSize(Math.floor(containerWidth / gridSize) - 4);
      }
    };
    
    updatePieceSize();
    window.addEventListener('resize', updatePieceSize);
    
    return () => window.removeEventListener('resize', updatePieceSize);
  }, [gridSize, selectedImage]);

  useEffect(() => {
    if (!isComplete) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isComplete]);

  useEffect(() => {
    checkCompletion();
  }, [pieces]);

  const initializePuzzle = () => {
    const newPieces: PuzzlePiece[] = [];
    const positions: { x: number; y: number }[] = [];
    
    // Create a grid of positions for pieces
    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      positions.push({ x: col * (pieceSize + 10), y: row * (pieceSize + 10) });
    }
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Create pieces
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const id = row * gridSize + col;
        const pos = positions[id];
        
        newPieces.push({
          id,
          correctPosition: { x: col * pieceSize, y: row * pieceSize },
          currentPosition: pos,
          isPlaced: false,
          isCorrect: false,
          isDragging: false
        });
      }
    }
    
    setPieces(newPieces);
    setIsComplete(false);
  };

  const handleDragStart = (e: React.DragEvent, pieceId: number) => {
    setDraggedPiece(pieceId);
    setPieces(prev => prev.map(p => p.id === pieceId ? { ...p, isDragging: true } : p));
    e.dataTransfer.effectAllowed = 'move';
    
    // Add drag image effect
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragEnd = () => {
    setPieces(prev => prev.map(p => ({ ...p, isDragging: false })));
    setDraggedPiece(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedPiece === null || !puzzleContainerRef.current) return;
    
    const container = puzzleContainerRef.current.getBoundingClientRect();
    const x = e.clientX - container.left;
    const y = e.clientY - container.top;
    
    // Find closest grid position
    const col = Math.round(x / pieceSize - 0.5);
    const row = Math.round(y / pieceSize - 0.5);
    
    // Check if within puzzle bounds
    if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
      const newPieces = [...pieces];
      const piece = newPieces.find(p => p.id === draggedPiece);
      
      if (piece) {
        // Calculate the expected position for this piece
        const expectedRow = Math.floor(piece.id / gridSize);
        const expectedCol = piece.id % gridSize;
        
        // Check if this is the correct position
        const isCorrect = row === expectedRow && col === expectedCol;
        
        // Update piece position
        piece.currentPosition = { 
          x: col * pieceSize, 
          y: row * pieceSize 
        };
        piece.isPlaced = true;
        piece.isCorrect = isCorrect;
        
        // Count move
        setMoves(prev => prev + 1);
        
        // Add animation effect for correct placement
        if (isCorrect) {
          // Visual feedback for correct placement
          const element = document.getElementById(`piece-${piece.id}`);
          if (element) {
            element.classList.add('animate-pulse');
            setTimeout(() => element.classList.remove('animate-pulse'), 600);
          }
        }
        
        setPieces(newPieces);
      }
    }
    
    handleDragEnd();
  };

  const handleDropOutside = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedPiece === null) return;
    
    // Return piece to pieces area
    const newPieces = [...pieces];
    const piece = newPieces.find(p => p.id === draggedPiece);
    
    if (piece) {
      piece.isPlaced = false;
      piece.isCorrect = false;
      setPieces(newPieces);
    }
    
    handleDragEnd();
  };

  const checkCompletion = () => {
    if (pieces.length === 0) return;
    
    const allCorrect = pieces.every(piece => piece.isCorrect);
    
    if (allCorrect && pieces.length === gridSize * gridSize) {
      setIsComplete(true);
      
      // Save best time
      const key = `jigsaw-best-${selectedImage.id}-${gridSize}`;
      if (!bestTime || elapsedTime < bestTime) {
        setBestTime(elapsedTime);
        localStorage.setItem(key, elapsedTime.toString());
      }
    }
  };

  const resetPuzzle = () => {
    initializePuzzle();
    setStartTime(Date.now());
    setElapsedTime(0);
    setMoves(0);
    setShowHint(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPieceStyle = (piece: PuzzlePiece) => {
    const row = Math.floor(piece.id / gridSize);
    const col = piece.id % gridSize;
    
    return {
      position: piece.isPlaced ? ('absolute' as const) : ('relative' as const),
      left: piece.isPlaced ? piece.currentPosition.x : 'auto',
      top: piece.isPlaced ? piece.currentPosition.y : 'auto',
      width: pieceSize,
      height: pieceSize,
      backgroundImage: `url(${selectedImage.url})`,
      backgroundSize: `${gridSize * pieceSize}px ${gridSize * pieceSize}px`,
      backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
      cursor: piece.isDragging ? 'grabbing' : 'grab',
      transform: piece.isDragging ? 'scale(1.05) rotate(5deg)' : 'scale(1)',
      transition: piece.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: piece.isDragging ? 0.8 : 1,
      zIndex: piece.isDragging ? 1000 : piece.isPlaced ? 1 : 2,
    };
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="p-8 rounded-3xl text-center max-w-md w-full shadow-2xl bg-white/90 backdrop-blur">
          <div className="relative">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-bounce" />
            <Sparkles className="w-8 h-8 text-yellow-400 absolute top-0 right-1/4 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute top-4 left-1/4 animate-pulse delay-200" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Puzzle Complete!
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-600">
              Completed in <span className="font-bold text-purple-600">{formatTime(elapsedTime)}</span>
            </p>
            <p className="text-gray-600">
              Total moves: <span className="font-bold text-blue-600">{moves}</span>
            </p>
            {bestTime === elapsedTime && (
              <p className="text-sm text-yellow-600 font-semibold mt-2">
                🎉 New Best Time!
              </p>
            )}
          </div>
          <div className="space-y-4">
            <Button 
              onClick={resetPuzzle}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-4 rounded-2xl text-lg font-medium shadow-lg transform transition hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur border-b border-gray-200">
        <Link href="/exercises" className="transform transition hover:scale-110">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Puzzle className="w-6 h-6" />
          Jigsaw Puzzle
        </h1>
        <button onClick={resetPuzzle} className="transform transition hover:scale-110 hover:rotate-180 duration-300">
          <RotateCcw className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="p-6">
        {/* Game Stats and Controls */}
        <div className={`flex flex-wrap justify-between items-center gap-4 mb-6 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex gap-4">
            <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
              <div className="text-center flex items-center gap-2">
                <Timer className="w-4 h-4 text-gray-600" />
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {formatTime(elapsedTime)}
                </p>
              </div>
            </Card>
            <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
              <div className="text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {pieces.filter(p => p.isCorrect).length}/{pieces.length}
                </p>
                <p className="text-xs text-gray-600">Correct</p>
              </div>
            </Card>
            <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{moves}</p>
                <p className="text-xs text-gray-600">Moves</p>
              </div>
            </Card>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-transform"
            >
              {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              Preview
            </Button>
            <Button
              onClick={() => setShowHint(!showHint)}
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Hint
            </Button>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white/80"
            >
              <option value={3}>3×3</option>
              <option value={4}>4×4</option>
              <option value={5}>5×5</option>
            </select>
          </div>
        </div>

        {/* Image Selection */}
        {showImageSelect && (
          <Card className="p-4 mb-6 bg-white/80 backdrop-blur">
            <h3 className="font-bold text-gray-900 mb-3">Choose an Image</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PUZZLE_IMAGES.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setSelectedImage(img);
                    setShowImageSelect(false);
                    resetPuzzle();
                  }}
                  className={cn(
                    "relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                    selectedImage.id === img.id ? "border-purple-500 shadow-lg" : "border-gray-300"
                  )}
                >
                  <img 
                    src={img.url} 
                    alt={img.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-semibold">{img.name}</p>
                    <p className="text-white/80 text-xs">{img.difficulty}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Preview Image */}
        {showPreview && (
          <div className="mb-6 flex justify-center">
            <Card className="p-2 bg-white/80 backdrop-blur shadow-xl">
              <img 
                src={selectedImage.url} 
                alt="Preview"
                className="rounded-lg"
                style={{ 
                  width: `${gridSize * 60}px`,
                  height: `${gridSize * 60}px`,
                  objectFit: 'cover'
                }}
              />
            </Card>
          </div>
        )}

        {/* Main Game Area */}
        <div className={`mx-auto transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
             style={{ maxWidth: '600px' }}>
          
          {/* Puzzle Board */}
          <Card className="p-4 bg-white/90 backdrop-blur shadow-xl mb-6">
            <div 
              ref={puzzleContainerRef}
              className="relative mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg"
              style={{ 
                width: `${gridSize * pieceSize}px`,
                height: `${gridSize * pieceSize}px`,
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Grid overlay with hint */}
              {showHint && (
                <>
                  {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                    const row = Math.floor(i / gridSize);
                    const col = i % gridSize;
                    return (
                      <div
                        key={`hint-${i}`}
                        className="absolute border border-dashed border-purple-300 bg-purple-50/20"
                        style={{
                          left: `${col * pieceSize}px`,
                          top: `${row * pieceSize}px`,
                          width: `${pieceSize}px`,
                          height: `${pieceSize}px`,
                        }}
                      >
                        <span className="absolute top-1 left-1 text-xs text-purple-400 font-semibold">
                          {i + 1}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* Placed Pieces */}
              {pieces.filter(p => p.isPlaced).map((piece) => (
                <div
                  key={piece.id}
                  id={`piece-${piece.id}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, piece.id)}
                  onDragEnd={handleDragEnd}
                  style={getPieceStyle(piece)}
                  className={cn(
                    "rounded-lg shadow-lg border-2 hover:shadow-xl",
                    piece.isCorrect 
                      ? "border-green-400 ring-2 ring-green-400/30" 
                      : "border-yellow-400 ring-2 ring-yellow-400/30"
                  )}
                />
              ))}
            </div>
          </Card>
          
          {/* Unplaced Pieces Area */}
          <Card className="p-4 bg-white/80 backdrop-blur">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              Puzzle Pieces
            </h3>
            <div 
              className="flex flex-wrap gap-3 justify-center min-h-[120px] p-4 bg-gray-50 rounded-lg"
              onDragOver={handleDragOver}
              onDrop={handleDropOutside}
            >
              {pieces.filter(p => !p.isPlaced).map((piece, index) => (
                <div
                  key={piece.id}
                  id={`piece-${piece.id}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, piece.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    ...getPieceStyle(piece),
                    animationDelay: `${index * 50}ms`
                  }}
                  className={cn(
                    "rounded-lg shadow-lg border-2 border-gray-300 hover:shadow-xl hover:border-purple-400 cursor-grab active:cursor-grabbing",
                    "animate-fade-in"
                  )}
                />
              ))}
              {pieces.filter(p => !p.isPlaced).length === 0 && (
                <p className="text-gray-400 text-center w-full">
                  All pieces are on the board!
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Instructions & Best Time */}
        <div className={`mt-8 space-y-4 max-w-2xl mx-auto transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              How to Play
            </h3>
            <p className="text-gray-700 text-sm">
              Drag puzzle pieces from the bottom area onto the board. Pieces will glow green when placed correctly. 
              Use the preview button to see the complete image, or enable hints to see piece numbers!
            </p>
          </Card>
          
          {bestTime && (
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <p className="text-center text-sm">
                <span className="text-gray-600">Best Time ({gridSize}×{gridSize}): </span>
                <span className="font-bold text-purple-700">{formatTime(bestTime)}</span>
              </p>
            </Card>
          )}
        </div>

        {/* Change Image Button */}
        <div className="text-center mt-6">
          <Button
            onClick={() => setShowImageSelect(!showImageSelect)}
            variant="outline"
            className="hover:scale-105 transition-transform"
          >
            <Puzzle className="w-4 h-4 mr-2" />
            Change Picture
          </Button>
        </div>
      </div>
    </div>
  );
}