import Head from "next/head";
import MenuBar from "../../Components/Wallet/MenuBar";
import { Modal, Button } from "react-bootstrap";
import { useState, useRef, useEffect } from "react";
import AccountInfo from "../../Components/Wallet/AccountInfo";
import { useRecoilValue } from "recoil";
import { lockState, faucetDetails } from "../../recoil/atoms";
import hashes from "../../lib/hashes";
import elliptic from "../../lib/elliptic";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import axios from "axios";

export default function SendTransaction() {
  const [show, setShow] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [value, setValue] = useState(null);
  const [data, setData] = useState(null);
  const [signedTx, setSignedTx] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [successTx, setSuccessTx] = useState(false);
  const [fee, setFee] = useState(20);
  const [donate, setDonate] = useState(false);

  const walletStatus = useRecoilValue(lockState);
  const _faucetDetails = useRecoilValue(faucetDetails);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const signRef = useRef("");

  useEffect(() => {
    const donate = sessionStorage.getItem("donate");
    if (donate === "true") {
      setDonate(true);
      setRecipient(_faucetDetails.address);
      setShow(true);
    }
  }, []);

  const handleClick = () => {
    handleShow();
    setSuccessTx(false);
    if (successTx) signRef.current.value = "";

    //Remove faucet address from local storage if it exists
    if (recipient === _faucetDetails.address) {
      sessionStorage.removeItem("donate");
    }
  };

  const signTransaction = () => {
    const validAddress = /^[0-9a-f]{40}$/.test(recipient);
    const validValue = /^\d*\.?\d*$/.test(value);

    if (!validAddress) {
      toast.error("Invalid Recipient Address!", {
        position: "bottom-right",
        theme: "colored",
      });
      return;
    }

    if (!validValue) {
      toast.error("Invalid Value!", {
        position: "bottom-right",
        theme: "colored",
      });
      return;
    }

    if (!value || !recipient) {
      toast.error("Ensure you have a recipient & value", {
        position: "bottom-right",
        theme: "colored",
      });
      return;
    }

    let transaction = {
      from: sessionStorage["address"],
      to: recipient,
      value,
      fee,
      dateCreated: new Date().toISOString(),
      data,
      senderPubKey: sessionStorage["pubKey"],
    };

    // Construct the transaction hash
    let transactionJSON = JSON.stringify(transaction);
    transaction.transactionDataHash = new hashes.SHA256().hex(transactionJSON);

    // Sign the transaction hash
    transaction.senderSignature = signData(
      transaction.transactionDataHash,
      sessionStorage["privKey"]
    );

    let tx = JSON.stringify(transaction);
    signRef.current.value = tx;
    setSignedTx(tx);
    setIsSigned(true);
    setShow(false);
  };

  function signData(data, privKey) {
    const secp256k1 = new elliptic.ec("secp256k1");
    let keyPair = secp256k1.keyFromPrivate(privKey);
    let signature = keyPair.sign(data);
    return [signature.r.toString(16), signature.s.toString(16)];
  }

  const SendTransaction = async () => {
    try {
      let nodeUrl = "http://localhost:3001";
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      console.log(signedTx);
      const result = await axios.post(
        `${nodeUrl}/transaction/broadcast`,
        signedTx,
        config
      );

      console.log(result);
      const error = result.data.error;

      if (error) {
        toast.error(error, {
          position: "bottom-right",
          theme: "colored",
        });
      } else {
        toast.success("Transaction successfully sent!", {
          position: "bottom-right",
          theme: "colored",
        });

        //Remove faucet address from local storage if it exists
        if (recipient === _faucetDetails.address) {
          sessionStorage.removeItem("donate");
        }

        //Reset state
        setRecipient("");
        setValue("");
        setData("");
        setSignedTx(null);
        setIsSigned(false);
        setShow(false);
        setTxHash(result.data.transactionDataHash);
        setSuccessTx(true);
      }
    } catch (error) {
      console.log(error);
      toast.error("Transaction failed to send!", {
        position: "bottom-right",
        theme: "colored",
      });
    }
  };

  const cancelDonate = () => {
    sessionStorage.removeItem("donate");
    setDonate(false);
    setRecipient("");
    setValue("");
    setData("");
    setSignedTx(null);
    setIsSigned(false);
    signRef.current.value = "";
  };

  return (
    <>
      <Head>
        <title>NOOB Wallet | Send Transaction</title>
      </Head>

      <ToastContainer position="top-center" pauseOnFocusLoss={false} />

      <MenuBar />
      <div className="container ">
        <h1 className="display-5 mt-5">Send Transaction</h1>
        <div>
          <Button
            variant={isSigned ? "success" : "primary"}
            className="mt-5"
            onClick={handleClick}
          >
            {isSigned ? "Confirm Transaction" : "Create New Transaction"}
          </Button>
        </div>

        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Transaction Requirements</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-break">
            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <span className="input-group-text" id="basic-addon3">
                  Recipient
                </span>
              </div>
              <input
                type="text"
                className="form-control"
                id="basic-url"
                aria-describedby="basic-addon3"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <span
                  className="input-group-text"
                  style={{ paddingLeft: "25px", paddingRight: "25px" }}
                  id="basic-addon3"
                >
                  Value
                </span>
              </div>
              <input
                type="text"
                className="form-control"
                id="basic-url"
                aria-describedby="basic-addon3"
                value={value && value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <span
                  className="input-group-text"
                  style={{ paddingLeft: "31px", paddingRight: "31px" }}
                  id="basic-addon3"
                >
                  Fee
                </span>
              </div>
              <input
                type="text"
                className="form-control"
                id="basic-url"
                aria-describedby="basic-addon3"
                readOnly
                value={fee}
              />
            </div>
            <div className="input-group">
              <div className="input-group-prepend">
                <span
                  className="input-group-text"
                  style={{
                    paddingLeft: "27px",
                    paddingRight: "27px",
                    paddingBottom: "27px",
                    paddingTop: "27px",
                  }}
                >
                  Data
                </span>
              </div>
              <textarea
                className="form-control"
                aria-label="With textarea"
                value={data}
                onChange={(e) => setData(e.target.value)}
              ></textarea>
            </div>
          </Modal.Body>
          <Modal.Footer>
            {donate && (
              <Button variant="outline-danger" onClick={cancelDonate}>
                Cancel Donate
              </Button>
            )}
            <Button variant="btn btn-outline-primary" onClick={signTransaction}>
              Sign Transaction
            </Button>
            {isSigned && (
              <Button
                variant="success"
                onClick={SendTransaction}
                disabled={!isSigned ? "disabled" : ""}
              >
                Send Transaction
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        <button
          type="button"
          id="buttonSignTransaction"
          className="btn btn-outline-secondary my-2 w-100"
          disabled
        >
          Signature Details
        </button>

        <form>
          <div className="form-group mb-5">
            <textarea
              className="form-control"
              rows="6"
              ref={signRef}
              readOnly
            ></textarea>
          </div>
        </form>
      </div>

      {successTx && (
        <div className="d-flex justify-content-center">
          <button type="button" className="btn btn-primary my-2 w-50">
            View Details on Noob Explorer
          </button>
        </div>
      )}

      {/* Display Account Information */}
      <AccountInfo />
    </>
  );
}
