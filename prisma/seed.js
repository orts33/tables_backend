"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var BOT_NAME, TOTAL_USERS, TOTAL_TABLES, MAX_PLAYERS, TOTAL_CLANS, TOTAL_REFERRALS, TOTAL_INVOICES, TOTAL_LEVEL_REWARDS, users, i, telegramId, user, clans, i, creator, clan, i, clan, tables, entryFees, tableTypes, t, entryFee, table, idx, _i, tables_1, table, count, group, _a, group_1, user, referrals, i, referrer, referred, referral, _b, referrals_1, referral, rewardTypes_1, i, user, rewardTypes, i, user, _c, tables_2, table, tableUsers, winner;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    BOT_NAME = process.env.TELEGRAM_BOT_NAME || 'your_bot_username';
                    TOTAL_USERS = 100;
                    TOTAL_TABLES = 10;
                    MAX_PLAYERS = 14;
                    TOTAL_CLANS = 5;
                    TOTAL_REFERRALS = 20;
                    TOTAL_INVOICES = 10;
                    TOTAL_LEVEL_REWARDS = 10;
                    users = [];
                    i = 0;
                    _d.label = 1;
                case 1:
                    if (!(i < TOTAL_USERS)) return [3 /*break*/, 4];
                    telegramId = (100000 + i).toString();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { telegramId: telegramId },
                            update: {},
                            create: {
                                telegramId: telegramId,
                                username: "mock_user_".concat(telegramId),
                                firstName: "User".concat(i + 1),
                                photoUrl: "https://example.com/avatars/user".concat(i + 1, ".png"),
                                level: Math.floor(Math.random() * 5) + 1, // Уровень от 1 до 5
                                xp: Math.floor(Math.random() * 5000), // XP от 0 до 5000
                                tokens: Math.floor(Math.random() * 1000), // Токены от 0 до 1000
                                totalGames: Math.floor(Math.random() * 50), // Сыграно игр от 0 до 50
                                wonTables: Math.floor(Math.random() * 10), // Побед от 0 до 10
                            },
                        })];
                case 2:
                    user = _d.sent();
                    users.push(user);
                    _d.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    clans = [];
                    i = 0;
                    _d.label = 5;
                case 5:
                    if (!(i < TOTAL_CLANS)) return [3 /*break*/, 8];
                    creator = users[i];
                    return [4 /*yield*/, prisma.clan.create({
                            data: {
                                name: "Clan_".concat(i + 1),
                                creatorId: creator.id,
                                createdAt: new Date(),
                            },
                        })];
                case 6:
                    clan = _d.sent();
                    clans.push(clan);
                    _d.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 5];
                case 8:
                    i = 0;
                    _d.label = 9;
                case 9:
                    if (!(i < TOTAL_USERS)) return [3 /*break*/, 12];
                    if (!(Math.random() > 0.3)) return [3 /*break*/, 11];
                    clan = clans[Math.floor(Math.random() * TOTAL_CLANS)];
                    return [4 /*yield*/, prisma.user.update({
                            where: { id: users[i].id },
                            data: { clanId: clan.id },
                        })];
                case 10:
                    _d.sent();
                    _d.label = 11;
                case 11:
                    i++;
                    return [3 /*break*/, 9];
                case 12:
                    tables = [];
                    entryFees = [3, 5, 10];
                    tableTypes = [client_1.TableType.LINEAR, client_1.TableType.RANDOM];
                    t = 0;
                    _d.label = 13;
                case 13:
                    if (!(t < TOTAL_TABLES)) return [3 /*break*/, 16];
                    entryFee = entryFees[Math.floor(Math.random() * entryFees.length)];
                    return [4 /*yield*/, prisma.table.create({
                            data: {
                                type: tableTypes[Math.floor(Math.random() * tableTypes.length)],
                                entryFee: entryFee,
                                prizeFund: entryFee * (Math.floor(Math.random() * 10) + 5), // Призовой фонд: entryFee * (5-15)
                                status: client_1.TableStatus.OPEN,
                                inviteLink: "https://t.me/".concat(BOT_NAME, "?start=table_mock_").concat(t + 1),
                                createdAt: new Date(),
                            },
                        })];
                case 14:
                    table = _d.sent();
                    tables.push(table);
                    _d.label = 15;
                case 15:
                    t++;
                    return [3 /*break*/, 13];
                case 16:
                    idx = 0;
                    _i = 0, tables_1 = tables;
                    _d.label = 17;
                case 17:
                    if (!(_i < tables_1.length)) return [3 /*break*/, 23];
                    table = tables_1[_i];
                    count = Math.floor(Math.random() * MAX_PLAYERS) + 1;
                    group = users.slice(idx, idx + count);
                    idx += count;
                    _a = 0, group_1 = group;
                    _d.label = 18;
                case 18:
                    if (!(_a < group_1.length)) return [3 /*break*/, 21];
                    user = group_1[_a];
                    return [4 /*yield*/, prisma.tableUser.create({
                            data: {
                                tableId: table.id,
                                userId: user.id,
                                joinedAt: new Date(),
                            },
                        })];
                case 19:
                    _d.sent();
                    _d.label = 20;
                case 20:
                    _a++;
                    return [3 /*break*/, 18];
                case 21:
                    if (idx >= users.length)
                        idx = 0; // Циклический обход пользователей
                    _d.label = 22;
                case 22:
                    _i++;
                    return [3 /*break*/, 17];
                case 23:
                    referrals = [];
                    i = 0;
                    _d.label = 24;
                case 24:
                    if (!(i < TOTAL_REFERRALS)) return [3 /*break*/, 27];
                    referrer = users[Math.floor(Math.random() * TOTAL_USERS)];
                    referred = users[Math.floor(Math.random() * TOTAL_USERS)];
                    if (!(referrer.id !== referred.id)) return [3 /*break*/, 26];
                    return [4 /*yield*/, prisma.referral.create({
                            data: {
                                referrerId: referrer.id,
                                referredId: referred.id,
                                referredAt: new Date(),
                            },
                        })];
                case 25:
                    referral = _d.sent();
                    referrals.push(referral);
                    _d.label = 26;
                case 26:
                    i++;
                    return [3 /*break*/, 24];
                case 27:
                    _b = 0, referrals_1 = referrals;
                    _d.label = 28;
                case 28:
                    if (!(_b < referrals_1.length)) return [3 /*break*/, 31];
                    referral = referrals_1[_b];
                    rewardTypes_1 = [client_1.RewardReferralType.FIRST_DEPOSIT, client_1.RewardReferralType.SUBSEQUENT_DEPOSIT, client_1.RewardReferralType.MILESTONE];
                    return [4 /*yield*/, prisma.referralReward.create({
                            data: {
                                referralId: referral.id,
                                amount: Math.floor(Math.random() * 100) + 10, // Награда 10–110 токенов
                                type: rewardTypes_1[Math.floor(Math.random() * rewardTypes_1.length)],
                                createdAt: new Date(),
                            },
                        })];
                case 29:
                    _d.sent();
                    _d.label = 30;
                case 30:
                    _b++;
                    return [3 /*break*/, 28];
                case 31:
                    i = 0;
                    _d.label = 32;
                case 32:
                    if (!(i < TOTAL_INVOICES)) return [3 /*break*/, 35];
                    user = users[Math.floor(Math.random() * TOTAL_USERS)];
                    return [4 /*yield*/, prisma.invoice.create({
                            data: {
                                id: "mock_invoice_".concat(i + 1),
                                userId: user.id,
                                amount: Math.floor(Math.random() * 500) + 50, // Сумма 50–550
                                currency: ['USDT', 'BTC', 'ETH'][Math.floor(Math.random() * 3)],
                                status: ['pending', 'paid', 'failed'][Math.floor(Math.random() * 3)],
                                createdAt: new Date(),
                                paidAt: Math.random() > 0.5 ? new Date() : null, // 50% шанс оплаты
                            },
                        })];
                case 33:
                    _d.sent();
                    _d.label = 34;
                case 34:
                    i++;
                    return [3 /*break*/, 32];
                case 35:
                    rewardTypes = [
                        client_1.RewardType.PRIZE_BOOST,
                        client_1.RewardType.FREE_ENTRY,
                        client_1.RewardType.PREMIUM_TABLE_ACCESS,
                        client_1.RewardType.REFERRAL_BONUS_BOOST,
                        client_1.RewardType.VIP_CLAN,
                        client_1.RewardType.DOUBLE_XP,
                        client_1.RewardType.DISCOUNT,
                        client_1.RewardType.EXCLUSIVE_AVATAR,
                        client_1.RewardType.LEGEND_STATUS,
                    ];
                    i = 0;
                    _d.label = 36;
                case 36:
                    if (!(i < TOTAL_LEVEL_REWARDS)) return [3 /*break*/, 39];
                    user = users[Math.floor(Math.random() * TOTAL_USERS)];
                    return [4 /*yield*/, prisma.levelReward.create({
                            data: {
                                userId: user.id,
                                level: Math.floor(Math.random() * 5) + 1, // Уровень 1–5
                                rewardType: rewardTypes[Math.floor(Math.random() * rewardTypes.length)],
                                amount: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 10 : null, // Сумма 10–110 или null
                                createdAt: new Date(),
                            },
                        })];
                case 37:
                    _d.sent();
                    _d.label = 38;
                case 38:
                    i++;
                    return [3 /*break*/, 36];
                case 39:
                    _c = 0, tables_2 = tables;
                    _d.label = 40;
                case 40:
                    if (!(_c < tables_2.length)) return [3 /*break*/, 44];
                    table = tables_2[_c];
                    return [4 /*yield*/, prisma.tableUser.findMany({ where: { tableId: table.id } })];
                case 41:
                    tableUsers = _d.sent();
                    if (!(tableUsers.length > 0)) return [3 /*break*/, 43];
                    winner = tableUsers[Math.floor(Math.random() * tableUsers.length)];
                    return [4 /*yield*/, prisma.tablePrize.create({
                            data: {
                                tableId: table.id,
                                userId: winner.userId,
                                position: 1,
                                amount: Math.floor(table.prizeFund * 0.7), // 70% призового фонда победителю
                                createdAt: new Date(),
                            },
                        })];
                case 42:
                    _d.sent();
                    _d.label = 43;
                case 43:
                    _c++;
                    return [3 /*break*/, 40];
                case 44:
                    console.log("\u2705 \u0421\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E:\n    - ".concat(TOTAL_USERS, " \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439\n    - ").concat(TOTAL_CLANS, " \u043A\u043B\u0430\u043D\u043E\u0432\n    - ").concat(TOTAL_TABLES, " \u0441\u0442\u043E\u043B\u043E\u0432\n    - ").concat(TOTAL_REFERRALS, " \u0440\u0435\u0444\u0435\u0440\u0430\u043B\u044C\u043D\u044B\u0445 \u0441\u0432\u044F\u0437\u0435\u0439\n    - ").concat(TOTAL_INVOICES, " \u0438\u043D\u0432\u043E\u0439\u0441\u043E\u0432\n    - ").concat(TOTAL_LEVEL_REWARDS, " \u043D\u0430\u0433\u0440\u0430\u0434 \u0437\u0430 \u0443\u0440\u043E\u0432\u043D\u0438"));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('Ошибка при сидировании:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
