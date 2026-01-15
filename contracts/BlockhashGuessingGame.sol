// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BlockhashGuessingGame
 * @notice A guessing game where players bet ETH amounts (10-50 ETH) to match a winning number
 *         derived from a future block's hash. Winners split the jackpot evenly.
 */
contract BlockhashGuessingGame {
    // ========== STATE VARIABLES ==========

    uint256 public currentRound;
    uint256 public targetBlockNumber;
    uint256 public winningNumber;  // 0 until finalized
    bool public roundActive;
    uint256 public jackpot;

    uint256 public constant BLOCKS_TO_WAIT = 5;
    uint256 public constant MIN_BET = 10 ether;
    uint256 public constant MAX_BET = 50 ether;

    // ========== STRUCTS ==========

    struct Bet {
        address player;
        uint256 amount;
        uint256 timestamp;
    }

    struct GameState {
        uint256 currentRound;
        uint256 targetBlockNumber;
        uint256 currentBlock;
        uint256 blocksRemaining;
        uint256 jackpot;
        uint256 totalBets;
        bool roundActive;
        bool canFinalize;
        uint256 winningNumber;
    }

    // ========== MAPPINGS ==========

    mapping(uint256 => Bet[]) public roundBets;
    mapping(uint256 => address[]) public roundWinners;
    mapping(uint256 => mapping(address => bool)) public hasPlayed;
    mapping(uint256 => uint256) public roundWinningNumbers;

    // ========== EVENTS ==========

    event RoundStarted(uint256 indexed round, uint256 targetBlockNumber);
    event GuessSubmitted(uint256 indexed round, address indexed player, uint256 amount);
    event RoundFinalized(uint256 indexed round, uint256 winningNumber, uint256 winnersCount);
    event WinnersPaid(uint256 indexed round, address[] winners, uint256 payoutPerWinner);
    event JackpotBurned(uint256 indexed round, uint256 amount);
    event NewRoundStarted(uint256 indexed round, uint256 targetBlockNumber);
    event EmergencyFinalize(uint256 indexed round, uint256 winningNumber);

    // ========== ERRORS ==========

    error RoundNotActive();
    error BettingClosed();
    error InvalidBetAmount();
    error AlreadyPlayed();
    error CannotFinalizeYet();
    error BlockhashUnavailable();
    error RoundAlreadyFinalized();
    error PayoutFailed();

    // ========== CONSTRUCTOR ==========

    constructor() {
        currentRound = 1;
        targetBlockNumber = block.number + BLOCKS_TO_WAIT;
        roundActive = true;

        emit RoundStarted(currentRound, targetBlockNumber);
    }

    // ========== EXTERNAL FUNCTIONS ==========

    /**
     * @notice Submit a guess by sending ETH (amount represents your guess)
     * @dev Players can only play once per round, and bets must be between MIN_BET and MAX_BET
     */
    function submitGuess() external payable {
        if (!roundActive) revert RoundNotActive();
        if (block.number >= targetBlockNumber) revert BettingClosed();
        if (msg.value < MIN_BET || msg.value > MAX_BET) revert InvalidBetAmount();
        if (hasPlayed[currentRound][msg.sender]) revert AlreadyPlayed();

        // Store bet
        roundBets[currentRound].push(Bet({
            player: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        // Update jackpot and player status
        jackpot += msg.value;
        hasPlayed[currentRound][msg.sender] = true;

        emit GuessSubmitted(currentRound, msg.sender, msg.value);
    }

    /**
     * @notice Finalize the current round, calculate winners, and distribute jackpot
     * @dev Can be called by anyone once target block is reached
     */
    function finalizeRound() external {
        if (!roundActive) revert RoundAlreadyFinalized();
        if (block.number < targetBlockNumber) revert CannotFinalizeYet();

        // Calculate winning number from blockhash
        uint256 calculatedWinningNumber = _calculateWinningNumber();
        winningNumber = calculatedWinningNumber;
        roundWinningNumbers[currentRound] = calculatedWinningNumber;

        // Find winners
        address[] memory winners = _findWinners(calculatedWinningNumber);

        // Distribute prizes
        uint256 currentJackpot = jackpot;
        if (winners.length > 0) {
            roundWinners[currentRound] = winners;
            uint256 payoutPerWinner = currentJackpot / winners.length;

            // Distribute to winners (CEI pattern - Checks-Effects-Interactions)
            for (uint256 i = 0; i < winners.length; i++) {
                (bool success, ) = payable(winners[i]).call{value: payoutPerWinner}("");
                if (!success) revert PayoutFailed();
            }

            emit WinnersPaid(currentRound, winners, payoutPerWinner);
        } else {
            // No winners - burn the jackpot
            if (currentJackpot > 0) {
                (bool success, ) = payable(address(0)).call{value: currentJackpot}("");
                // If burn fails (unlikely), we continue anyway
                emit JackpotBurned(currentRound, currentJackpot);
            }
        }

        emit RoundFinalized(currentRound, calculatedWinningNumber, winners.length);

        // Reset for new round
        roundActive = false;
        jackpot = 0;

        // Start new round
        _startNewRound();
    }

    /**
     * @notice Emergency finalize when blockhash is unavailable (>256 blocks old)
     * @dev Uses current block hash as fallback randomness
     */
    function emergencyFinalize() external {
        if (!roundActive) revert RoundAlreadyFinalized();
        if (block.number < targetBlockNumber + 256) revert CannotFinalizeYet();

        // Use current block - 1 as fallback
        bytes32 fallbackHash = blockhash(block.number - 1);
        uint256 calculatedWinningNumber = ((uint256(fallbackHash) % 41) + 10) * 1 ether;

        winningNumber = calculatedWinningNumber;
        roundWinningNumbers[currentRound] = calculatedWinningNumber;

        // Find winners
        address[] memory winners = _findWinners(calculatedWinningNumber);

        // Distribute prizes
        uint256 currentJackpot = jackpot;
        if (winners.length > 0) {
            roundWinners[currentRound] = winners;
            uint256 payoutPerWinner = currentJackpot / winners.length;

            for (uint256 i = 0; i < winners.length; i++) {
                (bool success, ) = payable(winners[i]).call{value: payoutPerWinner}("");
                if (!success) revert PayoutFailed();
            }

            emit WinnersPaid(currentRound, winners, payoutPerWinner);
        } else {
            if (currentJackpot > 0) {
                payable(address(0)).call{value: currentJackpot}("");
                emit JackpotBurned(currentRound, currentJackpot);
            }
        }

        emit EmergencyFinalize(currentRound, calculatedWinningNumber);
        emit RoundFinalized(currentRound, calculatedWinningNumber, winners.length);

        roundActive = false;
        jackpot = 0;

        _startNewRound();
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Get comprehensive game state for frontend
     * @return GameState struct with all relevant information
     */
    function getGameState() external view returns (GameState memory) {
        uint256 blocksRemaining = 0;
        if (block.number < targetBlockNumber) {
            blocksRemaining = targetBlockNumber - block.number;
        }

        bool canFinalize = roundActive && block.number >= targetBlockNumber;

        return GameState({
            currentRound: currentRound,
            targetBlockNumber: targetBlockNumber,
            currentBlock: block.number,
            blocksRemaining: blocksRemaining,
            jackpot: jackpot,
            totalBets: roundBets[currentRound].length,
            roundActive: roundActive,
            canFinalize: canFinalize,
            winningNumber: winningNumber
        });
    }

    /**
     * @notice Get all bets for a specific round
     * @param round The round number to query
     * @return Array of Bet structs
     */
    function getRoundBets(uint256 round) external view returns (Bet[] memory) {
        return roundBets[round];
    }

    /**
     * @notice Get all winners for a specific round
     * @param round The round number to query
     * @return Array of winner addresses
     */
    function getRoundWinners(uint256 round) external view returns (address[] memory) {
        return roundWinners[round];
    }

    /**
     * @notice Get a specific player's bet amount for a round
     * @param round The round number to query
     * @param player The player's address
     * @return The bet amount (0 if player didn't play)
     */
    function getPlayerBet(uint256 round, address player) external view returns (uint256) {
        Bet[] memory bets = roundBets[round];
        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].player == player) {
                return bets[i].amount;
            }
        }
        return 0;
    }

    /**
     * @notice Get winning number for a specific round
     * @param round The round number to query
     * @return The winning number for that round
     */
    function getRoundWinningNumber(uint256 round) external view returns (uint256) {
        return roundWinningNumbers[round];
    }

    /**
     * @notice Check if finalization is possible
     * @return True if round can be finalized
     */
    function canFinalize() external view returns (bool) {
        return roundActive && block.number >= targetBlockNumber;
    }

    // ========== INTERNAL FUNCTIONS ==========

    /**
     * @notice Calculate winning number from target block's hash
     * @dev Formula: (blockhash % 41 + 10) * 1 ether = range 10-50 ETH
     * @return The calculated winning number
     */
    function _calculateWinningNumber() internal view returns (uint256) {
        bytes32 blockHash = blockhash(targetBlockNumber);

        // Edge case: blockhash returns 0 if block is >256 blocks old
        if (blockHash == bytes32(0) && block.number > targetBlockNumber + 256) {
            revert BlockhashUnavailable();
        }

        // Calculate winning number: 10-50 ether
        uint256 randomValue = uint256(blockHash);
        uint256 range = (randomValue % 41) + 10;  // 10-50
        return range * 1 ether;
    }

    /**
     * @notice Find all winners who guessed the winning number
     * @param _winningNumber The winning number to match against
     * @return Array of winner addresses
     */
    function _findWinners(uint256 _winningNumber) internal view returns (address[] memory) {
        Bet[] memory bets = roundBets[currentRound];

        // First pass: count winners
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].amount == _winningNumber) {
                winnerCount++;
            }
        }

        // Second pass: collect winner addresses
        address[] memory winners = new address[](winnerCount);
        uint256 index = 0;
        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].amount == _winningNumber) {
                winners[index] = bets[i].player;
                index++;
            }
        }

        return winners;
    }

    /**
     * @notice Start a new round
     * @dev Internal function called after finalization
     */
    function _startNewRound() internal {
        currentRound++;
        targetBlockNumber = block.number + BLOCKS_TO_WAIT;
        roundActive = true;
        winningNumber = 0;

        emit NewRoundStarted(currentRound, targetBlockNumber);
    }
}
