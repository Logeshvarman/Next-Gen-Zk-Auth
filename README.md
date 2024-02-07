# Next-Gen-Zk-Auth 

Next-Gen-Zk-Auth is a wallet-based authentication system that stores 2FA secrets with public-key encryption in a decentralized storage system based on the Zk rollup protocol. Only the user can decrypt or view these secrets, and they can generate dynamic OTP tokens for web2 and web3-based applications, based on Internet Engineering Task Force standard RFC 6238. Access is possible on any device by connecting an EVM-based wallet.


## Next-Gen-Zk-Auth mitigates all the issues in the current 2FA, such as:

### Storage and Data Availability Issues
Traditional 2FA relies on a single central database to store users sensitive information. In case of a any database failure or system outage this can result in issues with data accessibility and potential security breaches.



## Decentralized Keys db on Polybase

* id: string
* appId: string
* publicKey: PublicKey
* service: string (encrypted with Lit)
* account: string (encrypted with Lit)
* secret: string (encrypted with Lit)

