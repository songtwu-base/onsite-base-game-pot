"use client";

import { useReadContract, useBlockNumber } from "wagmi";
import { gameContractConfig } from "@/app/lib/BlockhashGuessingGame";

export function useGameState() {
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    pollingInterval: 2000,
  });

  const {
    data: gameState,
    refetch,
    isLoading,
    error,
  } = useReadContract({
    ...gameContractConfig,
    functionName: "getGameState",
  });

  const blocksRemaining =
    gameState && blockNumber
      ? Math.max(0, Number(gameState.targetBlockNumber) - Number(blockNumber))
      : 0;

  const canFinalize =
    gameState && gameState.roundActive && blocksRemaining === 0;

  return {
    gameState,
    currentBlock: blockNumber,
    blocksRemaining,
    canFinalize,
    refetch,
    isLoading,
    error,
  };
}
