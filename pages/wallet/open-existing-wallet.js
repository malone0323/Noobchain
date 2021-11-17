import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import MenuBar from "../../Components/Wallet/MenuBar";
import AccountInfo from "../../Components/Wallet/AccountInfo";
import { useRecoilState } from "recoil";
import { lockState } from "../../recoil/atoms";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import elliptic from "../../lib/elliptic";
import { saveKeysInSession } from "../../lib/session";

export default function OpenExistingWallet() {
  const [userPrivateKey, setUserPrivateKey] = useState("");
  const [walletStatus, setWalletStatus] = useRecoilState(lockState);

  const inputRef = useRef(null);
  const textAreaRef = useRef(null);
  const secp256k1 = new elliptic.ec("secp256k1");

  const handleClick = () => {
    if (!userPrivateKey) {
      toast.error("Please enter a private key.", {
        position: "top-right",
        theme: "colored",
      });
      return;
    }

    let keyPair = secp256k1.keyFromPrivate(userPrivateKey);
    saveKeysInSession(keyPair);

    // display result
    textAreaRef.current.value =
      "Decoded existing private key: " +
      sessionStorage["privKey"] +
      "\n" +
      "\n" +
      "Extracted public key: " +
      sessionStorage["pubKey"] +
      "\n" +
      "\n" +
      "Extracted blockchain address: " +
      sessionStorage["address"];

    setWalletStatus("unlocked");

    toast.success("Wallet successfully unlocked!", {
      position: "top-right",
      theme: "colored",
    });
  };

  return (
    <>
      <Head>
        <title>NOOB Wallet | Open Wallet</title>
      </Head>

      <ToastContainer position="top-center" pauseOnFocusLoss={false} />
      <MenuBar />
      <div className="container ">
        <h1 className="display-5 my-5">Open Existing Wallet</h1>

        <div className="d-flex align-items-between my-2">
          <input
            ref={inputRef}
            type="text"
            id="textBoxPrivateKey"
            className=" w-100 py-1"
            placeholder="Enter your wallet private key (compressed ECDSA key, 65 hex digits)"
            style={{ marginRight: "10px" }}
            value={userPrivateKey}
            onChange={(e) => {
              setUserPrivateKey(e.target.value);
            }}
          />
          <button
            type="button"
            id="buttonOpenExistingWallet"
            value="Open Wallet"
            className="btn btn-primary btn w-25"
            onClick={handleClick}
          >
            Restore
          </button>
        </div>

        <form>
          <div className="form-group">
            <textarea
              ref={textAreaRef}
              className="form-control"
              rows="6"
            ></textarea>
          </div>
        </form>
      </div>

      {/* Display Account Information */}
      {walletStatus == "unlocked" && <AccountInfo />}
    </>
  );
}
