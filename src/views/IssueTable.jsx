import React, { useState, useMemo, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { useRedmine } from './App';

const IssueTable = () => {
  const { filteredIssuesTable } = useRedmine();
  const [selectedRows, setSelectedRows] = useState([]);
  const [dialogIssue, setDialogIssue] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleRowSelection = useCallback(
    (selectionModel) => {
      const selected = selectionModel.map((id) => filteredIssuesTable[id - 1]);
      setSelectedRows(selected);
    },
    [filteredIssuesTable]
  );

  const columns = [
    { field: 'id', headerName: '番号', width: 80 },
    { field: 'issueId', headerName: '課題ID', width: 100, renderCell: (params) => params.value },
    { field: 'projectName', headerName: 'プロジェクト名', width: 150 },
    { field: 'statusName', headerName: 'ステータス', width: 120 },
    { field: 'dueDate', headerName: '希望納期', width: 120 },
    { field: 'answerDate', headerName: '回答納期', width: 120 },
    { field: 'subject', headerName: '件名', width: 300, renderCell: (params) => params.value },
    { field: 'ucdType', headerName: 'UCD側障害種別', width: 150 },
    { field: 'fjnType', headerName: 'FJN側障害種別', width: 150 },
    { field: 'pgid', headerName: '発生PGID', width: 120 },
    { field: 'author', headerName: '作成者', width: 120 },
    { field: 'assignedTo', headerName: '担当者', width: 120 },
    { field: 'fixPgid', headerName: '修正PGID', width: 120 },
    { field: 'partId', headerName: '部品ID', width: 120 },
  ];

  const source = useMemo(() => {
    if (!filteredIssuesTable || !Array.isArray(filteredIssuesTable)) {
      console.warn('Invalid rows data:', filteredIssuesTable);
      return [];
    }
    return filteredIssuesTable.map((issue, index) => ({
      id: index + 1,
      issueId: (
        <Link
          href={`${(issue.url || window.location.origin).replace(/\/$/, '')}/issues/${issue.id}`}
          target="_blank"
          rel="noopener"
        >
          {issue.id}
        </Link>
      ),
      projectName: issue.project?.name || 'Unknown',
      statusName: issue.status?.name || 'N/A',
      dueDate: issue.custom_fields?.find((field) => field.name === '希望納期')?.value || 'N/A',
      answerDate: issue.custom_fields?.find((field) => field.name === '回答納期')?.value || 'N/A',
      subject: (
        <span
          style={{ color: 'blue', cursor: 'pointer' }}
          onClick={() => {
            setDialogIssue(issue);
            setOpenDialog(true);
          }}
        >
          {issue.subject || 'N/A'}
        </span>
      ),
      ucdType: issue.custom_fields?.find((field) => field.name === 'UCD側障害種別')?.value || 'N/A',
      fjnType: issue.custom_fields?.find((field) => field.name === 'FJN側障害種別')?.value || 'N/A',
      pgid: issue.custom_fields?.find((field) => field.name === '発生PGID')?.value || 'N/A',
      author: issue.author?.name || 'Unknown',
      assignedTo: issue.assigned_to?.name || 'Unassigned',
      fixPgid: issue.custom_fields?.find((field) => field.name === '修正PGID')?.value || 'N/A',
      partId: issue.custom_fields?.find((field) => field.name === '部品ID')?.value || 'N/A',
    }));
  }, [filteredIssuesTable]);

  if (!source.length) {
    return (
      <Box p={2} sx={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2} sx={{ height: '500px' }}>
      <DataGrid
        rows={source}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
        onSelectionModelChange={handleRowSelection}
        checkboxSelection
      />
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết issue</DialogTitle>
        <DialogContent dividers>
          {dialogIssue && (
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableBody>
                {[
                  { key: 'id', label: '番号', value: dialogIssue.id },
                  { key: 'priority', label: '優先度', value: dialogIssue.priority?.name },
                  { key: 'status', label: 'ステータス', value: dialogIssue.status?.name },
                  { key: 'subject', label: '件名', value: dialogIssue.subject },
                  { key: 'project', label: 'プロジェクト名', value: dialogIssue.project?.name },
                  { key: 'author', label: '作成者', value: dialogIssue.author?.name },
                  { key: 'assigned_to', label: '担当者', value: dialogIssue.assigned_to?.name },
                  { key: 'description', label: '説明', value: dialogIssue.description },
                ].map(
                  (item) =>
                    item.value !== undefined &&
                    item.value !== null && (
                      <TableRow key={item.key}>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          {item.label}
                        </TableCell>
                        <TableCell>{item.value}</TableCell>
                      </TableRow>
                    )
                )}
                {(dialogIssue.custom_fields || [])
                  .filter((field) =>
                    [
                      '希望納期',
                      '回答納期',
                      'UCD側障害種別',
                      'FJN側障害種別',
                      '発生PGID',
                      '修正PGID',
                      '部品ID',
                    ].includes(field.name)
                  )
                  .map((field) => (
                    <TableRow key={field.name}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        {field.name}
                      </TableCell>
                      <TableCell>{field.value ?? ''}</TableCell>
                    </TableRow>
                  ))}
                {dialogIssue?.attachments?.length > 0 && (
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      ファイル添付
                    </TableCell>
                    <TableCell>
                      {dialogIssue.attachments.map((att) => (
                        <Box key={att.id}>
                          <Link
                            href={`${att.content_url}?key=${dialogIssue.project.apiKey}`}
                            target="_blank"
                            rel="noopener"
                            download
                          >
                            {att.filename}
                          </Link>
                        </Box>
                      ))}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IssueTable;