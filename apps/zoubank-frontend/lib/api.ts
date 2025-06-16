import {UserInfo} from "@/contexts/Application";

export class ApiClient {
    constructor(_endpoint?: string) {
        console.log("oOoOoOoOoO API SERVICE CREATED OoOoOoOoOo");
    }

    async getUserInfo() {
        try {
            const result = await fetch(`/api/user`, {
                credentials: "include",
            });
            if (result.status === 401) {
                return null;
            }
            return await result.json();
        } catch (e) {
            return null;
        }
    }

    async login(RLToken: string) {
        console.log("login with RLToken");
        try {
            const result = await fetch(`/api/auth`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RLToken}`,
                },
            });
            const r = await result.json();
            console.log(r);
            return r;
        } catch (e) {
            return null;
        }
    }

    async logout() {
        try {
            const result = await fetch(`/api/auth`, {
                method: "DELETE",
                credentials: "include",
            });
            return result.status === 204;
        } catch (e) {
            return false;
        }
    }

    async updateUserInfo(
        userInfo: Pick<UserInfo, "branchName" | "accountNumber">,
    ) {
        try {
            const result = await fetch(`/api/user`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userInfo),
            });
            return result.status === 200;
        } catch (e) {
            return false;
        }
    }

    async sendTransfer(data: {
        senderId: string;
        recipientId: string;
        amount: number;
        memo?: string;
        customData?: Record<string, unknown>;
    }) {
        try {
            const result = await fetch(`/api/transaction`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            return result.status === 200 || result.status === 201;
        } catch (e) {
            return false;
        }
    }

    async getResoniteUserDataFromUserId(userId: string) {
        if (!userId.startsWith("U-")) return null;
        try {
            const result = await fetch(`/api/proxy/resonite/users/${userId}`);
            return await result.json();
        } catch (e) {
            return null;
        }
    }

    async getZouBankUserFromUserId(userId: string) {
        try {
            const result = await fetch(`/api/user/${userId}`);
            return await result.json();
        } catch (e) {
            return null;
        }
    }

    async searchUsers(query: string) {
        try {
            const result = await fetch(`/api/user/search?q=${encodeURIComponent(query)}`, {
                credentials: "include",
            });
            if (!result.ok) {
                return [];
            }
            return await result.json();
        } catch (e) {
            return [];
        }
    }
}
