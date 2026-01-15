import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              🎲 Guess the ETH Amount
            </h1>
            <p className="text-xl text-gray-600">
              A thrilling blockchain guessing game on Base Sepolia
            </p>
          </div>

          {/* Game Description */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <div className="space-y-3 text-gray-700">
              <p className="flex items-start">
                <span className="text-2xl mr-3">💰</span>
                <span>
                  <strong>Bet ETH:</strong> Choose an amount between 10-50 ETH
                  as your guess
                </span>
              </p>
              <p className="flex items-start">
                <span className="text-2xl mr-3">⏱️</span>
                <span>
                  <strong>Wait 5 Blocks:</strong> About 10 seconds on Base
                  Sepolia
                </span>
              </p>
              <p className="flex items-start">
                <span className="text-2xl mr-3">🎯</span>
                <span>
                  <strong>Win the Jackpot:</strong> If your guess matches the
                  winning number (derived from blockhash), you win!
                </span>
              </p>
              <p className="flex items-start">
                <span className="text-2xl mr-3">🔥</span>
                <span>
                  <strong>No Winners?</strong> Funds are burned if no one
                  guesses correctly
                </span>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-gray-800 mb-1">Fast Rounds</h3>
              <p className="text-sm text-gray-600">~10 second betting windows</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-bold text-gray-800 mb-1">Blockchain Random</h3>
              <p className="text-sm text-gray-600">
                Provably fair blockhash randomness
              </p>
            </div>
            <div className="bg-pink-50 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">💎</div>
              <h3 className="font-bold text-gray-800 mb-1">Big Prizes</h3>
              <p className="text-sm text-gray-600">
                Winners split the full jackpot
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/game">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg transition duration-200 transform hover:scale-105">
                Play Now →
              </button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Requires Base Sepolia testnet ETH
            </p>
          </div>

          {/* Contract Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">
                <strong>Smart Contract:</strong>
              </p>
              <code className="bg-gray-100 px-3 py-1 rounded font-mono text-xs break-all">
                0x88d4B2E2eEEcda1Ece91F55889D21702604e3a6a
              </code>
              <p className="mt-2">
                <a
                  href="https://sepolia.basescan.org/address/0x88d4B2E2eEEcda1Ece91F55889D21702604e3a6a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View on Basescan →
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p>Built with Next.js, Wagmi, OnchainKit, and Solidity</p>
          <p className="mt-1 opacity-80">Base Sepolia Testnet Only</p>
        </div>
      </div>
    </div>
  );
}
