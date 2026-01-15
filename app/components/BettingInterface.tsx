"use client";

import { useState } from "react";
import { parseEther } from "viem";
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from "@coinbase/onchainkit/transaction";
import { useAccount } from "wagmi";
import { gameContractConfig } from "@/app/lib/BlockhashGuessingGame";
import { useGameState } from "@/app/hooks/useGameState";

export function BettingInterface() {
  const { address, isConnected } = useAccount();
  const { gameState, blocksRemaining } = useGameState();
  const [betAmount, setBetAmount] = useState("10");

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="text-center text-gray-600">
          <p className="text-lg mb-2">Connect your wallet to play</p>
          <p className="text-sm">Use the wallet button in the top right corner</p>
        </div>
      </div>
    );
  }

  if (!gameState?.roundActive || blocksRemaining === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="text-center text-yellow-800">
          <p className="text-lg font-semibold">Betting Closed</p>
          <p className="text-sm mt-1">
            The betting period for this round has ended. Please wait for the round to be finalized.
          </p>
        </div>
      </div>
    );
  }

  const contracts = [
    {
      ...gameContractConfig,
      functionName: "submitGuess",
      value: parseEther(betAmount),
    },
  ];

  const handleSuccess = () => {
    setBetAmount("10");
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">Place Your Bet</h3>
      <p className="text-gray-600 mb-4">
        Guess the winning number (10-50 ETH). Your bet amount represents your guess!
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bet Amount (ETH)
        </label>
        <input
          type="number"
          min="10"
          max="50"
          step="0.01"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
          placeholder="Enter amount (10-50 ETH)"
        />
        <p className="text-sm text-gray-500 mt-1">
          Min: 10 ETH | Max: 50 ETH
        </p>
      </div>

      <Transaction contracts={contracts} onSuccess={handleSuccess}>
        <TransactionButton
          text={`Bet ${betAmount} ETH`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
        />
        <TransactionStatus>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <TransactionStatusLabel className="text-sm font-medium" />
            <TransactionStatusAction className="mt-2" />
          </div>
        </TransactionStatus>
      </Transaction>

      <div className="mt-4 text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
        <p className="font-semibold text-blue-900 mb-1">💡 How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Choose an amount between 10-50 ETH as your guess</li>
          <li>After 5 blocks, a winning number will be revealed</li>
          <li>If your bet matches the winning number, you win the jackpot!</li>
          <li>Multiple winners split the prize equally</li>
        </ul>
      </div>
    </div>
  );
}
