const { expect, assert } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { contractConfig, developmentChains } = require("../../helper.config");
const { ZeroAddress } = require("ethers");

!developmentChains.includes(network.config.chainId) ? describe.skip : describe("Simple Token", function () {

    let simpleTokenContract, deployer;

    before(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        const simpleToken = await deployments.get("SimpleToken");
        //simpleTokenContract = new ethers.Contract(simpleToken.address, simpleToken.abi, deployer)
        simpleTokenContract = await ethers.getContract("SimpleToken")
    })
    describe("Constructor", function () {

        it("Should initalize properly", async () => {

            const supply = await simpleTokenContract.totalSupply()
            expect(supply.toString()).to.equal(contractConfig.totalSupply.toString())
        })

        it("should popuplate the total supply to deployer", async () => {
            const deployerBalance = await simpleTokenContract.balanceOf(deployer);
            expect(deployerBalance.toString()).to.equal(contractConfig.totalSupply.toString());
        })
        it("Should set the Name and Symbol correct", async () => {
            const symbol = await simpleTokenContract.symbol();
            const name = await simpleTokenContract.name();
            expect(symbol).to.equal(contractConfig.symbol)
            expect(name).to.equal(contractConfig.name);
        })
    })

    describe("Transfers", function () {


        it("Should transfer the amount to the receiver", async () => {
            const accounts = await ethers.getSigners();
            const amount = 100n;
            await simpleTokenContract.connect(deployer)
            const senderBalanceBeforeTx = await simpleTokenContract.balanceOf(deployer);
            const tx = await simpleTokenContract.transfer(accounts[1], amount)
            tx.wait(1);
            const receiverBalance = await simpleTokenContract.balanceOf(accounts[1]);
            const senderBalanceAfterTx = await simpleTokenContract.balanceOf(deployer);
            console.log(senderBalanceBeforeTx, senderBalanceAfterTx)
            expect(senderBalanceBeforeTx.toString()).to.equal((senderBalanceAfterTx + amount).toString());
            expect(receiverBalance.toString()).to.equal((amount).toString());
        })

    })
    describe("Allowance", function () {
        it("Should able to allocate allowances", async () => {
            const { helper01, helper02 } = await getNamedAccounts();
            const allowanceAmount = 129;
            await simpleTokenContract.connect(deployer);
            const tx = await simpleTokenContract.approve(helper01, allowanceAmount);
            const allowance = await simpleTokenContract.allowance(deployer, helper01);
            expect(allowance.toString()).to.equal(allowanceAmount.toString());
            //await expect(tx).to.be.emit(simpleTokenContract, "Approval").withArgs(deployer, helper01, allowanceAmount);
        })
        it("Should emit an event on a allowance", async () => {
            const { helper01, helper02 } = await getNamedAccounts();
            const allowanceAmount = 129;
            await simpleTokenContract.connect(deployer);
            // const tx = await simpleTokenContract.approve(helper01, allowanceAmount);
            // await expect(tx).to.be.emit(simpleTokenContract, "Approval").withArgs(deployer, helper01, allowanceAmount);

            await expect(simpleTokenContract.approve(helper01, allowanceAmount)).to.be.emit(simpleTokenContract, "Approval").withArgs(deployer, helper01, allowanceAmount);
        })

        it("Should able to spend allowances", async () => {
            /* 
            set allowance to an address
            spend the allowance and check the updated  allowance
            */
            const accounts = await ethers.getSigners();
            const spendAmount = 123n;
            const allowanceAmount = 10000n;

            const deployerBalanceBeforeSpent = await simpleTokenContract.balanceOf(deployer);

            await simpleTokenContract.approve(accounts[1], allowanceAmount);
            const initialAllowance = await simpleTokenContract.allowance(deployer, accounts[1]);

            //const helper01Contract = new ethers.Contract("SimpleToken", (await deployments.get("SimpleToken")).abi, helper01);
            const helper01Contract = await simpleTokenContract.connect(accounts[1])
            await expect(helper01Contract.transferFrom(deployer, accounts[2], spendAmount)).to.emit(simpleTokenContract, "Transfer");
            const deployerBalanceAfterSpent = await simpleTokenContract.balanceOf(deployer);

            const updatedAllowance = await simpleTokenContract.allowance(deployer, accounts[1]);
            const balanceOfAc2 = await simpleTokenContract.balanceOf(accounts[2]);
            expect(initialAllowance).to.be.equal(updatedAllowance + spendAmount);
            expect(deployerBalanceBeforeSpent).to.equal(deployerBalanceAfterSpent + spendAmount);
            expect(balanceOfAc2).to.be.equal(spendAmount);
        })
        it("Should revert if allownce limit it crossed", async () => {
            // try to spend more amount than allowance to check reverting
            const accounts = await ethers.getSigners();
            const allowanceAmount = 10000n;

            await simpleTokenContract.approve(accounts[1], allowanceAmount);
            //const helper01Contract = new ethers.Contract("SimpleToken", (await deployments.get("SimpleToken")).abi, helper01);
            const helper01Contract = await simpleTokenContract.connect(accounts[1])
            await expect(helper01Contract.transferFrom(deployer, accounts[2], allowanceAmount * 2n))
                .to.be.revertedWithCustomError(simpleTokenContract, "ERC20InsufficientAllowance")//.withArgs(accounts[1].address, allowanceAmount, allowanceAmount * 2n)
        })
        it("Should revert if allownce spend more than given allowance", async () => {
            // try to spend more amount than allowance to check reverting
            const accounts = await ethers.getSigners();
            const allowanceAmount = 10000n;

            await simpleTokenContract.approve(accounts[1], allowanceAmount);

            //const helper01Contract = new ethers.Contract("SimpleToken", (await deployments.get("SimpleToken")).abi, helper01);
            const helper01Contract = await simpleTokenContract.connect(accounts[1])
            await expect(helper01Contract.transferFrom(deployer, accounts[2], allowanceAmount * 2n))
                .to.be.revertedWithCustomError(helper01Contract, "ERC20InsufficientAllowance")//.withArgs(accounts[1].address, allowanceAmount, allowanceAmount * 2n)
        })

        it("Should revert if owner balance is less than  allowance can spend", async () => {
            // try to spend more amount than availale balance to check reverting

            const accounts = await ethers.getSigners();
            const spendAmount = 123n;

            const deployerBalance = await simpleTokenContract.balanceOf(deployer);

            await simpleTokenContract.approve(accounts[1], deployerBalance);
            await simpleTokenContract.approve(accounts[2], deployerBalance);
            const helper01Contract = await simpleTokenContract.connect(accounts[1]);

            await helper01Contract.transferFrom(deployer, accounts[1], spendAmount * 10n)

            const helper02Contract = await simpleTokenContract.connect(accounts[2]);
            await expect(helper02Contract.transferFrom(deployer, accounts[1], deployerBalance))
                .to.be.revertedWithCustomError(simpleTokenContract, "ERC20InsufficientBalance")
        })

    })

    describe("Burn Tokens", function () {
        it("Should burn tokens", async () => {
            const burnAmount = 12234n;
            const totalSupplyBeforeBurning = await simpleTokenContract.totalSupply();
            await expect(simpleTokenContract.burn(deployer, burnAmount)).to.emit(simpleTokenContract, "Transfer");
            const totalSupplyAfterBurning = await simpleTokenContract.totalSupply();
            expect(totalSupplyAfterBurning).to.be.equal(totalSupplyBeforeBurning - burnAmount);


        })
    })

})