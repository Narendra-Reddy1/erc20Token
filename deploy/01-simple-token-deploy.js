const { contractConfig } = require("../helper.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;

    const args = [contractConfig.name, contractConfig.symbol, contractConfig.totalSupply];

    await deploy("SimpleToken", {
        from: deployer,
        args: args,
        log: true
    });

}
module.exports.tags = ["all", "SimpleToken"]