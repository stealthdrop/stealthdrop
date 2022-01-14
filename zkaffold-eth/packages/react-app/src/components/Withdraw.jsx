import { Button } from "antd";
import stringify from "fast-json-stable-stringify";
import React from "react";
import { useState } from "react";
import { AddressInput } from ".";
import { generateProof } from "../GenerateProof";
import { isEligible } from "../AirdropData";

const signText = "ZK Airdrop: Sign this message to withdraw your ZK tokens";

export default function Withdraw({ signer, address, web3Modal, loadWeb3Modal }) {
  const [withdrawAddress, setWithdrawAddress] = useState();
  const [signature, setSignature] = useState();
  const [eligible, setEligible] = useState();
  const [proof, setProof] = useState();

  const signMessage = async () => {
    console.log("signer", signer);
    const msgTransaction = await signer.signMessage(signText);
    console.log("msgTransaction", msgTransaction);
    setSignature(msgTransaction);
  };

  const generateProof = async () => {
    if (!signature) {
      return;
    }
    const lol = await generateProof();
    setProof({ a: 0, b: 0, c: 0, merkleRoot: "0x239839aBcd", nullifierHash: "lol" });
  };

  const checkEligibility = () => {
    // TODO: Check if already spent
    setEligible(isEligible(address));
  };

  console.log("web3Modal", web3Modal);

  return (
    <div style={{ margin: "auto", width: "70vw", display: "flex", flexDirection: "column", padding: "16px" }}>
      <div style={{ margin: "20px" }}>
        <Button
          key="loginbutton"
          style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          shape="round"
          size="large"
          onClick={loadWeb3Modal}
          disabled={web3Modal && web3Modal.cachedProvider}
        >
          {(web3Modal && web3Modal.cachedProvider) ? "Connected!" : "Connect"}
        </Button>
      </div>
      <div style={{ margin: "20px" }}>
        <Button onClick={checkEligibility}>Check Eligibility</Button>
        <div>{eligible ? "Eligibile!" : eligible === false ? "Not Eligibile :(" : ""}</div>
      </div>

      <div style={{ margin: "20px" }}>
        <Button onClick={signMessage}>Generate Signed Message</Button>
        <div>Signed Message: {signature}</div>
      </div>


      <div style={{ margin: "20px" }}>
        <div>Switch metamask to the account which you want to recieve your token in</div>
        <Button
          key="loginbutton"
          style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          shape="round"
          size="large"
          onClick={loadWeb3Modal}
        >
          Connect Burner Account
        </Button>        
        <div>Burner Address: {signature}</div>
      </div>


      <div style={{ margin: "20px" }}>
        <Button onClick={generateProof}>Generate ZK Proof</Button>
        <div>Proof: {stringify(proof)}</div>
      </div>

      <Button>Claim Token</Button>
    </div>
  );
}
