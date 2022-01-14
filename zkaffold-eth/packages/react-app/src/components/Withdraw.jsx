import { Button } from "antd";
import stringify from "fast-json-stable-stringify";
import styled from "styled-components/macro";

import React from "react";
import { useState } from "react";
import { generateProof } from "../GenerateProof";
import { isEligible } from "../AirdropData";
import { Heading1, MainHeading } from "./lolcss";

const signText = "ZK Airdrop: Sign this message to withdraw your ZK tokens";

// type steps = "connect" | "eligibility" | "sign" | "burner" | "proof" | "claim";

export default function Withdraw({ signer, address, web3Modal, loadWeb3Modal }) {
  const [signature, setSignature] = useState();
  const [eligible, setEligible] = useState();
  const [proof, setProof] = useState();
  const [step, setStep] = useState(1);


  const signMessage = async () => {
    console.log("signer", signer);
    const msgTransaction = await signer.signMessage(signText);
    console.log("msgTransaction", msgTransaction);
    setSignature({ sign: msgTransaction, address });
  };

  const generateZKProof = async () => {
    if (!signature) {
      return;
    }
    const lol = await generateProof();
    setProof({ a: 0, b: 0, c: 0, merkleRoot: "0x239839aBcd", nullifierHash: "lol" });
  };

  const checkEligibility = () => {
    // TODO: Check if already spent
    setEligible({ elibibility: isEligible(address), address: address });
  };

  return (
    <div style={{ margin: "auto", width: "70vw", display: "flex", flexDirection: "column", padding: "16px" }}>
      <Box onClick={() => setStep(1)}>
        <Heading>Connect Wallet</Heading>
        <Collapse  collapsed={step != 1}>
        <Bootoon
          key="loginbutton"
          style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          shape="round"
          size="large"
          onClick={loadWeb3Modal}
          disabled={web3Modal && web3Modal.cachedProvider}
        >
          {web3Modal && web3Modal.cachedProvider ? "Connected!" : "Connect"}
        </Bootoon>
        </Collapse>
      </Box>
      <Box onClick={() => setStep(2)}>
        <Heading>Check Eligibilty</Heading>
        <Collapse  collapsed={step != 2}>
        <Bootoon onClick={checkEligibility}>Check Eligibility</Bootoon>
        <div>{eligible?.elibibility ? "Eligibile!" : eligible?.elibibility === false ? "Not Eligibile :(" : ""}</div>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(3)}>
        <Heading>Sign Message</Heading>
        <Collapse  collapsed={step != 3}>
        <Bootoon onClick={signMessage}>Generate Signed Message</Bootoon>
        <div>Signed Message: {signature?.sign}</div>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(4)}>
        <Heading>Connect Burner Wallet</Heading>
        <Collapse  collapsed={step != 4}>
        <div>Switch mallet to the account which you want to recieve your token in</div>
        <Bootoon
          key="loginbutton"
          style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          shape="round"
          size="large"
          onClick={loadWeb3Modal}
        >
          Connect Burner Account
        </Bootoon>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(5)}>
        <Heading>Prove Ownership</Heading>
        <Collapse  collapsed={step != 5}>
        <div>Generate Proof to withdraw to {address}</div>
        <Bootoon onClick={generateZKProof}>Generate</Bootoon>
        <div>Proof: {stringify(proof)}</div>
        </Collapse>
      </Box>

      <Box onClick={() => setStep(6)}>
        <Heading>Claim</Heading>
        <Collapse  collapsed={step != 6}>
        <Bootoon>Claim Token</Bootoon>
        </Collapse>
      </Box>
    </div>
  );
}

const Collapse = styled.div`
  max-height: ${p => p.collapsed ? '0' : '100%'};
  opacity: ${p => (p.collapsed ? 0 : 1)};
  overflow: ${p => (p.collapsed ? 'hidden' : 'initial')};
  transition: all 0.5s ease;
`
// display: ${p => p.collapsed ? 'none' : 'block'};


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
    box-shadow: rgba( 111,76,255, 0.5) 0px 0px 20px 0px;
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
