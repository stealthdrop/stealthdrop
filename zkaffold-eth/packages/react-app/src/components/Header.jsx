import React from "react";
import { PageHeader } from "antd";
import { Heading1 } from "./lolcss";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/nalinbhardwaj/zk-airdrop" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="StealthDrop"
        subTitle="Anonymous Airdrops using ZK-SNARKS"
        style={{ cursor: "pointer", color: "white" }}
      />
    </a>
  );
}
