import cryptoJS from "crypto-js";

// add this to env file
const secret : cryptoJS.lib.WordArray = cryptoJS.enc.Base64.parse ("65MeaID67UmBlZ/Nb8RCOfUAF3gkoproJra9L+J9fmM=")
const customIV: cryptoJS.lib.WordArray = cryptoJS.enc.Base64.parse("Iye16+LR+plUr/qJQaGrkw==")

export function aesEncrypt(message: string) {
    let ciphertext = cryptoJS.AES.encrypt(message, secret, { iv: customIV });
    return ciphertext.toString();
}

export function aesDecrypt(message: string) {
    let ciphertext = cryptoJS.AES.decrypt(message, secret, { iv: customIV });
    return ciphertext.toString(cryptoJS.enc.Base64);
}

// console.log(aesEncrypt(""))