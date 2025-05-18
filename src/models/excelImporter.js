const XLSX = require('xlsx');

async function importExcelFile(filePath) {
  function formatDate(value) {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'number') {
      const date = new Date(1900, 0, value); // Excel serial date starts at 1/1/1900
      return date.toISOString().split('T')[0];
    }
    return value;
  }

  try {
    const workbook = XLSX.readFile(filePath);

    // Use the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets['schedule'] || workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
    }

    // Try to find table named 'schedule' to determine range
    let range = null;
    const namedTable = workbook.Workbook?.Names?.find(n => n.Name === 'schedule');
    if (namedTable && namedTable.Ref) {
      range = namedTable.Ref;
    } else {
      // Read from row 5 onward
      const fullRange = XLSX.utils.decode_range(sheet['!ref']);
      fullRange.s.r = 4; // start from row index 4 (Excel row 5)
      range = fullRange;
    }

    // Convert the range to JSON
    const data = XLSX.utils.sheet_to_json(sheet, {
      range,
      header: 1,
      defval: '',
      blankrows: false
    });
    if (!data || data.length === 0) {
      throw new Error(`No data found in range ${typeof range === 'string' ? range : XLSX.utils.encode_range(range)}`);
    }

    // Extract headers and rows
    const headers = data[0];
    const rows = data.slice(1);

    // Map rows to the required structure
    return rows.map((row) => {
      const rowData = headers.reduce((obj, header, index) => {
        obj[header] = row[index];
        return obj;
      }, {});

      return {
        prgid: rowData['PGID'] || '',
        prgname: rowData['PG名称'] || '',
        frame: null,
        design: {
          deliveryDate: formatDate(rowData['納品(1)']) || '',
          baselineEffort: rowData['工数(1)'] || '',
          plannedStartDate: formatDate(rowData['開始日(1)']) || '',
          plannedEndDate: formatDate(rowData['終了日(1)']) || '',
          actualStartDate: formatDate(rowData['開始日1']) || '',
          actualEndDate: formatDate(rowData['終了日1']) || '',
          assignee: rowData['担当1'] || '',
          progress: rowData['進捗率1'] || '',
          actualEffort: rowData['工数1'] || '',
          designPages: rowData['PageTK1'] || '',
          notes: rowData['コメント'] || '',
        },
        review: {
          deliveryDate: null,
          baselineEffort: rowData['工数(2)'] || '',
          plannedStartDate: formatDate(rowData['開始日(2)']) || '',
          plannedEndDate: formatDate(rowData['終了日(2)']) || '',
          actualStartDate: formatDate(rowData['開始日2']) || '',
          actualEndDate: formatDate(rowData['終了日2']) || '',
          assignee: rowData['担当2'] || '',
          progress: rowData['進捗率2'] || '',
          actualEffort: rowData['工数2'] || '',
          defects: rowData['不具合2'] || '',
          notes: rowData['コメント2'] || '',
        },
        coding: {
          deliveryDate: formatDate(rowData['納品(3)']) || '',
          baselineEffort: rowData['工数(3)'] || '',
          plannedStartDate: formatDate(rowData['開始日(3)']) || '',
          plannedEndDate: formatDate(rowData['終了日(3)']) || '',
          actualStartDate: formatDate(rowData['開始日3']) || '',
          actualEndDate: formatDate(rowData['終了日3']) || '',
          assignee: rowData['担当3'] || '',
          progress: rowData['進捗率3'] || '',
          actualEffort: rowData['工数3'] || '',
          testCases: rowData['テスト3'] || '',
          defects: rowData['不具合3'] || '',
          designPages: rowData['PageTK3'] || '',
          notes: rowData['コメント3'] || '',
        },
        testing: {
          deliveryDate: null,
          baselineEffort: rowData['工数(4)'] || '',
          plannedStartDate: formatDate(rowData['開始日(4)']) || '',
          plannedEndDate: formatDate(rowData['終了日(4)']) || '',
          actualStartDate: formatDate(rowData['開始日4']) || '',
          actualEndDate: formatDate(rowData['終了日4']) || '',
          assignee: rowData['担当4'] || '',
          progress: rowData['進捗率4'] || '',
          actualEffort: rowData['工数4'] || '',
          testCases: rowData['テスト4'] || '',
          defects: rowData['不具合4'] || '',
          notes: rowData['コメント4'] || '',
        },
      };
    });
  } catch (error) {
    console.error('Error importing Excel file:', error.message);
    throw error;
  }
}

module.exports = importExcelFile;