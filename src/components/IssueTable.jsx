// src/components/IssueTable.jsx
import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

const columns = [
  { field: 'id', headerName: '番号', width: 80 },
  { field: 'issueId', headerName: '課題ID', width: 100 },
  { field: 'project', headerName: 'プロジェクト名', width: 150 },
  { field: 'status', headerName: 'ステータス', width: 120 },
  { field: 'dueDate', headerName: '希望納期', width: 120 },
  { field: 'answerDate', headerName: '回答納期', width: 120 },
  { field: 'subject', headerName: '件名', width: 300 },
  { field: 'ucdType', headerName: 'UCD側障害種別', width: 150 },
  { field: 'fjnType', headerName: 'FJN側障害種別', width: 150 },
  { field: 'pgid', headerName: '発生PGID', width: 120 },
  { field: 'author', headerName: '作成者', width: 120 },
  { field: 'assignedTo', headerName: '担当者', width: 120 },
  { field: 'fixPgid', headerName: '修正PGID', width: 120 },
  { field: 'partId', headerName: '部品ID', width: 120 }
];

const IssueTable = ({ rows }) => {
  return (
    <Box p={2} height="500px">
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default IssueTable;