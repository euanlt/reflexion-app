"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Trophy, Lightbulb, Sparkles, Timer, Hash, Eraser, Brain, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Cell = {
  value: number;
  isFixed: boolean;
  isError: boolean;
  notes: number[];
  isHighlighted: boolean;
  isRelated: boolean;
};

type SudokuGrid = Cell[][];

// Sudoku puzzle templates
const PUZZLES = {
  easy: [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
  ],
  medium: [
    [0,0,0,2,6,0,7,0,1],
    [6,8,0,0,7,0,0,9,0],
    [1,9,0,0,0,4,5,0,0],
    [8,2,0,1,0,0,0,4,0],
    [0,0,4,6,0,2,9,0,0],
    [0,5,0,0,0,3,0,2,8],
    [0,0,9,3,0,0,0,7,4],
    [0,4,0,0,5,0,0,3,6],
    [7,0,3,0,1,8,0,0,0]
  ],
  hard: [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,3,0,8,5],
    [0,0,1,0,2,0,0,0,0],
    [0,0,0,5,0,7,0,0,0],
    [0,0,4,0,0,0,1,0,0],
    [0,9,0,0,0,0,0,0,0],
    [5,0,0,0,0,0,0,7,3],
    [0,0,2,0,1,0,0,0,0],
    [0,0,0,0,4,0,0,0,9]
  ]
};

export default function SudokuPage() {
  const [grid, setGrid] = useState<SudokuGrid>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [isComplete, setIsComplete] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(3);
  const [showNotes, setShowNotes] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [highlightValue, setHighlightValue] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [filledCells, setFilledCells] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const solution = useRef<number[][]>([]);

  useEffect(() => {
    setIsLoaded(true);
    initializeGame();
    
    // Load best time
    const key = `sudoku-best-${difficulty}`;
    const stored = localStorage.getItem(key);
    if (stored) setBestTime(parseInt(stored));
  }, [difficulty]);

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
    updateFilledCells();
  }, [grid]);

  useEffect(() => {
    updateHighlights();
  }, [selectedCell, highlightValue]);

  const initializeGame = () => {
    const puzzle = PUZZLES[difficulty];
    
    // Create deep copy of puzzle
    const newGrid: SudokuGrid = puzzle.map(row => 
      row.map(value => ({
        value,
        isFixed: value !== 0,
        isError: false,
        notes: [],
        isHighlighted: false,
        isRelated: false
      }))
    );
    
    setGrid(newGrid);
    
    // Solve puzzle to store solution
    const puzzleCopy = puzzle.map(row => [...row]);
    solveSudoku(puzzleCopy);
    solution.current = puzzleCopy;
    
    setIsComplete(false);
    setMistakes(0);
    setHints(3);
    setStartTime(Date.now());
    setSelectedCell(null);
    setHighlightValue(null);
    setShowCelebration(false);
  };

  const solveSudoku = (board: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidMove(board, row, col, num)) {
              board[row][col] = num;
              if (solveSudoku(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  const isValidMove = (board: number[][], row: number, col: number, num: number): boolean => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  };

  const updateHighlights = () => {
    if (grid.length === 0) return;
    
    const newGrid = [...grid];
    
    // Reset all highlights
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        newGrid[r][c].isHighlighted = false;
        newGrid[r][c].isRelated = false;
      }
    }
    
    // Highlight selected cell's row, column, and box
    if (selectedCell) {
      const { row, col } = selectedCell;
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      
      for (let i = 0; i < 9; i++) {
        newGrid[row][i].isRelated = true;
        newGrid[i][col].isRelated = true;
      }
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          newGrid[boxRow + i][boxCol + j].isRelated = true;
        }
      }
    }
    
    // Highlight cells with same value
    if (highlightValue) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (newGrid[r][c].value === highlightValue) {
            newGrid[r][c].isHighlighted = true;
          }
        }
      }
    }
    
    setGrid(newGrid);
  };

  const updateFilledCells = () => {
    if (grid.length === 0) return;
    
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value !== 0) count++;
      }
    }
    setFilledCells(count);
  };

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].isFixed || isComplete) return;
    setSelectedCell({ row, col });
    
    // Set highlight value based on clicked cell
    if (grid[row][col].value !== 0) {
      setHighlightValue(grid[row][col].value);
    } else {
      setHighlightValue(null);
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isComplete) return;
    
    const { row, col } = selectedCell;
    if (grid[row][col].isFixed) return;
    
    const newGrid = [...grid];
    
    if (showNotes) {
      // Toggle note
      const notes = [...newGrid[row][col].notes];
      const noteIndex = notes.indexOf(num);
      if (noteIndex > -1) {
        notes.splice(noteIndex, 1);
      } else {
        notes.push(num);
        notes.sort();
      }
      newGrid[row][col].notes = notes;
      newGrid[row][col].value = 0;
    } else {
      // Set value
      const previousValue = newGrid[row][col].value;
      newGrid[row][col].value = num;
      newGrid[row][col].notes = [];
      
      // Check if correct
      if (num !== solution.current[row][col]) {
        newGrid[row][col].isError = true;
        if (previousValue === 0) {
          setMistakes(prev => prev + 1);
        }
      } else {
        newGrid[row][col].isError = false;
        // Add animation effect for correct placement
        const element = document.getElementById(`cell-${row}-${col}`);
        if (element) {
          element.classList.add('animate-pulse');
          setTimeout(() => element.classList.remove('animate-pulse'), 600);
        }
      }
      
      setHighlightValue(num);
    }
    
    setGrid(newGrid);
  };

  const handleClear = () => {
    if (!selectedCell || isComplete) return;
    
    const { row, col } = selectedCell;
    if (grid[row][col].isFixed) return;
    
    const newGrid = [...grid];
    newGrid[row][col].value = 0;
    newGrid[row][col].isError = false;
    newGrid[row][col].notes = [];
    setGrid(newGrid);
    setHighlightValue(null);
  };

  const handleHint = () => {
    if (hints <= 0 || !selectedCell || isComplete) return;
    
    const { row, col } = selectedCell;
    if (grid[row][col].isFixed || grid[row][col].value === solution.current[row][col]) return;
    
    const newGrid = [...grid];
    newGrid[row][col].value = solution.current[row][col];
    newGrid[row][col].isError = false;
    newGrid[row][col].notes = [];
    setGrid(newGrid);
    setHints(prev => prev - 1);
    
    // Add animation
    const element = document.getElementById(`cell-${row}-${col}`);
    if (element) {
      element.classList.add('animate-bounce-soft');
      setTimeout(() => element.classList.remove('animate-bounce-soft'), 1000);
    }
  };

  const checkCompletion = () => {
    if (grid.length === 0) return;
    
    let isFilled = true;
    let hasErrors = false;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col].value === 0) {
          isFilled = false;
        }
        if (grid[row][col].isError) {
          hasErrors = true;
        }
      }
    }
    
    if (isFilled && !hasErrors) {
      setIsComplete(true);
      setShowCelebration(true);
      
      // Save best time
      const key = `sudoku-best-${difficulty}`;
      if (!bestTime || elapsedTime < bestTime) {
        setBestTime(elapsedTime);
        localStorage.setItem(key, elapsedTime.toString());
      }
    }
  };

  const resetGame = () => {
    initializeGame();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellClassName = (row: number, col: number) => {
    const cell = grid[row][col];
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    
    return cn(
      "relative w-full h-full flex items-center justify-center text-2xl font-bold transition-all duration-200",
      "hover:bg-opacity-70 cursor-pointer",
      {
        // Background colors
        "bg-gray-100 text-gray-900": cell.isFixed,
        "bg-red-100 text-red-600": cell.isError && !cell.isFixed,
        "bg-green-100 text-green-700": cell.value !== 0 && !cell.isError && !cell.isFixed,
        "bg-white": cell.value === 0 && !cell.isFixed,
        
        // Highlights
        "bg-blue-50": cell.isRelated && !isSelected && cell.value === 0,
        "bg-yellow-100": cell.isHighlighted && !isSelected,
        
        // Selected
        "ring-2 ring-blue-500 ring-inset z-10 bg-blue-100": isSelected,
        
      }
    );
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <Card className="p-8 rounded-3xl text-center max-w-md w-full shadow-2xl bg-white/90 backdrop-blur">
          <div className="relative">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-bounce" />
            {showCelebration && (
              <>
                <Sparkles className="w-8 h-8 text-yellow-400 absolute top-0 right-1/4 animate-pulse" />
                <Sparkles className="w-6 h-6 text-yellow-400 absolute top-4 left-1/4 animate-pulse delay-200" />
                <CheckCircle className="w-10 h-10 text-green-500 absolute -bottom-2 right-1/3 animate-bounce delay-400" />
              </>
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Sudoku Master!
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-600">
              Difficulty: <span className="font-bold capitalize text-emerald-600">{difficulty}</span>
            </p>
            <p className="text-gray-600">
              Time: <span className="font-bold text-blue-600">{formatTime(elapsedTime)}</span>
            </p>
            <p className="text-gray-600">
              Mistakes: <span className="font-bold text-purple-600">{mistakes}</span>
            </p>
            {bestTime === elapsedTime && (
              <p className="text-sm text-yellow-600 font-semibold mt-2">
                🎉 New Best Time!
              </p>
            )}
          </div>
          <div className="space-y-4">
            <Button 
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-4 rounded-2xl text-lg font-medium shadow-lg transform transition hover:scale-105"
            >
              New Game
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur border-b border-gray-200">
        <Link href="/exercises" className="transform transition hover:scale-110">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Hash className="w-6 h-6" />
          Sudoku
        </h1>
        <button onClick={resetGame} className="transform transition hover:scale-110 hover:rotate-180 duration-300">
          <RotateCcw className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {/* Game Stats */}
        <div className={`flex justify-around items-center mb-6 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
            <div className="text-center flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-600" />
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {formatTime(elapsedTime)}
              </p>
            </div>
          </Card>
          <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{mistakes}</p>
              <p className="text-xs text-gray-600">Mistakes</p>
            </div>
          </Card>
          <Card className="px-4 py-3 bg-white/80 backdrop-blur shadow-lg">
            <div className="text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {filledCells}/81
              </p>
              <p className="text-xs text-gray-600">Filled</p>
            </div>
          </Card>
        </div>

        {/* Difficulty Selection */}
        <div className={`flex gap-2 mb-6 transform transition-all duration-1000 delay-100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <Button
              key={level}
              onClick={() => setDifficulty(level)}
              variant={difficulty === level ? 'default' : 'outline'}
              className={cn(
                "flex-1 capitalize transition-all hover:scale-105",
                difficulty === level && "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              )}
            >
              <Brain className="w-4 h-4 mr-2" />
              {level}
            </Button>
          ))}
        </div>

        {/* Sudoku Grid */}
        <div className={`mx-auto transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="p-4 bg-white/90 backdrop-blur shadow-xl overflow-visible">
            <div 
              className="grid grid-cols-9 gap-0 border-2 border-black bg-gray-300 mx-auto"
              style={{ 
                width: 'min(100%, 450px)',
                aspectRatio: '1'
              }}
            >
              {grid.map((row, rowIndex) => 
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    id={`cell-${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={getCellClassName(rowIndex, colIndex)}
                    style={{
                      borderRight: colIndex % 3 === 2 && colIndex !== 8 ? '2px solid black' : '1px solid #d1d5db',
                      borderBottom: rowIndex % 3 === 2 && rowIndex !== 8 ? '2px solid black' : '1px solid #d1d5db',
                      borderLeft: colIndex % 3 === 0 && colIndex !== 0 ? '2px solid black' : 'none',
                      borderTop: rowIndex % 3 === 0 && rowIndex !== 0 ? '2px solid black' : 'none',
                    }}
                  >
                    {cell.value !== 0 ? (
                      <span className={cn(
                        "relative z-10",
                        cell.isFixed && "font-black"
                      )}>
                        {cell.value}
                      </span>
                    ) : (
                      <div className="grid grid-cols-3 gap-0 w-full h-full p-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <span 
                            key={num} 
                            className={cn(
                              "text-xs leading-none flex items-center justify-center",
                              cell.notes.includes(num) ? "text-gray-500 font-semibold" : "text-transparent"
                            )}
                          >
                            {cell.notes.includes(num) ? num : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Number Input */}
        <div className={`mt-6 transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Button
                key={num}
                onClick={() => handleNumberInput(num)}
                variant="outline"
                className={cn(
                  "text-xl font-bold h-14 hover:scale-105 transition-transform",
                  highlightValue === num && "bg-yellow-100 border-yellow-400"
                )}
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              variant="outline"
              className="h-14 hover:scale-105 transition-transform hover:bg-red-50"
            >
              <Eraser className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`mt-4 flex gap-4 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Button
            onClick={() => setShowNotes(!showNotes)}
            variant={showNotes ? 'default' : 'outline'}
            className={cn(
              "flex-1 transition-all hover:scale-105",
              showNotes && "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            )}
          >
            <Hash className="w-4 h-4 mr-2" />
            Notes {showNotes ? 'ON' : 'OFF'}
          </Button>
          <Button
            onClick={handleHint}
            variant="outline"
            className="flex-1 hover:scale-105 transition-transform"
            disabled={hints === 0 || !selectedCell}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint ({hints})
          </Button>
        </div>

        {/* Instructions & Best Time */}
        <div className={`mt-8 space-y-4 transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              How to Play
            </h3>
            <p className="text-gray-700 text-sm">
              Fill the grid so each row, column, and 3×3 box contains numbers 1-9 without repeating. 
              Tap a cell and then a number to fill it. Use Notes mode to mark possible numbers!
            </p>
          </Card>
          
          {bestTime && (
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <p className="text-center text-sm">
                <span className="text-gray-600">Best Time ({difficulty}): </span>
                <span className="font-bold text-emerald-700">{formatTime(bestTime)}</span>
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}