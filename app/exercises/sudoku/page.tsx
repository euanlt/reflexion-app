"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Trophy, Lightbulb, Check, X } from 'lucide-react';
import Link from 'next/link';

type Cell = {
  value: number;
  isFixed: boolean;
  isError: boolean;
  notes: number[];
};

type SudokuGrid = Cell[][];

// Sudoku puzzle templates (0 represents empty cells)
const EASY_PUZZLE = [
  [5,3,0,0,7,0,0,0,0],
  [6,0,0,1,9,5,0,0,0],
  [0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],
  [4,0,0,8,0,3,0,0,1],
  [7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],
  [0,0,0,4,1,9,0,0,5],
  [0,0,0,0,8,0,0,7,9]
];

const MEDIUM_PUZZLE = [
  [0,0,0,2,6,0,7,0,1],
  [6,8,0,0,7,0,0,9,0],
  [1,9,0,0,0,4,5,0,0],
  [8,2,0,1,0,0,0,4,0],
  [0,0,4,6,0,2,9,0,0],
  [0,5,0,0,0,3,0,2,8],
  [0,0,9,3,0,0,0,7,4],
  [0,4,0,0,5,0,0,3,6],
  [7,0,3,0,1,8,0,0,0]
];

const HARD_PUZZLE = [
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,3,0,8,5],
  [0,0,1,0,2,0,0,0,0],
  [0,0,0,5,0,7,0,0,0],
  [0,0,4,0,0,0,1,0,0],
  [0,9,0,0,0,0,0,0,0],
  [5,0,0,0,0,0,0,7,3],
  [0,0,2,0,1,0,0,0,0],
  [0,0,0,0,4,0,0,0,9]
];

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
  
  const timerRef = useRef<NodeJS.Timeout>();
  const solution = useRef<number[][]>([]);

  useEffect(() => {
    setIsLoaded(true);
    initializeGame();
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
  }, [grid]);

  const initializeGame = () => {
    let puzzle: number[][];
    
    switch (difficulty) {
      case 'easy':
        puzzle = EASY_PUZZLE;
        break;
      case 'medium':
        puzzle = MEDIUM_PUZZLE;
        break;
      case 'hard':
        puzzle = HARD_PUZZLE;
        break;
    }
    
    // Create deep copy of puzzle
    const newGrid: SudokuGrid = puzzle.map(row => 
      row.map(value => ({
        value,
        isFixed: value !== 0,
        isError: false,
        notes: []
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

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].isFixed || isComplete) return;
    setSelectedCell({ row, col });
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
    } else {
      // Set value
      newGrid[row][col].value = num;
      newGrid[row][col].notes = [];
      
      // Check if correct
      if (num !== solution.current[row][col]) {
        newGrid[row][col].isError = true;
        setMistakes(prev => prev + 1);
      } else {
        newGrid[row][col].isError = false;
      }
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
    let className = 'w-full h-full flex items-center justify-center text-2xl font-bold transition-all ';
    
    if (cell.isFixed) {
      className += 'bg-gray-100 text-gray-900 ';
    } else if (cell.isError) {
      className += 'bg-red-100 text-red-600 ';
    } else if (cell.value !== 0) {
      className += 'bg-blue-50 text-blue-600 ';
    } else {
      className += 'bg-white hover:bg-gray-50 ';
    }
    
    if (selectedCell?.row === row && selectedCell?.col === col) {
      className += 'ring-2 ring-blue-500 ';
    }
    
    // Add thicker borders for 3x3 sections
    if (col % 3 === 2 && col !== 8) className += 'border-r-2 border-gray-400 ';
    if (row % 3 === 2 && row !== 8) className += 'border-b-2 border-gray-400 ';
    
    return className;
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-8 rounded-3xl text-center max-w-md w-full">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sudoku Complete!
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-lg text-gray-600">
              Difficulty: <span className="font-bold capitalize">{difficulty}</span>
            </p>
            <p className="text-3xl font-bold text-blue-600">
              Time: {formatTime(elapsedTime)}
            </p>
            <p className="text-lg text-gray-600">
              Mistakes: {mistakes}
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={resetGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-lg font-medium"
            >
              New Game
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
        <h1 className="text-xl font-semibold text-gray-900">Sudoku</h1>
        <button onClick={resetGame}>
          <RotateCcw className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {/* Game Stats */}
        <div className={`flex justify-between items-center mb-6 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{formatTime(elapsedTime)}</p>
            <p className="text-sm text-gray-600">Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{mistakes}</p>
            <p className="text-sm text-gray-600">Mistakes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{hints}</p>
            <p className="text-sm text-gray-600">Hints Left</p>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className={`flex gap-2 mb-6 transform transition-all duration-1000 delay-100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Button
            onClick={() => setDifficulty('easy')}
            variant={difficulty === 'easy' ? 'default' : 'outline'}
            className="flex-1"
          >
            Easy
          </Button>
          <Button
            onClick={() => setDifficulty('medium')}
            variant={difficulty === 'medium' ? 'default' : 'outline'}
            className="flex-1"
          >
            Medium
          </Button>
          <Button
            onClick={() => setDifficulty('hard')}
            variant={difficulty === 'hard' ? 'default' : 'outline'}
            className="flex-1"
          >
            Hard
          </Button>
        </div>

        {/* Sudoku Grid */}
        <div className={`mx-auto transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div 
            className="grid grid-cols-9 gap-0 border-2 border-gray-400 bg-gray-400 mx-auto"
            style={{ 
              width: 'min(100%, 450px)',
              aspectRatio: '1'
            }}
          >
            {grid.map((row, rowIndex) => 
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={getCellClassName(rowIndex, colIndex)}
                  style={{
                    borderRight: '1px solid #e5e7eb',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  {cell.value !== 0 ? (
                    cell.value
                  ) : (
                    <div className="grid grid-cols-3 gap-0 w-full h-full p-1">
                      {cell.notes.map(note => (
                        <span key={note} className="text-xs text-gray-500">
                          {note}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Number Input */}
        <div className={`mt-6 transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Button
                key={num}
                onClick={() => handleNumberInput(num)}
                variant="outline"
                className="text-xl font-bold h-14"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              variant="outline"
              className="h-14"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`mt-4 flex gap-4 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Button
            onClick={() => setShowNotes(!showNotes)}
            variant={showNotes ? 'default' : 'outline'}
            className="flex-1"
          >
            Notes {showNotes ? 'ON' : 'OFF'}
          </Button>
          <Button
            onClick={handleHint}
            variant="outline"
            className="flex-1"
            disabled={hints === 0 || !selectedCell}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint ({hints})
          </Button>
        </div>

        {/* Instructions */}
        <div className={`mt-6 p-6 bg-green-50 rounded-2xl transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="font-bold text-green-900 mb-2">How to Play:</h3>
          <p className="text-green-800 text-sm">
            Fill the grid so each row, column, and 3x3 box contains numbers 1-9 without repeating. 
            Tap a cell and then a number to fill it. Use Notes mode to mark possibilities!
          </p>
        </div>
      </div>
    </div>
  );
}