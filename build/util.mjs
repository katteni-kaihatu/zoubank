import { v4 } from 'uuid';
export const getUserObj = (userObj) => {
    return {
        authId: userObj.id,
        resoniteUserId: userObj.resoniteUserId
    };
};
export const generateUUID = () => {
    return v4();
};
