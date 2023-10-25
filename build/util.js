"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserObj = void 0;
const getUserObj = (userObj) => {
    return {
        authId: userObj.id,
        resoniteUserId: userObj.resoniteUserId
    };
};
exports.getUserObj = getUserObj;
