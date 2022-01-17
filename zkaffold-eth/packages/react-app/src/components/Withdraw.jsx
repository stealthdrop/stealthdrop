import stringify from "fast-json-stable-stringify";
import styled from "styled-components/macro";

import React from "react";
import { useState } from "react";
import { generateProofInputs } from "../GenerateProof";
import { isEligible } from "../AirdropData";
import { Heading1 } from "./lolcss";
import { CheckO } from "./CheckO.tsx";
import { useMemo } from "react";
import { Address } from ".";
import { ethers } from "ethers";
import { useContractLoader } from "../hooks";
import { Transactor } from "../helpers";
import { CheckCircle, GitHub } from 'react-feather';

const signText = "zk-airdrop";
const signTextHash = "0x52a0832a7b7b254efb97c30bb6eaea30ef217286cba35c8773854c8cd41150de";

const exampleProof = [
  [0, 1],
  [
    [2, 3],
    [4, 5],
  ],
  [6, 7],
  [8, 9, 10, 11],
];

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

export default function Withdraw({ signer, address, web3Modal, loadWeb3Modal, mainnetProvider, provider }) {
  const [signature, setSignature] = useState();
  const [proof, setProof] = useState();
  const [proofStatus, setProofStatus] = useState("need to start");
  const [step, setStep] = useState(1);

  const contracts = useContractLoader(provider);

  const tx = Transactor(provider, null);

  const signMessage = async () => {
    console.log("signer", signer);
    const msgTransaction = await signer.signMessage(signText);
    console.log("msgTransaction", msgTransaction);
    const msgHash = ethers.utils.hashMessage(signText);
    const publicKey = ethers.utils.recoverPublicKey(msgHash, ethers.utils.arrayify(msgTransaction));
    // const pk = ethers.utils.recoverPublicKey(
    //   ethers.utils.arrayify("0x52a0832a7b7b254efb97c30bb6eaea30ef217286cba35c8773854c8cd41150de"),
    //   msgTransaction,
    // );
    setSignature({ sign: msgTransaction, address, publicKey });
    console.log("hash", msgHash);
    console.log("verify", ethers.utils.verifyMessage(signText, msgTransaction));
  };

  const generateZKProof = async () => {
    if (!signature) {
      return;
    }
    const inputs = await generateProofInputs(
      signature.address,
      signature.sign,
      signature.publicKey,
      address,
      ethers.utils.hashMessage(signText),
    );
    console.log("inputs", inputs);
    console.log("inputss", JSON.stringify(inputs));
    if (!inputs) return;
    // send api post request to generate proof
    const returnData = await postData("http://45.76.64.104:3000/generate_proof", inputs);
    const returnJSON = await returnData.json();
    setProofStatus(returnJSON && returnJSON["id"] ? "running" : "error");
    const processId = returnJSON["id"];
    console.log("processId", processId);

    const intervalId = setInterval(async () => {
      const res = await postData("http://45.76.64.104:3000/result", { id: processId });
      if (res.status === 200) {
        setProof(await res.json());
        clearInterval(intervalId);
        setProofStatus("found");
      } else if (res.status === 400) {
        setProofStatus("running");
      } else {
        console.log("error", res);
        clearInterval(intervalId);
        setProofStatus("error");
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
    const contract = contracts ? contracts["ZKT"] : "";
    if (!contract) {
      console.log("contract not found");
      return;
    }
    const pi_a = proof["pi_a"];
    const pi_b = proof["pi_b"];
    const pi_c = proof["pi_c"];
    const inputs = proof["inputs"];
    console.log("claim: ", proof, contract);
    const claimTokens = contract.connect(signer)["claimTokens"];
    const returned = await tx(claimTokens(pi_a, pi_b, pi_c, inputs));
    console.log("returned", returned);
  };

  return (
    <div style={{ margin: "auto", width: "70vw", display: "flex", flexDirection: "column", padding: "16px" }}>
      <HeaderBox>
        <Heading style={{ fontSize: "64px", width: "100%", letterSpacing: "1px"}}><div>stealthdrop</div><div><GitHub size={48} style={{marginTop: "24px"}}/></div></Heading>
        <Heading style={{ fontSize: "32px", width: "100%", fontWeight: "200", marginTop: "8px"}}>Anonymous Airdrops using ZK-SNARKS</Heading>
      </HeaderBox>
      <Box onClick={() => setStep(1)}>
        <Heading><p style={{ marginBottom: "0px"}}>1. Connect Public Wallet</p><div style={{ marginBottom: "0px"}}><CheckCircle size={32} style={{marginTop: "7px"}}/></div></Heading>
        <Collapse collapsed={step != 1}>
          <Tekst>Connect the account associated with airdrop</Tekst>
          <Bootoon
            key="loginbutton"
            shape="round"
            size="large"
            onClick={loadWeb3Modal}
            disabled={!!address}
          >
            {web3Modal && web3Modal.cachedProvider ? "CONNECTED" : "CONNECT"}
          </Bootoon>
          {address && (
            <Tekst>
              Connected to{" "}
              {<Address color={tekstcolor} size={teskstsize} address={address} ensProvider={mainnetProvider} />}
            </Tekst>
          )}
          {eligibility !== null && <Tekst>{eligibility ? "Eligible ✅" : "Not Eligible :("}</Tekst>}
        </Collapse>
      </Box>
      <Box onClick={() => setStep(2)}>
        <Heading><p style={{ marginBottom: "0px"}}>2. Sign Message</p><div style={{ marginBottom: "0px"}}><CheckCircle size={32} style={{marginTop: "7px"}}/></div></Heading>
        <Collapse collapsed={step != 2}>
          <Bootoon onClick={signMessage} disabled={!!signature?.sign}>
            {!!signature?.sign ? "SIGNED" : "SIGN MESSAGE"}
          </Bootoon>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(3)}>
        <Heading><p style={{ marginBottom: "0px"}}>3. Connect Anonymous Wallet</p><div style={{ marginBottom: "0px"}}><CheckCircle size={32} style={{marginTop: "7px"}}/></div></Heading>

        <Collapse collapsed={step != 3}>
          {!!address && address === signature?.address && (
            <Tekst>
              Right now you are connected to your public wallet. Switch to a new wallet to preserve anonymity
            </Tekst>
          )}
          {!!address && address !== signature?.address && (
            <Tekst>You are now connected to a seperate account. The tokens will be sent to this account.</Tekst>
          )}
          {!address && <Tekst>Not connected to any account. Switch your account through your wallet</Tekst>}
        </Collapse>
      </Box>

      <Box onClick={() => setStep(4)}>
        <Heading><p style={{ marginBottom: "0px"}}>4. Prove Ownership</p><div style={{ marginBottom: "0px"}}><CheckCircle size={32} style={{marginTop: "7px"}}/></div></Heading>
        <Collapse collapsed={step != 4}>
          <Tekst>Generate Proof to withdraw to {address}</Tekst>
          <Bootoon onClick={generateZKProof}>GENERATE</Bootoon>
          <Tekst>Proof: {proofStatus}</Tekst>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(5)}>
        <Heading><p style={{ marginBottom: "0px"}}>5. Claim</p><div style={{ marginBottom: "0px"}}><CheckCircle size={32} style={{marginTop: "7px"}}/></div></Heading>
        <Collapse collapsed={step != 5}>
          <Tekst>Claim by sending a transaction on chain to the ERC-20 contract with the ZK Proof</Tekst>
          <Bootoon onClick={claim}>CLAIM TOKEN</Bootoon>
        </Collapse>
      </Box>
    </div>
  );
}

const tekstcolor = "#e5e7eb";
const teskstsize = "18px";

const Tekst = styled.div`
  display: block;
  font-size: ${teskstsize};
  color: #e5e7eb;
  font-weight: 400;
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
  background: linear-gradient(101.14deg, rgb(155, 80, 255) 0%, rgb(112, 180, 255) 58%);
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px;
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
  font-weight: 400;
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
  background: linear-gradient(134.14deg, rgb(148, 13, 255) 18.37%, rgb(0, 148, 255) 82.04%);
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
    box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px;
    transition: all 0.3s ease;
  }
`;
