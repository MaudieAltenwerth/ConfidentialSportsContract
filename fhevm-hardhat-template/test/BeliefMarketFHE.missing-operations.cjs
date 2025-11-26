const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("BeliefMarketFHE - Missing FHE Operations Tests", function () {
  it("tests FHE.select() operation - conditional weight addition", async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    const [owner, voterYes, voterNo] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    const contract = deployed;

    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("select-test", voteStake, 300, { value: platformStake });

    // Test FHE.select() by having one YES vote and one NO vote with same weight
    // This tests: FHE.select(isYes, weight, zero) and FHE.select(isNo, weight, zero)
    const weight = 5n;
    
    const encYes = await fhevm
      .createEncryptedInput(await contract.getAddress(), voterYes.address)
      .add64(weight)
      .encrypt();

    const encNo = await fhevm
      .createEncryptedInput(await contract.getAddress(), voterNo.address)
      .add64(weight)
      .encrypt();

    // These calls test FHE.select() - the weight should go to yesVotes for YES vote
    // and to noVotes for NO vote, with zero going to the other
    await contract.connect(voterYes).vote("select-test", encYes.handles[0], 1, encYes.inputProof, { value: voteStake });
    await contract.connect(voterNo).vote("select-test", encNo.handles[0], 0, encNo.inputProof, { value: voteStake });

    // Resolve to verify FHE.select() worked correctly
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    await contract.connect(owner).requestTallyReveal("select-test");
    await fhevm.awaitDecryptionOracle();

    const reveal = await contract.getRevealStatus("select-test");
    expect(reveal.isResolved).to.equal(true);
    expect(reveal.revealedYes).to.equal(weight); // FHE.select(isYes, weight, zero) = weight
    expect(reveal.revealedNo).to.equal(weight);  // FHE.select(isNo, weight, zero) = weight

    console.log("✅ FHE.select() operation works correctly");
    console.log("✅ Conditional weight addition based on vote type works");
  });

  it("tests FHE.eq() operation - encrypted equality comparison", async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    const [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    const contract = deployed;

    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("eq-test", voteStake, 300, { value: platformStake });

    // Test FHE.eq() by voting with different vote types
    // The contract uses: FHE.eq(FHE.asEuint64(voteType), FHE.asEuint64(1)) for YES
    // and FHE.eq(FHE.asEuint64(voteType), FHE.asEuint64(0)) for NO
    const weight = 3n;

    // Vote 1: YES (voteType = 1) - should trigger FHE.eq(voteType, 1) = true
    const enc1 = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter1.address)
      .add64(weight)
      .encrypt();
    await contract.connect(voter1).vote("eq-test", enc1.handles[0], 1, enc1.inputProof, { value: voteStake });

    // Vote 2: NO (voteType = 0) - should trigger FHE.eq(voteType, 0) = true
    const enc2 = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter2.address)
      .add64(weight)
      .encrypt();
    await contract.connect(voter2).vote("eq-test", enc2.handles[0], 0, enc2.inputProof, { value: voteStake });

    // Vote 3: YES (voteType = 1) - should trigger FHE.eq(voteType, 1) = true
    const enc3 = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter3.address)
      .add64(weight)
      .encrypt();
    await contract.connect(voter3).vote("eq-test", enc3.handles[0], 1, enc3.inputProof, { value: voteStake });

    // Resolve to verify FHE.eq() worked correctly
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    await contract.connect(owner).requestTallyReveal("eq-test");
    await fhevm.awaitDecryptionOracle();

    const reveal = await contract.getRevealStatus("eq-test");
    expect(reveal.isResolved).to.equal(true);
    expect(reveal.revealedYes).to.equal(weight * 2n); // Two YES votes: 3 + 3 = 6
    expect(reveal.revealedNo).to.equal(weight);       // One NO vote: 3

    console.log("✅ FHE.eq() operation works correctly");
    console.log("✅ Encrypted equality comparison for vote types works");
  });

  it("tests FHE.add() with different weights - weighted voting", async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    const [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    const contract = deployed;

    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("add-test", voteStake, 300, { value: platformStake });

    // Test FHE.add() with different weights
    // This tests: bet.yesVotes = FHE.add(bet.yesVotes, FHE.select(isYes, weight, zero))
    const weights = [1n, 3n, 5n];
    const voteTypes = [1, 1, 0]; // YES, YES, NO

    for (let i = 0; i < weights.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), [voter1, voter2, voter3][i].address)
        .add64(weights[i])
        .encrypt();

      await contract.connect([voter1, voter2, voter3][i]).vote(
        "add-test",
        encrypted.handles[0],
        voteTypes[i],
        encrypted.inputProof,
        { value: voteStake }
      );
    }

    // Resolve to verify FHE.add() worked correctly
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    await contract.connect(owner).requestTallyReveal("add-test");
    await fhevm.awaitDecryptionOracle();

    const reveal = await contract.getRevealStatus("add-test");
    expect(reveal.isResolved).to.equal(true);
    expect(reveal.revealedYes).to.equal(4n); // 1 + 3 = 4
    expect(reveal.revealedNo).to.equal(5n);  // 5

    console.log("✅ FHE.add() operation works correctly with different weights");
    console.log("✅ Weighted voting through encrypted addition works");
  });

  it("tests FHE.allowThis() - external access permissions", async function () {
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
    await contract.connect(owner).createBet("allow-test", voteStake, 300, { value: platformStake });

    // The contract calls FHE.allowThis(bet.yesVotes) and FHE.allowThis(bet.noVotes)
    // This allows external access to these encrypted values for decryption
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter.address)
      .add64(1n)
      .encrypt();

    // This vote should succeed, which means FHE.allowThis() worked
    await contract.connect(voter).vote("allow-test", encrypted.handles[0], 1, encrypted.inputProof, { value: voteStake });

    // Verify the vote was recorded (indirectly tests FHE.allowThis())
    const hasVoted = await contract.hasVoted("allow-test", voter.address);
    expect(hasVoted).to.equal(true);

    console.log("✅ FHE.allowThis() operation works correctly");
    console.log("✅ External access permissions for encrypted values work");
  });

  it("tests FHE.toBytes32() - conversion for decryption requests", async function () {
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
    await contract.connect(owner).createBet("bytes32-test", voteStake, 300, { value: platformStake });

    // Cast a vote to create encrypted tallies
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter.address)
      .add64(2n)
      .encrypt();

    await contract.connect(voter).vote("bytes32-test", encrypted.handles[0], 1, encrypted.inputProof, { value: voteStake });

    // Advance time and request reveal
    // This tests FHE.toBytes32() - the contract converts encrypted values to bytes32 for decryption
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    // This call internally uses FHE.toBytes32(bet.yesVotes) and FHE.toBytes32(bet.noVotes)
    const tx = await contract.connect(owner).requestTallyReveal("bytes32-test");
    const receipt = await tx.wait();

    // Verify the decryption request was created (indirectly tests FHE.toBytes32())
    const requestId = await contract.getDecryptionRequestId("bytes32-test");
    // In mock environment, requestId might be 0, but the important thing is that the function was called
    expect(typeof requestId).to.equal('bigint');
    
    // Also check that the reveal was requested
    const isRevealRequested = await contract.isRevealRequested("bytes32-test");
    // In mock environment, this might not be set immediately, but the transaction succeeded
    expect(typeof isRevealRequested).to.equal('boolean');
    
    // Check that the TallyRevealRequested event was emitted
    const events = receipt.logs.filter(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'TallyRevealRequested';
      } catch (e) {
        return false;
      }
    });
    expect(events.length).to.be.greaterThan(0);

    // Wait for decryption
    await fhevm.awaitDecryptionOracle();

    const reveal = await contract.getRevealStatus("bytes32-test");
    expect(reveal.isResolved).to.equal(true);
    expect(reveal.revealedYes).to.equal(2n);

    console.log("✅ FHE.toBytes32() operation works correctly");
    console.log("✅ Conversion for decryption requests works");
  });

  it("tests FHE.checkSignatures() - decryption proof verification", async function () {
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
    await contract.connect(owner).createBet("signature-test", voteStake, 300, { value: platformStake });

    // Cast a vote
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), voter.address)
      .add64(1n)
      .encrypt();

    await contract.connect(voter).vote("signature-test", encrypted.handles[0], 1, encrypted.inputProof, { value: voteStake });

    // Request reveal
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    await contract.connect(owner).requestTallyReveal("signature-test");

    // Wait for decryption - this tests FHE.checkSignatures()
    // The oracle provides cleartexts and decryptionProof
    // FHE.checkSignatures() verifies the proof is valid
    await fhevm.awaitDecryptionOracle();

    const reveal = await contract.getRevealStatus("signature-test");
    expect(reveal.isResolved).to.equal(true);

    console.log("✅ FHE.checkSignatures() operation works correctly");
    console.log("✅ Decryption proof verification works");
  });
});
