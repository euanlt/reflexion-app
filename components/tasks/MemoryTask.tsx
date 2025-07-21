"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

interface MemoryTaskProps {
  onComplete?: (data: any) => void;
  isCompleted?: boolean;
}

const IMAGES = [
  { id: 1, name: 'Apple', emoji: '🍎', color: 'red' },
  { id: 2, name: 'Sunflower', emoji: '🌻', color: 'yellow' },
  { id: 3, name: 'Ocean', emoji: '🌊', color: 'blue' },
  { id: 4, name: 'Tree', emoji: '🌳', color: 'green' },
];

export function MemoryTask({ onComplete, isCompleted }: MemoryTaskProps) {
  const [phase, setPhase] = useState<'study' | 'recall' | 'results'>('study');
  const [studyTime, setStudyTime] = useState(30);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showingItems] = useState(IMAGES.slice(0, 3)); // Show 3 items to remember

  useEffect(() => {
    if (phase === 'study' && studyTime > 0) {
      const timer = setTimeout(() => setStudyTime(studyTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'study' && studyTime === 0) {
      setPhase('recall');
    }
  }, [phase, studyTime]);

  const handleItemSelect = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSubmit = () => {
    // Calculate score
    const correctSelections = selectedItems.filter(id => 
      showingItems.some(item => item.id === id)
    ).length;
    const incorrectSelections = selectedItems.filter(id => 
      !showingItems.some(item => item.id === id)
    ).length;
    
    const finalScore = Math.max(0, (correctSelections - incorrectSelections) / showingItems.length * 100);
    setScore(Math.round(finalScore));
    setPhase('results');
    
    const taskData = {
      score: finalScore,
      correctItems: correctSelections,
      totalItems: showingItems.length,
      incorrectSelections,
      timestamp: new Date().toISOString()
    };
    
    onComplete?.(taskData);
  };

  if (phase === 'study') {
    return (
      <Card className="senior-card">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Eye className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="text-senior-lg font-bold">Study These Items</h3>
          </div>
          
          <p className="text-senior-base text-gray-600 mb-6">
            Look at these items carefully. You'll need to remember them in a moment.
          </p>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            {showingItems.map((item) => (
              <div
                key={item.id}
                className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200"
              >
                <div className="text-6xl mb-3">{item.emoji}</div>
                <p className="text-senior-lg font-semibold text-gray-800">{item.name}</p>
                <p className="text-senior-base text-gray-600">{item.color}</p>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-senior-lg font-bold text-yellow-800">
              Time remaining: {studyTime} seconds
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (phase === 'recall') {
    return (
      <Card className="senior-card">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <EyeOff className="w-8 h-8 text-purple-600 mr-3" />
            <h3 className="text-senior-lg font-bold">Which Items Did You See?</h3>
          </div>
          
          <p className="text-senior-base text-gray-600 mb-6">
            Select the items you remember from before:
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {IMAGES.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-4xl mb-2">{item.emoji}</div>
                  <p className="text-senior-base font-semibold">{item.name}</p>
                  {isSelected && (
                    <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mt-2" />
                  )}
                </button>
              );
            })}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0}
            className="senior-button gradient-primary border-0 text-white"
            size="lg"
          >
            Submit My Answer
          </Button>
        </div>
      </Card>
    );
  }

  // Results phase
  const correctItems = selectedItems.filter(id => 
    showingItems.some(item => item.id === id)
  ).length;

  return (
    <Card className="senior-card">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
        
        <h3 className="text-senior-lg font-bold mb-4">Memory Exercise Complete!</h3>
        
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-senior-lg font-bold text-green-800">
              Score: {score}%
            </p>
            <p className="text-senior-base text-green-700">
              You remembered {correctItems} out of {showingItems.length} items correctly
            </p>
          </div>
          
          <div className="text-left">
            <h4 className="font-semibold mb-2">The items to remember were:</h4>
            <div className="flex flex-wrap gap-2">
              {showingItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-xl">
          <p className="text-blue-800 font-medium">
            ✓ Memory exercise completed successfully!
          </p>
        </div>
      </div>
    </Card>
  );
}