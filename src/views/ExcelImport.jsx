import React, { useState } from 'react';
import { importExcelFile } from '../models/excelImporter';

const ExcelImport = ({ onDataLoaded }) => {
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      try {
        const data = await importExcelFile(file);
        onDataLoaded(data); // callback to parent
      } catch (error) {
        console.error('Error importing Excel:', error);
      }
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      {fileName && <p>Đã chọn: {fileName}</p>}
    </div>
  );
};

export default ExcelImport;