'use client';

import { createContext, useContext } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';

type GameContextValue = ReturnType<typeof useGameLogic>;

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const game = useGameLogic();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
