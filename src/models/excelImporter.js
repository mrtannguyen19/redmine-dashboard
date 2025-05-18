const XLSX = require('xlsx');

async function importExcelFile(filePath) {
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
    // Validate required headers
    const requiredHeaders = [
      'PGID', 'PG名称',
      '納品(1)', '工数(1)', '開始日(1)', '終了日(1)', '担当1', '開始日1', '終了日1', '進捗率1', '工数1', 'PageTK1', 'コメント',
      '工数(2)', '開始日(2)', '終了日(2)', '担当2', '開始日2', '終了日2', '進捗率2', '工数2', '不具合2', 'コメント2',
      '納品(3)', '工数(3)', '開始日(3)', '終了日(3)', '担当3', '開始日3', '終了日3', '進捗率3', '工数3', 'テスト3', '不具合3', 'PageTK3', 'コメント3',
      '工数(4)', '開始日(4)', '終了日(4)', '担当4', '開始日4', '終了日4', '進捗率4', '工数4', 'テスト4', '不具合4', 'コメント4'
    ];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers in range ${range}: ${missingHeaders.join(', ')}`);
    }

    // Map rows to the required structure
    return rows.map((row) => {
      const rowData = headers.reduce((obj, header, index) => {
        obj[header] = row[index];
        return obj;
      }, {});

      return {
        prgid: rowData['PGID'],
        prgname: rowData['PG名称'],
        frame: null,
        design: {
          delivery_date: rowData['納品(1)'],
          baseline_effort: rowData['工数(1)'],
          planned_start_date: rowData['開始日(1)'],
          planned_end_date: rowData['終了日(1)'],
          actual_start_date: rowData['開始日1'],
          actual_end_date: rowData['終了日1'],
          assignee: rowData['担当1'],
          progress: rowData['進捗率1'],
          actual_effort: rowData['工数1'],
          design_pages: rowData['PageTK1'],
          notes: rowData['コメント'],
        },
        review: {
          delivery_date: null,
          baseline_effort: rowData['工数(2)'],
          planned_start_date: rowData['開始日(2)'],
          planned_end_date: rowData['終了日(2)'],
          actual_start_date: rowData['開始日2'],
          actual_end_date: rowData['終了日2'],
          assignee: rowData['担当2'],
          progress: rowData['進捗率2'],
          actual_effort: rowData['工数2'],
          defects: rowData['不具合2'],
          notes: rowData['コメント2'],
        },
        coding: {
          delivery_date: rowData['納品(3)'],
          baseline_effort: rowData['工数(3)'],
          planned_start_date: rowData['開始日(3)'],
          planned_end_date: rowData['終了日(3)'],
          actual_start_date: rowData['開始日3'],
          actual_end_date: rowData['終了日3'],
          assignee: rowData['担当3'],
          progress: rowData['進捗率3'],
          actual_effort: rowData['工数3'],
          test_cases: rowData['テスト3'],
          defects: rowData['不具合3'],
          design_pages: rowData['PageTK3'],
          notes: rowData['コメント3'],
        },
        testing: {
          delivery_date: null,
          baseline_effort: rowData['工数(4)'],
          planned_start_date: rowData['開始日(4)'],
          planned_end_date: rowData['終了日(4)'],
          actual_start_date: rowData['開始日4'],
          actual_end_date: rowData['終了日4'],
          assignee: rowData['担当4'],
          progress: rowData['進捗率4'],
          actual_effort: rowData['工数4'],
          test_cases: rowData['テスト4'],
          defects: rowData['不具合4'],
          notes: rowData['コメント4'],
        },
      };
    });
  } catch (error) {
    console.error('Error importing Excel file:', error.message);
    throw error;
  }
}

module.exports = importExcelFile;