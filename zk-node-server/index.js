const express = require("express");
const snarkjs = require("snarkjs");
const fs = require("fs");
const ffjavascript = require("ffjavascript");
const { spawn } = require('child_process');
const { application } = require("express");

const app = express();

app.use(express.static("public"));

app.use(express.json());

app.get("/", (req, res) => res.send("Im a teapot"));

app.get("/slow", (req, res) => {
  // run somethign really slow here and see what happens
  var sum = 0;
  for (var i = 0; i < 10 ** 10; i++) {
    sum += i * (i - 1) * (i * 2);
  }
  res.send(`${sum}`);
});

var currentProcessesRunning = new Set();

var outputData = {};

app.post("/generate_proof", function (req, res) {
  const rawInput = req.body;
  const input = rawInput;

  const randomNumber = Math.floor(Math.random() * 1000000000);
  const randomFileName = `inputs/${randomNumber}.json`;
  if (currentProcessesRunning.size > 3) {
    res.status(400).send("Too many processes running");
    return;
  }

  fs.writeFileSync(randomFileName, JSON.stringify(input));

  // spawn a child process to run the proof generation

  const prover = spawn("node", ["prover.js", randomFileName], {
    timeout: 1 * 60 * 1000,
  });
  if (!prover.pid) {
    res.status(500);
    return;
  }
  currentProcessesRunning.add(randomNumber);
  prover.stdout.on("data", (data) => {
    outputData[randomNumber] = data.toString();
    console.log(`stdout: ${randomNumber} :  ${data}`);
    console.log("outputData", outputData);
  });

  prover.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  prover.on("close", (code) => {
    currentProcessesRunning.delete(randomNumber);
    console.log(`child process exited with code ${code}`);
  });

  res.json({ id: randomNumber });
});

app.get("/result", (req, res) => {
  console.log("outputData", outputData);
  const id = req.body;
  const result = outputData[id];
  if (result) {
    res.send(result);
  } else if (currentProcessesRunning.has(id)) {
    res.status(400).send("Process still running");
  } else {
    res.status(404).send("Not found");
  }
});

app.post("/generate_proof_wrong", async function (req, res) {
  const input = req.body["id"];

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "./circuit.wasm",
    "./circuit.zkey"
  );

  const genCalldata = await genSolidityCalldata(publicSignals, proof);

  res.json(genCalldata);
});

const port = process.env.PORT || 3000;

app.listen(port, () =>
  console.log(`Server running on ${port}, http://localhost:${port}`)
);
