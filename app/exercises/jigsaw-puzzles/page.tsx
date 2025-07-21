"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Trophy, Shuffle, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface PuzzlePiece {
  id: number;
  correctPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  isPlaced: boolean;
  rotation: number;
}

const PUZZLE_IMAGES = [
  {
    id: 1,
    url: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=600',
    name: 'Cute Kitten'
  },
  {
    id: 2,
    url: 'https://images.pexels.com/photos/356378/pexels-photo-356378.jpeg?auto=compress&cs=tinysrgb&w=600',
    name: 'Puppy'
  },
  {
    id: 3,
    url: 'https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg?auto=compress&cs=tinysrgb&w=600',
    name: 'Butterfly'
  },
  {
    id: 4,
    url: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=600',
    name: 'Flowers'
  }
];

export default function JigsawPuzzlePage() {
  const [gridSize, setGridSize] = useState(3); // 3x3 grid
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
  
  const puzzleContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsLoaded(true);
    initializePuzzle();
    setStartTime(Date.now());
    
    // Calculate piece size based on container
    const updatePieceSize = () => {
      if (puzzleContainerRef.current) {
        const containerWidth = puzzleContainerRef.current.offsetWidth;
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
    
    // Calculate piece size first
    const containerWidth = Math.min(400, window.innerWidth - 48);
    const calculatedPieceSize = Math.floor(containerWidth / gridSize);
    setPieceSize(calculatedPieceSize);
    
    // Create pieces
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const id = row * gridSize + col;
        
        // Scatter pieces in a more organized way below the puzzle
        const piecesPerRow = Math.floor((window.innerWidth - 48) / (calculatedPieceSize + 10));
        const pieceRow = Math.floor(id / piecesPerRow);
        const pieceCol = id % piecesPerRow;
        
        const randomX = pieceCol * (calculatedPieceSize + 10);
        const randomY = pieceRow * (calculatedPieceSize + 10);
        
        newPieces.push({
          id,
          correctPosition: { x: col * calculatedPieceSize, y: row * calculatedPieceSize },
          currentPosition: { x: randomX, y: randomY },
          isPlaced: false,
          rotation: 0
        });
      }
    }
    
    setPieces(newPieces);
    setIsComplete(false);
  };

  const handleDragStart = (e: React.DragEvent, pieceId: number) => {
    setDraggedPiece(pieceId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(0deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, pieceSize / 2, pieceSize / 2);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedPiece === null || !puzzleContainerRef.current) return;
    
    const container = puzzleContainerRef.current.getBoundingClientRect();
    const x = e.clientX - container.left - pieceSize / 2;
    const y = e.clientY - container.top - pieceSize / 2;
    
    // Find which grid position this corresponds to
    const col = Math.round(x / pieceSize);
    const row = Math.round(y / pieceSize);
    
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
        
        if (isCorrect) {
          // Snap to exact correct position
          piece.currentPosition = { 
            x: expectedCol * pieceSize, 
            y: expectedRow * pieceSize 
          };
          piece.isPlaced = true;
        } else {
          // Allow placing in wrong position but mark as not correct
          piece.currentPosition = { 
            x: col * pieceSize, 
            y: row * pieceSize 
          };
          piece.isPlaced = false;
        }
        
        setPieces(newPieces);
      }
    } else {
      // Dropped outside the puzzle board
      handleDropOutside(e, draggedPiece);
    }
    
    setDraggedPiece(null);
  };

  const handleDropOutside = (e: React.DragEvent, pieceId: number) => {
    e.preventDefault();
    setDraggedPiece(null);
  };

  const checkCompletion = () => {
    if (pieces.length === 0) return;
    
    const allPlaced = pieces.every(piece => piece.isPlaced);
    
    if (allPlaced && pieces.length === gridSize * gridSize) {
      setIsComplete(true);
    }
  };

  const resetPuzzle = () => {
    initializePuzzle();
    setStartTime(Date.now());
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
      cursor: piece.isPlaced ? 'default' : 'move',
      transform: `rotate(${piece.rotation}deg)`,
      transition: piece.isPlaced ? 'all 0.3s ease' : 'none',
      border: piece.isPlaced ? '2px solid #10b981' : '2px solid #e5e7eb',
      borderRadius: '4px',
      boxShadow: piece.isPlaced 
        ? '0 2px 4px rgba(0,0,0,0.1)' 
        : '0 4px 6px rgba(0,0,0,0.2)',
      zIndex: draggedPiece === piece.id ? 1000 : piece.isPlaced ? 1 : 2,
    };
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-8 rounded-3xl text-center max-w-md w-full">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Puzzle Complete!
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-600">
              You completed the {gridSize}x{gridSize} puzzle!
            </p>
            <p className="text-3xl font-bold text-blue-600">
              Time: {formatTime(elapsedTime)}
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={resetPuzzle}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <Link href="/exercises">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Jigsaw Puzzle</h1>
        <button onClick={resetPuzzle}>
          <RotateCcw className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="p-6">
        {/* Game Stats and Controls */}
        <div className={`flex flex-wrap justify-between items-center gap-4 mb-6 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatTime(elapsedTime)}</p>
              <p className="text-sm text-gray-600">Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{pieces.filter(p => p.isPlaced).length}/{pieces.length}</p>
              <p className="text-sm text-gray-600">Placed</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              onClick={() => setShowImageSelect(!showImageSelect)}
              variant="outline"
              size="sm"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Change
            </Button>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value={3}>3x3</option>
              <option value={4}>4x4</option>
              <option value={5}>5x5</option>
            </select>
          </div>
        </div>

        {/* Image Selection */}
        {showImageSelect && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {PUZZLE_IMAGES.map((img) => (
              <button
                key={img.id}
                onClick={() => {
                  setSelectedImage(img);
                  setShowImageSelect(false);
                }}
                className={`relative rounded-lg overflow-hidden border-2 ${
                  selectedImage.id === img.id ? 'border-blue-500' : 'border-gray-300'
                }`}
              >
                <img 
                  src={img.url} 
                  alt={img.name}
                  className="w-full h-24 object-cover"
                />
                <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  {img.name}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Preview Image */}
        {showPreview && (
          <div className="mb-6 flex justify-center">
            <img 
              src={selectedImage.url} 
              alt="Preview"
              className="rounded-lg shadow-lg"
              style={{ 
                width: `${gridSize * 60}px`,
                opacity: 0.7
              }}
            />
          </div>
        )}

        {/* Main Game Area */}
        <div className={`mx-auto transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
             style={{ width: 'fit-content' }}>
          {/* Puzzle Board */}
          <div 
            ref={puzzleContainerRef}
            className="relative mx-auto bg-white rounded-lg shadow-inner border-2 border-gray-300"
            style={{ 
              width: `${gridSize * pieceSize + 4}px`,
              height: `${gridSize * pieceSize + 4}px`,
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Grid lines */}
            {Array.from({ length: gridSize - 1 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute bg-gray-200"
                style={{
                  left: 0,
                  right: 0,
                  top: `${(i + 1) * pieceSize}px`,
                  height: '1px'
                }}
              />
            ))}
            {Array.from({ length: gridSize - 1 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute bg-gray-200"
                style={{
                  top: 0,
                  bottom: 0,
                  left: `${(i + 1) * pieceSize}px`,
                  width: '1px'
                }}
              />
            ))}
            
            {/* Puzzle Pieces that are placed */}
            {pieces.filter(p => p.isPlaced).map((piece) => (
              <div
                key={piece.id}
                draggable={!piece.isPlaced}
                onDragStart={(e) => handleDragStart(e, piece.id)}
                onDragEnd={(e) => handleDropOutside(e, piece.id)}
                style={getPieceStyle(piece)}
                className="hover:z-50"
              />
            ))}
          </div>
          
          {/* Unplaced Pieces Area */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg min-h-[200px]">
            <p className="text-sm text-gray-600 mb-4">Drag pieces from here to the puzzle board:</p>
            <div className="relative" style={{ minHeight: `${pieceSize + 20}px` }}>
              {pieces.filter(p => !p.isPlaced).map((piece) => (
                <div
                  key={piece.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, piece.id)}
                  onDragEnd={(e) => handleDropOutside(e, piece.id)}
                  style={{
                    ...getPieceStyle(piece),
                    position: 'relative',
                    display: 'inline-block',
                    margin: '5px',
                    left: 'auto',
                    top: 'auto'
                  }}
                  className="hover:z-50 cursor-move"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className={`mt-8 p-6 bg-purple-50 rounded-2xl transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="font-bold text-purple-900 mb-2">How to Play:</h3>
          <p className="text-purple-800">
            Drag and drop the puzzle pieces onto the board. Pieces will snap into place when positioned correctly. 
            Complete the picture by placing all pieces in their correct positions!
          </p>
        </div>
      </div>
    </div>
  );
}