"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = void 0;
const getUser = async (prisma, userObject) => {
    const user = await prisma.user.findUnique({
        where: {
            resoniteUserId: userObject.resoniteUserId
        }
    });
    if (!user) {
        // create new user
        const newUser = await prisma.user.create({
            data: {
                resoniteUserId: userObject.resoniteUserId,
                authId: userObject.authId
            }
        });
        return newUser;
    }
    return user;
};
exports.getUser = getUser;
