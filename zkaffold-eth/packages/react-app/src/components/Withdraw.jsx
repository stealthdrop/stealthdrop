import { Button } from "antd";
import stringify from "fast-json-stable-stringify";
import React from "react";
import { useState } from "react";
import { mimcHash } from "zkp-utils";
import { AddressInput } from ".";
import { getPath } from "../AirdropData";

const signText = "ZK Airdrop: Sign this message to withdraw your ZK tokens";

export default function Withdraw({ signer, address }) {
  const [withdrawAddress, setWithdrawAddress] = useState();
  const [signature, setSignature] = useState();
  const [proof, setProof] = useState();

  const signMessage = async () => {
    console.log("signer", signer);
    const msgTransaction = await signer.signMessage(signText);
    console.log("msgTransaction", msgTransaction);
    setSignature(msgTransaction);
  };

  const generateProof = async () => {
    const [pathElements, pathIndex] = getPath(mimcHash(address));
    setProof({ a: 0, b: 0, c: 0, merkleRoot: "0x239839aBcd", nullifierHash: "lol" });
  };


  return (
    <div style={{ margin: "auto", width: "70vw", display: "flex", flexDirection: "column", padding: "16px" }}>
      <div style={{ margin: "30px" }}>
        <Button onClick={signMessage}>Generate Signed Message</Button>
        <div>Signed Message: {signature}</div>
      </div>

      <div style={{ margin: "30px" }}>
        <Button onClick={generateProof}>Generate ZK Proof</Button>
        <div>Proof: {stringify(proof)}</div>
      </div>

      <AddressInput
        placeholder={"withdraw address"}
        address={withdrawAddress}
        onChange={setWithdrawAddress}
      ></AddressInput>
      <Button>Withdraw using Proof</Button>
    </div>
  );
}
