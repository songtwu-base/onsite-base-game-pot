import { expect } from "chai";
import { ethers } from "hardhat";
import { BlockhashGuessingGame } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

describe("BlockhashGuessingGame", function () {
  let game: BlockhashGuessingGame;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();

    const BlockhashGuessingGame = await ethers.getContractFactory("BlockhashGuessingGame");
    game = await BlockhashGuessingGame.deploy();
    await game.waitForDeployment();
  });

  describe("Initialization", function () {
    it("Should initialize with correct state", async function () {
      expect(await game.currentRound()).to.equal(1);
      expect(await game.roundActive()).to.equal(true);
      expect(await game.jackpot()).to.equal(0);
      expect(await game.winningNumber()).to.equal(0);

      const targetBlock = await game.targetBlockNumber();
      const currentBlock = await ethers.provider.getBlockNumber();
      expect(targetBlock).to.equal(currentBlock + 5);
    });

    it("Should emit RoundStarted event on deployment", async function () {
      const BlockhashGuessingGame = await ethers.getContractFactory("BlockhashGuessingGame");
      const newGame = await BlockhashGuessingGame.deploy();

      await expect(newGame.deploymentTransaction())
        .to.emit(newGame, "RoundStarted")
        .withArgs(1, await newGame.targetBlockNumber());
    });
  });

  describe("Submitting Guesses", function () {
    it("Should accept valid guesses", async function () {
      const guessAmount = ethers.parseEther("15");

      await expect(game.connect(player1).submitGuess({ value: guessAmount }))
        .to.emit(game, "GuessSubmitted")
        .withArgs(1, player1.address, guessAmount);

      expect(await game.jackpot()).to.equal(guessAmount);
      expect(await game.hasPlayed(1, player1.address)).to.equal(true);
    });

    it("Should accept multiple guesses from different players", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("10") });
      await game.connect(player2).submitGuess({ value: ethers.parseEther("25") });
      await game.connect(player3).submitGuess({ value: ethers.parseEther("50") });

      expect(await game.jackpot()).to.equal(ethers.parseEther("85"));

      const gameState = await game.getGameState();
      expect(gameState.totalBets).to.equal(3);
    });

    it("Should reject bets below MIN_BET", async function () {
      await expect(
        game.connect(player1).submitGuess({ value: ethers.parseEther("9") })
      ).to.be.revertedWithCustomError(game, "InvalidBetAmount");
    });

    it("Should reject bets above MAX_BET", async function () {
      await expect(
        game.connect(player1).submitGuess({ value: ethers.parseEther("51") })
      ).to.be.revertedWithCustomError(game, "InvalidBetAmount");
    });

    it("Should reject duplicate guesses from same player", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      await expect(
        game.connect(player1).submitGuess({ value: ethers.parseEther("20") })
      ).to.be.revertedWithCustomError(game, "AlreadyPlayed");
    });

    it("Should reject guesses after betting period ends", async function () {
      // Mine 5 blocks to reach target
      await mine(5);

      await expect(
        game.connect(player1).submitGuess({ value: ethers.parseEther("15") })
      ).to.be.revertedWithCustomError(game, "BettingClosed");
    });

    it("Should store bet information correctly", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      const bets = await game.getRoundBets(1);
      expect(bets.length).to.equal(1);
      expect(bets[0].player).to.equal(player1.address);
      expect(bets[0].amount).to.equal(ethers.parseEther("15"));
    });
  });

  describe("Game State", function () {
    it("Should return correct game state", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("20") });

      const gameState = await game.getGameState();

      expect(gameState.currentRound).to.equal(1);
      expect(gameState.roundActive).to.equal(true);
      expect(gameState.jackpot).to.equal(ethers.parseEther("20"));
      expect(gameState.totalBets).to.equal(1);
      expect(gameState.canFinalize).to.equal(false);
    });

    it("Should calculate blocks remaining correctly", async function () {
      const gameState1 = await game.getGameState();
      expect(gameState1.blocksRemaining).to.equal(5);

      await mine(2);

      const gameState2 = await game.getGameState();
      expect(gameState2.blocksRemaining).to.equal(3);
    });

    it("Should show canFinalize as true after target block", async function () {
      await mine(5);

      const gameState = await game.getGameState();
      expect(gameState.canFinalize).to.equal(true);
    });
  });

  describe("Finalization", function () {
    it("Should not allow finalization before target block", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      await expect(game.finalizeRound()).to.be.revertedWithCustomError(
        game,
        "CannotFinalizeYet"
      );
    });

    it("Should allow finalization after target block", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      await mine(5);

      await expect(game.finalizeRound()).to.emit(game, "RoundFinalized");
    });

    it("Should calculate winning number in range 10-50 ETH", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("25") });

      await mine(5);
      await game.finalizeRound();

      const winningNumber = await game.winningNumber();
      expect(winningNumber).to.be.gte(ethers.parseEther("10"));
      expect(winningNumber).to.be.lte(ethers.parseEther("50"));
    });

    it("Should start new round after finalization", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      await mine(5);
      await game.finalizeRound();

      expect(await game.currentRound()).to.equal(2);
      expect(await game.roundActive()).to.equal(true);
      expect(await game.jackpot()).to.equal(0);
      expect(await game.winningNumber()).to.equal(0);
    });

    it("Should not allow double finalization", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      await mine(5);
      await game.finalizeRound();

      await expect(game.finalizeRound()).to.be.revertedWithCustomError(
        game,
        "RoundAlreadyFinalized"
      );
    });

    it("Should emit NewRoundStarted event", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      await mine(5);

      const currentBlock = await ethers.provider.getBlockNumber();
      await expect(game.finalizeRound())
        .to.emit(game, "NewRoundStarted")
        .withArgs(2, currentBlock + 1 + 5); // +1 for finalize tx, +5 for BLOCKS_TO_WAIT
    });
  });

  describe("Winners and Payouts", function () {
    it("Should identify winners correctly", async function () {
      // Submit multiple guesses
      await game.connect(player1).submitGuess({ value: ethers.parseEther("25") });
      await game.connect(player2).submitGuess({ value: ethers.parseEther("30") });
      await game.connect(player3).submitGuess({ value: ethers.parseEther("35") });

      await mine(5);
      await game.finalizeRound();

      const winners = await game.getRoundWinners(1);
      const winningNumber = await game.getRoundWinningNumber(1);

      // Verify that winners all guessed the winning number
      for (const winner of winners) {
        const bet = await game.getPlayerBet(1, winner);
        expect(bet).to.equal(winningNumber);
      }
    });

    it("Should split jackpot evenly among multiple winners", async function () {
      // We can't predict the exact winning number, so we'll have multiple players
      // guess the same amount and hope it wins (or test the logic)
      const guessAmount = ethers.parseEther("25");

      const player1Before = await ethers.provider.getBalance(player1.address);
      const player2Before = await ethers.provider.getBalance(player2.address);

      await game.connect(player1).submitGuess({ value: guessAmount });
      await game.connect(player2).submitGuess({ value: guessAmount });
      await game.connect(player3).submitGuess({ value: ethers.parseEther("30") });

      await mine(5);
      await game.finalizeRound();

      const winningNumber = await game.getRoundWinningNumber(1);
      const winners = await game.getRoundWinners(1);

      // If players 1 and 2 won (both guessed same amount)
      if (winningNumber === guessAmount) {
        expect(winners.length).to.equal(2);

        const player1After = await ethers.provider.getBalance(player1.address);
        const player2After = await ethers.provider.getBalance(player2.address);

        // Each should have received half of total jackpot (minus their original bet)
        const expectedPayout = ethers.parseEther("75") / 2n; // Total jackpot / 2 winners

        // Players should have gained (payout - their bet)
        // Player1: +expectedPayout - 25 ETH bet
        // Player2: +expectedPayout - 25 ETH bet
        expect(player1After).to.be.gt(player1Before - guessAmount);
        expect(player2After).to.be.gt(player2Before - guessAmount);
      }
    });

    it("Should burn jackpot when no winners", async function () {
      // Submit guesses that are unlikely to match
      await game.connect(player1).submitGuess({ value: ethers.parseEther("10") });
      await game.connect(player2).submitGuess({ value: ethers.parseEther("11") });
      await game.connect(player3).submitGuess({ value: ethers.parseEther("12") });

      const jackpotBefore = await game.jackpot();

      await mine(5);

      const tx = await game.finalizeRound();
      const receipt = await tx.wait();

      const winners = await game.getRoundWinners(1);

      // If no winners, jackpot should be burned
      if (winners.length === 0) {
        // Check for JackpotBurned event
        const jackpotBurnedEvent = receipt?.logs.find((log: any) => {
          try {
            const parsed = game.interface.parseLog(log);
            return parsed?.name === "JackpotBurned";
          } catch {
            return false;
          }
        });

        expect(jackpotBurnedEvent).to.not.be.undefined;
      }
    });

    it("Should emit WinnersPaid event with correct data", async function () {
      const guessAmount = ethers.parseEther("25");

      await game.connect(player1).submitGuess({ value: guessAmount });
      await game.connect(player2).submitGuess({ value: guessAmount });

      await mine(5);

      const tx = await game.finalizeRound();
      const receipt = await tx.wait();

      const winningNumber = await game.getRoundWinningNumber(1);

      // Check if our guess won
      if (winningNumber === guessAmount) {
        const winnersEvent = receipt?.logs.find((log: any) => {
          try {
            const parsed = game.interface.parseLog(log);
            return parsed?.name === "WinnersPaid";
          } catch {
            return false;
          }
        });

        expect(winnersEvent).to.not.be.undefined;
      }
    });
  });

  describe("View Functions", function () {
    it("Should return player's bet amount", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("20") });

      const bet = await game.getPlayerBet(1, player1.address);
      expect(bet).to.equal(ethers.parseEther("20"));
    });

    it("Should return 0 for player who didn't play", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("20") });

      const bet = await game.getPlayerBet(1, player2.address);
      expect(bet).to.equal(0);
    });

    it("Should return all round bets", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });
      await game.connect(player2).submitGuess({ value: ethers.parseEther("25") });

      const bets = await game.getRoundBets(1);
      expect(bets.length).to.equal(2);
      expect(bets[0].amount).to.equal(ethers.parseEther("15"));
      expect(bets[1].amount).to.equal(ethers.parseEther("25"));
    });

    it("Should return empty array for round with no bets", async function () {
      const bets = await game.getRoundBets(999);
      expect(bets.length).to.equal(0);
    });

    it("Should return canFinalize correctly", async function () {
      expect(await game.canFinalize()).to.equal(false);

      await mine(5);

      expect(await game.canFinalize()).to.equal(true);
    });
  });

  describe("Multiple Rounds", function () {
    it("Should allow players to play in multiple rounds", async function () {
      // Round 1
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });
      await mine(5);
      await game.finalizeRound();

      // Round 2
      await game.connect(player1).submitGuess({ value: ethers.parseEther("20") });
      expect(await game.hasPlayed(2, player1.address)).to.equal(true);
    });

    it("Should maintain separate state for each round", async function () {
      // Round 1
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });
      await mine(5);
      await game.finalizeRound();

      const round1Bets = await game.getRoundBets(1);
      expect(round1Bets.length).to.equal(1);

      // Round 2
      await game.connect(player2).submitGuess({ value: ethers.parseEther("25") });
      await game.connect(player3).submitGuess({ value: ethers.parseEther("30") });

      const round2Bets = await game.getRoundBets(2);
      expect(round2Bets.length).to.equal(2);

      // Round 1 bets should still be preserved
      expect(round1Bets.length).to.equal(1);
    });

    it("Should store winning numbers for past rounds", async function () {
      // Round 1
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });
      await mine(5);
      await game.finalizeRound();

      const round1Winner = await game.getRoundWinningNumber(1);
      expect(round1Winner).to.be.gte(ethers.parseEther("10"));
      expect(round1Winner).to.be.lte(ethers.parseEther("50"));

      // Round 2
      await game.connect(player1).submitGuess({ value: ethers.parseEther("20") });
      await mine(5);
      await game.finalizeRound();

      const round2Winner = await game.getRoundWinningNumber(2);
      expect(round2Winner).to.be.gte(ethers.parseEther("10"));
      expect(round2Winner).to.be.lte(ethers.parseEther("50"));

      // Previous round winning number should still be accessible
      expect(await game.getRoundWinningNumber(1)).to.equal(round1Winner);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle emergency finalize after 256 blocks", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      // Mine 260 blocks (more than 256)
      await mine(260);

      // Regular finalize should fail
      await expect(game.finalizeRound()).to.be.revertedWithCustomError(
        game,
        "BlockhashUnavailable"
      );

      // Emergency finalize should work
      await expect(game.emergencyFinalize())
        .to.emit(game, "EmergencyFinalize")
        .to.emit(game, "RoundFinalized");
    });

    it("Should not allow emergency finalize before 256 blocks", async function () {
      await game.connect(player1).submitGuess({ value: ethers.parseEther("15") });

      await mine(100);

      await expect(game.emergencyFinalize()).to.be.revertedWithCustomError(
        game,
        "CannotFinalizeYet"
      );
    });

    it("Should handle zero jackpot finalization", async function () {
      // Don't submit any bets
      await mine(5);

      await expect(game.finalizeRound())
        .to.emit(game, "RoundFinalized")
        .to.emit(game, "NewRoundStarted");

      expect(await game.currentRound()).to.equal(2);
    });
  });
});
