import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  Landmark,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { BANK_ABI, BANK_ADDRESS } from "./contract";

const STUDENT_ID = "66050217"; // Replace with your complete student ID if 66 is only a prefix.
const STUDENT_NAME = "กัลยรัตน์ ถิ่นหาญวงศ์";
const SEPOLIA_CHAIN_ID = "0xaa36a7";

export default function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0.0000");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [networkOk, setNetworkOk] = useState(false);

  const shortAccount = useMemo(
    () => (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ""),
    [account],
  );

  async function getProvider() {
    if (!window.ethereum)
      throw new Error("ไม่พบ MetaMask กรุณาติดตั้งหรือเปิดใช้งาน MetaMask");
    return new ethers.BrowserProvider(window.ethereum);
  }

  async function ensureSepolia() {
    if (!window.ethereum) throw new Error("ไม่พบ MetaMask");
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch (error) {
        if (error.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: "Sepolia",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } else {
          throw error;
        }
      }
    }
    setNetworkOk(true);
  }

  async function connectWallet() {
    try {
      setNotice({ type: "", text: "" });
      if (!window.ethereum) throw new Error("กรุณาติดตั้ง MetaMask ก่อนใช้งาน");
      await ensureSepolia();
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!accounts.length) throw new Error("ไม่พบบัญชี MetaMask");
      setAccount(accounts[0]);
      setNotice({ type: "success", text: "เชื่อมต่อ MetaMask สำเร็จ" });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.shortMessage || error.message || "เชื่อมต่อ Wallet ไม่สำเร็จ",
      });
    }
  }

  async function getBankContract(withSigner = false) {
    if (
      !BANK_ADDRESS ||
      !ethers.isAddress(BANK_ADDRESS) ||
      BANK_ADDRESS === ethers.ZeroAddress
    ) {
      throw new Error(
        "ยังไม่ได้กำหนด Contract Address กรุณาใส่ Address ที่ Deploy บน Sepolia ในไฟล์ .env",
      );
    }
    const provider = await getProvider();
    const runner = withSigner ? await provider.getSigner() : provider;
    return new ethers.Contract(BANK_ADDRESS, BANK_ABI, runner);
  }

  async function refreshBalance() {
    try {
      if (!account) return;

      await ensureSepolia();

      // ใช้ Signer เพื่ออ่านยอดของ Wallet ที่เชื่อมต่ออยู่
      const contract = await getBankContract(true);

      const value = await contract.checkBlance();

      // แปลง Wei เป็น ETH และแสดงทศนิยม 6 ตำแหน่ง
      setBalance(Number(ethers.formatEther(value)).toFixed(6));

      setNotice({
        type: "success",
        text: "อัปเดตยอดเงินสำเร็จ",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.shortMessage || error.message || "อ่านยอดเงินไม่สำเร็จ",
      });
    }
  }

  async function sendDeposit(event) {
    event.preventDefault();
    try {
      setBusy(true);
      setNotice({ type: "", text: "" });
      if (!account) throw new Error("กรุณาเชื่อมต่อ MetaMask ก่อน");
      const amount = Number(depositAmount);
      if (!Number.isFinite(amount) || amount <= 0)
        throw new Error("กรุณากรอกจำนวน ETH ที่มากกว่า 0");
      await ensureSepolia();
      const contract = await getBankContract(true);
      const tx = await contract.deposit({
        value: ethers.parseEther(depositAmount),
      });
      setNotice({ type: "info", text: "กำลังรอการยืนยันธุรกรรมฝากเงิน..." });
      await tx.wait();
      setDepositAmount("");
      setNotice({ type: "success", text: "ฝากเงินสำเร็จ" });
      await refreshBalance();
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.shortMessage ||
          error.reason ||
          error.message ||
          "ฝากเงินไม่สำเร็จ",
      });
    } finally {
      setBusy(false);
    }
  }

  async function sendWithdraw(event) {
    event.preventDefault();
    try {
      setBusy(true);
      setNotice({ type: "", text: "" });
      if (!account) throw new Error("กรุณาเชื่อมต่อ MetaMask ก่อน");
      const amount = Number(withdrawAmount);
      if (!Number.isFinite(amount) || amount <= 0)
        throw new Error("กรุณากรอกจำนวน ETH ที่มากกว่า 0");
      await ensureSepolia();
      const contract = await getBankContract(true);
      // The contract's withdraw(uint amount) expects Wei, not ETH.
      const tx = await contract.withdraw(ethers.parseEther(withdrawAmount));
      setNotice({ type: "info", text: "กำลังรอการยืนยันธุรกรรมถอนเงิน..." });
      await tx.wait();
      setWithdrawAmount("");
      setNotice({ type: "success", text: "ถอนเงินสำเร็จ" });
      await refreshBalance();
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.shortMessage ||
          error.reason ||
          error.message ||
          "ถอนเงินไม่สำเร็จ",
      });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts) => {
      setAccount(accounts?.[0] || "");
      if (!accounts?.length) setBalance("0.000000");
    };
    const handleChain = (chainId) => setNetworkOk(chainId === SEPOLIA_CHAIN_ID);
    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(handleAccounts)
      .catch(() => {});
    window.ethereum
      .request({ method: "eth_chainId" })
      .then(handleChain)
      .catch(() => {});
    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccounts);
      window.ethereum.removeListener?.("chainChanged", handleChain);
    };
  }, []);

  useEffect(() => {
    if (account) refreshBalance();
  }, [account]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account);
      setNotice({ type: "success", text: "คัดลอก Wallet Address แล้ว" });
    } catch {
      setNotice({ type: "error", text: "คัดลอกไม่สำเร็จ" });
    }
  };

  return (
    <main className="page-shell">
      <nav className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon">
            <Landmark size={21} />
          </span>{" "}
          MY BANK <span className="brand-tag">DAPP</span>
        </a>
        <span className={`network-pill ${networkOk ? "online" : ""}`}>
          <span className="dot" /> Sepolia Testnet
        </span>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">DECENTRALIZED BANKING APPLICATION</p>
          <h1>
            Banking <span>Dashboard</span>
          </h1>
          <p className="hero-copy">
            จัดการการฝากและถอน ETH ผ่าน Smart Contract ได้ในที่เดียว
          </p>
        </div>
        <div className="student-card">
          <div className="student-label">STUDENT INFORMATION</div>
          <div>
            <span>รหัสนักศึกษา</span>
            <strong>{STUDENT_ID}</strong>
          </div>
          <div>
            <span>ชื่อ-นามสกุล</span>
            <strong>{STUDENT_NAME}</strong>
          </div>
        </div>
      </section>

      <section className="wallet-panel">
        <div className="wallet-symbol">
          <Wallet size={22} />
        </div>
        <div className="wallet-info">
          <span className="muted">WALLET CONNECTION</span>
          <strong>
            {account ? shortAccount : "ยังไม่ได้เชื่อมต่อ Wallet"}
          </strong>
          {account && <span className="full-address">{account}</span>}
        </div>
        <div className="wallet-actions">
          {account && (
            <button
              className="icon-button"
              onClick={copyAddress}
              title="คัดลอก Address"
            >
              <Copy size={17} />
            </button>
          )}
          <button className="connect-button" onClick={connectWallet}>
            {account ? "เชื่อมต่อแล้ว" : "Connect MetaMask"}
          </button>
        </div>
      </section>

      {notice.text && (
        <div className={`notice ${notice.type}`}>
          <span>
            {notice.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
          </span>
          {notice.text}
        </div>
      )}

      <section className="balance-card">
        <div className="balance-top">
          <span>ยอดเงินฝากของคุณใน Bank Contract</span>
          <button onClick={refreshBalance} disabled={!account}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        <div className="balance-value">
          {balance} <small>ETH</small>
        </div>
        <p>ยอดเงินที่แสดงเป็นยอดฝากของ Wallet ที่เชื่อมต่ออยู่เท่านั้น</p>
      </section>

      <section className="action-grid">
        <form className="action-card" onSubmit={sendDeposit}>
          <div className="action-heading">
            <span className="action-icon deposit">
              <ArrowDownToLine size={21} />
            </span>
            <div>
              <h2>Deposit</h2>
              <p>ฝาก ETH เข้าบัญชีธนาคาร</p>
            </div>
          </div>
          <label htmlFor="deposit">จำนวนเงิน</label>
          <div className="amount-input">
            <input
              id="deposit"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <span>ETH</span>
          </div>
          <button
            className="submit-button deposit-button"
            disabled={busy || !account}
          >
            {busy ? "กำลังดำเนินการ..." : "Deposit ETH"}
          </button>
        </form>

        <form className="action-card" onSubmit={sendWithdraw}>
          <div className="action-heading">
            <span className="action-icon withdraw">
              <ArrowUpFromLine size={21} />
            </span>
            <div>
              <h2>Withdraw</h2>
              <p>ถอน ETH จากบัญชีธนาคาร</p>
            </div>
          </div>
          <label htmlFor="withdraw">จำนวนเงิน</label>
          <div className="amount-input">
            <input
              id="withdraw"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <span>ETH</span>
          </div>
          <button
            className="submit-button withdraw-button"
            disabled={busy || !account}
          >
            {busy ? "กำลังดำเนินการ..." : "Withdraw ETH"}
          </button>
        </form>
      </section>

      <section className="contract-note">
        <div>
          <strong>Smart Contract</strong>
          <span>
            {BANK_ADDRESS && BANK_ADDRESS !== ethers.ZeroAddress
              ? `${BANK_ADDRESS.slice(0, 10)}...${BANK_ADDRESS.slice(-8)}`
              : "ยังไม่ได้ตั้งค่า Contract Address"}
          </span>
        </div>
        {BANK_ADDRESS && BANK_ADDRESS !== ethers.ZeroAddress && (
          <a
            href={`https://sepolia.etherscan.io/address/${BANK_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            View on Etherscan <ExternalLink size={14} />
          </a>
        )}
      </section>

      <footer>© 2026 Banking DApp · Assignment 5 · Sepolia Testnet</footer>
    </main>
  );
}
