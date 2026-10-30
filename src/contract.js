// ABI matches the teacher-provided Bank contract.
// Note: the Solidity function is spelled checkBlance(), so keep this spelling.
export const BANK_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 amount) public",
  "function checkBlance() public view returns (uint256 balance)",
  "event Deposit(address indexed owner, uint amount)",
  "event Withdraw(address indexed owner, uint amount)"
];

export const BANK_ADDRESS = import.meta.env.VITE_BANK_CONTRACT_ADDRESS || "";