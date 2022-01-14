import { Button } from "antd";
import stringify from "fast-json-stable-stringify";
import React from "react";
import { useState } from "react";
import { AddressInput } from ".";
import { generateProof } from "../GenerateProof";
import { isEligible } from "../AirdropData";


export default function NewAirdrop({ signer, address, web3Modal, loadWeb3Modal }) {

  return (
    <div style={{ margin: "auto", width: "70vw", display: "flex", flexDirection: "column", padding: "16px" }}>
      <div>Welcome to ZK Airdrop!</div>
      <div>Create a new Airdrop</div>
      <div>Step 1. Name your ERC-20 Token:</div>
      <div>Step 2. Enter list of public keys who will recieve the airdrop (1 token each):</div>
      <div>Step 3. Deploy Contract on Ethereum</div>
      <div>Step 4. Generate a website which will allow users to withdraw</div>
    </div>
  );
}
