import { ethers } from "ethers";
import BeliefMarketABI from '../abi/BeliefMarket.json';


const CONTRACT_ADDRESS = import.meta.env.VITE_BELIEF_MARKET_ADDRESS as string;

export function getBeliefMarketContract(providerOrSigner?: any) {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_BELIEF_MARKET_ADDRESS env variable not set");

  let runner: any = providerOrSigner;
  // If runner is not an ethers v6 Signer/Provider, fall back to a BrowserProvider for reads
  const isEthersRunner = runner && (typeof runner === 'object') && (
    'provider' in runner || // Signer
    'getBlockNumber' in runner || // Provider
    'call' in runner // Fallback check
  );
  if (!isEthersRunner) {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      runner = new ethers.BrowserProvider((window as any).ethereum);
    } else {
      runner = ethers.getDefaultProvider();
    }
  }

  return new ethers.Contract(CONTRACT_ADDRESS, BeliefMarketABI.abi, runner);
}