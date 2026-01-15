"use client";

import { GameState } from "@/app/components/GameState";
import { BettingInterface } from "@/app/components/BettingInterface";
import { FinalizeButton } from "@/app/components/FinalizeButton";
import { CurrentBets } from "@/app/components/CurrentBets";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";

export default function GamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Guess the ETH Amount
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                A blockhash-based guessing game on Base Sepolia
              </p>
            </div>
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Game Info */}
          <div className="lg:col-span-2 space-y-6">
            <GameState />
            <FinalizeButton />
            <BettingInterface />
          </div>

          {/* Right Column - Participants */}
          <div className="lg:col-span-1">
            <CurrentBets />
          </div>
        </div>

        {/* How to Play */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            How to Play
          </h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                1
              </span>
              <p>
                <strong>Connect Your Wallet:</strong> Click the wallet button
                in the top right to connect your Base Sepolia wallet.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                2
              </span>
              <p>
                <strong>Place Your Bet:</strong> Choose an amount between 10-50
                ETH. This represents your guess of what the winning number will
                be!
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                3
              </span>
              <p>
                <strong>Wait for Results:</strong> After 5 blocks (~10
                seconds), the betting closes and the round can be finalized.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                4
              </span>
              <p>
                <strong>Win the Jackpot:</strong> If your bet matches the
                winning number (derived from the blockhash), you win! Multiple
                winners split the prize equally. If no one wins, the funds are
                burned.
              </p>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Contract:</span>{" "}
              <code className="bg-white px-2 py-1 rounded border border-gray-300 font-mono text-xs">
                0x88d4B2E2eEEcda1Ece91F55889D21702604e3a6a
              </code>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Network:</span> Base Sepolia
            </div>
            <a
              href="https://sepolia.basescan.org/address/0x88d4B2E2eEEcda1Ece91F55889D21702604e3a6a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View on Basescan →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
