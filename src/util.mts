import {v4} from 'uuid';
export interface UserObj {
    authId: string;
    resoniteUserId: string;
}

export const getUserObj = (userObj: any) : UserObj => {
    return {
        authId: userObj.id,
        resoniteUserId: userObj.resoniteUserId
    }
}


export const generateUUID = () => {
    return v4()
}