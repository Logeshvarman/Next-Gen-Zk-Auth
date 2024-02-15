import { useState, useEffect } from 'react';
import {
  Text,
  HStack,
  Button,
  Card,
  Image,
  VStack,
  Tooltip,
  Spinner,
  Wrap,
  WrapItem,
  useMediaQuery,
} from '@chakra-ui/react';

import { isMobile } from 'react-device-detect';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { CopyIcon } from '@chakra-ui/icons';

import * as LitJsSdk from '@lit-protocol/lit-node-client';

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

import { useAccount, useDisconnect } from 'wagmi';
import { Polybase } from '@polybase/client';
import * as eth from '@polybase/eth';

import AddSecret from '../components/AddSecret';
import ServiceCard from '../components/ServiceCard';
import LoaderModal from '../components/LoaderModal';
import { getThemeData } from '../theme';
import { imgProviderSrc } from '../ipfsHelpers';
import { timeout } from '../helper';

import Greetings from '../components/Greetings';

const greeting = Greetings();

function LoggedInPage() {
  const { address, isConnected } = useAccount();
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const { disconnect } = useDisconnect();
  const [chain] = useState('ethereum');
  const [authSig, setAuthSig] = useState();
  const [polybaseLoading, setPolybaseLoading] = useState(false);
  const [polybaseRetrying, setPolybaseRetrying] = useState(false);
  const [current2fa, setCurrent2fa] = useState();
  const [ensName, setEnsName] = useState();
  const [ensProfile, setEnsProfile] = useState();
  const [ensAvatar, setEnsAvatar] = useState();
  const [theme, setTheme] = useState('default');
  const [themeData, setThemeData] = useState(getThemeData(theme));

  const [isLargerThan700] = useMediaQuery('(min-width: 700px)');

  useEffect(() => {
    setThemeData(getThemeData(theme));
  }, [theme]);

  const [litClient, setLitClient] = useState();

  const addressAccessControl = address => [
    {
      contractAddress: '',
      standardContractType: '',
      chain,
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: address,
      },
    },
  ];

  useEffect(() => {

    const connectToLit = async () => {
      const client = new LitJsSdk.LitNodeClient();
      await client.connect();
      return client;
    };
    

    connectToLit().then(async lc => {
      setLitClient(lc);

      if (window.ethereum) {
        const sig = await LitJsSdk.checkAndSignAuthMessage({
          chain,
        });

        setAuthSig(sig);
      }
    });
  }, []);

  const encryptWithLit = async msg => {
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(msg);

    const encryptedSymmetricKey = await litClient.saveEncryptionKey({
      accessControlConditions: addressAccessControl(address),
      symmetricKey,
      authSig,
      chain,
    });

    const encryptedMessageStr = await LitJsSdk.blobToBase64String(
      encryptedString
    );

    const encryptedKeyStr = LitJsSdk.uint8arrayToString(
      encryptedSymmetricKey,
      'base16'
    );

    return {
      encryptedString: encryptedMessageStr,
      encryptedSymmetricKey: encryptedKeyStr,
    };
  };



  useEffect(() => {
    if (polybaseDb && addedSigner && litClient && authSig) {
      const getEncryptedDataFromPolybase = async () => {
        const records = await listRecordsWhereAppIdMatches();
        await timeout(1000);
        return records;
      };
      getEncryptedDataFromPolybase().then(async recs => {
        await decryptPolybaseRecs(recs).then(decryptedRecs => {
          const serviceSortedRecs =
            decryptedRecs &&
            decryptedRecs.sort((a, b) => {
              // if same service, alphabetize by account
              if (a.service.toLowerCase() === b.service.toLowerCase()) {
                return a.account.toLowerCase() > b.account.toLowerCase()
                  ? 1
                  : -1;
              } else {
                // alphabetize by service
                return a.service.toLowerCase() > b.service.toLowerCase()
                  ? 1
                  : -1;
              }
            });
          setCards(serviceSortedRecs);
        });
      });
    }
  }, [addedSigner, litClient, authSig, polybaseDb]);

  const shortAddress = addr => `${addr.slice(0, 5)}...${addr.slice(-4)}`;
  const encodedNamespaceDb = encodeURIComponent(
    `${defaultNamespace}/${collectionReference}`
  );

  return (
    <>
      <LoaderModal
        open={polybaseLoading || polybaseRetrying}
        message={
          polybaseLoading
            ? 'Sign the message in your wallet to encrypt and save your 2FA secret'
            : 'Still polling Polybase, please sign again.'
        }
        tableData={current2fa}
      />
      {address && (
        <HStack justifyContent={'space-between'}>
          <div>
            <Text
              bgGradient={`linear(to-l, ${themeData.color2}, ${themeData.color1})`}
              bgClip="text"
              fontSize="4xl"
              fontWeight="bold"
            >
              Web3 OTP
            </Text>
          </div>

          {cards && (
            <AddSecret
              saveSecret={encryptAndSaveSecret}
              themeData={themeData}
            />
          )}
          {/* </BrowserView> */}
        </HStack>
      )}
      {/* NEW LOGGED IN USER */}
      {cards && (
        <Card padding={isMobile ? 4 : 10} my={5}>
          <VStack alignItems="flex-start">
            <HStack>
              <a href={ensProfile} target="_blank">
                <Image
                  borderRadius="full"
                  boxSize={isMobile ? '80px' : '100px'}
                  // if the user has an ENS with a set avatar, the pfp is their avatar
                  src={ensAvatar}
                  fallbackSrc={imgProviderSrc(
                    isMobile,
                    themeData.fallbackPfpIpfsCid
                  )}
                  marginRight={isMobile ? 2 : 4}
                />
              </a>

              <VStack style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                <Text>
                  <strong>
                  {greeting}
                    {ensName ? (
                      <a href={ensProfile} target="_blank">
                        {ensName}
                      </a>
                    ) : (
                      'User'
                    )}{' '}
                  </strong>
                </Text>

                <Text>
                  <CopyToClipboard text={address}>
                    <span
                      style={{
                        color: 'rgba(192,192,192,40)',
                        marginLeft: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      <CopyIcon marginRight={1} />
                      <Tooltip label="Click to copy address">
                        {shortAddress(address)}
                      </Tooltip>
                    </span>
                  </CopyToClipboard>
                </Text>

                <Button
                  marginLeft={2}
                  onClick={() => disconnect()}
                  width={isMobile ? '100%' : 'fit-content'}
                >
                  Log out
                </Button>
              </VStack>
            </HStack>
          </VStack>
        </Card>
      )}

      {(!address || !cards) && <Spinner marginTop={20} size={'xl'} />}

      {cards && cards.length == 0 && (
        <Text textAlign="left">
          Get started with Web3 OTP by adding your first 2FA secret. Need
          help?{' '}
          <a
            style={{ textDecoration: 'underline' }}
            target="_blank"
            href="https://www.notion.so/0xlogeshvarman/How-to-add-2FA-codes-from-your-web2-and-web3-apps-to-the-Web3-OTP-Authenticator-App-38f74a1c160a4866920ddaae5f4c668e"
          >
            Read the docs
          </a>
        </Text>
      )}
      {/* Returning user with secrets*/}

      <Wrap justifyContent={'space-between'} id="logged-in-wrap">
        {cards &&
          cards.map(c => (
            <WrapItem width={isMobile || !isLargerThan700 ? '100%' : '49%'}>
              <ServiceCard
                key={c.secret}
                linkToEncodedData={`https://testnet.polybase.xyz/v0/collections/${encodedNamespaceDb}/records/${c.id}`}
                service={c.service}
                account={c.account}
                secret={c.secret}
                themeData={themeData}
              />
            </WrapItem>
          ))}
      </Wrap>
    </>
  );
}

export default LoggedInPage;