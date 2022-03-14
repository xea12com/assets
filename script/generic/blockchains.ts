import { CoinType } from "@trustwallet/wallet-core";

export const getChainName = (id: CoinType): string =>  CoinType.id(id); // 60 => ethereum
export const Ethereum = getChainName(CoinType.ethereum);
export const SmartChain = getChainName(CoinType.smartchain);

export const ethForkChains = [
    Ethereum,
    SmartChain,
];
