const express = require("express");
const snarkjs = require("snarkjs");
const hash = require('object-hash');
const fs = require("fs");
const { spawn } = require('child_process');
const cors = require('cors');

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

app.use(cors({origin: "*"}));

app.post("/generate_proof", function (req, res) {
  const input = req.body;
  const inputHash = hash(input);
  const inputFileName = `inputs/${inputHash}.json`;
  console.log("input", input);
  console.log("inputFileName", inputFileName);

  if (currentProcessesRunning.has(inputHash) || !!outputData[inputHash]) {
    res.json({ id: inputHash });
    return;
  }

  if (currentProcessesRunning.size > 3) {
    res.status(404).send("Too many processes running");
    return;
  }

  fs.writeFileSync(inputFileName, JSON.stringify(input));

  // spawn a child process to run the proof generation
  const prover = spawn("node", ["prover.js", inputFileName], {
    timeout: 10 * 60 * 1000,
  });
  if (!prover.pid) {
    res.status(500);
    return;
  }
  currentProcessesRunning.add(inputHash);
  prover.stderr.on("data", (data) => {
    outputData[inputHash] = data.toString();
    console.log(`stderr: ${inputHash} :  ${data}`);
    console.log("outputData", outputData);
  });

  prover.stdout.on("data", (data) => {
    console.error(`stdout: ${data}`);
  });

  prover.on("close", (code) => {
    currentProcessesRunning.delete(inputHash);
    console.log(`child process exited with code ${code}`);
  });

  res.json({ id: inputHash });
});

app.post("/result", (req, res) => {
  console.log("outputData", outputData);
  const id = req.body["id"];
  const result = outputData[id];
  if (result) {
    res.send(result);
  } else if (currentProcessesRunning.has(id)) {
    res.status(400).send("Process still running");
  } else {
    res.status(404).send("Not found");
  }
});

app.post("/generate_proof_slow", async function (req, res) {
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
