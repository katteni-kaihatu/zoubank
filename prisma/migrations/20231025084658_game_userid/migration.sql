-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "zouOK" INTEGER NOT NULL DEFAULT 0,
    "zouNG" INTEGER NOT NULL DEFAULT 0,
    "additionalInfo" TEXT,
    CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("additionalInfo", "createdAt", "id", "userId", "uuid", "zouNG", "zouOK") SELECT "additionalInfo", "createdAt", "id", "userId", "uuid", "zouNG", "zouOK" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
