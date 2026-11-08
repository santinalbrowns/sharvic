"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const members_1 = __importDefault(require("./routes/members"));
const loans_1 = __importDefault(require("./routes/loans"));
const savings_1 = __importDefault(require("./routes/savings"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const reports_1 = __importDefault(require("./routes/reports"));
const users_1 = __importDefault(require("./routes/users"));
const settings_1 = __importDefault(require("./routes/settings"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sharvic-api' });
});
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/members', members_1.default);
app.use('/api/loans', loans_1.default);
app.use('/api/savings', savings_1.default);
app.use('/api/expenses', expenses_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/settings', settings_1.default);
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
