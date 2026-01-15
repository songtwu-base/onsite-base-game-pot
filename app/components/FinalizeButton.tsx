"use client";

import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from "@coinbase/onchainkit/transaction";
import { gameContractConfig } from "@/app/lib/BlockhashGuessingGame";
import { useGameState } from "@/app/hooks/useGameState";

export function FinalizeButton() {
  const { canFinalize } = useGameState();

  if (!canFinalize) return null;

  const contracts = [
    {
      ...gameContractConfig,
      functionName: "finalizeRound",
    },
  ];

  const handleSuccess = () => {
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-xl p-6 mb-6 text-white">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">🎉 Round Ready to Finalize!</h3>
        <p className="text-sm opacity-90">
          The betting period has ended. Click below to reveal the winning number and distribute prizes.
        </p>
      </div>

      <Transaction contracts={contracts} onSuccess={handleSuccess}>
        <TransactionButton
          text="Finalize Round & Reveal Winner"
          className="w-full bg-white text-green-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md"
        />
        <TransactionStatus>
          <div className="mt-4 p-4 bg-white/20 backdrop-blur-sm rounded-lg">
            <TransactionStatusLabel className="text-sm font-medium text-white" />
            <TransactionStatusAction className="mt-2" />
          </div>
        </TransactionStatus>
      </Transaction>

      <div className="mt-4 text-xs text-center opacity-80">
        Anyone can finalize the round. Gas fees required.
      </div>
    </div>
  );
}
