import {
  Text,
  Container,
  Button,
  Center,
  VStack,
  Image,
} from '@chakra-ui/react';
import QRCode from 'react-qr-code';
import { isMobile } from 'react-device-detect';
import { imgProviderSrc } from '../ipfsHelpers';

import { Web3Button } from '@web3modal/react';
import { isBrowser } from 'react-device-detect';
import { openInNewTab } from '../helper';
import { getThemeData } from '../theme';

function LandingPage() {
  const logo = (cid, link) => (
    <a href={link} target="_blank">
      <Image
        borderRadius="full"
        boxSize="50px"
        src={imgProviderSrc(isMobile, cid)}
        fallbackSrc={imgProviderSrc(true, cid)}
        margin={2}
      />
    </a>
  );
  const themeData = getThemeData('default');
  return (
    <>
      <Container>
        <Text
          bgGradient={`linear(to-l, ${themeData.color2}, ${themeData.color1})`}
          bgClip="text"
          fontSize="5xl"
          fontWeight="bold"
          marginTop={2}
        >
          Web3 OTP
        </Text>

        <Text fontSize="large" fontWeight="bold">
          Wallet encrypted & 2FA storage solution
        </Text>
        <br></br>
        <Center my={3}>
          {window.ethereum && (
            <Button padding={'0'} my={2} background={'#7928CA'}>
              <Web3Button
                icon="hide"
                avatar="hide"
                label="Sign in with your wallet"
              />
            </Button>
          )}
          {!window.ethereum && (
            <VStack>
              {isBrowser ? (
                <>
                  <Text>Sign QR to open in Metamask Mobile</Text>
                  <QRCode
                    size={50}
                    style={{ height: 'auto', maxWidth: '50%', width: '50%' }}
                    value="https://metamask.app.link/dapp/Next-Gen-Zk-Auth.on.fleek.co"
                    viewBox={`0 0 50 50`}
                  />
                </>
              ) : (
                <Button
                  my={4}
                  background={'#7928CA'}
                  onClick={() =>
                    openInNewTab(
                      'https://metamask.app.link/dapp/Next-Gen-Zk-Auth.on.fleek.co'
                    )
                  }
                >
                  Sign in from Metamask Mobile
                </Button>
              )}
            </VStack>
          )}
        </Center>

        <br></br>
      </Container>
      <br></br>

    </>
  );
}

export default LandingPage;
