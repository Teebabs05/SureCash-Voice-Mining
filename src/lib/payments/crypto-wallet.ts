export type CryptoNetworkId = "TRC20" | "ERC20" | "BEP20";

export const CRYPTO_NETWORKS: { id: CryptoNetworkId; label: string }[] = [
  { id: "TRC20", label: "USDT (TRC20 - Tron)" },
  { id: "ERC20", label: "USDT (ERC20 - Ethereum)" },
  { id: "BEP20", label: "USDT (BEP20 - BNB Smart Chain)" },
];

/**
 * Format-level address validation per network. This is the crypto
 * equivalent of the bank account-name resolution — there's no name to
 * verify against, but the platform can confirm upfront that the address is
 * at least well-formed for the selected network before it's saved.
 */
export function isValidCryptoAddress(network: CryptoNetworkId, address: string): boolean {
  if (network === "TRC20") {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  }
  // ERC20 and BEP20 both use standard EVM addresses.
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
