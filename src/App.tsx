import { useEffect, useState } from "react";
import "./App.css";
import { ProviderMessage, custom, encodeAbiParameters, encodeFunctionData, hexToBigInt, zeroAddress } from '@flashbots/suave-viem'
import { getSuaveProvider, getSuaveWallet, type TransactionRequestSuave } from "@flashbots/suave-viem/chains/utils"
import { Hex } from '@flashbots/suave-viem';
import deployment from "./contracts/deployment.json"

function App() {
  const [ethereum, setEthereum] = useState<any>()
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<Hex>()
  const [counter, setCounter] = useState<bigint>()
  const [counterInput, setCounterInput] = useState<number>()
  const [waitingForReceipt, setWaitingForReceipt] = useState(false)

  useEffect(() => {
    if ("ethereum" in window && !ethereum) {
      setEthereum(window.ethereum)
    }
    if (ethereum && !connected) {
      fetchCounter()

      ethereum.request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0] as Hex)
          } else {
            ethereum.request({
              "method": "wallet_requestPermissions",
              "params": [
                {
                  "eth_accounts": {}
                }
              ]
            }).then((result: any) => {
              console.log("result", result)
              if (result[0].parentCapability === "eth_accounts") {
                setConnected(true)
              }
            })
          }
        })


    }

  }, [ethereum, connected])

  const fetchCounter = () => {
    ethereum.request({
      method: "eth_call",
      params: [{ to: deployment.address, data: "0x8381f58a", from: null }, "latest"]
    }).then((res: Hex) => {
      const counter = hexToBigInt(res)
      setCounter(counter)
    })
  }

  const sendCCR = async () => {
    const nonce = await ethereum.request({ method: "eth_getTransactionCount", params: [account, "latest"] })
    console.log("nonce", nonce)
    const tx: TransactionRequestSuave = {
      to: deployment.address as Hex,
      data: "0x4154b243" as Hex,
      confidentialInputs: encodeAbiParameters([{ type: "uint256" }], [BigInt(counterInput || 0)]),
      kettleAddress: "0xB5fEAfbDD752ad52Afb7e1bD2E40432A485bBB7F",
      type: "0x43",
      nonce,
      gas: 69000n,
      gasPrice: 10n * 10n ** 9n,
    }
    if (!account) {
      return
    }

    const wallet = getSuaveWallet({
      transport: custom(ethereum),
      jsonRpcAccount: account,
    })
    const provider = getSuaveProvider(custom(ethereum))

    try {
      const txHash = await wallet.sendTransaction(tx)
      console.log("txHash", txHash)
      setWaitingForReceipt(true)
      let receipt
      while (true) {
        // wait 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000))
        receipt = await provider.getTransactionReceipt({ hash: txHash })
        if (receipt) {
          break
        }
      }
      console.log("receipt", receipt)
      if (receipt.status === "success") {
        fetchCounter()
        setWaitingForReceipt(false)
      } else {
        alert("Transaction failed")
      }
    } catch (e) {
      console.error("error", e)
      alert(e)
    }
  }

  return (
    <>
      <div className="card">
        <div>
          <input type="number" placeholder='Enter a number' style={{ padding: 10 }} onChange={(e) => setCounterInput(parseInt(e.target.value))} />
          <button onClick={sendCCR}>Update Number</button>
        </div>
        Connected with wallet <code>{account}</code>
      </div>
      <div style={{ margin: 240, padding: 32, background: "#fefefe3f" }}>
        <div>
          Contract Address: <code>{deployment.address}</code>
          {counter ? <div style={{ display: "flex", flexDirection: "row", fontSize: 21 }}>Current Number:
            <div style={{ paddingLeft: 8 }}>{waitingForReceipt ? " loading..." : <code style={{ color: "#ff2", textShadow: "#777 1px 0 3px" }}>{counter.toString()}</code>}</div>
          </div> : null}
        </div>
      </div>
    </>
  );
}

export default App;
