import { filterRows } from './apps/admin/common/store/useExcelStore';

const fs = require('fs');
const content = fs.readFileSync('./apps/admin/common/store/useExcelStore.ts', 'utf8');

// I will extract detectDataArea manually
