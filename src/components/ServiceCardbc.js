import {
  Card,
  CardBody,
  Center,
  Box,
  CardFooter,
  Button,
  VStack,
  Text,
} from '@chakra-ui/react';
import { CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import * as authenticator from 'authenticator';
import { useState, useEffect } from 'react';
import SecretPopoverbc from './SecretPopoverbc';
import { openInNewTab } from '../helper';
import { isMobile } from 'react-device-detect';

function ServiceCardbc({
  service,
  account,
  secret,
  isDemo,
  linkToEncodedData,
  themeData,
}) {
  const { color1, color2, textHighlight } = themeData;
  const [timerRefresh, setTimerRefresh] = useState(0);
  const [code, setCode] = useState('******');
  // starting duration offset from current time (new code at 0/60 and 30 seconds)
  const [duration, setDuration] = useState(
    new Date().getSeconds() > 30
      ? 60 - new Date().getSeconds()
      : 30 - new Date().getSeconds()
  );


  const spaceOutCode = num => `${num.slice(0, 3)} ${num.slice(3)}`;

  return (
    <Card my={2} width={'100%'}>
      <Box height={0}>
        <svg>
          <defs>
            <linearGradient id="your-unique-id" x1="1" y1="0" x2="0" y2="0">
              <stop offset="5%" stopColor={color2} />
              <stop offset="95%" stopColor={color1} />
            </linearGradient>
          </defs>
        </svg>
      </Box>

      <CardBody>
        <div>
          {service}: {account}
        </div>
        
      </CardBody>

      <CardFooter justify={'center'}>
        <SecretPopoverbc
          secret={secret}
          isDemo={isDemo}
          linkToEncodedData={linkToEncodedData}
          themeData={themeData}
        />
        
        {linkToEncodedData && (
          <Button
            onClick={() => openInNewTab(linkToEncodedData)}
            marginLeft={4}
          >
            <ExternalLinkIcon marginRight={1} /> Encrypted data
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ServiceCardbc;
