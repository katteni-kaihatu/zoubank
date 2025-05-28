import {Injectable, Logger} from '@nestjs/common';
import {importSPKI, jwtVerify, KeyLike} from "jose"
import * as process from "node:process";



@Injectable()
export class JwtService {
    logger = new Logger(JwtService.name)
    publicKey: KeyLike

    constructor() {
        this.getPublicKey().then(async (key) => {
            this.publicKey = await importSPKI(key, "EdDSA")
            this.logger.log("pubkey loaded.")
        }).catch((e) => {
            this.logger.error("Failed to load pubkey", e)
        })
    }

    // Fetch the public key from the auth server
    async getPublicKey() {
        const result = await fetch("https://auth.resonite.love/api/publickey")
        const json = await result.json()
        return json.key
    }

    // Verify the token
    async verify(token: string) {
        const APP_AUDIENCE = process.env.APP_AUDIENCE
        console.log("APP_AUDIENCE", APP_AUDIENCE)
        return jwtVerify(token, this.publicKey, {
            algorithms: ["EdDSA"],
            audience: APP_AUDIENCE
        })
    }
}
