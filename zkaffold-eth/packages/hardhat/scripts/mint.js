/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })

const delayMS = 1000 //sometimes xDAI needs a 6000ms break lol 😅

const main = async () => {
  input = ["0x00000000000000000000000000000000000000000000000005d151622426b8c5","0x0000120dbdec4834b7b12168a30487377b1225bdec4b4095b12d025484b434db","0x000012d0d3484b4350212d0d56c4b4355212dc256c4b7095212dcddec4b73502","0x000012dcd56c4b7355212dcda484b7523b12dd48c84e12b7b1384a96c4e13b7b","0x00001384e96c4e4177b1390596c4e419bb1390bdec4e42e5b1390ddec4e521a6","0x00001397bdec4e5a05b139686ec4e5b9bb1396e6a04e5ba3b1396e8c84e5ba91","0x000013972dec4e63a92139bbdec4e6a37b139a816c4e6a1bb139a86984e6a28c","0x0000139aadec4e6aa5b139b496c4e8ef7b13a25dec4e8991b13a264484e8ab7b","0x000013a2a96c4e8b77b13a2da6c4e8b69213a32dec4e96f7b13a483344e931d2","0x000013a924345170b7b145c246c517095b145c25485170a921469bdec51a095b","0x00001468254851a3a3b1468e8c851a4b7b15105dec544165b1510d36c5466f7b","0x00001523bdec548977b1522596c548af7b1522b96c548b77b15232dec548c9d1","0x00001524adec5492a5b2a0486eca813b7b2a05496ca82a1a62a0dbdeca834b7b","0x00002a17bdeca85a1a62a16cdeca85b25b2a16edeca85ba5b2a172deca86ef7b","0x00002a1a8698a86a25b2a1aadeca86aa5b2a1aedeca86ba5b2ad02decab4095b","0x00002ad02548ab434db2ad0d348ab70b7b2adc256cab709522adcd36cab734d2","0x00002add48ecab752322c5dbdecb17095b2c5c2548b172d022c5ccdecb1a1b7b","0x00002c68696cb41237b2d04adecb412a5b2d04ea48b41525b2d0dbdecb4321db","0x00002d0c8748b434b7b2d0d4decb43525b2d1bbdecb46991b2d1a6408b469a92","0x00002d1aadecb46aa5b2d23bdecb4896912d22bdecb48ae5b2d22e8ecb48ba32","0x00002d232decb49217b2d2485c8b4921a62d248734c836f7b320d2decc86ef7b","0x0000321a6538c86ab7b321aa96cc8931db3224c748cb7337b32dcc96ccb73292","0x0000335cc734cd749123369bdeccda4b7b345c86ecd172b7b345ca96cd1a1a34","0x00003468cdecd412b7b3504a96cd466f7b35192decd46ef7b351aadecd46aa5b","0x000035234decd48d25b4090d36d02434d24095bded027377b409cd4090596f7b","0x0000429cdded0b4519b4350e6ed0d56f7b435486990d54b7b4362eded0d8d1bb","0x0000436916ed0e6ef7b439a816d0e6a28c449686991266f7b44992ded4812b7b","0x00005204a96d482ef7b520b2ded485b77b5216eded485ba5b521bbded4869b7b","0x0000521a696d486a1bb521aaded486aa5b521aeded486ba5b521d256d4874952","0x00005225bded4d7095b535c25494da477b536915ed4da45725369196d4e46f7b","0x000053912ded4e5bb7b5396e96d4e6ab7b539aa96d4e8ef7b53a32ded4e8d1bb","0x000053a5bded4ea45c853a9174951735d1545cda456812b7b5a04a96d683350d","0x00005a148699685bb7b5a16e96d686ef7b5a1a6ded6869a5b5a1a86ed686a1a6","0x00005a1aaded686aa5b5a1aeded686ba5b5a1b466d686d1925a1cdded6896f7b","0x00005b848ded6e12b7b5b84a96d6e13b7b5b84e96d6e1519b5b8546496e1525b","0x00005b90dded6e69b7b5b9a696d6e8b77b5ba486996ea225b5ba91ded6ea465b","0x00006385bded8e12b7b6384a96d8e42f7b6390b96d8e5ef7b63972ded8e66f7b","0x000063992ded8e6525b639bbded8e6a24c639aaded8e6aa5b639aeded8e6ba5b","0x000063a3bded8e8b77b63a2e6ed8e8cb7b63a5bded8e92b7b63a4a96d8ea45bb","0x0000650486ed9412b7b6504a96d9413a3b6504e8c99413a926505176d941525b","0x0000650dbded9434b7b6519bded9464b7b65194ded946525b651bbded946a37b","0x0000651a896d947377b651cd409948ab7b6522a96d9496f7b6524816d949204a","0x0000652486999492b7b6524a96d9492d0d6a04adeda812a5b6a04e5eda813972","0x00006a17bdeda85cb7b6a1ae6eda89237b6a25496dae12b7b6b84a96dae42f7b","0x00006b90b96dae5bb7b6b96e96dae66f7b6b98e46dae63a5b6b992dedae8ef7b","0x00006ba5bdedae921a66ba8ddedaea4b7b6d1bbdedb48af7b6d22b96db496f7b","0x00007217bdedc85a1a672172dedc86ab7b721aa96dcb43b7b72d0e96dcc96f7b","0x00007350e6edcd4519b735dbdedcd74b7b73692dedd116f7b744486edd13205b","0x00007456e6edd16a25b7465bdedd26397b7498e5c9d263a927523bdedd48cb7b","0x00008b85bdee2e12b7b8b84a96e2e1384e8b90bdee2e42e5b8b965dee2e5965b","0x00008b99bdee2e64b7b8b9a87362e921bb8ba4869a3412b7b8d04a96e3436f7b","0x00008d0d2dee344377b8d10d36e3466f7b8d18e8ee3463a328d18ea463464b7b","0x00008d1bbdee3469b7b8d1a696e346a05b8d24adee3492a5b9205bdee4812b7b","0x00009204a76e48129d29204a96e483217b920c85ca4832dc8920cb74a483377b","0x0000920cd746485bb7b9216e96e486ef7b921a6dee4869a5b921aadee486aa5b","0x0000921b496e4896f7b9224a4364a46f7b9290ddee4a4355b9290d54a4a44b7b","0x000092d0256e4b4095292d0d36e4b434d292d0d56e4b43552931c256e4c70952","0x000093286dee4e12b7b9384a76e4e12a5b9390bdee4e42e5b9394e5ee4e53972","0x00009397bdee4e5a37b9396869a4e5a1cd9396edee4e5b9bb9396e96e4e5cb7b","0x00009399bdee4e639a893992dee4e6ef7b939a6dee4e69a5b939a816e4e8b77b","0x000093a3496e4e96f7b93a9bdee4ea477b93a9196e4ea4b7b9504adee5412a5b","0x00009510d36e5466f7b9518edee5463a5b95192dee546ef7b951a6dee546ab7b","0x000095225dee548965b9524b42a8d2d22ba34d444a8d41502a350e6ee8d449cd","0x0000a35486aa8d5a1aaa356e12a91321a6a45bbdee91a4b7ba490d36f9ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000e739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739ce739c","0x0000000000000000000000000000000000000000000000000000000000000001"];
  const toAddress = "0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB"

  console.log("\n\n 🎫 Adding then transferring to "+toAddress+"...\n");

  const yourContract = await ethers.getContractAt('WordLinesToken', fs.readFileSync("./artifacts/WordLinesToken.address").toString())

  const king = {
    "description": "Musical EDM king",
    "external_url": "https://nibnalin.me",// <-- this can link to a page for the specific file too
    "image": "https://wordlines.herokuapp.com/puzzles/1.jpeg",
    "name": "WordLines King Puzzle",
  }
  console.log("Uploading king...")
  const uploaded = await ipfs.add(JSON.stringify(king))

  console.log("Minting king with IPFS hash ("+uploaded.path+")")
  await yourContract.addToken(uploaded.path,input,{gasLimit:400000})

  await sleep(delayMS)

  console.log("Transferring Ownership of WordLinesToken to "+toAddress+"...")

  await yourContract.transferOwnership(toAddress)

  await sleep(delayMS)

  // const zebra = {
  //   "description": "What is it so worried about?",
  //   "external_url": "https://austingriffith.com/portfolio/paintings/",// <-- this can link to a page for the specific file too
  //   "image": "https://austingriffith.com/images/paintings/zebra.jpg",
  //   "name": "Zebra",
  //   "attributes": [
  //      {
  //        "trait_type": "BackgroundColor",
  //        "value": "blue"
  //      },
  //      {
  //        "trait_type": "Eyes",
  //        "value": "googly"
  //      },
  //      {
  //        "trait_type": "Stamina",
  //        "value": 38
  //      }
  //   ]
  // }
  // console.log("Uploading zebra...")
  // const uploadedzebra = await ipfs.add(JSON.stringify(zebra))

  // console.log("Minting zebra with IPFS hash ("+uploadedzebra.path+")")
  // await yourContract.mintItem(toAddress,uploadedzebra.path,{gasLimit:400000})



  // await sleep(delayMS)


  // const rhino = {
  //   "description": "What a horn!",
  //   "external_url": "https://austingriffith.com/portfolio/paintings/",// <-- this can link to a page for the specific file too
  //   "image": "https://austingriffith.com/images/paintings/rhino.jpg",
  //   "name": "Rhino",
  //   "attributes": [
  //      {
  //        "trait_type": "BackgroundColor",
  //        "value": "pink"
  //      },
  //      {
  //        "trait_type": "Eyes",
  //        "value": "googly"
  //      },
  //      {
  //        "trait_type": "Stamina",
  //        "value": 22
  //      }
  //   ]
  // }
  // console.log("Uploading rhino...")
  // const uploadedrhino = await ipfs.add(JSON.stringify(rhino))

  // console.log("Minting rhino with IPFS hash ("+uploadedrhino.path+")")
  // await yourContract.mintItem(toAddress,uploadedrhino.path,{gasLimit:400000})



  // await sleep(delayMS)


  // const fish = {
  //   "description": "Is that an underbyte?",
  //   "external_url": "https://austingriffith.com/portfolio/paintings/",// <-- this can link to a page for the specific file too
  //   "image": "https://austingriffith.com/images/paintings/fish.jpg",
  //   "name": "Fish",
  //   "attributes": [
  //      {
  //        "trait_type": "BackgroundColor",
  //        "value": "blue"
  //      },
  //      {
  //        "trait_type": "Eyes",
  //        "value": "googly"
  //      },
  //      {
  //        "trait_type": "Stamina",
  //        "value": 15
  //      }
  //   ]
  // }
  // console.log("Uploading fish...")
  // const uploadedfish = await ipfs.add(JSON.stringify(fish))

  // console.log("Minting fish with IPFS hash ("+uploadedfish.path+")")
  // await yourContract.mintItem(toAddress,uploadedfish.path,{gasLimit:400000})



  // await sleep(delayMS)


  // const flamingo = {
  //   "description": "So delicate.",
  //   "external_url": "https://austingriffith.com/portfolio/paintings/",// <-- this can link to a page for the specific file too
  //   "image": "https://austingriffith.com/images/paintings/flamingo.jpg",
  //   "name": "Flamingo",
  //   "attributes": [
  //      {
  //        "trait_type": "BackgroundColor",
  //        "value": "black"
  //      },
  //      {
  //        "trait_type": "Eyes",
  //        "value": "googly"
  //      },
  //      {
  //        "trait_type": "Stamina",
  //        "value": 6
  //      }
  //   ]
  // }
  // console.log("Uploading flamingo...")
  // const uploadedflamingo = await ipfs.add(JSON.stringify(flamingo))

  // console.log("Minting flamingo with IPFS hash ("+uploadedflamingo.path+")")
  // await yourContract.mintItem(toAddress,uploadedflamingo.path,{gasLimit:400000})





  // const godzilla = {
  //   "description": "Raaaar!",
  //   "external_url": "https://austingriffith.com/portfolio/paintings/",// <-- this can link to a page for the specific file too
  //   "image": "https://austingriffith.com/images/paintings/godzilla.jpg",
  //   "name": "Godzilla",
  //   "attributes": [
  //      {
  //        "trait_type": "BackgroundColor",
  //        "value": "orange"
  //      },
  //      {
  //        "trait_type": "Eyes",
  //        "value": "googly"
  //      },
  //      {
  //        "trait_type": "Stamina",
  //        "value": 99
  //      }
  //   ]
  // }
  // console.log("Uploading godzilla...")
  // const uploadedgodzilla = await ipfs.add(JSON.stringify(godzilla))

  // console.log("Minting godzilla with IPFS hash ("+uploadedgodzilla.path+")")
  // await yourContract.mintItem(toAddress,uploadedgodzilla.path,{gasLimit:400000})




  // await sleep(delayMS)

  /*


  console.log("Minting zebra...")
  await yourContract.mintItem("0xD75b0609ed51307E13bae0F9394b5f63A7f8b6A1","zebra.jpg")

  */


  //const secondContract = await deploy("SecondContract")

  // const exampleToken = await deploy("ExampleToken")
  // const examplePriceOracle = await deploy("ExamplePriceOracle")
  // const smartContractWallet = await deploy("SmartContractWallet",[exampleToken.address,examplePriceOracle.address])



  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */


  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */


  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */

};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });