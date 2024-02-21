import { useState, useRef } from 'react';
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
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { AddIcon } from '@chakra-ui/icons';
import { isMobile } from 'react-device-detect';
import parseURI from 'otpauth-uri-parser';

const GET_SECRET_VIA = {
  UNDECIDED: 'UNDECIDED',
  QR: 'QR',
  TEXT: 'TEXT',
};

function AddSecret({ saveSecret, themeData }) {
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

  const resetSecretGetVia = () => {
    setSecretGetVia(GET_SECRET_VIA.UNDECIDED);
    setQrData(null);
    reset();
    setShowQrScanner(false);
  };

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


 const title = '2FA secret';


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
                  Enter a setup key
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
                <Text>2FA secret key from service</Text>
                <Input
                  type="text"
                  placeholder="j22h ni4e cd4o hqrx fka7 7uye wf2d xh77"
                  defaultValue={qrData?.secret}
                  {...register('secret', {
                    required: true,
                    minLength: 16,
                    maxLength: 80,
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
          {/*todo: add camera access QR pickup*/}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default AddSecret;
