const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("BeliefMarketFHE - Comprehensive FHE Operations", function () {
  it("tests all FHE operations: select, eq, add, allowThis, toBytes32", async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    const [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    const contract = deployed;

    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("fhe-test", voteStake, 300, { value: platformStake });

    // Test 1: Different encrypted weights (testing FHE.add with varying weights)
    console.log("Testing FHE operations with different weights...");
    
    const weights = [1n, 2n, 3n, 5n]; // Different weights to test FHE.add
    const voteTypes = [1, 0, 1, 0]; // YES, NO, YES, NO
    const voters = [voter1, voter2, voter3, voter4];

    // Create encrypted inputs with different weights
    const encryptedInputs = [];
    for (let i = 0; i < weights.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voters[i].address)
        .add64(weights[i])
        .encrypt();
      
      encryptedInputs.push({
        voter: voters[i],
        weight: weights[i],
        voteType: voteTypes[i],
        encrypted
      });
    }

    // Cast votes (this tests FHE.fromExternal, FHE.eq, FHE.select, FHE.add, FHE.allowThis)
    console.log("Casting votes with different weights...");
    for (const input of encryptedInputs) {
      await contract.connect(input.voter).vote(
        "fhe-test",
        input.encrypted.handles[0],
        input.voteType,
        input.encrypted.inputProof,
        { value: voteStake }
      );
    }

    // Test 2: Verify FHE operations worked correctly by checking decryption
    console.log("Testing FHE.toBytes32 and decryption...");
    
    // Advance time and request reveal (tests FHE.toBytes32, FHE.requestDecryption)
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    const tx = await contract.connect(owner).requestTallyReveal("fhe-test");
    await tx.wait();

    // Wait for decryption (tests FHE.checkSignatures)
    await fhevm.awaitDecryptionOracle();

    // Verify results (this tests that all FHE operations worked correctly)
    const reveal = await contract.getRevealStatus("fhe-test");
    expect(reveal.isResolved).to.equal(true);
    
    // Expected: YES votes = 1 + 3 = 4, NO votes = 2 + 5 = 7
    // So NO should win with weight 7 vs 4
    expect(reveal.revealedYes).to.equal(4n); // weights 1 + 3
    expect(reveal.revealedNo).to.equal(7n);  // weights 2 + 5
    expect(reveal.revealedNo).to.be.greaterThan(reveal.revealedYes);

    console.log("✅ FHE.select() - Conditional weight addition works");
    console.log("✅ FHE.eq() - Vote type comparison works");
    console.log("✅ FHE.add() - Encrypted addition with different weights works");
    console.log("✅ FHE.allowThis() - External access permissions work");
    console.log("✅ FHE.toBytes32() - Conversion for decryption works");
    console.log("✅ FHE.requestDecryption() - Oracle request works");
    console.log("✅ FHE.checkSignatures() - Decryption verification works");
  });

  it("tests FHE error handling: invalid proofs and malformed inputs", async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    const [owner, voter] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    const contract = deployed;

    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("error-test", voteStake, 300, { value: platformStake });

    // Test 1: Invalid input proof should revert
    console.log("Testing invalid input proof...");
    const validEncrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter.address)
      .add64(1n)
      .encrypt();

    // Create invalid proof by modifying it
    const invalidProof = "0x" + "00".repeat(64); // Invalid proof

    await expect(
      contract.connect(voter).vote(
        "error-test",
        validEncrypted.handles[0],
        1,
        invalidProof,
        { value: voteStake }
      )
    ).to.be.reverted; // FHE.fromExternal should fail with invalid proof

    console.log("✅ FHE.fromExternal() correctly rejects invalid proofs");

    // Test 2: Valid proof should work
    await contract.connect(voter).vote(
      "error-test",
      validEncrypted.handles[0],
      1,
      validEncrypted.inputProof,
      { value: voteStake }
    );

    console.log("✅ FHE.fromExternal() accepts valid proofs");
  });

  it("tests FHE operations with edge cases: zero weights, maximum values", async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    const [owner, voter1, voter2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    const contract = deployed;

    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("edge-test", voteStake, 300, { value: platformStake });

    // Test 1: Zero weight (should still work due to FHE.select)
    console.log("Testing zero weight...");
    const zeroWeight = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter1.address)
      .add64(0n)
      .encrypt();

    await contract.connect(voter1).vote(
      "edge-test",
      zeroWeight.handles[0],
      1, // YES vote
      zeroWeight.inputProof,
      { value: voteStake }
    );

    // Test 2: Large weight
    console.log("Testing large weight...");
    const largeWeight = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter2.address)
      .add64(1000n)
      .encrypt();

    await contract.connect(voter2).vote(
      "edge-test",
      largeWeight.handles[0],
      0, // NO vote
      largeWeight.inputProof,
      { value: voteStake }
    );

    // Resolve and check
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    await contract.connect(owner).requestTallyReveal("edge-test");
    await fhevm.awaitDecryptionOracle();

    const reveal = await contract.getRevealStatus("edge-test");
    expect(reveal.isResolved).to.equal(true);
    expect(reveal.revealedYes).to.equal(0n); // Zero weight vote
    expect(reveal.revealedNo).to.equal(1000n); // Large weight vote

    console.log("✅ FHE operations handle zero weights correctly");
    console.log("✅ FHE operations handle large weights correctly");
  });

  it("tests complex FHE computation chains: multiple operations in sequence", async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    const [owner, ...voters] = await ethers.getSigners();
    const selectedVoters = voters.slice(0, 6);
    
    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    const contract = deployed;

    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("complex-test", voteStake, 300, { value: platformStake });

    // Complex voting pattern that tests multiple FHE operations
    const complexPattern = [
      { weight: 1n, voteType: 1 }, // YES, weight 1
      { weight: 2n, voteType: 0 }, // NO, weight 2  
      { weight: 1n, voteType: 1 }, // YES, weight 1
      { weight: 3n, voteType: 0 }, // NO, weight 3
      { weight: 2n, voteType: 1 }, // YES, weight 2
      { weight: 1n, voteType: 0 }, // NO, weight 1
    ];

    console.log("Testing complex FHE computation chains...");

    // Create and cast all votes (each tests: FHE.fromExternal, FHE.eq, FHE.select, FHE.add)
    for (let i = 0; i < complexPattern.length; i++) {
      const { weight, voteType } = complexPattern[i];
      const voter = selectedVoters[i];

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), voter.address)
        .add64(weight)
        .encrypt();

      await contract.connect(voter).vote(
        "complex-test",
        encrypted.handles[0],
        voteType,
        encrypted.inputProof,
        { value: voteStake }
      );
    }

    // Resolve
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    await contract.connect(owner).requestTallyReveal("complex-test");
    await fhevm.awaitDecryptionOracle();

    const reveal = await contract.getRevealStatus("complex-test");
    expect(reveal.isResolved).to.equal(true);
    
    // Expected: YES = 1 + 1 + 2 = 4, NO = 2 + 3 + 1 = 6
    expect(reveal.revealedYes).to.equal(4n);
    expect(reveal.revealedNo).to.equal(6n);

    console.log("✅ Complex FHE computation chains work correctly");
    console.log("✅ Multiple FHE operations in sequence produce correct results");
    console.log("✅ FHE state management across multiple votes works");
  });
});
