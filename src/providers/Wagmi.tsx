import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http, createConfig } from "wagmi";
import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

export const config = createConfig({
  chains: [
    base,
    arbitrum,
    avalanche,
    bsc,
    optimism,
    polygon,
    mainnet,
  ],
  connectors: [coinbaseWallet({
    appName: "Mochi Token Store",
    appLogoUrl: "https://avatars.githubusercontent.com/u/108554348?s=200&v=4",
    preference: "smartWalletOnly",
  })],
  transports: {
    [base.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export const Wagmi = ({ children } : { 
  children: React.ReactNode
 }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
