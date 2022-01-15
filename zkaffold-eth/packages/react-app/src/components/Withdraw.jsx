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

const signText = "zk-airdrop";

async function postData(url = "", data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response; // parses JSON response into native JavaScript objects
}

export default function Withdraw({ signer, address, web3Modal, loadWeb3Modal, mainnetProvider }) {
  const [signature, setSignature] = useState();
  const [proof, setProof] = useState();
  const [proofStatus, setProofStatus] = useState("need to start");
  const [step, setStep] = useState(1);

  const signMessage = async () => {
    console.log("signer", signer);
    console.log("public key", signer.publicKey);
    const msgTransaction = await signer.signMessage(signText);
    console.log("msgTransaction", msgTransaction);
    console.log("public key", signer.publicKey);
    setSignature({ sign: msgTransaction, address });
    const pk = ethers.utils.recoverPublicKey(
      ethers.utils.arrayify(
        ethers.utils.hashMessage(
          ethers.utils.arrayify("0x52a0832a7b7b254efb97c30bb6eaea30ef217286cba35c8773854c8cd41150de"),
        ),
      ),
      msgTransaction,
    );
    console.log("pk", pk);
    console.log("lol", ethers.utils.hashMessage("zk-airdrop"));
  };

  const generateZKProof = async () => {
    if (!signature) {
      return;
    }
    const inputs = await generateProofInputs(address, signature.sign);
    console.log("inputs", inputs);
    if (!inputs) return;
    // send api post request to generate proof
    const returnData = await postData("/generate-proof", inputs);
    setProofStatus(returnData && returnData["id"] ? "running" : "error");
    const processId = returnData["id"];
    console.log("processId", processId);

    const intervalId = setInterval(async () => {
      const res = await postData("/result", { id: processId });
      if (res.status === 200) {
        setProof(res.body);
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

  return (
    <div style={{ margin: "auto", width: "70vw", display: "flex", flexDirection: "column", padding: "16px" }}>
      <Box onClick={() => setStep(1)}>
        <Heading>1. Connect Public Wallet</Heading>
        <Collapse collapsed={step != 1}>
          <Tekst>Connect the account associated with airdrop</Tekst>
          <Bootoon
            key="loginbutton"
            style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
            shape="round"
            size="large"
            onClick={loadWeb3Modal}
            disabled={!!address}
          >
            {web3Modal && web3Modal.cachedProvider ? "Connected!" : "Connect"}
          </Bootoon>
          {address && (
            <Tekst>
              Connected to{" "}
              {<Address color={tekstcolor} size={teskstsize} address={address} ensProvider={mainnetProvider} />}
            </Tekst>
          )}
          {eligibility !== null && <Tekst>{eligibility ? "Eligibile ✅" : "Not Eligibile :("}</Tekst>}
        </Collapse>
      </Box>
      <Box onClick={() => setStep(2)}>
        <Heading>2. Sign Message</Heading>
        <Collapse collapsed={step != 2}>
          <Bootoon onClick={signMessage} disabled={!!signature?.sign}>
            {!!signature?.sign ? "Signed!" : "Generate Signed Message"}
          </Bootoon>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(3)}>
        <Heading>3. Connect Anonymous Wallet</Heading>

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
        <Heading>4. Prove Ownership</Heading>
        <Collapse collapsed={step != 4}>
          <Tekst>Generate Proof to withdraw to {address}</Tekst>
          <Bootoon onClick={generateZKProof}>Generate</Bootoon>
          <Tekst>Proof: {proofStatus}</Tekst>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(5)}>
        <Heading>5. Claim</Heading>
        <Collapse collapsed={step != 5}>
          <Tekst>Claim by sending a transaction on chain to the ERC-20 contract with the ZK Proof</Tekst>
          <Bootoon>Claim Token</Bootoon>
        </Collapse>
      </Box>
    </div>
  );
}

const tekstcolor = "#bfbfbf";
const teskstsize = "18px";

const Tekst = styled.div`
  display: block;
  font-size: ${teskstsize};
  color: ${tekstcolor};
  font-weight: 400;
`;

const Collapse = styled.div`
  display: ${p => (p.collapsed ? "none" : "block")};

  transition: all 0.2s ease;
`;
// max-height: ${p => (p.collapsed ? "0" : "100%")};
// overflow: ${p => (p.collapsed ? "hidden" : "initial")};

const Box = styled.div`
  margin: 4px;
  border: 2px solid #4ce90c69;
  border-radius: 12px;
  padding: inherit;
  background: #6773b38a;
`;

const Heading = styled(Heading1)`
  font-weight: 600;
  text-align: left;
  background: linear-gradient(to right, #4ce90c69, #4ce90c69);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Bootoon = styled.button`
  background-color: #4ce90c69;
  border: 1px solid #4ce90c69;
  border-radius: 18px;
  color: white;
  font-family: sans-serif;
  font-size: 18px;
  padding: 12px 32px;
  margin: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  :hover {
    box-shadow: rgba(111, 76, 255, 0.5) 0px 0px 20px 0px;
    transition: all 0.3s ease;
  }
`;

// const Bootoon = styled.button`
//   background-image: linear-gradient(to right, rgb(1 134 218), rgb(182 49 167));
//   border: 0;
//   color: white;
//   font-family: sans-serif;
//   font-size: 18px;
//   padding: 12px 32px;
//   margin: 1rem;
//   cursor: pointer;
//   transition: all 0.3s ease;
//   border-radius: 18px;

//   :hover {
//     box-shadow: rgba( 111,76,255, 0.5) 0px 0px 20px 0px;
//     transition: all 0.3s ease;
//   }
// `;
