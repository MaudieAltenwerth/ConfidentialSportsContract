const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BeliefMarketFHE", function () {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BeliefMarketFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    const contract = deployed;
    return { owner, other, contract };
  }

  it("sets owner on deploy", async function () {
    const { owner, contract } = await deployFixture();
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("owner can update platformStake", async function () {
    const { owner, other, contract } = await deployFixture();
    const newStake = ethers.parseEther("0.05");
    await contract.connect(owner).setPlatformStake(newStake);
    expect(await contract.platformStake()).to.equal(newStake);

    await expect(contract.connect(other).setPlatformStake(newStake)).to.be.revertedWith("Not owner");
  });

  it("createBet succeeds with correct stake and params", async function () {
    const { owner, contract } = await deployFixture();
    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    const duration = 60 * 60;

    await expect(
      contract.connect(owner).createBet("bet-1", voteStake, duration, { value: platformStake })
    ).to.emit(contract, "BetCreated");

    const bet = await contract.getBet("bet-1");
    expect(bet.creator).to.equal(owner.address);
    expect(bet.platformStake).to.equal(platformStake);
    expect(bet.voteStake).to.equal(voteStake);
    expect(bet.isResolved).to.equal(false);
  });

  it("createBet reverts on incorrect stake, low voteStake, invalid duration, duplicate id", async function () {
    const { owner, contract } = await deployFixture();
    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");

    await expect(
      contract.connect(owner).createBet("bet-err-1", voteStake, 600, { value: platformStake - 1n })
    ).to.be.revertedWith("Must stake the current platform fee");

    await expect(
      contract.connect(owner).createBet("bet-err-2", ethers.parseEther("0.001"), 600, { value: platformStake })
    ).to.be.revertedWith("Vote stake too low");

    await expect(
      contract.connect(owner).createBet("bet-err-3", voteStake, 60, { value: platformStake })
    ).to.be.revertedWith("Invalid duration");

    await contract.connect(owner).createBet("dup", voteStake, 600, { value: platformStake });
    await expect(
      contract.connect(owner).createBet("dup", voteStake, 600, { value: platformStake })
    ).to.be.revertedWith("Bet already exists");
  });

  it("requestTallyReveal guard checks: only creator and after expiry", async function () {
    const { owner, other, contract } = await deployFixture();
    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("bet-r", voteStake, 600, { value: platformStake });

    // Before expiry: regardless of caller, it should revert with "Bet not expired"
    await expect(contract.connect(owner).requestTallyReveal("bet-r")).to.be.revertedWith("Bet not expired");
    await expect(contract.connect(other).requestTallyReveal("bet-r")).to.be.revertedWith("Bet not expired");

    // After expiry: non-creator should hit the creator check
    await ethers.provider.send("evm_increaseTime", [601]);
    await ethers.provider.send("evm_mine", []);
    await expect(contract.connect(other).requestTallyReveal("bet-r")).to.be.revertedWith("Only creator can request reveal");
  });

  it("claimPrize/claimRefund reverts when not resolved", async function () {
    const { owner, contract } = await deployFixture();
    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("bet-c", voteStake, 600, { value: platformStake });

    await expect(contract.claimPrize("bet-c")).to.be.revertedWith("Bet not resolved");
    await expect(contract.claimRefund("bet-c")).to.be.revertedWith("Bet not resolved");
  });

  it("full flow: simulate votes, resolve yes win, winner claims prize", async function () {
    const { owner, other, contract } = await deployFixture();
    await contract.connect(owner).setTesting(true);
    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("bet-full", voteStake, 600, { value: platformStake });

    await contract.connect(owner).testingMarkVoted("bet-full", owner.address, 1);
    await contract.connect(owner).testingMarkVoted("bet-full", other.address, 0);
    await contract.connect(owner).testingFundPrizePool("bet-full", { value: voteStake * 2n });
    // Use wei-based weights to match prize math units
    await contract.connect(owner).testingResolve("bet-full", voteStake, 0);

    await expect(contract.connect(owner).claimPrize("bet-full")).to.emit(contract, "PrizeDistributed");
    const claimed = await contract.hasUserClaimed("bet-full", owner.address);
    expect(claimed).to.equal(true);

    await expect(contract.connect(other).claimPrize("bet-full")).to.be.revertedWith("Not a winner");
  });

  it("full flow: tie -> refund path", async function () {
    const { owner, other, contract } = await deployFixture();
    await contract.connect(owner).setTesting(true);
    const platformStake = await contract.platformStake();
    const voteStake = ethers.parseEther("0.01");
    await contract.connect(owner).createBet("bet-tie", voteStake, 600, { value: platformStake });

    await contract.connect(owner).testingMarkVoted("bet-tie", owner.address, 1);
    await contract.connect(owner).testingMarkVoted("bet-tie", other.address, 0);
    await contract.connect(owner).testingFundPrizePool("bet-tie", { value: voteStake * 2n });
    await contract.connect(owner).testingResolve("bet-tie", 1, 1);

    await expect(contract.connect(owner).claimRefund("bet-tie")).to.not.be.reverted;
    await expect(contract.connect(other).claimRefund("bet-tie")).to.not.be.reverted;
  });
});


