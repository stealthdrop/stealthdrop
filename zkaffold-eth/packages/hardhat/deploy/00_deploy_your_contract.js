// deploy/00_deploy_your_contract.js
// deprecated

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("SDT", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["0x123", "0x111", "0x24037BA1BD610912C8ED2466921FD5470B871B8F60D7D54A48BC20EBD9E0E38E", ["0x000000000000000000000000000000000000000000235c8773854c8cd41150de", "0x0000000000000000000000000000000000000000000c2edbaba8c3bc85ca1b2e", "0x000000000000000000000000000000000000000000052a0832a7b7b254efb97c"]],
    log: true,
  });

  /*
    // Getting a previously deployed contract
    const YourContract = await ethers.getContract("YourContract", deployer);
    await YourContract.setPurpose("Hello");

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */
};
module.exports.tags = ["ZKT"];

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
