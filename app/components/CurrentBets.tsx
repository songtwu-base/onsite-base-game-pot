"use client";

import { useReadContract } from "wagmi";
import { gameContractConfig } from "@/app/lib/BlockhashGuessingGame";
import { formatEther } from "viem";
import { useGameState } from "@/app/hooks/useGameState";

export function CurrentBets() {
  const { gameState } = useGameState();

  const { data: bets, isLoading } = useReadContract({
    ...gameContractConfig,
    functionName: "getRoundBets",
    args: gameState ? [gameState.currentRound] : undefined,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Current Bets</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Current Bets</h3>
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">No bets yet this round</p>
          <p className="text-sm mt-2">Be the first to place a bet!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        Current Bets ({bets.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guess (ETH)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bets.map((bet, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                  {bet.player.slice(0, 6)}...{bet.player.slice(-4)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-600">
                  {formatEther(bet.amount)} ETH
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(Number(bet.timestamp) * 1000).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
