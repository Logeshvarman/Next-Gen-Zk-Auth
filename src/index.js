import { ColorModeScript } from '@chakra-ui/react';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorker from './serviceWorker';
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, filecoin, polygonMumbai } from 'wagmi/chains';

require('dotenv').config();

const chains = [mainnet, filecoin, polygonMumbai];
const projectId = process.env.REACT_APP_WALLET_CONNECT_ID;

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 1, chains }),
  publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <>
    <ColorModeScript />
    <WagmiConfig config={wagmiConfig}>
      <App />
    </WagmiConfig>

    <Web3Modal
      projectId={projectId}
      ethereumClient={ethereumClient}
      themeVariables={{
        '--w3m-font-family': 'Roboto, sans-serif',
        '--w3m-background-color': '#7928CA',
        '--w3m-accent-color': '#7928CA',
        '--w3m-button-hover-highlight-border-radius': '6px',
        '--w3m-button-border-radius': '6px',
      }}
    />
  </>
);

serviceWorker.register();

reportWebVitals();
