import {
  ChakraProvider,
  Box,
  VStack,
  Grid,
  extendTheme,
  Container,
} from '@chakra-ui/react';

import { useAccount } from 'wagmi';
import { useState } from 'react';

import './App.css';
import LandingPage from './pages/LandingPage';
import LoggedInPage from './pages/LoggedInPage';
import LoggedInPagebc from './pages/LoggedInPagebc';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

function App() {
  const { isConnected } = useAccount();
  const [showBackupCodesPage, setShowBackupCodesPage] = useState(false);

  const handleSignInOption = (option) => {
    if (option === 'backupCodes') {
      setShowBackupCodesPage(true);
    } else {
      setShowBackupCodesPage(false);
    }
  };

  return (
    <ChakraProvider theme={extendTheme({ config })}>
      <Box textAlign="center" fontSize="xl">
        <Grid minH="100vh" p={3}>
          <VStack spacing={8}>
            <Container minWidth={'80%'} maxWidth={'700px'}>
              {isConnected ? (
                showBackupCodesPage ? (
                  <LoggedInPagebc />
                ) : (
                  <LoggedInPage />
                )
              ) : (
                <LandingPage onSignInOption={handleSignInOption} />
              )}
            </Container>
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;