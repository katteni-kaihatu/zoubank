export const getUser = async (prisma, userObject) => {
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
export const getUserFromResoniteId = async (prisma, resoniteUserId) => {
    const user = await prisma.user.findUnique({
        where: {
            resoniteUserId: resoniteUserId
        }
    });
    return user;
};
export const getUserFromId = async (prisma, userId) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });
    return user;
};
export const getGameWithoutCreate = async (prisma, gameId) => {
    const game = await prisma.game.findUnique({
        where: {
            uuid: gameId
        }
    });
    return game;
};
export const getGame = async (prisma, gameId) => {
    const game = await prisma.game.findUnique({
        where: {
            uuid: gameId
        }
    });
    if (!game) {
        // create new game
        const newGame = await prisma.game.create({
            data: {
                uuid: gameId
            }
        });
        return newGame;
    }
    return game;
};
export const incrementGameSuccess = async (prisma, gameId) => {
    const game = await getGame(prisma, gameId);
    await prisma.game.update({
        where: {
            uuid: gameId
        },
        data: {
            zouOK: game.zouOK + 1
        }
    });
    if (!game.userId) {
        return;
    }
    const user = await getUserFromId(prisma, game.userId);
    if (!user) {
        return;
    }
    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            balance: user.balance + 1
        }
    });
};
export const incrementGameFailure = async (prisma, gameId) => {
    const game = await getGame(prisma, gameId);
    await prisma.game.update({
        where: {
            uuid: gameId
        },
        data: {
            zouNG: game.zouNG + 1
        }
    });
    if (!game.userId) {
        return;
    }
    const user = await getUserFromId(prisma, game.userId);
    if (!user) {
        return;
    }
    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            balance: user.balance - 1
        }
    });
};
export const setGameUser = async (prisma, gameId, userId) => {
    const game = await getGame(prisma, gameId);
    const user = await getUserFromId(prisma, userId);
    if (!user) {
        return;
    }
    await prisma.game.update({
        where: {
            uuid: gameId
        },
        data: {
            gamestate: "playing",
            player: {
                connect: {
                    id: user.id
                }
            }
        }
    });
};
export const setGameState = async (prisma, gameId, state) => {
    await prisma.game.update({
        where: {
            uuid: gameId
        },
        data: {
            gamestate: state
        }
    });
};
