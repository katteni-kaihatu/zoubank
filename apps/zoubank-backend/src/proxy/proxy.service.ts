import { Injectable } from '@nestjs/common';

@Injectable()
export class ProxyService {

    userInfoCache: Record<string, any> = {}

    async getUserInfoById(userId: string) {
        // https://api.resonite.com/user/:userId
        if(this.userInfoCache[userId]) {
            return this.userInfoCache[userId]
        }

        const result = await fetch(`https://api.resonite.com/users/${userId}`)
        const data = await result.json()
        this.userInfoCache[userId] = data


        setTimeout(() => {
            delete this.userInfoCache[userId]
        }, 1000 * 60 * 30)

        return data

    }
}
