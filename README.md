# Banking DApp — Assignment 5

React + Vite + Ethers.js frontend for the teacher-provided `Bank` smart contract.

## 1) Deploy the smart contract

1. Open https://remix.ethereum.org/
2. Create `Bank.sol` and paste the code from `contracts/Bank.sol`.
3. Compile with Solidity `0.8.x`.
4. In MetaMask, select **Sepolia Test Network**.
5. In Remix, select **Injected Provider - MetaMask**.
6. Deploy `Bank`. Confirm the deployment transaction in MetaMask.
7. Copy the deployed **Bank contract address** (not your wallet address).

## 2) Configure the frontend

Create a `.env` file in the project root by copying `.env.example`.

Set:
`VITE_BANK_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS`

If your full student ID is longer than `66`, update `STUDENT_ID` in `src/App.jsx`.

Update `STUDENT_NAME` in `src/App.jsx` if the spelling should differ from your official name.

## 3) Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Connect MetaMask and use Sepolia.

## 4) Test

- Connect MetaMask on Sepolia.
- Deposit a small amount of SepoliaETH. Confirm the transaction.
- Refresh the balance. It should show the amount deposited by the connected wallet.
- Withdraw an amount no greater than that wallet's contract balance.
- Refresh the balance again.

The balance shown is the amount recorded in the Bank contract for the connected wallet. It is not the wallet's total MetaMask balance.

## 5) Publish to GitHub Pages

1. Create a GitHub repository, for example `Assignment5`.
2. Set `.env` `VITE_BASE_PATH=/Assignment5/`.
3. In `vite.config.js`, the `base` value reads `VITE_BASE_PATH`.
4. Install and build:
   ```bash
   npm install
   npm run build
   ```
5. Publish:
   ```bash
   npm run deploy
   ```
6. In GitHub repository Settings → Pages, select the `gh-pages` branch and `/ (root)` if it is not selected automatically.
7. Open `https://kanyarat2007.github.io/Assignment5/`.

## Notes

- The ABI uses the exact function spelling `checkBlance()` from the provided contract.
- `withdraw(uint amount)` expects Wei. The website converts the ETH amount to Wei using `ethers.parseEther`.
- MetaMask transactions on Sepolia use test ETH and still consume SepoliaETH for gas; they are not mainnet ETH.
- The provided Solidity contract is kept as supplied for assignment compatibility. It should not be treated as audited production banking software.
