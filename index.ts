import * as openpgp from 'openpgp';
import * as fs from 'fs/promises';

async function importKeyFromFile(filePath: string): Promise<string> {
  try {
    const publicKeyData = await fs.readFile(filePath, 'utf8');
    if (!openpgp.readKey({ armoredKey: publicKeyData })) {
      throw new Error('Invalid PGP public key data');
    }
    return publicKeyData;
  } catch (error) {
    console.error('Error importing public key from file:', error);
    throw error;
  }
}

async function encryptObjectWithPGP(obj: any, publicKeyFilePath: string) {
  try {
    const jsonString = JSON.stringify(obj);
    console.log(jsonString)
    // Import the recipient's public key from a file
    const publicKeyArmored = await importKeyFromFile(publicKeyFilePath);
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    const encryptedData = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: jsonString }),
      encryptionKeys: publicKey
    });

    return encryptedData;
  } catch (error) {
    console.error('Error encrypting object with PGP:', error);
    throw error;
  }
}

async function sendEncryptedMessageToAPI(encryptedMessage: any, apiEndpoint: string, token: string): Promise<void> {
  try {
    // Create a JSON object with the encrypted message
    const messageObject = { data: encryptedMessage };

    // Send the JSON object to the API using fetch
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messageObject),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('API Response:', responseData);
  } catch (error) {
    throw error;
  }
}

async function decryptMessage(encryptedMessage: string, privateKeyFilePath: string): Promise<string> {
  try {
    const passphrase = ''
    const privateKeyArmored = await importKeyFromFile(privateKeyFilePath);
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
      passphrase
    });

    const message = await openpgp.readMessage({
      armoredMessage: encryptedMessage
    });

    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey
    });

    return decrypted;
  } catch (error) {
    throw error;
  }
}

// usage:
const publicKeyFilePath = './UAT_GAC_Public.asc';

const dataToEncrypt = {
  email: "test@socket9.com",
  deviceId: "000-111-222-333"
}

const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3VzZXJkYXRhIjoiWElYNFUwdi9XbXFmcGpCQWdnb0dmcEtNOWx3S0ZLb1FPTG9QVmpYUXd3WllEdGZ3YjF4TWlFTEtaMjFJZ3JLTnlCK0Fjc3VwOU5hK3ZBNkFWTm9Sb2RvSDBjeEdhck1FNWVYZTA4eW9LeGc9IiwibmJmIjoxNjk5MjYzNjc5LCJleHAiOjE2OTkyNjU0NzksImlhdCI6MTY5OTI2MzY3OSwiaXNzIjoiR2FjLUFwaSIsImF1ZCI6IkdhYy1DbGllbnQifQ.-OH_kohEquoBaEizrPlyYQJ_RZYfZSwCEXUReb63T3g';
const apiEndpoint = 'https://sandbox-gac.sandbox.2c2p.net/gac/api/v2.1/customers/verify-user-login-by-email'

encryptObjectWithPGP(dataToEncrypt, publicKeyFilePath)
  .then((encryptedData) => {
    console.log(encryptedData)
    let obj = {
      data: encryptedData.slice(29, -27)
    }

    let jsonObj = JSON.stringify(obj)

    console.log(jsonObj);

    sendEncryptedMessageToAPI(encryptedData, apiEndpoint, accessToken);
  })
  .catch((error) => {
    console.error(error);
  });