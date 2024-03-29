import { useEffect, useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Input,
  Text,
  Container,
  Center,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { AddIcon } from '@chakra-ui/icons';
import { isMobile } from 'react-device-detect';
import parseURI from 'otpauth-uri-parser';
import QrScanner from 'qr-scanner';

const GET_SECRET_VIA = {
  UNDECIDED: 'UNDECIDED',
  QR: 'QR',
  TEXT: 'TEXT',
};

function AddSecretbc({ saveSecret, themeData }) {
  const videoRef = useRef(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scanner, setScanner] = useState();
  const [secretGetVia, setSecretGetVia] = useState(GET_SECRET_VIA.UNDECIDED);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [qrData, setQrData] = useState();

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = data => {
    onClose();
    saveSecret(data);
    reset();
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
    }
  };

  useEffect(() => {
    if (scanner && !showQrScanner) {
      stopScanning();
    }
  }, [showQrScanner]);

  const resetSecretGetVia = () => {
    setSecretGetVia(GET_SECRET_VIA.UNDECIDED);
    setQrData(null);
    reset();
    setShowQrScanner(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetSecretGetVia();
      setShowQrScanner(false);
    }
  }, [isOpen]);

  const handleScan = uri => {
    setShowQrScanner(false);
    const parsed = parseURI(uri);

    setQrData({
      service: parsed.query.issuer,
      account: parsed.label.account,
      secret: parsed.query.secret,
    });
    setSecretGetVia(GET_SECRET_VIA.TEXT);
  };

  useEffect(() => {
    if (showQrScanner && secretGetVia === GET_SECRET_VIA.QR) {
      const qrScanner = new QrScanner(
        videoRef.current,
        ({ data }) => {
          if (data && data.startsWith('otpauth')) {
            handleScan(data);
          }
        },
        {
          /* your options or returnDetailedScanResult: true if you're not specifying any other options */
          highlightCodeOutline: true,
          highlightScanRegion: true,
          preferredCamera: 'environment',
          // onDecodeError: error => alert(error),
        }
      );
      qrScanner.start();
      setScanner(qrScanner);
    }
  }, [showQrScanner, secretGetVia]);

  const title = 'BackUp code';

  return (
    <>
      <Button onClick={onOpen} background={themeData.button}>
        <AddIcon marginRight={2} /> {isMobile ? '2FA' : title}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text>Add a new {title}</Text>

          </ModalHeader>
          <ModalCloseButton />
          {secretGetVia === GET_SECRET_VIA.UNDECIDED ? (
            <>
              <ModalFooter justifyContent={'space-evenly'}>
                <Button onClick={() => setSecretGetVia(GET_SECRET_VIA.TEXT)}>
                  Backup code
                </Button>
              </ModalFooter>
            </>
          ) : secretGetVia === GET_SECRET_VIA.TEXT ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalBody>
                <Text>Service</Text>
                <Input
                  type="text"
                  placeholder="service"
                  defaultValue={qrData?.service}
                  {...register('service', { required: true, maxLength: 80 })}
                  marginBottom={2}
                />
                <Text>Account</Text>
                <Input
                  type="text"
                  placeholder="user@mail.com"
                  defaultValue={qrData?.account}
                  {...register('account', {
                    required: true,
                    max: 100,
                    maxLength: 100,
                  })}
                  marginBottom={2}
                />
                <Text>2FA backup code from service</Text>
                <Input
                  type="text"
                  placeholder="01010 01010 01010 01010 01010"
                  defaultValue={qrData?.secret}
                  {...register('secret', {
                    required: true,
                    minLength: 8,
                    maxLength: 100,
                  })}
                />
              </ModalBody>

              <ModalFooter>
                <Button onClick={() => resetSecretGetVia()}>Back</Button>
                <Button
                  background={themeData.button}
                  marginLeft={4}
                  onClick={handleSubmit(onSubmit)}
                >
                  Encrypt and save
                </Button>
              </ModalFooter>
            </form>
          ) : (
            <ModalBody>
              <Text>Scan 2FA QR code (must allow camera access)</Text>
              <video
                ref={videoRef}
                style={{
                  display: !showQrScanner ? 'none' : 'block',
                  width: '100%',
                }}
              ></video>
              <ModalFooter px={0}>
                <Button onClick={() => resetSecretGetVia()}>Back</Button>
              </ModalFooter>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default AddSecretbc;
