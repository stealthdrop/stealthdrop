import stringify from "fast-json-stable-stringify";
import styled from "styled-components/macro";

import React from "react";
import { useState } from "react";
import { generateProofInputs } from "../GenerateProof";
import { isEligible } from "../AirdropData";
import { Heading1 } from "./lolcss";
import { useMemo } from "react";
import { Address } from ".";
import { ethers } from "ethers";
import { useContractLoader } from "../hooks";
import { Transactor } from "../helpers";
import { CheckCircle, Circle, GitHub, XCircle } from "react-feather";
import { useLookupAddress } from "../hooks";
import { useGasPrice } from "eth-hooks";

const signText = "zk-airdrop";
const signTextHash = "0x52a0832a7b7b254efb97c30bb6eaea30ef217286cba35c8773854c8cd41150de";

const backendUrl = "https://backend.stealthdrop.xyz/";
// http://localhost:3001/"; // http://45.76.66.251/

async function postData(url = "", data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: [["Content-Type", "application/json"]],
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response; // parses JSON response into native JavaScript objects
}

export default function Withdraw({
  signer,
  address,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  mainnetProvider,
  provider,
  transactor,
  gasPrice,
}) {
  const [signature, setSignature] = useState();
  const [proof, setProof] = useState();
  const [proofStatus, setProofStatus] = useState("GENERATE");
  const [step, setStep] = useState(1);

  const ensName = useLookupAddress(mainnetProvider, address);
  const contracts = useContractLoader(provider);

  const displayAddress = address => {
    if (!address) {
      return "";
    }
    let displayAddress = address.substr(0, 6);

    if (ensName && ensName.indexOf("0x") < 0) {
      displayAddress = ensName;
    } else {
      displayAddress += "..." + address.substr(-4);
    }
    return displayAddress;
  };

  const signMessage = async () => {
    console.log("signer", signer);
    const msgTransaction = await signer.signMessage(signText);
    console.log("msgTransaction", msgTransaction);
    const msgHash = ethers.utils.hashMessage(signText);
    const publicKey = ethers.utils.recoverPublicKey(msgHash, ethers.utils.arrayify(msgTransaction));
    setSignature({ sign: msgTransaction, address, publicKey });
    console.log("hash", msgHash);
    console.log("verify", ethers.utils.verifyMessage(signText, msgTransaction));
  };

  const generateZKProof = async () => {
    if (!signature) {
      return;
    }
    setProofStatus("ASSEMBLING");
    const inputs = await generateProofInputs(
      signature.address,
      signature.sign,
      signature.publicKey,
      address,
      ethers.utils.hashMessage(signText),
    );
    console.log("inputs", inputs);
    console.log("stringify'd inputs", JSON.stringify(inputs));
    if (!inputs) return;
    // send api post request to generate proof
    const returnData = await postData(backendUrl + "generate_proof", inputs);
    if (!returnData.ok) {
      alert("Error generating proof, please try again later");
      return;
    }
    const returnJSON = await returnData.json();
    setProofStatus(returnJSON && returnJSON["id"] ? "LOADING" : "ERROR!");
    const processId = returnJSON["id"];
    console.log("processId", processId);

    const intervalId = setInterval(async () => {
      const res = await postData(backendUrl + "result", { id: processId });
      if (res.status === 200) {
        const json = await res.json();
        if (!json) {
          console.log("error", res);
          clearInterval(intervalId);
          setProofStatus("ERROR: SERVER LOAD HIGH, RETRY LATER!");
        } else {
          setProof(json);
          clearInterval(intervalId);
          setProofStatus("GENERATED");
        }
      } else if (res.status === 400) {
        setProofStatus("LOADING");
      } else {
        console.log("error", res);
        clearInterval(intervalId);
        setProofStatus("ERROR: SERVER LOAD HIGH, RETRY LATER!");
      }
    }, 10000);
  };

  const eligibility = useMemo(() => {
    const adr = signature?.address || address;
    if (!adr) {
      return null;
    }
    return isEligible(adr);
  }, [signature, address]);

  const claim = async () => {
    if (!proof) {
      return;
    }
    const contract = contracts ? contracts["SDT"] : "";
    if (!contract) {
      console.log("contract not found");
      return;
    }
    console.log("claim: ", proof, contract);
    const claimTokens = contract.connect(signer)["claimTokens"];
    const returned = await transactor(claimTokens(proof["pi_a"], proof["pi_b"], proof["pi_c"], proof["inputs"]));
    console.log("returned", returned);
  };

  // const chestQuota = useMemo(async () => {
  //   const contract = contracts ? contracts["SDT"] : "";
  //   if (!proof || !contract || !gasPrice) {
  //     console.log("proof/contract not found");
  //     return false;
  //   }
  //   const quota = await contract.connect(signer)["getChestQuota"]();
  //   const claimTokensGas = await contract.estimateGas.claimTokens(proof["pi_a"], proof["pi_b"], proof["pi_c"], proof["inputs"]);
  //   console.log("gasPrice", gasPrice);
  //   console.log("claimTokensGas", claimTokensGas);
  //   console.log("estimatedGasPrice", claimTokensGas * gasPrice);
  //   console.log("quota", quota);
  //   return claimTokensGas * gasPrice * 5 < quota;
  // }, [contracts, proof, gasPrice]);

  return (
    <div style={{ margin: "auto", width: "70vw", display: "flex", flexDirection: "column", padding: "16px" }}>
      {/* {address && (
        <Bootoon onClick={logoutOfWeb3Modal} style={{ width: "35px", marginRight: "auto" }}>
          Logout
        </Bootoon>
      )} */}
      <HeaderBox>
        <div style={{ display: "flex" }}>
          <Heading style={{ fontSize: "64px", width: "100%", letterSpacing: "1px" }}>
            <div>stealthdrop</div>
          </Heading>
          <a href={"https://github.com/nalinbhardwaj/stealthdrop"} target="_blank">
            <div>
              <GitHub size={32} color="white" style={{ marginTop: "28px" }} />
            </div>
          </a>
        </div>
        <Heading style={{ fontSize: "32px", width: "100%", fontWeight: "200", marginTop: "8px" }}>
          Anonymous Airdrops using ZK-SNARKS
        </Heading>
      </HeaderBox>
      <Box onClick={() => setStep(1)}>
        <Heading>
          <p style={{ marginBottom: "0px" }}>1. Connect Public Wallet</p>
          <TickMark isCompleted={(address && eligibility) || !!signature} isWrong={address && !eligibility} />
        </Heading>
        <Collapse collapsed={step != 1}>
          <Tekst>
            {eligibility ? "You're eligible for the airdrop! " : "Connect a wallet eligible for the airdrop. "}
            Add the xDai chain to Metamask using these{" "}
            <a href="https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup" target="_blank">
              instructions
            </a>
            .
          </Tekst>
          <Bootoon key="loginbutton" shape="round" size="large" onClick={loadWeb3Modal} disabled={!!address}>
            {web3Modal && web3Modal.cachedProvider && address
              ? `CONNECTED TO ${displayAddress(address).toUpperCase()}`
              : "CONNECT"}
          </Bootoon>
        </Collapse>
      </Box>
      <Box onClick={() => setStep(2)}>
        <Heading>
          <p style={{ marginBottom: "0px" }}>2. Sign Message</p>
          <TickMark isCompleted={!!signature} />
        </Heading>
        <Collapse collapsed={step != 2}>
          <Tekst>{`Sign a message using ${displayAddress(
            address,
          )} to ZK-prove your airdrop claim. This signature is like your secret key to the airdrop — don't share it!`}</Tekst>
          <Bootoon onClick={signMessage} disabled={!!signature?.sign}>
            {!!signature?.sign ? "SIGNED" : "SIGN MESSAGE"}
          </Bootoon>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(3)}>
        <Heading>
          <p style={{ marginBottom: "0px" }}>3. Connect Anonymous Wallet</p>
          <TickMark isCompleted={signature?.address && address !== signature.address} />
        </Heading>

        <Collapse collapsed={step != 3}>
          {!address && <Tekst>Not connected to any wallet. Select a wallet to proceed.</Tekst>}
          {!!address && !signature && <Tekst>Sign message to proceed.</Tekst>}
          {!!address && !!signature && address === signature.address && (
            <Tekst>
              You are currently connected to your public wallet. Switch to a different wallet to preserve anonymity.
              Instructions to switch accounts can be found{" "}
              <a
                href="https://metamask.zendesk.com/hc/en-us/articles/360061346311-Switching-accounts-in-MetaMask"
                target="_blank"
              >
                here
              </a>
            </Tekst>
          )}
          {!!address && !!signature && address !== signature?.address && (
            <Tekst>
              You are now connected to a different wallet. The tokens will be withdrawn to this anonymous wallet.
            </Tekst>
          )}
        </Collapse>
      </Box>

      <Box onClick={() => setStep(4)}>
        <Heading>
          <p style={{ marginBottom: "0px" }}>4. Prove Ownership</p>
          <TickMark isCompleted={!!proof} />
        </Heading>
        <Collapse collapsed={step != 4}>
          <Tekst>
            Generate proof to withdraw your tokens to {address ? address.substr(0, 6) + "..." + address.substr(-4) : ""}
            ! It may take 3-5 minutes to generate the proof (and longer if there is a queue).
          </Tekst>
          <Bootoon onClick={generateZKProof}>{proofStatus}</Bootoon>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(5)}>
        <Heading>
          <p style={{ marginBottom: "0px" }}>5. Claim</p>
        </Heading>
        <Collapse collapsed={step != 5}>
          <Tekst>
            Claim tokens by submitting a transaction containing the ZK proof to the ERC-20 contract on-chain. Fund your
            gas money with a{" "}
            <a href="https://www.xdaichain.com/for-users/get-xdai-tokens/xdai-faucet#3rd-party-faucets" target="_blank">
              faucet
            </a>
            .
          </Tekst>
          <Bootoon onClick={claim}>CLAIM TOKEN</Bootoon>
        </Collapse>
      </Box>
    </div>
  );
}

const TickMark = ({ isCompleted, isWrong }) => {
  if (isWrong) {
    return (
      <div style={{ marginBottom: "0px" }}>
        <XCircle color="#ff9994" size={32} style={{ marginTop: "7px" }} />
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div style={{ marginBottom: "0px" }}>
        <CheckCircle color="#8fff58" size={32} style={{ marginTop: "7px" }} />
      </div>
    );
  }
  return (
    <div style={{ marginBottom: "0px" }}>
      <Circle size={32} style={{ marginTop: "7px" }} />
    </div>
  );
};

const tekstcolor = "#e5e7eb";
const teskstsize = "18px";

const Tekst = styled.div`
  display: block;
  font-size: ${teskstsize};
  color: #ffffff;
  font-weight: 400;
  width: 95%;
  margin: auto;
  margin-top: 4px;
  a {
    color: #ffffff;
    text-decoration: underline;
  }
`;

const Collapse = styled.div`
  display: ${p => (p.collapsed ? "none" : "block")};

  transition: all 0.2s ease;
`;

const Box = styled.div`
  margin: auto;
  width: 75%;
  margin-bottom: 12px;
  margin-top: 12px;
  border: 0px solid #00000069;
  border-radius: 12px;
  padding: inherit;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: linear-gradient(
    to right,
    #fc5c7d,
    #6a82fb
  ); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px,
    rgba(0, 0, 0, 0.1) 0px 8px 10px -6px;
`;

const HeaderBox = styled.div`
  margin: auto;
  width: 75%;
  margin-bottom: 12px;
  margin-top: 12px;
  border: 0px solid #00000069;
  border-radius: 12px;
  padding: inherit;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
`;

const Heading = styled(Heading1)`
  font-weight: 500;
  font-size: 32px;
  text-align: left;
  color: white;
  margin: auto;
  letter-spacing: 1px;
  white-space: break-spaces;
  display: flex;
  justify-content: space-between;
  width: 95%;
`;

const Bootoon = styled.button`
  letter-spacing: 1px;
  white-space: break-spaces;
  background: linear-gradient(135deg, rgba(250, 69, 106, 1) 0%, rgba(90, 117, 251, 1) 100%);
  border-radius: 10px;
  border: 0px;
  color: white;
  font-family: sans-serif;
  font-size: 18px;
  padding: 16px 32px;
  align-items: center;
  justify-content: center;
  margin: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  :hover {
    box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px,
      rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px;
    transition: all 0.3s ease;
  }
`;
