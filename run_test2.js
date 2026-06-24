"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const useExcelStore_1 = require("./apps/admin/common/store/useExcelStore");
const rawRows = [
    { "0": "", "1": "", "2": "문자", "3": "문자", "4": "문자", "rowIndex": 0, "_originalRowIndex": 0 },
    { "0": "", "1": "", "2": "", "3": "", "4": "", "rowIndex": 1, "_originalRowIndex": 1 },
    { "0": "", "1": "", "2": "", "3": "", "4": "", "rowIndex": 2, "_originalRowIndex": 2 },
    { "0": "문자", "1": "문자", "2": "문자", "3": "문자", "4": "문자", "rowIndex": 3, "_originalRowIndex": 3 },
    { "0": "", "1": "문자", "2": "문자", "3": "문자", "4": "문자", "rowIndex": 4, "_originalRowIndex": 4 },
    { "0": 123, "1": "문자", "2": 456, "3": 789, "4": 123, "rowIndex": 5, "_originalRowIndex": 5 },
    { "0": "", "1": 123, "2": 456, "3": 789, "4": 123, "rowIndex": 6, "_originalRowIndex": 6 }
];
console.log("Detect result:", (0, useExcelStore_1.detectDataArea)(rawRows));
