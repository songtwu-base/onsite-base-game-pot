"use client";

import { useGameState } from "@/app/hooks/useGameState";
import { formatEther } from "viem";

export function GameState() {
  const { gameState, blocksRemaining, isLoading } = useGameState();

  if (isLoading || !gameState) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-xl p-6 mb-6 text-white">
      <h2 className="text-3xl font-bold mb-4">
        Round #{gameState.currentRound.toString()}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-80">Jackpot</div>
          <div className="text-2xl font-bold">
            {formatEther(gameState.jackpot)} ETH
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-80">Total Bets</div>
          <div className="text-2xl font-bold">
            {gameState.totalBets.toString()}
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm opacity-80">Blocks Remaining</div>
          <div className="text-2xl font-bold">{blocksRemaining}</div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-sm opacity-80">Status</div>
        <div className="text-lg font-semibold">
          {gameState.roundActive
            ? blocksRemaining > 0
              ? "🎲 Betting Open"
              : "⏳ Ready to Finalize"
            : "🔄 Finalizing..."}
        </div>
      </div>
      {gameState.winningNumber > 0 && (
        <div className="mt-4 bg-yellow-400/30 rounded-lg p-4 text-center">
          <div className="text-sm opacity-90">Winning Number</div>
          <div className="text-3xl font-bold">
            {formatEther(gameState.winningNumber)} ETH
          </div>
        </div>
      )}
    </div>
  );
}
