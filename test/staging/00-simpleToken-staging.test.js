// it("Should revert when owner address is zero", async () => {
//     const { helper01, helper02 } = await getNamedAccounts();
//     const allowanceAmount = 129;
//     console.log(simpleTokenContract)
//     console.log("_______________________________________________________________________________________________")
//     console.log("_______________________________________________________________________________________________")
//     console.log("_______________________________________________________________________________________________")
//     //const zeroOwnerContract = await simpleTokenContract.connect(helper02);
//     const zeroOwnerContract = await ethers.getContract("SimpleToken", ZeroAddress);
//     //console.log(zeroOwnerContract)
//     await expect(zeroOwnerContract.approve(helper01, allowanceAmount)).to.be.revertedWith("ERC20InvalidApprover")

// })