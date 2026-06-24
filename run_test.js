"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const useExcelStore_1 = require("./apps/admin/common/store/useExcelStore");
const rawRows = [
    { "0": "문자", "1": "문자", "2": "문자", "3": "문자", "4": "", "5": "", "rowIndex": 0, "_originalRowIndex": 0 },
    { "0": "", "1": "", "2": "", "3": "문자", "4": "문자", "5": "문자", "rowIndex": 1, "_originalRowIndex": 1 },
    { "0": 123, "1": "문자", "2": 456, "3": 789, "4": 12, "5": 34, "rowIndex": 2, "_originalRowIndex": 2 },
    { "0": 123, "1": 456, "2": 789, "3": 12, "4": 34, "5": 56, "rowIndex": 3, "_originalRowIndex": 3 }
];
console.log("Detect result:", (0, useExcelStore_1.detectDataArea)(rawRows));
