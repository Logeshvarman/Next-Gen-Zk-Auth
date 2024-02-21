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

  const decryptRec = async rec => {
    const { id, service, serviceKey, account, accountKey, secret, secretKey } =
      rec;
    return Promise.all([
      id,
      decryptWithLit(service, serviceKey),
      decryptWithLit(account, accountKey),
      decryptWithLit(secret, secretKey),
    ]).then(([id, decryptedService, decryptedAccount, decryptedSecret]) => ({
      id,
      service: decryptedService,
      account: decryptedAccount,
      secret: decryptedSecret,
    }));
  };

  const decryptPolybaseRecs = async recs => {
    const decryptedPolybaseRecs = [];
    for (let rec of recs) {
      const dr = await decryptRec(rec);
      decryptedPolybaseRecs.push(dr);
    }

    return decryptedPolybaseRecs;
  };

  const decryptWithLit = async (encryptedString, encryptedSymmetricKey) => {
    if (litClient) {
      const encryptedMessageBlob = await LitJsSdk.base64StringToBlob(
        encryptedString
      );

      const symmetricKey = await litClient.getEncryptionKey({
        accessControlConditions: addressAccessControl(address),
        toDecrypt: encryptedSymmetricKey,
        chain,
        authSig,
      });

      const decryptedMessage = await LitJsSdk.decryptString(
        encryptedMessageBlob,
        symmetricKey
      );

      return decryptedMessage;
    }
  };

  const [polybaseDb, setPolygbaseDb] = useState();
  const [defaultNamespace] = useState(
    'pk/0xd126d4c850e574837db72bbd30836b51699438bfc8d2f5c3438e10711130fadea34721adfd2ac3a19da68552aea3d785bbc57baadb4cafdb0a0933137fb3a5a8/Keys'
  );
  const [collectionReference] = useState('Keys');
  const [appId] = useState('hack-fs');

  const [addedSigner, setAddedSigner] = useState(false);
  const [cards, setCards] = useState();
  const [filteredCards, setFilteredCards] = useState(cards);

  const deleteRecord = async id => {
    const record = await polybaseDb
      .collection(collectionReference)
      .record(id)
      .call('del');
    return record;
  };

  const listRecordsWhereAppIdMatches = async (
    field = 'address',
    op = '==',
    val = address
  ) => {
    if (polybaseDb) {
      const records = await polybaseDb
        .collection(collectionReference)
        .where(field, op, val)
        .where('appId', '==', appId)
        .get();
      return records.data.map(d => d.data);
    } else {
      return [];
    }
  };

  const createPolybaseRecord = async (service, account, secret) => {
    setPolybaseLoading(true);
    try {
  
      const id = `encrypted${Date.now().toString()}`;

      const record = await polybaseDb
        .collection(collectionReference)
        .create([
          id,
          appId,
          address,
          service.encryptedString,
          service.encryptedSymmetricKey,
          account.encryptedString,
          account.encryptedSymmetricKey,
          secret.encryptedString,
          secret.encryptedSymmetricKey,
        ]);

      setPolybaseRetrying(false);

      setCards(cards => [
        {
          id,
          service: service.service,
          account: account.account,
          secret: secret.secret,
        },
        ...cards,
      ]);
    } catch (err) {
      console.log(err);

      if (err.code !== -32603) {
        // if Polybase error, retry post data
        createPolybaseRecord(service, account, secret);
        setPolybaseRetrying(true);
      }
    }
    setPolybaseLoading(false);
  };

  const encryptAndSaveSecret = async ({ service, account, secret }) => {
    const encryptedService = await encryptWithLit(service);
    const encryptedAccount = await encryptWithLit(account);
    const encryptedSecret = await encryptWithLit(secret);

    const full2fa = {
      service: {
        decrypted: service,
        encrypted: encryptedService,
      },
      account: {
        decrypted: account,
        encrypted: encryptedAccount,
      },
      secret: {
        decrypted: secret,
        encrypted: encryptedSecret,
      },
    };

    setCurrent2fa(full2fa);

    createPolybaseRecord(
      { ...encryptedService, service },
      { ...encryptedAccount, account },
      { ...encryptedSecret, secret }
    );
  };

  useEffect(() => {
    if (isConnected && address) {
      const db = new Polybase({
        defaultNamespace,
      });

      const addSigner = async () => {
        setAddedSigner(true);
        db.signer(async data => {
          const accounts = await eth.requestAccounts();
          const account = accounts[0];
          const sig = await eth.sign(data, account);
          return { h: 'eth-personal-sign', sig };
        });




        setPolygbaseDb(db);
      };

      addSigner();
    }
  }, [isConnected, address]);

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
            Next-Gen-Zk-Auth
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
          <VStack alignItems="flex-start" >
            <HStack>
              <a target="_blank">
                <Image
                  borderRadius="full"
                  boxSize={isMobile ? '80px' : '100px'}
              
                  fallbackSrc={imgProviderSrc(
                    isMobile,
                    themeData.fallbackPfpIpfsCid
                  )}
                  marginRight={isMobile ? 2 : 4}
                />
              </a>

              <VStack style={{ textAlign: 'left', 
              alignItems: 'flex-start' }}>
                <Text>
                  <strong>
                  {greeting}
                    User
                  </strong>
                </Text>



                <Button
                  marginLeft={-1}
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
      {/* Returning user with secrets*/}

      <Wrap justifyContent={'space-between'} id="logged-in-wrap">
        {cards &&
          cards.map(c => (
            <WrapItem width={isMobile || !isLargerThan700 ? '100%' : '49%'}>
              <ServiceCard
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